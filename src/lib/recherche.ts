// Le grand moteur de recherche : tous les animaux, les chiens et les chats.
// Il cherche pendant qu'on écrit, sans se soucier des accents, et il pardonne les fautes de frappe.
import { ESPECES, FAMILLES, GROUPES, ORDRES, plier, synonymeDe, type Espece } from "@/data/catalogue";
import { connu } from "@/lib/connu";
import { CHATS, CHIENS, nomCourt, type Race } from "@/pages/compagnons";
import { aUnePhoto } from "@/components/portrait";
import pays from "@/data/pays.json";
import oiseauxBruts from "@/data/oiseaux.json";

export type Sorte = "espece" | "oiseau" | "chien" | "chat" | "famille" | "ordre";
export type Resultat = {
  sorte: Sorte;
  id: string;
  nom: string;
  sous: string;
  vers: string;
  photo?: string; // chemin d'une photo (races) ; pour les espèces, on utilise le portrait
  pays: string[];
  groupe?: string; // grand groupe facile (carnivores, rongeurs…)
  regime?: string;
  menace?: boolean;
  connu: number; // pour ranger : les animaux bien documentés d'abord
  cle: string; // le nom, plié (sans accents ni majuscules)
  mots: string[];
  sons: string[]; // les mots « comme ils se prononcent » (k → c, y → i, ph → f…)
  autres: string; // nom latin et autres noms, moins importants
  latin?: string; // nom scientifique (pour les synonymes)
  alias: string[]; // les autres vrais noms (ancien nom, nom de région), pliés
};

export const PAYS = pays as Record<string, { n: string; c: string }>;
export const CONTINENTS = ["Afrique", "Europe", "Asie", "Amérique du Nord", "Amérique du Sud", "Océanie"] as const;

const GROUPE_DE_ORDRE = new Map<string, string>();
for (const g of GROUPES) for (const o of g.ordres) GROUPE_DE_ORDRE.set(o, g.id);

const MENACES = new Set(["Vulnérable", "En danger", "En danger critique"]);

/** Écrire « comme on l'entend » : un enfant écrit souvent kaniche, lyon, érisson… */
export function son(m: string) {
  return m.replace(/ph/g, "f").replace(/[kq]/g, "c").replace(/y/g, "i").replace(/h/g, "").replace(/(.)\1+/g, "$1").replace(/e?au/g, "o");
}

function entree(r: Omit<Resultat, "cle" | "mots" | "sons" | "autres" | "alias">, autres = "", alias: string[] = []): Resultat {
  const cle = plier(r.nom);
  const mots = cle.split(/[^a-z0-9]+/).filter(Boolean);
  return { ...r, cle, mots, sons: mots.map(son), autres: plier(autres), alias: alias.map(plier).filter(Boolean) };
}

type OiseauBrut = { id: string; latin: string; nom: string; photos: { src: string }[]; aussi?: string[]; ancienNom?: string; anciensLatins?: string[] };
const OISEAUX = (oiseauxBruts as { oiseaux: OiseauBrut[] }).oiseaux;

function depuisOiseau(o: OiseauBrut): Resultat {
  return entree(
    { sorte: "oiseau", id: o.id, nom: o.nom, sous: `Oiseau · ${o.latin}`, vers: `/oiseaux/${o.id}`, photo: o.photos[0]?.src, pays: [], latin: o.latin, connu: 3 + (o.photos.length ? 1 : 0) },
    `${o.latin} ${(o.anciensLatins ?? []).join(" ")}`,
    [...(o.aussi ?? []), ...(o.ancienNom ? [o.ancienNom] : [])],
  );
}


function depuisEspece(e: Espece): Resultat {
  return entree(
    {
      sorte: "espece",
      id: e.id,
      nom: e.nom,
      sous: (FAMILLES[e.famille]?.nom ?? "") + (e.langue === "en" ? " · nom anglais (français en cours)" : e.langue === "trad" ? " · nom traduit" : ""),
      vers: `/mammiferes/e-${e.id}`,
      pays: e.pays ?? [],
      latin: e.latin,
      groupe: GROUPE_DE_ORDRE.get(e.ordre),
      regime: e.regime,
      menace: MENACES.has(e.statut ?? ""),
      // Bien documenté (nom français, photo) et connu (visites Wikipédia) : les animaux que Leonie reconnaît d'abord.
      connu: (e.langue === "fr" ? 2 : 0) + (aUnePhoto(e.id) ? 1 : 0) + Math.min(6, Math.log10(1 + connu(e.id))),
    },
    `${e.latin} ${e.nomAnglais ?? ""}`,
  );
}

function depuisRace(r: Race & { pays?: string[] }, sorte: "chien" | "chat"): Resultat {
  return entree(
    {
      sorte,
      id: r.id,
      nom: nomCourt(r.nom),
      sous: `${sorte === "chien" ? "Race de chien" : "Race de chat"}${r.origine ? ` · ${r.origine}` : ""}`,
      vers: `/compagnons/${sorte}/${r.id}`,
      photo: r.photos[0]?.src,
      pays: r.pays ?? [],
      groupe: "carnivores",
      connu: 2 + (r.photos.length ? 1 : 0),
    },
    `${r.nom} ${sorte}`,
  );
}

export const TOUT: Resultat[] = [
  ...ORDRES.map((o) => entree({ sorte: "ordre", id: o.id, nom: o.nom, sous: o.phrase, vers: `/mammiferes/o-${o.id}`, pays: [], connu: 3 })),
  ...Object.entries(FAMILLES).map(([code, f]) =>
    entree({ sorte: "famille", id: code, nom: f.nom, sous: `Famille · ${f.n} espèce${f.n > 1 ? "s" : ""}`, vers: `/mammiferes/f-${code}`, pays: [], groupe: GROUPE_DE_ORDRE.get(f.ordre), connu: 3 }, code),
  ),
  ...ESPECES.map(depuisEspece),
  ...OISEAUX.map(depuisOiseau),
  ...CHIENS.map((r) => depuisRace(r, "chien")),
  ...CHATS.map((r) => depuisRace(r, "chat")),
];

/** Distance d'édition (nombre de lettres à changer), arrêtée tôt si c'est trop loin. */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let avant = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const ligne = [i];
    let mini = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(avant[j] + 1, ligne[j - 1] + 1, avant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      ligne.push(v);
      mini = Math.min(mini, v);
    }
    if (mini > max) return max + 1;
    avant = ligne;
  }
  return avant[b.length];
}

/** Un mot écrit ressemble-t-il à un mot de l'animal ? 0 = oui, 0,5 = il se prononce pareil, 1 ou 2 = petite faute. */
function proche(m: string, w: string, ws: string) {
  if (w.startsWith(m)) return 0;
  const ms = son(m);
  if (ms.length >= 2 && ws.startsWith(ms)) return 0.5;
  if (m.length < 4 || ws[0] !== ms[0]) return 9; // le premier son doit être le bon
  const tolere = m.length >= 6 ? 2 : 1;
  return Math.min(distance(ms, ws.slice(0, ms.length), tolere), distance(ms, ws, tolere), distance(ms, ws.slice(0, ms.length + 1), tolere));
}

/** Note d'un résultat pour ce qu'on a écrit (0 = pas du tout). L'ordre : nom exact, début du nom, mot entier, mot commencé, contenu. */
function noteBase(r: Resultat, q: string, mq: string[]) {
  if (r.cle === q) return 100;
  const syn = r.latin && (r.sorte === "espece" || r.sorte === "oiseau") ? synonymeDe(r.latin, q) : 0;
  if (syn === 2) return 95;
  if (r.alias.includes(q)) return 92;
  if (r.cle.startsWith(q)) return 90;
  if (mq.length && mq.every((m) => r.mots.includes(m))) return 80;
  if (r.alias.some((a) => a.startsWith(q))) return 78;
  if (r.mots.some((m) => m.startsWith(q))) return 75;
  if (r.cle.includes(q)) return 70;
  if (syn === 1) return 68;
  // Chaque mot écrit se retrouve (même mal écrit), dans n'importe quel ordre.
  let total = 0;
  let ok = true;
  for (const m of mq) {
    let mieux = 9;
    for (let i = 0; i < r.mots.length && mieux > 0; i++) mieux = Math.min(mieux, proche(m, r.mots[i], r.sons[i]));
    if (mieux > (m.length >= 6 ? 2 : 1)) {
      ok = false;
      break;
    }
    total += mieux;
  }
  if (ok && mq.length) return total === 0 ? 65 : total < 1 ? 62 : 60 - total * 10;
  // Le nom latin ou les autres noms comptent, mais moins.
  if (r.autres && r.autres.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) return 40;
  return 0;
}

function note(r: Resultat, q: string, mq: string[]) {
  let n = noteBase(r, q, mq);
  // « chat persan », « race de chien beagle » : le mot « chat » ou « chien » dit juste de quelle sorte de race on parle.
  if ((r.sorte === "chien" || r.sorte === "chat") && mq.length > 1) {
    const reste = mq.filter((m) => m !== r.sorte && m !== `${r.sorte}s` && m !== "race" && m !== "de" && m !== "du");
    if (reste.length && reste.length < mq.length) n = Math.max(n, noteBase(r, reste.join(" "), reste));
  }
  return n;
}

export type Filtres = { sorte?: "sauvages" | "oiseaux" | "chiens" | "chats" | "menaces"; groupe?: string; regime?: string; pays?: string; continent?: string };

export function filtrer(r: Resultat, f: Filtres) {
  if (f.sorte === "sauvages" && r.sorte !== "espece") return false;
  if (f.sorte === "oiseaux" && r.sorte !== "oiseau") return false;
  if (f.sorte === "chiens" && r.sorte !== "chien") return false;
  if (f.sorte === "chats" && r.sorte !== "chat") return false;
  if (f.sorte === "menaces" && !r.menace) return false;
  if (f.groupe && r.groupe !== f.groupe) return false;
  if (f.regime && r.regime !== f.regime) return false;
  if (f.pays && !r.pays.includes(f.pays)) return false;
  if (f.continent && !r.pays.some((p) => PAYS[p]?.c === f.continent)) return false;
  if ((f.pays || f.continent || f.regime || f.sorte === "menaces") && (r.sorte === "famille" || r.sorte === "ordre")) return false;
  return true;
}

export function chercherTout(texte: string, f: Filtres = {}) {
  const q = plier(texte).replace(/\s+/g, " ");
  const mq = q.split(/[^a-z0-9]+/).filter(Boolean);
  const liste: { r: Resultat; n: number }[] = [];
  for (const r of TOUT) {
    if (!filtrer(r, f)) continue;
    const n = q ? note(r, q, mq) : 1;
    if (n > 0) liste.push({ r, n });
  }
  // S'il y a de vraies réponses (nom exact, début, mot entier…), on n'affiche ni les « avec une faute » ni les noms trop éloignés.
  const meilleure = Math.max(0, ...liste.map((x) => x.n));
  const seuil = !q ? 0 : meilleure >= 65 ? 65 : meilleure >= 45 ? meilleure - 3 : 0;
  const garde = liste.filter((x) => x.n >= seuil);
  // D'abord la qualité de la réponse, puis les animaux les plus connus (Léonie reconnaît d'abord ceux-là).
  garde.sort((a, b) => b.n - a.n || b.r.connu - a.r.connu || a.r.cle.length - b.r.cle.length || a.r.nom.localeCompare(b.r.nom, "fr"));
  return garde.map((x) => x.r);
}

export function aDesFiltres(f: Filtres) {
  return Object.values(f).some(Boolean);
}

// Le grand moteur de recherche : tous les animaux, les chiens et les chats.
// Il cherche pendant qu'on écrit, sans se soucier des accents, et il pardonne les fautes de frappe.
import { ESPECES, FAMILLES, GROUPES, ORDRES, plier, type Espece } from "@/data/catalogue";
import { CHATS, CHIENS, nomCourt, type Race } from "@/pages/compagnons";
import { aUnePhoto } from "@/components/portrait";
import pays from "@/data/pays.json";

export type Sorte = "espece" | "chien" | "chat" | "famille" | "ordre";
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

function entree(r: Omit<Resultat, "cle" | "mots" | "sons" | "autres">, autres = ""): Resultat {
  const cle = plier(r.nom);
  const mots = cle.split(/[^a-z0-9]+/).filter(Boolean);
  return { ...r, cle, mots, sons: mots.map(son), autres: plier(autres) };
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
      groupe: GROUPE_DE_ORDRE.get(e.ordre),
      regime: e.regime,
      menace: MENACES.has(e.statut ?? ""),
      connu: (e.langue === "fr" ? 2 : 0) + (aUnePhoto(e.id) ? 1 : 0),
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
  if (m.length < 3 || ws[0] !== ms[0]) return 9; // le premier son doit être le bon
  const tolere = m.length >= 6 ? 2 : 1;
  return Math.min(distance(ms, ws.slice(0, ms.length), tolere), distance(ms, ws, tolere), distance(ms, ws.slice(0, ms.length + 1), tolere));
}

/** Note d'un résultat pour ce qu'on a écrit (0 = pas du tout). */
function note(r: Resultat, q: string, mq: string[]) {
  if (r.cle.startsWith(q)) return 100;
  if (r.mots.some((m) => m.startsWith(q))) return 85;
  if (r.cle.includes(q)) return 70;
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
  if (ok && mq.length) return total === 0 ? 65 : 60 - total * 10;
  // Le nom latin ou les autres noms comptent, mais moins.
  if (r.autres && r.autres.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) return 40;
  return 0;
}

export type Filtres = { sorte?: "sauvages" | "chiens" | "chats" | "menaces"; groupe?: string; regime?: string; pays?: string; continent?: string };

export function filtrer(r: Resultat, f: Filtres) {
  if (f.sorte === "sauvages" && r.sorte !== "espece") return false;
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
  const q = plier(texte);
  const mq = q.split(/[^a-z0-9]+/).filter(Boolean);
  const liste: { r: Resultat; n: number }[] = [];
  for (const r of TOUT) {
    if (!filtrer(r, f)) continue;
    const n = q ? note(r, q, mq) : 1;
    if (n > 0) liste.push({ r, n: n + (n >= 65 ? r.connu * 3 : r.connu) });
  }
  // S'il y a assez de bonnes réponses, on n'affiche pas celles « avec une faute ».
  const bonnes = liste.filter((x) => x.n >= 65).length;
  const meilleure = Math.max(0, ...liste.map((x) => x.n));
  const garde = bonnes >= 6 ? liste.filter((x) => x.n >= 65) : q && meilleure >= 55 ? liste.filter((x) => x.n >= meilleure - 12) : liste;
  garde.sort((a, b) => b.n - a.n || a.r.cle.length - b.r.cle.length || a.r.nom.localeCompare(b.r.nom, "fr"));
  return garde.map((x) => x.r);
}

export function aDesFiltres(f: Filtres) {
  return Object.values(f).some(Boolean);
}

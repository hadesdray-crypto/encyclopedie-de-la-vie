// Ce qui sert à tous les jeux à plusieurs : les joueurs, les équipes, les paquets de cartes.
import { ESPECES, PAR_ID, type Espece } from "@/data/catalogue";
import { aUnePhoto } from "@/components/portrait";
import { lireVues } from "@/lib/carnet";
import { grammesDe } from "@/lib/poids";
import { CHATS, CHIENS, nomCourt } from "@/pages/compagnons";
import { PAYS } from "@/lib/recherche";

export type Joueur = { nom: string; couleur: string; equipe: 0 | 1; plume?: boolean };
export const COULEURS = ["#c2457a", "#2f5fa8", "#3f7f2f", "#d6801c"];
export const NOMS_EQUIPES = ["Lune", "Soleil"];
const CLE = "leonie-joueurs";

export function lireJoueurs(): Joueur[] {
  try {
    const j = JSON.parse(localStorage.getItem(CLE) || "null");
    if (Array.isArray(j) && j.length) return j;
  } catch {
    /* rien */
  }
  return [
    { nom: "Leonie", couleur: COULEURS[0], equipe: 0 },
    { nom: "Joueur 2", couleur: COULEURS[1], equipe: 1 },
  ];
}
export function garderJoueurs(j: Joueur[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify(j));
  } catch {
    /* rien */
  }
}

export function melanger<T>(l: T[]) {
  const a = [...l];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- les paquets du mémory

export type CarteImage = { id: string; nom: string; photo?: string; espece?: string; vers: string };

const AVEC_PHOTO = ESPECES.filter((e) => aUnePhoto(e.id) && e.langue === "fr" && !e.disparue);
const deEspece = (e: Espece): CarteImage => ({ id: e.id, nom: e.nom, espece: e.id, vers: `/mammiferes/e-${e.id}` });

export const PAQUETS_MEMORY: { id: string; nom: string; cartes: () => CarteImage[] }[] = [
  { id: "collection", nom: "Ma collection", cartes: () => lireVues().map((id) => PAR_ID.get(id)).filter((e): e is Espece => !!e && aUnePhoto(e.id)).map(deEspece) },
  { id: "tous", nom: "Tous les mammifères", cartes: () => AVEC_PHOTO.map(deEspece) },
  { id: "felins", nom: "Les félins", cartes: () => AVEC_PHOTO.filter((e) => e.famille === "Felidae").map(deEspece) },
  { id: "canides", nom: "Loups et renards", cartes: () => AVEC_PHOTO.filter((e) => e.famille === "Canidae").map(deEspece) },
  { id: "singes", nom: "Les singes", cartes: () => AVEC_PHOTO.filter((e) => e.ordre === "Primates").map(deEspece) },
  { id: "ours", nom: "Ours et cousins", cartes: () => AVEC_PHOTO.filter((e) => ["Ursidae", "Procyonidae", "Ailuridae"].includes(e.famille)).map(deEspece) },
  { id: "afrique", nom: "Animaux d'Afrique", cartes: () => AVEC_PHOTO.filter((e) => e.pays?.some((p) => PAYS[p]?.c === "Afrique")).map(deEspece) },
  { id: "chiens", nom: "Les chiens", cartes: () => CHIENS.filter((r) => r.photos.length).map((r) => ({ id: r.id, nom: nomCourt(r.nom), photo: r.photos[0].src, vers: `/compagnons/chien/${r.id}` })) },
  { id: "chats", nom: "Les chats", cartes: () => CHATS.filter((r) => r.photos.length).map((r) => ({ id: r.id, nom: nomCourt(r.nom), photo: r.photos[0].src, vers: `/compagnons/chat/${r.id}` })) },
];

// ---------------------------------------------------------------- les cartes de la bataille

export type Carac = { id: string; nom: string; valeur: number; texte: string };
export type CarteBataille = { id: string; nom: string; espece: string; caracs: Carac[] };
export const CARACS = [
  { id: "poids", nom: "Poids" },
  { id: "vie", nom: "Longévité record" },
  { id: "portee", nom: "Petits par portée" },
  { id: "gestation", nom: "Gestation" },
  { id: "pays", nom: "Pays où il vit" },
] as const;

const nombre = (t: string) => Number(t.replace(",", "."));

function annees(t?: string) {
  const m = t?.match(/([\d]+(?:,\d+)?)\s*(ans?|mois)/);
  if (!m) return null;
  return m[2].startsWith("mois") ? nombre(m[1]) / 12 : nombre(m[1]);
}
function jours(t?: string) {
  if (!t) return null;
  const j = t.match(/([\d]+(?:,\d+)?)\s*jours/);
  if (j) return nombre(j[1]);
  const m = t.match(/([\d]+(?:,\d+)?)\s*mois/);
  return m ? Math.round(nombre(m[1]) * 30.4) : null;
}
function petits(t?: string) {
  const m = t?.match(/([\d]+(?:,\d+)?)/);
  return m ? nombre(m[1]) : null;
}
const virgule = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
function poidsTexte(g: number) {
  return g >= 1000 ? `${virgule(g >= 100000 ? Math.round(g / 1000) : g / 1000)} kg` : `${Math.round(g)} g`;
}

/** Une carte de bataille, seulement si ses cinq chiffres sont connus (on n'invente rien). */
function carteDe(e: Espece): CarteBataille | null {
  const g = grammesDe(e.masse);
  const a = annees(e.longevite);
  const p = petits(e.portee);
  const j = jours(e.gestation);
  const n = e.pays?.length ?? 0;
  if (g === null || a === null || p === null || j === null || !n) return null;
  return {
    id: e.id,
    nom: e.nom,
    espece: e.id,
    caracs: [
      { id: "poids", nom: "Poids", valeur: g, texte: poidsTexte(g) },
      { id: "vie", nom: "Longévité record", valeur: a, texte: `${virgule(a)} ans` },
      { id: "portee", nom: "Petits par portée", valeur: p, texte: virgule(p) },
      { id: "gestation", nom: "Gestation", valeur: j, texte: `${Math.round(j)} jours` },
      { id: "pays", nom: "Pays où il vit", valeur: n, texte: String(n) },
    ],
  };
}

export const CARTES_BATAILLE: CarteBataille[] = ESPECES.filter((e) => e.langue === "fr" && aUnePhoto(e.id) && !e.disparue)
  .map(carteDe)
  .filter((c): c is CarteBataille => !!c);

export function paquetBataille(source: "collection" | "tous") {
  if (source === "collection") {
    const vus = new Set(lireVues());
    return CARTES_BATAILLE.filter((c) => vus.has(c.id));
  }
  return CARTES_BATAILLE;
}

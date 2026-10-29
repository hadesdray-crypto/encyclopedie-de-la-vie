// L'histoire de Plume : un ami arrive, ils s'aiment, un œuf, un bébé… et parfois un braconnier à faire tomber.
// Elle avance avec les jours où Leonie ouvre l'application (pas avec le calendrier : si elle ne vient pas
// pendant une semaine, elle ne rate rien). Tout reste sur l'appareil, sans Internet.
import { useEffect, useState } from "react";

const CLE = "leonie-histoire";

export type Scene = "ami" | "calins" | "ventre" | "oeuf" | "eclosion";
export type EtatHistoire = {
  /** Les jours d'ouverture (AAAA-MM-JJ), plus les jours « avancés » par un parent. */
  jours: string[];
  nomAmi?: string;
  nomBebe?: string;
  /** Les jours où Leonie a réchauffé l'œuf (une fois par jour). */
  couvages: string[];
  /** Le jour (numéro d'ouverture) où le bébé est né. */
  naissance?: number;
  /** Les scènes déjà montrées. */
  vues: Scene[];
  braconnierJour?: string;
  renvoyes: number;
  /** Le braconnier peut venir (un parent peut l'éteindre). */
  braconnier: boolean;
  journal: { jour: number; texte: string }[];
};

const VIDE: EtatHistoire = { jours: [], couvages: [], vues: [], renvoyes: 0, braconnier: true, journal: [] };
export const COUVAGES_POUR_ECLORE = 5;
export const NOMS_AMI = ["Gaspard", "Pistache", "Merlin"];
export const NOMS_BEBE = ["Noisette", "Plumette", "Caramel"];

/** Les vraies informations sur les chouettes, une par jour de couvage. */
export const SAVOIRS_OEUF = [
  "Couver, c'est garder l'œuf au chaud avec son corps. Grâce à la chaleur, le poussin grandit dans l'œuf.",
  "Chez les chouettes, c'est surtout la maman qui couve. Pendant ce temps, le papa chasse et lui apporte à manger.",
  "Dans l'œuf, le poussin se nourrit du jaune : c'est sa réserve de nourriture.",
  "Dans la vraie vie, un œuf de chouette effraie met environ un mois à éclore. L'œuf de Plume, lui, est un peu magique : il va plus vite !",
  "Pour sortir, le poussin casse la coquille avec une petite pointe sur son bec, la « dent de l'œuf ». Elle tombe quelques jours plus tard.",
];

let etat: EtatHistoire = lire();
const abonnes = new Set<(e: EtatHistoire) => void>();

function lire(): EtatHistoire {
  try {
    return { ...VIDE, ...(JSON.parse(localStorage.getItem(CLE) ?? "{}") as Partial<EtatHistoire>) };
  } catch {
    return { ...VIDE };
  }
}
function publier(e: Partial<EtatHistoire>) {
  etat = { ...etat, ...e };
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* rien */
  }
  abonnes.forEach((f) => f(etat));
}
export function useHistoire() {
  const [e, setE] = useState(etat);
  useEffect(() => {
    abonnes.add(setE);
    setE(etat);
    return () => void abonnes.delete(setE);
  }, []);
  return e;
}
export const histoire = () => etat;

const aujourdhui = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** Le jour en cours : le dernier jour noté (le vrai jour, ou un jour avancé par un parent). */
export const jourActuel = (e = etat) => e.jours[e.jours.length - 1] ?? aujourdhui();
export const numeroJour = (e = etat) => e.jours.length;

/** À l'ouverture de l'application : on note le jour. */
export function noterOuverture() {
  const j = aujourdhui();
  if (!etat.jours.includes(j)) publier({ jours: [...etat.jours, j].slice(-400) });
}
/** Coin des parents : faire avancer l'histoire d'un jour (pour la tester, ou si Leonie est impatiente). */
export function avancerUnJour() {
  publier({ jours: [...etat.jours, `avance-${Date.now()}`] });
}
export function recommencerHistoire() {
  publier({ ...VIDE, jours: [aujourdhui()], braconnier: etat.braconnier });
}
export function permettreBraconnier(oui: boolean) {
  publier({ braconnier: oui });
}

function noter(texte: string) {
  publier({ journal: [...etat.journal, { jour: numeroJour(), texte }].slice(-60) });
}

// ---- Où en est l'histoire ----
export const amiPresent = (e = etat) => !!e.nomAmi;
export const oeufPresent = (e = etat) => e.vues.includes("oeuf") && e.naissance === undefined;
export const bebePresent = (e = etat) => e.naissance !== undefined;
export const ageBebe = (e = etat) => (e.naissance === undefined ? 0 : numeroJour(e) - e.naissance);

/** La prochaine scène à montrer, s'il y en a une. */
export function sceneEnAttente(e = etat): Scene | null {
  const n = numeroJour(e);
  const vue = (s: Scene) => e.vues.includes(s);
  if (!vue("ami")) return n >= 2 ? "ami" : null;
  if (!e.nomAmi) return "ami";
  const jourAmi = e.journal.find((l) => l.texte.startsWith("Arrivée"))?.jour ?? 2;
  if (!vue("calins")) return n >= jourAmi + 2 ? "calins" : null;
  if (!vue("ventre")) return n >= jourAmi + 3 ? "ventre" : null;
  if (!vue("oeuf")) return n >= jourAmi + 4 ? "oeuf" : null;
  if (!vue("eclosion")) return e.couvages.length >= COUVAGES_POUR_ECLORE ? "eclosion" : null;
  if (!e.nomBebe) return "eclosion";
  return null;
}

export function sceneVue(s: Scene) {
  if (etat.vues.includes(s)) return;
  publier({ vues: [...etat.vues, s] });
  if (s === "calins") noter("Plume et son amoureux se sont fait plein de câlins.");
  if (s === "ventre") noter("Plume avait un peu mal au ventre.");
  if (s === "oeuf") noter("Plume a pondu un œuf !");
}
export function nommerAmi(nom: string) {
  publier({ nomAmi: nom });
  noter(`Arrivée de ${nom}, un petit hibou timide.`);
}
export function nommerBebe(nom: string) {
  publier({ nomBebe: nom, naissance: etat.naissance ?? numeroJour() });
  noter(`Naissance de ${nom} ! Un poussin tout doux.`);
}

/** Réchauffer l'œuf : une fois par jour. Rend le savoir du jour, ou null si c'est déjà fait aujourd'hui. */
export function couver(): string | null {
  const j = jourActuel();
  if (etat.couvages.includes(j) || !oeufPresent()) return null;
  const couvages = [...etat.couvages, j];
  publier({ couvages });
  noter(`Leonie a réchauffé l'œuf (${couvages.length} sur ${COUVAGES_POUR_ECLORE}).`);
  return SAVOIRS_OEUF[(couvages.length - 1) % SAVOIRS_OEUF.length];
}
export const dejaCouveAujourdhui = (e = etat) => e.couvages.includes(jourActuel(e));

// ---- Le braconnier ----
/** Peut-il venir maintenant ? Pas le premier jour, une fois par jour au plus, et pas pendant une scène. */
export function braconnierPossible() {
  return etat.braconnier && numeroJour() >= 2 && etat.braconnierJour !== jourActuel() && !sceneEnAttente();
}
export function braconnierEstVenu() {
  publier({ braconnierJour: jourActuel() });
}
export function braconnierRenvoye() {
  publier({ renvoyes: etat.renvoyes + 1 });
  noter("Leonie a fait tomber le braconnier. Il est reparti, dégoûté !");
}

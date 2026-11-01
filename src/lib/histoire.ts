// L'histoire de Plume : des prétendants viennent se présenter (on choisit si l'un d'eux peut rester), ils s'aiment,
// un œuf, un bébé… et parfois un braconnier à faire tomber.
// Elle avance avec les jours où l'application est ouverte (pas avec le calendrier : si on ne vient pas
// pendant une semaine, on ne rate rien). Tout reste sur l'appareil, sans Internet.
import { useEffect, useState } from "react";
import { ORDRE_PRETENDANTS, PRETENDANTS, pretendant, type Pretendant } from "@/lib/pretendants";

const CLE = "leonie-histoire";

export type Scene = "ami" | "calins" | "ventre" | "oeuf" | "eclosion";
export type EtatHistoire = {
  /** Les jours d'ouverture (AAAA-MM-JJ), plus les jours « avancés » par un parent. */
  jours: string[];
  nomAmi?: string;
  nomBebe?: string;
  /** Les jours où l'œuf a été réchauffé (une fois par jour). */
  couvages: string[];
  /** Le prétendant qui est resté (voir pretendants.tsx). Les anciennes parties n'ont que « nomAmi ». */
  amiId?: string;
  /** L'ordre des prétendants : le premier frappe au nid ; s'il est refusé, il passe à la fin (il revient après les cinq autres). */
  file: string[];
  /** Le numéro de jour à partir duquel le prochain prétendant se présente (le lendemain d'un refus). */
  prochainJour?: number;
  /** Combien de fois un prétendant a été refusé. */
  refus: number;
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

const VIDE: EtatHistoire = { jours: [], couvages: [], vues: [], renvoyes: 0, braconnier: true, journal: [], file: [...ORDRE_PRETENDANTS], refus: 0 };
export const COUVAGES_POUR_ECLORE = 5;
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
/** Coin des parents : faire avancer l'histoire d'un jour (pour la tester, ou si on est impatient). */
export function avancerUnJour() {
  publier({ jours: [...etat.jours, `avance-${Date.now()}`] });
}
export function recommencerHistoire() {
  publier({ ...VIDE, file: [...ORDRE_PRETENDANTS], jours: [aujourdhui()], braconnier: etat.braconnier });
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
  if (!vue("ami")) return n >= (e.prochainJour ?? 2) ? "ami" : null;
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
/** Le prétendant qui frappe au nid en ce moment. */
export const pretendantEnCours = (e = etat): Pretendant => pretendant(e.file[0]) ?? PRETENDANTS[0];
/** Le prétendant qui est resté (ou, pour les anciennes parties, pas de dessin à lui : null). */
export const pretendantAmi = (e = etat): Pretendant | null => pretendant(e.amiId) ?? null;

/** Plume garde le prétendant : il reste pour toujours, c'est son compagnon. */
export function accepterPretendant() {
  const p = pretendantEnCours();
  publier({ nomAmi: p.nom, amiId: p.id });
  noter(`Arrivée de ${p.journal}.`);
}
/** Plume dit non : il s'en va, triste, et revient après les cinq autres. */
export function refuserPretendant() {
  const p = pretendantEnCours();
  const [premier, ...reste] = etat.file.length ? etat.file : [...ORDRE_PRETENDANTS];
  publier({ file: [...reste, premier], prochainJour: numeroJour() + 1, refus: etat.refus + 1 });
  noter(`${p.nom} est reparti, un peu triste.`);
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
  noter(`L'œuf a été réchauffé (${couvages.length} sur ${COUVAGES_POUR_ECLORE}).`);
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
export function braconnierRenvoye(texte = "Le braconnier est tombé. Il est reparti, dégoûté !") {
  publier({ renvoyes: etat.renvoyes + 1 });
  noter(texte);
}

// ---- Le curseur du coin des parents : aller directement à une étape de l'histoire (pour la tester) ----
export const ETAPES_HISTOIRE = [
  "Premier jour",
  "Un prétendant frappe au nid",
  "Le prétendant est resté",
  "Les câlins",
  "Plume a mal au ventre",
  "L'œuf va être pondu",
  "L'œuf est là (0 sur 5)",
  "Œuf réchauffé 1 fois sur 5",
  "Œuf réchauffé 2 fois sur 5",
  "Œuf réchauffé 3 fois sur 5",
  "Œuf réchauffé 4 fois sur 5",
  "Le bébé va naître",
  "Le bébé vient de naître",
  "Le bébé a 3 jours",
  "Le bébé a 6 jours",
];

/** À peu près à quelle étape on en est (pour placer le curseur). */
export function etapeActuelle(e = etat): number {
  const n = numeroJour(e);
  if (e.naissance !== undefined) return ageBebe(e) >= 6 ? 14 : ageBebe(e) >= 3 ? 13 : 12;
  if (!e.vues.includes("ami")) return n >= (e.prochainJour ?? 2) ? 1 : 0;
  const jourAmi = e.journal.find((l) => l.texte.startsWith("Arrivée"))?.jour ?? 2;
  if (!e.vues.includes("calins")) return n >= jourAmi + 2 ? 3 : 2;
  if (!e.vues.includes("ventre")) return 4;
  if (!e.vues.includes("oeuf")) return 5;
  return e.couvages.length >= COUVAGES_POUR_ECLORE ? 11 : 6 + Math.min(e.couvages.length, 4);
}

/** Remplace la progression par celle de l'étape choisie (avant ou arrière). Le dernier jour est aujourd'hui : rien ne bouge tout seul à l'ouverture. */
export function allerAEtape(k: number) {
  const p = pretendantEnCours();
  const nJours = [1, 2, 2, 4, 5, 6, 6, 7, 8, 9, 10, 11, 11, 14, 17][k] ?? 1;
  const jours = Array.from({ length: nJours }, (_, i) => (i === nJours - 1 ? aujourdhui() : `test-${i + 1}`));
  const vues: Scene[] = [];
  const journal: { jour: number; texte: string }[] = [];
  const ami = k >= 2;
  if (ami) { vues.push("ami"); journal.push({ jour: 2, texte: `Arrivée de ${p.journal}.` }); }
  if (k >= 4) { vues.push("calins"); journal.push({ jour: 4, texte: "Plume et son compagnon se sont fait plein de câlins." }); }
  if (k >= 5) { vues.push("ventre"); journal.push({ jour: 5, texte: "Plume avait un peu mal au ventre." }); }
  if (k >= 6) { vues.push("oeuf"); journal.push({ jour: 6, texte: "Plume a pondu un œuf !" }); }
  const nCouvages = k >= 11 ? COUVAGES_POUR_ECLORE : k >= 7 ? k - 6 : 0;
  const couvages = jours.slice(5, 5 + nCouvages);
  couvages.forEach((_, i) => journal.push({ jour: 7 + i, texte: `L'œuf a été réchauffé (${i + 1} sur ${COUVAGES_POUR_ECLORE}).` }));
  const bebe = k >= 12;
  if (bebe) { vues.push("eclosion"); journal.push({ jour: 11, texte: "Naissance de Noisette ! Un poussin tout doux." }); }
  publier({
    jours, vues, journal, couvages,
    nomAmi: ami ? p.nom : undefined,
    amiId: ami ? p.id : undefined,
    nomBebe: bebe ? "Noisette" : undefined,
    naissance: bebe ? 11 : undefined,
    prochainJour: undefined,
  });
}

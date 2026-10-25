// L'état de Plume : bulle ouverte ou fermée, petites réactions, réglages.
import { useEffect, useState } from "react";
import { REACTIONS } from "@/data/guide";

const CLE_VUS = "leonie-guide-vu";
const CLE_PARLE = "leonie-plume-parle";
const CLE_REACTIONS = "leonie-plume-reactions";

export type Proposition = { texte: string; oui: string; action: () => void };
type Etat = { ouvert: boolean; reaction: string | null; contenu: "page" | "presentation" | "presence" | "astuce" | "regles" | "mots"; coucou: number; proposition: Proposition | null; presence: Presence };

// ---- Combien Plume est présente ----
// discrete : elle ne parle que si on la touche. presente : elle propose parfois une aide (réglage de départ).
// Le caractère de Plume, en 4 niveaux (plus « se repose ») :
// 1 discrète : elle cligne des yeux, c'est tout, jusqu'à ce qu'on la touche.
// 2 présente : elle propose parfois un indice ou une explication.
// 3 étudiante : comme présente, avec ses tenues (lunettes et chapeau quand elle lit…).
// 4 passionnée : à fond ! Elle propose tout le temps de lire ou d'expliquer, et lit devant son tableau noir.
export type Presence = "discrete" | "presente" | "etudiante" | "passionnee" | "repos";
export const PRESENCES: { id: Presence; nom: string; explique: string }[] = [
  { id: "discrete", nom: "1 · Discrète", explique: "Je cligne des yeux, c'est tout. Je parle seulement si tu me touches." },
  { id: "presente", nom: "2 · Présente", explique: "De temps en temps, je te propose un indice ou l'explication d'un mot." },
  { id: "etudiante", nom: "3 · Étudiante", explique: "Pareil, avec mes tenues : lunettes et chapeau d'étudiant quand je lis !" },
  { id: "passionnee", nom: "4 · Passionnée", explique: "Je suis à fond ! Je te propose tout le temps de lire et d'expliquer, devant mon tableau." },
  { id: "repos", nom: "Plume se repose", explique: "Je me cache. Pour me rappeler, va dans les Options." },
];
const CLE_PRESENCE = "leonie-plume-presence";
function lirePresence(): Presence {
  try {
    const v = localStorage.getItem(CLE_PRESENCE);
    if (v === "toujours") return "passionnee"; // ancien réglage
    return v === "discrete" || v === "etudiante" || v === "passionnee" || v === "repos" ? v : "presente";
  } catch {
    return "presente";
  }
}
/** Plume porte ses tenues (niveaux 3 et 4). */
export function plumeCostumee() {
  return etat.presence === "etudiante" || etat.presence === "passionnee";
}
export function plumePassionnee() {
  return etat.presence === "passionnee";
}

let etat: Etat = { ouvert: false, reaction: null, contenu: "page", coucou: 0, proposition: null, presence: lirePresence() };
const abonnes = new Set<(e: Etat) => void>();
let minuteur = 0;

function publier(e: Partial<Etat>) {
  etat = { ...etat, ...e };
  abonnes.forEach((f) => f(etat));
}

export function usePlume() {
  const [e, setE] = useState(etat);
  useEffect(() => {
    abonnes.add(setE);
    return () => {
      abonnes.delete(setE);
    };
  }, []);
  return e;
}

export function ouvrirPlume(oui = true, contenu: Etat["contenu"] = "page") {
  publier({ ouvert: oui, reaction: null, proposition: oui ? null : etat.proposition, contenu, coucou: oui ? etat.coucou + 1 : etat.coucou });
}

export function presence() {
  return etat.presence;
}
export function choisirPresence(p: Presence) {
  try {
    localStorage.setItem(CLE_PRESENCE, p);
  } catch {
    /* rien */
  }
  publier({ presence: p, ouvert: false, reaction: null, proposition: null });
}
/** Plume peut-elle proposer quelque chose d'elle-même ? */
export function plumePeutProposer() {
  return (etat.presence === "presente" || etat.presence === "etudiante" || etat.presence === "passionnee") && !etat.ouvert;
}

/** Plume propose une aide (par exemple un indice). Leonie peut dire oui, ou ignorer. */
export function plumePropose(p: Proposition | null) {
  publier({ proposition: p });
}

/** Plume fait un petit coucou avec son aile. */
export function coucouPlume() {
  publier({ coucou: etat.coucou + 1 });
}

// « -2 » : la nouvelle présentation (accueil de Leonie, barre, Options) est montrée une fois.
const CLE_PRESENTEE = "leonie-plume-presentee-2";
export function presentationFaite() {
  try {
    return localStorage.getItem(CLE_PRESENTEE) === "oui";
  } catch {
    return true;
  }
}
export function marquerPresentation() {
  try {
    localStorage.setItem(CLE_PRESENTEE, "oui");
  } catch {
    /* rien */
  }
}

function lireReglage(cle: string, defaut: boolean) {
  try {
    const v = localStorage.getItem(cle);
    return v === null ? defaut : v === "oui";
  } catch {
    return defaut;
  }
}

function ecrireReglage(cle: string, oui: boolean) {
  try {
    localStorage.setItem(cle, oui ? "oui" : "non");
  } catch {
    /* rien */
  }
}

/** Plume lit toute seule ses explications à voix haute. */
// Plume lit toute seule à voix haute (réglage de la voix, dans les Options).
export const plumeParleSeule = () => lireReglage(CLE_PARLE, false);
export const choisirPlumeParle = (oui: boolean) => ecrireReglage(CLE_PARLE, oui);
/** Plume fait des petits commentaires pendant les jeux. */
export const reactionsActives = () => lireReglage(CLE_REACTIONS, true);
export const choisirReactions = (oui: boolean) => ecrireReglage(CLE_REACTIONS, oui);

export function dejaExplique(id: string) {
  try {
    return (JSON.parse(localStorage.getItem(CLE_VUS) || "[]") as string[]).includes(id);
  } catch {
    return true;
  }
}

export function marquerExplique(id: string) {
  try {
    const vus = JSON.parse(localStorage.getItem(CLE_VUS) || "[]") as string[];
    if (!vus.includes(id)) localStorage.setItem(CLE_VUS, JSON.stringify([...vus, id]));
  } catch {
    /* rien */
  }
}

export function revoirExplications() {
  try {
    localStorage.removeItem(CLE_VUS);
    localStorage.removeItem(CLE_PRESENTEE);
  } catch {
    /* rien */
  }
}

/** Plume réagit : une petite bulle à côté d'elle, quelques secondes. */
export function plumeReagit(type: keyof typeof REACTIONS) {
  if (!reactionsActives() || etat.ouvert || etat.presence === "discrete" || etat.presence === "repos") return;
  const phrases = REACTIONS[type];
  publier({ reaction: phrases[Math.floor(Math.random() * phrases.length)] });
  window.clearTimeout(minuteur);
  minuteur = window.setTimeout(() => publier({ reaction: null }), 3500);
}

/** Plume dit une petite phrase dans sa bulle, quelques secondes (même si les réactions sont éteintes). */
export function plumeDit(texte: string, duree = 3000) {
  if (etat.presence === "repos") return;
  publier({ reaction: texte });
  window.clearTimeout(minuteur);
  minuteur = window.setTimeout(() => publier({ reaction: null }), duree);
}

export function plumeOuverte() {
  return etat.ouvert;
}

// Plume explique chaque nouvelle page toute seule ? Non par défaut : elle reste discrète.
const CLE_AUTO = "leonie-plume-explique-seule";
export const plumeExpliqueSeule = () => lireReglage(CLE_AUTO, false);
export const choisirPlumeExplique = (oui: boolean) => ecrireReglage(CLE_AUTO, oui);

// Plume fait coucou de temps en temps (animation).
const CLE_COUCOU = "leonie-plume-coucou";
export const plumeBouge = () => lireReglage(CLE_COUCOU, true);
export const choisirPlumeBouge = (oui: boolean) => ecrireReglage(CLE_COUCOU, oui);

// Les règles d'un jeu, que Plume explique (bouton « Règles » des jeux).
import type { Explication } from "@/data/guide";
let reglesActuelles: Explication | null = null;
export function reglesEnCours() {
  return reglesActuelles;
}
export function ouvrirRegles(r: Explication) {
  reglesActuelles = r;
  ouvrirPlume(true, "regles");
}

/** Comment Plume commence une lecture, selon son caractère (toujours vrai : jamais « on en est sûrs » si on ne l'est pas). */
export function debutLecture() {
  if (etat.presence === "passionnee") {
    const debuts = [
      "Eh oui, Leonie ! Je vais te dire tout ce que je sais là-dessus ! ",
      "Ooooh, Leonie, j'adore ça ! Accroche-toi, j'explique tout ! ",
      "Par toutes mes plumes, Leonie ! Écoute bien, c'est passionnant ! ",
      "Leonie, Leonie ! Tu vas adorer ce que je vais te dire ! ",
    ];
    return debuts[Math.floor(Math.random() * debuts.length)];
  }
  if (etat.presence === "etudiante") return "D'après ce que savent les scientifiques… ";
  return "";
}

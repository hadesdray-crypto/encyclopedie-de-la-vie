// L'état de Plume : bulle ouverte ou fermée, petites réactions, réglages.
import { useEffect, useState } from "react";
import { REACTIONS } from "@/data/guide";
import { compagnonExprime, nomCompagnon, type Expression } from "@/lib/compagnons";

const CLE_VUS = "leonie-guide-vu";
const CLE_PARLE = "leonie-plume-parle";
const CLE_REACTIONS = "leonie-plume-reactions";

export type Proposition = { texte: string; oui: string; action: () => void };
type Etat = { ouvert: boolean; reaction: string | null; contenu: "page" | "presentation" | "presence" | "astuce" | "regles" | "mots"; coucou: number; peur: number; fete: number; geste: { anim: string; n: number }; proposition: Proposition | null; presence: Presence };

// ---- Combien Plume est présente ----
// discrete : elle ne parle que si on la touche. presente : elle propose parfois une aide (réglage de départ).
// Le caractère de Plume, en 4 niveaux (plus « se repose ») :
// 1 discrète : elle cligne des yeux, c'est tout, jusqu'à ce qu'on la touche.
// 2 présente : elle propose parfois un indice ou une explication.
// 3 étudiante : comme présente, avec ses tenues (lunettes et chapeau quand elle lit…).
// 4 passionnée : à fond ! Elle propose tout le temps de lire ou d'expliquer, et lit devant son tableau noir.
export type Presence = "discrete" | "presente" | "etudiante" | "passionnee" | "repos";
export const PRESENCES: { id: Presence; nom: string; explique: string }[] = [
  { id: "discrete", nom: "1 · Discrète", explique: "Bonnet et écharpe, yeux tout doux. Je cligne des yeux, c'est tout, sauf si tu me touches." },
  { id: "presente", nom: "2 · Présente", explique: "Grand nœud et foulard à pois. De temps en temps, je te propose un indice ou un mot." },
  { id: "etudiante", nom: "3 · Étudiante", explique: "Chapeau d'étudiant, col et cravate. Je commence par « D'après ce que savent les scientifiques… »." },
  { id: "passionnee", nom: "4 · Passionnée", explique: "Blouse de savante folle ! Je te propose tout le temps de lire, devant mon tableau noir." },
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
  return etat.presence !== "repos";
}
export function plumePassionnee() {
  return etat.presence === "passionnee";
}

let etat: Etat = { ouvert: false, reaction: null, contenu: "page", coucou: 0, peur: 0, fete: 0, geste: { anim: "", n: 0 }, proposition: null, presence: lirePresence() };
const abonnes = new Set<(e: Etat) => void>();
let minuteur = 0;

function publier(e: Partial<Etat>) {
  // Un personnage bonus parle de lui avec son nom à lui.
  if (typeof e.reaction === "string") { const n = nomCompagnon(); if (n !== "Plume") e = { ...e, reaction: e.reaction.replace(/\bPlume\b/g, n) }; }
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

/** Plume a un peu peur : elle se cache les yeux, tremble et pousse un petit « Hou ! ». */
export function plumeAPeur(texte: string, duree = 4000) {
  parler("peur", texte, duree);
  publier({ peur: etat.peur + 1 });
}

/** Fin d'une partie : Plume lève les bras et saute de joie (une fois, même si on l'appelle souvent). */
let derniereFete = 0;
export function plumeFete() {
  if (Date.now() - derniereFete < 20000) return;
  derniereFete = Date.now();
  window.setTimeout(() => publier({ fete: etat.fete + 1 }), 0);
}

/** Plume fait un geste devant un animal (coucou, triste, joie…). */
export function plumeGeste(anim: string) {
  publier({ geste: { anim, n: etat.geste.n + 1 } });
}

/** Plume fait un petit coucou avec son aile. */
export function coucouPlume() {
  publier({ coucou: etat.coucou + 1 });
  const perso = compagnonExprime("coucou");
  if (perso) plumeDit(perso, 2500);
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
  const perso = type === "bonne" || type === "mauvaise" || type === "paquet" ? compagnonExprime(type) : null;
  publier({ reaction: perso ?? phrases[Math.floor(Math.random() * phrases.length)] });
  window.clearTimeout(minuteur);
  minuteur = window.setTimeout(() => publier({ reaction: null }), 3500);
}

/**
 * Un moment où le compagnon parle : si c'est un personnage bonus, on joue son enregistrement
 * et on montre sa phrase à lui (s'il en a une) ; sinon, la phrase habituelle.
 */
export function parler(e: Expression, defaut: string, duree = 3000) {
  const perso = compagnonExprime(e);
  plumeDit(perso ?? defaut, duree);
}

/**
 * Les paliers : quand la même chose se répète (on la secoue, on la lance, elle perd), elle s'énerve de plus en plus.
 * Chaque fois compte un palier de plus ; si on la laisse tranquille assez longtemps, elle se calme (on repart de 0).
 */
const paliers = new Map<string, { n: number; t: number }>();
export function palier(cle: string, calmeApres = 90000) {
  const maintenant = Date.now();
  const p = paliers.get(cle);
  const n = p && maintenant - p.t < calmeApres ? p.n + 1 : 0;
  paliers.set(cle, { n, t: maintenant });
  return n;
}
export function calmer(cle: string) {
  paliers.delete(cle);
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

// Ce qui est affiché à l'écran en ce moment (un pays, un animal, un voyage) : Plume peut le raconter.
let ecranActuel: Explication | null = null;
export function ecranEnCours() {
  return ecranActuel;
}
export function definirEcran(e: Explication | null) {
  ecranActuel = e;
  publier({});
}
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

/**
 * Revivre la première utilisation : Plume se présente de nouveau et réexplique chaque page,
 * comme pour quelqu'un qui découvre l'application. Les cartes, les progrès et les réglages ne sont PAS effacés.
 */
export function revivrePremiereFois() {
  try {
    [CLE_PRESENTEE, CLE_VUS, "leonie-plume-position", "leonie-installer-masque"].forEach((k) => localStorage.removeItem(k));
    ["leonie-mots-proposes", "leonie-lecture-proposee"].forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* rien */
  }
  window.location.hash = "#/";
  window.location.reload();
}

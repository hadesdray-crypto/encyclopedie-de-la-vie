// L'état de Plume : bulle ouverte ou fermée, petites réactions, réglages.
import { useEffect, useState } from "react";
import { REACTIONS } from "@/data/guide";

const CLE_VUS = "leonie-guide-vu";
const CLE_PARLE = "leonie-plume-parle";
const CLE_REACTIONS = "leonie-plume-reactions";

type Etat = { ouvert: boolean; reaction: string | null; contenu: "page" | "presentation"; coucou: number };
let etat: Etat = { ouvert: false, reaction: null, contenu: "page", coucou: 0 };
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
  publier({ ouvert: oui, reaction: null, contenu, coucou: oui ? etat.coucou + 1 : etat.coucou });
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
  if (!reactionsActives() || etat.ouvert) return;
  const phrases = REACTIONS[type];
  publier({ reaction: phrases[Math.floor(Math.random() * phrases.length)] });
  window.clearTimeout(minuteur);
  minuteur = window.setTimeout(() => publier({ reaction: null }), 3500);
}

/** Plume dit une petite phrase dans sa bulle, quelques secondes (même si les réactions sont éteintes). */
export function plumeDit(texte: string, duree = 3000) {
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

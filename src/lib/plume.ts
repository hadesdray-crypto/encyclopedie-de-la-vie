// L'état de Plume : bulle ouverte ou fermée, petites réactions, réglages.
import { useEffect, useState } from "react";
import { REACTIONS } from "@/data/guide";

const CLE_VUS = "leonie-guide-vu";
const CLE_PARLE = "leonie-plume-parle";
const CLE_REACTIONS = "leonie-plume-reactions";

type Etat = { ouvert: boolean; reaction: string | null };
let etat: Etat = { ouvert: false, reaction: null };
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

export function ouvrirPlume(oui = true) {
  publier({ ouvert: oui, reaction: null });
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

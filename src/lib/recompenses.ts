// Les paquets se gagnent en apprenant : lire des fiches, bien répondre, finir un mémoire.
// Tout reste sur l'appareil (localStorage).
const CLE_PAQUETS = "leonie-paquets";
const CLE_ILLIMITE = "leonie-paquets-illimites";
const CLE_LUES = "leonie-fiches-lues";
const CLE_BONNES = "leonie-bonnes";

export const REGLES = {
  depart: 3,
  fichesParPaquet: 5,
  bonnesParPaquet: 8,
};

function lireNombre(cle: string, defaut: number) {
  try {
    const v = localStorage.getItem(cle);
    return v === null ? defaut : Number(v) || 0;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, v: string) {
  try {
    localStorage.setItem(cle, v);
  } catch {
    /* rien */
  }
}

/** Les paquets illimités n'existent plus : les tables donnent le Plumedex, et les cartes se gagnent (une fois par jour, et en explorant). */
export function paquetsIllimites() {
  void CLE_ILLIMITE;
  return false;
}

// Le paquet du jour : un paquet offert chaque jour, de 5, 10 ou 15 cartes (au hasard, découvert en l'ouvrant).
const CLE_JOUR = "leonie-paquet-du-jour";
const aujourdhui = () => new Date().toLocaleDateString("fr-CA");
export function paquetDuJour() {
  try {
    return localStorage.getItem(CLE_JOUR) !== aujourdhui();
  } catch {
    return false;
  }
}
/** On prend le paquet du jour : renvoie sa taille (5, 10 ou 15), ou 0 s'il est déjà ouvert. */
export function prendrePaquetDuJour(): number {
  if (!paquetDuJour()) return 0;
  ecrire(CLE_JOUR, aujourdhui());
  window.dispatchEvent(new Event("leonie-paquets"));
  return [5, 10, 15][Math.floor(Math.random() * 3)];
}

export function choisirIllimite(oui: boolean) {
  ecrire(CLE_ILLIMITE, oui ? "oui" : "non");
  window.dispatchEvent(new Event("leonie-paquets"));
}

export function paquetsDisponibles() {
  return lireNombre(CLE_PAQUETS, REGLES.depart);
}

export function utiliserPaquet() {
  const n = paquetsDisponibles();
  if (n <= 0) return false;
  ecrire(CLE_PAQUETS, String(n - 1));
  window.dispatchEvent(new Event("leonie-paquets"));
  return true;
}

export function gagnerPaquet(raison: string) {
  ecrire(CLE_PAQUETS, String(paquetsDisponibles() + 1));
  window.dispatchEvent(new CustomEvent("leonie-cadeau", { detail: raison }));
  window.dispatchEvent(new Event("leonie-paquets"));
}

export function fichesLues(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_LUES) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Une fiche ouverte pour la première fois compte pour gagner un paquet. */
export function lireFiche(id: string) {
  const lues = fichesLues();
  if (lues.includes(id)) return;
  lues.push(id);
  ecrire(CLE_LUES, JSON.stringify(lues));
  if (lues.length % REGLES.fichesParPaquet === 0) gagnerPaquet(`${REGLES.fichesParPaquet} nouvelles fiches lues`);
}

export function bonneReponse() {
  const n = lireNombre(CLE_BONNES, 0) + 1;
  ecrire(CLE_BONNES, String(n));
  if (n % REGLES.bonnesParPaquet === 0) gagnerPaquet(`${REGLES.bonnesParPaquet} bonnes réponses`);
}

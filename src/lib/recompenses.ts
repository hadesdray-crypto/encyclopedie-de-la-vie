// Les paquets se gagnent en apprenant : lire des fiches, bien répondre, finir un mémoire.
// Tout reste sur l'appareil (localStorage).
const CLE_PAQUETS = "leonie-paquets";
const CLE_ILLIMITE = "leonie-paquets-illimites";
const CLE_LUES = "leonie-fiches-lues";
const CLE_BONNES = "leonie-bonnes";

export const REGLES = {
  depart: 3,
  fichesParPaquet: 3,
  bonnesParPaquet: 5,
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

export function paquetsIllimites() {
  try {
    return localStorage.getItem(CLE_ILLIMITE) === "oui";
  } catch {
    return false;
  }
}

export function choisirIllimite(oui: boolean) {
  ecrire(CLE_ILLIMITE, oui ? "oui" : "non");
  window.dispatchEvent(new Event("leonie-paquets"));
}

export function paquetsDisponibles() {
  return lireNombre(CLE_PAQUETS, REGLES.depart);
}

export function utiliserPaquet() {
  if (paquetsIllimites()) return true;
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

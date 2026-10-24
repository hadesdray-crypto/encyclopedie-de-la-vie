// Réglages de confort, gardés sur l'appareil.
const CLE_TEXTE = "leonie-gros-texte";
const CLE_AVATAR = "leonie-avatar";

export const AVATARS = ["theme/lune.webp", "theme/coeur.webp", "theme/etoile.webp", "theme/sourire.webp", "theme/plantes.webp", "theme/animaux.webp", "theme/terre.webp", "theme/archees.webp"];

function lire(cle: string) {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, v: string) {
  try {
    localStorage.setItem(cle, v);
  } catch {
    /* rien */
  }
}

export function grosTexte() {
  return lire(CLE_TEXTE) === "oui";
}

export function appliquerGrosTexte() {
  document.documentElement.style.fontSize = grosTexte() ? "112.5%" : "";
}

export function choisirGrosTexte(oui: boolean) {
  ecrire(CLE_TEXTE, oui ? "oui" : "non");
  appliquerGrosTexte();
}

export function avatar() {
  return lire(CLE_AVATAR) || AVATARS[0];
}

export function choisirAvatar(src: string) {
  ecrire(CLE_AVATAR, src);
}

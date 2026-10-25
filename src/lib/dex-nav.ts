/** Aller vers une page (le routeur écoute le changement d'adresse). */
export function aller(chemin: string) {
  window.location.hash = `#${chemin}`;
}

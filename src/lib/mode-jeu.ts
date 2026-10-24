// Le « mode jeu » : pendant un jeu, la barre du bas et les menus disparaissent.
// Retour (le bouton en haut ou la flèche du téléphone) quitte d'abord la partie en cours.
import { useEffect } from "react";

let quitter: (() => void) | null = null;

/** Une partie est en cours : Retour la quitte (au lieu de changer de page). */
export function useQuitterPartie(enCours: boolean, onQuitter: () => void) {
  useEffect(() => {
    if (!enCours) return;
    quitter = onQuitter;
    return () => {
      if (quitter === onQuitter) quitter = null;
    };
  }, [enCours, onQuitter]);
}

export function quitterPartieSiEnCours() {
  if (!quitter) return false;
  const q = quitter;
  quitter = null;
  q();
  return true;
}

/** La page est un jeu : on cache la barre du bas et Plume flottante. */
export function useModeJeu() {
  useEffect(() => {
    document.body.dataset.jeu = "oui";
    return () => {
      delete document.body.dataset.jeu;
    };
  }, []);
}

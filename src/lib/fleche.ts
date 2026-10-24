// La flèche « retour » du téléphone (en bas de l'écran, sur Android).
// Elle fait comme le bouton Retour de l'application : elle revient pas à pas sur le chemin suivi.
// À l'accueil, elle ne ferme pas tout d'un coup : Plume demande d'appuyer une deuxième fois.
import { appeler, ecouter, moduleDisponible } from "@/lib/natif";
import { ouvrirPlume, plumeDit, plumeOuverte } from "@/lib/plume";
import { revenir } from "@/lib/routeur";
import { taire } from "@/lib/parole";

let derniereFois = 0;

export function demarrerFleche() {
  if (!moduleDisponible("App")) return;
  ecouter("App", "backButton", () => {
    taire();
    // D'abord, on referme Plume si ses ailes sont ouvertes.
    if (plumeOuverte()) {
      ouvrirPlume(false);
      return;
    }
    if (revenir()) return;
    const maintenant = Date.now();
    if (maintenant - derniereFois < 2500) {
      appeler("App", "exitApp").catch(() => {});
      return;
    }
    derniereFois = maintenant;
    plumeDit("Appuie encore une fois pour fermer l'encyclopédie.", 2500);
  });
}

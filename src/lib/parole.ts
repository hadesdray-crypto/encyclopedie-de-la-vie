// Une seule voix pour toute l'application : on sait toujours si Plume parle,
// et le bouton Pause de Plume peut l'arrêter de n'importe où.
import { useEffect, useState } from "react";
import { lire, stopper } from "@/components/voix";

let enCours = false;
let dernierTexte = "";
const abonnes = new Set<(v: boolean) => void>();

function publier(v: boolean) {
  enCours = v;
  abonnes.forEach((f) => f(v));
}

export function dire(texte: string, fin?: () => void) {
  dernierTexte = texte;
  publier(true);
  lire(texte, () => {
    publier(false);
    fin?.();
  });
}

export function taire() {
  stopper();
  publier(false);
}

export function redire() {
  if (dernierTexte) dire(dernierTexte);
}

export function useParle() {
  const [v, setV] = useState(enCours);
  useEffect(() => {
    abonnes.add(setV);
    setV(enCours);
    return () => {
      abonnes.delete(setV);
    };
  }, []);
  return v;
}

// Le Plumedex : un cadre autour de toute l'application, avec des boutons pour parcourir
// le catalogue de la vie. Il se gagne en remplissant toutes les tables de multiplication.
import { useEffect, useState } from "react";

const CLE_GAGNE = "leonie-dex-gagne";
const CLE_ACTIF = "leonie-dex-actif";
const EVT = "leonie-dex";

function lire(cle: string) {
  try {
    return localStorage.getItem(cle) === "oui";
  } catch {
    return false;
  }
}
function ecrire(cle: string, oui: boolean) {
  try {
    localStorage.setItem(cle, oui ? "oui" : "non");
  } catch {
    /* rien */
  }
  window.dispatchEvent(new Event(EVT));
}

export const dexGagne = () => lire(CLE_GAGNE);
export const dexActif = () => dexGagne() && lire(CLE_ACTIF);
export function gagnerDex() {
  ecrire(CLE_GAGNE, true);
  ecrire(CLE_ACTIF, true);
}
export const activerDex = (oui: boolean) => ecrire(CLE_ACTIF, oui);

export function useDex() {
  const [e, setE] = useState(() => ({ gagne: dexGagne(), actif: dexActif() }));
  useEffect(() => {
    const maj = () => setE({ gagne: dexGagne(), actif: dexActif() });
    window.addEventListener(EVT, maj);
    return () => window.removeEventListener(EVT, maj);
  }, []);
  return e;
}

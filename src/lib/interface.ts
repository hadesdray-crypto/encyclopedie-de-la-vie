// Les réglages de l'interface : comment les pages s'ouvrent, le style des boutons du bas, et le bouton mis en avant.
import { useEffect, useState } from "react";

export type Ouverture = "volet" | "centre" | "aucune";
export type StyleBoutons = "3d" | "medailles";
export type Interface = { ouverture: Ouverture; boutons: StyleBoutons; vedette: string | null };

const CLE = "leonie-interface";
const DEFAUT: Interface = { ouverture: "volet", boutons: "3d", vedette: null };

export function lireInterface(): Interface {
  try {
    return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE) || "{}") };
  } catch {
    return DEFAUT;
  }
}
export function changerInterface(p: Partial<Interface>) {
  try {
    localStorage.setItem(CLE, JSON.stringify({ ...lireInterface(), ...p }));
  } catch {
    /* rien */
  }
  window.dispatchEvent(new Event(CLE));
}
export function useInterface() {
  const [i, setI] = useState(lireInterface);
  useEffect(() => {
    const f = () => setI(lireInterface());
    window.addEventListener(CLE, f);
    return () => window.removeEventListener(CLE, f);
  }, []);
  return i;
}

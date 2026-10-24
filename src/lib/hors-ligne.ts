// Mode hors ligne : enregistre l'application et ses photos sur l'appareil.
import { useEffect, useState } from "react";

declare const __HORS_LIGNE__: boolean;

export type EtatHorsLigne = { possible: boolean; total: number; prets: number; enCours: boolean };

let dernier: EtatHorsLigne = { possible: false, total: 0, prets: 0, enCours: false };
const abonnes = new Set<(e: EtatHorsLigne) => void>();

function publier(e: Partial<EtatHorsLigne>) {
  dernier = { ...dernier, ...e };
  for (const f of abonnes) f(dernier);
}

export async function demarrerHorsLigne() {
  if (!__HORS_LIGNE__ || !("serviceWorker" in navigator) || location.protocol === "file:") return;
  try {
    await navigator.serviceWorker.register("./sw.js");
    const pret = await navigator.serviceWorker.ready;
    publier({ possible: true });
    navigator.serviceWorker.addEventListener("message", (ev) => {
      if (ev.data?.type === "etat") publier({ total: ev.data.total, prets: ev.data.prets, enCours: ev.data.enCours });
    });
    pret.active?.postMessage("etat");
    // Les photos et les cris font partie de l'application : on les enregistre
    // une fois, en arrière-plan, pour qu'ils marchent ensuite sans Internet.
    if (navigator.onLine) pret.active?.postMessage("tout-preparer");
  } catch {
    /* navigateur sans service worker : l'application marche, mais en ligne seulement */
  }
}

export function relancerHorsLigne() {
  navigator.serviceWorker?.ready.then((r) => r.active?.postMessage("tout-preparer"));
}

export function useHorsLigne() {
  const [etat, setEtat] = useState(dernier);
  useEffect(() => {
    abonnes.add(setEtat);
    navigator.serviceWorker?.ready.then((r) => r.active?.postMessage("etat"));
    return () => {
      abonnes.delete(setEtat);
    };
  }, []);
  return etat;
}

// Mode hors ligne et mises à jour.
// L'application s'enregistre sur l'appareil. Quand une nouvelle version existe,
// elle se télécharge en arrière-plan mais ne remplace JAMAIS l'ancienne toute seule :
// l'utilisateur voit « Mise à jour disponible » et choisit. Tant qu'il ne dit pas oui,
// l'ancienne version continue de marcher, avec ou sans Internet.
import { useEffect, useState } from "react";

declare const __HORS_LIGNE__: boolean;
declare const __VERSION_APP__: string;

export const VERSION_APP = __VERSION_APP__;

export type EtatHorsLigne = {
  possible: boolean;
  total: number;
  prets: number;
  enCours: boolean;
  majDisponible: boolean;
  verification: "" | "en-cours" | "a-jour" | "hors-ligne";
};

let dernier: EtatHorsLigne = { possible: false, total: 0, prets: 0, enCours: false, majDisponible: false, verification: "" };
const abonnes = new Set<(e: EtatHorsLigne) => void>();
let enregistrement: ServiceWorkerRegistration | null = null;

function publier(e: Partial<EtatHorsLigne>) {
  dernier = { ...dernier, ...e };
  for (const f of abonnes) f(dernier);
}

function surveiller(reg: ServiceWorkerRegistration) {
  // Une nouvelle version déjà téléchargée qui attend l'accord.
  if (reg.waiting && navigator.serviceWorker.controller) publier({ majDisponible: true });
  reg.addEventListener("updatefound", () => {
    const nouveau = reg.installing;
    nouveau?.addEventListener("statechange", () => {
      // « installed » avec une ancienne version active = mise à jour prête, en attente.
      if (nouveau.state === "installed" && navigator.serviceWorker.controller) publier({ majDisponible: true });
    });
  });
}

export async function demarrerHorsLigne() {
  if (!__HORS_LIGNE__ || !("serviceWorker" in navigator) || location.protocol === "file:") return;
  try {
    // Première visite : pas d'ancienne version, donc pas besoin de recharger la page.
    const avaitUneVersion = !!navigator.serviceWorker.controller;
    enregistrement = await navigator.serviceWorker.register("./sw.js");
    surveiller(enregistrement);
    const pret = await navigator.serviceWorker.ready;
    publier({ possible: true });
    navigator.serviceWorker.addEventListener("message", (ev) => {
      if (ev.data?.type === "etat") publier({ total: ev.data.total, prets: ev.data.prets, enCours: ev.data.enCours });
    });
    // Après « Mettre à jour », la nouvelle version prend la main : on recharge une fois.
    let recharge = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recharge || !avaitUneVersion) return;
      recharge = true;
      location.reload();
    });
    pret.active?.postMessage("etat");
    // Les photos et les cris font partie de l'application : on les enregistre une fois.
    if (navigator.onLine) pret.active?.postMessage("tout-preparer");
    // On regarde s'il existe une nouvelle version : à l'ouverture, puis toutes les heures.
    verifierMiseAJour();
    window.setInterval(() => document.visibilityState === "visible" && verifierMiseAJour(), 60 * 60 * 1000);
  } catch {
    /* navigateur sans service worker : l'application marche, mais en ligne seulement */
  }
}

export async function verifierMiseAJour() {
  if (!enregistrement) return;
  if (!navigator.onLine) {
    publier({ verification: "hors-ligne" });
    return;
  }
  publier({ verification: "en-cours" });
  try {
    await enregistrement.update();
  } catch {
    /* pas grave : on réessaiera */
  }
  // Laisser le temps au téléchargement de se terminer.
  window.setTimeout(() => {
    if (!dernier.majDisponible) publier({ verification: "a-jour" });
  }, 4000);
}

export const CLE_MAJ_WEB = "leonie-maj-web-terminee";

export function accepterMiseAJour() {
  try {
    localStorage.setItem(CLE_MAJ_WEB, "oui");
  } catch {
    /* rien */
  }
  const enAttente = enregistrement?.waiting;
  if (enAttente) enAttente.postMessage("mettre-a-jour");
  else location.reload();
}

export function relancerHorsLigne() {
  navigator.serviceWorker?.ready.then((r) => r.active?.postMessage("tout-preparer"));
}

export function useHorsLigne() {
  const [etat, setEtat] = useState(dernier);
  useEffect(() => {
    abonnes.add(setEtat);
    setEtat(dernier);
    navigator.serviceWorker?.ready.then((r) => r.active?.postMessage("etat"));
    return () => {
      abonnes.delete(setEtat);
    };
  }, []);
  return etat;
}

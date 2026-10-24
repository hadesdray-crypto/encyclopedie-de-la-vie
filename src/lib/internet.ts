// Les fonctions qui ont besoin d'Internet sont éteintes par défaut.
// Un adulte peut les allumer dans Profil > Coin des parents.
import { useEffect, useState } from "react";

const CLE = "leonie-internet";

function lire() {
  try {
    return localStorage.getItem(CLE) === "oui";
  } catch {
    return false;
  }
}

export function permettreInternet(oui: boolean) {
  try {
    if (oui) localStorage.setItem(CLE, "oui");
    else localStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
  window.dispatchEvent(new Event("leonie-internet"));
}

/** { permis : un adulte a dit oui, connecte : l'appareil a du réseau } */
export function useInternet() {
  const [permis, setPermis] = useState(lire);
  const [connecte, setConnecte] = useState(() => navigator.onLine);
  useEffect(() => {
    const maj = () => {
      setPermis(lire());
      setConnecte(navigator.onLine);
    };
    window.addEventListener("leonie-internet", maj);
    window.addEventListener("online", maj);
    window.addEventListener("offline", maj);
    return () => {
      window.removeEventListener("leonie-internet", maj);
      window.removeEventListener("online", maj);
      window.removeEventListener("offline", maj);
    };
  }, []);
  return { permis, connecte };
}

// Mises à jour de l'application Android (.apk).
// Quand le téléphone a du réseau, on regarde sur GitHub si une version plus récente existe.
// On ne fait rien tout seul : on propose, et c'est l'utilisateur qui choisit.
import { useEffect, useState } from "react";

declare const __APK__: boolean;
declare const __APK_VERSION__: number;

export const EST_APK = __APK__;
export const VERSION_APK = __APK_VERSION__;
const API = "https://api.github.com/repos/hadesdray-crypto/encyclopedie-de-la-vie/releases/latest";
export const LIEN_APK = "https://github.com/hadesdray-crypto/encyclopedie-de-la-vie/releases/latest/download/encyclopedie-de-la-vie.apk";

type Etat = { nouvelle: number | null; verification: "" | "en-cours" | "a-jour" | "hors-ligne" | "erreur" };
let etat: Etat = { nouvelle: null, verification: "" };
const abonnes = new Set<(e: Etat) => void>();
function publier(e: Partial<Etat>) {
  etat = { ...etat, ...e };
  abonnes.forEach((f) => f(etat));
}

export async function verifierApk() {
  if (!EST_APK) return;
  if (!navigator.onLine) return publier({ verification: "hors-ligne" });
  publier({ verification: "en-cours" });
  try {
    const r = await fetch(API, { cache: "no-store" });
    const tag = String((await r.json()).tag_name || "");
    const n = Number(tag.replace(/\D/g, ""));
    if (n > VERSION_APK) publier({ nouvelle: n, verification: "" });
    else publier({ verification: "a-jour" });
  } catch {
    publier({ verification: "erreur" });
  }
}

export function telechargerApk() {
  // Ouvre le téléchargement dans le navigateur du téléphone.
  window.location.href = LIEN_APK;
}

export function useMajApk() {
  const [e, setE] = useState(etat);
  useEffect(() => {
    abonnes.add(setE);
    return () => {
      abonnes.delete(setE);
    };
  }, []);
  return e;
}

export function demarrerMajApk() {
  if (!EST_APK) return;
  verifierApk();
  window.addEventListener("online", () => verifierApk());
}

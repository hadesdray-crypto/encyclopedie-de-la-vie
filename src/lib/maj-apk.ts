// Mises à jour de l'application Android, tout à l'intérieur de l'application :
// 1. elle regarde sur GitHub s'il y a une nouvelle version (seulement avec Internet) ;
// 2. on touche « Mettre à jour » : le nouveau contenu se télécharge, avec une barre ;
// 3. « Redémarrer » : l'application se relance toute seule et dit « Mise à jour terminée ».
// Rien d'autre ne s'ouvre. Rien ne se fait sans qu'on l'ait demandé.
import { useEffect, useState } from "react";

declare const __APK__: boolean;
declare const __APK_VERSION__: number;

export const EST_APK = __APK__;
export const VERSION_APK = __APK_VERSION__;
const DEPOT = "https://github.com/hadesdray-crypto/encyclopedie-de-la-vie";
const API = "https://api.github.com/repos/hadesdray-crypto/encyclopedie-de-la-vie/releases/latest";
export const LIEN_APK = `${DEPOT}/releases/latest/download/encyclopedie-de-la-vie.apk`;
const CLE_TERMINEE = "leonie-maj-terminee";

type Bundle = { id: string; version: string };
type Updater = {
  notifyAppReady: () => Promise<unknown>;
  download: (o: { url: string; version: string }) => Promise<Bundle>;
  set: (o: { id: string }) => Promise<void>;
  addListener: (evt: "download", f: (e: { percent: number }) => void) => Promise<{ remove: () => void }>;
};

function updater(): Updater | undefined {
  return (window as unknown as { Capacitor?: { Plugins?: { CapacitorUpdater?: Updater } } }).Capacitor?.Plugins?.CapacitorUpdater;
}

export type EtatMaj = {
  nouvelle: number | null;
  phase: "rien" | "propose" | "telechargement" | "pret" | "erreur" | "termine";
  pourcent: number;
  verification: "" | "en-cours" | "a-jour" | "hors-ligne" | "erreur";
};

let etat: EtatMaj = { nouvelle: null, phase: "rien", pourcent: 0, verification: "" };
let bundle: Bundle | null = null;
const abonnes = new Set<(e: EtatMaj) => void>();
function publier(e: Partial<EtatMaj>) {
  etat = { ...etat, ...e };
  abonnes.forEach((f) => f(etat));
}

export function useMajApk() {
  const [e, setE] = useState(etat);
  useEffect(() => {
    abonnes.add(setE);
    setE(etat);
    return () => {
      abonnes.delete(setE);
    };
  }, []);
  return e;
}

export async function verifierApk() {
  if (!EST_APK || etat.phase === "telechargement" || etat.phase === "pret") return;
  if (!navigator.onLine) return publier({ verification: "hors-ligne" });
  publier({ verification: "en-cours" });
  try {
    const r = await fetch(API, { cache: "no-store" });
    const n = Number(String((await r.json()).tag_name || "").replace(/\D/g, ""));
    if (n > VERSION_APK) publier({ nouvelle: n, phase: etat.phase === "termine" ? "termine" : "propose", verification: "" });
    else publier({ verification: "a-jour" });
  } catch {
    publier({ verification: "erreur" });
  }
}

/** « Mettre à jour » : on télécharge le nouveau contenu, dans l'application. */
export async function lancerMajApk() {
  const u = updater();
  const n = etat.nouvelle;
  if (!n) return;
  if (!u) {
    // Ancienne application sans le module de mise à jour : il faut la réinstaller une fois.
    window.location.href = LIEN_APK;
    return;
  }
  publier({ phase: "telechargement", pourcent: 0 });
  const ecoute = await u.addListener("download", (e) => publier({ pourcent: Math.max(0, Math.min(100, Math.round(e.percent))) }));
  try {
    bundle = await u.download({ url: `${DEPOT}/releases/download/android-${n}/web.zip`, version: String(n) });
    publier({ phase: "pret", pourcent: 100 });
  } catch {
    publier({ phase: "erreur" });
  } finally {
    ecoute.remove();
  }
}

/** « Redémarrer » : l'application se relance avec la nouvelle version. */
export async function redemarrerApk() {
  const u = updater();
  if (!u || !bundle) return;
  try {
    localStorage.setItem(CLE_TERMINEE, String(etat.nouvelle));
  } catch {
    /* rien */
  }
  await u.set({ id: bundle.id });
}

export function fermerMaj() {
  publier({ phase: "rien" });
}

export function telechargerApk() {
  window.location.href = LIEN_APK;
}

export function demarrerMajApk() {
  if (!EST_APK) return;
  // Dire au module que cette version démarre bien (sinon il revient à l'ancienne, par sécurité).
  updater()?.notifyAppReady().catch(() => {});
  try {
    const terminee = Number(localStorage.getItem(CLE_TERMINEE));
    if (terminee && terminee === VERSION_APK) {
      localStorage.removeItem(CLE_TERMINEE);
      publier({ phase: "termine" });
    }
  } catch {
    /* rien */
  }
  verifierApk();
  window.addEventListener("online", () => verifierApk());
}

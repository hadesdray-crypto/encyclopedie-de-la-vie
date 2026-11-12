// La voix choisie pour chaque caractère de Plume (comme dans Footdex) : quelle voix du téléphone, et plus aiguë ou plus grave.
// Simple pour une enfant : des cartes « Voix 1, Voix 2… » avec des étoiles (⭐⭐⭐ = la plus fluide), on écoute, on garde.
import { useEffect, useState } from "react";
import { appeler, moduleDisponible } from "@/lib/natif";

export type BaseVoix = { moteur: "auto" | "natif" | "navigateur"; index: number; nom: string };
/**
 * La voix gardée pour un caractère. `moteur/index/nom` : la voix à utiliser tout de suite.
 * Nouveau réglage à deux molettes : `local` (sans connexion) et `reseau` (avec connexion), avec les cases « utiliser ».
 * Si les deux sont cochées, la voix avec connexion sert quand il y a Internet, sinon celle sans connexion.
 */
export type ChoixVoix = BaseVoix & { hauteur: number; vitesse?: number; local?: BaseVoix | null; reseau?: BaseVoix | null; useLocal?: boolean; useReseau?: boolean };
export type OptionVoix = { cle: string; titre: string; libelle?: string; etoiles: 1 | 2 | 3; reseau?: boolean; note: string; choix: BaseVoix };

const CLE = "leonie-voix-choisies";
const abonnes = new Set<() => void>();
function lireTout(): Record<string, ChoixVoix> {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? "{}") as Record<string, ChoixVoix>;
  } catch {
    return {};
  }
}
/** La voix choisie pour un caractère (ou null : la voix habituelle). */
export function voixBrute(presence: string): ChoixVoix | null {
  const v = lireTout()[presence];
  return v && typeof v.hauteur === "number" ? v : null;
}
/** La voix à utiliser maintenant : avec deux molettes, celle avec connexion s'il y a Internet, sinon celle sans connexion. */
export function voixChoisie(presence: string): ChoixVoix | null {
  const v = voixBrute(presence);
  if (!v || (v.local === undefined && v.reseau === undefined)) return v;
  const enLigne = typeof navigator === "undefined" || navigator.onLine !== false;
  const reseau = v.useReseau !== false && v.reseau ? v.reseau : null;
  const local = v.useLocal !== false && v.local ? v.local : null;
  const base = enLigne ? reseau ?? local : local ?? (reseau && !enLigne ? null : reseau);
  return { ...(base ?? { moteur: "auto", index: -1, nom: "" }), hauteur: v.hauteur, vitesse: v.vitesse };
}
export function garderVoix(presence: string, v: ChoixVoix) {
  try {
    localStorage.setItem(CLE, JSON.stringify({ ...lireTout(), [presence]: v }));
  } catch {
    /* rien */
  }
  abonnes.forEach((f) => f());
}
export function useVoixChoisie(presence: string) {
  const [v, setV] = useState(() => voixBrute(presence));
  useEffect(() => {
    const f = () => setV(voixBrute(presence));
    abonnes.add(f);
    f();
    return () => void abonnes.delete(f);
  }, [presence]);
  return v;
}

/** Une voix à essayer, juste pour la prochaine phrase (le bouton « écouter » d'une carte). */
let essai: ChoixVoix | null = null;
export function essayerProchaine(v: ChoixVoix) {
  essai = v;
}
/** La voix à utiliser maintenant : l'essai s'il y en a un (une seule fois), sinon celle du caractère. */
export function voixPourParler(presence: string): ChoixVoix | null {
  if (essai) {
    const e = essai;
    essai = null;
    return e;
  }
  return voixChoisie(presence);
}

/** Toutes les voix françaises du téléphone, la plus fluide d'abord. */
export async function catalogueVoix(): Promise<OptionVoix[]> {
  const out: Omit<OptionVoix, "titre">[] = [];
  if (moduleDisponible("TextToSpeech")) {
    try {
      const r = await appeler<{ voices: { name?: string; lang?: string; voiceURI?: string; localService?: boolean }[] }>("TextToSpeech", "getSupportedVoices");
      (r?.voices ?? []).forEach((v, index) => {
        const nom = `${v.name || ""} ${v.voiceURI || ""}`;
        if (!/^fr/i.test(v.lang || "") && !/fr[-_]/i.test(nom)) return;
        const reseau = /network/i.test(nom) || v.localService === false;
        const google = /x-[a-z]{3}-(local|network)|google/i.test(nom);
        out.push({ cle: `n${index}`, libelle: (v.name || v.voiceURI || "").replace(/^.*\//, ""), reseau, etoiles: google || reseau ? 3 : 2, note: reseau ? "Avec Internet" : "Sans Internet", choix: { moteur: "natif", index, nom: "" } });
      });
    } catch {
      /* pas de liste : la voix du téléphone seulement */
    }
    if (!out.length) out.push({ cle: "n-1", reseau: false, etoiles: 2, note: "Sans Internet", choix: { moteur: "natif", index: -1, nom: "" } });
  } else if ("speechSynthesis" in window) {
    for (const v of window.speechSynthesis.getVoices()) {
      if (!v.lang.toLowerCase().startsWith("fr")) continue;
      const bonne = /google|natural|neural|premium|enhanced|online/i.test(v.name) || !v.localService;
      out.push({ cle: `p${v.name}`, libelle: v.name, reseau: !v.localService, etoiles: bonne ? 3 : 2, note: v.localService ? "Sans Internet" : "Avec Internet", choix: { moteur: "navigateur", index: -1, nom: v.name } });
    }
  }
  out.sort((a, b) => b.etoiles - a.etoiles);
  return out.map((o, i) => ({ ...o, titre: `Voix ${i + 1}` }));
}
export const cleDe = (v: ChoixVoix | null) => (!v ? "" : v.moteur === "natif" ? `n${v.index}` : v.moteur === "navigateur" ? `p${v.nom}` : "");

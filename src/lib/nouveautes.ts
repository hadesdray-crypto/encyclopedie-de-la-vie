// « Ce qui change » : la liste des nouveautés est lue en ligne (public/nouveautes.json),
// au moment où une mise à jour est proposée. Hors connexion, on n'affiche rien de plus.
import { useEffect, useState } from "react";

export type Nouveaute = { date: string; titre: string; points: string[] };
const URL_EN_LIGNE = "https://hadesdray-crypto.github.io/encyclopedie-de-la-vie/nouveautes.json";

export function useNouveautes(actif: boolean) {
  const [liste, setListe] = useState<Nouveaute[] | null>(null);
  useEffect(() => {
    if (!actif || !navigator.onLine) return;
    const adresse = location.protocol.startsWith("http") && location.hostname.endsWith("github.io") ? "nouveautes.json" : URL_EN_LIGNE;
    fetch(adresse, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((l) => Array.isArray(l) && setListe(l))
      .catch(() => {});
  }, [actif]);
  return liste;
}

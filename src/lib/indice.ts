// Les indices de Plume dans les jeux.
// Si Leonie hésite longtemps, Plume propose doucement un indice. Si elle dit oui,
// une mauvaise réponse s'efface. Rien ne s'affiche si Plume est « discrète » ou « au repos ».
import { useEffect, useState } from "react";
import { plumePeutProposer, plumePropose } from "@/lib/plume";
import { dire } from "@/lib/parole";
import { plumeParleSeule } from "@/lib/plume";

const ATTENTE = 18000;

export function useIndice(cle: string, ids: string[], bon: string, repondu: boolean) {
  const [effaces, setEffaces] = useState<Set<string>>(new Set());
  useEffect(() => {
    setEffaces(new Set());
  }, [cle]);
  useEffect(() => {
    if (repondu || ids.length < 3) {
      plumePropose(null);
      return;
    }
    const t = window.setTimeout(() => {
      if (!plumePeutProposer()) return;
      const texte = "Tu hésites ? Je peux t'aider un tout petit peu…";
      if (plumeParleSeule()) dire(texte);
      plumePropose({
        texte,
        oui: "Oui, un indice",
        action: () => {
          setEffaces((avant) => {
            const faux = ids.filter((id) => id !== bon && !avant.has(id));
            if (!faux.length) return avant;
            return new Set([...avant, faux[Math.floor(Math.random() * faux.length)]]);
          });
          plumePropose(null);
        },
      });
    }, ATTENTE);
    return () => {
      window.clearTimeout(t);
      plumePropose(null);
    };
  }, [cle, repondu]);
  return effaces;
}

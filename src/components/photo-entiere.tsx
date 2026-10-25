// Voir la photo en entier : l'animal n'est jamais coupé (la photo est posée sur un fond flou d'elle-même).
// Et un bouton pour signaler une photo qui n'est pas le bon animal : la liste va dans le Coin des parents.
import { useState, type ReactNode } from "react";
import { LuFlag, LuX } from "react-icons/lu";
import { plumeDit } from "@/lib/plume";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";

// Le merci de Plume quand Leonie signale une photo (avec la petite blague du Concepteur).
const MERCI = "Merci Leonie ! Grâce à toi, l'application que ton papa a créée pour te faire plaisir… oups, pardon : que le Concepteur a créée… va devenir encore meilleure !";

const CLE = "leonie-photos-signalees";
export type Signalement = { id: string; nom: string; photo: string };
export function photosSignalees(): Signalement[] {
  try {
    return JSON.parse(localStorage.getItem(CLE) || "[]");
  } catch {
    return [];
  }
}
function signaler(s: Signalement) {
  const l = photosSignalees().filter((x) => x.photo !== s.photo);
  try {
    localStorage.setItem(CLE, JSON.stringify([...l, s]));
  } catch {
    /* rien */
  }
}
export function effacerSignalements() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
}

export function PhotoEntiere({ src, id, nom, children, className = "" }: { src: string; id: string; nom: string; children: ReactNode; className?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [fait, setFait] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuvert(true)} aria-label={`Voir la photo de ${nom} en entier`} className={className}>
        {children}
      </button>
      {ouvert ? (
        <div role="dialog" aria-modal="true" aria-label="Photo en entier" className="fixed inset-0 z-[70] flex flex-col bg-[#0b0820]" onClick={() => setOuvert(false)}>
          <div className="relative m-3 flex-1 overflow-hidden rounded-3xl">
            <img src={src} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl" />
            <img src={src} alt={nom} className="relative size-full object-contain" />
          </div>
          <div className="flex items-center justify-between gap-2 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]" onClick={(ev) => ev.stopPropagation()}>
            <button type="button" onClick={() => { signaler({ id, nom, photo: src }); setFait(true); plumeDit(MERCI, 7000); if (voixPossible()) dire(MERCI); window.setTimeout(() => setOuvert(false), 1500); }} disabled={fait} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-extrabold text-white disabled:opacity-70">
              <LuFlag className="size-4" aria-hidden="true" /> {fait ? "Merci, c'est noté !" : "Ce n'est pas le bon animal"}
            </button>
            <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" className="grid size-11 place-items-center rounded-full bg-[#f3d48a] text-[#2a1650]">
              <LuX className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

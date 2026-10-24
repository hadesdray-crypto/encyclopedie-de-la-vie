import { useEffect } from "react";
import { LuChevronLeft, LuCrown, LuSettings } from "react-icons/lu";
import { declarerParent, revenir } from "@/lib/routeur";

/**
 * En-tête des pages intérieures : le nom de Leonie, Options et Retour.
 * Retour revient pas à pas sur le chemin suivi (comme la flèche du téléphone).
 * siVide : la page où aller si on est arrivé ici directement.
 */
export function Entete({ siVide, label = "Retour" }: { siVide?: string; label?: string }) {
  useEffect(() => {
    if (siVide) declarerParent(siVide);
  }, [siVide]);
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <LuCrown className="size-6 shrink-0 text-[#f3d48a]" aria-hidden="true" />
        <p className="font-display text-base leading-tight text-[#f0d090]">Pour la princesse Leonie</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a href="#/options" aria-label="Options" className="grid size-11 place-items-center rounded-full bg-[#2a1844] text-[#f3d48a] ring-1 ring-[#e8c98a]/50">
          <LuSettings className="size-5" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={() => revenir(siVide)}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-card px-4 py-2 text-sm font-extrabold text-[#2a1c14]"
        >
          <LuChevronLeft className="size-5" aria-hidden="true" />
          {label}
        </button>
      </div>
    </header>
  );
}

export function Titre({ children, sous }: { children: string; sous?: string }) {
  return (
    <>
      <h1 className="titre-or mt-5 text-center text-4xl leading-tight text-balance">{children}</h1>
      {sous ? <p className="mx-auto mt-2 max-w-md text-center text-base leading-relaxed">{sous}</p> : null}
    </>
  );
}

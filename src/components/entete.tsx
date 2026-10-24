import { LuChevronLeft, LuCrown } from "react-icons/lu";
import { retour } from "@/lib/routeur";

/** En-tête des pages intérieures : le nom de Leonie et un gros bouton Retour. */
export function Entete({ siVide = "/", label = "Retour" }: { siVide?: string; label?: string }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <p className="inline-flex items-center gap-2 font-display text-base text-[#f0d090]">
        <LuCrown className="size-5" aria-hidden="true" />
        Pour la princesse Leonie
      </p>
      <button
        type="button"
        onClick={() => retour(siVide)}
        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-card px-4 py-2 text-sm font-extrabold"
      >
        <LuChevronLeft className="size-5" aria-hidden="true" />
        {label}
      </button>
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

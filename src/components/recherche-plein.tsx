// Une recherche qui prend tout l'écran : le champ en haut, les réponses juste dessous.
// Rien ne peut les cacher (ni le clavier, ni la barre, ni Plume).
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LuSearch, LuX } from "react-icons/lu";

export function RecherchePlein({ q, setQ, placeholder, onFermer, children, vide }: { q: string; setQ: (t: string) => void; placeholder: string; onFermer: () => void; children: ReactNode; vide?: ReactNode }) {
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    // Le bouton « retour » du téléphone ferme la recherche au lieu de quitter la page.
    history.pushState({ recherche: 1 }, "");
    const retour = () => onFermer();
    window.addEventListener("popstate", retour);
    return () => {
      window.removeEventListener("keydown", echap);
      window.removeEventListener("popstate", retour);
      if (history.state?.recherche) history.back();
    };
  }, []);
  return createPortal(
    <div role="dialog" aria-label={placeholder} data-sans-remonter className="recherche-plein fixed inset-0 z-[90] flex flex-col bg-[#120a26]/96 backdrop-blur-md" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
      <div className="mx-auto w-full max-w-xl px-4">
        <label className="flex items-center gap-2 rounded-full bg-card px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,.4)]">
          <LuSearch className="size-5 shrink-0 text-[#6d5648]" aria-hidden="true" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} enterKeyHint="search" className="w-full bg-transparent text-base text-[#2a1c14] outline-none placeholder:text-[#8a7462]" />
          <button type="button" aria-label="Fermer la recherche" onClick={onFermer} className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2a1c14]/10"><LuX className="size-5 text-[#6d5648]" /></button>
        </label>
      </div>
      <div className="mx-auto mt-2 w-full max-w-xl flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {q.trim().length < 2 ? <p className="mt-6 text-center text-sm texte-doux">Écris au moins deux lettres.</p> : children ?? vide}
      </div>
    </div>,
    document.body,
  );
}

// Le cadre du Plumedex : une lentille qui s'allume, des petites lumières, et des boutons
// pour parcourir toutes les fiches (précédente, au hasard, suivante), chercher et changer de salle.
import { useEffect, useMemo } from "react";
import { LuChevronLeft, LuChevronRight, LuDices, LuHouse, LuPawPrint, LuSearch, LuShuffle } from "react-icons/lu";
import { ESPECES, PAR_ID } from "@/data/catalogue";
import { aUnePhoto } from "@/components/portrait";
import { useDex } from "@/lib/dex";
import { useParle } from "@/lib/parole";
import { aller } from "@/lib/dex-nav";

const INDEX = new Map(ESPECES.map((e, i) => [e.id, i]));
const AVEC_PHOTO = ESPECES.filter((e) => aUnePhoto(e.id));

export function DexCadre({ chemin }: { chemin: string }) {
  const { actif } = useDex();
  const parle = useParle();
  useEffect(() => {
    if (actif) document.body.setAttribute("data-dex", "");
    else document.body.removeAttribute("data-dex");
  }, [actif]);
  const id = chemin.startsWith("/mammiferes/e-") ? chemin.slice("/mammiferes/e-".length) : null;
  const espece = id ? PAR_ID.get(id) : undefined;
  const i = id ? INDEX.get(id) : undefined;
  const voisin = (d: number) => (i === undefined ? null : ESPECES[(i + d + ESPECES.length) % ESPECES.length]);
  const hasard = useMemo(() => () => AVEC_PHOTO[Math.floor(Math.random() * AVEC_PHOTO.length)], []);
  if (!actif) return null;
  const btn = "dex-bouton grid place-items-center rounded-full text-white";
  return (
    <>
      <div className="dex-cadre pointer-events-none fixed inset-0 z-40" aria-hidden="true" />
      <header className="dex-haut fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-3" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <span className={`dex-lentille ${parle ? "dex-allumee" : ""}`} />
        <span className="dex-led bg-[#ff5a5a]" />
        <span className="dex-led bg-[#ffd84a]" />
        <span className="dex-led bg-[#5fe07a]" />
        <span className="ml-1 min-w-0 flex-1 truncate text-right font-display text-sm tracking-widest text-[#fff3d0]">
          {espece ? `N° ${String((i ?? 0) + 1).padStart(4, "0")} · ${espece.nom}` : "PLUMEDEX"}
        </span>
      </header>
      <nav aria-label="Plumedex" className="dex-bas fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl px-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}>
        <div className="dex-panneau flex h-[4.5rem] items-center justify-between gap-1 rounded-[1.6rem] px-2">
          <button type="button" aria-label="Accueil" onClick={() => aller("/")} className={`${btn} size-11`}><LuHouse className="size-5" /></button>
          <button type="button" aria-label="Les animaux" onClick={() => aller("/animaux")} className={`${btn} size-11`}><LuPawPrint className="size-5" /></button>
          <button type="button" aria-label="Fiche précédente" disabled={!voisin(-1)} onClick={() => voisin(-1) && aller(`/mammiferes/e-${voisin(-1)!.id}`)} className={`${btn} dex-croix size-11 disabled:opacity-40`}><LuChevronLeft className="size-6" /></button>
          <button type="button" aria-label="Un animal au hasard" onClick={() => aller(`/mammiferes/e-${hasard().id}`)} className={`${btn} dex-rond size-14`}><LuShuffle className="size-6" /></button>
          <button type="button" aria-label="Fiche suivante" disabled={!voisin(1)} onClick={() => voisin(1) && aller(`/mammiferes/e-${voisin(1)!.id}`)} className={`${btn} dex-croix size-11 disabled:opacity-40`}><LuChevronRight className="size-6" /></button>
          <button type="button" aria-label="Chercher" onClick={() => aller("/chercher")} className={`${btn} size-11`}><LuSearch className="size-5" /></button>
          <button type="button" aria-label="Jouer" onClick={() => aller("/jouer")} className={`${btn} size-11`}><LuDices className="size-5" /></button>
        </div>
      </nav>
    </>
  );
}

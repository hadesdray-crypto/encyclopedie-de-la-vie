import type { Espece } from "@/data/catalogue";
import { FAMILLES } from "@/data/catalogue";
import { Portrait } from "@/components/portrait";

/** Les niveaux de rareté, du plus courant au plus rare, avec leur cadre. */
export const NIVEAUX: Record<string, { rang: number; cadre: string; etoiles: number }> = {
  "Répandu": { rang: 0, cadre: "cadre-bronze", etoiles: 1 },
  "Pas très répandu": { rang: 1, cadre: "cadre-argent", etoiles: 2 },
  "Assez peu répandu": { rang: 2, cadre: "cadre-or", etoiles: 3 },
  "Peu répandu": { rang: 3, cadre: "cadre-violet", etoiles: 4 },
  "Très peu répandu": { rang: 4, cadre: "cadre-arc", etoiles: 5 },
};

export function niveauDe(rarete: string | null) {
  return NIVEAUX[rarete ?? "Répandu"] ?? NIVEAUX["Répandu"];
}

/** Recto d'une carte de collection. */
export function CarteRecto({ espece, rarete, special, chance }: { espece: Espece; rarete: string | null; special?: string | null; chance?: boolean }) {
  const niveau = niveauDe(rarete);
  return (
    <span className={`carte-collection ${niveau.cadre} ${chance ? "carte-chance" : ""} flex size-full flex-col rounded-2xl p-1.5`}>
      <span className="flex items-center justify-between px-1 text-[10px] font-extrabold">
        <span>{"★".repeat(niveau.etoiles)}</span>
        <span className="truncate pl-1">{FAMILLES[espece.famille]?.nom}</span>
      </span>
      <span className="relative mt-1 block aspect-square w-full overflow-hidden rounded-xl">
        <Portrait id={espece.id} />
        {niveau.rang >= 3 || chance ? <span className="holo absolute inset-0" /> : null}
      </span>
      <span className="mt-1 line-clamp-2 px-1 text-center font-display text-[13px] font-semibold leading-tight">{espece.nom}</span>
      <span className="mt-auto px-1 pb-0.5 text-center text-[10px] font-extrabold leading-tight">
        {chance ? "Wah, la chance !" : special ?? rarete ?? "Répartition mal connue"}
      </span>
    </span>
  );
}

/** Verso commun : le dos de toutes les cartes. */
export function CarteVerso() {
  return (
    <span className="carte-dos grid size-full place-items-center rounded-2xl">
      <img src="theme/lune.webp" alt="" className="size-[55%] rounded-full opacity-90 shadow-[0_0_20px_rgba(160,110,255,.8)]" />
    </span>
  );
}

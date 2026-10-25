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

/** Recto d'une carte de collection, façon carte de foot : un bouclier métallique, un reflet qui bouge, et la note en étoiles. */
export function CarteRecto({ espece, rarete, special, chance }: { espece: Espece; rarete: string | null; special?: string | null; chance?: boolean }) {
  const niveau = niveauDe(rarete);
  return (
    <span className={`carte-collection carte-fut ${niveau.cadre} ${chance ? "carte-chance" : ""} relative flex size-full flex-col`}>
      <span className="carte-fut-interieur relative flex size-full flex-col overflow-hidden">
        {/* La note : le nombre d'étoiles, en grand, comme la note d'un joueur */}
        <span className="absolute left-[7%] top-[6%] z-10 flex flex-col items-center leading-none">
          <span className="font-display text-[1.9em] font-black [text-shadow:0_2px_0_rgba(255,255,255,.45)]">{niveau.etoiles}</span>
          <span className="text-[.75em]">{"★".repeat(niveau.etoiles)}</span>
        </span>
        <span className="absolute right-[7%] top-[7%] z-10 max-w-[48%] truncate rounded-full bg-black/15 px-1.5 py-0.5 text-[.62em] font-extrabold">{FAMILLES[espece.famille]?.nom}</span>
        {/* La photo de l'animal, avec un halo derrière */}
        <span className="relative mx-auto mt-[17%] block aspect-square w-[78%] overflow-hidden rounded-full ring-[3px] ring-white/50 shadow-[0_6px_14px_rgba(0,0,0,.35)]">
          <Portrait id={espece.id} />
          {niveau.rang >= 2 || chance ? <span className="holo absolute inset-0" /> : null}
        </span>
        <span className="carte-fut-nom relative z-10 mx-[6%] mt-[5%] line-clamp-2 rounded-lg px-1 py-0.5 text-center font-display text-[1.02em] font-semibold leading-tight">{espece.nom}</span>
        <span className="mt-auto px-[8%] pb-[9%] text-center text-[.66em] font-extrabold leading-tight opacity-85">
          {chance ? "Wah, la chance !" : special ?? rarete ?? "Répartition mal connue"}
        </span>
        {/* Le reflet de lumière qui suit l'inclinaison de la carte */}
        <span className="carte-reflet pointer-events-none absolute inset-0" />
      </span>
    </span>
  );
}

/** Une carte qui s'incline en 3D quand on la touche ou qu'on penche le téléphone (le reflet suit). */
export function Carte3D({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  function bouger(e: React.PointerEvent<HTMLSpanElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--rx", `${(-y * 22).toFixed(1)}deg`);
    e.currentTarget.style.setProperty("--ry", `${(x * 26).toFixed(1)}deg`);
    e.currentTarget.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(0)}%`);
    e.currentTarget.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(0)}%`);
  }
  function lacher(e: React.PointerEvent<HTMLSpanElement>) {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  }
  return <span className={`carte-3d block ${className}`} onPointerMove={bouger} onPointerLeave={lacher} onPointerUp={lacher}>{children}</span>;
}

/** Verso commun : le dos de toutes les cartes. */
export function CarteVerso() {
  return (
    <span className="carte-dos grid size-full place-items-center rounded-2xl">
      <img src="theme/lune.webp" alt="" className="size-[55%] rounded-full opacity-90 shadow-[0_0_20px_rgba(160,110,255,.8)]" />
    </span>
  );
}

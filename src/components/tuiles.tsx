// Des tuiles avec de grandes images, en trois affichages au choix : grandes cartes, médaillons ou liste.
import { useState, type ReactNode } from "react";
import { LuGalleryVertical, LuLayoutGrid, LuList } from "react-icons/lu";

export type Affichage = "cartes" | "medaillons" | "liste";
export type Tuile = { vers: string; titre: string; sous?: string; image: ReactNode; badge?: string; eteinte?: boolean };

export function useAffichage(cle: string, defaut: Affichage = "cartes") {
  const [aff, setAff] = useState<Affichage>(() => {
    try {
      const v = localStorage.getItem(cle);
      return v === "cartes" || v === "medaillons" || v === "liste" ? v : defaut;
    } catch {
      return defaut;
    }
  });
  const choisir = (a: Affichage) => {
    setAff(a);
    try {
      localStorage.setItem(cle, a);
    } catch {
      /* rien */
    }
  };
  return [aff, choisir] as const;
}

export function ChoixAffichage({ aff, choisir }: { aff: Affichage; choisir: (a: Affichage) => void }) {
  const MODES = [
    { id: "cartes" as const, label: "Grandes cartes", I: LuGalleryVertical },
    { id: "medaillons" as const, label: "Médaillons", I: LuLayoutGrid },
    { id: "liste" as const, label: "Liste", I: LuList },
  ];
  return (
    <div role="radiogroup" aria-label="Affichage" className="mx-auto mt-3 flex w-max gap-1 rounded-full bg-[#2a1844] p-1 ring-1 ring-[#e8c98a]/40">
      {MODES.map(({ id, label, I }) => (
        <button key={id} type="button" role="radio" aria-checked={aff === id} aria-label={label} onClick={() => choisir(id)} className={`grid size-9 place-items-center rounded-full ${aff === id ? "bg-[#f3d48a] text-[#2a1650]" : "text-[#f3d48a]"}`}>
          <I className="size-5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

const IMG = "[&_img]:size-full [&_img]:object-cover";

export function Tuiles({ items, aff, grande = false }: { items: Tuile[]; aff: Affichage; grande?: boolean }) {
  if (aff === "medaillons") {
    return (
      <ul className="mt-5 grid grid-cols-3 gap-x-2 gap-y-5">
        {items.map((t, i) => (
          <li key={t.vers + i} className="text-center">
            <a href={`#${t.vers}`} className={`block ${t.eteinte ? "opacity-70" : ""}`}>
              <span className={`medaillon-or relative mx-auto block aspect-square w-[88%] overflow-hidden ${IMG} ${t.eteinte ? "grayscale-[60%]" : ""}`}>{t.image}</span>
              <span className="mt-1.5 block font-display text-[15px] leading-tight text-[#f3d48a]">{t.titre}</span>
              {t.badge ? <span className="block text-[11px] font-black text-[#e7d7ff]">{t.badge}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  if (aff === "liste") {
    return (
      <ul className="mt-4 space-y-2">
        {items.map((t, i) => (
          <li key={t.vers + i}>
            <a href={`#${t.vers}`} className="flex items-center gap-3 rounded-3xl bg-card px-3 py-2.5 text-[#2a1c14]">
              <span className={`medaillon-or block size-14 shrink-0 overflow-hidden ${IMG}`}>{t.image}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight">{t.titre}</span>
                {t.sous ? <span className="block text-sm leading-snug">{t.sous}</span> : null}
              </span>
              {t.badge ? <span className="shrink-0 text-xs font-black text-[#8d4e1f]">{t.badge}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3">
      {items.map((t, i) => (
        <li key={t.vers + i} className={grande && i === 0 ? "col-span-2" : ""}>
          <a href={`#${t.vers}`} className={`carte-jeu relative block overflow-hidden rounded-[1.4rem] border-2 border-[#e8c98a]/80 bg-[#2a1844] shadow-[0_10px_22px_rgba(0,0,0,.45)] ${grande && i === 0 ? "h-48" : "h-44"}`}>
            <span className={`absolute inset-0 ${IMG} ${t.eteinte ? "grayscale-[60%]" : ""}`}>{t.image}</span>
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(18,10,40,.92)_88%)]" />
            {t.badge ? <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-black text-[#f3d48a] backdrop-blur-sm">{t.badge}</span> : null}
            <span className="absolute inset-x-0 bottom-0 px-3 pb-2.5 text-white">
              <span className={`block font-display leading-tight [text-shadow:0_2px_6px_#000] ${grande && i === 0 ? "text-2xl" : "text-lg"}`}>{t.titre}</span>
              {t.sous ? <span className="mt-0.5 line-clamp-2 block text-xs font-bold leading-snug text-white/85">{t.sous}</span> : null}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

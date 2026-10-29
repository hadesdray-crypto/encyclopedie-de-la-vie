// Les petites briques communes des écrans de réglages : une grosse tuile de menu (icône + deux mots),
// un interrupteur « Oui / Non » que Plume peut lire à voix haute, et une carte parchemin.
import { useState, type ReactNode } from "react";
import { LuVolume2 } from "react-icons/lu";
import { voixPossible } from "@/components/voix";
import { dire } from "@/lib/parole";
import { direBoutons } from "@/lib/reglages";

export type Interrupteur = { id: string; titre: string; explication: string; lire: () => boolean; choisir: (oui: boolean) => void };

export function texteInterrupteur(r: Interrupteur) {
  return `${r.titre}. ${r.explication} En ce moment : ${r.lire() ? "oui" : "non"}.`;
}

/** Une grosse tuile de menu : une icône, un titre, et (si besoin) quelques mots. Mène à un sous-menu. */
export function Tuile({ href, icone, titre, sous, pastille, className = "" }: { href: string; icone: ReactNode; titre: string; sous?: string; pastille?: string; className?: string }) {
  return (
    <a
      href={href}
      className={`relative flex min-h-[7.25rem] flex-col items-center justify-center gap-1 rounded-3xl bg-gradient-to-b from-[#3d2468] to-[#26153f] px-2 py-3 text-center ring-1 ring-[#e8c98a]/45 shadow-[0_8px_18px_rgba(0,0,0,.35)] transition-transform active:scale-[.97] ${className}`}
    >
      <span className="text-4xl leading-none" aria-hidden="true">{icone}</span>
      <span className="font-display text-lg leading-tight text-[#f3d48a]">{titre}</span>
      {sous ? <span className="text-xs leading-snug texte-doux">{sous}</span> : null}
      {pastille ? <span className="absolute right-2 top-2 rounded-full bg-[#5cc28a] px-2 py-0.5 text-[11px] font-black text-[#0f3320]">{pastille}</span> : null}
    </a>
  );
}

/** Le titre d'un sous-menu : petit, pour laisser la place aux réglages. */
export function TitreSous({ children, sous, icone }: { children: string; sous?: string; icone?: ReactNode }) {
  return (
    <>
      <h1 className="titre-or mt-5 flex items-center justify-center gap-2 text-center text-3xl leading-tight text-balance">
        {icone ? <span aria-hidden="true">{icone}</span> : null}
        {children}
      </h1>
      {sous ? <p className="mx-auto mt-1.5 max-w-md text-center text-sm leading-relaxed texte-doux">{sous}</p> : null}
    </>
  );
}

/** Une carte parchemin, où l'on range des lignes de réglages. */
export function CartePage({ children }: { children: ReactNode }) {
  return <div className="mt-4 divide-y divide-[#a07a45]/30 rounded-3xl bg-card px-3 py-1 text-[#2a1c14]">{children}</div>;
}

export function BoutonEcouter({ texte, label }: { texte: () => string; label: string }) {
  if (!voixPossible()) return null;
  return (
    <button type="button" onClick={() => dire(texte())} aria-label={`Écouter : ${label}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#efe3ff] text-[#6a3fc0]">
      <LuVolume2 className="size-5" aria-hidden="true" />
    </button>
  );
}

export function Ligne({ r }: { r: Interrupteur }) {
  const [oui, setOui] = useState(r.lire);
  return (
    <div className="flex items-center gap-2 py-2.5">
      <BoutonEcouter texte={() => texteInterrupteur(r)} label={r.titre} />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold leading-tight">{r.titre}</p>
        <p className="text-xs leading-snug">{r.explication}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={oui}
        aria-label={r.titre}
        onClick={() => {
          r.choisir(!oui);
          setOui(!oui);
          if (direBoutons() && voixPossible()) dire(oui ? "Non" : "Oui");
        }}
        className={`relative h-9 w-[4.6rem] shrink-0 rounded-full text-xs font-black transition-colors ${oui ? "bg-[#4f9a4a] text-white" : "bg-[#cdb89a] text-[#4a3a2a]"}`}
      >
        <span className={`absolute top-1 size-7 rounded-full bg-white shadow transition-all ${oui ? "left-[calc(100%-2rem)]" : "left-1"}`} />
        <span className={`absolute inset-y-0 grid place-items-center ${oui ? "left-2.5" : "right-2.5"}`}>{oui ? "Oui" : "Non"}</span>
      </button>
    </div>
  );
}

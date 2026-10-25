// La fenêtre du globe : un cadre en laiton et cuivre, comme un vieil instrument d'explorateur.
// Deux positions : en grand, ou en bandeau en haut (il reste visible et on peut toujours le toucher).
// Le passage de l'un à l'autre se fait comme un mécanisme : les engrenages tournent et le cadre coulisse.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { plumeDit } from "@/lib/plume";

function Engrenage({ className = "", sens = 1 }: { className?: string; sens?: 1 | -1 }) {
  const dents = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="-12 -12 24 24" className={className} aria-hidden="true" style={{ ["--sens" as string]: sens }}>
      <defs>
        <radialGradient id="laiton-eng" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#fff0b8" /><stop offset=".45" stopColor="#d9a54a" /><stop offset="1" stopColor="#7a4a1c" /></radialGradient>
      </defs>
      {dents.map((a) => <rect key={a} x="-2.2" y="-11.5" width="4.4" height="5" rx="1" fill="url(#laiton-eng)" transform={`rotate(${a})`} />)}
      <circle r="8" fill="url(#laiton-eng)" stroke="#5a3410" strokeWidth=".8" />
      <circle r="2.6" fill="#3a2008" />
    </svg>
  );
}

function Rivet({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute size-2.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#c08a3a_55%,#5a3410)] shadow-[0_1px_1px_rgba(0,0,0,.6)] ${className}`} />;
}

export function CadreGlobe({ petit, onBascule, children, dessus }: { petit: boolean; onBascule: () => void; children: ReactNode; dessus?: ReactNode }) {
  const [tourne, setTourne] = useState(0);
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    setTourne((n) => n + 1);
    // La première fois, Plume explique la poignée.
    try {
      if (petit && !localStorage.getItem("leonie-bandeau-explique")) {
        localStorage.setItem("leonie-bandeau-explique", "oui");
        plumeDit("J'ai mis le globe en bandeau pour que tu voies bien la fiche. Touche « Agrandir » pour le revoir en grand !", 6000);
      }
    } catch { /* rien */ }
  }, [petit]);
  return (
    <div className={`${petit ? "sticky top-0" : "relative"} z-20 px-2 pt-1`}>
      <div className="cadre-laiton relative rounded-[14px] p-[7px]">
        <Rivet className="left-1 top-1" /><Rivet className="right-1 top-1" /><Rivet className="bottom-1 left-1" /><Rivet className="bottom-1 right-1" />
        <div
          className="fenetre-globe relative overflow-hidden rounded-[8px] bg-[#05081a] ring-2 ring-[#3a2008]/80"
          style={{ height: petit ? "max(190px, 30vh)" : "max(320px, 62vh)" }}
        >
          {children}
          {dessus}
        </div>
        {/* La poignée du mécanisme : on la touche pour agrandir ou rapetisser la fenêtre. */}
        <div className="absolute inset-x-0 -bottom-4 flex items-center justify-center">
          <Engrenage key={`g1-${tourne}`} sens={-1} className={`-mr-1 size-7 ${tourne ? "engrenage-tourne" : ""}`} />
          <button
            type="button"
            onClick={onBascule}
            aria-label={petit ? "Agrandir le globe" : "Mettre le globe en bandeau"}
            className="poignee-laiton flex h-8 items-center gap-1 rounded-full px-4 text-xs font-black text-[#3a2008]"
          >
            {petit ? <LuChevronDown className="size-4" /> : <LuChevronUp className="size-4" />}
            {petit ? "Agrandir" : "Bandeau"}
          </button>
          <Engrenage key={`g2-${tourne}`} sens={1} className={`-ml-1 size-7 ${tourne ? "engrenage-tourne" : ""}`} />
        </div>
      </div>
      <div className="h-5" />
    </div>
  );
}

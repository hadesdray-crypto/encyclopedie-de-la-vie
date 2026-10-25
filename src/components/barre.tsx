import { useEffect, useState } from "react";
import { LuFlame } from "react-icons/lu";
import { paquetsDisponibles, paquetsIllimites } from "@/lib/recompenses";
import { defiFait } from "@/lib/defis";
import { direBoutons } from "@/lib/reglages";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";

type Salle = { vers: string; label: string; dit: string; icone: string; actif: (c: string) => boolean };

const SALLES: Salle[] = [
  { vers: "/", label: "Accueil", dit: "L'accueil", icone: "theme/maison.webp", actif: (c) => c === "/" || c === "" },
  { vers: "/arbre", label: "Arbre", dit: "L'arbre de la vie", icone: "theme/cristal.webp", actif: (c) => c.startsWith("/arbre") || c.startsWith("/frise") },
  { vers: "/voyageurs", label: "Carte", dit: "La carte du monde des animaux", icone: "theme/terre.webp", actif: (c) => c.startsWith("/voyageurs") || c.startsWith("/aventure") || c.startsWith("/suivi") },
  { vers: "/cartes", label: "Cartes", dit: "Mes cartes", icone: "theme/cartes.webp", actif: (c) => c.startsWith("/cartes") },
  { vers: "/jouer", label: "Jouer", dit: "Les jeux", icone: "theme/etoile.webp", actif: (c) => c.startsWith("/jouer") },
];

/** Les petites pastilles : paquets à ouvrir, défi du jour qui attend. Elles se mettent à jour toutes seules. */
function usePastilles() {
  const lire = () => ({ paquets: paquetsIllimites() ? 0 : paquetsDisponibles(), defi: !defiFait() });
  const [p, setP] = useState(lire);
  useEffect(() => {
    const maj = () => setP(lire());
    const evenements = ["leonie-paquets", "leonie-defi", "hashchange", "focus"];
    evenements.forEach((e) => window.addEventListener(e, maj));
    return () => evenements.forEach((e) => window.removeEventListener(e, maj));
  }, []);
  return p;
}

/**
 * Barre du bas. Sa hauteur est fixée par --barre dans styles.css, et chaque page
 * garde en bas une marge de cette hauteur : la barre ne recouvre jamais un bouton.
 * Le retour se fait avec la flèche du téléphone, ou le bouton Retour en haut des pages.
 */
export function Barre({ chemin }: { chemin: string }) {
  const { paquets, defi } = usePastilles();
  const [saut, setSaut] = useState<string | null>(null);

  function toucher(salle: Salle) {
    setSaut(salle.vers);
    window.setTimeout(() => setSaut(null), 450);
    if (direBoutons() && voixPossible()) dire(salle.dit);
  }

  return (
    <nav
      aria-label="Salles"
      className="barre-bas fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
    >
      <ul className="grid h-[4.5rem] grid-cols-5 items-center barre-bois rounded-[1.6rem] px-1 shadow-[0_10px_30px_rgba(0,0,0,.45)] backdrop-blur">
        {SALLES.map((salle) => {
          const actif = salle.actif(chemin);
          const pastille =
            salle.vers === "/cartes" && paquets > 0 ? (
              <span className="pastille-barre absolute -right-1.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e2453c] px-1 text-[11px] font-black text-white ring-2 ring-[#2a1a0e]">
                {paquets > 9 ? "9+" : paquets}
              </span>
            ) : salle.vers === "/jouer" && defi ? (
              <span className="pastille-barre absolute -right-1.5 -top-1 grid size-5 place-items-center rounded-full bg-[#ff9f4a] text-[#3a1300] ring-2 ring-[#2a1a0e]">
                <LuFlame className="size-3.5" aria-hidden="true" />
              </span>
            ) : null;
          const aide =
            salle.vers === "/cartes" && paquets > 0
              ? `, ${paquets} paquet${paquets > 1 ? "s" : ""} à ouvrir`
              : salle.vers === "/jouer" && defi
                ? ", le défi du jour t'attend"
                : "";
          return (
            <li key={salle.vers} className="relative">
              {actif ? <span className="absolute left-1/2 top-[-0.55rem] h-1 w-8 -translate-x-1/2 rounded-full bg-[#f3d48a] shadow-[0_0_10px_2px_rgba(243,212,138,.7)]" /> : null}
              <a
                href={`#${salle.vers}`}
                onClick={() => toucher(salle)}
                aria-current={actif ? "page" : undefined}
                aria-label={salle.label + aide}
                className="flex flex-col items-center gap-1 py-1 font-display text-[13px] font-semibold"
              >
                <span className={`relative block ${saut === salle.vers ? "saut" : ""}`}>
                  <img
                    src={salle.icone}
                    alt=""
                    className={`size-10 rounded-full object-cover transition-transform ${actif ? "scale-110 shadow-[0_0_16px_4px_rgba(160,110,255,.8)] ring-2 ring-[#f3d48a]" : "opacity-85"}`}
                  />
                  {pastille}
                </span>
                <span className={actif ? "text-[#f3d48a]" : "text-[#e7d7be]"}>{salle.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

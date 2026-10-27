import { useEffect, useState } from "react";
import { LuFlame } from "react-icons/lu";
import { paquetDuJour, paquetsDisponibles, paquetsIllimites } from "@/lib/recompenses";
import { defiFait } from "@/lib/defis";
import { direBoutons } from "@/lib/reglages";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";
import { sons } from "@/lib/sons";
import { IconeAccueil, IconeArbre, IconeCarte, IconeCartes, IconeJouer, PastillePiece } from "@/components/icones-salles";
import { LuBookOpen, LuDices, LuGlobe, LuHouse } from "react-icons/lu";
import { useInterface } from "@/lib/interface";

/** Le petit arbre de la vie en rond, en traits blancs (pour le bouton 3D de l'Arbre). */
function GlypheArbre(props: { className?: string }) {
  const branches = Array.from({ length: 9 }, (_, i) => (i / 9) * Math.PI * 2 - Math.PI / 2);
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {branches.map((a, i) => <path key={i} d={`M12 12 L${12 + Math.cos(a) * (i % 2 ? 6 : 9)} ${12 + Math.sin(a) * (i % 2 ? 6 : 9)}`} />)}
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
const GLYPHES: Record<string, { Glyphe: (p: { className?: string }) => React.ReactElement; couleur: string }> = {
  "/": { Glyphe: LuHouse, couleur: "#ff6fa8" },
  "/arbre": { Glyphe: GlypheArbre, couleur: "#3fae5a" },
  "/voyageurs": { Glyphe: LuGlobe, couleur: "#3a8fe0" },
  "/cartes": { Glyphe: LuBookOpen, couleur: "#8a5ad8" },
  "/jouer": { Glyphe: LuDices, couleur: "#ff9a3a" },
};

/** Le moment où l'on a appuyé sur un bouton de la barre : la page suivante sortira du centre de l'écran. */
let appui = 0;
export const ouvertureDepuisBarre = () => Date.now() - appui < 900;

type Salle = { vers: string; label: string; dit: string; Icone: () => React.ReactElement; actif: (c: string) => boolean };

const SALLES: Salle[] = [
  { vers: "/", label: "Accueil", dit: "L'accueil", Icone: IconeAccueil, actif: (c) => c === "/" || c === "" },
  { vers: "/arbre", label: "Arbre", dit: "L'arbre de la vie", Icone: IconeArbre, actif: (c) => c.startsWith("/arbre") || c.startsWith("/frise") },
  { vers: "/voyageurs", label: "Carte", dit: "La carte du monde des animaux", Icone: IconeCarte, actif: (c) => c.startsWith("/voyageurs") || c.startsWith("/aventure") || c.startsWith("/suivi") },
  { vers: "/cartes", label: "Cartes", dit: "Mes cartes", Icone: IconeCartes, actif: (c) => c.startsWith("/cartes") },
  { vers: "/jouer", label: "Jouer", dit: "Les jeux", Icone: IconeJouer, actif: (c) => c.startsWith("/jouer") },
];

/** Les petites pastilles : paquets à ouvrir, défi du jour qui attend. Elles se mettent à jour toutes seules. */
function usePastilles() {
  const lire = () => ({ paquets: (paquetsIllimites() ? 0 : paquetsDisponibles()) + (paquetDuJour() ? 1 : 0), defi: !defiFait() });
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

  const [enfonce, setEnfonce] = useState<string | null>(null);
  const reglage = useInterface();
  function toucher(salle: Salle) {
    appui = Date.now();
    sons.clic();
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
      <ul className="barre-jeu relative grid h-[4.5rem] grid-cols-5 items-center rounded-[1.8rem] px-1">
        {/* La bulle dorée qui glisse jusqu'à la salle où l'on est */}
        {SALLES.findIndex((x) => x.actif(chemin)) >= 0 ? (
          <span aria-hidden="true" className="bulle-barre pointer-events-none absolute top-1/2 h-14 w-[20%]" style={{ left: `calc(0.25rem + ${SALLES.findIndex((x) => x.actif(chemin))} * (100% - 0.5rem) / 5)` }}>
            <span className="absolute inset-x-[14%] inset-y-0 rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,rgba(243,212,138,.55),rgba(160,110,255,.28)_60%,transparent_75%)]" />
          </span>
        ) : null}
        {SALLES.map((salle) => {
          const actif = salle.actif(chemin);
          const pastille =
            salle.vers === "/cartes" && paquets > 0 ? (
              <span className="pastille-barre absolute -right-2 -top-2"><PastillePiece n={paquets} /></span>
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
            <li key={salle.vers} className="relative z-10">
              <a
                href={`#${salle.vers}`}
                onClick={() => toucher(salle)}
                onPointerDown={() => setEnfonce(salle.vers)}
                onPointerUp={() => setEnfonce(null)}
                onPointerLeave={() => setEnfonce(null)}
                aria-current={actif ? "page" : undefined}
                aria-label={salle.label + aide}
                className="flex flex-col items-center gap-0.5 py-1 font-display text-[12.5px] font-semibold"
              >
                <span className={`icone-barre relative block ${actif ? "icone-active" : ""} ${saut === salle.vers ? "saut" : ""}`}>
                  {reglage.boutons === "3d" ? (
                    <span className={`bouton3d ${reglage.vedette === salle.vers ? "bouton3d-vedette" : ""} ${actif ? "bouton3d-actif" : ""} ${enfonce === salle.vers ? "bouton3d-enfonce" : ""}`} style={{ ["--couleur" as string]: GLYPHES[salle.vers].couleur }}>
                      <span className="bouton3d-chapeau grid place-items-center">{(() => { const G = GLYPHES[salle.vers].Glyphe; return <G className="bouton3d-glyphe" />; })()}</span>
                    </span>
                  ) : (
                    <span className={`poussoir block size-11 ${reglage.vedette === salle.vers ? "bouton3d-vedette" : ""} ${actif ? "poussoir-actif" : ""} ${enfonce === salle.vers ? "poussoir-enfonce" : ""}`}><salle.Icone /></span>
                  )}
                  {saut === salle.vers ? <span aria-hidden="true" className="etincelles-barre">{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} style={{ ["--a" as string]: `${k * 60}deg` }} />)}</span> : null}
                  {pastille}
                </span>
                <span className={`transition-colors ${actif ? "text-[#ffe9a8] [text-shadow:0_0_8px_rgba(243,195,90,.7)]" : "text-[#d9c7ff]/80"}`}>{salle.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

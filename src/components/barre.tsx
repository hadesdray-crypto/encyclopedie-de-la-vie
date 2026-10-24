
const SALLES: { vers: string; label: string; icone: string; actif: (c: string) => boolean }[] = [
  { vers: "/", label: "Accueil", icone: "theme/maison.webp", actif: (c) => c === "/" },
  { vers: "/arbre", label: "Arbre", icone: "theme/cristal.webp", actif: (c) => c.startsWith("/arbre") || c.startsWith("/frise") },
  { vers: "/jouer", label: "Jouer", icone: "theme/etoile.webp", actif: (c) => c.startsWith("/jouer") },
  { vers: "/cartes", label: "Cartes", icone: "theme/cartes.webp", actif: (c) => c.startsWith("/cartes") },
  { vers: "/profil", label: "Profil", icone: "theme/sourire.webp", actif: (c) => c.startsWith("/profil") },
];

/**
 * Barre du bas. Sa hauteur est fixée par --barre dans styles.css, et chaque page
 * garde en bas une marge de cette hauteur : la barre ne recouvre jamais un bouton.
 */
export function Barre({ chemin }: { chemin: string }) {
  return (
    <nav
      aria-label="Salles"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
    >
      <ul className="grid h-[4.5rem] grid-cols-5 items-center barre-bois rounded-[1.6rem] px-1 shadow-[0_10px_30px_rgba(0,0,0,.45)] backdrop-blur">
        {SALLES.map((salle) => {
          const actif = salle.actif(chemin);
          return (
            <li key={salle.vers}>
              <a
                href={`#${salle.vers}`}
                aria-current={actif ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-1 font-display text-[13px] font-semibold"
              >
                <img
                  src={salle.icone}
                  alt=""
                  className={`size-10 rounded-full object-cover ${actif ? "shadow-[0_0_16px_4px_rgba(160,110,255,.8)] ring-2 ring-[#f3d48a]" : "opacity-90"}`}
                />
                <span className={actif ? "text-[#f3d48a]" : "text-[#e7d7be]"}>{salle.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

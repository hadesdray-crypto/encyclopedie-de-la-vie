import { BoutonPlume } from "@/components/guide";
import { Installer } from "@/components/installer";

/*
 * Page d'accueil, dans le style de l'image de référence :
 * un grand médaillon au centre (le point de départ), six grandes branches autour,
 * reliées par des rubans de lumière, et des parchemins qui ouvrent les salles.
 * Les positions sont en pourcentage d'une scène de 1152 × 1190.
 */
const L = 1152;
const H = 1190;

type Medaillon = { vers: string; image: string; label: string; x: number; y: number; d: number; texte: "haut" | "bas" };

const CENTRE = { x: 574, y: 630, d: 360 };

const BRANCHES: Medaillon[] = [
  { vers: "/arbre/archees", image: "theme/archees.webp", label: "Archées", x: 577, y: 174, d: 250, texte: "haut" },
  { vers: "/arbre/bacteries", image: "theme/bacteries.webp", label: "Bactéries", x: 216, y: 434, d: 250, texte: "haut" },
  { vers: "/arbre/animaux", image: "theme/animaux.webp", label: "Animaux", x: 926, y: 436, d: 250, texte: "haut" },
  { vers: "/arbre/terre", image: "theme/terre.webp", label: "Avant la vie", x: 259, y: 853, d: 240, texte: "bas" },
  { vers: "/arbre/champignons", image: "theme/champignons.webp", label: "Champignons", x: 574, y: 978, d: 240, texte: "bas" },
  { vers: "/arbre/plantes", image: "theme/plantes.webp", label: "Plantes", x: 889, y: 856, d: 240, texte: "bas" },
];

type Parchemin = { vers: string; image: string; label: string; x: number; y: number; teinte: "parchemin" | "ardoise" | "lavande" };

const PARCHEMINS: Parchemin[] = [
  { vers: "/arbre/amphibiens", image: "theme/axolotl.webp", label: "Les amphibiens", x: 205, y: 155, teinte: "parchemin" },
  { vers: "/frise", image: "theme/adn.webp", label: "La frise du temps", x: 945, y: 155, teinte: "parchemin" },
  { vers: "/arbre/reptiles", image: "theme/tortue.webp", label: "Reptiles et dinosaures", x: 170, y: 640, teinte: "ardoise" },
  { vers: "/fossiles", image: "theme/livres.webp", label: "Albums et fossiles", x: 982, y: 648, teinte: "lavande" },
  { vers: "/arbre/hors", image: "theme/salamandre.webp", label: "Sortir de l'eau", x: 205, y: 1098, teinte: "parchemin" },
  { vers: "/jouer", image: "theme/loupe.webp", label: "Défis du jour", x: 942, y: 1092, teinte: "lavande" },
];

const px = (v: number) => `${(v / L) * 100}%`;
const py = (v: number) => `${(v / H) * 100}%`;

export function Accueil() {
  return (
    <main className="mx-auto max-w-xl px-3 pt-4">
      <header className="grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-2">
        <BoutonPlume taille="size-13" />
        <h1 className="titre-or whitespace-nowrap text-center text-[clamp(1.2rem,6vw,2.4rem)] leading-tight">Encyclopédie de la vie</h1>
        <img src="theme/coeur.webp" alt="" className="size-13 justify-self-end rounded-full mix-blend-screen" />
      </header>
      <p className="mt-0.5 text-center font-display text-lg text-[#f0d090]">Pour la princesse Leonie</p>
      <Installer />

      <div className="relative mx-auto mt-1 w-full" style={{ aspectRatio: `${L} / ${H}` }}>
        <svg viewBox={`0 0 ${L} ${H}`} className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <linearGradient id="ruban" x1="0" x2="1">
              <stop offset="0" stopColor="#7fd6ff" />
              <stop offset="1" stopColor="#c58cff" />
            </linearGradient>
          </defs>
          <circle cx={CENTRE.x} cy={CENTRE.y} r="400" fill="none" stroke="#e8c98a" strokeOpacity=".45" strokeWidth="3" strokeDasharray="6 12" />
          {BRANCHES.map((b) => (
            <g key={b.vers} className="ruban">
              <line x1={CENTRE.x} y1={CENTRE.y} x2={b.x} y2={b.y} stroke="#9f7bff" strokeWidth="22" strokeOpacity=".55" filter="url(#halo)" />
              <path d={eclair(CENTRE.x, CENTRE.y, b.x, b.y)} stroke="url(#ruban)" strokeWidth="5" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </svg>

        {PARCHEMINS.map((p) => (
          <a
            key={p.vers}
            href={`#${p.vers}`}
            className={`rouleau rouleau-${p.teinte} absolute flex w-[27%] -translate-x-1/2 -translate-y-1/2 items-center gap-1 px-1 py-1`}
            style={{ left: px(p.x), top: py(p.y) }}
          >
            <img src={p.image} alt="" className="aspect-square w-[34%] shrink-0 rounded-lg object-cover" />
            <span className="font-display text-[clamp(.74rem,2.8vw,1.05rem)] font-semibold leading-[1.1]">{p.label}</span>
          </a>
        ))}

        {BRANCHES.map((b, i) => (
          <a
            key={b.vers}
            href={`#${b.vers}`}
            className="orbit bob-x absolute"
            style={{ left: px(b.x), top: py(b.y), width: px(b.d * 0.84), animationDelay: `${i * 0.25}s` }}
          >
            <span className="medaillon-or block aspect-square w-full overflow-hidden">
              <img src={b.image} alt="" className="size-full object-cover" />
            </span>
            <span
              className={`titre-or absolute left-1/2 w-[150%] -translate-x-1/2 text-center text-[clamp(.75rem,3vw,1.25rem)] [text-shadow:0_1px_4px_#000,0_0_10px_#120c2c] font-semibold leading-none ${b.texte === "haut" ? "bottom-full mb-1" : "top-full mt-1"}`}
            >
              {b.label}
            </span>
          </a>
        ))}

        <a
          href="#/arbre/terre"
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: px(CENTRE.x), top: py(CENTRE.y), width: px(CENTRE.d * 0.9) }}
          aria-label="Commencer au tout début de la vie"
        >
          <span className="medaillon-or glow relative block aspect-square w-full overflow-hidden">
            <img src="theme/lune.webp" alt="" className="size-full scale-110 object-cover" />
            <span className="titre-or absolute inset-x-0 bottom-[9%] text-center text-[clamp(.85rem,3.8vw,1.6rem)] font-semibold">Commencer</span>
          </span>
        </a>
      </div>

      <nav className="mx-auto mt-3 grid grid-cols-2 gap-3" aria-label="Les grandes salles">
        <a href="#/mammiferes" className="bouton-bois rounded-[1.4rem] whitespace-nowrap px-2 py-4 text-center font-display text-[clamp(1rem,4.6vw,1.8rem)]">
          Les mammifères
        </a>
        <a href="#/lexique" className="bouton-parchemin rounded-[1.4rem] whitespace-nowrap px-2 py-4 text-center font-display text-[clamp(1rem,4.6vw,1.8rem)]">
          Le lexique
        </a>
      </nav>
    </main>
  );
}

/** Un ruban de lumière un peu ondulé entre deux points. */
function eclair(x1: number, y1: number, x2: number, y2: number) {
  const n = 6;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const long = Math.hypot(dx, dy) || 1;
  const nx = -dy / long;
  const ny = dx / long;
  let d = `M${x1} ${y1}`;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const ecart = (i % 2 ? 1 : -1) * 14;
    d += ` L${(x1 + dx * t + nx * ecart).toFixed(1)} ${(y1 + dy * t + ny * ecart).toFixed(1)}`;
  }
  return `${d} L${x2} ${y2}`;
}

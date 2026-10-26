// Les cartes de collection : un recto façon « carte à collectionner » (nom, poids, photo, deux talents, trois infos),
// avec des effets brillants selon la rareté, et plusieurs dos au choix.
// Toutes les infos viennent du catalogue : rien n'est inventé. Quand on ne sait pas : « Non connu ».
import { useId } from "react";
import { LuBaby, LuCircleHelp, LuHourglass, LuMountain, LuShield, LuSparkles, LuStar, LuTreeDeciduous, LuTrees, LuUtensils, LuWaves, LuWind } from "react-icons/lu";
import { FAMILLES, ESPECES, type Espece } from "@/data/catalogue";
import { EMOJI_REGIME, REGIMES } from "@/data/fiches-vie";
import { CarteMonde } from "@/components/carte-monde";
import { ETAPES, FRISE } from "@/data/arbre";
import estimations from "@/data/estimations.json";
import { Portrait } from "@/components/portrait";
import { PlumeDessin } from "@/components/plume-dessin";
import { niveauDe } from "@/components/carte-animal";

const EST = estimations as Record<string, Record<string, { t: string }>>;
const NUMERO = new Map(ESPECES.map((e, i) => [e.id, i + 1]));

/** Un petit motif dessiné, répété sur le fond de la carte (montagnes, feuilles, nuages, vagues, étoiles). */
const motif = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'>${svg}</svg>`)}")`;
const MOTIFS = {
  sol: motif("<path d='M0 48 L14 28 L22 38 L34 18 L50 48Z' fill='#fff' fill-opacity='.22'/>"),
  arbres: motif("<g fill='#fff' fill-opacity='.22'><ellipse cx='16' cy='16' rx='10' ry='5' transform='rotate(-35 16 16)'/><ellipse cx='44' cy='42' rx='10' ry='5' transform='rotate(35 44 42)'/></g>"),
  vol: motif("<g fill='#fff' fill-opacity='.3'><circle cx='14' cy='20' r='7'/><circle cx='24' cy='16' r='9'/><circle cx='34' cy='21' r='6'/><circle cx='44' cy='48' r='4'/><circle cx='51' cy='45' r='5'/></g>"),
  mer: motif("<path d='M0 20 Q15 10 30 20 T60 20 M0 45 Q15 35 30 45 T60 45' fill='none' stroke='#fff' stroke-opacity='.3' stroke-width='3'/>"),
  etoiles: motif("<g fill='#fff' fill-opacity='.3'><path d='M15 8 L17 14 L23 15 L17 17 L15 23 L13 17 L7 15 L13 14Z'/><circle cx='44' cy='42' r='2.5'/></g>"),
};

/** Le « type » de la carte : là où l'animal passe sa vie (donnée du catalogue). Il donne la couleur et le motif du fond. */
const MILIEUX: Record<string, { nom: string; Icone: typeof LuMountain; c1: string; c2: string; accent: string; motif: string }> = {
  "Surtout au sol.": { nom: "Au sol", Icone: LuMountain, c1: "#fff1c4", c2: "#f0a548", accent: "#b8601a", motif: MOTIFS.sol },
  "Surtout dans les arbres.": { nom: "Dans les arbres", Icone: LuTreeDeciduous, c1: "#e4fbc8", c2: "#5cbf55", accent: "#2b8a3e", motif: MOTIFS.arbres },
  "Surtout en vol.": { nom: "En vol", Icone: LuWind, c1: "#e6f3ff", c2: "#79aef5", accent: "#2f63c4", motif: MOTIFS.vol },
  "Au sol et dans les arbres.": { nom: "Sol et arbres", Icone: LuTrees, c1: "#f1fbc4", c2: "#9ccb4a", accent: "#5a8a1e", motif: MOTIFS.arbres },
  "Surtout dans la mer.": { nom: "Dans la mer", Icone: LuWaves, c1: "#d8f7ff", c2: "#3aa6dd", accent: "#0f6aa8", motif: MOTIFS.mer },
};
const SANS_MILIEU = { nom: "Non connu", Icone: LuCircleHelp, c1: "#f2eaff", c2: "#a689e6", accent: "#6a48c0", motif: MOTIFS.etoiles };
export const milieuDe = (e: Espece) => MILIEUX[e.milieu ?? ""] ?? SANS_MILIEU;

/** Le cadre de chaque rareté : un métal, du plus simple au plus précieux. */
const METAUX = ["argent", "acier", "or", "amethyste", "arcenciel"] as const;

const STATUT: Record<string, { court: string; couleur: string }> = {
  "Préoccupation mineure": { court: "Pas menacé", couleur: "#2e8b3a" },
  "Quasi menacé": { court: "Presque menacé", couleur: "#7a9a10" },
  "Vulnérable": { court: "Vulnérable", couleur: "#c98a00" },
  "En danger": { court: "En danger", couleur: "#d9541a" },
  "En danger critique": { court: "Très en danger", couleur: "#c8261b" },
  "Éteint à l'état sauvage": { court: "Plus dans la nature", couleur: "#6b2a7a" },
  "Éteint": { court: "Disparu", couleur: "#333" },
  "Données insuffisantes": { court: "Non connu", couleur: "#77708a" },
  "Non évalué": { court: "Non connu", couleur: "#77708a" },
};

function poids(e: Espece) {
  const m = e.masse ?? EST[e.id]?.masse?.t;
  if (!m) return { valeur: "?", unite: "", estime: false };
  const t = m.match(/([\d\s]+(?:,\d+)?)\s*(kg|g|t)\b/);
  if (!t) return { valeur: m.replace(/^environ /, ""), unite: "", estime: !e.masse };
  return { valeur: t[1].trim(), unite: t[2], estime: !e.masse };
}
function ouCourt(e: Espece) {
  const t = e.ou.split(":")[0].split(". ")[0].trim().replace(/\.$/, "");
  return t || "Non connu";
}
function mangeCourt(e: Espece) {
  const r = e.regime ?? EST[e.id]?.regime?.t;
  const nom = r ? REGIMES[r as keyof typeof REGIMES]?.nom : undefined;
  return nom ? `${e.regime ? "" : "≈ "}${nom}` : "Non connu";
}
const petits = (e: Espece) => (e.portee ? e.portee.replace(/^en moyenne /, "≈ ").replace(/\.(\d)/, ",$1") : "Non connu");
const age = (e: Espece) => (e.longevite ? e.longevite.replace(/^record connu : (environ )?/, "") : "Non connu");

/** Pourquoi cette carte est spéciale : en une phrase courte, avec les vraies données (nombre de pays, poids, menace). */
export function raisonSpeciale(espece: Espece, rarete: string | null, special?: string | null, chance?: boolean): string | null {
  const morceaux: string[] = [];
  if (chance) morceaux.push("Carte chance, très rare dans un paquet");
  if (special === "Le plus fort") morceaux.push("Un des 12 mammifères les plus lourds");
  if (special === "Le plus petit") morceaux.push("Un des 12 mammifères les plus légers");
  const pays = espece.pays?.length || Number(espece.ou.match(/(\d+)\s+pays/)?.[1] ?? 0);
  if (niveauDe(rarete).rang >= 2 && pays) morceaux.push(pays === 1 ? "Il ne vit que dans 1 seul pays" : `Il ne vit que dans ${pays} pays`);
  if (["En danger", "En danger critique", "Éteint à l'état sauvage"].includes(espece.statut ?? "")) morceaux.push(espece.statut === "En danger critique" ? "Il est très en danger" : "Il est en danger");
  return morceaux.length ? morceaux.join(" · ") : null;
}

const NOM_RARETE = ["Commune", "Jolie", "Rare", "Super rare", "Légendaire"];
const regimeId = (e: Espece) => e.regime ?? EST[e.id]?.regime?.t;

/**
 * La visite de la carte : ce que Plume dit, morceau par morceau, et le morceau de la carte qui s'allume pendant qu'elle en parle.
 * Chaque phrase explique à quoi sert la zone, puis ce qu'elle dit pour CET animal (vraies données).
 */
export function visiteCarte(espece: Espece, rarete: string | null, special?: string | null, chance?: boolean) {
  const n = niveauDe(rarete);
  const m = milieuDe(espece);
  const p = poids(espece);
  const r = regimeId(espece);
  const statut = STATUT[espece.statut ?? ""];
  const raison = raisonSpeciale(espece, rarete, special, chance);
  const l: [string, string][] = [
    ["nom", `En haut, en gros : son nom, ${espece.nom}. Juste au-dessus, en petit : sa famille, ${FAMILLES[espece.famille]?.nom ?? espece.famille}.`],
    ["poids", p.valeur === "?" ? "Le nombre rouge, c'est son poids. Pour lui, on ne le connaît pas : il y a un point d'interrogation." : `Le nombre rouge, c'est le poids d'un adulte : ${p.estime ? "environ " : ""}${p.valeur} ${p.unite === "kg" ? "kilos" : p.unite === "g" ? "grammes" : p.unite}.${p.estime ? " Le signe ≈ veut dire que c'est une estimation." : ""}`],
    ["milieu", `Le rond avec un dessin dit où il passe sa vie : ${m.nom.toLowerCase()}. La couleur de la carte change avec : orange pour le sol, vert pour les arbres, bleu ciel pour le vol, bleu pour la mer, violet quand on ne sait pas.`],
    ["photo", "Au milieu, sa photo : un vrai animal, photographié dans la nature ou dans un parc."],
    ["latin", `Sur le ruban : son nom scientifique, ${espece.latin}. C'est le même dans toutes les langues du monde.`],
    ["vit", espece.pays?.length ? `La petite carte du monde montre en or les pays où il vit. Ici : ${ouCourt(espece)}.` : `Il vit : ${ouCourt(espece)}. On ne connaît pas encore la liste exacte de ses pays, alors la petite carte reste sans or.`],
    ["mange", r ? `Le petit dessin montre ce qu'il mange. ${REGIMES[r as keyof typeof REGIMES]?.nom ?? ""} : ${REGIMES[r as keyof typeof REGIMES]?.explique ?? ""}` : "Ce qu'il mange : on ne le sait pas encore."],
    ["menace", statut ? `Le bouclier dit s'il est menacé dans la nature. Pour lui : ${statut.court.toLowerCase()}. Vert, c'est bien. Jaune, orange et rouge : il faut le protéger.` : "Le bouclier dit s'il est menacé. Pour lui, on ne sait pas."],
    ["petits", espece.portee ? `Le biberon : combien de bébés la maman a en même temps, en moyenne. Ici : ${petits(espece).replace("≈ ", "environ ")}.` : "Le biberon : combien de bébés à la fois. Pour lui, on ne sait pas encore."],
    ["age", espece.longevite ? `Le sablier : l'âge record connu. Le plus vieux a vécu ${age(espece)}.` : "Le sablier : l'âge record. Pour lui, on ne le connaît pas."],
  ];
  if (raison) l.push(["raison", `L'encadré doré dit pourquoi la carte est spéciale : ${raison}.`]);
  l.push(["rarete", `En bas, les étoiles et la couleur du cadre disent la rareté. Argent : commune. Bleu : jolie. Or : rare. Violet : super rare. Arc-en-ciel : légendaire. Celle-ci est ${chance ? "une carte chance, toute en or" : NOM_RARETE[n.rang].toLowerCase()}, avec ${n.etoiles} étoile${n.etoiles > 1 ? "s" : ""}.`]);
  l.push(["numero", `Tout en bas à droite : son numéro dans la collection, sur ${ESPECES.length} cartes en tout.`]);
  return { etapes: l.map(([, t]) => t), zones: l.map(([z]) => z) };
}

/** Le recto : comme une carte à collectionner. Chaque zone porte un nom (data-zone) pour que Plume puisse l'allumer quand elle en parle. */
export function CarteCollection({ espece, rarete, special, chance }: { espece: Espece; rarete: string | null; special?: string | null; chance?: boolean }) {
  const n = niveauDe(rarete);
  const m = milieuDe(espece);
  const p = poids(espece);
  const statut = STATUT[espece.statut ?? ""] ?? { court: "Non connu", couleur: "#77708a" };
  const raison = raisonSpeciale(espece, rarete, special, chance);
  const metal = chance ? "or-chance" : METAUX[n.rang];
  const taille = espece.nom.length <= 10 ? 7 : espece.nom.length <= 14 ? 6 : espece.nom.length <= 18 ? 5.2 : 4.6;
  const r = regimeId(espece);
  return (
    <span className={`cc metal-${metal} rang-${n.rang} ${chance ? "cc-chance" : ""} relative block`} style={{ ["--c1" as string]: m.c1, ["--c2" as string]: m.c2, ["--accent" as string]: m.accent, ["--motif" as string]: m.motif }}>
      <span className="cc-cadre absolute inset-0" data-zone="rarete" />
      {n.rang >= 3 || chance ? <span className="cc-grave absolute inset-0" aria-hidden="true" /> : null}
      <span className="cc-corps absolute flex flex-col">
        <span className="cc-fond absolute inset-0" aria-hidden="true" />
        {n.rang >= 2 || chance ? <span className="cc-fond-holo absolute inset-0" aria-hidden="true" /> : null}

        <span className="cc-tete relative flex items-end">
          <span className="min-w-0 flex-1" data-zone="nom">
            <span className="cc-famille block truncate">{FAMILLES[espece.famille]?.nom ?? espece.famille}</span>
            <span className="cc-nom block font-display" style={{ fontSize: `${taille}cqw` }}>{espece.nom}</span>
          </span>
          <span className="cc-poids flex items-baseline" data-zone="poids"><small>{p.estime ? "≈" : ""}</small><b>{p.valeur}</b><small>{p.unite}</small></span>
          <span className="cc-embleme grid place-items-center" data-zone="milieu" title={m.nom}><m.Icone aria-hidden="true" /></span>
        </span>

        <span className="cc-fenetre relative block" data-zone="photo">
          <Portrait id={espece.id} couvrir />
          <span className="cc-fenetre-lumiere absolute inset-0" aria-hidden="true" />
          {chance ? <span className="cc-badge absolute">★ Chance !</span> : special ? <span className="cc-badge absolute">{special}</span> : null}
          <span className="cc-type absolute flex items-center"><m.Icone aria-hidden="true" />{m.nom}</span>
        </span>
        <span className="cc-ruban relative block truncate" data-zone="latin"><i>{espece.latin}</i></span>

        <span className="cc-talents relative flex flex-col">
          <span className="cc-talent flex items-center" data-zone="vit">
            <span className="cc-minicarte"><CarteMonde pays={espece.pays ?? []} ou={espece.ou} /></span>
            <span className="cc-talent-nom">Il vit</span>
            <span className="cc-talent-valeur min-w-0 flex-1 truncate">{ouCourt(espece)}</span>
          </span>
          <span className="cc-talent flex items-center" data-zone="mange">
            <span className="cc-picto" aria-hidden="true">{r ? EMOJI_REGIME[r] ?? "🍽️" : "❔"}</span>
            <span className="cc-talent-nom">Il mange</span>
            <span className="cc-talent-valeur min-w-0 flex-1 truncate">{mangeCourt(espece)}</span>
          </span>
        </span>

        <span className="cc-infos relative grid grid-cols-3">
          <span data-zone="menace"><i className="cc-rond" style={{ background: statut.couleur }}><LuShield aria-hidden="true" /></i><em>Menacé ?</em><b style={{ color: statut.couleur }}>{statut.court}</b></span>
          <span data-zone="petits"><i className="cc-rond"><LuBaby aria-hidden="true" /></i><em>Bébés</em><b>{petits(espece)}</b></span>
          <span data-zone="age"><i className="cc-rond"><LuHourglass aria-hidden="true" /></i><em>Record d'âge</em><b>{age(espece)}</b></span>
        </span>

        {raison ? (
          <span className="cc-raison relative flex items-start" data-zone="raison"><LuSparkles aria-hidden="true" /><span><b>Pourquoi rare ? </b>{raison}</span></span>
        ) : null}

        <span className="cc-pied relative flex items-center">
          <span className="flex items-center" data-zone="rarete">
            <span className="cc-etoiles flex" aria-label={`${n.etoiles} étoiles`}>
              {Array.from({ length: 5 }, (_, i) => <LuStar key={i} className={i < n.etoiles ? "plein" : ""} aria-hidden="true" />)}
            </span>
            <b className="ml-[1cqw]">{chance ? "Chance" : n.nom}</b>
          </span>
          <span className="ml-auto" data-zone="numero">N° {String(NUMERO.get(espece.id) ?? 0).padStart(4, "0")}/{ESPECES.length}</span>
        </span>
      </span>
      <span className="cc-effets pointer-events-none absolute inset-0" aria-hidden="true">
        {n.rang >= 3 || chance ? <span className="cc-paillettes absolute inset-0" /> : null}
        {n.rang >= 4 || chance ? <span className="cc-arc absolute inset-0" /> : null}
        <span className="cc-reflet absolute inset-0" />
        {n.rang >= 3 || chance ? [[8, 12, 0], [92, 20, 0.6], [10, 56, 1.2], [90, 52, 0.3], [50, 4, 0.9]].map(([x, y, d], i) => <i key={i} className="carte-etincelle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />) : null}
      </span>
    </span>
  );
}

// ------------------------------------------------------------------ Les dos

export type Dos = "arbre" | "plume" | "spirale" | "boussole";
export const DOS: { id: Dos; nom: string }[] = [
  { id: "arbre", nom: "L'arbre de la vie" },
  { id: "spirale", nom: "La spirale du temps" },
  { id: "plume", nom: "Le blason de Plume" },
  { id: "boussole", nom: "La boussole du monde" },
];

/** Le cadre doré commun à tous les dos, avec ses quatre coins. */
function CadreDos({ children, fond }: { children: React.ReactNode; fond: string }) {
  const coin = "M0 40 V8 A8 8 0 0 1 8 0 H40 M10 40 V14 A4 4 0 0 1 14 10 H40";
  return (
    <svg viewBox="0 0 630 880" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="dos-or" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2c2" /><stop offset=".35" stopColor="#e3b04b" /><stop offset=".6" stopColor="#fff0b8" /><stop offset="1" stopColor="#b07a1c" />
        </linearGradient>
        <radialGradient id="dos-lueur" cx=".5" cy=".5" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="630" height="880" rx="34" fill="url(#dos-or)" />
      <rect x="16" y="16" width="598" height="848" rx="24" fill={fond} />
      <rect x="16" y="16" width="598" height="848" rx="24" fill="url(#dos-lueur)" />
      <rect x="30" y="30" width="570" height="820" rx="16" fill="none" stroke="url(#dos-or)" strokeWidth="2" opacity=".8" />
      {[[40, 40, 0], [590, 40, 90], [590, 840, 180], [40, 840, 270]].map(([x, y, r]) => (
        <path key={`${x}${y}`} d={coin} transform={`translate(${x} ${y}) rotate(${r})`} fill="none" stroke="url(#dos-or)" strokeWidth="3" />
      ))}
      {children}
    </svg>
  );
}

/** Un texte écrit le long d'un cercle (en haut ou en bas). */
function TexteRond({ id, r, texte, bas, taille = 26 }: { id: string; r: number; texte: string; bas?: boolean; taille?: number }) {
  const d = bas ? `M ${315 - r} 440 A ${r} ${r} 0 0 0 ${315 + r} 440` : `M ${315 - r} 440 A ${r} ${r} 0 0 1 ${315 + r} 440`;
  return (
    <>
      <path id={id} d={d} fill="none" />
      <text fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize={taille} letterSpacing="3" fill="url(#dos-or)">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{texte}</textPath>
      </text>
    </>
  );
}

// L'arbre de la vie en rond, calculé à partir du vrai arbre de l'application (de LUCA jusqu'aux feuilles).
type Point = { id: string; a: number; r: number; enfants: Point[]; profondeur: number };
const COULEUR_BRANCHE: Record<string, string> = { bacteries: "#7ee0a0", archees: "#ffb36b", plantes: "#9be36b", champignons: "#e6b98a", animaux: "#ff9ccf", "autres-eucaryotes": "#9fd8ff" };
function disposer() {
  const feuilles: string[] = [];
  const prof = new Map<string, number>();
  const visite = (id: string, d: number) => {
    prof.set(id, d);
    const s = ETAPES[id]?.suite ?? [];
    if (!s.length) feuilles.push(id);
    s.forEach((c) => visite(c, d + 1));
  };
  visite("luca", 0);
  const max = Math.max(...prof.values());
  const angle = new Map(feuilles.map((f, i) => [f, (i / feuilles.length) * Math.PI * 2 - Math.PI / 2]));
  const construire = (id: string): Point => {
    const enfants = (ETAPES[id]?.suite ?? []).map(construire);
    const a = enfants.length ? (enfants[0].a + enfants[enfants.length - 1].a) / 2 : angle.get(id)!;
    return { id, a, r: enfants.length ? (prof.get(id)! / max) * 190 : 215, enfants, profondeur: prof.get(id)! };
  };
  return { racine: construire("luca"), nbFeuilles: feuilles.length };
}
const ARBRE = disposer();
function couleurDe(chemin: string[]) {
  for (const c of chemin) if (COULEUR_BRANCHE[c]) return COULEUR_BRANCHE[c];
  return "#f3d48a";
}
function Branches({ p, chemin }: { p: Point; chemin: string[] }) {
  const cx = 315, cy = 440;
  const pos = (a: number, r: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  return (
    <>
      {p.enfants.map((e) => {
        const ch = [...chemin, e.id];
        const coul = couleurDe(ch);
        const [x0, y0] = pos(p.a, p.r);
        const [x1, y1] = pos(e.a, p.r);
        const [x2, y2] = pos(e.a, e.r);
        const grand = Math.abs(e.a - p.a) > Math.PI ? 1 : 0;
        const sens = e.a > p.a ? 1 : 0;
        const ep = Math.max(1.4, 4.2 - e.profondeur * 0.28);
        return (
          <g key={e.id}>
            <path d={`M${x0} ${y0} A${p.r} ${p.r} 0 ${grand} ${sens} ${x1} ${y1} L${x2} ${y2}`} fill="none" stroke={coul} strokeWidth={ep} strokeLinecap="round" opacity=".95" />
            {e.enfants.length ? <Branches p={e} chemin={ch} /> : <circle cx={x2} cy={y2} r="6" fill={coul} stroke="#fff6dc" strokeWidth="1.5" />}
          </g>
        );
      })}
    </>
  );
}

function DosArbre() {
  return (
    <CadreDos fond="#1d1440">
      <circle cx="315" cy="440" r="262" fill="#120c2c" stroke="url(#dos-or)" strokeWidth="5" />
      <circle cx="315" cy="440" r="248" fill="none" stroke="url(#dos-or)" strokeWidth="1.5" opacity=".7" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * Math.PI * 2;
        return <line key={i} x1={315 + Math.cos(a) * 252} y1={440 + Math.sin(a) * 252} x2={315 + Math.cos(a) * (i % 6 ? 256 : 260)} y2={440 + Math.sin(a) * (i % 6 ? 256 : 260)} stroke="#e3b04b" strokeWidth="2" />;
      })}
      <circle cx="315" cy="440" r="228" fill="none" stroke="#f3d48a" strokeOpacity=".12" strokeDasharray="2 8" />
      <circle cx="315" cy="440" r="120" fill="none" stroke="#f3d48a" strokeOpacity=".12" strokeDasharray="2 8" />
      <Branches p={ARBRE.racine} chemin={["luca"]} />
      <circle cx="315" cy="440" r="16" fill="#fff2c2" />
      <circle cx="315" cy="440" r="26" fill="none" stroke="#fff2c2" strokeOpacity=".5" strokeWidth="2" />
      <TexteRond id="dos-haut" r={290} texte="ENCYCLOPÉDIE DE LA VIE" />
      <TexteRond id="dos-bas" r={300} texte="L'ARBRE DE LA VIE" bas taille={22} />
      <Etoiles />
    </CadreDos>
  );
}

/** La spirale du temps : de la naissance de la Terre (au centre) jusqu'à aujourd'hui (au bord), avec les vraies dates de l'arbre. */
function DosSpirale() {
  const tours = 3.2, rMax = 230;
  const pt = (t: number) => {
    const a = t * tours * Math.PI * 2 - Math.PI / 2;
    const r = 18 + t * rMax;
    return [315 + Math.cos(a) * r, 440 + Math.sin(a) * r];
  };
  const chemin = Array.from({ length: 400 }, (_, i) => pt(i / 399)).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const total = 4540;
  return (
    <CadreDos fond="#14243f">
      <circle cx="315" cy="440" r="262" fill="#0d1a30" stroke="url(#dos-or)" strokeWidth="5" />
      <path d={chemin} fill="none" stroke="url(#dos-or)" strokeWidth="7" strokeLinecap="round" />
      <path d={chemin} fill="none" stroke="#fff6dc" strokeWidth="1.5" strokeOpacity=".6" />
      {FRISE.map((e) => {
        const [x, y] = pt(1 - (e.ma ?? 0) / total);
        return <circle key={e.id} cx={x} cy={y} r="7" fill="#ffd56b" stroke="#0d1a30" strokeWidth="2" />;
      })}
      <circle cx={pt(0)[0]} cy={pt(0)[1]} r="13" fill="#ff8a4a" stroke="#fff2c2" strokeWidth="3" />
      <circle cx={pt(1)[0]} cy={pt(1)[1]} r="12" fill="#7ee0ff" stroke="#fff2c2" strokeWidth="3" />
      <TexteRond id="sp-haut" r={290} texte="ENCYCLOPÉDIE DE LA VIE" />
      <TexteRond id="sp-bas" r={300} texte="4,5 MILLIARDS D'ANNÉES" bas taille={22} />
      <Etoiles />
    </CadreDos>
  );
}

function DosBoussole() {
  const branche = (a: number, long: number, larg: number, c1: string, c2: string) => {
    const r = (d: number, l: number) => [315 + Math.cos(a + d) * l, 440 + Math.sin(a + d) * l];
    const [px, py] = r(0, long), [gx, gy] = r(Math.PI / 2, larg), [dx, dy] = r(-Math.PI / 2, larg);
    return (
      <g key={a}>
        <path d={`M315 440 L${gx} ${gy} L${px} ${py} Z`} fill={c1} />
        <path d={`M315 440 L${dx} ${dy} L${px} ${py} Z`} fill={c2} />
      </g>
    );
  };
  return (
    <CadreDos fond="#0f3a3a">
      <circle cx="315" cy="440" r="262" fill="#0a2a2c" stroke="url(#dos-or)" strokeWidth="5" />
      {[60, 120, 180, 230].map((r) => <circle key={r} cx="315" cy="440" r={r} fill="none" stroke="#e3b04b" strokeOpacity=".35" strokeWidth="1.5" />)}
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1="315" y1="440" x2={315 + Math.cos((i * Math.PI) / 6) * 240} y2={440 + Math.sin((i * Math.PI) / 6) * 240} stroke="#e3b04b" strokeOpacity=".25" />)}
      {[0, 1, 2, 3].map((i) => branche((i * Math.PI) / 2 + Math.PI / 4, 140, 22, "#b07a1c", "#f3d48a"))}
      {[0, 1, 2, 3].map((i) => branche((i * Math.PI) / 2 - Math.PI / 2, 215, 32, "#e3b04b", "#fff2c2"))}
      <circle cx="315" cy="440" r="22" fill="#0a2a2c" stroke="url(#dos-or)" strokeWidth="5" />
      {[["N", 315, 192], ["S", 315, 708], ["E", 572, 450], ["O", 58, 450]].map(([l, x, y]) => (
        <text key={l as string} x={x} y={y} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="30" fontWeight="700" fill="#fff2c2">{l}</text>
      ))}
      <TexteRond id="bo-haut" r={290} texte="ENCYCLOPÉDIE DE LA VIE" />
      <TexteRond id="bo-bas" r={300} texte="LE TOUR DU MONDE DES ANIMAUX" bas taille={20} />
      <Etoiles />
    </CadreDos>
  );
}

function DosPlume() {
  const id = useId();
  return (
    <span className="relative block size-full">
      <CadreDos fond="#3a1f6b">
        <defs>
          <pattern id={`${id}-losange`} width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="36" height="36" fill="#3a1f6b" /><rect width="18" height="18" fill="#432477" />
          </pattern>
        </defs>
        <rect x="31" y="31" width="568" height="818" rx="15" fill={`url(#${id}-losange)`} />
        <circle cx="315" cy="430" r="200" fill="#241245" stroke="url(#dos-or)" strokeWidth="6" />
        {Array.from({ length: 2 }, (_, s) => (
          <g key={s} transform={s ? "translate(630 0) scale(-1 1)" : undefined}>
            {Array.from({ length: 9 }, (_, i) => {
              const a = Math.PI * (0.62 + i * 0.075);
              const x = 315 + Math.cos(a) * 228, y = 430 + Math.sin(a) * 228;
              return <ellipse key={i} cx={x} cy={y} rx="22" ry="9" transform={`rotate(${(a * 180) / Math.PI + 70} ${x} ${y})`} fill="#e3b04b" stroke="#fff2c2" strokeWidth="1" />;
            })}
          </g>
        ))}
        <path d="M150 700 L480 700 L455 735 L480 770 L150 770 L175 735 Z" fill="#c43d7a" stroke="url(#dos-or)" strokeWidth="3" />
        <text x="315" y="746" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="28" fontWeight="700" fill="#fff2c2">Collection de Leonie</text>
        <TexteRond id="pl-haut" r={290} texte="ENCYCLOPÉDIE DE LA VIE" />
        <Etoiles />
      </CadreDos>
      <span className="absolute left-1/2 top-[49%] w-[52%] -translate-x-1/2 -translate-y-1/2"><PlumeDessin /></span>
    </span>
  );
}

function Etoiles() {
  return (
    <g fill="#fff2c2">
      {[[80, 110, 5], [550, 120, 4], [70, 770, 4], [560, 760, 5], [120, 210, 2.5], [520, 230, 3], [110, 680, 2.5], [520, 690, 3]].map(([x, y, r]) => (
        <path key={`${x}${y}`} d={`M${x} ${y - r * 2.2} L${x + r * 0.6} ${y - r * 0.6} L${x + r * 2.2} ${y} L${x + r * 0.6} ${y + r * 0.6} L${x} ${y + r * 2.2} L${x - r * 0.6} ${y + r * 0.6} L${x - r * 2.2} ${y} L${x - r * 0.6} ${y - r * 0.6} Z`} />
      ))}
    </g>
  );
}

/** Le dos d'une carte : le modèle choisi. */
export function DosCarte({ modele = "arbre" }: { modele?: Dos }) {
  return (
    <span className="tcg-dos relative block size-full">
      {modele === "plume" ? <DosPlume /> : modele === "spirale" ? <DosSpirale /> : modele === "boussole" ? <DosBoussole /> : <DosArbre />}
      <span className="tcg-reflet absolute inset-0" aria-hidden="true" />
    </span>
  );
}

// ------------------------------------------------------------------ La légende : des cartes qui expliquent les cartes

function CarteLegende({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <span className="cc metal-or relative block" style={{ ["--c1" as string]: "#fffaf0", ["--c2" as string]: "#f3d48a", ["--accent" as string]: "#8a5a10", ["--motif" as string]: MOTIFS.etoiles }}>
      <span className="cc-cadre absolute inset-0" />
      <span className="cc-corps absolute flex flex-col">
        <span className="cc-fond absolute inset-0" aria-hidden="true" />
        <span className="cc-legende-titre relative block text-center font-display">{titre}</span>
        <span className="cc-legende relative flex flex-1 flex-col justify-evenly">{children}</span>
      </span>
    </span>
  );
}
const Ligne = ({ signe, children }: { signe: React.ReactNode; children: React.ReactNode }) => (
  <span className="cc-legende-ligne flex items-center"><span className="cc-legende-signe grid shrink-0 place-items-center">{signe}</span><span className="min-w-0 flex-1">{children}</span></span>
);

/** Trois cartes « mode d'emploi » : les couleurs (milieux), les raretés et tous les petits dessins. */
export function LegendeCartes() {
  const milieux = [...Object.values(MILIEUX), SANS_MILIEU];
  return (
    <>
      <CarteLegende titre="Les couleurs : où il vit">
        {milieux.map((m) => (
          <Ligne key={m.nom} signe={<span className="cc-embleme grid place-items-center" style={{ ["--accent" as string]: m.accent, width: "7cqw", height: "7cqw" }}><m.Icone aria-hidden="true" /></span>}>
            <span className="cc-legende-pastille" style={{ background: `linear-gradient(90deg, ${m.c2}, ${m.c1})` }}>{m.nom === "Non connu" ? "On ne sait pas" : m.nom}</span>
          </Ligne>
        ))}
      </CarteLegende>
      <CarteLegende titre="Les raretés">
        {(["argent", "acier", "or", "amethyste", "arcenciel", "or-chance"] as const).map((metal, i) => (
          <Ligne key={metal} signe={<span className={`cc-legende-metal metal-${metal}`} />}>
            <b>{i === 5 ? "Chance" : NOM_RARETE[i]}</b> {i < 5 ? <span className="cc-etoiles inline-flex align-middle">{Array.from({ length: 5 }, (_, k) => <LuStar key={k} className={k <= i ? "plein" : ""} aria-hidden="true" />)}</span> : "★"}
            <small className="block">{["Il vit dans plus de 40 pays", "Il vit dans 16 à 40 pays", "Il vit dans 9 à 15 pays", "Il vit dans 6 à 8 pays", "Il vit dans 5 pays ou moins", "Tirée au hasard, très rare"][i]}</small>
          </Ligne>
        ))}
      </CarteLegende>
      <CarteLegende titre="Les petits dessins">
        <Ligne signe={<b className="text-[#c0161b]">kg</b>}>Le nombre rouge : son <b>poids</b> d'adulte. ≈ veut dire « environ ».</Ligne>
        <Ligne signe={<span className="cc-minicarte" style={{ width: "9cqw" }}><CarteMonde pays={["FRA", "ESP", "ITA"]} /></span>}>La petite carte : en or, les <b>pays où il vit</b>.</Ligne>
        <Ligne signe={<span className="text-[4.4cqw]">🥩🌿🐜</span>}><b>Ce qu'il mange</b> : 🥩 viande · 🐟 poisson · 🐜 insectes · 🦑 bêtes sans os · 🌿 plantes · 🍃 feuilles · 🍎 fruits · 🌾 herbe · 🌸 nectar · 🍽️ un peu de tout</Ligne>
        <Ligne signe={<i className="cc-rond" style={{ background: "#d9541a", ["--accent" as string]: "#d9541a" }}><LuShield aria-hidden="true" /></i>}><b>Menacé ?</b> Vert : pas menacé. Jaune, orange, rouge : il faut le protéger.</Ligne>
        <Ligne signe={<i className="cc-rond" style={{ ["--accent" as string]: "#8a5a10" }}><LuBaby aria-hidden="true" /></i>}><b>Bébés</b> : combien à la fois, en moyenne.</Ligne>
        <Ligne signe={<i className="cc-rond" style={{ ["--accent" as string]: "#8a5a10" }}><LuHourglass aria-hidden="true" /></i>}><b>Record d'âge</b> : le plus vieux connu.</Ligne>
        <Ligne signe={<LuSparkles className="size-[4.5cqw] text-[#d4880c]" aria-hidden="true" />}>L'encadré doré : <b>pourquoi la carte est rare</b>.</Ligne>
      </CarteLegende>
    </>
  );
}

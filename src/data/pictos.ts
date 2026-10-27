// Les pictogrammes de toute l'application : un seul endroit, pour que les cartes, les fiches, les jeux
// et les légendes utilisent toujours le même dessin et la même couleur pour la même chose.
import { LuCircleHelp, LuDroplets, LuMountain, LuTreeDeciduous, LuWaves, LuWind } from "react-icons/lu";
import type { IconType } from "react-icons";
import type { Espece } from "@/data/catalogue";
import habitatsEnPlus from "@/data/habitats.json";

/** Un petit motif dessiné, répété en fond (montagnes, feuilles, nuages, vagues, gouttes, étoiles). */
const motif = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'>${svg}</svg>`)}")`;
export const MOTIFS = {
  sol: motif("<path d='M0 48 L14 28 L22 38 L34 18 L50 48Z' fill='#fff' fill-opacity='.22'/>"),
  arbres: motif("<g fill='#fff' fill-opacity='.22'><ellipse cx='16' cy='16' rx='10' ry='5' transform='rotate(-35 16 16)'/><ellipse cx='44' cy='42' rx='10' ry='5' transform='rotate(35 44 42)'/></g>"),
  vol: motif("<g fill='#fff' fill-opacity='.3'><circle cx='14' cy='20' r='7'/><circle cx='24' cy='16' r='9'/><circle cx='34' cy='21' r='6'/><circle cx='44' cy='48' r='4'/><circle cx='51' cy='45' r='5'/></g>"),
  mer: motif("<path d='M0 20 Q15 10 30 20 T60 20 M0 45 Q15 35 30 45 T60 45' fill='none' stroke='#fff' stroke-opacity='.3' stroke-width='3'/>"),
  eaudouce: motif("<g fill='#fff' fill-opacity='.28'><path d='M15 8 Q22 18 15 24 Q8 18 15 8Z'/><path d='M44 34 Q50 43 44 48 Q38 43 44 34Z'/></g>"),
  etoiles: motif("<g fill='#fff' fill-opacity='.3'><path d='M15 8 L17 14 L23 15 L17 17 L15 23 L13 17 L7 15 L13 14Z'/><circle cx='44' cy='42' r='2.5'/></g>"),
};

export type HabitatId = "sol" | "arbres" | "vol" | "mer" | "eaudouce" | "inconnu";
export type Habitat = { id: HabitatId; nom: string; phrase: string; Icone: IconType; c1: string; c2: string; accent: string; motif: string };

/** Les habitats : là où l'animal passe sa vie. Chacun a son dessin, sa couleur et son motif, partout dans l'application. */
export const HABITATS: Record<HabitatId, Habitat> = {
  sol: { id: "sol", nom: "Au sol", phrase: "au sol", Icone: LuMountain, c1: "#fff1c4", c2: "#f0a548", accent: "#b8601a", motif: MOTIFS.sol },
  arbres: { id: "arbres", nom: "Dans les arbres", phrase: "dans les arbres", Icone: LuTreeDeciduous, c1: "#e4fbc8", c2: "#5cbf55", accent: "#2b8a3e", motif: MOTIFS.arbres },
  vol: { id: "vol", nom: "En vol", phrase: "en volant", Icone: LuWind, c1: "#e6f3ff", c2: "#79aef5", accent: "#2f63c4", motif: MOTIFS.vol },
  mer: { id: "mer", nom: "Dans la mer", phrase: "dans la mer", Icone: LuWaves, c1: "#d8f7ff", c2: "#3aa6dd", accent: "#0f6aa8", motif: MOTIFS.mer },
  eaudouce: { id: "eaudouce", nom: "Eau douce", phrase: "dans l'eau douce (rivières, lacs)", Icone: LuDroplets, c1: "#dcfbf6", c2: "#3fc1b0", accent: "#11887a", motif: MOTIFS.eaudouce },
  inconnu: { id: "inconnu", nom: "Non connu", phrase: "on ne sait pas encore où", Icone: LuCircleHelp, c1: "#f2eaff", c2: "#a689e6", accent: "#6a48c0", motif: MOTIFS.etoiles },
};
export const ORDRE_HABITATS: HabitatId[] = ["sol", "arbres", "vol", "mer", "eaudouce", "inconnu"];

const DU_MILIEU: Record<string, HabitatId[]> = {
  "Surtout au sol.": ["sol"],
  "Surtout dans les arbres.": ["arbres"],
  "Surtout en vol.": ["vol"],
  "Au sol et dans les arbres.": ["sol", "arbres"],
  "Surtout dans la mer.": ["mer"],
};
const EN_PLUS = habitatsEnPlus as Record<string, { p?: HabitatId; a?: HabitatId[] }>;

/**
 * Les habitats d'un animal : le principal (où il cherche sa nourriture, d'après COMBINE),
 * puis ceux où il vit aussi (eau douce, mer, terre ferme, d'après PHYLACINE). Seulement des données publiées.
 */
export function habitatsDe(e: Espece): { principal: Habitat; autres: Habitat[] } {
  const base = DU_MILIEU[e.milieu ?? ""] ?? ["inconnu"];
  const plus = EN_PLUS[e.id];
  const premier = plus?.p ?? base[0];
  const liste = [premier, ...base.slice(1), ...(plus?.a ?? [])].filter((h, i, l) => l.indexOf(h) === i);
  return { principal: HABITATS[premier], autres: liste.slice(1).map((h) => HABITATS[h]) };
}

/** Menacé ? Le bouclier et sa couleur. */
export const STATUTS: Record<string, { court: string; couleur: string; phrase: string }> = {
  "Préoccupation mineure": { court: "Pas menacé", couleur: "#2e8b3a", phrase: "Bonne nouvelle : pour l'instant, il n'est pas menacé." },
  "Quasi menacé": { court: "Presque menacé", couleur: "#7a9a10", phrase: "Il est presque menacé : les scientifiques le surveillent." },
  "Vulnérable": { court: "Vulnérable", couleur: "#c98a00", phrase: "Il est vulnérable : il y en a de moins en moins, il faut le protéger." },
  "En danger": { court: "En danger", couleur: "#d9541a", phrase: "Attention : il est en danger. Il en reste peu dans la nature." },
  "En danger critique": { court: "Très en danger", couleur: "#c8261b", phrase: "Il est très en danger : il pourrait disparaître si on ne le protège pas." },
  "Éteint à l'état sauvage": { court: "Plus dans la nature", couleur: "#6b2a7a", phrase: "Il n'en reste plus dans la nature : seulement dans des parcs et des zoos." },
  "Éteint": { court: "Disparu", couleur: "#333", phrase: "Il a disparu : il n'en existe plus aujourd'hui." },
  "Données insuffisantes": { court: "Non connu", couleur: "#77708a", phrase: "" },
  "Non évalué": { court: "Non connu", couleur: "#77708a", phrase: "" },
};
export const statutDe = (s?: string) => STATUTS[s ?? ""] ?? { court: "Non connu", couleur: "#77708a", phrase: "" };

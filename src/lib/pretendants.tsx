// Les 6 prétendants de Plume. Ils viennent un par un frapper au nid ; on choisit si celui-ci peut rester ou non.
// S'il est refusé, il repart un peu triste et revient plus tard, après les cinq autres.
// Chacun a sa personnalité, son dessin (couleur, carrure, tenue) et, plus tard, sa façon de protéger la famille.
// Les textes parlent à « toi » : on n'y nomme jamais Leonie.
import type { ReactNode } from "react";
import type { Look } from "@/components/garde-robe";
import type { Caractere } from "@/components/plume-dessin";

export type Pretendant = {
  id: string;
  nom: string;
  /** Son petit nom de personnalité, pour le journal. */
  surnom: string;
  /** Ce qu'on raconte quand il frappe au nid. */
  arrivee: string;
  /** Ce qu'il dit de lui, pour le journal du nid. */
  journal: string;
  look: Look;
  /** Les gestes et les yeux : on réutilise les 4 caractères de Plume (1 timide, 2 rêveur, 3 sérieux). */
  caractere: Caractere;
  /** Un détail dessiné par-dessus. */
  extra?: ReactNode;
  joues: number;
};

const base = { chapeau: "aucun", lunettes: "aucune", chaussures: "aucune", objet: "aucun", couleurs: {} as Look["couleurs"] };

const SOURCILS_DOUX = <path d="M48 66 Q72 60 94 70 M152 66 Q128 60 106 70" stroke="#2a1650" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity=".85" />;
const BICEPS = (
  <g>
    <ellipse cx="26" cy="132" rx="17" ry="15" fill="#7e542c" stroke="#5a3a1c" strokeWidth="2.5" />
    <ellipse cx="174" cy="132" rx="17" ry="15" fill="#7e542c" stroke="#5a3a1c" strokeWidth="2.5" />
    <path d="M18 128 q8 -8 16 0 M166 128 q8 -8 16 0" stroke="#a87840" strokeWidth="3" fill="none" strokeLinecap="round" />
  </g>
);
const BAIES = (
  <g>
    <circle cx="170" cy="176" r="8" fill="#d2203a" stroke="#8a1020" strokeWidth="2" />
    <circle cx="184" cy="170" r="8" fill="#e23a52" stroke="#8a1020" strokeWidth="2" />
    <circle cx="178" cy="186" r="8" fill="#b01a30" stroke="#6a0c18" strokeWidth="2" />
    <path d="M170 168 l2 -6 M184 162 l2 -6" stroke="#3a8a3a" strokeWidth="3" strokeLinecap="round" />
  </g>
);

/** Dans l'ordre où ils se présentent la première fois. */
export const PRETENDANTS: Pretendant[] = [
  {
    id: "costaud", nom: "Gaspard", surnom: "le Costaud", caractere: 3, joues: 0.22, extra: BICEPS,
    arrivee: "Un grand hibou tout musclé vient de se poser sur le nid. Il s'appelle Gaspard. Pour impressionner Plume, il soulève une énorme branche… et il se la laisse tomber sur le pied. Il est très doux, au fond. Il aimerait bien rester un peu auprès d'elle.",
    journal: "Gaspard, un grand hibou très musclé mais très doux",
    look: { couleur: "brun", epaisseur: 4, ...base, haut: "tshirt", bas: "jean", chaussures: "baskets", objet: "batte", couleurs: { haut: "rouge", bas: "bleu" } },
  },
  {
    id: "savant", nom: "Merlin", surnom: "le Savant", caractere: 3, joues: 0.22,
    arrivee: "Un hibou à lunettes, un livre sous l'aile, vient de se poser sur la branche. Il s'appelle Merlin. Il se met à expliquer les étoiles à Plume, avec beaucoup trop de chiffres, et il s'emballe tout seul. Il aimerait bien rester un peu auprès d'elle.",
    journal: "Merlin, un hibou savant qui s'emballe",
    look: { couleur: "bleu", epaisseur: 1, ...base, haut: "medecin", lunettes: "rondes", objet: "livre", chaussures: "vernis" },
  },
  {
    id: "poete", nom: "Léandre", surnom: "le Poète", caractere: 2, joues: 0.3, extra: SOURCILS_DOUX,
    arrivee: "Un hibou rêveur arrive en tenant une fleur. Il s'appelle Léandre. Il fait de grands gestes et il récite quelque chose de très beau, ou de très bizarre : on ne sait pas trop. Il aimerait bien rester un peu auprès de Plume.",
    journal: "Léandre, un hibou poète et rêveur",
    look: { couleur: "turquoise", epaisseur: 1, ...base, haut: "echarpe", objet: "fleur", chapeau: "haut", couleurs: { haut: "violet", chapeau: "violet" } },
  },
  {
    id: "gourmand", nom: "Pistache", surnom: "le Gourmand", caractere: 2, joues: 0.3, extra: <>{SOURCILS_DOUX}{BAIES}</>,
    arrivee: "Un gros hibou rond, en tablier de cuisine, arrive les ailes pleines de baies et de graines. Il s'appelle Pistache. Il a apporté beaucoup trop de cadeaux… et il en a déjà mangé la moitié. Il aimerait bien rester un peu auprès de Plume.",
    journal: "Pistache, un hibou gourmand qui apporte trop de cadeaux",
    look: { couleur: "orange", epaisseur: 4, ...base, haut: "cuisine", chapeau: "toque", chaussures: "sandales" },
  },
  {
    id: "fanfaron", nom: "Hector", surnom: "le Fanfaron", caractere: 3, joues: 0.22,
    arrivee: "Un hibou en cape, avec des lunettes de soleil, atterrit en faisant l'important. Il s'appelle Hector. Il dit qu'il est le plus fort de toute la forêt… puis il rate son atterrissage. Il aimerait bien rester un peu auprès de Plume.",
    journal: "Hector, un hibou fanfaron qui fait rire",
    look: { couleur: "rouge", epaisseur: 3, ...base, haut: "cape", lunettes: "soleil", chaussures: "bottescowboy", objet: "epee", couleurs: { haut: "jaune" } },
  },
  {
    id: "timide", nom: "Basile", surnom: "le Timide", caractere: 1, joues: 0.4,
    arrivee: "Un petit bruit, derrière une branche… Un hibou au bonnet bleu se cache à moitié. Il s'appelle Basile. Il n'ose pas dire un mot, mais il aimerait bien rester un peu auprès de Plume.",
    journal: "Basile, un hibou timide et gentil",
    look: { couleur: "gris", epaisseur: 2, ...base, haut: "pull", chapeau: "bonnet", chaussures: "baskets", couleurs: { chapeau: "bleu", haut: "bleu" } },
  },
];

export const ORDRE_PRETENDANTS = PRETENDANTS.map((p) => p.id);
export const pretendant = (id?: string) => PRETENDANTS.find((p) => p.id === id);

/** Les phrases quand Plume (conseillée par toi) répond. */
export const OUI = (p: Pretendant) => `Plume sourit, toute contente. ${p.nom} reste au nid : c'est maintenant le compagnon de Plume !`;
export const NON = (p: Pretendant) => `${p.nom} baisse la tête, un peu triste. Il s'en va… mais il reviendra peut-être, un autre jour.`;

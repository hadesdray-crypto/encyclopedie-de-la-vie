// Les 6 prétendants de Plume. Ils viennent un par un frapper au nid ; on choisit si celui-ci peut rester ou non.
// S'il est refusé, il repart un peu triste et revient plus tard, après les cinq autres, avec une autre façon de se présenter.
// Au bout de 3 visites refusées, il ne revient plus (mais il vit toujours quelque part dans la forêt, et reste dans le nid, au menu).
// Chacun a sa personnalité, son dessin (couleur, carrure, tenue) et, plus tard, sa façon de protéger la famille.
// Les textes parlent à « toi » : on n'y nomme jamais Leonie.
import type { ReactNode } from "react";
import type { Look } from "@/components/garde-robe";
import type { Caractere } from "@/components/plume-dessin";

export type Visite = { titre: string; texte: string };

export type Pretendant = {
  id: string;
  nom: string;
  /** Son petit nom de personnalité, pour le journal. */
  surnom: string;
  /** Ses 3 visites : à chaque fois une autre façon de se présenter, une autre situation. */
  visites: [Visite, Visite, Visite];
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
    visites: [
      { titre: "Toc, toc !", texte: "Un grand hibou tout musclé vient de se poser sur le nid. Il s'appelle Gaspard. Pour impressionner Plume, il soulève une énorme branche… et il se la laisse tomber sur le pied. Il est très doux, au fond. Il aimerait bien rester un peu auprès d'elle." },
      { titre: "Il est revenu !", texte: "Gaspard est revenu. Cette fois, il n'essaie pas de faire le fort : il a construit un tout petit nid neuf pour Plume, brin par brin, avec ses grosses ailes. C'est un peu de travers, mais il l'a fait de tout son cœur. Il aimerait bien rester." },
      { titre: "Une dernière fois…", texte: "Un gros orage éclate ! Gaspard arrive en courant, une immense feuille sur la tête, et la tient au-dessus du nid pour que Plume reste au sec. Il est trempé de la tête aux pieds, mais il ne bouge pas. C'est sa dernière tentative." },
    ],
    journal: "Gaspard, un grand hibou très musclé mais très doux",
    look: { couleur: "brun", epaisseur: 4, ...base, haut: "tshirt", bas: "jean", chaussures: "baskets", objet: "batte", couleurs: { haut: "rouge", bas: "bleu" } },
  },
  {
    id: "savant", nom: "Merlin", surnom: "le Savant", caractere: 3, joues: 0.22,
    visites: [
      { titre: "Toc, toc !", texte: "Un hibou à lunettes, un livre sous l'aile, vient de se poser sur la branche. Il s'appelle Merlin. Il se met à expliquer les étoiles à Plume, avec beaucoup trop de chiffres, et il s'emballe tout seul. Il aimerait bien rester un peu auprès d'elle." },
      { titre: "Il est revenu !", texte: "Merlin est revenu avec une machine de sa fabrication : un « détecteur de câlins ». Il appuie sur le bouton, ça fait POUF, et il se retrouve tout noir de fumée, avec des étincelles dans les plumes. Il est ravi quand même. Il aimerait bien rester." },
      { titre: "Une dernière fois…", texte: "Merlin n'a plus ni chiffres ni machine. Il s'assoit près de Plume, lève le bec vers le ciel et dit seulement : « Regarde. » Une étoile filante passe. Il aimerait bien rester pour regarder les étoiles avec elle. C'est sa dernière tentative." },
    ],
    journal: "Merlin, un hibou savant qui s'emballe",
    look: { couleur: "bleu", epaisseur: 1, ...base, haut: "medecin", lunettes: "rondes", objet: "livre", chaussures: "vernis" },
  },
  {
    id: "poete", nom: "Léandre", surnom: "le Poète", caractere: 2, joues: 0.3, extra: SOURCILS_DOUX,
    visites: [
      { titre: "Toc, toc !", texte: "Un hibou rêveur arrive en tenant une fleur. Il s'appelle Léandre. Il fait de grands gestes et il récite quelque chose de très beau, ou de très bizarre : on ne sait pas trop. Il aimerait bien rester un peu auprès de Plume." },
      { titre: "Il est revenu !", texte: "Léandre revient avec une chanson. Il chante si fort que tous les oiseaux de la forêt s'arrêtent pour écouter… et la chanson est un tout petit peu fausse. Il s'incline, très sérieux. Il aimerait bien rester." },
      { titre: "Une dernière fois…", texte: "Léandre a écrit un poème sur une feuille. Un coup de vent l'emporte ! Il court derrière, glisse dans une flaque et revient tout trempé, la feuille collée sur le front : « Voilà, c'est ça, la poésie ! » C'est sa dernière tentative." },
    ],
    journal: "Léandre, un hibou poète et rêveur",
    look: { couleur: "turquoise", epaisseur: 1, ...base, haut: "echarpe", objet: "fleur", chapeau: "haut", couleurs: { haut: "violet", chapeau: "violet" } },
  },
  {
    id: "gourmand", nom: "Pistache", surnom: "le Gourmand", caractere: 2, joues: 0.3, extra: <>{SOURCILS_DOUX}{BAIES}</>,
    visites: [
      { titre: "Toc, toc !", texte: "Un gros hibou rond, en tablier de cuisine, arrive les ailes pleines de baies et de graines. Il s'appelle Pistache. Il a apporté beaucoup trop de cadeaux… et il en a déjà mangé la moitié. Il aimerait bien rester un peu auprès de Plume." },
      { titre: "Il est revenu !", texte: "Pistache revient avec un pique-nique complet dans un panier. Mais en chemin, il a tout mangé. Il ne reste qu'une seule graine, qu'il offre à Plume avec un immense sourire. Il aimerait bien rester." },
      { titre: "Une dernière fois…", texte: "Pistache a préparé une tarte aux baies. Elle est un peu brûlée d'un côté, mais il la coupe en deux parts bien égales et donne la plus grosse à Plume. Pour lui, c'est un énorme sacrifice. C'est sa dernière tentative." },
    ],
    journal: "Pistache, un hibou gourmand qui apporte trop de cadeaux",
    look: { couleur: "orange", epaisseur: 4, ...base, haut: "cuisine", chapeau: "toque", chaussures: "sandales" },
  },
  {
    id: "fanfaron", nom: "Hector", surnom: "le Fanfaron", caractere: 3, joues: 0.22,
    visites: [
      { titre: "Toc, toc !", texte: "Un hibou en cape, avec des lunettes de soleil, atterrit en faisant l'important. Il s'appelle Hector. Il dit qu'il est le plus fort de toute la forêt… puis il rate son atterrissage. Il aimerait bien rester un peu auprès de Plume." },
      { titre: "Il est revenu !", texte: "Hector revient et annonce qu'il peut voler plus haut que les nuages. Il prend son élan, saute du bord du nid… et tombe dans un buisson. Il en sort avec des feuilles sur la tête, comme si de rien n'était. Il aimerait bien rester." },
      { titre: "Une dernière fois…", texte: "Cette fois, Hector a laissé sa cape et ses lunettes à la maison. Il avoue tout bas : « En vrai, j'ai un peu peur du noir. » Il a l'air tout petit, mais il a eu le courage de le dire. C'est sa dernière tentative." },
    ],
    journal: "Hector, un hibou fanfaron qui fait rire",
    look: { couleur: "rouge", epaisseur: 3, ...base, haut: "cape", lunettes: "soleil", chaussures: "bottescowboy", objet: "epee", couleurs: { haut: "jaune" } },
  },
  {
    id: "timide", nom: "Basile", surnom: "le Timide", caractere: 1, joues: 0.4,
    visites: [
      { titre: "Toc, toc !", texte: "Un petit bruit, derrière une branche… Un hibou au bonnet bleu se cache à moitié. Il s'appelle Basile. Il n'ose pas dire un mot, mais il aimerait bien rester un peu auprès de Plume." },
      { titre: "Il est revenu !", texte: "Basile est revenu. Il n'ose toujours pas parler, alors il a posé devant le nid une petite pile de jolies pierres brillantes, avec un nœud. Puis il s'est caché derrière sa branche. Il aimerait bien rester." },
      { titre: "Une dernière fois…", texte: "Basile a répété toute la nuit. Il s'avance, respire un grand coup, et dit un seul mot, tout doucement : « Bonjour. » Puis il rougit jusqu'au bout des plumes. C'est sa dernière tentative." },
    ],
    journal: "Basile, un hibou timide et gentil",
    look: { couleur: "gris", epaisseur: 2, ...base, haut: "pull", chapeau: "bonnet", chaussures: "baskets", couleurs: { chapeau: "bleu", haut: "bleu" } },
  },
];

export const ORDRE_PRETENDANTS = PRETENDANTS.map((p) => p.id);
export const pretendant = (id?: string) => PRETENDANTS.find((p) => p.id === id);

/** Les phrases quand Plume (conseillée par toi) répond. */
export const OUI = (p: Pretendant) => `Plume sourit, toute contente. ${p.nom} reste au nid : c'est maintenant le compagnon de Plume !`;
export const NON = (p: Pretendant) => `${p.nom} baisse la tête, un peu triste. Il s'en va… mais il reviendra peut-être, un autre jour.`;
/** Le troisième refus : il ne reviendra plus voir Plume, mais il habite toujours quelque part dans la forêt. */
export const NON_DEFINITIF = (p: Pretendant) => `${p.nom} baisse la tête. Il a essayé trois fois, et il comprend. Il s'en va pour de bon, mais il habite toujours quelque part dans la forêt, et il pense encore à Plume.`;

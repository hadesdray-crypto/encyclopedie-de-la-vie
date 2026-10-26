import type { Espece } from "@/data/catalogue";

/**
 * Les animaux qui ne sont pas des mammifères.
 * Chaque fait vient d'une source publiée (Vikidia, Futura, articles scientifiques) ;
 * ce qui n'est pas sûr n'est pas écrit : la fiche dit « Mal connu ».
 */
export type Extra = { titre: string; texte: string; icone: "etoile" | "regle" | "pattes" | "temps" | "oeuf" | "loupe" | "froid" };

export type Autre = Espece & {
  /** Rareté fixe : l'animal vit partout. */
  partout?: 1;
  /** Un dessin original, pas une photo. */
  dessin?: 1;
  /** Où ranger cet animal dans l'arbre de l'évolution (id d'une étape). */
  etape: string;
  extras: Extra[];
  /** Phrase d'accueil, en tête de fiche. */
  phrase: string;
  /** La taille, quand on ne peut pas donner un poids sûr. */
  taille?: string;
};

export const AUTRES: Autre[] = [
  {
    id: "2000001",
    nom: "Tardigrade",
    latin: "Tardigrada",
    ordre: "Tardigrada",
    famille: "Tardigrada",
    langue: "fr",
    ou: "Partout sur Terre : de l'eau de mer jusqu'aux mousses, du fond des océans à plus de 6 000 mètres de haut dans l'Himalaya, des pôles aux déserts.",
    statut: "Non évalué",
    longevite: "quelques mois à 1 ou 2 ans en pleine activité, sans compter les périodes de vie ralentie",
    portee: "de 1 à une trentaine d'œufs selon l'espèce",
    regime: "omnivore",
    mange: "surtout la sève des mousses et des lichens ; certaines espèces mangent de minuscules animaux",
    milieu: "Dans l'eau, même un simple film d'eau sur une mousse.",
    pays: [],
    partout: 1,
    taille: "moins de 1 mm",
    dessin: 1,
    etape: "tardigrades",
    phrase: "Un animal minuscule, à huit pattes, qui peut s'arrêter de vivre quasiment… puis repartir.",
    extras: [
      { titre: "Son super-pouvoir", icone: "froid", texte: "Quand l'eau disparaît, il se vide de presque toute son eau (plus de 99 %), se recroqueville en petit « tonneau » et sa vie ralentit à presque rien. On appelle ça la cryptobiose. Il se réveille quand l'eau revient." },
      { titre: "Sa taille", icone: "regle", texte: "Moins d'un millimètre en général, jusqu'à environ 1,5 mm pour les plus grands. Pour le voir, il faut un microscope." },
      { titre: "Ses pattes", icone: "pattes", texte: "Quatre paires de pattes courtes et ventrues, avec des griffes au bout. Il avance doucement : « tardigrade » veut dire « qui marche lentement »." },
      { titre: "Combien de temps en vie ralentie", icone: "temps", texte: "Des tardigrades ont été réveillés après plusieurs années au laboratoire. Au Japon, en 2016, des chercheurs en ont réveillé qui étaient restés congelés plus de 30 ans." },
      { titre: "Dans l'espace", icone: "etoile", texte: "En 2007, des tardigrades en vie ralentie ont passé dix jours dans le vide de l'espace, dans une capsule russe. Ceux qui n'ont reçu que des UV doux (les UV-A) ont presque tous survécu. Avec les UV forts (UV-B), plus de 80 % sont morts. Ils ne sont donc pas « indestructibles »." },
      { titre: "Nombre d'espèces", icone: "loupe", texte: "Plus de mille espèces connues, et on en découvre encore." },
      { titre: "Qui est son cousin ?", icone: "pattes", texte: "Les tardigrades sont les cousins des arthropodes (insectes, araignées, crabes) et des vers à pattes. Ils sont dans le même grand groupe d'animaux qui change de peau pour grandir, les « ecdysozoaires »." },
    ],
  },
];

export const AUTRES_PAR_ID = new Map(AUTRES.map((a) => [a.id, a]));

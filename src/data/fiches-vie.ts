export type RegimeId =
  | "carnivore"
  | "piscivore"
  | "insectivore"
  | "invertivore"
  | "herbivore"
  | "folivore"
  | "frugivore"
  | "graminivore"
  | "omnivore"
  | "nectarivore";

export type VieAnimal = {
  bebes: string;
  gestation: string;
  regime: RegimeId;
  mange: string;
  ou: string;
};

/** Vrais régimes. Le mot, puis ce qu'il veut dire. */
export const REGIMES: Record<RegimeId, { nom: string; explique: string }> = {
  carnivore: {
    nom: "Carnivore",
    explique: "Il mange d'autres animaux.",
  },
  piscivore: {
    nom: "Piscivore",
    explique: "C'est un carnivore qui mange surtout du poisson.",
  },
  insectivore: {
    nom: "Insectivore",
    explique: "Il mange surtout des insectes. Parfois une autre petite bête.",
  },
  invertivore: {
    nom: "Mangeur d'invertébrés",
    explique: "Il mange surtout des animaux sans squelette. Dans la mer, ce sont par exemple des calmars, des crevettes ou du krill.",
  },
  herbivore: {
    nom: "Herbivore",
    explique:
      "Il mange des plantes : herbe, feuilles, fruits ou écorce. Chez les humains, on dit parfois végétarien. Chez les animaux, le mot juste est herbivore.",
  },
  folivore: {
    nom: "Folivore",
    explique: "C'est un herbivore qui mange surtout des feuilles.",
  },
  frugivore: {
    nom: "Frugivore",
    explique: "C'est un herbivore qui mange surtout des fruits.",
  },
  graminivore: {
    nom: "Graminivore",
    explique: "C'est un herbivore qui mange surtout de l'herbe.",
  },
  omnivore: {
    nom: "Omnivore",
    explique: "Il mange des plantes et des animaux. Pas seulement l'un ou l'autre.",
  },
  nectarivore: {
    nom: "Nectarivore",
    explique: "Il mange surtout du nectar, le liquide sucré des fleurs.",
  },
};

/** Le petit dessin de chaque régime (jeux, cartes). */
export const EMOJI_REGIME: Record<string, string> = { carnivore: "🥩", piscivore: "🐟", insectivore: "🐜", invertivore: "🦑", herbivore: "🌿", folivore: "🍃", frugivore: "🍎", graminivore: "🌾", nectarivore: "🌸", omnivore: "🍽️" };

/** Ordres de grandeur publiés. « On le sait mal » quand les mesures manquent. */
export const VIE: Record<string, VieAnimal> = {
  lion: {
    bebes: "Souvent 2 ou 3. Parfois un seul, parfois 4.",
    gestation: "Environ 3 mois et demi.",
    regime: "carnivore",
    mange: "Zèbres, gnous, buffles. Ce sont surtout les femelles qui chassent.",
    ou: "Afrique, et un petit groupe en Inde.",
  },
  tigre: {
    bebes: "Souvent 2 ou 3.",
    gestation: "Environ 3 mois et demi.",
    regime: "carnivore",
    mange: "Cerfs, sangliers, et d'autres grands animaux. Il chasse seul.",
    ou: "Asie : Inde, Russie, Sumatra, et quelques autres forêts.",
  },
  leopard: {
    bebes: "Souvent 2 à 4.",
    gestation: "Environ 3 mois.",
    regime: "carnivore",
    mange: "Ce qu'il trouve : antilopes, singes, oiseaux. Il cache la proie dans un arbre.",
    ou: "Afrique et Asie.",
  },
  jaguar: {
    bebes: "Souvent 1 à 4.",
    gestation: "Environ 3 mois.",
    regime: "carnivore",
    mange: "Cerfs, cochons, caïmans, poissons. Il aime chasser près de l'eau.",
    ou: "Amérique, du Mexique jusqu'au nord de l'Argentine.",
  },
  neige: {
    bebes: "Souvent 2.",
    gestation: "Environ 3 mois.",
    regime: "carnivore",
    mange: "Bouquetins, chèvres sauvages, marmottes.",
    ou: "Les hautes montagnes d'Asie centrale.",
  },
  nebuleuse: {
    bebes: "Souvent 1 à 3.",
    gestation: "Environ 3 mois.",
    regime: "carnivore",
    mange: "Singes, oiseaux, petits cerfs, dans les arbres et au sol.",
    ou: "Les forêts d'Asie du Sud-Est, sur le continent.",
  },
  "nebuleuse-borne": {
    bebes: "Souvent 1 à 3. On l'a peu observé.",
    gestation: "Environ 3 mois. C'est encore peu mesuré.",
    regime: "carnivore",
    mange: "Singes, cerfs souris, oiseaux.",
    ou: "Bornéo et Sumatra.",
  },
  guepard: {
    bebes: "Souvent 3 ou 4. Parfois davantage.",
    gestation: "Environ 3 mois.",
    regime: "carnivore",
    mange: "Gazelles et autres animaux pas trop gros. Il court pour les attraper.",
    ou: "Afrique, et quelques-uns en Iran.",
  },
  puma: {
    bebes: "Souvent 2 ou 3.",
    gestation: "Environ 3 mois.",
    regime: "carnivore",
    mange: "Cerfs, et des proies plus petites selon l'endroit.",
    ou: "Toute l'Amérique, du Canada jusqu'au sud.",
  },
  jaguarondi: {
    bebes: "Souvent 1 à 4.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Petits mammifères, oiseaux, lézards.",
    ou: "Du Mexique jusqu'en Amérique du Sud.",
  },
  "lynx-boreal": {
    bebes: "Souvent 2.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Chevreuils, lièvres, oiseaux.",
    ou: "Les forêts d'Europe et d'Asie.",
  },
  "lynx-espagne": {
    bebes: "Souvent 2 ou 3.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Surtout des lapins.",
    ou: "Espagne et Portugal.",
  },
  "lynx-canada": {
    bebes: "Souvent 2 à 4. Plus de lièvres, plus de petits.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Presque seulement le lièvre d'Amérique.",
    ou: "Canada et Alaska.",
  },
  "lynx-roux": {
    bebes: "Souvent 2 ou 3.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Lapins, souris, oiseaux.",
    ou: "Amérique du Nord.",
  },
  serval: {
    bebes: "Souvent 2 ou 3.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Rats, souris, oiseaux. Il saute pour les attraper.",
    ou: "Afrique, près des herbes hautes et de l'eau.",
  },
  caracal: {
    bebes: "Souvent 1 à 4.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Lièvres, oiseaux, petites antilopes.",
    ou: "Afrique, Moyen-Orient, et jusqu'en Asie centrale.",
  },
  "dore-afrique": {
    bebes: "Souvent 1 ou 2. On en a vu très peu.",
    gestation: "On le sait mal. Sans doute un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Petits animaux de la forêt : rongeurs, oiseaux.",
    ou: "Les forêts d'Afrique.",
  },
  ocelot: {
    bebes: "Souvent 1 ou 2.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, lézards. Il chasse la nuit.",
    ou: "Du sud des États-Unis jusqu'en Amérique du Sud.",
  },
  margay: {
    bebes: "Souvent un seul.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Petits animaux dans les arbres.",
    ou: "Les forêts d'Amérique centrale et du Sud.",
  },
  andes: {
    bebes: "On le sait mal.",
    gestation: "On le sait mal.",
    regime: "carnivore",
    mange: "Petits rongeurs des montagnes, et des oiseaux.",
    ou: "Très haut dans les Andes.",
  },
  pampas: {
    bebes: "Souvent 1 à 3. Les mesures sont rares.",
    gestation: "On le sait mal, autour de 2 mois et demi.",
    regime: "carnivore",
    mange: "Petits rongeurs et oiseaux.",
    ou: "Amérique du Sud : prairies, broussailles, montagnes.",
  },
  geoffroy: {
    bebes: "Souvent 1 à 3.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, poissons parfois.",
    ou: "Le sud de l'Amérique du Sud.",
  },
  kodkod: {
    bebes: "Souvent 1 à 3.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, lézards.",
    ou: "Chili et Argentine, dans les forêts.",
  },
  "tigre-nord": {
    bebes: "Souvent 1 ou 2.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Petits mammifères et oiseaux.",
    ou: "Le nord de l'Amérique du Sud.",
  },
  "tigre-sud": {
    bebes: "Souvent 1 ou 2.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Petits mammifères et oiseaux.",
    ou: "Le sud du Brésil et les pays voisins.",
  },
  "tigre-nebuleux": {
    bebes: "On ne sait pas encore.",
    gestation: "On ne sait pas encore.",
    regime: "carnivore",
    mange: "Sans doute de petits animaux, comme ses cousins. Peu de gens l'ont vu chasser.",
    ou: "Les forêts de nuages des Andes.",
  },
  rubigineux: {
    bebes: "Souvent 1 à 3.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Souris, oiseaux, lézards, insectes.",
    ou: "Inde et Sri Lanka.",
  },
  "tete-plate": {
    bebes: "On le sait mal. Sans doute 1 à 3.",
    gestation: "On le sait mal.",
    regime: "carnivore",
    mange: "Poissons, grenouilles, et petits animaux des rivières.",
    ou: "Les rivières de Malaisie, Bornéo et Sumatra.",
  },
  pecheur: {
    bebes: "Souvent 1 à 4.",
    gestation: "Un peu plus de 2 mois.",
    regime: "piscivore",
    mange: "Poissons, grenouilles, et parfois des oiseaux d'eau.",
    ou: "Les marais d'Asie du Sud et du Sud-Est.",
  },
  "chat-leopard": {
    bebes: "Souvent 2 à 4.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, et d'autres petites proies.",
    ou: "Une grande partie de l'Asie.",
  },
  "chat-leopard-sonde": {
    bebes: "Souvent 2 à 4.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Rongeurs et oiseaux.",
    ou: "Les îles de Java, Bali, Bornéo et Sumatra.",
  },
  manul: {
    bebes: "Souvent 3 ou 4. Parfois plus.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Surtout des pikas et des petits rongeurs.",
    ou: "Les steppes froides d'Asie centrale.",
  },
  chaus: {
    bebes: "Souvent 3 à 5.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, grenouilles, et parfois des poissons.",
    ou: "De l'Égypte jusqu'en Asie du Sud-Est, près de l'eau.",
  },
  "chat-europe": {
    bebes: "Souvent 2 à 4.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Souris, campagnols, et des oiseaux.",
    ou: "Les forêts d'Europe.",
  },
  "chat-afrique": {
    bebes: "Souvent 2 à 4.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, insectes.",
    ou: "Afrique, et une partie du Moyen-Orient.",
  },
  "chat-chine": {
    bebes: "On le sait mal.",
    gestation: "Sans doute un peu plus de 2 mois, comme les autres chats sauvages.",
    regime: "carnivore",
    mange: "Rongeurs des montagnes, et des oiseaux.",
    ou: "Les hauts plateaux de Chine.",
  },
  sables: {
    bebes: "Souvent 2 à 4.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Rongeurs, lézards, insectes. Il peut vivre sans boire.",
    ou: "Les déserts d'Afrique du Nord, d'Arabie et d'Asie.",
  },
  "pieds-noirs": {
    bebes: "Souvent 1 à 3.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Souris, oiseaux, insectes. Il chasse presque toute la nuit.",
    ou: "Le sud de l'Afrique.",
  },
  chat: {
    bebes: "Souvent 3 à 6. Parfois plus.",
    gestation: "Un peu plus de 2 mois.",
    regime: "carnivore",
    mange: "Dans la nature : souris et oiseaux. À la maison : ce qu'on lui donne.",
    ou: "Partout où vivent les humains.",
  },
  marbre: {
    bebes: "On le sait mal. Sans doute 1 ou 2.",
    gestation: "On le sait mal.",
    regime: "carnivore",
    mange: "Oiseaux, rongeurs, et d'autres petits animaux des arbres.",
    ou: "Les forêts d'Asie du Sud-Est.",
  },
  bai: {
    bebes: "On ne sait pas.",
    gestation: "On ne sait pas.",
    regime: "carnivore",
    mange: "Sans doute de petits animaux. On l'a presque jamais vu manger.",
    ou: "Seulement à Bornéo.",
  },
  "dore-asie": {
    bebes: "Souvent 1 à 3.",
    gestation: "Environ 2 mois et demi.",
    regime: "carnivore",
    mange: "Rongeurs, oiseaux, et parfois de plus grosses proies.",
    ou: "Les forêts d'Asie, de l'Himalaya jusqu'au Sud-Est.",
  },
  loup: {
    bebes: "Souvent 4 à 6.",
    gestation: "Environ 2 mois.",
    regime: "carnivore",
    mange: "Cerfs, élans, et d'autres animaux. La meute chasse ensemble.",
    ou: "Europe, Asie et Amérique du Nord.",
  },
  renard: {
    bebes: "Souvent 4 à 6.",
    gestation: "Un peu moins de 2 mois.",
    regime: "omnivore",
    mange: "Souris, oiseaux, vers, fruits, et parfois les restes des humains.",
    ou: "Europe, Asie, Afrique du Nord. Il a aussi été emmené ailleurs.",
  },
  "ours-brun": {
    bebes: "Souvent 1 à 3. Ils naissent l'hiver, dans la tanière.",
    gestation: "Environ 6 à 8 mois, mais le bébé ne grandit vraiment qu'à la fin.",
    regime: "carnivore",
    mange: "Baies, racines, insectes, poissons, et parfois un grand animal.",
    ou: "Europe, Asie et Amérique du Nord.",
  },
  "ours-blanc": {
    bebes: "Souvent 2.",
    gestation: "Environ 8 mois. Les petits naissent dans une tanière de neige.",
    regime: "carnivore",
    mange: "Surtout des phoques.",
    ou: "Le Grand Nord, autour de la banquise.",
  },
  panda: {
    bebes: "Souvent 1. Parfois 2, mais la mère n'en élève en général qu'un.",
    gestation: "Environ 3 à 5 mois. Le bébé naît tout petit.",
    regime: "folivore",
    mange: "Presque seulement du bambou. Il mange toute la journée.",
    ou: "Quelques montagnes de Chine.",
  },
  "elephant-afrique": {
    bebes: "Un seul. Un deuxième est très rare.",
    gestation: "Environ 22 mois. C'est le plus long de tous les animaux.",
    regime: "carnivore",
    mange: "Herbe, feuilles, écorces, fruits. Il en mange énormément.",
    ou: "Afrique, dans les savanes.",
  },
  "elephant-asie": {
    bebes: "Un seul.",
    gestation: "Environ 18 à 22 mois.",
    regime: "carnivore",
    mange: "Herbe, feuilles, fruits, écorces.",
    ou: "Inde et Asie du Sud-Est.",
  },
  zebre: {
    bebes: "Un seul.",
    gestation: "Environ un an.",
    regime: "graminivore",
    mange: "Herbes des plaines.",
    ou: "L'est et le sud de l'Afrique.",
  },
  hippo: {
    bebes: "Un seul.",
    gestation: "Environ 8 mois.",
    regime: "graminivore",
    mange: "Herbe, la nuit, hors de l'eau. Il ne mange pas le poisson.",
    ou: "Les fleuves et les lacs d'Afrique.",
  },
  kangourou: {
    bebes: "Un seul à la fois. Il naît minuscule et finit de grandir dans la poche.",
    gestation: "Environ un mois dans le ventre, puis plusieurs mois dans la poche.",
    regime: "graminivore",
    mange: "Herbe.",
    ou: "L'Australie.",
  },
  koala: {
    bebes: "Un seul. Il passe de longs mois dans la poche.",
    gestation: "Environ un mois dans le ventre, puis la poche.",
    regime: "folivore",
    mange: "Feuilles d'eucalyptus. Presque rien d'autre.",
    ou: "L'est de l'Australie.",
  },
  chimpanze: {
    bebes: "Un seul.",
    gestation: "Environ 8 mois.",
    regime: "omnivore",
    mange: "Fruits, feuilles, insectes, et parfois un petit animal.",
    ou: "Les forêts d'Afrique centrale et de l'Ouest.",
  },
  gorille: {
    bebes: "Un seul.",
    gestation: "Environ 8 mois et demi.",
    regime: "frugivore",
    mange: "Feuilles, tiges, fruits. Très rarement un insecte.",
    ou: "Les forêts d'Afrique centrale.",
  },
  orang: {
    bebes: "Un seul. Le petit reste des années avec sa mère.",
    gestation: "Environ 8 mois et demi.",
    regime: "frugivore",
    mange: "Surtout des fruits. Aussi des feuilles et de l'écorce.",
    ou: "Bornéo.",
  },
  cerf: {
    bebes: "Un seul. Parfois deux.",
    gestation: "Environ 8 mois.",
    regime: "herbivore",
    mange: "Herbe, feuilles, et bourgeons.",
    ou: "Europe, et une partie de l'Asie. Il a aussi été emmené ailleurs.",
  },
  lapin: {
    bebes: "Souvent 4 à 6. Plusieurs portées dans l'année.",
    gestation: "Environ un mois.",
    regime: "herbivore",
    mange: "Herbe, et les plantes tendres.",
    ou: "Europe, et beaucoup d'autres pays où on l'a emmené.",
  },
  suricate: {
    bebes: "Souvent 2 à 5.",
    gestation: "Environ 2 mois et demi.",
    regime: "insectivore",
    mange: "Insectes, scorpions, petits lézards, et parfois un fruit.",
    ou: "Le sud de l'Afrique, dans les zones sèches.",
  },
  raton: {
    bebes: "Souvent 3 à 5.",
    gestation: "Environ 2 mois.",
    regime: "omnivore",
    mange: "Fruits, insectes, grenouilles, œufs, et les poubelles près des maisons.",
    ou: "Amérique du Nord. Il vit aussi en Europe, où on l'a emmené.",
  },
};

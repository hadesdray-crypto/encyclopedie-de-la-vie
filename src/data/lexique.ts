export type MotLexique = {
  id: string;
  mot: string;
  definition: string;
  /** false : le mot est dans le lexique, mais il n'est pas souligné tout seul dans les textes. */
  auto?: false;
};

export const LEXIQUE: MotLexique[] = [
  {
    id: "gestation",
    mot: "Gestation",
    definition:
      "Temps pendant lequel le petit se développe dans l'utérus de la femelle, avant la naissance. Chez le lapin, environ un mois. Chez l'éléphant d'Afrique, environ 22 mois.",
  },
  {
    id: "uterus",
    mot: "Utérus",
    definition: "Organe dans le corps de la femelle où le petit grandit pendant la gestation. Chez les mammifères, c'est là qu'il se développe.",
  },
  {
    id: "portee",
    mot: "Portée",
    definition: "Ensemble des petits nés en même temps, après une même gestation. Une lionne a souvent une portée de deux ou trois lionceaux.",
  },
  {
    id: "longevite",
    mot: "Longévité",
    definition:
      "Record de durée de vie publié. Souvent mesuré dans un zoo. Dans la nature, l'animal vit en général moins longtemps.",
  },
  {
    id: "repartition",
    mot: "Répartition",
    definition: "Régions du monde où l'espèce vit à l'état sauvage. Ce n'est pas un zoo, ni un pays où l'animal a seulement été emmené.",
  },
  {
    id: "habitat",
    mot: "Habitat",
    definition: "Milieu de vie : forêt, désert, savane, banquise, rivière. La répartition dit où sur la carte. L'habitat dit dans quel genre d'endroit.",
  },
  {
    id: "regime",
    mot: "Régime",
    definition: "Régime alimentaire : la catégorie de ce qu'un animal mange. Carnivore, herbivore et omnivore sont des régimes. En dessous, l'alimentation précise les proies ou les plantes.",
  },
  {
    id: "alimentation",
    mot: "Alimentation",
    definition: "Ce que l'animal mange vraiment : quelles proies, quelles plantes, quels insectes. Le régime est la catégorie. L'alimentation est le détail.",
  },
  {
    id: "dimorphisme",
    mot: "Dimorphisme",
    definition: "Dimorphisme sexuel : différence entre le mâle et la femelle d'une même espèce. Taille, crinière, bois, joues, couleurs.",
  },
  {
    id: "male",
    mot: "Mâle",
    definition: "Animal de sexe masculin. Chez le cerf, le mâle porte les bois. Chez le lion, le mâle a la crinière.",
  },
  {
    id: "femelle",
    mot: "Femelle",
    definition: "Animal de sexe féminin. Chez les mammifères, c'est elle qui fait la gestation et allaite les petits.",
  },
  {
    id: "espece",
    mot: "Espèce",
    definition: "Groupe d'animaux qui se ressemblent et peuvent avoir des petits ensemble. Le lion et le tigre sont deux espèces. Ils sont tous les deux des félins.",
  },
  {
    id: "nom-scientifique",
    mot: "Nom scientifique",
    definition: "Nom latin de l'espèce, le même dans toutes les langues. Panthera leo désigne le lion partout dans le monde.",
  },
  {
    id: "adulte",
    mot: "Adulte",
    definition: "Animal qui a fini sa croissance. Les poids des fiches sont des poids d'adultes, pas de petits.",
  },
  {
    id: "carnivore",
    mot: "Carnivore",
    definition: "Animal qui mange d'autres animaux.",
  },
  {
    id: "carnivore-strict",
    mot: "Carnivore strict",
    definition: "Carnivore qui ne peut pas vivre seulement de plantes. Son corps a besoin de viande. Tous les félins sont des carnivores stricts.",
  },
  {
    id: "piscivore",
    mot: "Piscivore",
    definition: "Carnivore qui mange surtout du poisson. Le chat pêcheur est un piscivore.",
  },
  {
    id: "insectivore",
    mot: "Insectivore",
    definition: "Animal qui mange surtout des insectes. Il peut aussi prendre une autre petite bête.",
  },
  {
    id: "herbivore",
    mot: "Herbivore",
    definition: "Animal qui mange des plantes : herbe, feuilles, fruits ou écorce. Pour un humain, on dit parfois végétarien. Pour un animal, le mot juste est herbivore.",
  },
  {
    id: "folivore",
    mot: "Folivore",
    definition: "Herbivore qui mange surtout des feuilles. Le koala et le panda sont des folivores.",
  },
  {
    id: "frugivore",
    mot: "Frugivore",
    definition: "Herbivore qui mange surtout des fruits. L'orang-outan est un frugivore.",
  },
  {
    id: "graminivore",
    mot: "Graminivore",
    definition: "Herbivore qui mange surtout de l'herbe. Le zèbre est un graminivore.",
  },
  {
    id: "omnivore",
    mot: "Omnivore",
    definition: "Animal qui mange des plantes et des animaux. Pas seulement l'un ou l'autre.",
  },
  {
    id: "nectarivore",
    mot: "Nectarivore",
    definition: "Animal qui mange surtout du nectar, le liquide sucré des fleurs.",
  },
  {
    id: "masse",
    mot: "Masse",
    definition: "Poids d'un adulte. Ici, c'est une moyenne publiée. Elle n'est pas séparée entre le mâle et la femelle quand les deux mesures n'existent pas.",
  },
  {
    id: "statut",
    mot: "Statut",
    definition: "Situation de l'espèce selon la Liste rouge de l'UICN. Préoccupation mineure veut dire qu'elle n'est pas menacée pour l'instant. En danger critique veut dire qu'elle peut disparaître.",
  },
  {
    id: "milieu",
    mot: "Milieu",
    definition: "Endroit où l'animal passe le plus clair de son temps : au sol, dans les arbres, en vol ou dans la mer.",
  },
  {
    id: "mammifere",
    mot: "Mammifère",
    definition: "Animal qui allaite ses petits. Les félins, les ours et les éléphants sont des mammifères. Une mère mammifère a une gestation, puis elle donne du lait.",
  },
  {
    id: "cri",
    mot: "Cri",
    definition: "Le bruit que fait l'animal : rugissement, meuglement, aboiement. NC veut dire non connu : aucun enregistrement n'a été trouvé.",
  },
  {
    id: "evolution",
    mot: "Évolution",
    definition:
      "Lente transformation des êtres vivants, de génération en génération, sur des millions d'années. Les petits ressemblent à leurs parents, mais pas tout à fait. Ceux qui sont le mieux adaptés ont plus de petits. Petit à petit, de nouvelles espèces apparaissent.",
  },
  {
    id: "fossile",
    mot: "Fossile",
    definition:
      "Reste ou trace d'un être vivant très ancien, conservé dans la roche : un os, une coquille, une dent, une empreinte de pas ou de feuille.",
  },
  {
    id: "cellule",
    mot: "Cellule",
    definition:
      "La plus petite partie vivante. Une bactérie est faite d'une seule cellule. Ton corps en contient des milliers de milliards.",
  },
  {
    id: "atome",
    mot: "Atome",
    definition:
      "Minuscule grain de matière. Tout est fait d'atomes : l'eau, l'air, les roches et toi.",
  },
  {
    id: "molecule",
    mot: "Molécule",
    definition:
      "Des atomes accrochés ensemble. Une molécule d'eau, c'est un atome d'oxygène et deux atomes d'hydrogène.",
  },
  {
    id: "acide-amine",
    mot: "Acide aminé",
    definition:
      "Petite molécule qui sert de brique pour fabriquer les protéines. Les êtres vivants en utilisent une vingtaine de sortes.",
  },
  {
    id: "arn",
    mot: "ARN",
    definition:
      "Longue molécule en une seule chaîne qui garde un message, comme l'ADN. Dans la cellule, il sert de recette pour fabriquer les protéines.",
  },
  {
    id: "adn",
    mot: "ADN",
    definition:
      "Longue molécule en double chaîne, tordue comme un escalier en colimaçon. Elle contient toutes les recettes pour construire et faire marcher un être vivant. Elle passe des parents aux enfants.",
  },
  {
    id: "proteine",
    mot: "Protéine",
    definition:
      "Longue chaîne d'acides aminés repliée sur elle-même. Les protéines font presque tout le travail dans les cellules. Les muscles et les poils en sont faits.",
  },
  {
    id: "luca",
    mot: "LUCA",
    definition:
      "Le dernier ancêtre commun universel, en anglais Last Universal Common Ancestor. C'est la cellule dont descendent tous les êtres vivants d'aujourd'hui.",
  },
  {
    id: "bacterie",
    mot: "Bactérie",
    definition:
      "Être vivant fait d'une seule cellule, sans noyau. Il y en a partout. La plupart sont utiles ou sans danger.",
  },
  {
    id: "archee",
    mot: "Archée",
    definition:
      "Être vivant fait d'une seule cellule, sans noyau, comme une bactérie, mais d'une autre branche de l'arbre de la vie.",
  },
  {
    id: "eucaryote",
    mot: "Eucaryote",
    definition:
      "Être vivant dont les cellules ont un noyau. Les plantes, les champignons et les animaux sont des eucaryotes.",
  },
  {
    id: "noyau",
    mot: "Noyau",
    definition:
      "Petite boîte à l'intérieur de la cellule, où l'ADN est rangé.",
  },
  {
    id: "mitochondrie",
    mot: "Mitochondrie",
    definition:
      "Petite centrale d'énergie à l'intérieur de la cellule. C'était une bactérie, il y a très longtemps.",
  },
  {
    id: "photosynthese",
    mot: "Photosynthèse",
    definition:
      "Ce que font les plantes, les algues et les cyanobactéries : avec la lumière, l'eau et le gaz carbonique, elles fabriquent du sucre et rejettent de l'oxygène.",
  },
  {
    id: "chloroplaste",
    mot: "Chloroplaste",
    definition:
      "Petit morceau vert dans les cellules des plantes, où se fait la photosynthèse. C'était une cyanobactérie, il y a très longtemps.",
  },
  {
    id: "ancetre",
    mot: "Ancêtre",
    definition:
      "Être vivant dont d'autres descendent : les parents, les grands-parents, et ainsi de suite, très loin dans le passé.",
  },
  {
    id: "vertebre",
    mot: "Vertébré",
    definition:
      "Animal qui a une colonne vertébrale, une chaîne d'os dans le dos : poissons, amphibiens, reptiles, oiseaux, mammifères.",
  },
  {
    id: "arthropode",
    mot: "Arthropode",
    definition:
      "Animal à pattes articulées et à carapace : insectes, araignées, crabes, mille-pattes.",
  },
  {
    id: "tetrapode",
    mot: "Tétrapode",
    definition:
      "Vertébré à quatre membres : amphibiens, reptiles, oiseaux, mammifères. Les ailes et les bras comptent comme des membres. Le serpent descend de tétrapodes, même s'il a perdu ses pattes.",
  },
  {
    id: "amniote",
    mot: "Amniote",
    definition:
      "Tétrapode dont l'embryon grandit protégé par des enveloppes, dans un œuf à coquille ou dans le ventre de sa mère : reptiles, oiseaux, mammifères.",
  },
  {
    id: "embryon",
    mot: "Embryon",
    definition:
      "Le tout début d'un petit, juste après la fécondation, dans l'œuf ou dans le ventre de sa mère.",
  },
  {
    id: "cartilage",
    mot: "Cartilage",
    definition:
      "Matière souple et solide. Chez toi, il y en a dans le nez et les oreilles. Le squelette des requins est fait de cartilage.",
  },
  {
    id: "metamorphose",
    mot: "Métamorphose",
    definition:
      "Grand changement de forme pendant la vie d'un animal. Le têtard devient grenouille, la chenille devient papillon.",
  },
  {
    id: "mue",
    mot: "Mue",
    definition:
      "Quand un animal change de peau, de carapace, de poils ou de plumes. Le crabe quitte sa vieille carapace pour grandir.",
  },
  {
    id: "extinction",
    mot: "Extinction",
    definition:
      "Disparition d'une espèce : il n'en reste plus aucune vivante. Quand beaucoup d'espèces disparaissent en même temps, on parle d'extinction de masse.",
  },
  {
    id: "scenario",
    mot: "Scénario",
    definition:
      "Explication possible de ce qui s'est passé, construite avec des indices. C'est la meilleure idée des scientifiques, mais on n'a pas de preuve directe.",
  },
  {
    id: "preuve",
    mot: "Preuve",
    definition:
      "Ce qui montre qu'une chose est vraie et qu'on peut vérifier : un fossile, une mesure, une expérience qu'on peut refaire.",
  },
  {
    id: "placenta",
    mot: "Placenta",
    definition:
      "Organe qui relie le petit à sa mère pendant la gestation. Il lui apporte la nourriture et l'oxygène.",
  },
  {
    id: "marsupial",
    mot: "Marsupial",
    definition:
      "Mammifère dont le petit naît tout petit, puis finit de grandir, souvent dans une poche sur le ventre de sa mère : kangourou, koala, opossum.",
  },
  {
    id: "monotreme",
    mot: "Monotrème",
    definition:
      "Mammifère qui pond des œufs : l'ornithorynque et les échidnés.",
  },
  {
    id: "primate",
    mot: "Primate",
    definition:
      "Mammifère aux mains qui attrapent, avec de bons yeux tournés vers l'avant : lémuriens, singes, et les humains.",
  },
  {
    id: "ordre",
    mot: "Ordre",
    definition:
      "Dans la classification, un grand groupe qui réunit plusieurs familles. Par exemple, l'ordre des carnivores réunit les félins, les canidés, les ours.",
    auto: false,
  },
  {
    id: "famille",
    mot: "Famille",
    definition:
      "Dans la classification, un groupe d'espèces très proches. Par exemple, la famille des félins réunit le lion, le tigre et le chat.",
    auto: false,
  },
  {
    id: "classification",
    mot: "Classification",
    definition:
      "Le rangement des êtres vivants en groupes emboîtés : espèce, genre, famille, ordre, classe, embranchement, règne.",
  },
  {
    id: "paleontologue",
    mot: "Paléontologue",
    definition:
      "Scientifique qui étudie les fossiles pour comprendre la vie du passé.",
  },
  {
    id: "asteroide",
    mot: "Astéroïde",
    definition:
      "Gros morceau de roche qui tourne autour du Soleil. Il arrive que l'un d'eux tombe sur une planète.",
  },
  {
    id: "spore",
    mot: "Spore",
    definition:
      "Minuscule grain qui permet à une fougère, une mousse ou un champignon de se reproduire. Ce n'est pas une graine.",
  },
];

const PAR_ID = new Map(LEXIQUE.map((mot) => [mot.id, mot]));

export function motDuLexique(id: string) {
  return PAR_ID.get(id);
}

export type Morceau = { id?: string; texte: string };

const SCANNES = LEXIQUE.filter((mot) => mot.auto !== false).sort((a, b) => b.mot.length - a.mot.length);

export function decouper(texte: string): Morceau[] {
  const bas = texte.toLocaleLowerCase("fr");
  const prises: { start: number; end: number; id: string }[] = [];
  for (const mot of SCANNES) {
    const aiguille = mot.mot.toLocaleLowerCase("fr");
    let depuis = 0;
    while (depuis < bas.length) {
      const ici = bas.indexOf(aiguille, depuis);
      if (ici < 0) break;
      const finMot = ici + aiguille.length;
      const avantOk = ici === 0 || !lettre(bas[ici - 1]);
      const pluriel = bas[finMot] === "s" && (finMot + 1 >= bas.length || !lettre(bas[finMot + 1]));
      const fin = pluriel ? finMot + 1 : finMot;
      const apresOk = fin >= bas.length || !lettre(bas[fin]);
      const chevauche = prises.some((prise) => ici < prise.end && fin > prise.start);
      if (avantOk && apresOk && !chevauche) prises.push({ start: ici, end: fin, id: mot.id });
      depuis = Math.max(fin, ici + 1);
    }
  }
  prises.sort((a, b) => a.start - b.start);
  const morceaux: Morceau[] = [];
  let curseur = 0;
  for (const prise of prises) {
    if (prise.start > curseur) morceaux.push({ texte: texte.slice(curseur, prise.start) });
    morceaux.push({ id: prise.id, texte: texte.slice(prise.start, prise.end) });
    curseur = prise.end;
  }
  if (curseur < texte.length) morceaux.push({ texte: texte.slice(curseur) });
  return morceaux;
}

function lettre(caractere: string | undefined) {
  return !!caractere && /\p{L}/u.test(caractere);
}

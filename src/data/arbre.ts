import imagesEvolution from "@/data/images-evolution.json";
/**
 * L'arbre de la vie, qui sert aussi de guide de l'évolution.
 *
 * On part du centre (la Terre) et chaque étape ouvre les suivantes.
 * Chaque étape dit :
 *  - quand (ordre de grandeur publié, jamais un chiffre inventé) ;
 *  - ce qu'on sait, en français simple avec les vrais mots ;
 *  - si c'est une PREUVE (fossiles, roches, ADN qu'on peut mesurer),
 *    un SCÉNARIO (la meilleure explication, pas une photo du passé),
 *    ou un DÉBAT (les scientifiques ne sont pas d'accord) ;
 *  - comment on le sait.
 *
 * Les nombres d'espèces sont écrits « plus de… » avec un chiffre prudent,
 * en dessous des comptes publiés (voir la page Sources).
 *
 * Pour ajouter une étape : créer un objet ici, puis mettre son id dans
 * la liste « suite » de l'étape qui vient juste avant.
 */

export type Savoir = "preuve" | "scenario" | "debat";

export type Etape = {
  id: string;
  nom: string;
  /** Dessin dans public/art, sinon une icône. */
  image?: string;
  icone?: string;
  /** Épaisseur de la branche : 3 = grosse branche, 1 = petite. */
  poids: 1 | 2 | 3;
  quand?: string;
  /** Millions d'années avant aujourd'hui, pour ranger la frise. */
  ma?: number;
  texte: string;
  anecdote?: string;
  savoir: Savoir;
  comment: string;
  especes?: string;
  suite: string[];
  /** Lien vers le catalogue des espèces. */
  catalogue?: { vers: string; label: string };
  /** Place gardée pour plus tard (oiseaux, insectes). */
  reserve?: string;
};

export const SAVOIR: Record<Savoir, { titre: string; phrase: string }> = {
  preuve: {
    titre: "On a des preuves",
    phrase: "Des fossiles, des roches ou de l'ADN qu'on peut mesurer aujourd'hui.",
  },
  scenario: {
    titre: "C'est un scénario",
    phrase: "La meilleure explication des scientifiques. Ce n'est pas une photo du passé.",
  },
  debat: {
    titre: "Les scientifiques en discutent",
    phrase: "Il y a des indices, mais tout le monde n'est pas d'accord.",
  },
};

const E: Etape[] = [
  // ---------- Avant la vie ----------
  {
    id: "terre",
    nom: "La Terre",
    image: "theme/terre.webp",
    poids: 3,
    quand: "Il y a environ 4,5 milliards d'années",
    ma: 4540,
    texte:
      "La Terre se forme autour du Soleil, avec des poussières et des roches qui s'assemblent. Au début, elle est brûlante. Il n'y a encore aucune vie.",
    anecdote:
      "La Lune serait née d'un énorme choc entre la jeune Terre et une autre planète. C'est le scénario le plus suivi. Il y a au moins 4,4 milliards d'années, il y avait déjà de l'eau liquide sur Terre : on le sait grâce à de minuscules cristaux, des zircons, trouvés en Australie.",
    savoir: "preuve",
    comment:
      "On mesure l'âge des plus vieilles roches et des météorites avec la radioactivité : certains atomes se transforment lentement, comme un sablier très régulier.",
    suite: ["molecules"],
  },
  {
    id: "molecules",
    nom: "Les molécules",
    image: "art/molecules.jpg",
    poids: 2,
    quand: "Avant 4 milliards d'années",
    ma: 4500,
    texte:
      "Tout est fait d'atomes. Quand des atomes s'accrochent ensemble, ils forment des molécules : l'eau, le gaz carbonique, l'ammoniac, le méthane. Dans les océans et près des volcans, ces molécules se rencontrent et réagissent.",
    savoir: "scenario",
    comment:
      "On sait quelles molécules existent dans l'espace, sur les autres planètes et dans les volcans. Pour la jeune Terre, on reconstruit le mélange avec des indices dans les roches.",
    suite: ["briques"],
  },
  {
    id: "briques",
    nom: "Les briques de la vie",
    image: "art/briques.jpg",
    poids: 2,
    quand: "Avant 4 milliards d'années",
    ma: 4450,
    texte:
      "Des molécules plus grandes apparaissent : les acides aminés, les sucres et les graisses. Ce ne sont pas encore des êtres vivants. Ce sont des briques, comme des pièces de construction avant le château.",
    anecdote:
      "En 1952, Stanley Miller a mis de l'eau et des gaz dans un ballon de verre, avec des étincelles comme des éclairs. Au bout d'environ une semaine, il y avait des acides aminés ! On en a aussi trouvé dans des météorites tombées sur Terre.",
    savoir: "preuve",
    comment:
      "Les expériences en laboratoire et les météorites montrent que ces briques se fabriquent toutes seules, sans être vivant. Comment cela s'est passé exactement sur la jeune Terre reste un scénario.",
    suite: ["arn"],
  },
  {
    id: "arn",
    nom: "L'ARN",
    image: "art/arn.jpg",
    poids: 2,
    quand: "Peut-être avant 4 milliards d'années",
    ma: 4400,
    texte:
      "L'ARN est une longue chaîne qui peut garder un message, comme un mot écrit avec quatre lettres. Il peut aussi faire du travail et, parfois, aider à se copier lui-même. Beaucoup de scientifiques pensent que la vie a commencé avec un « monde à ARN ».",
    savoir: "scenario",
    comment:
      "Dans toutes nos cellules, l'ARN fait encore des travaux très anciens, par exemple dans le ribosome, la machine qui fabrique les protéines. C'est un indice fort. Mais personne n'a vu les premiers ARN : c'est un scénario.",
    suite: ["proteines"],
  },
  {
    id: "proteines",
    nom: "Les protéines",
    image: "art/proteine.jpg",
    poids: 2,
    quand: "Peut-être avant 4 milliards d'années",
    ma: 4350,
    texte:
      "Les acides aminés s'accrochent en longues chaînes qui se replient : ce sont les protéines. Elles font presque tout le travail dans un être vivant : couper, coller, transporter, construire.",
    savoir: "scenario",
    comment:
      "Dans les cellules d'aujourd'hui, c'est l'ARN qui donne la recette des protéines. C'est pour cela qu'on pense que l'ARN est venu avant. L'ordre exact reste un scénario.",
    suite: ["adn"],
  },
  {
    id: "adn",
    nom: "L'ADN",
    image: "art/adn.jpg",
    poids: 2,
    quand: "Avant LUCA",
    ma: 4300,
    texte:
      "L'ADN est une double chaîne, comme une échelle tordue. Il garde le même genre de message que l'ARN, mais il est plus solide. Il devient le grand livre de recettes de la cellule.",
    anecdote:
      "Si on déroulait tout l'ADN d'une seule de tes cellules, il mesurerait environ 2 mètres. Il tient pourtant dans un noyau qu'on ne voit qu'au microscope !",
    savoir: "scenario",
    comment:
      "Tous les êtres vivants d'aujourd'hui ont de l'ADN, donc LUCA en avait sûrement déjà. Qu'il soit arrivé après l'ARN est la meilleure explication, mais c'est un scénario.",
    suite: ["luca"],
  },
  {
    id: "luca",
    nom: "LUCA",
    image: "art/cellule.jpg",
    poids: 3,
    quand: "Il y a peut-être 4,2 milliards d'années",
    ma: 4200,
    texte:
      "LUCA veut dire « le dernier ancêtre commun universel ». C'était déjà une cellule, avec de l'ADN, de l'ARN et des protéines. Ce n'était pas la première cellule : d'autres vivaient avant ou à côté, mais seuls les descendants de LUCA sont encore là. Tout ce qui vit aujourd'hui, la bactérie, le champignon, le lion et toi, descend de LUCA.",
    savoir: "debat",
    comment:
      "On compare l'ADN de beaucoup d'êtres vivants pour retrouver ce qu'ils ont tous en commun. Une étude de 2024 propose environ 4,2 milliards d'années. D'autres chercheurs pensent que c'est plus récent. Les plus vieux fossiles acceptés par presque tous, des stromatolites d'Australie, ont environ 3,5 milliards d'années.",
    suite: ["bacteries", "archees"],
  },

  // ---------- Bactéries ----------
  {
    id: "bacteries",
    nom: "Bactéries",
    image: "theme/bacteries.webp",
    poids: 3,
    quand: "Depuis plus de 3,5 milliards d'années",
    ma: 3500,
    texte:
      "Les bactéries sont des cellules toutes seules, sans noyau. Elles sont minuscules, mais il y en a partout : dans l'eau, dans la terre, dans l'air, sur ta peau et dans ton ventre. C'est un des deux grands côtés de l'arbre.",
    savoir: "preuve",
    comment:
      "On trouve des traces très anciennes, comme les stromatolites, des roches en couches construites par des tapis de microbes. Et on étudie l'ADN des bactéries d'aujourd'hui.",
    suite: ["cyanobacteries", "bacteries-ventre", "bacteries-sol", "bacteries-maladies"],
  },
  {
    id: "cyanobacteries",
    nom: "Cyanobactéries",
    icone: "Sun",
    poids: 2,
    quand: "Il y a environ 2,4 milliards d'années, l'air change",
    ma: 2400,
    texte:
      "Les cyanobactéries font de la photosynthèse : avec la lumière du Soleil, l'eau et le gaz carbonique, elles fabriquent leur nourriture et elles rejettent de l'oxygène. Petit à petit, elles remplissent l'air d'oxygène. On appelle ça la Grande Oxydation.",
    anecdote:
      "L'oxygène que tu respires vient en grande partie de la photosynthèse. Et les chloroplastes des plantes sont d'anciennes cyanobactéries qui sont allées vivre dans une autre cellule !",
    savoir: "preuve",
    comment:
      "Dans les roches de cette époque, le fer se met à rouiller : c'est la signature de l'oxygène.",
    suite: [],
  },
  {
    id: "bacteries-ventre",
    nom: "Dans ton ventre",
    icone: "Heart",
    poids: 1,
    texte:
      "Ton intestin abrite des milliards de milliards de bactéries. La plupart sont gentilles : elles aident à digérer et à te protéger.",
    anecdote:
      "Une étude de 2016 a compté : dans un corps humain, il y a à peu près autant de bactéries que de cellules humaines.",
    savoir: "preuve",
    comment: "On les compte et on lit leur ADN dans des échantillons.",
    suite: [],
  },
  {
    id: "bacteries-sol",
    nom: "Dans le sol",
    icone: "Sprout",
    poids: 1,
    texte:
      "Dans une poignée de terre, il y a des milliards de bactéries. Certaines aident les plantes à trouver l'azote dont elles ont besoin pour pousser. D'autres recyclent les feuilles mortes.",
    savoir: "preuve",
    comment: "On les observe au microscope et on lit leur ADN.",
    suite: [],
  },
  {
    id: "bacteries-maladies",
    nom: "Celles qui rendent malade",
    icone: "Microscope",
    poids: 1,
    texte:
      "Quelques bactéries peuvent rendre malade. Les antibiotiques sont des médicaments contre elles. Ils ne marchent pas contre les virus, comme celui du rhume.",
    anecdote: "En 1928, Alexander Fleming a découvert la pénicilline, le premier grand antibiotique, grâce à une moisissure qui avait poussé par hasard.",
    savoir: "preuve",
    comment: "Les médecins et les biologistes les cultivent et les étudient au laboratoire.",
    suite: [],
  },

  // ---------- Archées ----------
  {
    id: "archees",
    nom: "Archées",
    image: "theme/archees.webp",
    poids: 3,
    quand: "Depuis plus de 3 milliards d'années",
    ma: 3400,
    texte:
      "Les archées sont aussi des cellules sans noyau. Elles ressemblent aux bactéries, mais ce n'en sont pas : leur ADN et leur enveloppe sont différents. C'est l'autre grand côté de l'arbre.",
    anecdote: "On ne les a reconnues qu'en 1977, grâce au chercheur Carl Woese, qui a comparé leur ARN.",
    savoir: "preuve",
    comment: "On compare leur ARN et leur ADN avec ceux des bactéries.",
    suite: ["archees-chaleur", "archees-methane", "asgard"],
  },
  {
    id: "archees-chaleur",
    nom: "Les amies de la chaleur",
    icone: "Flame",
    poids: 1,
    texte:
      "Certaines archées vivent dans les sources d'eau bouillante et au fond des océans, près des cheminées volcaniques.",
    anecdote: "Une archée nommée Methanopyrus kandleri peut encore se multiplier à 122 °C. C'est un record publié en 2008.",
    savoir: "preuve",
    comment: "On les a cultivées au laboratoire à ces températures.",
    suite: [],
  },
  {
    id: "archees-methane",
    nom: "Les fabricantes de méthane",
    icone: "Waves",
    poids: 1,
    texte:
      "Certaines archées fabriquent un gaz, le méthane. Elles vivent dans les marais et dans l'estomac des vaches, où elles aident à digérer l'herbe.",
    savoir: "preuve",
    comment: "On mesure le gaz qu'elles produisent et on lit leur ADN.",
    suite: [],
  },
  {
    id: "asgard",
    nom: "Nos cousines lointaines",
    icone: "Orbit",
    poids: 2,
    texte:
      "Un groupe d'archées, les archées d'Asgard, a des gènes qui ressemblent à ceux des eucaryotes. C'est un indice : les eucaryotes, et donc nous, seraient nés de ce côté-ci de l'arbre.",
    savoir: "debat",
    comment: "On a trouvé leur ADN dans la boue au fond de l'océan à partir de 2015. Leur place exacte dans l'arbre est encore discutée.",
    suite: ["eucaryotes"],
  },

  // ---------- Eucaryotes ----------
  {
    id: "eucaryotes",
    nom: "Eucaryotes",
    image: "art/cellule.jpg",
    poids: 3,
    quand: "Il y a au moins 1,6 milliard d'années",
    ma: 1600,
    texte:
      "Une archée et une bactérie font équipe : la bactérie va vivre à l'intérieur. Elle devient la mitochondrie, la petite centrale d'énergie de la cellule. La cellule a maintenant un noyau, une boîte pour ranger son ADN. Les plantes, les champignons et les animaux sont tous des eucaryotes.",
    anecdote: "Tes mitochondries ont encore leur propre petit ADN, comme un souvenir de l'époque où elles étaient des bactéries libres.",
    savoir: "preuve",
    comment:
      "L'ADN des mitochondries ressemble à celui de certaines bactéries : c'est une preuve forte. Les plus vieux fossiles d'eucaryotes acceptés ont environ 1,6 milliard d'années.",
    suite: ["plantes", "champignons", "animaux", "autres-eucaryotes"],
  },
  {
    id: "autres-eucaryotes",
    nom: "Les autres eucaryotes",
    icone: "Droplet",
    poids: 1,
    texte:
      "Beaucoup d'eucaryotes ne sont ni des plantes, ni des champignons, ni des animaux : les amibes, les paramécies, les algues brunes. Souvent, ce sont des cellules toutes seules qu'on ne voit qu'au microscope.",
    anecdote: "Les algues brunes géantes, les kelps, peuvent former de vraies forêts sous la mer.",
    savoir: "preuve",
    comment: "On les observe au microscope et on compare leur ADN.",
    suite: [],
  },

  // ---------- Plantes ----------
  {
    id: "plantes",
    nom: "Plantes",
    image: "theme/plantes.webp",
    poids: 2,
    quand: "Sur la terre ferme depuis environ 470 millions d'années",
    ma: 470,
    texte:
      "Les plantes boivent la lumière grâce à leurs chloroplastes, d'anciennes cyanobactéries. D'abord, il y a des algues dans l'eau. Puis des plantes sortent sur la terre ferme, bien avant les animaux à quatre pattes.",
    savoir: "preuve",
    comment: "On trouve leurs spores fossiles, de minuscules grains, dans des roches d'environ 470 millions d'années.",
    suite: ["mousses", "fougeres", "coniferes", "fleurs"],
  },
  {
    id: "mousses",
    nom: "Mousses",
    icone: "Leaf",
    poids: 1,
    texte: "Les mousses n'ont pas de vrais vaisseaux pour transporter l'eau. Elles restent petites et aiment les endroits humides.",
    savoir: "preuve",
    comment: "On compare leur ADN et leur forme avec les autres plantes.",
    suite: [],
  },
  {
    id: "fougeres",
    nom: "Fougères",
    icone: "Leaf",
    poids: 1,
    quand: "Grandes forêts il y a environ 300 millions d'années",
    ma: 320,
    texte:
      "Les fougères ont des vaisseaux et peuvent devenir grandes. Elles font des spores, pas des graines. Pendant le Carbonifère, des fougères et leurs cousines formaient d'immenses forêts.",
    anecdote: "Une grande partie du charbon vient des forêts de cette époque.",
    savoir: "preuve",
    comment: "On trouve leurs feuilles et leurs troncs fossiles dans le charbon.",
    suite: [],
  },
  {
    id: "coniferes",
    nom: "Conifères",
    icone: "TreePine",
    poids: 1,
    texte: "Sapins, pins, séquoias : ils font des graines dans des cônes, les pommes de pin. Les dinosaures en voyaient déjà partout.",
    anecdote: "Un pin de Californie, surnommé Mathusalem, a plus de 4 700 ans.",
    savoir: "preuve",
    comment: "On compte les cernes du bois et on trouve des cônes fossiles.",
    suite: [],
  },
  {
    id: "fleurs",
    nom: "Plantes à fleurs",
    icone: "Flower2",
    poids: 2,
    quand: "Il y a au moins 130 millions d'années",
    ma: 130,
    texte:
      "Les plantes à fleurs arrivent pendant l'époque des dinosaures. Les fleurs attirent les insectes, qui transportent le pollen. Aujourd'hui, ce sont les plantes les plus nombreuses : l'herbe, les roses, les chênes, le blé.",
    savoir: "preuve",
    comment: "On trouve leur pollen fossile dans des roches d'environ 130 millions d'années.",
    suite: [],
  },

  // ---------- Champignons ----------
  {
    id: "champignons",
    nom: "Champignons",
    image: "theme/champignons.webp",
    poids: 1,
    texte:
      "Les champignons ne sont pas des plantes : ils ne font pas de photosynthèse. Ils se nourrissent de ce qui les entoure. Ce sont même de proches cousins des animaux ! Les levures du pain, les moisissures et les champignons à chapeau en font partie.",
    anecdote:
      "Le chapeau qu'on voit n'est qu'une petite partie. Le reste du champignon, le mycélium, est un réseau de fils sous la terre. Dans l'Oregon, aux États-Unis, un seul de ces réseaux s'étend sur plusieurs kilomètres carrés.",
    savoir: "preuve",
    comment: "L'ADN montre que les champignons et les animaux ont un ancêtre commun plus récent qu'avec les plantes.",
    especes: "Plus de 100 000 espèces décrites",
    suite: [],
  },

  // ---------- Animaux ----------
  {
    id: "animaux",
    nom: "Animaux",
    image: "theme/animaux.webp",
    poids: 3,
    quand: "Fossiles sûrs depuis environ 570 millions d'années",
    ma: 570,
    texte:
      "Les animaux sont faits de beaucoup de cellules et mangent d'autres êtres vivants. Les premiers vivaient dans la mer. Puis, il y a environ 539 millions d'années, commence l'« explosion cambrienne » : en peu de temps, presque tous les grands groupes d'animaux apparaissent.",
    savoir: "preuve",
    comment:
      "On trouve des fossiles d'animaux à corps mou, comme Dickinsonia, dans des roches d'environ 560 millions d'années. On a même retrouvé dedans des traces de cholestérol, une molécule typique des animaux.",
    suite: ["eponges", "meduses", "vers", "mollusques", "pattes", "tardigrades", "echinodermes", "vertebres"],
  },
  {
    id: "eponges",
    nom: "Éponges",
    icone: "Droplet",
    poids: 1,
    texte:
      "Les éponges sont des animaux très simples, sans muscles ni cerveau. Elles restent fixées et filtrent l'eau pour attraper de minuscules morceaux de nourriture.",
    savoir: "preuve",
    comment: "On compare leur ADN avec celui des autres animaux.",
    especes: "Plus de 8 000 espèces",
    suite: [],
  },
  {
    id: "meduses",
    nom: "Méduses et coraux",
    image: "art/meduse.jpg",
    poids: 2,
    texte:
      "Les cnidaires ont des cellules qui piquent, les cnidocytes. Ce groupe réunit les méduses, les anémones de mer et les coraux. Une branche très ancienne : ils nagent dans la mer bien avant les dinosaures.",
    anecdote: "Un récif de corail est construit par des milliers de tout petits animaux. La Grande Barrière de corail, en Australie, se voit depuis l'espace.",
    savoir: "preuve",
    comment: "On trouve des coraux fossiles et on compare leur ADN.",
    especes: "Plus de 10 000 espèces",
    suite: [],
  },
  {
    id: "vers",
    nom: "Les vers",
    icone: "Worm",
    poids: 1,
    texte:
      "« Ver » n'est pas une seule famille : c'est une forme de corps, longue et molle. Il y a les vers plats, les vers ronds et les annélides, les vers en anneaux, comme le ver de terre et la sangsue.",
    anecdote: "Le ver de terre n'a pas de poumons : il respire par la peau. C'est pour ça qu'il doit rester humide.",
    savoir: "preuve",
    comment: "L'ADN montre que ces vers ne sont pas tous cousins proches.",
    suite: [],
  },
  {
    id: "mollusques",
    nom: "Mollusques",
    icone: "Snail",
    poids: 2,
    texte:
      "Les mollusques ont un corps mou, souvent protégé par une coquille. Escargots et limaces, moules et huîtres, mais aussi pieuvres, calmars et seiches.",
    anecdote: "La pieuvre a trois cœurs et un sang bleu. Elle peut changer de couleur en une fraction de seconde.",
    savoir: "preuve",
    comment: "Leurs coquilles se fossilisent très bien : on en trouve partout, même en montagne.",
    especes: "Plus de 50 000 espèces",
    suite: [],
  },
  {
    id: "pattes",
    nom: "Petites pattes",
    image: "art/coccinelle.jpg",
    poids: 2,
    texte:
      "Les arthropodes ont des pattes articulées et une carapace qu'ils doivent quitter pour grandir : c'est la mue. Insectes à six pattes, araignées à huit pattes, crabes, mille-pattes : ce ne sont pas les mêmes familles.",
    anecdote: "Il y a plus d'espèces d'arthropodes que de tous les autres animaux réunis.",
    savoir: "preuve",
    comment: "On trouve leurs fossiles depuis le Cambrien, comme les trilobites.",
    suite: ["insectes", "araignees", "crustaces", "mille-pattes"],
  },
  {
    id: "tardigrades",
    nom: "Tardigrades",
    image: "m/2000001.webp",
    poids: 1,
    texte:
      "Les tardigrades sont de minuscules animaux à huit pattes, qui vivent dans l'eau et dans les mousses. Ce sont des cousins des arthropodes : comme eux, ils grandissent en changeant de peau. Leur grand talent : quand l'eau disparaît, ils se mettent en vie ralentie, et se réveillent quand elle revient.",
    anecdote: "Des tardigrades ont passé dix jours dans l'espace, en 2007, et beaucoup ont survécu.",
    savoir: "debat",
    comment:
      "On compare leur ADN et leur corps avec ceux des autres animaux. Ils sont tout petits et mous : leurs fossiles sont rares. Les scientifiques ne sont pas tous d'accord sur leur place exacte à côté des arthropodes.",
    especes: "Plus de 1 000 espèces",
    catalogue: { vers: "/mammiferes/e-2000001", label: "Voir la fiche du tardigrade" },
    suite: [],
  },
  {
    id: "insectes",
    nom: "Insectes",
    icone: "Bug",
    poids: 2,
    quand: "Depuis environ 400 millions d'années",
    ma: 400,
    texte:
      "Six pattes, un corps en trois parties : la tête, le thorax et l'abdomen. Les insectes sont les premiers animaux à voler, bien avant les ptérosaures, les oiseaux et les chauves-souris.",
    anecdote: "Les insectes sont de proches cousins des crustacés : l'ADN le montre.",
    savoir: "preuve",
    comment: "Les plus vieux fossiles d'insectes ont environ 400 millions d'années.",
    especes: "Plus d'un million d'espèces décrites",
    reserve: "Les insectes auront peut-être leur propre application. La place est gardée ici.",
    suite: [],
  },
  {
    id: "araignees",
    nom: "Araignées et scorpions",
    icone: "Bug",
    poids: 1,
    texte: "Les arachnides ont huit pattes. Ce sont les araignées, les scorpions, les acariens et les tiques. Ce ne sont pas des insectes.",
    anecdote: "Le fil d'araignée est très solide pour son poids. Les araignées le fabriquent dans des glandes au bout de l'abdomen.",
    savoir: "preuve",
    comment: "On compare leur corps et leur ADN avec ceux des insectes.",
    especes: "Plus de 50 000 espèces d'araignées",
    suite: [],
  },
  {
    id: "crustaces",
    nom: "Crustacés",
    icone: "Shell",
    poids: 1,
    texte: "Crabes, homards, crevettes, cloportes : la plupart vivent dans l'eau et respirent avec des branchies.",
    anecdote: "Le cloporte, qu'on trouve sous les pierres, est un crustacé qui vit sur la terre ferme.",
    savoir: "preuve",
    comment: "On compare leur corps et leur ADN.",
    especes: "Plus de 50 000 espèces",
    suite: [],
  },
  {
    id: "mille-pattes",
    nom: "Mille-pattes",
    icone: "Worm",
    poids: 1,
    texte: "Les myriapodes ont beaucoup de pattes, mais presque jamais mille. Les mille-pattes et les scolopendres en font partie.",
    anecdote: "En 2021, on a décrit en Australie un mille-pattes qui a 1 306 pattes. C'est le premier qui en a vraiment plus de mille !",
    savoir: "preuve",
    comment: "Ce mille-pattes a été trouvé à 60 mètres sous terre et décrit dans une revue scientifique.",
    suite: [],
  },
  {
    id: "echinodermes",
    nom: "Étoiles de mer et oursins",
    icone: "Star",
    poids: 1,
    texte:
      "Les échinodermes ont souvent un corps en cinq parties, comme une étoile. Étoiles de mer, oursins, concombres de mer. Ils vivent tous dans la mer.",
    anecdote: "Surprise : l'étoile de mer est une plus proche cousine des vertébrés, donc de toi, que l'escargot ou l'insecte !",
    savoir: "preuve",
    comment: "On le sait par la façon dont l'embryon se développe, et par l'ADN.",
    especes: "Plus de 7 000 espèces",
    suite: [],
  },

  // ---------- Vertébrés ----------
  {
    id: "vertebres",
    nom: "Vertébrés",
    image: "art/poisson.jpg",
    poids: 3,
    quand: "Depuis environ 518 millions d'années",
    ma: 518,
    texte:
      "Les vertébrés ont une colonne vertébrale, une chaîne d'os dans le dos. Tout commence dans l'eau, avec de petits poissons sans mâchoires.",
    savoir: "preuve",
    comment: "Des fossiles de petits vertébrés, comme Haikouichthys, ont été trouvés en Chine dans des roches d'environ 518 millions d'années.",
    suite: ["sans-machoires", "requins", "nageoires-rayonnees", "nageoires-charnues"],
  },
  {
    id: "sans-machoires",
    nom: "Poissons sans mâchoires",
    icone: "Fish",
    poids: 1,
    texte: "Les premiers vertébrés n'avaient pas de mâchoires. Aujourd'hui, il en reste deux sortes : les lamproies et les myxines.",
    anecdote: "La myxine se défend en fabriquant énormément de mucus gluant en quelques secondes.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    suite: [],
  },
  {
    id: "requins",
    nom: "Requins et raies",
    icone: "Fish",
    poids: 1,
    quand: "Depuis plus de 400 millions d'années",
    ma: 420,
    texte: "Leur squelette n'est pas en os, mais en cartilage, la matière souple de ton nez et de tes oreilles. Les requins changent de dents toute leur vie.",
    anecdote: "Les requins existaient déjà avant les arbres !",
    savoir: "preuve",
    comment: "Leurs dents et leurs écailles se fossilisent bien.",
    especes: "Plus de 1 000 espèces",
    suite: [],
  },
  {
    id: "nageoires-rayonnees",
    nom: "Nageoires rayonnées",
    image: "art/poisson.jpg",
    poids: 2,
    texte:
      "La plupart des poissons ont des nageoires soutenues par de fines baguettes, les rayons : saumon, poisson rouge, hippocampe, thon. C'est le plus grand groupe de vertébrés.",
    anecdote: "L'hippocampe est un poisson. Et c'est le papa qui porte les œufs dans une poche !",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    especes: "Plus de 30 000 espèces",
    suite: [],
  },
  {
    id: "nageoires-charnues",
    nom: "Nageoires charnues",
    icone: "Fish",
    poids: 2,
    texte:
      "Certains poissons ont des nageoires épaisses, avec des os dedans, comme le début d'un bras. Aujourd'hui, il reste les cœlacanthes et les dipneustes, qui peuvent respirer de l'air. C'est de ce côté que viennent les animaux à quatre pattes.",
    anecdote: "On croyait le cœlacanthe disparu depuis l'époque des dinosaures. En 1938, un pêcheur en a remonté un vivant, en Afrique du Sud !",
    savoir: "preuve",
    comment: "Les os de leurs nageoires ressemblent à ceux de nos bras. L'ADN le confirme.",
    suite: ["hors"],
  },
  {
    id: "hors",
    nom: "Sortir de l'eau",
    icone: "Footprints",
    poids: 3,
    quand: "Il y a environ 375 millions d'années",
    ma: 375,
    texte:
      "Des poissons aux nageoires charnues s'approchent du bord. Petit à petit, les nageoires deviennent des pattes avec des doigts. Ce sont les tétrapodes, les animaux à quatre membres.",
    anecdote: "Tiktaalik, trouvé au Canada en 2004, avait des écailles et des branchies comme un poisson, mais aussi un cou et des nageoires avec des os de poignet.",
    savoir: "preuve",
    comment: "Les fossiles comme Tiktaalik, Acanthostega et Ichthyostega montrent les étapes entre la nageoire et la patte.",
    suite: ["amphibiens", "oeuf"],
  },
  {
    id: "amphibiens",
    nom: "Amphibiens",
    icone: "Droplet",
    poids: 2,
    texte:
      "Grenouilles, crapauds, salamandres, tritons. La plupart pondent dans l'eau. Le têtard vit dans l'eau, puis il se transforme : c'est la métamorphose.",
    anecdote: "Certaines grenouilles respirent un peu par la peau.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    especes: "Plus de 8 000 espèces",
    suite: [],
  },
  {
    id: "oeuf",
    nom: "L'œuf à coquille",
    icone: "Egg",
    poids: 3,
    quand: "Il y a plus de 310 millions d'années",
    ma: 315,
    texte:
      "Un nouvel œuf apparaît : il a des enveloppes qui protègent le petit et une réserve d'eau. On peut pondre loin de l'eau ! Ces animaux s'appellent les amniotes. Très vite, ils se séparent en deux branches : celle qui mène aux mammifères, et celle des reptiles.",
    anecdote: "Les mammifères ne descendent pas des reptiles : ce sont deux branches sœurs, séparées très tôt.",
    savoir: "preuve",
    comment: "Les plus vieux fossiles d'amniotes, comme Hylonomus au Canada, ont plus de 310 millions d'années.",
    suite: ["mammiferes", "reptiles"],
  },

  // ---------- Reptiles, dinosaures, oiseaux ----------
  {
    id: "reptiles",
    nom: "Reptiles",
    image: "art/reptile.jpg",
    poids: 2,
    texte: "Les reptiles ont une peau couverte d'écailles. Aujourd'hui : les tortues, les lézards et les serpents, les crocodiles, et le sphénodon de Nouvelle-Zélande.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    especes: "Plus de 11 000 espèces",
    suite: ["tortues", "lezards", "crocodiles", "dinosaures"],
  },
  {
    id: "tortues",
    nom: "Tortues",
    icone: "Turtle",
    poids: 1,
    texte: "Leur carapace est soudée à leur colonne vertébrale et à leurs côtes. Une tortue ne peut pas sortir de sa carapace.",
    anecdote: "Jonathan, une tortue géante de l'île de Sainte-Hélène, serait né vers 1832. C'est l'un des plus vieux animaux terrestres connus.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    especes: "Environ 350 espèces",
    suite: [],
  },
  {
    id: "lezards",
    nom: "Lézards et serpents",
    icone: "Worm",
    poids: 1,
    texte: "Les serpents sont des lézards qui ont perdu leurs pattes au cours de l'évolution. Certains pythons ont encore de minuscules restes de pattes arrière.",
    savoir: "preuve",
    comment: "Des fossiles de serpents avec de petites pattes ont été trouvés.",
    especes: "Plus de 10 000 espèces",
    suite: [],
  },
  {
    id: "crocodiles",
    nom: "Crocodiles",
    icone: "Waves",
    poids: 1,
    texte: "Crocodiles, alligators, caïmans et gavials. Ils vivent dans l'eau et sur les rives.",
    anecdote: "Surprise : les crocodiles sont de plus proches cousins des oiseaux que des lézards !",
    savoir: "preuve",
    comment: "On le sait par leur squelette et par l'ADN.",
    especes: "Moins de 30 espèces",
    suite: [],
  },
  {
    id: "dinosaures",
    nom: "Dinosaures",
    image: "art/dino.jpg",
    poids: 2,
    quand: "De 230 à 66 millions d'années",
    ma: 230,
    texte:
      "Les dinosaures naissent dans la branche des reptiles, pas chez les mammifères. Ils ont régné pendant plus de 150 millions d'années. Il y a 66 millions d'années, un astéroïde frappe la Terre et presque tous disparaissent.",
    anecdote:
      "Les ptérosaures, qui volaient, et les grands reptiles marins comme les ichtyosaures ne sont pas des dinosaures. Ce sont des cousins.",
    savoir: "preuve",
    comment:
      "On trouve leurs os, leurs œufs, leurs empreintes. Le cratère de Chicxulub, au Mexique, montre où l'astéroïde est tombé. Le rôle exact des volcans de l'Inde à la même époque est encore discuté.",
    catalogue: { vers: "/fossiles", label: "Voir la salle des fossiles" },
    suite: ["oiseaux"],
  },
  {
    id: "oiseaux",
    nom: "Oiseaux",
    image: "art/oiseau.jpg",
    poids: 2,
    quand: "Depuis environ 150 millions d'années",
    ma: 150,
    texte:
      "Les oiseaux sont des dinosaures ! Ce sont les seuls qui ont survécu à l'astéroïde. Archaeopteryx, il y a environ 150 millions d'années, avait des plumes, mais aussi des dents et des griffes aux ailes.",
    anecdote: "Beaucoup de dinosaures avaient des plumes, même le vélociraptor, qui était à peu près de la taille d'une dinde.",
    savoir: "preuve",
    comment: "Les squelettes de dinosaures à plumes trouvés en Chine et en Allemagne montrent le passage vers les oiseaux.",
    especes: "Plus de 10 000 espèces",
    reserve: "Les oiseaux auront peut-être leur propre application. La place est gardée ici.",
    suite: [],
  },

  // ---------- Mammifères ----------
  {
    id: "mammiferes",
    nom: "Mammifères",
    image: "art/mammifere.jpg",
    poids: 3,
    quand: "Depuis plus de 200 millions d'années",
    ma: 210,
    texte:
      "Les mammifères ont des poils et les mamans nourrissent leurs petits avec du lait. Les premiers étaient petits comme des souris et vivaient à côté des dinosaures, souvent la nuit. Quand les grands dinosaures disparaissent, les mammifères prennent beaucoup de place.",
    anecdote: "Les humains sont des mammifères, de l'ordre des primates. Notre espèce, Homo sapiens, existe depuis environ 300 000 ans. Si toute l'histoire de la Terre tenait en une journée, nous serions arrivés dans les 6 dernières secondes !",
    savoir: "preuve",
    comment: "On reconnaît les mammifères fossiles à leurs dents et aux petits os de leur oreille.",
    especes: "Environ 6 900 espèces",
    catalogue: { vers: "/mammiferes", label: "Ouvrir tous les mammifères" },
    suite: ["monotremes", "marsupiaux", "placentaires"],
  },
  {
    id: "monotremes",
    nom: "Ils pondent des œufs",
    icone: "Egg",
    poids: 1,
    texte: "Les monotrèmes sont des mammifères qui pondent des œufs : l'ornithorynque et les échidnés. Les petits boivent quand même du lait.",
    anecdote: "L'ornithorynque n'a pas de tétines : le lait sort par la peau du ventre, et le petit le lèche.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    catalogue: { vers: "/mammiferes/o-Monotremata", label: "Voir les monotrèmes" },
    suite: [],
  },
  {
    id: "marsupiaux",
    nom: "Marsupiaux",
    icone: "Baby",
    poids: 1,
    texte: "Le petit naît tout petit et finit de grandir, souvent dans une poche sur le ventre de sa mère. Kangourous, koalas, wombats, opossums.",
    anecdote: "À la naissance, un bébé kangourou est à peine plus grand qu'un haricot.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    catalogue: { vers: "/mammiferes?groupe=marsupiaux", label: "Voir les marsupiaux" },
    suite: [],
  },
  {
    id: "placentaires",
    nom: "Placentaires",
    icone: "PawPrint",
    poids: 2,
    texte:
      "Le petit grandit dans le ventre de sa mère, nourri par le placenta, pendant la gestation. C'est le plus grand groupe : félins, baleines, chauves-souris, rongeurs, éléphants, et nous.",
    savoir: "preuve",
    comment: "Fossiles et ADN.",
    catalogue: { vers: "/mammiferes", label: "Voir les groupes de mammifères" },
    suite: [],
  },
];

// Images réalistes (Wikimedia Commons, licences libres) : elles remplacent les dessins.
export type ImageEvo = { src: string; sorte: "photo" | "reconstitution" | "modele" | "fossile"; auteur: string; licence: string; page: string };
export const IMAGES_EVO = imagesEvolution as unknown as Record<string, ImageEvo>;
for (const e of E) if (IMAGES_EVO[e.id]) e.image = IMAGES_EVO[e.id].src;

export const ETAPES: Record<string, Etape> = Object.fromEntries(E.map((e) => [e.id, e]));

/** Les grandes branches autour du cercle de la page d'accueil. */
export const BRANCHES_ACCUEIL = ["terre", "bacteries", "archees", "plantes", "champignons", "animaux"] as const;

const PARENT = new Map<string, string>();
for (const etape of E) for (const enfant of etape.suite) PARENT.set(enfant, etape.id);

export function parentDe(id: string) {
  return PARENT.get(id);
}

/** Le chemin depuis la Terre jusqu'à cette étape. */
export function cheminVers(id: string) {
  const chemin: string[] = [];
  let actuel: string | undefined = id;
  while (actuel && ETAPES[actuel]) {
    chemin.unshift(actuel);
    actuel = PARENT.get(actuel);
  }
  return chemin;
}

/** Les étapes datées, de la plus ancienne à la plus récente : la frise. */
export const FRISE = E.filter((e) => e.ma !== undefined && e.quand).sort((a, b) => (b.ma ?? 0) - (a.ma ?? 0));

// Vérification : chaque « suite » doit exister.
for (const etape of E) {
  for (const enfant of etape.suite) {
    if (!ETAPES[enfant]) throw new Error(`Étape inconnue : ${enfant} (dans ${etape.id})`);
  }
}

/**
 * Ce que Plume, la petite chouette, explique sur chaque page.
 * Des phrases courtes, une idée par bulle. On passe à la suivante avec « Suivant ».
 */
export type Explication = { id: string; titre: string; etapes: string[] };

const PAGES: (Explication & { test: (chemin: string, params: URLSearchParams) => boolean })[] = [
  {
    id: "accueil",
    titre: "Bienvenue !",
    test: (c) => c === "/" || c === "",
    etapes: [
      "Bonjour, je suis Plume ! Je vais te montrer comment marche ton encyclopédie.",
      "La grande lune, au milieu, c'est le début de tout. Touche-la pour commencer l'histoire de la vie.",
      "Les bulles autour t'emmènent tout droit vers les bactéries, les plantes, les champignons ou les animaux.",
      "Les parchemins ouvrent d'autres salles : la frise du temps, les fossiles, les défis du jour.",
      "En bas de l'écran, il y a tes salles préférées : l'arbre, les jeux, les cartes et ton profil.",
      "Si tu as une question, touche-moi. Je t'explique chaque page !",
    ],
  },
  {
    id: "arbre",
    titre: "L'arbre de la vie",
    test: (c) => c.startsWith("/arbre"),
    etapes: [
      "Ici, tu voyages dans l'histoire de la vie, étape par étape.",
      "Touche une bulle autour du cercle pour avancer. Les traits montrent les branches de l'arbre.",
      "Le petit badge te dit si on a des preuves, si c'est un scénario, ou si les scientifiques en discutent.",
      "Touche « Comment on le sait ? » pour découvrir le travail des scientifiques.",
      "Le chemin, en haut, te montre d'où tu viens. Touche un nom pour y retourner.",
    ],
  },
  {
    id: "frise",
    titre: "La frise du temps",
    test: (c) => c.startsWith("/frise"),
    etapes: [
      "Voici toute l'histoire, de la plus ancienne étape à la plus récente.",
      "Imagine que l'histoire de la Terre dure une seule journée. L'heure te dit quand chaque chose arriverait.",
      "Les humains arrivent dans les toutes dernières secondes de la journée !",
    ],
  },
  {
    id: "fiche",
    titre: "La fiche d'un animal",
    test: (c) => c.startsWith("/mammiferes/e-"),
    etapes: [
      "C'est la fiche d'un animal. Tout en haut, son nom et son nom scientifique.",
      "Les mots en pointillés sont de vrais mots de scientifique. Touche-les pour avoir l'explication.",
      "La carte montre en doré les pays où il vit.",
      "« Mal connu » veut dire que les scientifiques n'ont pas encore mesuré cela. On n'invente jamais !",
      "Le bouton « Écouter » lit toute la fiche à voix haute.",
      "Chaque fiche que tu lis pour la première fois t'aide à gagner un paquet de cartes.",
    ],
  },
  {
    id: "famille",
    titre: "Une famille d'animaux",
    test: (c) => c.startsWith("/mammiferes/f-") || c.startsWith("/mammiferes/o-"),
    etapes: [
      "Voici un groupe d'animaux cousins. Touche un animal pour ouvrir sa fiche.",
      "S'il y en a beaucoup, le bouton « Voir la suite » en montre d'autres.",
    ],
  },
  {
    id: "mammiferes",
    titre: "Les mammifères",
    test: (c) => c.startsWith("/mammiferes"),
    etapes: [
      "Ici, il y a tous les mammifères connus : presque sept mille espèces !",
      "Touche un grand groupe pour l'ouvrir, puis choisis une famille.",
      "Tu cherches un animal précis ? Écris son nom à côté de la loupe.",
    ],
  },
  {
    id: "cartes",
    titre: "Les cartes",
    test: (c) => c.startsWith("/cartes"),
    etapes: [
      "Ici, tu ouvres des paquets de cartes d'animaux. Touche le paquet pour l'ouvrir.",
      "Ensuite, touche chaque carte pour la retourner. La plus belle arrive toujours en dernier.",
      "Les étoiles montrent la rareté : une étoile, l'animal vit dans beaucoup de pays. Cinq étoiles, il est très rare.",
      "Parfois, une onzième carte arrive en plus. Quelle chance !",
      "Pour gagner un paquet : lis trois nouvelles fiches, donne cinq bonnes réponses, ou réussis un jeu de mémoire.",
      "En bas, les albums rangent toutes les espèces. Celles que tu n'as pas encore sont en gris.",
    ],
  },
  {
    id: "memoire",
    titre: "Le jeu de mémoire",
    test: (c, p) => c.startsWith("/jouer") && p.get("jeu") === "memoire",
    etapes: [
      "Retrouve les paires d'animaux !",
      "Touche deux cartes. Si c'est le même animal, elles restent ouvertes. Sinon, elles se retournent.",
      "Essaie de te souvenir où sont les animaux. Moins tu fais de coups, mieux c'est !",
      "Choisis Facile, Moyen ou Difficile en haut. Une partie gagnée te donne un paquet de cartes.",
    ],
  },
  {
    id: "defi",
    titre: "Le défi du jour",
    test: (c, p) => c.startsWith("/jouer") && (p.get("jeu") ?? "defi") === "defi",
    etapes: [
      "Chaque jour, un nouveau défi de cinq questions t'attend !",
      "Réponds à chaque question, puis regarde l'explication avant de passer à la suivante.",
      "La petite flamme compte les jours réussis d'affilée. Reviens demain pour la faire grandir !",
      "À la fin du défi, tu gagnes un paquet de cartes.",
      "Les autres jeux sont dans les boutons en haut : mémoire, cris d'animaux, poids, cartes du monde.",
    ],
  },
  {
    id: "cri",
    titre: "Devine qui crie",
    test: (c, p) => c.startsWith("/jouer") && p.get("jeu") === "cri",
    etapes: ["Appuie sur le bouton lecture pour écouter le cri.", "Puis touche l'animal qui fait ce bruit. Ce sont de vrais enregistrements !"],
  },
  {
    id: "jouer",
    titre: "Les défis",
    test: (c) => c.startsWith("/jouer"),
    etapes: [
      "Choisis un jeu avec les boutons en haut.",
      "Chaque bonne réponse compte. Cinq bonnes réponses te font gagner un paquet de cartes.",
      "Après ta réponse, regarde bien : tu apprends quelque chose à chaque fois.",
    ],
  },
  {
    id: "fossiles",
    titre: "Les fossiles",
    test: (c) => c.startsWith("/fossiles"),
    etapes: [
      "Bienvenue dans la salle des fossiles. Ce sont des os, des coquilles ou des empreintes très anciens.",
      "Les onglets en haut montrent aussi les grandes extinctions, et les animaux disparus il n'y a pas longtemps.",
    ],
  },
  {
    id: "lexique",
    titre: "Le lexique",
    test: (c) => c.startsWith("/lexique"),
    etapes: ["Voici tous les vrais mots de l'encyclopédie, avec leur explication.", "Touche « Écouter » pour entendre une définition."],
  },
  {
    id: "profil",
    titre: "Ton carnet",
    test: (c) => c.startsWith("/profil"),
    etapes: [
      "C'est ton carnet à toi. Tu y vois tes cartes, tes bonnes réponses et tes médailles.",
      "Touche ton image, tout en haut, pour en choisir une autre.",
      "Le coin des parents, en bas, est pour les grandes personnes.",
    ],
  },
  {
    id: "suivi",
    titre: "Le suivi GPS",
    test: (c) => c.startsWith("/suivi"),
    etapes: [
      "Des scientifiques mettent parfois un collier GPS à un animal pour suivre ses voyages.",
      "Pour voir ces trajets, il faut Internet et l'accord d'une grande personne.",
    ],
  },
  {
    id: "sources",
    titre: "Les sources",
    test: (c) => c.startsWith("/sources"),
    etapes: ["Ici, on dit d'où viennent les informations. Les scientifiques font toujours ça !"],
  },
];

export function explicationPour(chemin: string, params: URLSearchParams): Explication {
  return PAGES.find((p) => p.test(chemin, params)) ?? PAGES[0];
}

/** Petites phrases de Plume quand il se passe quelque chose. */
export const REACTIONS = {
  paquet: ["Bravo ! Tu gagnes un paquet de cartes !", "Super ! Un nouveau paquet t'attend dans les cartes.", "Youpi, un paquet de plus !"],
  chance: ["Wah, la chance ! Une onzième carte !", "Une carte en plus ! Incroyable !"],
  rare: ["Oh, une carte rare !", "Regarde ces étoiles, elle est rare !"],
  memoire: ["Bravo, toutes les paires ! Tu as une super mémoire.", "Gagné ! Quelle mémoire !"],
  bonne: ["Bonne réponse !", "Bravo !", "Exactement !", "Bien joué !"],
  mauvaise: ["Presque ! Regarde la réponse, tu sauras la prochaine fois.", "Pas grave, on apprend en se trompant !"],
};

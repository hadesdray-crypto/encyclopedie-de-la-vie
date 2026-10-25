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
      "C'est ta page à toi, Leonie !",
      "La grande lune, au milieu, c'est le début de tout. Les bulles autour t'emmènent vers les bactéries, les plantes, les champignons ou les animaux.",
      "Jouer ouvre les jeux et le défi du jour. Mes cartes, c'est ta collection d'animaux.",
      "La Carte, c'est la Terre entière : touche un pays pour voir ses animaux, ou regarde les vrais voyages d'animaux suivis par GPS.",
      "Les petits boutons ouvrent les mammifères, les fossiles, la frise du temps et les vrais mots.",
      "Touche ton image, en haut à droite, pour voir ton carnet. La petite roue, c'est les Options.",
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
    id: "tables",
    titre: "Les tables magiques",
    test: (c, p) => c === "/jouer" && p.get("jeu") === "tables",
    etapes: [
      "Écris le résultat de chaque multiplication. Quand c'est juste, la ligne devient verte.",
      "Les chiffres en haut choisissent la table. Une étoile veut dire que la table est finie.",
      "Quand les neuf tables sont faites, tu gagnes le Plumedex : un cadre rouge et or, avec des boutons pour parcourir toutes les fiches. Et les paquets de cartes illimités !",
    ],
  },
  {
    id: "voyageurs",
    titre: "La carte du monde",
    test: (c) => c.startsWith("/voyageurs"),
    etapes: [
      "Voici la Terre ! Fais-la tourner avec ton doigt. Écarte deux doigts pour zoomer, ou utilise les boutons plus et moins.",
      "Le globe est dans une fenêtre dorée. La poignée en bas, avec les engrenages, la met en bandeau en haut ou l'agrandit. Quand une fiche s'ouvre, elle se met toute seule en bandeau : tu peux toujours toucher le globe.",
      "« Où vivent-ils ? » : touche un pays, ou cherche-le avec la loupe. Je te montre tous les mammifères qui y vivent, et tu peux les trier par groupe.",
      "« Les voyages » : chaque trait est le vrai voyage d'un animal suivi par GPS. Touche un trait pour savoir qui a voyagé, d'où il est parti et jusqu'où il est allé. Plus bas, « Tous les voyageurs » : touche un animal, et je te montre son voyage, du départ (en vert) à l'arrivée (en rouge).",
      "Certains voyages sont tout petits, comme ceux des chats : zoome beaucoup pour bien les voir.",
    ],
  },
  {
    id: "animaux",
    titre: "Les animaux",
    test: (c) => c.startsWith("/animaux"),
    etapes: [
      "Ici, tous les grands groupes d'animaux, avec de vraies photos.",
      "Les mammifères ont déjà toutes leurs fiches. Les autres groupes arriveront plus tard : pour l'instant, on peut les découvrir dans l'arbre de la vie.",
      "Les trois petits boutons en haut changent l'affichage : grandes cartes, médaillons ou liste.",
    ],
  },
  {
    id: "kratt",
    titre: "Les frères Kratt",
    test: (c) => c.startsWith("/kratt"),
    etapes: [
      "Chris et Martin Kratt sont deux vrais frères qui étudient les animaux.",
      "Les boutons ouvrent leurs vidéos sur Internet : « Sans pub » d'abord, sans publicité, puis YouTube.",
      "Il faut qu'un adulte ait allumé Internet dans le Coin des parents.",
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
      "Touche la photo pour voir l'animal en entier. Si ce n'est pas le bon animal, dis-le avec le bouton en bas : tu aides à réparer l'application !",
      "« En vidéo » : le premier bouton montre la vidéo sans publicité, le deuxième l'ouvre sur YouTube. Il faut qu'un adulte ait allumé Internet.",
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
    id: "aventure",
    titre: "L'Aventure",
    test: (c) => c.startsWith("/aventure") || c === "/suivi",
    etapes: [
      "Voici la carte du monde des animaux voyageurs.",
      "Des scientifiques leur mettent un collier GPS, pour savoir où ils vont.",
      "En couleur, les pays où vit chaque animal. Touche un animal, en dessous, pour voir son trajet.",
      "Pour charger un trajet, il faut Internet et l'accord d'une grande personne. Ensuite, il reste dans l'application.",
    ],
  },
  {
    id: "compagnons",
    titre: "Mon carnet des chiens et des chats",
    test: (c) => c.startsWith("/compagnons"),
    etapes: [
      "C'est mon carnet à moi : toutes les races de chiens et de chats que j'ai trouvées.",
      "Les chiens sont rangés en dix groupes, comme le fait la Fédération cynologique internationale. Touche un groupe pour l'ouvrir.",
      "Chaque fiche dit d'où vient la race, sa taille, son poids, son caractère et son histoire. Si on ne sait pas, c'est écrit « Non connu ».",
      "Le petit cœur rouge, ce sont mes préférés.",
    ],
  },
  {
    id: "options",
    titre: "Les options",
    test: (c) => c.startsWith("/options"),
    etapes: [
      "Ici, tu choisis comment marche ton encyclopédie : la voix, les sons, l'écriture.",
      "Touche le petit haut-parleur à côté d'un réglage, et je te le lis.",
      "Le bouton Oui ou Non allume ou éteint le réglage.",
    ],
  },
  {
    id: "suivi",
    titre: "Le suivi GPS",
    test: (c) => c.startsWith("/suivi"),
    etapes: [
      "Des scientifiques mettent parfois un collier GPS à un animal pour suivre ses voyages.",
      "Les trajets déjà rangés dans l'application s'affichent sans Internet. Pour en charger d'autres, il faut Internet et l'accord d'une grande personne.",
    ],
  },
  {
    id: "sources",
    titre: "Les sources",
    test: (c) => c.startsWith("/sources"),
    etapes: ["Ici, on dit d'où viennent les informations. Les scientifiques font toujours ça !"],
  },
];

/** Toutes les pages que Plume explique (pour que les personnages bonus puissent avoir leurs propres explications). */
export const PAGES_EXPLIQUEES: Explication[] = PAGES.map(({ id, titre, etapes }) => ({ id, titre, etapes }));

export function explicationPour(chemin: string, params: URLSearchParams): Explication {
  return PAGES.find((p) => p.test(chemin, params)) ?? PAGES[0];
}

/** Petites phrases de Plume quand il se passe quelque chose. */
export const REACTIONS = {
  paquet: ["Un paquet de cartes pour toi.", "Un nouveau paquet t'attend dans les cartes.", "Tu as gagné un paquet."],
  chance: ["Une onzième carte… quelle chance.", "Une carte en plus."],
  rare: ["Oh… une carte rare.", "Regarde ses étoiles : elle est rare."],
  memoire: ["Toutes les paires. Belle mémoire.", "Gagné. Tu as bien retenu."],
  bonne: ["Bonne réponse.", "C'est ça.", "Bien vu.", "Exactement."],
  mauvaise: ["Presque. Regarde la réponse, tu sauras la prochaine fois.", "Ce n'est pas grave : on apprend en se trompant."],
};

/** Le petit discours de Plume : à la première ouverture, puis quand Leonie le demande. */
export const PRESENTATION: Explication = {
  id: "presentation",
  titre: "Coucou Leonie !",
  etapes: [
    "Coucou Leonie ! Oh… c'est toi ? Je suis tellement contente que ce soit toi qui t'occupes de moi. Je m'appelle Plume, je suis ta chouette.",
    "Cette encyclopédie a été faite rien que pour toi. Elle raconte toute l'histoire de la vie, depuis la naissance de la Terre. Et elle marche même sans Internet.",
    "En résumé : tu peux remonter le temps dans l'arbre de la vie, découvrir presque 7 000 mammifères, jouer, collectionner des cartes d'animaux, et suivre de vrais animaux voyageurs.",
    "Et moi, je suis toujours là pour t'aider. Touche-moi deux fois pour ouvrir mon menu. Appuie longtemps pour me déplacer. Mon caractère et ma voix se changent dans mon menu, avec Réglages.",
    "Tu veux que je t'explique une partie en détail ? Choisis un bouton. Ou bien pars explorer toute seule !",
  ],
};

/** Les explications en détail, au choix, à la fin de la présentation. */
export const SUJETS: (Explication & { bouton: string })[] = [
  {
    id: "sujet-arbre", bouton: "L'arbre de la vie", titre: "L'arbre de la vie",
    etapes: [
      "Sur l'accueil, la grande image au milieu, c'est le tout début de la Terre. Touche-la pour commencer le voyage dans le temps.",
      "Les bulles autour t'emmènent directement vers les bactéries, les plantes, les champignons, les reptiles ou les animaux.",
      "Sur chaque image, une petite étiquette dit si c'est une vraie photo, un vrai fossile, ou une reconstitution faite par des scientifiques.",
      "La frise du temps range toute l'histoire de la vie sur une seule journée : les humains n'arrivent qu'à la toute fin !",
    ],
  },
  {
    id: "sujet-animaux", bouton: "Les animaux", titre: "Les animaux et leurs fiches",
    etapes: [
      "La porte « Animaux » de l'accueil montre tous les grands groupes. Les mammifères ont déjà toutes leurs fiches : presque 7 000 !",
      "Sur une fiche : où vit l'animal sur la carte, ce qu'il mange, son poids, combien de temps il vit… « Mal connu » veut dire que les scientifiques ne le savent pas encore. On n'invente jamais.",
      "Les mots en pointillés sont de vrais mots de scientifique : touche-les, je te les explique.",
      "Touche la photo pour voir l'animal en entier. Et s'il y a une vidéo, un adulte peut l'allumer.",
      "La loupe cherche un animal dès que tu commences à écrire. Il y a aussi une salle rien que pour les chiens et les chats.",
    ],
  },
  {
    id: "sujet-jouer", bouton: "Jouer et les cartes", titre: "Jouer et les cartes",
    etapes: [
      "Jouer ouvre tous les jeux : seule, ou à plusieurs sur le même téléphone, parfois face à face.",
      "Le défi du jour revient chaque jour. Si tu le fais plusieurs jours de suite, ta petite flamme grandit !",
      "En lisant des fiches et en jouant, tu gagnes des paquets de cartes d'animaux pour ta collection.",
      "Et si tu remplis toutes les tables magiques de multiplication, tu gagnes le Plumedex !",
    ],
  },
  {
    id: "sujet-aventure", bouton: "La Carte", titre: "La carte du monde",
    etapes: [
      "Des scientifiques posent parfois un collier GPS à un animal pour suivre ses voyages.",
      "La Carte ouvre le globe : fais tourner la Terre avec ton doigt, et touche un trajet pour savoir qui a voyagé, d'où il est parti et jusqu'où il est allé.",
      "Chaque couleur est une famille d'animaux : bleu pour la mer, vert pour les herbivores, doré pour les oiseaux, rouge pour les prédateurs. D'autres voyageurs arriveront plus tard.",
    ],
  },
  {
    id: "sujet-plume", bouton: "Moi, Plume", titre: "Moi, Plume",
    etapes: [
      "Touche-moi une fois : je te fais coucou. Deux fois : mon menu s'ouvre, pour t'aider sur la page où tu es.",
      "Appuie longtemps sur moi : je grandis un peu, et tu peux me poser où tu veux sur l'écran.",
      "Tu peux même me lancer d'un geste rapide… mais je n'aime pas trop ça ! Et si tu secoues le téléphone, ça me fait tourner la tête.",
      "Mon menu a cinq boutons : Écouter (je lis la page), Aide (j'explique la page), Mots (les mots difficiles), Astuce, et Réglages.",
      "J'ai quatre caractères, avec chacun sa tenue, ses gestes et sa voix : discrète (je ne fais que cligner des yeux), présente, étudiante (avec mes lunettes et mon chapeau), ou passionnée (la savante folle !). On les choisit dans Réglages. Je peux aussi me reposer.",
      "Dans les Options, tu peux aussi décider si je lis toute seule, si je réagis aux animaux, et à quelle vitesse je parle.",
      "Une astuce : appuie longtemps sur un texte, et je te le lis à voix haute.",
    ],
  },
  {
    id: "sujet-options", bouton: "Les réglages", titre: "Les réglages et le coin des parents",
    etapes: [
      "La petite roue, en haut de l'accueil, ouvre les Options : la voix et sa vitesse, les sons, l'écriture plus grosse, et mon caractère.",
      "C'est aussi là que l'application cherche ses mises à jour.",
      "Le Coin des parents est pour les grandes personnes : le temps d'écran de la journée, et Internet pour les vidéos.",
      "Et le bouton « Revivre la première utilisation » me fait tout te présenter de nouveau, comme aujourd'hui.",
    ],
  },
];


/** Les astuces de Plume, page par page (le bouton « Astuce » de sa bulle). */
export const ASTUCES: Record<string, string[]> = {
  accueil: ["Appuie longtemps sur un texte : je te le lis.", "Le chiffre rouge, en bas, compte tes paquets de cartes à ouvrir.", "Fais le défi chaque jour pour faire grandir ta flamme !"],
  arbre: ["Le chemin, tout en haut, te ramène aux étapes d'avant.", "Touche « Comment on le sait ? » pour découvrir les preuves des scientifiques."],
  frise: ["Si toute l'histoire de la Terre durait une journée, les humains arriveraient à la toute fin, juste avant minuit."],
  fiche: ["Les mots en pointillés sont des mots de scientifique : touche-les pour l'explication.", "Le bouton « Écouter » lit toute la fiche."],
  famille: ["Touche un animal pour ouvrir sa fiche. Chaque nouvelle fiche t'aide à gagner un paquet."],
  mammiferes: ["Écris le nom d'un animal à côté de la loupe pour le trouver vite."],
  cartes: ["Lis trois nouvelles fiches pour gagner un paquet.", "La plus belle carte arrive toujours en dernier !"],
  memoire: ["Commence par retourner les cartes dans l'ordre, et retiens bien où sont les animaux."],
  defi: ["Si tu hésites longtemps, je peux t'aider avec un indice."],
  cri: ["Tu peux réécouter le cri autant de fois que tu veux."],
  jouer: ["Si tu hésites longtemps, je peux t'aider avec un indice."],
  fossiles: ["Les fossiles sont des traces très anciennes : des os, des coquilles, des empreintes."],
  lexique: ["Touche « Écouter » pour entendre une définition."],
  profil: ["Touche ton image pour en choisir une autre."],
  aventure: ["Un trajet chargé une fois reste dans l'application, même sans Internet."],
  suivi: ["Un trajet chargé une fois reste dans l'application, même sans Internet."],
  compagnons: ["Écris le nom d'une race à côté de la loupe pour la trouver vite.", "Le petit cœur rouge, ce sont mes préférés."],
  options: ["Touche-moi deux fois, puis Réglages, pour me rendre plus discrète ou plus bavarde."],
  sources: ["Les scientifiques disent toujours d'où viennent leurs informations."],
};

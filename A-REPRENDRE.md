# À reprendre — Encyclopédie de la vie (pour la princesse Leonie)

Le cahier des charges complet est dans HANDOFF.md (projet d'origine) et dans le résumé de l'utilisateur.

## Fait
- Nouveau projet hors ligne, sans serveur : React 19 + esbuild + Tailwind 4 (scripts/build.mjs), routeur par « # » (src/lib/routeur.tsx), service worker (src/sw-modele.js) qui enregistre l'application, puis les photos et les cris.
- Polices locales (public/fonts, licence OFL). Carte du monde hors ligne (src/data/monde.json, Natural Earth, domaine public).
- src/data/arbre.ts : l'arbre et guide de l'évolution (environ 60 étapes, badge preuve, scénario ou débat, « comment on le sait »). Oiseaux et insectes : place gardée, pas d'espèces.
- src/data/fossiles.ts : 17 fossiles et les 5 extinctions.
- src/data/lexique.ts : 39 mots ajoutés.
- src/data/mammiferes.json : pays de chaque espèce ajoutés (scripts/ajout_pays.py, d'après la Mammal Diversity Database).
- public/theme : illustrations découpées dans l'image de référence de l'utilisateur.
- Pages écrites : src/main.tsx, src/pages/accueil.tsx (style de l'image), src/pages/arbre.tsx. Composants : barre, entete, icone, portrait, voix, mot.

## Mise à jour (00 h 30)
Toutes les pages existent et l'application marche : `node scripts/build.mjs`, puis ouvrir dist/ avec un petit serveur
(par exemple `cd dist && python3 -m http.server`). Accueil dans le style de l'image, arbre, frise, mammifères,
fiches (carte du monde, mâle et femelle), fossiles, jeux, cartes, profil (hors ligne, coin des parents), GPS, sources.
Aucune erreur dans la console. Les points 1 à 3 ci-dessous sont faits.

## Reste à faire
1. Pages : frise, lexique, sources, mammifères (index, ordre, famille, fiche avec carte, cri et grande fiche mâle/femelle de src/data/fiches.ts), fossiles, jouer, cartes (porter src/lib/paquets.ts), profil (carnet, hors ligne, coin des parents pour Internet), suivi GPS.
   Les anciennes versions sont dans le zip d'origine, dossier src/routes.
2. CSS à ajouter dans styles.css : .medaillon-or, .rouleau, .rouleau-parchemin/ardoise/lavande, .bouton-bois, .bouton-parchemin, .ruban (animation de lueur), puis la barre du bas en bois avec les icônes public/theme (maison, cristal, etoile, cartes, sourire).
3. Construire : `npm install` puis `node scripts/build.mjs` (dépendances : react, react-dom, react-icons, esbuild, tailwindcss).
4. Revoir les 3 360 photos (public/m). Il y a au moins une carte de géographie à retirer. Retirer aussi les animaux morts, garder crânes et squelettes.
5. Avec accès à Wikipédia, Wikidata, GBIF et iNaturalist : noms français, crédits des photos, cris CC0/CC BY.
6. GitHub : README, workflow GitHub Pages.

## Mise à jour (24 octobre)
- Ouverture de paquets animée (tremblement, déchirure, cartes retournées une à une, cadres par rareté, holographie, « Wah, la chance ! »), sons synthétisés (src/lib/sons.ts), bouton pour couper le son.
- Jeu de mémoire (3 niveaux, avec les animaux de la collection).
- Rareté calculée avec la liste des pays (plus de « répartition mal connue » à tort).
- Les paquets tirent d'abord les animaux qui ont un nom français et une photo.
- Photos relues une par une : 317 retirées (cartes de géographie, peaux de musée, animaux qui semblent morts, images vides). Liste : scripts/photos-retirees.txt.

## Mise à jour (29 octobre)
- Page des pays : « Les stars du pays » d'abord, puis des sections (Sur la terre, Dans les arbres, Dans l'eau, Dans les airs, Les petites bêtes), et une recherche dans le pays. Classement de célébrité : src/lib/connu.ts (liste des stars + estimation), complété chaque mois par le robot « Célébrité des animaux » (.github/workflows/notoriete.yml, scripts/donnees/notoriete.py → src/data/notoriete.json).
- Voyages GPS : bouton « Voyager avec lui, vu du ciel » (src/components/voyage-satellite.tsx) : images satellite Esri, lecture, recul, avance rapide, caméra qui suit, Plume qui commente, fichier KML pour Google Earth. Seulement si Internet est permis (Coin des parents). L'APK embarque @capacitor/filesystem et @capacitor/share pour partager le fichier.
- Plume s'appelle toujours Plume : le nom d'un personnage bonus ne remplace plus « Plume » (src/lib/compagnons.ts, nomCompagnon).
- L'histoire de Plume (src/lib/histoire.ts, src/components/histoire.tsx, page #/nid) : un ami (Leonie choisit son nom), câlins d'amoureux, mal au ventre, un œuf à réchauffer 5 jours (vraies infos sur les chouettes), naissance du bébé (Leonie choisit son nom). L'ami et le bébé restent à côté de Plume. Le braconnier passe au plus une fois par jour : on le touche, il tombe, se relève et repart dégoûté. Coin des parents dans le nid : avancer d'un jour, faire venir le braconnier, l'éteindre, recommencer.
- Idées pour la suite : le bébé qui grandit et apprend à voler, d'autres visiteurs (un garde forestier qui remercie Leonie).
- Le braconnier façon Bip Bip et Coyote (src/components/braconnier.tsx) : trois scènes (filet qui finit sur sa tête, fusil dont la balle rebondit sur le bouclier du Concepteur, course où il s'écrase contre le bord de l'écran). On peut l'attraper et le lancer : gravité, rebonds, rotation, bobos (pansement, bosse, bandage), étoiles, mots « BOING ! ». Plume gagne toujours. Coin des parents du nid : un bouton par scène.

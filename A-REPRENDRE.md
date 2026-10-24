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

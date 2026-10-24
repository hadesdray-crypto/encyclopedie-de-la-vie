# Encyclopédie de la vie — pour la princesse Leonie

Application française, hors ligne, pour une fille de 8 ans (Leonie). Encyclopédie des mammifères, plus un arbre de la vie très simple. Le style visuel voulu est un ciel de nuit violet, titres dorés, médaillons, boutons parchemin, barre en bas. Les informations scientifiques ne doivent pas être inventées.

## Lancer

```bash
npm install
npm run dev
```

Le serveur de développement écoute sur le port 8080. `npm run typecheck` vérifie TypeScript. Il n'y a pas de compte obligatoire pour lire l'encyclopédie.

`node_modules` n'est pas dans ce paquet. `npm install` le recrée. Les photos et les données, elles, sont dedans.

## Ce qui est dans le paquet

| Dossier | Contenu |
|---|---|
| `src/routes` | Pages |
| `src/data/mammiferes.json` | 6 904 espèces, 169 familles, 27 ordres |
| `src/data/photos.json` | Identifiants des photos qui existent |
| `src/data/lexique.ts` | Mots expliqués, pour une enfant |
| `src/data/fiches-vie.ts` | Régimes alimentaires et leurs définitions |
| `public/m` | Environ 3 360 photos WebP, plus `absent.webp` |
| `public/art` | Dessins de la page d'accueil et de l'arbre |
| `public/s` | Cris déjà enregistrés (un seul pour l'instant) |
| `scripts/build_mammiferes.py` | Construction du catalogue |
| `scripts/fetch_cris_gbif.py` | Cris CC0 ou CC BY, pas encore terminé |
| `scripts/index_movebank.py` | Études GPS publiques, métadonnées seulement |

## Pages

- `/` Accueil. Cercle de la vie, six boutons. Tout doit rester au-dessus de la barre du bas.
- `/arbre` Arbre tactile. On part de la Terre, molécules, acides aminés, ARN, protéines, ADN, LUCA, puis les branches. Ce n'est pas un arbre scientifique complet. Les familles fines ne sont pas toutes dessinées.
- `/mammiferes` Dix groupes pour s'y retrouver, puis les vrais ordres, puis les familles. Recherche par animal, famille ou ordre.
- `/mammiferes/o-Carnivora` Un ordre.
- `/mammiferes/f-Felidae` Une famille. 40 espèces à la fois, bouton « Voir la suite ».
- `/mammiferes/e-1006020` Fiche espèce. Exemple : le lion.
- `/lexique` Définitions.
- `/cartes` Paquets de 10 cartes. Parfois 11, au hasard, pas une fois sur six. Albums par rareté. Les cartes renvoient aux vraies espèces.
- `/jouer` Petit jeu sur le régime alimentaire.
- `/fossiles` Salle des fossiles. Squelettes et crânes sont voulus. Pas de photo d'animal mort.
- `/profil` Carnet local (ce qu'elle a déjà ouvert).
- `/suivi/$id` Page GPS. Ne doit pas appeler Internet.

La barre du bas : Accueil, Arbre, Jouer, Cartes, Profil.

## Règles déjà décidées

- Français simple, mais les vrais mots : gestation, carnivore, nom scientifique. Un mot difficile est dans le lexique, avec des pointillés.
- Une fiche : nom, nom latin, famille, ordre, répartition, régime, milieu, portée, gestation, masse, longévité, statut UICN, cri.
- Si une mesure n'est pas publiée : « Mal connu. » Ne pas inventer un chiffre.
- Cri : bouton audio seulement si le fichier est dans `public/s` et l'identifiant est dans `src/data/cris.json`. Sinon afficher **NC** (non connu).
- Pas de photo d'animal mort, de dépouille ou de taxidermie qui fait penser à un cadavre. Les crânes et les squelettes restent : c'est de l'archéologie. Un animal couché dans le sable, s'il n'est pas mort, reste.
- S'il n'y a pas de photo : `public/m/absent.webp`.
- Oiseaux et insectes : pas d'espèces pour l'instant. On pourra en faire une autre application.
- L'application doit marcher **sans connexion**. Tout ce qui a besoin d'Internet doit être écrit comme tel, et ne pas se lancer tout seul.
- Les boutons du bas ne doivent jamais recouvrir un bouton de la page. C'est déjà arrivé : Cartes et Profil étaient cachés, un toucher ouvrait la mauvaise page.

## Données

`mammiferes.json` vient de Mammal Diversity Database et de traits publiés (COMBINE). Les photos viennent surtout de Wikipédia, converties en WebP (qualité basse, côté max 420 px) pour peser peu.

Les régimes utilisent les vrais noms (carnivore, herbivore, etc.) avec une explication dans `fiches-vie.ts`.

Un seul cri est enregistré : l'opossum de Virginie, identifiant `1000023`, licence CC BY. Le script `scripts/fetch_cris_gbif.py` interroge iNaturalist puis GBIF, et ne garde que CC0 et CC BY. Il refuse CC BY-NC. Xeno-canto répond 401 sans clé. Macaulay Library n'a pas d'API de téléchargement. Ne pas inventer un cri.

## GPS

`src/data/suivi-gps.json` dit seulement qu'une étude publique Movebank existe :

- Panthera leo, étude 220229, Tsavo Lion Study
- Potos flavus, étude 1120749252

`src/data/traces.json` est vide. Les points GPS ne sont pas dans l'application. Movebank a renvoyé l'erreur 429 après trop de demandes. Un extrait de quelques points pèse environ 1 Ko. Une étude entière peut peser des centaines de Mo. Ne pas tout télécharger sans accord. La page `/suivi` doit le dire clairement et ne pas appeler Movebank ni un fond de carte en ligne.

## Ce qui n'est pas fini

- La plupart des cris : NC.
- Presque aucune photo manquante n'a été complétée. Ne pas prendre les photos GBIF de musée : beaucoup montrent un animal mort.
- L'arbre de la vie s'arrête aux grands groupes. Les 169 familles ne sont pas dessinées autour du cercle.
- Le jeu de cartes n'a pas d'illustration spéciale par rareté, à part le tri.
- Le style de l'accueil est en place. Toutes les pages intérieures ne ressemblent pas encore parfaitement au même univers.
- Les oiseaux et les insectes sont hors sujet pour l'instant.

## Fichiers utiles pour reprendre

- `src/routes/index.tsx` page d'accueil
- `src/routes/arbre.tsx` arbre
- `src/routes/mammiferes.index.tsx` groupes et familles
- `src/routes/mammiferes.$id.tsx` ordre, famille, fiche
- `src/routes/cartes.tsx` et `src/lib/paquets.ts` cartes
- `src/components/barre.tsx` barre du bas
- `src/components/portrait.tsx` photo ou dessin de remplacement
- `src/styles.css` couleurs

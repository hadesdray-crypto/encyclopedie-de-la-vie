# Encyclopédie de la vie — pour la princesse Leonie

Une application en français pour une enfant de 8 ans : l'histoire de la vie depuis la formation de la Terre, l'arbre de l'évolution étape par étape, les 6 904 mammifères avec leurs fiches, les fossiles, des jeux et des cartes à collectionner.

- **Marche sans Internet** une fois ouverte : elle s'enregistre sur l'appareil, photos comprises.
- **On n'invente rien** : si une mesure n'est pas publiée, la fiche dit « Mal connu ». Chaque étape de l'évolution indique si c'est une preuve, un scénario ou un débat.
- Les options qui ont besoin d'Internet (trajets GPS) sont éteintes. Un adulte peut les allumer dans Profil, « Coin des parents ».

## Ouvrir l'application

Lien : https://hadesdray-crypto.github.io/encyclopedie-de-la-vie/

Sur une tablette ou un téléphone : ouvrir ce lien, puis « Ajouter à l'écran d'accueil ».

## Modifier

| Quoi | Où |
|---|---|
| Étapes de l'évolution (arbre et frise) | `src/data/arbre.ts` |
| Fossiles et extinctions | `src/data/fossiles.ts` |
| Mots du lexique | `src/data/lexique.ts` |
| Grandes fiches (mâle, femelle) | `src/data/fiches.ts`, `src/data/fiches-vie.ts` |
| Catalogue des mammifères | `src/data/mammiferes.json` (scripts dans `scripts/`) |
| Pages | `src/pages/` |
| Couleurs et style | `src/styles.css` |

Construire en local : `npm install`, puis `npm run build` (résultat dans `dist/`), ou `npm run dev` pour un serveur sur le port 8080.
Chaque envoi sur la branche `main` republie le site automatiquement.

La liste de ce qui reste à faire est dans `A-REPRENDRE.md`. Le cahier des charges d'origine est dans `HANDOFF.md`.

## Sources

Mammal Diversity Database, COMBINE et EltonTraits, Wikimedia Commons (photos, crédits à compléter), Natural Earth (carte, domaine public), Commission internationale de stratigraphie, Movebank. Polices Nunito et Fraunces sous licence SIL OFL.

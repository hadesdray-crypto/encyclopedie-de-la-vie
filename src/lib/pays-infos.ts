// Ce que Plume raconte sur un pays, pour comprendre ses animaux.
// Tout est calculé à partir de vraies données : les contours du pays (latitudes), le continent,
// et la répartition des mammifères (Mammal Diversity Database). Rien n'est inventé.
import { GROUPES, groupeDeOrdre, type Espece } from "@/data/catalogue";
import paysData from "@/data/pays.json";
import { latitudesPays } from "@/components/globe";
import { connu } from "@/lib/connu";

const TROPIQUE = 23.44, CERCLE_POLAIRE = 66.56;
const CONTINENT = paysData as Record<string, { n: string; c: string }>;

export function recitPays(code: string, especes: Espece[]): string[] {
  const phrases: string[] = [];
  const c = CONTINENT[code]?.c;
  if (c) phrases.push(c === "Antarctique" ? "Ce pays est en Antarctique." : `Ce pays est en ${c}.`);
  const lat = latitudesPays(code);
  if (lat) {
    const [s, n] = lat;
    const zones: string[] = [];
    if (s < TROPIQUE && n > -TROPIQUE) zones.push("la zone tropicale, où le soleil chauffe fort toute l'année");
    if (n > TROPIQUE && s < CERCLE_POLAIRE || s < -TROPIQUE && n > -CERCLE_POLAIRE) zones.push("la zone tempérée, où il y a des saisons, un été et un hiver");
    if (n > CERCLE_POLAIRE || s < -CERCLE_POLAIRE) zones.push("la zone polaire, où l'hiver est très long et très froid");
    if (zones.length === 1) phrases.push(`La plus grande partie du pays est dans ${zones[0]}.`);
    else if (zones.length > 1) phrases.push(`La plus grande partie du pays touche plusieurs zones de climat : ${zones.join(" ; ")}.`);
    if (n < 0) phrases.push("Il est dans l'hémisphère sud : quand c'est l'hiver en France, c'est l'été là-bas.");
    if (zones.length && zones[0].startsWith("la zone tropicale") && (n + s) / 2 < TROPIQUE && (n + s) / 2 > -TROPIQUE) phrases.push("Là où il fait chaud et humide toute l'année, comme dans les forêts tropicales, il y a souvent beaucoup d'espèces différentes.");
  }
  const sauvages = especes.filter((e) => !e.domestique);
  if (!sauvages.length) {
    phrases.push("Aucun mammifère sauvage n'est noté pour ce pays dans l'application.");
    return phrases;
  }
  phrases.push(`${sauvages.length} espèces de mammifères sauvages y vivent.`);
  const parGroupe = GROUPES.map((g) => ({ g, n: sauvages.filter((e) => groupeDeOrdre(e.ordre)?.id === g.id).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  if (parGroupe.length >= 2) phrases.push(`Les groupes les plus nombreux ici : ${parGroupe.slice(0, 3).map((x) => `${x.g.nom.toLocaleLowerCase("fr")} (${x.n})`).join(", ")}.`);
  const uniques = sauvages.filter((e) => e.pays?.length === 1 && !e.disparue);
  if (uniques.length) {
    phrases.push(uniques.length === 1 ? "Un de ces animaux ne vit nulle part ailleurs sur Terre." : `${uniques.length} de ces animaux ne vivent nulle part ailleurs sur Terre.`);
    if (uniques.length >= 10 && uniques.length / sauvages.length >= 0.15)
      phrases.push("C'est beaucoup ! Quand une région reste isolée pendant très longtemps, comme une île ou de hautes montagnes, ses animaux évoluent à part, et de nouvelles espèces apparaissent.");
  }
  const disparues = especes.filter((e) => e.disparue);
  if (disparues.length) phrases.push(disparues.length === 1 ? "Une espèce qui vivait ici a disparu." : `${disparues.length} espèces qui vivaient ici ont disparu.`);
  const stars = [...sauvages].sort((a, b) => connu(b.id) - connu(a.id)).filter((e) => e.langue === "fr").slice(0, 3);
  if (stars.length && connu(stars[0].id) > 0) phrases.push(`Les plus connus : ${stars.map((e) => e.nom).join(", ")}.`);
  return phrases;
}

// À quel point un animal est connu : le nombre de visites de sa page Wikipédia en français
// pendant les 12 derniers mois (données réelles de Wikimedia, récoltées sans les données de l'appareil).
// Sert à ranger les listes du plus connu au moins connu : Leonie reconnaît d'abord les animaux qu'elle connaît.
import data from "@/data/notoriete.json";

const N = data as Record<string, number>;
export const connu = (id: string) => N[id] ?? 0;
export const connuLatin = (latin: string) => N["latin:" + latin] ?? 0;
/** Pour trier : le plus connu d'abord, puis par nom. */
export const parConnu = (a: { id: string; nom: string }, b: { id: string; nom: string }) => connu(b.id) - connu(a.id) || a.nom.localeCompare(b.nom, "fr");

// Le caractère de Plume : émerveillée par tous les animaux, sérieuse quand il le faut.
// Elle ne dit que des choses vraies : ses phrases s'appuient sur les données de la fiche.
import type { Espece } from "@/data/catalogue";
import { grammesDe } from "@/lib/poids";
import { plumeDit, plumeParleSeule, plumePeutProposer } from "@/lib/plume";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";

function auHasard<T>(l: T[]) {
  return l[Math.floor(Math.random() * l.length)];
}

/** Ce que Plume pense de cet animal (ou rien : elle ne parle pas à chaque fiche). */
export function avisDePlume(e: Espece): string | null {
  // Sérieuse : les espèces disparues ou menacées.
  if (e.disparue || e.statut === "Éteint") return "Cette espèce a disparu… On ne peut plus la voir que grâce aux os, aux dessins et aux livres.";
  if (e.statut === "Éteint à l'état sauvage") return "Il n'en reste plus dans la nature. Ils vivent seulement là où des humains s'en occupent.";
  if (e.statut === "En danger critique") return "Celui-ci est en danger critique : il en reste très peu dans la nature. Il faut bien le connaître pour le protéger.";
  if (e.statut === "En danger" || e.statut === "Vulnérable") return "Celui-ci est menacé. C'est important de bien le connaître, pour mieux le protéger.";
  // Ses préférés : les chiens, comme Leonie.
  if (e.latin === "Canis familiaris") return "Un chien ! Ce sont mes préférés… comme toi, Leonie !";
  // Ce qui lui fait un peu peur : la martre grimpe aux arbres et visite parfois les nids de chouettes.
  if (e.latin === "Martes martes") return "Oh… une martre. Elle grimpe très bien aux arbres, et elle visite parfois les nids de chouettes. Brr !";
  // Émerveillée : des chiffres vrais, tirés de la fiche.
  const g = grammesDe(e.masse);
  if (g !== null && g >= 1_000_000) return "Waouh ! Il pèse plus d'une tonne !";
  if (g !== null && g < 10) return "Oh, qu'il est petit : il pèse moins de dix grammes !";
  if (Math.random() < 0.35) return auHasard(["Oh ! Regarde-le bien…", "Waouh, un nouvel animal !", "Oh, j'adore découvrir un animal avec toi !"]);
  return null;
}

/** Plume dit son avis depuis son coin, si elle n'est pas discrète. */
export function plumeRegarde(e: Espece) {
  window.setTimeout(() => {
    if (!plumePeutProposer()) return;
    const avis = avisDePlume(e);
    if (!avis) return;
    plumeDit(avis, 5000);
    if (plumeParleSeule() && voixPossible()) dire(avis);
  }, 1200);
}

// Le caractère de Plume : émerveillée par tous les animaux, mais tout en douceur, et sérieuse quand il le faut.
// Elle ne dit que des choses vraies : ses phrases s'appuient sur les données de la fiche.
import type { Espece } from "@/data/catalogue";
import { grammesDe } from "@/lib/poids";
import { plumeAPeur, plumeDit, plumeParleSeule, plumePeutProposer } from "@/lib/plume";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";

/**
 * Ce que Plume pense de cet animal, ou rien : elle ne parle pas à chaque fiche.
 * Son émerveillement reste discret : une petite phrase douce, jamais de cris.
 */
export function avisDePlume(e: Espece): string | null {
  // Sérieuse : les espèces disparues ou menacées.
  if (e.disparue || e.statut === "Éteint") return "Cette espèce a disparu. On la connaît grâce aux os, aux dessins et aux livres.";
  if (e.statut === "Éteint à l'état sauvage") return "Il n'en reste plus dans la nature. Ils vivent seulement là où des humains s'en occupent.";
  if (e.statut === "En danger critique") return "Il en reste très peu dans la nature. Bien le connaître aide à le protéger.";
  if (e.statut === "En danger" || e.statut === "Vulnérable") return "Celui-ci est menacé. Bien le connaître aide à le protéger.";
  // Ses préférés : les chiens, comme Leonie.
  if (e.latin === "Canis familiaris") return "Un chien… mes préférés. Comme toi, Leonie.";
  // Émerveillée, mais tout bas : des chiffres vrais, tirés de la fiche, et pas souvent.
  if (Math.random() > 0.3) return null;
  const g = grammesDe(e.masse);
  if (g !== null && g >= 1_000_000) return "Plus d'une tonne… impressionnant.";
  if (g !== null && g < 10) return "Moins de dix grammes… tout léger.";
  return null;
}

/**
 * Les animaux qui font un peu peur à Plume (même si elle les aime) : ils mangent parfois des chouettes
 * ou leurs petits. Ce sont des faits connus des naturalistes.
 */
const PEURS: Record<string, string> = {
  "Martes martes": "Hou ! La martre grimpe aux arbres… et visite parfois les nids de chouettes. Brrr !",
  "Martes foina": "Hou ! La fouine se faufile partout, même dans les granges où nichent les chouettes. Brrr !",
  "Vulpes vulpes": "Hou ! Le renard attrape parfois les jeunes chouettes tombées du nid. Je reste bien en haut de mon arbre !",
};
export function peurDePlume(e: Espece): string | null {
  return PEURS[e.latin] ?? null;
}

/** Plume dit son avis depuis son coin, si elle n'est pas discrète. */
export function plumeRegarde(e: Espece) {
  window.setTimeout(() => {
    if (!plumePeutProposer()) return;
    const peur = peurDePlume(e);
    if (peur) {
      plumeAPeur(peur);
      if (plumeParleSeule() && voixPossible()) dire(peur);
      return;
    }
    const avis = avisDePlume(e);
    if (!avis) return;
    plumeDit(avis, 4000);
    if (plumeParleSeule() && voixPossible()) dire(avis);
  }, 1200);
}

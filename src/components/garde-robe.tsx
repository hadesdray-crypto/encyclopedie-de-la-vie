// La garde-robe des compagnons : couleurs, épaisseurs, chapeaux, tenues et accessoires.
// Tout est dessiné (SVG), dans le même repère que Plume (200 × 200), pour rester joli et cohérent.
// Pour ajouter un vêtement plus tard : une ligne dans la liste, et son dessin dans le « switch ».

import type { Tenue } from "@/components/vestiaire";

/** Le look d'un personnage bonus : sa couleur, son épaisseur, et chaque morceau de sa tenue (voir vestiaire.tsx). */
export type Look = { couleur: string; epaisseur: 1 | 2 | 3 | 4 } & Tenue;

/** Les looks enregistrés avec l'ancienne garde-robe (tenue + accessoire) passent au nouveau vestiaire. */
export function normaliser(l: Partial<Look> & { tenue?: string; accessoire?: string }): Look {
  const ancienHaut: Record<string, string> = { maillot: "foot", blouse: "medecin", foulard: "fleurs" };
  const ancienBas: Record<string, string> = { tutu: "tutu", salopette: "salopette" };
  const t = l.tenue ?? "";
  return {
    couleur: l.couleur ?? "bleu",
    epaisseur: l.epaisseur ?? 2,
    haut: l.haut ?? (ancienBas[t] ? "aucun" : ancienHaut[t] ?? (t || "aucun")),
    bas: l.bas ?? ancienBas[t] ?? "aucun",
    chapeau: l.chapeau ?? "aucun",
    lunettes: l.lunettes ?? (["rondes", "soleil", "coeurs"].includes(l.accessoire ?? "") ? l.accessoire! : "aucune"),
    chaussures: l.chaussures ?? "aucune",
    objet: l.objet ?? "aucun",
    couleurs: l.couleurs ?? {},
  };
}

export const COULEURS_CORPS: { id: string; nom: string; clair: string; fonce: string; aile: string; oreille: string }[] = [
  { id: "violet", nom: "Violet", clair: "#c9a4ff", fonce: "#7a4fd0", aile: "#6a3fc0", oreille: "#f3a0e0" },
  { id: "bleu", nom: "Bleu", clair: "#a4d4ff", fonce: "#3f7fd0", aile: "#2f62b0", oreille: "#bfe6ff" },
  { id: "vert", nom: "Vert", clair: "#b8f0a4", fonce: "#4fa04a", aile: "#3a8a3a", oreille: "#e6ffb0" },
  { id: "rose", nom: "Rose", clair: "#ffc4e4", fonce: "#e06aa8", aile: "#c94f90", oreille: "#fff0a8" },
  { id: "orange", nom: "Orange", clair: "#ffd0a0", fonce: "#ef8a3a", aile: "#d0702a", oreille: "#ffe9b0" },
  { id: "rouge", nom: "Rouge", clair: "#ffaaa0", fonce: "#d24a3a", aile: "#b03a2e", oreille: "#ffd6a0" },
  { id: "gris", nom: "Gris", clair: "#dcdce8", fonce: "#8a8aa8", aile: "#6f6f90", oreille: "#f0c8e8" },
  { id: "brun", nom: "Brun", clair: "#e8c49a", fonce: "#9a6a3a", aile: "#7e542c", oreille: "#ffe0b0" },
  { id: "dore", nom: "Doré", clair: "#fff0a8", fonce: "#d9a54a", aile: "#b8862e", oreille: "#ffc4e4" },
  { id: "turquoise", nom: "Turquoise", clair: "#a8fff0", fonce: "#2fb8a8", aile: "#22968a", oreille: "#d0fff4" },
];
export const couleurCorps = (id: string) => COULEURS_CORPS.find((c) => c.id === id) ?? COULEURS_CORPS[0];

export const EPAISSEURS: { id: 1 | 2 | 3 | 4; nom: string; rx: number }[] = [
  { id: 1, nom: "Fine", rx: 60 },
  { id: 2, nom: "Normale", rx: 70 },
  { id: 3, nom: "Dodue", rx: 80 },
  { id: 4, nom: "Toute ronde", rx: 90 },
];

import { bonneReponse } from "@/lib/recompenses";

const VUES = "leonie-vues";
const POINTS = "leonie-points";
const PARTIES = "leonie-parties";

function lireListe(cle: string) {
  if (typeof window === "undefined") return [];
  try {
    const valeur = JSON.parse(localStorage.getItem(cle) || "[]");
    return Array.isArray(valeur) ? valeur.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function lireVues() {
  return lireListe(VUES);
}

export function voirAnimal(id: string) {
  const vues = new Set(lireVues());
  vues.add(id);
  localStorage.setItem(VUES, JSON.stringify([...vues]));
}

export function lireScore() {
  if (typeof window === "undefined") return { points: 0, parties: 0 };
  return {
    points: Number(localStorage.getItem(POINTS) || 0),
    parties: Number(localStorage.getItem(PARTIES) || 0),
  };
}

export function noterReponse(bonne: boolean) {
  if (bonne) bonneReponse();
  const score = lireScore();
  localStorage.setItem(POINTS, String(score.points + (bonne ? 1 : 0)));
  localStorage.setItem(PARTIES, String(score.parties + 1));
}

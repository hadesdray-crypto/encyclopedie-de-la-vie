// Les personnages qu'on peut choisir : les quatre caractères de Plume (plus « Plume se repose »),
// et les personnages bonus créés par la famille. Un seul endroit pour les noms, les images et le choix.
import { choisirCompagnon, lireCompagnons, garderCompagnons, nouveauCompagnon, type Compagnon } from "@/lib/compagnons";
import { choisirPresence, type Presence } from "@/lib/plume";

export type CaracterePlume = Exclude<Presence, "repos">;

export const CARACTERES: { id: CaracterePlume; court: string; titre: string; num: 1 | 2 | 3 | 4 }[] = [
  { id: "discrete", court: "Discrète", titre: "Plume la discrète", num: 1 },
  { id: "presente", court: "Présente", titre: "Plume la présente", num: 2 },
  { id: "etudiante", court: "Étudiante", titre: "Plume l'étudiante", num: 3 },
  { id: "passionnee", court: "Passionnée", titre: "Plume la passionnée", num: 4 },
];
export const NUM = { discrete: 1, presente: 2, etudiante: 3, passionnee: 4 } as const;

export const estPresence = (id: string): id is Presence => id === "repos" || id in NUM;

/** Choisir un des personnages de Plume (ou le repos). */
export function choisirPlume(id: Presence) {
  choisirCompagnon(null);
  choisirPresence(id);
}
/** Choisir un personnage bonus. */
export function choisirBonus(c: Compagnon) {
  choisirCompagnon(c.id);
  choisirPresence(c.caractere);
}

/** Créer un personnage bonus avec son nom : il est gardé tout de suite (plus de bouton « Enregistrer »). */
export function creerBonus(nom: string): Compagnon {
  const c = { ...nouveauCompagnon(), nom: nom.trim() || "Mon compagnon" };
  garderCompagnons([...lireCompagnons(), c]);
  return c;
}
/** Changer un personnage bonus : c'est gardé tout de suite. */
export function majBonus(id: string, f: (c: Compagnon) => Compagnon) {
  garderCompagnons(lireCompagnons().map((c) => (c.id === id ? f(c) : c)));
}

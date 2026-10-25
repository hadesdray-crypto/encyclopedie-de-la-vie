// Les personnages bonus : jusqu'à 4 compagnons créés par la famille, à la suite des 4 caractères de Plume.
// Chacun a un nom, un âge, la personne qui l'a créé, un look (couleur, épaisseur, chapeau, tenue, accessoire),
// un caractère (le même choix que pour Plume : discret, présent, étudiant, passionné),
// et, s'il le faut, ses propres phrases et ses propres enregistrements à la place de ce que dirait Plume.
import { useEffect, useState } from "react";
import { normaliser, type Look } from "@/components/garde-robe";
import type { Presence } from "@/lib/plume";
import { PAGES_EXPLIQUEES } from "@/data/guide";

export const MAX_BONUS = 4;

/** Les moments où le compagnon parle, rangés par catégorie. Pour chacun : sa phrase et son enregistrement, au choix. */
export const CATEGORIES: { id: string; nom: string; explique: string; moments: { id: Expression; nom: string; quand: string }[] }[] = [
  { id: "toucher", nom: "Quand on le touche", explique: "Ce qu'il dit quand on lui fait signe.", moments: [
    { id: "coucou", nom: "Un toucher", quand: "On le touche une fois : il fait coucou." },
    { id: "menu", nom: "Son menu s'ouvre", quand: "On le touche deux fois : il ouvre son menu pour aider." },
  ] },
  { id: "reponses", nom: "Les réponses et les cadeaux", explique: "Ce qu'il dit pendant les défis et les questions.", moments: [
    { id: "bonne", nom: "Bonne réponse", quand: "Leonie (ou un joueur) a trouvé la bonne réponse." },
    { id: "mauvaise", nom: "Mauvaise réponse", quand: "Ce n'était pas la bonne réponse : il encourage." },
    { id: "paquet", nom: "Un paquet de cartes gagné", quand: "Un nouveau paquet de cartes est gagné." },
  ] },
  { id: "jeux", nom: "Quand il joue avec vous", explique: "Ce qu'il dit quand il est un joueur de la partie.", moments: [
    { id: "debut", nom: "Le début de la partie", quand: "Avant de jouer, il remercie la princesse Leonie et le Concepteur." },
    { id: "tour", nom: "C'est son tour", quand: "C'est à lui de jouer." },
    { id: "trouve", nom: "Il réussit", quand: "Il trouve une paire, gagne un duel ou la bonne réponse." },
    { id: "rate", nom: "Il se trompe", quand: "Il rate son coup." },
  ] },
  { id: "mouvements", nom: "Les mouvements", explique: "Ce qu'il dit quand on le bouge ou quand il a peur.", moments: [
    { id: "fache", nom: "On l'a lancé", quand: "On l'a lancé avec le doigt : il fait semblant d'être fâché." },
    { id: "secoue", nom: "On secoue le téléphone", quand: "Le téléphone bouge dans tous les sens." },
    { id: "peur", nom: "Il a peur", quand: "Devant un prédateur des oiseaux (martre, fouine, renard)." },
  ] },
];
export type Expression = "coucou" | "menu" | "bonne" | "mauvaise" | "paquet" | "debut" | "tour" | "trouve" | "rate" | "fache" | "secoue" | "peur" | `page:${string}`;

/** Les explications de chaque page : le personnage bonus peut avoir les siennes (texte et voix). */
export const CATEGORIE_PAGES = {
  id: "pages",
  nom: "Les explications des pages",
  explique: "Quand on lui demande de l'aide sur une page (bouton « Aide » ou « Écouter »), il explique cette page. Tu peux remplacer son explication par la tienne.",
  moments: PAGES_EXPLIQUEES.map((p) => ({ id: `page:${p.id}` as Expression, nom: p.titre, quand: p.etapes[0] ?? "" })),
};

export type Compagnon = {
  id: string;
  nom: string;
  age: string;
  createur: string;
  look: Look;
  caractere: Exclude<Presence, "repos">;
  phrases: Partial<Record<Expression, string>>;
};

const CLE = "leonie-compagnons";
const CLE_ACTIF = "leonie-compagnon-actif";
let abonnes: (() => void)[] = [];
const prevenir = () => abonnes.forEach((f) => f());

export function lireCompagnons(): Compagnon[] {
  try {
    const l = JSON.parse(localStorage.getItem(CLE) || "[]");
    return Array.isArray(l) ? l.slice(0, MAX_BONUS).map((c: Compagnon) => ({ ...c, look: normaliser(c.look) })) : [];
  } catch {
    return [];
  }
}
export function garderCompagnons(l: Compagnon[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify(l.slice(0, MAX_BONUS)));
  } catch {
    /* rien */
  }
  prevenir();
}
export function compagnonActif(): Compagnon | null {
  try {
    const id = localStorage.getItem(CLE_ACTIF);
    return id ? lireCompagnons().find((c) => c.id === id) ?? null : null;
  } catch {
    return null;
  }
}
export function choisirCompagnon(id: string | null) {
  try {
    if (id) localStorage.setItem(CLE_ACTIF, id);
    else localStorage.removeItem(CLE_ACTIF);
  } catch {
    /* rien */
  }
  prevenir();
}
export function useCompagnon() {
  const [c, setC] = useState(compagnonActif);
  useEffect(() => {
    const f = () => setC(compagnonActif());
    abonnes.push(f);
    return () => {
      abonnes = abonnes.filter((x) => x !== f);
    };
  }, []);
  return c;
}
export function useCompagnons() {
  const [l, setL] = useState(lireCompagnons);
  useEffect(() => {
    const f = () => setL(lireCompagnons());
    abonnes.push(f);
    return () => {
      abonnes = abonnes.filter((x) => x !== f);
    };
  }, []);
  return l;
}
/** Le nom de celui qui parle : Plume, ou le compagnon bonus choisi. */
export const nomCompagnon = () => compagnonActif()?.nom || "Plume";

// ---- Les enregistrements (gardés sur l'appareil, dans IndexedDB) ----
function base(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const r = indexedDB.open("leonie-voix", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("voix");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}
export async function garderVoix(cle: string, son: Blob | null) {
  const db = await base();
  await new Promise<void>((ok, ko) => {
    const t = db.transaction("voix", "readwrite");
    if (son) t.objectStore("voix").put(son, cle);
    else t.objectStore("voix").delete(cle);
    t.oncomplete = () => ok();
    t.onerror = () => ko(t.error);
  });
  prevenir();
}
export async function lireVoix(cle: string): Promise<Blob | null> {
  try {
    const db = await base();
    return await new Promise((ok) => {
      const r = db.transaction("voix").objectStore("voix").get(cle);
      r.onsuccess = () => ok((r.result as Blob) ?? null);
      r.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}
export const cleVoix = (compagnon: string, e: Expression) => `${compagnon}:${e}`;

let enCours: HTMLAudioElement | null = null;
/** Le compagnon choisi dit son expression : son enregistrement s'il en a un. Renvoie sa phrase (ou null). */
export function compagnonExprime(e: Expression): string | null {
  const c = compagnonActif();
  if (!c) return null;
  lireVoix(cleVoix(c.id, e)).then((son) => {
    if (!son) return;
    enCours?.pause();
    const url = URL.createObjectURL(son);
    enCours = new Audio(url);
    enCours.onended = () => URL.revokeObjectURL(url);
    enCours.play().catch(() => {});
  });
  return c.phrases[e]?.trim() || null;
}

export function nouveauCompagnon(): Compagnon {
  return {
    id: `b${Date.now().toString(36)}`,
    nom: "",
    age: "",
    createur: "",
    look: { couleur: "bleu", epaisseur: 2, haut: "foot", bas: "shortfoot", chapeau: "casquette", lunettes: "aucune", chaussures: "baskets", objet: "ballon", couleurs: {} },
    caractere: "presente",
    phrases: {},
  };
}

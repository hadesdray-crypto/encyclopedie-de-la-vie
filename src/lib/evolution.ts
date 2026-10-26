import { AUTRES, AUTRES_PAR_ID } from "@/data/autres";
import { ETAPES, cheminVers } from "@/data/arbre";
import { FAMILLES, ORDRES, PAR_ID, chercher, chercherFamilles, chercherOrdres, especesDe, famillesDe, ordreDe, plier } from "@/data/catalogue";

/** Les trois grandes branches des mammifères : la place de chaque ordre vient de la classification publiée. */
const MARSUPIAUX = new Set(["Paucituberculata", "Didelphimorphia", "Microbiotheria", "Notoryctemorphia", "Dasyuromorphia", "Peramelemorphia", "Diprotodontia"]);

export function brancheDeOrdre(ordre: string) {
  if (ordre === "Monotremata") return "monotremes";
  if (MARSUPIAUX.has(ordre)) return "marsupiaux";
  return "placentaires";
}

export type Sorte = "etape" | "ordre" | "famille" | "espece";

export type Noeud = {
  cle: string;
  sorte: Sorte;
  id: string;
  nom: string;
  sous?: string;
  /** Millions d'années avant aujourd'hui (seulement pour les étapes datées). */
  ma?: number;
  quand?: string;
  image?: string;
  icone?: string;
  /** La page à ouvrir quand on touche le nom. */
  vers: string;
};

const cleDe = (sorte: Sorte, id: string) => `${sorte[0]}:${id}`;

export function noeudEtape(id: string): Noeud {
  const e = ETAPES[id];
  return { cle: cleDe("etape", id), sorte: "etape", id, nom: e.nom, ma: e.ma, quand: e.quand, image: e.image, icone: e.icone, vers: `/arbre/${id}`, sous: e.especes };
}
export function noeudOrdre(id: string): Noeud {
  const o = ordreDe(id);
  return { cle: cleDe("ordre", id), sorte: "ordre", id, nom: o?.nom ?? id, sous: o?.phrase, vers: `/mammiferes/o-${id}` };
}
export function noeudFamille(code: string): Noeud {
  const f = FAMILLES[code];
  return { cle: cleDe("famille", code), sorte: "famille", id: code, nom: f?.nom ?? code, sous: `${especesDe(code).length} espèce${especesDe(code).length > 1 ? "s" : ""}`, vers: `/mammiferes/f-${code}` };
}
export function noeudEspece(id: string): Noeud {
  const e = PAR_ID.get(id)!;
  return { cle: cleDe("espece", id), sorte: "espece", id, nom: e.nom, sous: e.latin, vers: `/mammiferes/e-${id}` };
}

/** Le chemin de l'évolution jusqu'à une espèce, de la Terre à l'animal. */
export function cheminEvolution(especeId: string): Noeud[] {
  const e = PAR_ID.get(especeId);
  if (!e) return [];
  const autre = AUTRES_PAR_ID.get(especeId);
  if (autre) return [...cheminVers(autre.etape).map(noeudEtape), noeudEspece(especeId)];
  return [
    ...cheminVers("mammiferes").map(noeudEtape),
    noeudEtape(brancheDeOrdre(e.ordre)),
    noeudOrdre(e.ordre),
    noeudFamille(e.famille),
    noeudEspece(especeId),
  ];
}

/** Le chemin vers n'importe quel nœud de l'arbre (une clé comme « o:Felidae »). */
export function cheminDe(cle: string): Noeud[] {
  const [s, ...reste] = cle.split(":");
  const id = reste.join(":");
  if (s === "s") return cheminEvolution(id);
  if (s === "f") {
    const f = FAMILLES[id];
    return f ? [...cheminVers("mammiferes").map(noeudEtape), noeudEtape(brancheDeOrdre(f.ordre)), noeudOrdre(f.ordre), noeudFamille(id)] : [];
  }
  if (s === "o") return [...cheminVers("mammiferes").map(noeudEtape), noeudEtape(brancheDeOrdre(id)), noeudOrdre(id)];
  return ETAPES[id] ? cheminVers(id).map(noeudEtape) : [];
}

/** Les enfants d'un nœud dans le grand arbre. */
export function enfants(n: Noeud): Noeud[] {
  if (n.sorte === "etape") {
    const e = ETAPES[n.id];
    const liste = e.suite.map(noeudEtape);
    if (n.id === "monotremes" || n.id === "marsupiaux" || n.id === "placentaires") {
      for (const o of ORDRES) if (o.id !== "Tardigrada" && brancheDeOrdre(o.id) === n.id) liste.push(noeudOrdre(o.id));
    }
    for (const a of AUTRES) if (a.etape === n.id) liste.push(noeudEspece(a.id));
    return liste;
  }
  if (n.sorte === "ordre") return famillesDe(n.id).map(([code]) => noeudFamille(code));
  if (n.sorte === "famille") return especesDe(n.id).map((e) => noeudEspece(e.id));
  return [];
}

/** Si la Terre avait 24 heures : à quelle heure arrive un événement vieux de « ma » millions d'années. */
export function heureTerre(ma: number) {
  const minutes = Math.round(((4540 - ma) / 4540) * 24 * 60);
  const h = Math.floor(minutes / 60);
  return `${h} h ${String(minutes % 60).padStart(2, "0")}`;
}

export function dateEnClair(ma: number) {
  if (ma >= 1000) return `il y a ${(ma / 1000).toFixed(ma % 1000 === 0 ? 0 : 1).replace(".", ",")} milliard${ma >= 2000 ? "s" : ""} d'années`;
  return `il y a ${ma} millions d'années`;
}

/** La recherche du grand arbre : étapes, ordres, familles, espèces. */
export function chercherArbre(texte: string): Noeud[] {
  const cle = plier(texte);
  if (cle.length < 2) return [];
  const etapes = Object.values(ETAPES).filter((e) => plier(`${e.nom} ${e.id}`).includes(cle)).map((e) => noeudEtape(e.id));
  const ordres = chercherOrdres(texte).filter((o) => o.id !== "Tardigrada").map((o) => noeudOrdre(o.id));
  const familles = chercherFamilles(texte).filter(([code]) => code !== "Tardigrada").slice(0, 8).map(([code]) => noeudFamille(code));
  const especes = chercher(texte).map((e) => noeudEspece(e.id));
  return [...etapes, ...ordres, ...familles, ...especes].slice(0, 40);
}

/** Les cousins d'un animal : même famille d'abord, puis les autres familles de son ordre. */
export function cousins(especeId: string) {
  const e = PAR_ID.get(especeId);
  if (!e || AUTRES_PAR_ID.has(especeId)) return { memeFamille: [], autresFamilles: [] as { code: string; nom: string }[] };
  return {
    memeFamille: especesDe(e.famille).filter((x) => x.id !== e.id && !x.disparue).slice(0, 10),
    autresFamilles: famillesDe(e.ordre).filter(([code]) => code !== e.famille).slice(0, 8).map(([code, f]) => ({ code, nom: f.nom })),
  };
}

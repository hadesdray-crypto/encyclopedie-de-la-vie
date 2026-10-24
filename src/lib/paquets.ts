import { ESPECES, type Espece } from "@/data/catalogue";

export const RARETES = ["Pas très répandu", "Assez peu répandu", "Peu répandu", "Très peu répandu"] as const;
export type Rarete = (typeof RARETES)[number];

export type Tirage = {
  espece: Espece;
  rarete: Rarete | "Répandu" | null;
  special: "Le plus fort" | "Le plus petit" | null;
  chance: boolean;
};

export type Album = {
  id: string;
  titre: string;
  explique: string;
  especes: Espece[];
};

function grammes(masse: string | undefined) {
  if (!masse) return null;
  const trouve = masse.match(/([\d]+(?:,\d+)?)\s*(kg|g)/);
  if (!trouve) return null;
  const valeur = Number(trouve[1].replace(",", "."));
  return trouve[2] === "kg" ? valeur * 1000 : valeur;
}

function extremes() {
  const mesures = ESPECES.flatMap((espece) => {
    if (espece.disparue) return [];
    const masse = grammes(espece.masse);
    return masse ? [{ id: espece.id, masse }] : [];
  }).sort((a, b) => a.masse - b.masse);
  return {
    petits: new Set(mesures.slice(0, 12).map((item) => item.id)),
    forts: new Set(mesures.slice(-12).map((item) => item.id)),
  };
}

const { petits: PLUS_PETITS, forts: PLUS_FORTS } = extremes();

export function rareteDe(ou: string): Rarete | "Répandu" | null {
  const trouve = ou.match(/(\d+)\s+pays/);
  if (!trouve) return null;
  const pays = Number(trouve[1]);
  if (pays <= 5) return "Très peu répandu";
  if (pays <= 8) return "Peu répandu";
  if (pays <= 15) return "Assez peu répandu";
  if (pays <= 40) return "Pas très répandu";
  return "Répandu";
}

function trier(liste: Espece[]) {
  return [...liste].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

function construireAlbums(): Album[] {
  const vivants = ESPECES.filter((espece) => !espece.disparue);
  const parNom = new Map(vivants.map((espece) => [espece.id, espece]));
  const groupes: Record<string, Espece[]> = {
    "Très peu répandu": [],
    "Peu répandu": [],
    "Assez peu répandu": [],
    "Pas très répandu": [],
    "Répandu": [],
    "Répartition mal connue": [],
  };
  for (const espece of vivants) {
    const rarete = rareteDe(espece.ou);
    groupes[rarete ?? "Répartition mal connue"].push(espece);
  }
  const regle = "Le nombre de pays est celui qui est publié. Chaque nom ouvre la fiche.";
  return [
    { id: "tres", titre: "Très peu répandu", explique: `4 ou 5 pays. ${regle}`, especes: trier(groupes["Très peu répandu"]) },
    { id: "peu", titre: "Peu répandu", explique: `6 à 8 pays. ${regle}`, especes: trier(groupes["Peu répandu"]) },
    { id: "assez", titre: "Assez peu répandu", explique: `9 à 15 pays. ${regle}`, especes: trier(groupes["Assez peu répandu"]) },
    { id: "pas", titre: "Pas très répandu", explique: `16 à 40 pays. ${regle}`, especes: trier(groupes["Pas très répandu"]) },
    { id: "repandu", titre: "Répandu", explique: `Plus de 40 pays. ${regle}`, especes: trier(groupes["Répandu"]) },
    { id: "inconnu", titre: "Répartition mal connue", explique: "Le nombre de pays n'est pas publié. La fiche existe quand même.", especes: trier(groupes["Répartition mal connue"]) },
    { id: "fort", titre: "Le plus fort", explique: "Les 12 adultes les plus lourds, parmi les masses publiées.", especes: trier([...PLUS_FORTS].map((id) => parNom.get(id)).filter((espece): espece is Espece => Boolean(espece))) },
    { id: "petit", titre: "Le plus petit", explique: "Les 12 adultes les plus légers, parmi les masses publiées.", especes: trier([...PLUS_PETITS].map((id) => parNom.get(id)).filter((espece): espece is Espece => Boolean(espece))) },
  ];
}

export const ALBUMS = construireAlbums();

function marquer(espece: Espece, chance: boolean): Tirage {
  const rarete = rareteDe(espece.ou);
  return {
    espece,
    rarete: rarete === "Répandu" ? "Répandu" : rarete,
    special: PLUS_FORTS.has(espece.id) ? "Le plus fort" : PLUS_PETITS.has(espece.id) ? "Le plus petit" : null,
    chance,
  };
}

export function ouvrirPaquet(famille: string, deja: Set<string>) {
  const vivants = ESPECES.filter((espece) => !espece.disparue && (famille === "toutes" || espece.famille === famille));
  const neufs = vivants.filter((espece) => !deja.has(espece.id));
  const pile = neufs.length >= 10 ? neufs : vivants;
  const melange = [...pile].sort(() => Math.random() - 0.5);
  const dix = melange.slice(0, 10).map((espece) => marquer(espece, false));
  const reste = melange.slice(10);
  const seuil = Math.random() * 0.22;
  const chance = reste.length > 0 && Math.random() < seuil;
  const cartes = chance ? [...dix, marquer(reste[0], true)] : dix;
  return { cartes, chance };
}

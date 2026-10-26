import brut from "@/data/mammiferes.json";
import { connu, parConnu } from "@/lib/connu";
import nomsFr from "@/data/noms-fr.json";
import nomsTraduits from "@/data/noms-traduits.json";
import { AUTRES } from "@/data/autres";

export type Espece = {
  id: string;
  nom: string;
  latin: string;
  ordre: string;
  famille: string;
  ou: string;
  /** fr : vrai nom français ; trad : nom anglais traduit mot à mot ; en : nom anglais (français en cours). */
  langue?: "fr" | "en" | "trad";
  /** Le nom anglais d'origine, quand le nom affiché est une traduction. */
  nomAnglais?: string;
  disparue?: 1;
  domestique?: 1;
  statut?: string;
  masse?: string;
  gestation?: string;
  portee?: string;
  longevite?: string;
  regime?: string;
  mange?: string;
  milieu?: string;
  /** Codes des pays (carte), d'après la Mammal Diversity Database. */
  pays?: string[];
};

type FamilleInfo = { nom: string; ordre: string; n: number };

const data = brut as {
  ordres: string[];
  familles: Record<string, FamilleInfo>;
  especes: Espece[];
};

// Les animaux qui ne sont pas des mammifères (le tardigrade, pour commencer) rejoignent le catalogue.
export const AUTRE_IDS = new Set(AUTRES.map((a) => a.id));
for (const a of AUTRES) {
  data.especes.push(a);
  data.familles[a.famille] = { nom: "Tardigrades", ordre: a.ordre, n: 1 };
}
/** Vrai pour un mammifère : les jeux de mammifères n'utilisent pas les autres animaux. */
export const estMammifere = (e: { id: string }) => !AUTRE_IDS.has(e.id);

export const FAMILLES = data.familles;
// Noms français trouvés sur Wikidata (scripts/donnees/collecter.py) : ils remplacent les noms anglais.
const NOMS_FR = nomsFr as Record<string, string>;
for (const espece of data.especes) {
  const fr = NOMS_FR[espece.id];
  if (fr && espece.langue !== "fr") {
    espece.nom = fr;
    espece.langue = "fr";
  }
}
// Pas encore de nom français : une traduction du nom anglais (scripts/donnees/traduire_noms.py), signalée sur la fiche.
const TRADUITS = nomsTraduits as Record<string, string>;
for (const espece of data.especes) {
  const t = TRADUITS[espece.id];
  if (t && espece.langue !== "fr") {
    espece.nomAnglais = espece.nom;
    espece.nom = t;
    espece.langue = "trad";
  }
}
export const ESPECES = data.especes;

export const ORDRES: { id: string; nom: string; phrase: string }[] = [
  { id: "Monotremata", nom: "Monotrèmes", phrase: "Ils pondent des œufs. Ornithorynque et échidnés." },
  { id: "Paucituberculata", nom: "Paucituberculés", phrase: "De petits marsupiaux d'Amérique du Sud." },
  { id: "Didelphimorphia", nom: "Didelphimorphes", phrase: "Les opossums." },
  { id: "Microbiotheria", nom: "Microbiothères", phrase: "Le monito del monte, un marsupial du Chili." },
  { id: "Notoryctemorphia", nom: "Notoryctémorphes", phrase: "Les taupes marsupiales." },
  { id: "Dasyuromorphia", nom: "Dasyuromorphes", phrase: "Dasyures, diable de Tasmanie, numbat." },
  { id: "Peramelemorphia", nom: "Péramélémorphes", phrase: "Les bandicoots." },
  { id: "Diprotodontia", nom: "Diprotodontes", phrase: "Kangourous, koalas, wombats." },
  { id: "Cingulata", nom: "Cingulés", phrase: "Les tatous." },
  { id: "Pilosa", nom: "Piloses", phrase: "Paresseux et fourmiliers." },
  { id: "Macroscelidea", nom: "Macroscélides", phrase: "Les musaraignes à trompe." },
  { id: "Afrosoricida", nom: "Afrosoricides", phrase: "Tenrecs et taupes dorées." },
  { id: "Tubulidentata", nom: "Tubulidentés", phrase: "Une seule espèce : l'oryctérope." },
  { id: "Proboscidea", nom: "Proboscidiens", phrase: "Les éléphants." },
  { id: "Hyracoidea", nom: "Hyracoïdes", phrase: "Les damans." },
  { id: "Sirenia", nom: "Siréniens", phrase: "Lamantins et dugong." },
  { id: "Dermoptera", nom: "Dermoptères", phrase: "Les colugos, qui planent entre les arbres." },
  { id: "Scandentia", nom: "Scandentiens", phrase: "Les toupayes." },
  { id: "Primates", nom: "Primates", phrase: "Lémurs, singes, et nous." },
  { id: "Lagomorpha", nom: "Lagomorphes", phrase: "Lapins, lièvres et pikas." },
  { id: "Rodentia", nom: "Rongeurs", phrase: "Souris, écureuils, castors. L'ordre le plus nombreux." },
  { id: "Eulipotyphla", nom: "Eulipotyphles", phrase: "Musaraignes, taupes et hérissons." },
  { id: "Chiroptera", nom: "Chiroptères", phrase: "Les chauves-souris. Les seuls mammifères qui volent vraiment." },
  { id: "Pholidota", nom: "Pholidotes", phrase: "Les pangolins." },
  { id: "Carnivora", nom: "Carnivores", phrase: "Félins, canidés, ours, phoques, et leurs cousins." },
  { id: "Perissodactyla", nom: "Périssodactyles", phrase: "Chevaux, rhinocéros et tapirs." },
  { id: "Artiodactyla", nom: "Artiodactyles", phrase: "Cerfs, bœufs, hippopotames, et aussi les baleines." },
  { id: "Tardigrada", nom: "Tardigrades", phrase: "Des animaux minuscules à huit pattes, presque indestructibles en vie ralentie." },
];

const ORDRE_PAR_ID = new Map(ORDRES.map((ordre) => [ordre.id, ordre]));

export function ordreDe(id: string) {
  return ORDRE_PAR_ID.get(id);
}

export const PAR_ID = new Map(ESPECES.map((espece) => [espece.id, espece]));

const parFamille = new Map<string, Espece[]>();
for (const espece of ESPECES) {
  const liste = parFamille.get(espece.famille);
  if (liste) liste.push(espece);
  else parFamille.set(espece.famille, [espece]);
}
// Dans chaque famille : du plus connu au moins connu.
for (const liste of parFamille.values()) {
  liste.sort(parConnu);
}
// Une famille est d'autant plus connue que ses animaux le sont.
const CONNU_FAMILLE = new Map([...parFamille].map(([f, l]) => [f, l.reduce((s, e) => s + connu(e.id), 0)]));

export function especesDe(famille: string) {
  return parFamille.get(famille) ?? [];
}

export function famillesDe(ordre: string) {
  return Object.entries(FAMILLES)
    .filter(([, famille]) => famille.ordre === ordre)
    .sort((a, b) => (CONNU_FAMILLE.get(b[0]) ?? 0) - (CONNU_FAMILLE.get(a[0]) ?? 0) || a[1].nom.localeCompare(b[1].nom, "fr"));
}

const INDEX = ESPECES.map((espece) => ({
  espece,
  cle: `${espece.nom} ${espece.latin}`.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, ""),
}));

export function chercher(texte: string) {
  const cle = texte.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
  if (cle.length < 2) return [];
  const trouves: Espece[] = [];
  for (const entree of INDEX) {
    if (entree.cle.includes(cle)) {
      trouves.push(entree.espece);
      if (trouves.length === 30) break;
    }
  }
  return trouves;
}

export function chercherFamilles(texte: string) {
  const cle = plier(texte);
  if (cle.length < 2) return [];
  return Object.entries(FAMILLES).filter(([code, famille]) => plier(`${famille.nom} ${code}`).includes(cle));
}

export function chercherOrdres(texte: string) {
  const cle = plier(texte);
  if (cle.length < 2) return [];
  return ORDRES.filter((ordre) => plier(`${ordre.nom} ${ordre.id} ${ordre.phrase}`).includes(cle));
}

export function plier(texte: string) {
  return texte.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
}

/** Les dix grands groupes faciles, puis les vrais ordres dedans. */
export const GROUPES: { id: string; nom: string; phrase: string; ordres: string[] }[] = [
  { id: "carnivores", nom: "Carnivores", phrase: "Félins, canidés, ours, phoques.", ordres: ["Carnivora"] },
  { id: "primates", nom: "Primates", phrase: "Lémuriens, singes, et nous.", ordres: ["Primates"] },
  { id: "rongeurs", nom: "Rongeurs et lapins", phrase: "Souris, écureuils, castors, lapins.", ordres: ["Rodentia", "Lagomorpha"] },
  { id: "chauves", nom: "Chauves-souris", phrase: "Les seuls mammifères qui volent vraiment.", ordres: ["Chiroptera"] },
  { id: "sabots", nom: "Sabots et baleines", phrase: "Chevaux, cerfs, vaches. Les baleines sont dans ce groupe.", ordres: ["Perissodactyla", "Artiodactyla"] },
  { id: "elephants", nom: "Éléphants et cousins", phrase: "Éléphants, damans, lamantins, tenrecs, oryctérope.", ordres: ["Proboscidea", "Hyracoidea", "Sirenia", "Tubulidentata", "Macroscelidea", "Afrosoricida"] },
  { id: "carapaces", nom: "Carapaces et griffes", phrase: "Tatous, paresseux, fourmiliers, pangolins.", ordres: ["Cingulata", "Pilosa", "Pholidota"] },
  { id: "marsupiaux", nom: "Marsupiaux", phrase: "Kangourous, koalas, opossums. Le petit grandit souvent dans une poche.", ordres: ["Diprotodontia", "Dasyuromorphia", "Didelphimorphia", "Peramelemorphia", "Paucituberculata", "Microbiotheria", "Notoryctemorphia"] },
  { id: "oeufs", nom: "Ils pondent des œufs", phrase: "Ornithorynque et échidnés.", ordres: ["Monotremata"] },
  { id: "petits", nom: "Musaraignes et voisins", phrase: "Musaraignes, taupes, hérissons, toupayes, colugos.", ordres: ["Eulipotyphla", "Scandentia", "Dermoptera"] },
  { id: "autres", nom: "Autres animaux", phrase: "Pas des mammifères : le tardigrade, minuscule et courageux.", ordres: ["Tardigrada"] },
];

export function groupeDeOrdre(ordre: string) {
  return GROUPES.find((g) => g.ordres.includes(ordre));
}

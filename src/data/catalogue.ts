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
  nom: plier(espece.nom),
  cle: plier(`${espece.nom} ${espece.latin}`),
}));

/** Cherche des espèces : le nom exact d'abord, puis le début du nom, puis un mot entier, puis le reste. On trie AVANT de couper à 30. */
export function chercher(texte: string) {
  return chercherRang(texte).map((t) => t.espece);
}

/** Le rang d'un nom pour ce qu'on a écrit : 0 exact, 1 début du nom, 2 mot entier, 3 contenu, 4 ailleurs. */
export function rangDuNom(nom: string, texte: string) {
  const n = plier(nom);
  const cle = plier(texte);
  if (n === cle) return 0;
  if (n.startsWith(cle)) return 1;
  if (n.split(/[^a-z0-9]+/).includes(cle)) return 2;
  return n.includes(cle) ? 3 : 4;
}

export function chercherRang(texte: string) {
  const cle = plier(texte);
  if (cle.length < 2) return [];
  const trouves: { espece: Espece; rang: number }[] = [];
  for (const entree of INDEX) {
    let rang = -1;
    if (entree.nom === cle || synonymeDe(entree.espece.latin, cle) === 2) rang = 0;
    else if (entree.nom.startsWith(cle)) rang = 1;
    else if (entree.nom.split(/[^a-z0-9]+/).includes(cle)) rang = 2;
    else if (entree.nom.includes(cle)) rang = 3;
    else if (entree.cle.includes(cle)) rang = 4;
    if (rang >= 0) trouves.push({ espece: entree.espece, rang });
  }
  trouves.sort((a, b) => a.rang - b.rang || parConnu(a.espece, b.espece));
  return trouves.slice(0, 30);
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
  return texte.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "").replace(/œ/g, "oe").replace(/æ/g, "ae");
}

/**
 * Les mots de tous les jours qu'on tape pour trouver un animal dont le nom officiel est différent :
 * « vache » → le bœuf domestique, « poule » → le coq bankiva (l'ancêtre de nos poules), « pingouin » → petit pingouin et manchots…
 * On reconnaît l'animal par son nom scientifique (ou son genre), pas par son nom, qui peut changer.
 */
const OWL = ["Strix", "Tyto", "Athene", "Glaucidium", "Aegolius", "Surnia"];
export const SYNONYMES: { mots: string[]; latins?: string[]; genres?: string[] }[] = [
  { mots: ["vache", "boeuf", "taureau", "veau", "bovin"], latins: ["Bos taurus"] },
  { mots: ["buffle", "bufflonne"], latins: ["Bubalus bubalis"] },
  { mots: ["poule", "poulet", "coq", "poussin", "poulette"], latins: ["Gallus gallus"] },
  { mots: ["cochon", "porc", "truie", "goret", "pourceau"], latins: ["Sus domesticus", "Sus scrofa"] },
  { mots: ["poney", "jument", "etalon", "poulain"], latins: ["Equus caballus"] },
  { mots: ["mouton", "brebis", "agneau", "belier"], latins: ["Ovis aries"] },
  { mots: ["chevre", "bouc", "chevreau"], latins: ["Capra hircus"] },
  { mots: ["lapin", "lapine", "lapereau"], latins: ["Oryctolagus cuniculus"] },
  { mots: ["ane", "anesse", "baudet"], latins: ["Equus asinus"] },
  { mots: ["cobaye", "cochon d'inde"], latins: ["Cavia porcellus"] },
  { mots: ["souris"], latins: ["Mus musculus"] },
  { mots: ["rat"], latins: ["Rattus norvegicus", "Rattus rattus"] },
  { mots: ["loup"], latins: ["Canis lupus"] },
  { mots: ["chat sauvage"], latins: ["Felis silvestris"] },
  { mots: ["dinde", "dindon"], latins: ["Meleagris gallopavo"] },
  { mots: ["oie"], latins: ["Anser anser"] },
  { mots: ["canard"], latins: ["Anas platyrhynchos"] },
  { mots: ["pigeon"], latins: ["Columba livia"] },
  { mots: ["chouette"], latins: ["Bubo scandiacus"], genres: OWL },
  { mots: ["hibou"], genres: ["Asio", "Otus", "Bubo"] },
  { mots: ["pingouin"], latins: ["Alca torda"], genres: ["Aptenodytes", "Pygoscelis", "Spheniscus", "Eudyptes", "Megadyptes"] },
  { mots: ["manchot"], genres: ["Aptenodytes", "Pygoscelis", "Spheniscus", "Eudyptes", "Megadyptes"] },
  { mots: ["perroquet"], genres: ["Psittacus", "Ara", "Psittacula"] },
  { mots: ["rapace"], genres: ["Aquila", "Buteo", "Falco", "Accipiter", "Milvus", "Circus", "Haliaeetus", "Gyps", "Pandion"] },
];

export function synonymeDe(latin: string, q: string): 0 | 1 | 2 {
  const genre = latin.split(" ")[0];
  const sing = q.length > 3 ? q.replace(/[sx]$/, "") : q;
  let res: 0 | 1 | 2 = 0;
  for (const s of SYNONYMES) {
    if (!((s.latins?.includes(latin)) || s.genres?.includes(genre))) continue;
    if (s.mots.some((m) => m === q || m === sing)) return 2;
    if (q.length >= 3 && s.mots.some((m) => m.startsWith(q))) res = 1;
  }
  return res;
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

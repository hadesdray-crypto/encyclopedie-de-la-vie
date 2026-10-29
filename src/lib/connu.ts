// À quel point un animal est connu, pour ranger les listes du plus connu au moins connu :
// Leonie reconnaît d'abord la girafe, le lion et l'éléphant, avant les petits rongeurs.
//
// Deux sources, additionnées :
// 1. Les visites de la page Wikipédia en français sur 12 mois (src/data/notoriete.json,
//    rempli par le robot GitHub « Célébrité des animaux » : scripts/donnees/notoriete.py).
// 2. Une estimation qui marche tout de suite, sans Internet : les « stars » que tout enfant connaît
//    (liste ci-dessous, par genre), puis les animaux les plus observés sur iNaturalist (galerie),
//    le vrai nom français, la photo, et la taille (un grand animal est plus souvent connu).
import data from "@/data/notoriete.json";
import brut from "@/data/mammiferes.json";
import photos from "@/data/photos.json";
import galerie from "@/data/galerie.json";

const N = data as Record<string, number>;

// Les stars, de la plus connue à la moins connue. Un genre (« Giraffa ») ou une espèce (« Canis lupus »).
const STARS = [
  "Panthera leo", "Loxodonta", "Elephas", "Giraffa", "Panthera tigris", "Equus quagga", "Equus grevyi", "Equus zebra",
  "Hippopotamus", "Acinonyx", "Panthera pardus", "Gorilla", "Ailuropoda", "Ursus maritimus", "Orcinus", "Megaptera",
  "Balaenoptera musculus", "Tursiops", "Delphinus", "Physeter", "Pan", "Pongo", "Ceratotherium", "Diceros", "Rhinoceros",
  "Canis lupus", "Ursus arctos", "Phascolarctos", "Macropus", "Osphranter", "Ornithorhynchus", "Crocuta", "Hyaena",
  "Lycaon", "Phacochoerus", "Syncerus", "Connochaetes", "Monodon", "Delphinapterus", "Odobenus", "Trichechus", "Dugong",
  "Panthera onca", "Puma concolor", "Lynx", "Vulpes vulpes", "Vulpes zerda", "Vulpes lagopus", "Ailurus", "Bradypus",
  "Choloepus", "Myrmecophaga", "Hydrochoerus", "Suricata", "Lemur", "Okapia", "Camelus", "Lama", "Vicugna", "Bison",
  "Rangifer", "Alces", "Cervus", "Capreolus", "Sus scrofa", "Castor", "Erinaceus", "Sciurus", "Lepus", "Oryctolagus",
  "Enhydra", "Lutra", "Pteronura", "Zalophus", "Phoca", "Mirounga", "Halichoerus", "Arctocephalus", "Procyon", "Meles",
  "Gulo", "Sarcophilus", "Vombatus", "Tachyglossus", "Orycteropus", "Smutsia", "Manis", "Phataginus", "Mandrillus",
  "Papio", "Nasalis", "Hylobates", "Tarsius", "Daubentonia", "Propithecus", "Pteropus", "Desmodus", "Tapirus", "Hystrix",
  "Marmota", "Cynomys", "Chinchilla", "Talpa", "Mustela", "Martes", "Felis silvestris", "Leopardus pardalis", "Caracal",
  "Leptailurus", "Panthera uncia", "Ursus americanus", "Helarctos", "Melursus", "Tremarctos", "Kobus", "Aepyceros",
  "Tragelaphus", "Oryx", "Gazella", "Eudorcas", "Ovibos", "Capra", "Rupicapra", "Bos", "Equus ferus", "Antilocapra",
] as const;

type Brut = { id: string; latin: string; masse?: string };
const ESP = (brut as { especes: Brut[] }).especes;
const PHOTOS = new Set(photos as string[]);
const POPULAIRES = new Set(Object.keys(galerie as Record<string, unknown>));
const NOMS_FR = new Set<string>();
for (const e of (brut as { especes: (Brut & { langue?: string })[] }).especes) if (e.langue === "fr") NOMS_FR.add(e.id);

/** La masse en kilos, lue dans « environ 800 kg », « 25 g » ou « 1,2 t ». */
function kilos(masse?: string): number {
  const m = masse?.match(/([\d\s ]+(?:,\d+)?)\s*(t|kg|g)\b/);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/[\s ]/g, "").replace(",", "."));
  return m[2] === "t" ? v * 1000 : m[2] === "g" ? v / 1000 : v;
}

function estimation(e: Brut): number {
  const genre = e.latin.split(" ")[0];
  const rang = STARS.findIndex((s) => s === e.latin || s === genre);
  let s = 0;
  if (rang >= 0) s += 2_000_000 - rang * 10_000;
  if (POPULAIRES.has(e.id)) s += 30_000;
  if (NOMS_FR.has(e.id)) s += 8_000;
  if (PHOTOS.has(e.id)) s += 5_000;
  s += Math.round(Math.log10(1 + kilos(e.masse)) * 4_000);
  return s;
}

const SCORE = new Map<string, number>();
const PAR_LATIN = new Map<string, number>();
for (const e of ESP) {
  const v = (N[e.id] ?? 0) + estimation(e);
  SCORE.set(e.id, v);
  PAR_LATIN.set(e.latin, v);
}

export const connu = (id: string) => SCORE.get(id) ?? N[id] ?? 0;
export const connuLatin = (latin: string) => N["latin:" + latin] ?? PAR_LATIN.get(latin) ?? 0;
/** Vrai pour les stars que tout enfant connaît (girafe, lion, dauphin…). */
export const estStar = (latin: string) => STARS.some((s) => s === latin || s === latin.split(" ")[0]);
/** Pour trier : le plus connu d'abord, puis par nom. */
export const parConnu = (a: { id: string; nom: string }, b: { id: string; nom: string }) => connu(b.id) - connu(a.id) || a.nom.localeCompare(b.nom, "fr");

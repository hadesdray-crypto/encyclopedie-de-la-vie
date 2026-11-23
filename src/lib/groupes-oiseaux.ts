// Les oiseaux rangés en groupes simples, comme les mammifères : on choisit un groupe, puis un oiseau.
// Le groupe vient du genre (premier mot du nom latin), d'après la classification des oiseaux (ordres et familles).

export type GroupeOiseau = { id: string; nom: string; sous: string };

export const GROUPES_OISEAUX: GroupeOiseau[] = [
  { id: "nuit", nom: "Chouettes et hiboux", sous: "Les rapaces de la nuit." },
  { id: "rapaces", nom: "Aigles, faucons et vautours", sous: "Les rapaces du jour." },
  { id: "eau", nom: "Canards, oies et cygnes", sous: "Et les autres oiseaux des lacs : grèbes, foulques, râles." },
  { id: "echassiers", nom: "Hérons, cigognes et grues", sous: "Les grands oiseaux aux longues pattes." },
  { id: "mer", nom: "Oiseaux de mer", sous: "Goélands, mouettes, sternes, macareux, cormorans…" },
  { id: "plage", nom: "Oiseaux des plages et des vasières", sous: "Bécasseaux, courlis, pluviers, chevaliers…" },
  { id: "marcheurs", nom: "Manchots et oiseaux qui ne volent pas", sous: "Manchots, autruche, émeu, casoar, kiwi…" },
  { id: "sol", nom: "Poules, faisans et oiseaux du sol", sous: "Paon, faisan, perdrix, tétras, outarde…" },
  { id: "tropiques", nom: "Perroquets et oiseaux exotiques", sous: "Aras, toucan, colibris, oiseau de paradis…" },
  { id: "pics", nom: "Pigeons, pics, martinets et cie", sous: "Pigeons, coucou, pics, martin-pêcheur, huppe…" },
  { id: "chanteurs", nom: "Petits oiseaux chanteurs", sous: "Mésanges, merles, rouges-gorges, hirondelles, corbeaux…" },
];

const GENRES: Record<string, string> = {};
const ranger = (groupe: string, genres: string) => genres.split(" ").forEach((g) => (GENRES[g] = groupe));

ranger("nuit", "Strix Tyto Bubo Athene Asio Otus");
ranger("rapaces", "Aquila Haliaeetus Pandion Falco Buteo Gyps Gypaetus Milvus Circus Accipiter Harpia Sagittarius Vultur Cathartes Circaetus Pernis Hieraaetus Elanus");
ranger("eau", "Cygnus Anser Branta Anas Aythya Tadorna Somateria Spatula Mareca Netta Mergus Bucephala Alopochen Fulica Gallinula Rallus Podiceps Tachybaptus");
ranger("echassiers", "Ciconia Ardea Egretta Bubulcus Nycticorax Ixobrychus Botaurus Ardeola Phoenicopterus Grus Platalea Plegadis");
ranger("mer", "Larus Chroicocephalus Ichthyaetus Hydrocoloeus Rissa Sterna Sternula Thalasseus Gelochelidon Hydroprogne Chlidonias Fratercula Alca Uria Morus Phalacrocorax Pelecanus Diomedea Fulmarus");
ranger("plage", "Calidris Numenius Haematopus Vanellus Scolopax Gallinago Actitis Tringa Himantopus Recurvirostra Burhinus Charadrius Pluvialis Limosa Arenaria Chionis");
ranger("marcheurs", "Aptenodytes Pygoscelis Spheniscus Struthio Dromaius Casuarius Rhea Apteryx");
ranger("sol", "Pavo Gallus Phasianus Perdix Tetrao Meleagris Alectoris Coturnix Lyrurus Lagopus Tetrax");
ranger("tropiques", "Ara Psittacus Melopsittacus Cacatua Psittacula Ramphastos Trochilus Archilochus Menura Dacelo Paradisaea");
ranger("pics", "Columba Streptopelia Cuculus Upupa Alcedo Merops Coracias Picus Dendrocopos Dryocopus Dryobates Dendrocoptes Jynx Apus Tachymarptis Caprimulgus");

/** Le groupe d'un oiseau. Tous les genres qui ne sont pas listés plus haut sont des passereaux : les petits chanteurs. */
export function groupeOiseau(latin: string): string {
  return GENRES[latin.split(" ")[0]] ?? "chanteurs";
}

#!/usr/bin/env python3
"""Traduit en français, mot à mot, les noms anglais des mammifères qui n'ont pas encore
de nom français (Wikidata). Ce n'est pas un nom officiel : l'application l'indique
(« nom traduit de l'anglais »). Si un mot n'est pas connu, on ne devine pas : le nom
reste en anglais, avec la mention « nom français en cours ».
Sortie : src/data/noms-traduits.json  {id: nom traduit}
"""
import json
import re
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "src/data"

# Noms principaux : (français, genre f/m, pluriel inutile ici)
TETES = {
    "sportive lemur": ("Lépilémur", "m"), "vesper mouse": ("Souris vesper", "f"), "vlei rat": ("Rat des marais", "m"),
    "tent-making bat": ("Chauve-souris à tente", "f"), "epauletted fruit bat": ("Roussette à épaulettes", "f"), "sun squirrel": ("Écureuil du soleil", "m"),
    "red panda": ("Panda roux", "m"), "palm civet": ("Civette des palmiers", "f"), "ghost bat": ("Chauve-souris fantôme", "f"),
    "blossom bat": ("Chauve-souris des fleurs", "f"), "shrew rat": ("Rat-musaraigne", "m"), "shrew mouse": ("Souris-musaraigne", "f"),
    "tree mouse": ("Souris arboricole", "f"), "hog badger": ("Blaireau à groin", "m"), "single-leaf bat": ("Chauve-souris à une feuille", "f"),
    "bat": ("Chauve-souris", "f"), "rat": ("Rat", "m"), "mouse": ("Souris", "f"), "shrew": ("Musaraigne", "f"),
    "squirrel": ("Écureuil", "m"), "vole": ("Campagnol", "m"), "myotis": ("Murin", "m"), "opossum": ("Opossum", "m"),
    "deermouse": ("Souris sylvestre", "f"), "mole": ("Taupe", "f"), "tuco-tuco": ("Tuco-tuco", "m"), "fox": ("Renard", "m"),
    "lemur": ("Lémur", "m"), "serotine": ("Sérotine", "f"), "mole-rat": ("Rat-taupe", "m"), "gerbil": ("Gerbille", "f"),
    "pipistrelle": ("Pipistrelle", "f"), "gopher": ("Gaufre", "m"), "monkey": ("Singe", "m"), "langur": ("Langur", "m"),
    "spiny-rat": ("Rat épineux", "m"), "titi": ("Titi", "m"), "jerboa": ("Gerboise", "f"), "possum": ("Phalanger", "m"),
    "wallaby": ("Wallaby", "m"), "tenrec": ("Tenrec", "m"), "tree-rat": ("Rat arboricole", "m"), "pika": ("Pika", "m"),
    "dormouse": ("Loir", "m"), "porcupine": ("Porc-épic", "m"), "bandicoot": ("Bandicoot", "m"), "armadillo": ("Tatou", "m"),
    "woodrat": ("Rat des bois", "m"), "cuscus": ("Couscous", "m"), "tamarin": ("Tamarin", "m"), "chipmunk": ("Tamia", "m"),
    "hutia": ("Hutia", "m"), "mongoose": ("Mangouste", "f"), "sengi": ("Musaraigne-éléphant", "f"), "treeshrew": ("Toupaye", "m"),
    "duiker": ("Céphalophe", "m"), "colobus": ("Colobe", "m"), "marmoset": ("Ouistiti", "m"), "lemming": ("Lemming", "m"),
    "hocicudo": ("Hocicudo", "m"), "dunnart": ("Dunnart", "m"), "galago": ("Galago", "m"), "civet": ("Civette", "f"),
    "antechinus": ("Antechinus", "m"), "gymnure": ("Gymnure", "m"), "dasyure": ("Dasyure", "m"), "saki": ("Saki", "m"),
    "jird": ("Mérione", "f"), "weasel": ("Belette", "f"), "genet": ("Genette", "f"), "gazelle": ("Gazelle", "f"),
    "brocket": ("Daguet", "m"), "kangaroo": ("Kangourou", "m"), "rabbit": ("Lapin", "m"), "hare": ("Lièvre", "m"),
    "tapeti": ("Tapeti", "m"), "cavy": ("Cobaye", "m"), "zokor": ("Zokor", "m"), "dolphin": ("Dauphin", "m"),
    "glider": ("Phalanger volant", "m"), "marmot": ("Marmotte", "f"), "hedgehog": ("Hérisson", "m"), "tarsier": ("Tarsier", "m"),
    "pig": ("Cochon", "m"), "hamster": ("Hamster", "m"), "skunk": ("Mouffette", "f"), "gibbon": ("Gibbon", "m"),
    "howler": ("Singe hurleur", "m"), "capuchin": ("Capucin", "m"), "agouti": ("Agouti", "m"), "muntjac": ("Muntjac", "m"),
    "chevrotain": ("Chevrotain", "m"), "cottontail": ("Lapin", "m"), "mole shrew": ("Musaraigne-taupe", "f"), "pine vole": ("Campagnol souterrain", "m"), "seal": ("Phoque", "m"), "whale": ("Baleine", "f"),
    "deer": ("Cerf", "m"), "planigale": ("Planigale", "m"), "mangabey": ("Mangabey", "m"), "uacari": ("Ouakari", "m"),
    "loris": ("Loris", "m"), "akodont": ("Akodon", "m"), "macaque": ("Macaque", "m"), "noctule": ("Noctule", "f"),
    "otter": ("Loutre", "f"), "badger": ("Blaireau", "m"), "bettong": ("Bettong", "m"), "anomalure": ("Anomalure", "m"),
    "ferret-badger": ("Blaireau-furet", "m"), "dik-dik": ("Dik-dik", "m"), "goral": ("Goral", "m"), "viscacha": ("Viscache", "f"),
    "degu": ("Dègue", "m"), "dog": ("Chien", "m"), "barbastelle": ("Barbastelle", "f"), "marten": ("Martre", "f"),
    "cat": ("Chat", "m"), "porpoise": ("Marsouin", "m"), "pademelon": ("Pademelon", "m"), "potoroo": ("Potorou", "m"),
    "hyrax": ("Daman", "m"), "sifaka": ("Propithèque", "m"), "jackrabbit": ("Lièvre", "m"), "gundi": ("Goundi", "m"),
    "solenodon": ("Solénodon", "m"), "rousette": ("Roussette", "f"), "hippopotamus": ("Hippopotame", "m"),
    "antelope": ("Antilope", "f"), "anteater": ("Fourmilier", "m"), "baboon": ("Babouin", "m"), "serow": ("Saro", "m"),
    "hog": ("Porc", "m"), "quoll": ("Chat marsupial", "m"), "sloth": ("Paresseux", "m"), "manatee": ("Lamantin", "m"),
    "potto": ("Potto", "m"), "capybara": ("Capybara", "m"), "paca": ("Paca", "m"), "acouchi": ("Acouchi", "m"),
    "lemming": ("Lemming", "m"), "pocket gopher": ("Gaufre", "m"), "flying fox": ("Roussette", "f"), "fruit bat": ("Roussette", "f"),
    "horseshoe bat": ("Rhinolophe", "m"), "roundleaf bat": ("Phyllorhine", "f"), "free-tailed bat": ("Molosse", "m"),
    "mastiff bat": ("Molosse", "m"), "long-eared bat": ("Oreillard", "m"), "mouse lemur": ("Microcèbe", "m"),
    "flying squirrel": ("Écureuil volant", "m"), "ground squirrel": ("Spermophile", "m"), "tree squirrel": ("Écureuil", "m"),
    "kangaroo rat": ("Rat-kangourou", "m"), "pocket mouse": ("Souris à abajoues", "f"), "jumping mouse": ("Souris sauteuse", "f"),
    "birch mouse": ("Siciste", "f"), "harvest mouse": ("Souris des moissons", "f"), "spiny mouse": ("Souris épineuse", "f"),
    "climbing mouse": ("Souris grimpeuse", "f"), "grass mouse": ("Souris des herbes", "f"), "rice rat": ("Rat du riz", "m"),
    "water rat": ("Rat d'eau", "m"), "cotton rat": ("Rat du coton", "m"), "brush-tailed rat": ("Rat à queue en brosse", "m"),
    "sheath-tailed bat": ("Emballonure", "f"), "leaf-nosed bat": ("Chauve-souris à nez en feuille", "f"),
    "tube-nosed bat": ("Chauve-souris à nez tubulaire", "f"), "mouse-eared bat": ("Murin", "m"), "house bat": ("Chauve-souris des maisons", "f"),
    "woolly bat": ("Chauve-souris laineuse", "f"), "yellow bat": ("Chauve-souris jaune", "f"), "big-eared bat": ("Chauve-souris à grandes oreilles", "f"),
    "white-toothed shrew": ("Crocidure", "f"), "mouse shrew": ("Musaraigne-souris", "f"), "water shrew": ("Musaraigne aquatique", "f"),
    "elephant shrew": ("Musaraigne-éléphant", "f"), "shrew-opossum": ("Opossum-musaraigne", "m"), "otter-shrew": ("Loutre-musaraigne", "f"),
    "mouse opossum": ("Opossum-souris", "m"), "squirrel monkey": ("Saïmiri", "m"), "spider monkey": ("Singe-araignée", "m"),
    "night monkey": ("Douroucouli", "m"), "woolly monkey": ("Singe laineux", "m"), "leaf monkey": ("Semnopithèque", "m"),
    "snub-nosed monkey": ("Rhinopithèque", "m"), "false-vampire": ("Faux-vampire", "m"), "vampire bat": ("Vampire", "m"),
    "beaked whale": ("Baleine à bec", "f"), "sea lion": ("Otarie", "f"), "fur seal": ("Otarie à fourrure", "f"),
    "prairie dog": ("Chien de prairie", "m"), "wild dog": ("Chien sauvage", "m"), "mole-vole": ("Campagnol-taupe", "m"),
    "bamboo rat": ("Rat des bambous", "m"), "giant rat": ("Rat géant", "m"), "pouched rat": ("Rat à poche", "m"),
    "mosaic-tailed rat": ("Rat à queue en mosaïque", "m"), "rock-wallaby": ("Wallaby des rochers", "m"), "tree-kangaroo": ("Kangourou arboricole", "m"),
    "pygmy possum": ("Phalanger pygmée", "m"), "ringtail possum": ("Phalanger à queue annelée", "m"), "flying squirrel": ("Écureuil volant", "m"),
    "nectar bat": ("Chauve-souris à nectar", "f"), "fishing bat": ("Chauve-souris pêcheuse", "f"), "bent-winged bat": ("Minioptère", "m"),
    "long-fingered bat": ("Minioptère", "m"), "slit-faced bat": ("Nyctère", "m"), "trident bat": ("Chauve-souris à trident", "f"),
    "funnel-eared bat": ("Natalidé", "m"), "disk-winged bat": ("Thyroptère", "m"), "tomb bat": ("Taphien", "m"),
    "dog-faced bat": ("Chauve-souris à face de chien", "f"), "spear-nosed bat": ("Phyllostome", "m"), "round-eared bat": ("Chauve-souris à oreilles rondes", "f"),
}

# Mots qui décrivent (adjectifs simples) : forme masculine, féminine.
ADJ = {
    "white": ("blanc", "blanche"), "black": ("noir", "noire"), "red": ("roux", "rousse"), "yellow": ("jaune", "jaune"), "gray": ("gris", "grise"),
    "grey": ("gris", "grise"), "brown": ("brun", "brune"), "golden": ("doré", "dorée"), "silver": ("argenté", "argentée"), "silvery": ("argenté", "argentée"),
    "dark": ("sombre", "sombre"), "pale": ("pâle", "pâle"), "rufous": ("roux", "rousse"), "tawny": ("fauve", "fauve"), "spotted": ("tacheté", "tachetée"),
    "striped": ("rayé", "rayée"), "banded": ("rayé", "rayée"), "giant": ("géant", "géante"), "pygmy": ("pygmée", "pygmée"), "dwarf": ("nain", "naine"),
    "common": ("commun", "commune"), "spiny": ("épineux", "épineuse"), "woolly": ("laineux", "laineuse"), "hairy": ("poilu", "poilue"),
    "naked": ("nu", "nue"), "flying": ("volant", "volante"), "climbing": ("grimpeur", "grimpeuse"), "jumping": ("sauteur", "sauteuse"),
    "hopping": ("sauteur", "sauteuse"), "slender": ("svelte", "svelte"), "robust": ("robuste", "robuste"), "painted": ("peint", "peinte"),
    "lesser": ("petit", "petite"), "greater": ("grand", "grande"), "small": ("petit", "petite"), "large": ("grand", "grande"), "little": ("petit", "petite"),
    "big": ("grand", "grande"), "long": ("long", "longue"), "short": ("court", "courte"), "broad": ("large", "large"), "narrow": ("étroit", "étroite"),
    "orange": ("orange", "orange"), "olive": ("olive", "olive"), "chestnut": ("châtain", "châtain"), "cinnamon": ("cannelle", "cannelle"),
    "buff": ("chamois", "chamois"), "ashy": ("cendré", "cendrée"), "dusky": ("sombre", "sombre"), "sooty": ("fuligineux", "fuligineuse"),
    "crested": ("huppé", "huppée"), "masked": ("masqué", "masquée"), "hooded": ("à capuchon", "à capuchon"), "maned": ("à crinière", "à crinière"),
    "fat": ("gras", "grasse"), "soft": ("doux", "douce"), "harsh": ("rêche", "rêche"), "thick": ("épais", "épaisse"), "thin": ("fin", "fine"),
    "blind": ("aveugle", "aveugle"), "rough": ("rugueux", "rugueuse"), "smooth": ("lisse", "lisse"), "gracile": ("gracile", "gracile"),
    "least": ("minuscule", "minuscule"), "tiny": ("minuscule", "minuscule"), "highland": ("des hautes terres", "des hautes terres"),
    "lowland": ("des plaines", "des plaines"), "forest": ("des forêts", "des forêts"), "mountain": ("des montagnes", "des montagnes"),
    "montane": ("des montagnes", "des montagnes"), "tree": ("arboricole", "arboricole"), "grass": ("des herbes", "des herbes"), "rice": ("du riz", "du riz"),
    "desert": ("du désert", "du désert"), "swamp": ("des marais", "des marais"), "marsh": ("des marais", "des marais"), "water": ("aquatique", "aquatique"),
    "rock": ("des rochers", "des rochers"), "rocky": ("des rochers", "des rochers"), "house": ("des maisons", "des maisons"), "cave": ("des grottes", "des grottes"),
    "woodland": ("des bois", "des bois"), "wood": ("des bois", "des bois"), "bush": ("des buissons", "des buissons"), "savanna": ("des savanes", "des savanes"),
    "field": ("des champs", "des champs"), "meadow": ("des prairies", "des prairies"), "sand": ("des sables", "des sables"), "island": ("des îles", "des îles"),
    "coastal": ("côtier", "côtière"), "arboreal": ("arboricole", "arboricole"), "fruit": ("frugivore", "frugivore"), "fish-eating": ("piscivore", "piscivore"),
    "dwarf": ("nain", "naine"), "rainforest": ("de la forêt tropicale", "de la forêt tropicale"), "cloud": ("des nuages", "des nuages"),
    "bamboo": ("des bambous", "des bambous"), "pouched": ("à poche", "à poche"), "mosaic": ("en mosaïque", "en mosaïque"), "false": ("faux", "fausse"),
    "true": ("vrai", "vraie"), "wild": ("sauvage", "sauvage"), "pallid": ("pâle", "pâle"), "plain": ("uni", "unie"), "variegated": ("bigarré", "bigarrée"),
    "ruddy": ("roux", "rousse"), "tricolored": ("tricolore", "tricolore"), "bicolored": ("bicolore", "bicolore"), "elegant": ("élégant", "élégante"),
    "beautiful": ("joli", "jolie"), "pretty": ("joli", "jolie"), "graceful": ("gracieux", "gracieuse"), "nimble": ("agile", "agile"),
    "big-headed": ("à grosse tête", "à grosse tête"), "lion": ("lion", "lion"), "tiger": ("tigre", "tigre"), "leopard": ("léopard", "léopard"),
}
DIRECTIONS = {"northern": "du Nord", "southern": "du Sud", "eastern": "de l'Est", "western": "de l'Ouest", "central": "du Centre",
              "north": "du Nord", "south": "du Sud", "east": "de l'Est", "west": "de l'Ouest", "northeastern": "du Nord-Est",
              "northwestern": "du Nord-Ouest", "southeastern": "du Sud-Est", "southwestern": "du Sud-Ouest", "african": "d'Afrique",
              "asian": "d'Asie", "american": "d'Amérique", "european": "d'Europe", "australian": "d'Australie", "indian": "d'Inde",
              "chinese": "de Chine", "japanese": "du Japon", "malayan": "de Malaisie", "mexican": "du Mexique", "brazilian": "du Brésil",
              "peruvian": "du Pérou", "bolivian": "de Bolivie", "andean": "des Andes", "himalayan": "de l'Himalaya", "arctic": "de l'Arctique",
              "philippine": "des Philippines", "sumatran": "de Sumatra", "javan": "de Java", "bornean": "de Bornéo", "malagasy": "de Madagascar",
              "madagascan": "de Madagascar", "ethiopian": "d'Éthiopie", "congolese": "du Congo", "cuban": "de Cuba", "caribbean": "des Caraïbes",
              "amazonian": "d'Amazonie", "patagonian": "de Patagonie", "tibetan": "du Tibet", "siberian": "de Sibérie", "taiwanese": "de Taïwan", "colombian": "de Colombie", "indochinese": "d'Indochine", "angolan": "d'Angola", "guianan": "des Guyanes",
              "ecuadorean": "d'Équateur", "ecuadorian": "d'Équateur", "arabian": "d'Arabie", "chacoan": "du Chaco", "papuan": "de Papouasie",
              "alpine": "des Alpes", "antillean": "des Antilles", "egyptian": "d'Égypte", "jamaican": "de Jamaïque", "iberian": "ibérique",
              "caucasian": "du Caucase", "eurasian": "d'Eurasie", "lankan": "du Sri Lanka", "burmese": "de Birmanie", "nicaraguan": "du Nicaragua",
              "moluccan": "des Moluques", "mediterranean": "de Méditerranée", "honduran": "du Honduras", "venezuelan": "du Venezuela",
              "anatolian": "d'Anatolie", "nepalese": "du Népal", "indomalayan": "d'Indomalaisie", "sundaic": "de la Sonde", "vietnamese": "du Viêt Nam",
              "malaysian": "de Malaisie", "chilean": "du Chili", "hispaniolan": "d'Hispaniola", "formosan": "de Taïwan", "mongolian": "de Mongolie",
              "talamancan": "de Talamanca", "paraguayan": "du Paraguay", "iranian": "d'Iran", "gambian": "de Gambie", "sinaloan": "du Sinaloa",
              "oaxacan": "d'Oaxaca", "tanzanian": "de Tanzanie", "sulawesian": "de Sulawesi", "argentine": "d'Argentine", "ugandan": "d'Ouganda",
              "panamanian": "du Panama", "korean": "de Corée", "afghan": "d'Afghanistan", "haitian": "d'Haïti", "nigerian": "du Nigeria",
              "chihuahuan": "du Chihuahua", "persian": "de Perse", "guatemalan": "du Guatemala", "caspian": "de la Caspienne", "chiapan": "du Chiapas",
              "somalian": "de Somalie", "guinean": "de Guinée", "serbian": "de Serbie", "indonesian": "d'Indonésie", "mesoamerican": "de Mésoamérique",
              "fijian": "des Fidji", "tasmanian": "de Tasmanie", "bahian": "de Bahia", "manchurian": "de Mandchourie", "laotian": "du Laos",
              "syrian": "de Syrie", "armenian": "d'Arménie", "hungarian": "de Hongrie", "transcaucasian": "de Transcaucasie", "beringian": "de Béringie",
              "sonoran": "du Sonora", "mauritanian": "de Mauritanie", "abyssinian": "d'Abyssinie", "malay": "de Malaisie", "atlantic": "de l'Atlantique",
              "pacific": "du Pacifique", "nepal": "du Népal", "peru": "du Pérou", "brazil": "du Brésil", "japan": "du Japon", "china": "de Chine", "india": "d'Inde", "mexico": "du Mexique", "costa": "du Costa", "incan": "des Incas", "olympic": "des Olympic", "carpentarian": "de Carpentarie", "amazon": "d'Amazonie", "amazonas": "d'Amazonie"}

# Parties du corps pour « X-tailed », « X-eared »… : (mot, genre, pluriel)
CORPS = {
    "tailed": ("queue", "f", False), "eared": ("oreilles", "f", True), "nosed": ("nez", "m", False), "toothed": ("dents", "f", True),
    "footed": ("pieds", "m", True), "bellied": ("ventre", "m", False), "backed": ("dos", "m", False), "headed": ("tête", "f", False),
    "throated": ("gorge", "f", False), "lipped": ("lèvres", "f", True), "winged": ("ailes", "f", True), "faced": ("face", "f", False),
    "legged": ("pattes", "f", True), "furred": ("fourrure", "f", False), "haired": ("poils", "m", True), "snouted": ("museau", "m", False),
    "cheeked": ("joues", "f", True), "necked": ("cou", "m", False), "chested": ("poitrine", "f", False), "rumped": ("croupion", "m", False),
    "crowned": ("couronne", "f", False), "fronted": ("front", "m", False), "shouldered": ("épaules", "f", True), "sided": ("flancs", "m", True),
    "collared": ("collier", "m", False), "whiskered": ("moustaches", "f", True), "fingered": ("doigts", "m", True), "clawed": ("griffes", "f", True),
    "eyed": ("yeux", "m", True), "horned": ("cornes", "f", True), "spined": ("épines", "f", True), "lobed": ("lobes", "m", True),
    "thumbed": ("pouces", "m", True), "muzzled": ("museau", "m", False), "maned": ("crinière", "f", False), "chinned": ("menton", "m", False),
    "browed": ("sourcils", "m", True), "masked": ("masque", "m", False), "skinned": ("peau", "f", False), "toed": ("orteils", "m", True),
}
# Formes « long », « court »… pour les parties du corps (accord en genre et en nombre).
ADJ_CORPS = {
    "long": ("long", "longue", "longs", "longues"), "short": ("court", "courte", "courts", "courtes"), "big": ("grand", "grande", "grands", "grandes"),
    "large": ("grand", "grande", "grands", "grandes"), "small": ("petit", "petite", "petits", "petites"), "broad": ("large", "large", "larges", "larges"),
    "narrow": ("étroit", "étroite", "étroits", "étroites"), "thick": ("épais", "épaisse", "épais", "épaisses"), "thin": ("fin", "fine", "fins", "fines"),
    "slender": ("fin", "fine", "fins", "fines"), "fat": ("gros", "grosse", "gros", "grosses"), "flat": ("plat", "plate", "plats", "plates"),
    "round": ("rond", "ronde", "ronds", "rondes"), "pointed": ("pointu", "pointue", "pointus", "pointues"), "hairy": ("poilu", "poilue", "poilus", "poilues"),
    "naked": ("nu", "nue", "nus", "nues"), "bare": ("nu", "nue", "nus", "nues"), "soft": ("doux", "douce", "doux", "douces"), "woolly": ("laineux", "laineuse", "laineux", "laineuses"),
    "spiny": ("épineux", "épineuse", "épineux", "épineuses"), "bushy": ("touffu", "touffue", "touffus", "touffues"), "white": ("blanc", "blanche", "blancs", "blanches"),
    "black": ("noir", "noire", "noirs", "noires"), "red": ("roux", "rousse", "roux", "rousses"), "yellow": ("jaune", "jaune", "jaunes", "jaunes"),
    "gray": ("gris", "grise", "gris", "grises"), "grey": ("gris", "grise", "gris", "grises"), "brown": ("brun", "brune", "bruns", "brunes"),
    "golden": ("doré", "dorée", "dorés", "dorées"), "silver": ("argenté", "argentée", "argentés", "argentées"), "dark": ("sombre", "sombre", "sombres", "sombres"),
    "pale": ("pâle", "pâle", "pâles", "pâles"), "rufous": ("roux", "rousse", "roux", "rousses"), "orange": ("orange", "orange", "orange", "orange"),
    "buff": ("chamois", "chamois", "chamois", "chamois"), "tawny": ("fauve", "fauve", "fauves", "fauves"), "pink": ("rose", "rose", "roses", "roses"),
    "blue": ("bleu", "bleue", "bleus", "bleues"), "olive": ("olive", "olive", "olive", "olive"), "striped": ("rayé", "rayée", "rayés", "rayées"),
    "spotted": ("tacheté", "tachetée", "tachetés", "tachetées"), "ringed": ("annelé", "annelée", "annelés", "annelées"), "banded": ("rayé", "rayée", "rayés", "rayées"),
    "brush": ("en brosse", "en brosse", "en brosse", "en brosse"), "tube": ("tubulaire", "tubulaire", "tubulaires", "tubulaires"),
    "leaf": ("en feuille", "en feuille", "en feuille", "en feuille"), "funnel": ("en entonnoir", "en entonnoir", "en entonnoir", "en entonnoir"),
    "mouse": ("de souris", "de souris", "de souris", "de souris"), "pig": ("de cochon", "de cochon", "de cochon", "de cochon"),
    "dog": ("de chien", "de chien", "de chien", "de chien"), "fox": ("de renard", "de renard", "de renard", "de renard"),
    "rat": ("de rat", "de rat", "de rat", "de rat"), "free": ("libre", "libre", "libres", "libres"), "mosaic": ("en mosaïque", "en mosaïque", "en mosaïque", "en mosaïque"),
    "prehensile": ("préhensile", "préhensile", "préhensiles", "préhensiles"), "crested": ("huppé", "huppée", "huppés", "huppées"), "tufted": ("touffu", "touffue", "touffus", "touffues"),
    "bristly": ("hérissé", "hérissée", "hérissés", "hérissées"), "smooth": ("lisse", "lisse", "lisses", "lisses"), "rough": ("rugueux", "rugueuse", "rugueux", "rugueuses"),
    "harsh": ("rêche", "rêche", "rêches", "rêches"), "fringe": ("frangé", "frangée", "frangés", "frangées"), "fringed": ("frangé", "frangée", "frangés", "frangées"),
    "pale-bellied": None,
}


# Mots anglais courants écrits avec une majuscule : ce ne sont pas des lieux, on ne devine pas.
STOP = set("""great pink fairy sun moon star mustached burnished atlantic pacific sword fig blossom moss lake river island islands valley
plateau peninsula hill hills coast delta bay sea range mountains highlands king queen princess lady prince emperor royal old new
ghost fire sword hog crab fish frog snail ant termite honey bamboo cactus palm pine oak cedar desert savanna steppe tundra
marsh swamp jungle canyon cliff dune ridge peak falls spring springs creek lagoon reef gulf strait cape point harbor port fort
saint st san santa santo sao don dom mrs mr miss sir doctor captain general admiral baron count duke pale dark light bright deep
high low upper lower inner outer middle far near rough smooth soft hard hot cold dry wet warm cool wild free true false fat
slender tall short broad narrow thick thin heavy little lesser greater small large big giant dwarf pygmy common mock bush tree
forest mountain rock water field meadow grass rice house cave wood woodland garden farm city village town glacier volcano
mexico mexican spanish french english german dutch portuguese italian greek turkish arabian persian indian chinese japanese
bronze root copper iron stone silver gold coral pearl ivory ebony amber jade velvet satin silk shadow smoky silent trident oldfield dog cat social brush gentle delicate cryptic hidden lucky timid shy solitary lorrain hoary korean thai lao burmese malay javan sumatran bornean celebes sulawesi guinea new-guinea west east north south central""".split())
STOP |= set("blue green purple violet scarlet crimson rosy agile intermediate fierce minute hourglass handsome brave noble modest humble splendid magnificent strange uniform swift fast slow lazy curious bold charming dainty diminutive enormous huge mighty proud dusky tufted ornate eastern western northern southern spectral hidden gilded fringed spectacled sombre somber shining glossy".split()) | {k for k in TETES if " " not in k} | {"thicket", "ranee", "southeast", "southwest", "northeast", "northwest", "island", "islands", "asian"}
TETES.update({"shrew tenrec": ("Tenrec-musaraigne", "m"), "thicket rat": ("Rat des fourrés", "m")})
LIEUX_OK = set("palawan hainan sichuan taiwan yunnan shan andaman tian van juan minshan kerman cayman tucuman michoacan sudan japan oman yucatan".split())
DEMONYME = re.compile(r".*(an|ian|ean|ese|ic|ish|ine|ing|ed|ive|ous|ful|less|ly|er|y)$", re.I)


def de(lieu):
    lieu = lieu.strip()
    return ("d'" if re.match(r"[AEIOUYÉÈHaeiouyéèh]", lieu) else "de ") + lieu


def corps(mot):
    """« long-tailed » → « à longue queue » (None si inconnu)."""
    m = re.fullmatch(r"([a-z]+)-([a-z]+)", mot)
    if not m or m.group(2) not in CORPS:
        return None
    nom, g, pl = CORPS[m.group(2)]
    a = ADJ_CORPS.get(m.group(1))
    if not a:
        return None
    adj = a[(2 if pl else 0) + (1 if g == "f" else 0)]
    # Les tailles se placent avant le nom (« à longue queue »), les autres après (« à queue blanche »).
    avant = m.group(1) in ("long", "short", "big", "large", "small", "broad", "thick", "thin", "fat")
    return f"à {adj} {nom}" if avant else f"à {nom} {adj}"


def traduire(nom):
    mots = nom.replace("’", "'").split()
    bas = [m.lower() for m in mots]
    # Le nom principal : la plus longue fin connue (2 ou 3 mots, ou 1).
    tete = None
    for k in (3, 2, 1):
        if len(bas) >= k and " ".join(bas[-k:]) in TETES:
            tete = TETES[" ".join(bas[-k:])]
            reste = mots[:-k]
            break
    if not tete:
        return None
    fr, genre = tete
    apres, lieux, avant = [], [], []
    dernier_propre = False
    for i, m in enumerate(reste):
        b = m.lower()
        if b == "mount" and i + 1 < len(reste):
            lieux.append("du mont")
            dernier_propre = True
            continue
        if lieux and lieux[-1] == "du mont" and m[:1].isupper():
            lieux[-1] = "du mont " + m
            continue
        prec_propre = dernier_propre
        dernier_propre = False
        if prec_propre and lieux and m[:1].isupper() and re.fullmatch(r"[A-Za-zÀ-ÿ]+", m) and b not in STOP and b not in ADJ and b not in DIRECTIONS and not DEMONYME.match(m):
            lieux[-1] = lieux[-1] + " " + m
            dernier_propre = True
            continue
        if m.endswith("'s"):
            lieux.append(de(m[:-2]))
        elif b in DIRECTIONS:
            lieux.append(DIRECTIONS[b])
        elif b in ("lesser", "greater", "little", "small", "large", "big") and not avant:
            avant.append(ADJ[b][1 if genre == "f" else 0].capitalize())
        elif b in ADJ:
            apres.append(ADJ[b][1 if genre == "f" else 0])
        elif "-" in b and corps(b):
            apres.append(corps(b))
        elif m[:1].isupper() and re.fullmatch(r"[A-Za-zÀ-ÿ]+(-[A-ZÀ-Ý][a-zà-ÿ]+)*", m) and b not in STOP and (b in LIEUX_OK or not DEMONYME.match(m)):
            # Un lieu ou un nom propre : « de Jaintia ». Deux à la suite forment un seul nom (« Lagoa Santa »).
            if lieux and lieux[-1].startswith(("de ", "d'")) and dernier_propre:
                lieux[-1] = lieux[-1] + " " + m
            else:
                lieux.append(de(m))
            dernier_propre = True
            continue
        else:
            return None  # un mot inconnu : on ne devine pas
    # En français, les descriptions se lisent dans l'ordre inverse de l'anglais.
    morceaux = avant + [fr if not avant else fr[0].lower() + fr[1:]] + list(reversed(apres)) + lieux
    t = " ".join(morceaux)
    # Plusieurs lieux à la suite : « de Hinde de Malaisie » reste lisible.
    return t[0].upper() + t[1:]


def principal():
    d = json.loads((R / "mammiferes.json").read_text())
    fr = json.loads((R / "noms-fr.json").read_text())
    sortie = {}
    rates = []
    for e in d["especes"]:
        if e["id"] in fr or e.get("langue") == "fr":
            continue
        t = traduire(e["nom"])
        if t:
            sortie[e["id"]] = t
        else:
            rates.append(e["nom"])
    (R / "noms-traduits.json").write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":"), sort_keys=True))
    print("traduits :", len(sortie), "· restent en anglais :", len(rates))
    return sortie, rates


if __name__ == "__main__":
    s, r = principal()
    import random
    random.seed(2)
    for k in random.sample(list(s), 40):
        print(s[k])
    print("--- pas traduits, exemples :", random.sample(r, min(30, len(r))))

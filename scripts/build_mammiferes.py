#!/usr/bin/env python3
"""Build the mammal catalog from the Mammal Diversity Database and observed COMBINE traits."""

import csv
import json
import re
from pathlib import Path

ROOT = Path("/workspace")
MDD = Path("/tmp/mdd/MDD_v2.5.csv")
TRAITS = Path("/tmp/mdd/traits.csv")
WIKI = Path("/tmp/mdd/wiki.json")
OUT = ROOT / "src/data/mammiferes.json"

FAMILLES = {
    "Abrocomidae": "Rats-chinchillas",
    "Acrobatidae": "Acrobates",
    "Ailuridae": "Pandas roux",
    "Anomaluridae": "Anomalures",
    "Antilocapridae": "Antilocapres",
    "Aotidae": "Singes de nuit",
    "Aplodontiidae": "Castors de montagne",
    "Archaeolemuridae": "Archéolémurs",
    "Atelidae": "Atèles",
    "Balaenidae": "Baleines franches",
    "Balaenopteridae": "Rorquals",
    "Bathyergidae": "Rats-taupes",
    "Bovidae": "Bovidés",
    "Bradypodidae": "Paresseux à trois doigts",
    "Burramyidae": "Possums pygmées",
    "Caenolestidae": "Opossums-musaraignes",
    "Callitrichidae": "Ouistitis et tamarins",
    "Calomyscidae": "Hamsters-souris",
    "Camelidae": "Camélidés",
    "Canidae": "Canidés",
    "Castoridae": "Castors",
    "Caviidae": "Cobayes",
    "Cebidae": "Capucins",
    "Cercopithecidae": "Singes de l'Ancien Monde",
    "Cervidae": "Cervidés",
    "Cetotheriidae": "Baleines pygmées",
    "Chaeropodidae": "Bandicoots à pieds de cochon",
    "Cheirogaleidae": "Cheirogales",
    "Chinchillidae": "Chinchillas",
    "Chlamyphoridae": "Chlamyphoridés",
    "Choloepodidae": "Paresseux à deux doigts",
    "Chrysochloridae": "Taupes dorées",
    "Cistugidae": "Cistuges",
    "Craseonycteridae": "Chauves-souris bourdon",
    "Cricetidae": "Cricétidés",
    "Ctenodactylidae": "Goundis",
    "Ctenomyidae": "Tuco-tucos",
    "Cuniculidae": "Pacas",
    "Cyclopedidae": "Fourmiliers soyeux",
    "Cynocephalidae": "Colugos",
    "Dasypodidae": "Tatous à long nez",
    "Dasyproctidae": "Agoutis",
    "Dasyuridae": "Dasyures",
    "Daubentoniidae": "Aye-ayes",
    "Delphinidae": "Dauphins océaniques",
    "Diatomyidae": "Kha-nyous",
    "Didelphidae": "Opossums",
    "Dinomyidae": "Pacaranas",
    "Dipodidae": "Gerboises",
    "Dugongidae": "Dugongs",
    "Echimyidae": "Rats épineux",
    "Elephantidae": "Éléphants",
    "Emballonuridae": "Emballonuridés",
    "Equidae": "Équidés",
    "Erethizontidae": "Porcs-épics américains",
    "Erinaceidae": "Hérissons",
    "Euphractidae": "Tatous poilus",
    "Eupleridae": "Carnivores de Madagascar",
    "Felidae": "Félins",
    "Furipteridae": "Furipteridés",
    "Galagidae": "Galagos",
    "Geomyidae": "Géomys",
    "Giraffidae": "Girafes",
    "Gliridae": "Loirs",
    "Herpestidae": "Mangoustes",
    "Heterocephalidae": "Rats-taupes nus",
    "Heteromyidae": "Souris-kangourous",
    "Hippopotamidae": "Hippopotames",
    "Hipposideridae": "Hipposidères",
    "Hominidae": "Grands singes",
    "Hyaenidae": "Hyènes",
    "Hylobatidae": "Gibbons",
    "Hypsiprymnodontidae": "Rats-kangourous musqués",
    "Hystricidae": "Porcs-épics",
    "Indriidae": "Indris",
    "Iniidae": "Dauphins de rivière",
    "Kogiidae": "Cachalots nains",
    "Lemuridae": "Lémuridés",
    "Lepilemuridae": "Lépilémurs",
    "Leporidae": "Lapins et lièvres",
    "Lipotidae": "Dauphins de Chine",
    "Lorisidae": "Loris",
    "Macropodidae": "Kangourous",
    "Macroscelididae": "Musaraignes à trompe",
    "Manidae": "Pangolins",
    "Megadermatidae": "Mégadermes",
    "Megaladapidae": "Mégaladapidés",
    "Mephitidae": "Moufettes",
    "Microbiotheriidae": "Monitos del monte",
    "Miniopteridae": "Minioptères",
    "Molossidae": "Molosses",
    "Monodontidae": "Bélugas et narvals",
    "Mormoopidae": "Mormoopidés",
    "Moschidae": "Chevrotains porte-musc",
    "Muridae": "Muridés",
    "Mustelidae": "Mustélidés",
    "Myrmecobiidae": "Numbats",
    "Myrmecophagidae": "Fourmiliers",
    "Mystacinidae": "Chauves-souris de Nouvelle-Zélande",
    "Myzopodidae": "Myzopodidés",
    "Nandiniidae": "Civettes palmistes",
    "Natalidae": "Natalidés",
    "Nesomyidae": "Nésomyidés",
    "Nesophontidae": "Nésophontes",
    "Noctilionidae": "Noctilions",
    "Notoryctidae": "Taupes marsupiales",
    "Nycteridae": "Nyctères",
    "Ochotonidae": "Pikas",
    "Octodontidae": "Octodons",
    "Odobenidae": "Morses",
    "Ornithorhynchidae": "Ornithorynques",
    "Orycteropodidae": "Oryctéropes",
    "Otariidae": "Otaries",
    "Palaeopropithecidae": "Paléopropithèques",
    "Pedetidae": "Lièvres sauteurs",
    "Peramelidae": "Péramèles",
    "Petauridae": "Phalangers planeurs",
    "Petromuridae": "Rats des rochers",
    "Phalangeridae": "Phalangers",
    "Phascolarctidae": "Koalas",
    "Phocidae": "Phoques",
    "Phocoenidae": "Marsouins",
    "Phyllostomidae": "Phyllostomidés",
    "Physeteridae": "Cachalots",
    "Pitheciidae": "Pithéciidés",
    "Platacanthomyidae": "Platacanthomyidés",
    "Platanistidae": "Platanistes",
    "Pontoporiidae": "Dauphins de La Plata",
    "Potamogalidae": "Potamogales",
    "Potoroidae": "Potoroos",
    "Prionodontidae": "Linsangs",
    "Procaviidae": "Damans",
    "Procyonidae": "Procyonidés",
    "Prolagidae": "Prolagus",
    "Pseudocheiridae": "Possums à queue en anneau",
    "Pteropodidae": "Roussettes",
    "Ptilocercidae": "Ptilocerques",
    "Rhinocerotidae": "Rhinocéros",
    "Rhinolophidae": "Rhinolophes",
    "Rhinonycteridae": "Rhinonyctères",
    "Rhinopomatidae": "Rhinopomes",
    "Sciuridae": "Écureuils",
    "Sminthidae": "Sicistes",
    "Solenodontidae": "Solénodons",
    "Soricidae": "Musaraignes",
    "Spalacidae": "Spalacidés",
    "Suidae": "Suidés",
    "Tachyglossidae": "Échidnés",
    "Talpidae": "Taupes",
    "Tapiridae": "Tapirs",
    "Tarsiidae": "Tarsiers",
    "Tarsipedidae": "Souris à miel",
    "Tayassuidae": "Pécaris",
    "Tenrecidae": "Tenrecs",
    "Thryonomyidae": "Aulacodes",
    "Thylacinidae": "Thylacines",
    "Thylacomyidae": "Bandicoots-lapins",
    "Thyropteridae": "Thyroptères",
    "Tolypeutidae": "Tolypeutes",
    "Tragulidae": "Chevrotains",
    "Trichechidae": "Lamantins",
    "Tupaiidae": "Toupayes",
    "Ursidae": "Ours",
    "Vespertilionidae": "Vespertilions",
    "Viverridae": "Civettes et genettes",
    "Vombatidae": "Wombats",
    "Zapodidae": "Zapodes",
    "Zenkerellidae": "Zenkerelles",
    "Ziphiidae": "Baleines à bec",
}

CONTINENTS = {
    "Africa": "Afrique",
    "Asia": "Asie",
    "Europe": "Europe",
    "North America": "Amérique du Nord",
    "South America": "Amérique du Sud",
    "Oceania (Continent)": "Océanie",
    "Antarctica": "Antarctique",
}

PAYS = {
    "France": "France",
    "Australia": "Australie",
    "China": "Chine",
    "India": "Inde",
    "Brazil": "Brésil",
    "United States": "États-Unis",
    "Canada": "Canada",
    "Mexico": "Mexique",
    "Madagascar": "Madagascar",
    "Indonesia": "Indonésie",
    "Russia": "Russie",
    "Japan": "Japon",
    "South Africa": "Afrique du Sud",
    "New Zealand": "Nouvelle-Zélande",
    "Argentina": "Argentine",
    "Peru": "Pérou",
    "Chile": "Chili",
    "Colombia": "Colombie",
    "Kenya": "Kenya",
    "Tanzania": "Tanzanie",
    "Ethiopia": "Éthiopie",
    "Spain": "Espagne",
    "Italy": "Italie",
    "Germany": "Allemagne",
    "United Kingdom": "Royaume-Uni",
    "Norway": "Norvège",
    "Sweden": "Suède",
    "Finland": "Finlande",
    "Egypt": "Égypte",
    "Morocco": "Maroc",
    "Algeria": "Algérie",
    "Nigeria": "Nigeria",
    "Democratic Republic of the Congo": "République démocratique du Congo",
    "Republic of the Congo": "Congo",
    "Vietnam": "Vietnam",
    "Thailand": "Thaïlande",
    "Malaysia": "Malaisie",
    "Philippines": "Philippines",
    "Papua New Guinea": "Papouasie-Nouvelle-Guinée",
    "Greenland": "Groenland",
    "Iceland": "Islande",
    "Turkey": "Turquie",
    "Iran": "Iran",
    "Mongolia": "Mongolie",
    "Pakistan": "Pakistan",
    "Nepal": "Népal",
    "Sri Lanka": "Sri Lanka",
    "Cuba": "Cuba",
    "Bolivia": "Bolivie",
    "Ecuador": "Équateur",
    "Venezuela": "Venezuela",
    "Paraguay": "Paraguay",
    "Uruguay": "Uruguay",
    "Cameroon": "Cameroun",
    "Gabon": "Gabon",
    "Namibia": "Namibie",
    "Botswana": "Botswana",
    "Zimbabwe": "Zimbabwe",
    "Mozambique": "Mozambique",
    "Angola": "Angola",
    "Sudan": "Soudan",
    "South Sudan": "Soudan du Sud",
    "Saudi Arabia": "Arabie saoudite",
    "Israel": "Israël",
    "Poland": "Pologne",
    "Ukraine": "Ukraine",
    "Greece": "Grèce",
    "Portugal": "Portugal",
    "Ireland": "Irlande",
    "Switzerland": "Suisse",
    "Belgium": "Belgique",
    "Netherlands": "Pays-Bas",
    "Austria": "Autriche",
    "Hungary": "Hongrie",
    "Romania": "Roumanie",
    "Bulgaria": "Bulgarie",
    "Croatia": "Croatie",
    "Serbia": "Serbie",
    "Czech Republic": "Tchéquie",
    "Slovakia": "Slovaquie",
    "Denmark": "Danemark",
    "Taiwan": "Taïwan",
    "South Korea": "Corée du Sud",
    "North Korea": "Corée du Nord",
    "Myanmar": "Birmanie",
    "Laos": "Laos",
    "Cambodia": "Cambodge",
    "Bangladesh": "Bangladesh",
    "Afghanistan": "Afghanistan",
    "Kazakhstan": "Kazakhstan",
    "Uzbekistan": "Ouzbékistan",
    "Iraq": "Irak",
    "Syria": "Syrie",
    "Jordan": "Jordanie",
    "Lebanon": "Liban",
    "Libya": "Libye",
    "Tunisia": "Tunisie",
    "Senegal": "Sénégal",
    "Mali": "Mali",
    "Niger": "Niger",
    "Chad": "Tchad",
    "Somalia": "Somalie",
    "Uganda": "Ouganda",
    "Rwanda": "Rwanda",
    "Burundi": "Burundi",
    "Zambia": "Zambie",
    "Malawi": "Malawi",
    "Ghana": "Ghana",
    "Cote d'Ivoire": "Côte d'Ivoire",
    "Guinea": "Guinée",
    "Sierra Leone": "Sierra Leone",
    "Liberia": "Liberia",
    "Benin": "Bénin",
    "Togo": "Togo",
    "Central African Republic": "République centrafricaine",
    "Equatorial Guinea": "Guinée équatoriale",
    "Mauritania": "Mauritanie",
    "Western Sahara": "Sahara occidental",
}

STATUT = {
    "LC": "Préoccupation mineure",
    "NT": "Quasi menacé",
    "VU": "Vulnérable",
    "EN": "En danger",
    "CR": "En danger critique",
    "EW": "Éteint à l'état sauvage",
    "EX": "Éteint",
    "DD": "Données insuffisantes",
    "NE": "Non évalué",
}

MILIEU = {
    "G": "Surtout au sol.",
    "Ar": "Surtout dans les arbres.",
    "A": "Surtout en vol.",
    "S": "Au sol et dans les arbres.",
    "M": "Surtout dans la mer.",
}

SCIENTIFIQUE = re.compile(r"^[A-Z][a-z]+ [a-z]+$")


def nombre(valeur):
    if valeur in ("", "NA", None):
        return None
    return float(valeur)


def virgule(nombre_float, decimales):
    return f"{nombre_float:.{decimales}f}".replace(".", ",")


def masse(grammes):
    if grammes < 1:
        return f"environ {virgule(grammes, 2)} g"
    if grammes < 10:
        return f"environ {virgule(grammes, 1)} g"
    if grammes < 1000:
        return f"environ {round(grammes)} g"
    kilos = grammes / 1000
    if kilos < 10:
        return f"environ {virgule(kilos, 2)} kg"
    if kilos < 100:
        return f"environ {virgule(kilos, 1)} kg"
    return f"environ {round(kilos)} kg"


def duree(jours):
    if jours < 60:
        return f"environ {round(jours)} jours"
    mois = jours / 30.44
    if abs(mois - round(mois)) < 0.2:
        return f"environ {round(mois)} mois"
    return f"environ {virgule(mois, 1)} mois ({round(jours)} jours)"


def moyenne(valeur):
    if abs(valeur - round(valeur)) < 0.05:
        return str(round(valeur))
    return virgule(valeur, 1)


def regime(trait):
    if not trait:
        return None, None
    niveau = trait.get("trophic_level") or ""
    if niveau in ("", "NA"):
        return None, None

    def part(cle):
        valeur = nombre(trait.get(cle))
        return 0 if valeur is None else valeur

    poissons = part("det_vfish")
    insectes = part("det_inv")
    fruits = part("det_fruit")
    nectar = part("det_nect")
    plantes = part("dphy_plant")
    details = [
        ("vertébrés à sang chaud", part("det_vend")),
        ("reptiles et amphibiens", part("det_vect")),
        ("poissons", poissons),
        ("autres vertébrés", part("det_vunk")),
        ("insectes et invertébrés", insectes),
        ("charognes", part("det_scav")),
        ("fruits", fruits),
        ("nectar", nectar),
        ("graines", part("det_seed")),
        ("autres plantes", part("det_plantother")),
    ]
    texte = ", ".join(f"{nom} {round(valeur)} %" for nom, valeur in details if valeur >= 10)
    if poissons >= 40:
        code = "piscivore"
    elif nectar >= 40:
        code = "nectarivore"
    elif fruits >= 50:
        code = "frugivore"
    elif insectes >= 50 and plantes < 30:
        code = "insectivore"
    elif niveau == "1":
        code = "herbivore"
    elif niveau == "2":
        code = "omnivore"
    else:
        code = "carnivore"
    return code, texte or None


def repartition(row):
    continents = []
    for morceau in (row["continentDistribution"] or "").split("|"):
        nom = morceau.strip().rstrip("?")
        if not nom or nom == "NA":
            continue
        francais = CONTINENTS.get(nom, nom)
        if francais not in continents:
            continents.append(francais)
    pays = []
    for morceau in (row["countryDistribution"] or "").split("|"):
        nom = morceau.strip().rstrip("?")
        if not nom or nom in ("NA", "Domesticated"):
            continue
        pays.append(PAYS.get(nom, nom))
    if not continents and not pays:
        return "Répartition mal connue."
    texte = ", ".join(continents)
    if 0 < len(pays) <= 3:
        texte = f"{texte} : {', '.join(pays)}" if texte else ", ".join(pays)
    elif len(pays) > 3 and texte:
        texte = f"{texte}. Présent dans {len(pays)} pays ou territoires."
    return texte


def charger_traits():
    table = {}
    with TRAITS.open(newline="", encoding="utf-8") as fichier:
        for row in csv.DictReader(fichier):
            table[f"{row['genus']}_{row['species']}"] = row
    return table


def charger_wiki():
    if not WIKI.exists():
        return {}
    return json.loads(WIKI.read_text())


def main():
    traits = charger_traits()
    wiki = charger_wiki()
    especes = []
    ordres = []
    familles = {}
    with MDD.open(newline="", encoding="utf-8") as fichier:
        for row in csv.DictReader(fichier):
            if row["order"] not in ordres:
                ordres.append(row["order"])
            famille = familles.setdefault(
                row["family"],
                {"nom": FAMILLES.get(row["family"], row["family"]), "ordre": row["order"], "n": 0},
            )
            famille["n"] += 1
            latin = row["sciName"].replace("_", " ")
            info = wiki.get(row["sciName"], {})
            francais = info.get("fr") or ""
            if francais and not SCIENTIFIQUE.match(francais):
                nom = francais
                langue = "fr"
            else:
                nom = row["mainCommonName"] if row["mainCommonName"] not in ("", "NA") else latin
                langue = "en" if nom != latin else ""
            trait = traits.get(row["sciName"])
            code, mange = regime(trait)
            fiche = {
                "id": row["id"],
                "nom": nom,
                "latin": latin,
                "ordre": row["order"],
                "famille": row["family"],
                "ou": repartition(row),
            }
            if langue:
                fiche["langue"] = langue
            if row["extinct"] == "1":
                fiche["disparue"] = 1
            if row["domestic"] == "1":
                fiche["domestique"] = 1
            statut = STATUT.get(row["iucnStatus"])
            if statut:
                fiche["statut"] = statut
            if trait:
                grammes = nombre(trait.get("adult_mass_g"))
                gestation = nombre(trait.get("gestation_length_d"))
                portee = nombre(trait.get("litter_size_n"))
                jours = nombre(trait.get("max_longevity_d"))
                if grammes:
                    fiche["masse"] = masse(grammes)
                if gestation:
                    fiche["gestation"] = duree(gestation)
                if portee:
                    fiche["portee"] = f"en moyenne {moyenne(portee)}"
                if jours:
                    annees = jours / 365.25
                    if annees >= 1:
                        fiche["longevite"] = f"record connu : environ {virgule(annees, 1)} ans"
                    else:
                        fiche["longevite"] = f"record connu : environ {round(jours)} jours"
                if code:
                    fiche["regime"] = code
                if mange:
                    fiche["mange"] = mange
                milieu = MILIEU.get(trait.get("foraging_stratum") or "")
                if milieu:
                    fiche["milieu"] = milieu
            especes.append(fiche)
    manquantes = sorted(set(familles) - set(FAMILLES))
    if manquantes:
        raise SystemExit(f"familles sans nom : {manquantes}")
    OUT.write_text(
        json.dumps({"ordres": ordres, "familles": familles, "especes": especes}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{len(especes)} espèces, {len(familles)} familles, {len(ordres)} ordres, wiki {len(wiki)}")


if __name__ == "__main__":
    main()

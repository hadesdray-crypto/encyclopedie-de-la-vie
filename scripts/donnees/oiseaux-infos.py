#!/usr/bin/env python3
"""Les chiffres et les faits des fiches d'oiseaux : longueur, envergure, poids, régime, milieu, statut UICN, œufs, durée de vie.
Tourne sur GitHub Actions (.github/workflows/oiseaux-infos.yml), qui a accès à Internet. Écrit src/data/oiseaux-infos.json.

Usage :  python scripts/donnees/oiseaux-infos.py [N]     (N = nombre d'oiseaux pour un essai ; 0 ou rien = tous)

Règle : rien n'est inventé. Une valeur n'est gardée que si une source la donne, et la source est écrite pour CHAQUE valeur.
Sources :
  - Wikidata (requêtes SPARQL regroupées par lots avec VALUES) : P2043 longueur, P2050 envergure, P2067 masse (valeurs normalisées :
    mètres et kilogrammes, que l'on convertit en cm et en g), P141 statut UICN, P1034 régime, P2974 milieu de vie, et (si la propriété
    existe avec le bon nom) durée de vie et taille de la ponte. On note aussi « l'état indiqué par » de la référence quand elle existe ;
  - GBIF : la catégorie de la Liste rouge UICN (api.gbif.org/v1/species/<clé>/iucnRedListCategory) ;
  - AVONET (Tobias et coll., 2022, Ecology Letters, figshare, licence CC BY 4.0) : poids moyen mesuré, régime principal, milieu principal, voyage
    (migrateur ou pas). Il sert aussi à VÉRIFIER les chiffres des autres sources : un poids ou une taille impossible pour l'oiseau est écarté ;
  - Wikipédia en français : quelques phrases sûres (« pond 4 à 6 œufs », « mesure 38 cm », « pèse 450 g »…) quand Wikidata n'a rien.
    Seulement des phrases où le mot-clé et le chiffre sont côte à côte ; les valeurs impossibles sont jetées.
Le fichier est sauvegardé au fur et à mesure : si le travail est coupé, on reprend où on s'était arrêté.
"""
import json
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"
RACINE = Path(__file__).resolve().parents[2]
OISEAUX = RACINE / "src/data/oiseaux.json"
SORTIE = RACINE / "src/data/oiseaux-infos.json"
WDQS = "https://query.wikidata.org/sparql"
WDAPI = "https://www.wikidata.org/w/api.php"
GBIF = "https://api.gbif.org/v1"
WIKI = "https://fr.wikipedia.org/w/api.php"
LOT = 30

UICN = {  # élément Wikidata -> (code, nom en français)
    "Q211005": ("LC", "Préoccupation mineure"), "Q719675": ("NT", "Quasi menacé"), "Q278113": ("VU", "Vulnérable"),
    "Q11394": ("EN", "En danger"), "Q219127": ("CR", "En danger critique"), "Q239509": ("EW", "Éteint à l'état sauvage"),
    "Q237350": ("EX", "Éteint"), "Q3245245": ("DD", "Données insuffisantes"),
}
UICN_GBIF = {"LC": "Préoccupation mineure", "NT": "Quasi menacé", "VU": "Vulnérable", "EN": "En danger", "CR": "En danger critique",
             "EW": "Éteint à l'état sauvage", "EX": "Éteint", "DD": "Données insuffisantes"}
# Valeurs possibles pour un oiseau : ce qui sort de là est une erreur de source, on le jette.
LIMITES = {"longueur": (4, 300), "envergure": (8, 400), "poids": (1.5, 150000), "vie": (0.3, 90), "oeufs": (1, 30)}  # cm, cm, g, années, œufs


def get(url, donnees=None, essais=5, json_out=True):
    for k in range(essais):
        try:
            req = urllib.request.Request(url, data=donnees, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=90) as res:
                brut = res.read()
                time.sleep(0.4)
                return json.loads(brut) if json_out else brut
        except Exception as exc:  # noqa: BLE001
            if k == essais - 1:
                print("  échec :", url[:100], exc)
                return None
            time.sleep(5 + k * 5 if any(c in str(exc) for c in ("429", "502", "503", "504")) else 2)


def sparql(requete):
    donnees = urllib.parse.urlencode({"query": requete, "format": "json"}).encode()
    res = get(WDQS, donnees=donnees)
    return res["results"]["bindings"] if res else []


def vide(lot):
    return " ".join(f"wd:{q}" for q in lot)


def propriete(libelle_attendu, *candidats):
    """Retrouve une propriété Wikidata par son nom anglais EXACT (sécurité : on ne se fie pas à un numéro de mémoire)."""
    for c in candidats:
        if re.fullmatch(r"P\d+", c):
            res = get(f"{WDAPI}?action=wbgetentities&ids={c}&props=labels&languages=en&format=json")
            lab = (((res or {}).get("entities", {}).get(c, {}).get("labels", {}) or {}).get("en", {}) or {}).get("value", "")
        else:
            res = get(f"{WDAPI}?action=wbsearchentities&search={urllib.parse.quote(c)}&language=en&type=property&limit=8&format=json")
            for r in (res or {}).get("search", []):
                if r.get("label", "").lower() == c.lower():
                    return r["id"]
            continue
        if lab.lower() == libelle_attendu.lower():
            return c
    return None


def arrondi(x):
    return float(f"{x:.3g}")


def fourchette(valeurs):
    """Plusieurs valeurs : le plus petit et le plus grand. Si elles sont trop éloignées (sous-espèces, erreurs), on prend la valeur du milieu."""
    v = sorted(valeurs)
    if len(v) > 1 and v[-1] / v[0] > 6:
        m = statistics.median(v)
        return arrondi(m), arrondi(m)
    return arrondi(v[0]), arrondi(v[-1])


# ---------- Wikidata ----------
def elements(latins):
    """Nom latin -> élément Wikidata (taxon de rang « espèce »)."""
    sortie = {}
    for i in range(0, len(latins), LOT):
        lot = latins[i : i + LOT]
        noms = " ".join(json.dumps(n) for n in lot)
        for b in sparql(f"SELECT ?n ?i WHERE {{ VALUES ?n {{ {noms} }} ?i wdt:P225 ?n . ?i wdt:P105 wd:Q7432 . }}"):
            sortie.setdefault(b["n"]["value"], b["i"]["value"].rsplit("/", 1)[1])
        time.sleep(1.5)
    return sortie


def quantites(prop, items):
    """Pour chaque élément : liste de (valeur normalisée, borne basse, borne haute, source)."""
    sortie = {}
    for i in range(0, len(items), LOT):
        lot = items[i : i + LOT]
        req = f"""SELECT ?i ?v ?lo ?hi ?sl ?url WHERE {{
          VALUES ?i {{ {vide(lot)} }}
          ?i p:{prop} ?st . ?st psn:{prop} ?n . ?n wikibase:quantityAmount ?v .
          OPTIONAL {{ ?n wikibase:quantityLowerBound ?lo }} OPTIONAL {{ ?n wikibase:quantityUpperBound ?hi }}
          OPTIONAL {{ ?st prov:wasDerivedFrom ?ref .
                     OPTIONAL {{ ?ref pr:P248 ?s . ?s rdfs:label ?sl FILTER(LANG(?sl) = "en") }}
                     OPTIONAL {{ ?ref pr:P854 ?url }} }}
        }}"""
        for b in sparql(req):
            q = b["i"]["value"].rsplit("/", 1)[1]
            src = b.get("sl", {}).get("value") or b.get("url", {}).get("value")
            sortie.setdefault(q, []).append((float(b["v"]["value"]), float(b["lo"]["value"]) if "lo" in b else None, float(b["hi"]["value"]) if "hi" in b else None, src))
        time.sleep(1.5)
    return sortie


def libelles(prop, items):
    """Pour chaque élément : les noms (en français, sinon anglais) des valeurs de la propriété."""
    sortie = {}
    for i in range(0, len(items), LOT):
        lot = items[i : i + LOT]
        req = f"""SELECT ?i ?v ?fr ?en WHERE {{
          VALUES ?i {{ {vide(lot)} }}
          ?i wdt:{prop} ?v .
          OPTIONAL {{ ?v rdfs:label ?fr FILTER(LANG(?fr) = "fr") }} OPTIONAL {{ ?v rdfs:label ?en FILTER(LANG(?en) = "en") }}
        }}"""
        for b in sparql(req):
            q = b["i"]["value"].rsplit("/", 1)[1]
            sortie.setdefault(q, []).append((b["v"]["value"].rsplit("/", 1)[1], b.get("fr", {}).get("value"), b.get("en", {}).get("value")))
        time.sleep(1.5)
    return sortie


# ---------- AVONET ----------
REGIME_AVONET = {"Invertivore": "insectes, vers, araignées (petits animaux sans squelette)", "Frugivore": "fruits", "Granivore": "graines",
                 "Nectarivore": "nectar des fleurs", "Herbivore terrestrial": "herbe, feuilles et bourgeons", "Herbivore aquatic": "plantes aquatiques",
                 "Aquatic predator": "poissons et autres animaux de l'eau", "Vertivore": "petits animaux à squelette (souris, oiseaux, lézards…)",
                 "Omnivore": "un peu de tout", "Scavenger": "animaux morts (charognes)"}
MILIEU_AVONET = {"Forest": "forêt", "Woodland": "bois et bocage", "Shrubland": "buissons et landes", "Grassland": "prairies", "Wetland": "zones humides",
                 "Rock": "rochers et falaises", "Desert": "désert", "Human Modified": "villes et campagne (milieux changés par les humains)",
                 "Marine": "mer", "Riverine": "rivières et fleuves", "Coastal": "côtes"}
VOYAGE_AVONET = {1: "il reste toute l'année dans la même région", 2: "certains voyagent, d'autres restent", 3: "il migre : il change de région selon les saisons"}
SRC_AVONET = "AVONET, base de mesures d'oiseaux (Tobias et coll., 2022)"


def avonet():
    """Nom latin -> {mass (g), wing (cm), regime, milieu, voyage}. Si le fichier est introuvable, on continue sans."""
    try:
        import io
        import openpyxl  # installé par le workflow
        art = get("https://api.figshare.com/v2/articles/16586228")
        fichiers = [f for f in (art or {}).get("files", []) if f["name"].lower().endswith(".xlsx")]
        if not fichiers:
            print("AVONET : fichier introuvable")
            return {}
        brut = get(fichiers[0]["download_url"], json_out=False)
        wb = openpyxl.load_workbook(io.BytesIO(brut), read_only=True, data_only=True)
        nom = next((n for n in wb.sheetnames if "birdlife" in n.lower()), wb.sheetnames[1] if len(wb.sheetnames) > 1 else wb.sheetnames[0])
        lignes = wb[nom].iter_rows(values_only=True)
        tete = [str(c or "") for c in next(lignes)]
        print("AVONET feuille", nom, "colonnes :", tete[:40])
        col = {c: i for i, c in enumerate(tete)}
        esp = col.get("Species1", 0)
        sortie = {}
        for l in lignes:
            if not l or not l[esp]:
                continue
            def val(c):
                i = col.get(c)
                return l[i] if i is not None and i < len(l) else None
            d = {}
            inf = str(val("Traits.inferred") or "")
            m = val("Mass")
            if isinstance(m, (int, float)) and m > 0 and "mass" not in inf.lower():
                d["mass"] = float(m)
            w = val("Wing.Length")
            if isinstance(w, (int, float)) and w > 0 and "wing" not in inf.lower():
                d["wing"] = float(w) / 10  # mm -> cm
            if val("Trophic.Niche") in REGIME_AVONET:
                d["regime"] = REGIME_AVONET[val("Trophic.Niche")]
            if val("Habitat") in MILIEU_AVONET:
                d["milieu"] = MILIEU_AVONET[val("Habitat")]
            mig = val("Migration")
            if isinstance(mig, (int, float)) and int(mig) in VOYAGE_AVONET:
                d["voyage"] = VOYAGE_AVONET[int(mig)]
            sortie[str(l[esp]).strip()] = d
        print("AVONET :", len(sortie), "espèces")
        return sortie
    except Exception as exc:  # noqa: BLE001
        print("AVONET indisponible :", exc)
        return {}


def ligne_avonet(av, o):
    """La ligne AVONET de l'oiseau : par son nom latin (ou ses anciens noms), sinon par un mot d'espèce unique."""
    for n in [o["latin"], *o.get("anciensLatins", [])]:
        if n in av:
            return av[n]
    fin = o["latin"].split(" ")[-1]
    trouves = [v for k, v in av.items() if k.split(" ")[-1] == fin and k.split(" ")[0] != o["latin"].split(" ")[0]]
    return trouves[0] if len(trouves) == 1 else {}


def verifier(fiche, ref, ecartes):
    """Écarte les chiffres impossibles pour cet oiseau (erreurs de source) ; complète le poids avec AVONET."""
    M = ref.get("mass")
    L, E, P = fiche.get("longueur"), fiche.get("envergure"), fiche.get("poids")
    if M:
        if P and not (M / 2.5 <= P["min"] and P["max"] <= M * 2.5):
            ecartes.append(f"poids {P['min']}-{P['max']} g (AVONET : {M:.0f} g)")
            del fiche["poids"]
        if L and not (2.5 <= L["max"] / M ** (1 / 3) and L["min"] / M ** (1 / 3) <= 11.5):
            ecartes.append(f"longueur {L['min']}-{L['max']} cm (poids moyen {M:.0f} g)")
            del fiche["longueur"]
        if E and not (3 <= E["min"] / M ** (1 / 3) and E["max"] / M ** (1 / 3) <= 32):
            ecartes.append(f"envergure {E['min']}-{E['max']} cm (poids moyen {M:.0f} g)")
            del fiche["envergure"]
        if "poids" not in fiche:
            fiche["poids"] = {"min": arrondi(M), "max": arrondi(M), "moyenne": True, "source": SRC_AVONET}
    else:
        if P and E and not (6e-5 <= P["min"] / E["max"] ** 3 and P["max"] / E["min"] ** 3 <= 4e-3):
            ecartes.append(f"poids {P['min']}-{P['max']} g (envergure {E['min']}-{E['max']} cm)")
            del fiche["poids"]
    if ref.get("wing") and "envergure" in fiche:
        r = fiche["envergure"]["min"] / ref["wing"], fiche["envergure"]["max"] / ref["wing"]
        if not (1.8 <= r[0] and r[1] <= 5.6):
            ecartes.append(f"envergure {fiche['envergure']['min']}-{fiche['envergure']['max']} cm (aile {ref['wing']:.0f} cm)")
            del fiche["envergure"]


# ---------- GBIF ----------
def gbif_uicn(latin):
    res = get(f"{GBIF}/species/match?{urllib.parse.urlencode({'name': latin, 'kingdom': 'Animalia', 'rank': 'SPECIES'})}")
    if not res or res.get("matchType") not in ("EXACT", "HIGHERRANK") or res.get("rank") != "SPECIES":
        return None, None
    cle = res.get("usageKey") or res.get("speciesKey")
    cat = get(f"{GBIF}/species/{cle}/iucnRedListCategory")
    code = (cat or {}).get("code") or (cat or {}).get("category")
    return cle, code if code in UICN_GBIF else None


# ---------- Wikipédia en français ----------
NB = r"(\d+(?:[   ]?\d{3})*(?:[,.]\d+)?)"
SEP = r"(?:\s*(?:à|et|-|–|ou)\s*" + NB + r")?"


def nombre(t):
    return float(re.sub(r"[   ]", "", t).replace(",", "."))


def phrases(texte):
    return re.split(r"(?<=[.!?])\s+(?=[A-ZÉÈÀ«])", texte)


def wikipedia(titre):
    res = get(f"{WIKI}?{urllib.parse.urlencode({'action': 'query', 'format': 'json', 'redirects': 1, 'prop': 'extracts', 'explaintext': 1, 'titles': titre})}")
    for p in ((res or {}).get("query", {}).get("pages", {})).values():
        return p.get("extract") or ""
    return ""


def sections(texte):
    """Titre de section (minuscules) -> texte."""
    morceaux = re.split(r"\n=+ ([^=\n]+?) =+\n", "\n" + texte)
    sortie = {"": morceaux[0]}
    for k in range(1, len(morceaux) - 1, 2):
        sortie[morceaux[k].strip().lower()] = morceaux[k + 1]
    return sortie


def depuis_wikipedia(texte):
    """Quelques valeurs, seulement dans des phrases claires. Retourne {clé: {min, max, ...}}."""
    s = sections(texte)
    desc = " ".join(v for k, v in s.items() if k.startswith(("description", "caractéristiques", "morphologie")) or k == "")
    repro = " ".join(v for k, v in s.items() if k.startswith(("reproduction", "nidification", "biologie", "comportement")))
    vie = " ".join(v for k, v in s.items() if k.startswith(("longévité", "biologie", "reproduction", "description")))
    out = {}
    for ph in phrases(desc):
        if "longueur" not in out:
            m = re.search(r"(?:mesure|mesurant|longueur(?: totale| du corps)?(?: de| d'environ| moyenne de)?|long de)\s+(?:entre\s+|environ\s+|de\s+)?" + NB + SEP + r"\s*(cm|mm|m)\b", ph)
            if m and not re.search(r"\b(bec|queue|aile|tarse|œuf|oeuf|poussin|jeune|juvénile)\b", ph[: m.start()].lower()[-60:]) \
                    and not re.search(r"^\W{0,12}(?:d'envergure|d'aile|de bec|de queue|de tarse|pour (?:le|la) (?:bec|queue))", ph[m.end():].lower()):
                u = {"cm": 1, "mm": 0.1, "m": 100}[m.group(3)]
                a = nombre(m.group(1)) * u
                b = nombre(m.group(2)) * u if m.group(2) else a
                if min(a, b) >= 5:
                    out["longueur"] = {"min": arrondi(min(a, b)), "max": arrondi(max(a, b)), "phrase": ph.strip()[:220]}
        if "envergure" not in out:
            m = re.search(r"envergure[^.\d]{0,45}" + NB + SEP + r"\s*(cm|m)\b", ph)
            if m:
                u = {"cm": 1, "m": 100}[m.group(3)]
                a = nombre(m.group(1)) * u
                b = nombre(m.group(2)) * u if m.group(2) else a
                out["envergure"] = {"min": arrondi(min(a, b)), "max": arrondi(max(a, b)), "phrase": ph.strip()[:220]}
        if "poids" not in out:
            m = re.search(r"(?:pèse|pesant|poids|masse)[^.\d]{0,40}" + NB + SEP + r"\s*(kg|g)\b", ph)
            if m and not re.search(r"\b(œuf|oeuf|poussin|jeune)\b", ph.lower()):
                u = {"kg": 1000, "g": 1}[m.group(3)]
                a = nombre(m.group(1)) * u
                b = nombre(m.group(2)) * u if m.group(2) else a
                out["poids"] = {"min": arrondi(min(a, b)), "max": arrondi(max(a, b)), "phrase": ph.strip()[:220]}
    for ph in phrases(repro or desc):
        if "oeufs" not in out and re.search(r"\b(pond|ponte|couvée|couvées|nichée)\b", ph):
            m = re.search(NB + SEP + r"\s*(?:œufs|oeufs)", ph)
            if m and 1 <= nombre(m.group(1)) <= 30:
                a = nombre(m.group(1))
                b = nombre(m.group(2)) if m.group(2) else a
                out["oeufs"] = {"min": int(min(a, b)), "max": int(max(a, b)), "phrase": ph.strip()[:220]}
    for ph in phrases(vie):
        if "vie" not in out and re.search(r"(espérance de vie|longévité|durée de vie|âge maximal|vit jusqu)", ph, re.I):
            m = re.search(r"(?:jusqu'à|environ|de|maximale? de|record de)?\s*" + NB + SEP + r"\s*ans", ph)
            if m and 1 <= nombre(m.group(1)) <= 90:
                a = nombre(m.group(1))
                b = nombre(m.group(2)) if m.group(2) else a
                out["vie"] = {"min": min(a, b), "max": max(a, b), "phrase": ph.strip()[:220], "captivite": "captivité" in ph.lower()}
    # Le mâle et la femelle se ressemblent-ils ? Seulement si TOUTES les phrases claires de l'article disent la même chose.
    verdicts = []
    for ph in phrases(" ".join(s.values())):
        bas = ph.lower()
        if re.search(r"\b(juvéniles?|immatures?|jeunes)\b|sous-espèce", bas) or re.search(r"\b[A-Z]\. [a-z]\. [a-z]+", ph):
            continue  # phrases sur les jeunes ou sur une sous-espèce : on ne s'en sert pas
        if re.search(r"(pas de dimorphisme|sans dimorphisme|dimorphisme (?:sexuel )?(?:(?:est|très|quasi) )*(?:absent|nul|inexistant|faible|peu marqué)|mâles? et (?:les |la )?femelles? (?:se ressemblent|sont (?:très |quasi )?(?:semblables|similaires|identiques)))", bas):
            verdicts.append(("non", ph.strip()[:200]))
        elif re.search(r"(dimorphisme sexuel (?:(?:est|très|bien|fortement|nettement|assez) )*(?:marqué|prononcé|net|important|visible|présent)|mâles? et femelles? (?:diffèrent|sont différents|ne se ressemblent pas))", bas):
            verdicts.append(("oui", ph.strip()[:200]))
    if verdicts and len({v for v, _ in verdicts}) == 1:
        out["dimorphisme"] = {"valeur": verdicts[0][0], "phrase": verdicts[0][1]}
    for cle, (lo, hi) in LIMITES.items():
        if cle in out and not (lo <= out[cle]["min"] and out[cle]["max"] <= hi):
            del out[cle]
    return out


def enregistrer(infos):
    SORTIE.write_text(json.dumps(infos, ensure_ascii=False, indent=1), encoding="utf-8")


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    oiseaux = json.loads(OISEAUX.read_text(encoding="utf-8"))["oiseaux"]
    if n:
        oiseaux = oiseaux[:n]
    infos = json.loads(SORTIE.read_text(encoding="utf-8")) if SORTIE.exists() else {}
    infos.setdefault("_proprietes", {})
    t0 = time.time()

    # 1. Les propriétés Wikidata (vérifiées par leur nom anglais)
    P = infos["_proprietes"]
    for cle, nom, cands in [("longueur", "length", ["P2043"]), ("envergure", "wingspan", ["P2050"]), ("poids", "mass", ["P2067"]),
                            ("uicn", "IUCN conservation status", ["P141"]), ("regime", "main food source", ["P1034"]), ("milieu", "habitat", ["P2974"]),
                            ("vie", "life expectancy", ["P2250", "life expectancy"]), ("oeufs", "clutch size", ["clutch size"])]:
        if cle not in P:
            P[cle] = propriete(nom, *cands)
            print("propriété", cle, "->", P[cle])
    enregistrer(infos)

    # 2. Les éléments Wikidata
    latins = sorted({o["latin"] for o in oiseaux} | {l for o in oiseaux for l in o.get("anciensLatins", [])})
    try:
        q_de = elements(latins)
    except Exception as exc:  # noqa: BLE001
        print("erreur éléments", exc)
        q_de = {}
    print(f"{len(q_de)} éléments Wikidata trouvés sur {len(latins)} noms latins")
    par_oiseau = {}
    for o in oiseaux:
        q = q_de.get(o["latin"]) or next((q_de[l] for l in o.get("anciensLatins", []) if l in q_de), None)
        par_oiseau[o["id"]] = q
    items = sorted({q for q in par_oiseau.values() if q})

    # 3. Les valeurs, propriété par propriété, par lots
    quant = {}
    for cle in ("longueur", "envergure", "poids", "vie", "oeufs"):
        if P.get(cle) and time.time() - t0 < 1500:
            try:
                quant[cle] = quantites(P[cle], items)
                print(cle, ":", len(quant[cle]), "éléments")
            except Exception as exc:  # noqa: BLE001
                print("erreur", cle, exc)
    lib = {}
    for cle in ("uicn", "regime", "milieu"):
        if P.get(cle):
            try:
                lib[cle] = libelles(P[cle], items)
                print(cle, ":", len(lib[cle]), "éléments")
            except Exception as exc:  # noqa: BLE001
                print("erreur", cle, exc)

    av = avonet()
    facteur = {"longueur": 100, "envergure": 100, "poids": 1000, "vie": 1 / 31556952, "oeufs": 1}  # m -> cm, m -> cm, kg -> g, secondes -> années
    for k, o in enumerate(oiseaux):
        if time.time() - t0 > 2200:
            print("temps presque écoulé : on s'arrête, la prochaine fois on reprend")
            break
        if o["id"] in infos and infos[o["id"]].get("fini") == 3:
            continue
        try:
            infos[o["id"]] = un_oiseau(o, par_oiseau, quant, lib, facteur, av)
        except Exception as exc:  # noqa: BLE001
            print("erreur", o["id"], exc)
        if k % 10 == 0:
            enregistrer(infos)
            fi = infos.get(o["id"], {})
            print(f"[{k + 1}/{len(oiseaux)}] {o['nom']} : {', '.join(c for c in fi if c not in ('wikidata', 'gbif', 'fini')) or 'rien'}")
    enregistrer(infos)
    print("fini :", sum(1 for v in infos.values() if isinstance(v, dict) and v.get("fini") == 3), "oiseaux")


def un_oiseau(o, par_oiseau, quant, lib, facteur, av):
    if True:  # (un seul bloc)
        q = par_oiseau.get(o["id"])
        fiche = {"wikidata": q} if q else {}
        # Wikidata
        for cle in ("longueur", "envergure", "poids", "vie", "oeufs"):
            lignes = quant.get(cle, {}).get(q, []) if q else []
            vals = []
            sources = []
            for v, lo, hi, src in lignes:
                f = facteur[cle]
                vals += [x * f for x in (lo, hi, v) if x is not None] if (lo is not None and hi is not None and lo != hi) else [v * f]
                if src:
                    sources.append(src)
            if vals:
                a, b = fourchette(vals)
                if cle in LIMITES and not (LIMITES[cle][0] <= a and b <= LIMITES[cle][1]):
                    continue
                fiche[cle] = {"min": a, "max": b, "source": "Wikidata" + (f" (d'après : {', '.join(sorted(set(sources))[:3])})" if sources else "")}
        for cle, table in (("regime", lib.get("regime", {})), ("milieu", lib.get("milieu", {}))):
            noms = sorted({fr or en for _, fr, en in table.get(q, []) if fr or en}) if q else []
            if noms:
                fiche[cle] = {"valeurs": noms[:8], "source": "Wikidata"}
        # Statut UICN : Wikidata, puis GBIF (qui vient directement de la Liste rouge)
        wd = next((UICN[v] for v, _, _ in lib.get("uicn", {}).get(q, []) if v in UICN), None) if q else None
        cle_gbif, code_gbif = gbif_uicn(o["latin"])
        if code_gbif:
            fiche["uicn"] = {"code": code_gbif, "nom": UICN_GBIF[code_gbif], "source": "Liste rouge de l'UICN, par GBIF" + (" et Wikidata" if wd and wd[0] == code_gbif else "")}
        elif wd:
            fiche["uicn"] = {"code": wd[0], "nom": wd[1], "source": "Wikidata"}
        if cle_gbif:
            fiche["gbif"] = cle_gbif
        # Wikipédia : seulement ce qui manque
        titre = urllib.parse.unquote(o["wiki"].rsplit("/", 1)[-1]).replace("_", " ") if o.get("wiki") else None
        if titre:
            wp = depuis_wikipedia(wikipedia(titre))
            for cle, v in wp.items():
                if cle in fiche:
                    continue
                if cle == "dimorphisme":
                    fiche[cle] = {"valeur": v["valeur"], "source": f"Wikipédia en français (article « {titre} »)"}
                    continue
                fiche[cle] = {"min": v["min"], "max": v["max"], "source": f"Wikipédia en français (article « {titre} »)"}
                if v.get("captivite"):
                    fiche[cle]["captivite"] = True
        # AVONET : vérifie les chiffres, complète le poids, le régime, le milieu et le voyage
        ref = ligne_avonet(av, o)
        ecartes = []
        verifier(fiche, ref, ecartes)
        for cle in ("regime", "milieu"):
            if ref.get(cle):
                fiche[cle] = {"valeurs": [ref[cle]], "source": SRC_AVONET}  # AVONET : propre, en français, même mot pour tous les oiseaux
            elif cle in fiche:
                # Wikidata seul : on enlève les mots qui ne sont pas du français courant (noms savants, pays, anglais)
                bons = [v for v in fiche[cle]["valeurs"] if v[:1].islower() and not re.search(r"(idae|inae|oidea|ina|ptera)$| kl\.| sp\.|\b(beetle|fish|lagoons?)\b", v, re.I)]
                if bons:
                    fiche[cle]["valeurs"] = bons
                else:
                    del fiche[cle]
        if ref.get("voyage"):
            fiche["voyage"] = {"texte": ref["voyage"], "source": SRC_AVONET}
        if ecartes:
            print("  écarté pour", o["nom"], ":", "; ".join(ecartes))
        fiche["fini"] = 3
        return fiche


if __name__ == "__main__":
    main()

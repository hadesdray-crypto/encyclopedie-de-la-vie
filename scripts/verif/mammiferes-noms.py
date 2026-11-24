# Vérifie les noms français des mammifères auprès de plusieurs sources indépendantes.
# Sources : Wikidata (nom officiel P1843), Wikipédia en français (titre de l'article),
# GBIF (noms usuels en français), TAXREF du Muséum (INPN), iNaturalist (noms français).
# Sortie : scripts/verif/mammiferes-resultats.json  { nom latin : { source : [noms] } }
import json, os, sys, time, unicodedata, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

H = {"User-Agent": "encyclopedie-de-la-vie/1.0 (verification des noms)", "Accept": "application/json"}
SORTIE = "scripts/verif/mammiferes-resultats.json"
DEBUT = time.time()
BUDGET = 46 * 60  # secondes ; le workflow coupe à 50 minutes


def get(u, t=15, donnees=None, entetes=None):
    for k in range(2):
        try:
            h = dict(H)
            if entetes:
                h.update(entetes)
            return urllib.request.urlopen(urllib.request.Request(u, data=donnees, headers=h), timeout=t).read()
        except Exception:
            time.sleep(1)
    return b""


def enregistrer(res):
    json.dump(res, open(SORTIE, "w"), ensure_ascii=False, indent=1)


especes = json.load(open("src/data/mammiferes.json"))["especes"]
latins = sorted({e["latin"] for e in especes if e.get("latin")})
res = json.load(open(SORTIE)) if os.path.exists(SORTIE) else {}
for l in latins:
    res.setdefault(l, {})


def reste():
    return time.time() - DEBUT < BUDGET


# 1) Wikidata + Wikipédia français, par lots de 150 noms latins (requêtes SPARQL regroupées)
def sparql(lot):
    valeurs = " ".join('"%s"' % l.replace('"', "") for l in lot)
    q = (
        "SELECT ?l ?v ?t WHERE { VALUES ?l { %s } ?i wdt:P225 ?l; wdt:P105 wd:Q7432 . "
        'OPTIONAL { ?i wdt:P1843 ?v . FILTER(LANG(?v)="fr") } '
        'OPTIONAL { ?a schema:about ?i; schema:isPartOf <https://fr.wikipedia.org/>; schema:name ?t } }' % valeurs
    )
    j = get("https://query.wikidata.org/sparql", 60, ("format=json&query=" + urllib.parse.quote(q)).encode(),
            {"Content-Type": "application/x-www-form-urlencoded"})
    try:
        b = json.loads(j)["results"]["bindings"]
    except Exception:
        return None
    out = {l: {"wikidata": set(), "wikipedia": set()} for l in lot}
    for x in b:
        l = x["l"]["value"]
        if l not in out:
            continue
        if "v" in x:
            out[l]["wikidata"].add(x["v"]["value"])
        if "t" in x:
            out[l]["wikipedia"].add(x["t"]["value"])
    return out


a_faire = [l for l in latins if "wikidata" not in res[l]]
for i in range(0, len(a_faire), 150):
    if not reste():
        break
    lot = a_faire[i:i + 150]
    out = sparql(lot)
    if out is None:  # lot refusé : deux moitiés
        out = {}
        for moitie in (lot[:75], lot[75:]):
            out.update(sparql(moitie) or {})
    for l, v in out.items():
        res[l]["wikidata"] = sorted(v["wikidata"])
        res[l]["wikipedia"] = sorted(t for t in v["wikipedia"] if t != l)
    enregistrer(res)
    time.sleep(1)
print("wikidata fini", round(time.time() - DEBUT), "s", flush=True)


# 2) GBIF et TAXREF : une requête par nom, en parallèle
def gbif(l):
    try:
        k = json.loads(get("https://api.gbif.org/v1/species/match?class=Mammalia&name=" + urllib.parse.quote(l)))["usageKey"]
        v = json.loads(get(f"https://api.gbif.org/v1/species/{k}/vernacularNames?limit=200"))["results"]
        return sorted({x["vernacularName"] for x in v if x.get("language") == "fra"})[:8]
    except Exception:
        return []


def taxref(l):
    try:
        j = json.loads(get("https://taxref.mnhn.fr/api/taxa/search?scientificNames=" + urllib.parse.quote(l) + "&page=1&size=5"))
        return sorted({x["frenchVernacularName"] for x in j["_embedded"]["taxa"] if x.get("frenchVernacularName")})[:4]
    except Exception:
        return []


def par_nom(cle, fonction, fils):
    todo = [l for l in latins if cle not in res[l]]
    for i in range(0, len(todo), 200):
        if not reste():
            return
        lot = todo[i:i + 200]
        with ThreadPoolExecutor(fils) as ex:
            for l, r in zip(lot, ex.map(fonction, lot)):
                res[l][cle] = r
        enregistrer(res)


par_nom("gbif", gbif, 8)
print("gbif fini", round(time.time() - DEBUT), "s", flush=True)
par_nom("taxref", taxref, 6)  # s'il ne répond pas, les listes restent vides et on continue
print("taxref fini", round(time.time() - DEBUT), "s", flush=True)


# 3) iNaturalist (noms français) : seulement pour les noms où moins de 3 sources s'accordent
def sans_accent(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn").replace("’", "'").replace("-", " ").strip()


def inat(l):
    time.sleep(0.8)
    try:
        j = json.loads(get("https://api.inaturalist.org/v1/taxa?rank=species&locale=fr&q=" + urllib.parse.quote(l)))["results"]
        return sorted({x["preferred_common_name"] for x in j if x.get("name") == l and x.get("preferred_common_name")})[:3]
    except Exception:
        return []


def nb_accord(r):
    c = {}
    for src in ("wikidata", "wikipedia", "gbif", "taxref"):
        for n in {sans_accent(x) for x in r.get(src, [])}:
            c[n] = c.get(n, 0) + 1
    return max(c.values()) if c else 0


todo = [l for l in latins if "inaturalist" not in res[l] and 1 <= nb_accord(res[l]) < 3]
for i in range(0, len(todo), 100):
    if not reste():
        break
    lot = todo[i:i + 100]
    with ThreadPoolExecutor(2) as ex:
        for l, r in zip(lot, ex.map(inat, lot)):
            res[l]["inaturalist"] = r
    enregistrer(res)
enregistrer(res)
print("terminé", round(time.time() - DEBUT), "s", flush=True)

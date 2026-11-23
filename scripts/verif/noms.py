# Vérifie les noms français des oiseaux auprès de plusieurs sources indépendantes.
import json, re, subprocess, time, urllib.parse, urllib.request
H = {"User-Agent": "encyclopedie-de-la-vie/1.0 (verification des noms)"}
def get(u, t=60):
    for k in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read()
        except Exception as e:
            err = e; time.sleep(2)
    return b""
latins = [l.strip() for l in open("scripts/verif/latins.txt") if l.strip()]
res = {l: {} for l in latins}
# 1) CAF : liste officielle des oiseaux de France 2020 (texte du PDF)
open("caf.pdf", "wb").write(get("https://storage.googleapis.com/chn-main-storage/publications/CAF_LOF_2020_version_corrigee.pdf", 120))
subprocess.run(["pdftotext", "-layout", "caf.pdf", "caf.txt"])
caf = open("caf.txt", errors="ignore").read() if __import__("os").path.exists("caf.txt") else ""
open("scripts/verif/caf.txt", "w").write(caf)
# 2) TAXREF (Muséum national d'Histoire naturelle)
for l in latins:
    j = get("https://taxref.mnhn.fr/api/taxa/search?scientificNames=" + urllib.parse.quote(l) + "&page=1&size=5")
    try:
        t = [x.get("frenchVernacularName") for x in json.loads(j)["_embedded"]["taxa"] if x.get("frenchVernacularName")]
    except Exception:
        t = []
    res[l]["taxref"] = t[:2]
# 3) Wikidata : nom vernaculaire officiel (P1843, français) et titre Wikipédia
for l in latins:
    q = 'SELECT ?v ?t WHERE { ?i wdt:P225 "%s"; wdt:P105 wd:Q7432 . OPTIONAL { ?i p:P1843 ?s . ?s ps:P1843 ?v . FILTER(LANG(?v)="fr") } OPTIONAL { ?a schema:about ?i; schema:isPartOf <https://fr.wikipedia.org/>; schema:name ?t } }' % l
    j = get("https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q))
    try:
        b = json.loads(j)["results"]["bindings"]
        res[l]["wikidata"] = sorted({x["v"]["value"] for x in b if "v" in x})
        res[l]["wikipedia"] = sorted({x["t"]["value"] for x in b if "t" in x})
    except Exception:
        res[l]["wikidata"] = []; res[l]["wikipedia"] = []
    time.sleep(0.3)
# 4) GBIF : noms vernaculaires en français
for l in latins:
    try:
        k = json.loads(get("https://api.gbif.org/v1/species/match?class=Aves&name=" + urllib.parse.quote(l)))["usageKey"]
        v = json.loads(get(f"https://api.gbif.org/v1/species/{k}/vernacularNames?limit=200"))["results"]
        res[l]["gbif"] = sorted({x["vernacularName"] for x in v if x.get("language") == "fra"})[:6]
    except Exception:
        res[l]["gbif"] = []
json.dump(res, open("scripts/verif/resultats.json", "w"), ensure_ascii=False, indent=1)

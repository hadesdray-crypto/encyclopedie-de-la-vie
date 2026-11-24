# Essais d'accès aux sources (affichés dans le journal du workflow).
import json, re, time, urllib.parse, urllib.request
def essai(nom, u, entetes=None, donnees=None, t=20, n=900, motif=None):
    d = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, data=donnees, headers=entetes or {"User-Agent": "encyclopedie-de-la-vie/1.0"}), timeout=t)
        c = r.read().decode("utf8", "replace")
        if motif:
            c = "\n".join(re.findall(motif, c))
        print("==", nom, r.status, round(time.time() - d, 1), "s", len(c), "car.\n", c[:n], flush=True)
        return c
    except Exception as e:
        print("==", nom, "ERREUR", repr(e)[:300], round(time.time() - d, 1), "s", flush=True)
UA = {"User-Agent": "encyclopedie-de-la-vie/1.0 (verification des noms)"}
essai("wikispecies lion", "https://species.wikimedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&titles=Panthera%20leo|Ornithorhynchus%20anatinus", UA, motif=r"[^\n]{0,40}(?:\{\{VN|[Ff]ran[cç]ais|fr=)[^\n]{0,200}")
c = essai("col recherche", "https://api.checklistbank.org/dataset/3LR/nameusage/search?q=Panthera%20leo&limit=1", UA, n=100)
try:
    uid = json.loads(c)["result"][0]["id"]
    essai("col vernaculaire", f"https://api.checklistbank.org/dataset/3LR/taxon/{uid}/vernacular", UA, n=600)
except Exception as e:
    print("col id", repr(e))
essai("itis", "https://www.itis.gov/ITISWebService/jsonservice/searchByScientificName?srchKey=Panthera%20leo", UA, n=300)
essai("gbif fra", "https://api.gbif.org/v1/species/5219404/vernacularNames?limit=3", UA, n=300)

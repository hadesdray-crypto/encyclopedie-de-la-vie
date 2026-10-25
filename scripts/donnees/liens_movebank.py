"""Pour chaque étude des grands voyageurs : le lien gratuit vers sa page sur le Movebank Data Repository.
Lit src/data/voyageurs.json, cherche chaque titre d'étude dans le dépôt, écrit src/data/voyageurs-liens.json
({titre: {"page": url, "doi": url ou ""}}). Rien n'est deviné : seulement les titres retrouvés exactement."""
import json, time, urllib.request
from pathlib import Path
API = "https://datarepository.movebank.org/server/api"
DATA = Path(__file__).resolve().parents[2] / "src" / "data"

def get(url):
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "encyclopedie-de-la-vie (app educative)"}), timeout=60) as r:
                return json.load(r)
        except Exception as e:
            print("  échec", str(e)[:100]); time.sleep(3 + 3 * k)
    return None

voulus = {v["etude"] for v in json.loads((DATA / "voyageurs.json").read_text())}
print(len(voulus), "études à relier")
liens, page = {}, 0
while True:
    r = get(f"{API}/discover/search/objects?dsoType=ITEM&size=100&page={page}")
    objs = (((r or {}).get("_embedded") or {}).get("searchResult") or {}).get("_embedded", {}).get("objects", [])
    if not objs: break
    for o in objs:
        it = o.get("_embedded", {}).get("indexableObject", {})
        md = it.get("metadata", {})
        titre = (md.get("dc.title") or [{}])[0].get("value", "")[:160]
        if titre not in voulus or titre in liens: continue
        ids = [x.get("value", "") for x in md.get("dc.identifier.uri", []) + md.get("dc.identifier.doi", []) + md.get("dc.identifier", [])]
        doi = next((i if i.startswith("http") else "https://doi.org/" + i.split("doi:")[-1].strip() for i in ids if "10.5441/" in i or "doi.org" in i), "")
        liens[titre] = {"page": f"https://datarepository.movebank.org/items/{it['uuid']}", "doi": doi}
    print("page", page, ":", len(liens), "études reliées")
    page += 1
    time.sleep(0.5)
(DATA / "voyageurs-liens.json").write_text(json.dumps(liens, ensure_ascii=False, indent=0))
print("FIN :", len(liens), "sur", len(voulus))

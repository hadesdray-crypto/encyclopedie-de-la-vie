"""À quel point chaque animal est connu : le nombre de visites de sa page Wikipédia en français
pendant les 12 derniers mois complets (API publique de Wikimedia, données réelles).
Écrit src/data/notoriete.json : {id d'espèce: visites} et {"latin:<nom latin>": visites} pour les voyageurs."""
import json, time, urllib.parse, urllib.request
from datetime import date
from pathlib import Path
DATA = Path(__file__).resolve().parents[2] / "src" / "data"
UA = {"User-Agent": "encyclopedie-de-la-vie/1.0 (application educative familiale; github.com/hadesdray-crypto/encyclopedie-de-la-vie)"}

def get(url):
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(2 + 4 * k)
        except Exception:
            time.sleep(2 + 4 * k)
    return None

aujourdhui = date.today()
fin = date(aujourdhui.year, aujourdhui.month, 1)
debut = date(fin.year - 1, fin.month, 1)
A, B = debut.strftime("%Y%m%d00"), fin.strftime("%Y%m%d00")
print("période", A, "→", B)

def resoudre(titres):
    """Titre réel de la page (en suivant les redirections), 50 par 50."""
    out = {}
    for i in range(0, len(titres), 50):
        lot = titres[i:i + 50]
        r = get("https://fr.wikipedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "titles": "|".join(lot), "redirects": 1, "format": "json"})) or {}
        q = r.get("query", {})
        norm = {x["from"]: x["to"] for x in q.get("normalized", [])}
        redir = {x["from"]: x["to"] for x in q.get("redirects", [])}
        existe = {p["title"] for p in q.get("pages", {}).values() if "missing" not in p}
        for t in lot:
            n = norm.get(t, t); n = redir.get(n, n)
            if n in existe: out[t] = n
        time.sleep(0.2)
    return out

def vues(titre):
    t = urllib.parse.quote(titre.replace(" ", "_"), safe="")
    r = get(f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia/all-access/user/{t}/monthly/{A}/{B}")
    return sum(x.get("views", 0) for x in (r or {}).get("items", [])) if r else 0

articles = json.loads((DATA / "articles-fr.json").read_text())
voy = json.loads((DATA / "voyageurs.json").read_text())
noms_voy = {v["latin"]: (v.get("nom") or v["latin"]) for v in voy}
reels = resoudre(sorted(set(articles.values()) | set(noms_voy.values()) | set(noms_voy.keys())))
print(len(reels), "pages trouvées")
cache, res = {}, {}
def v_de(t):
    r = reels.get(t)
    if not r: return 0
    if r not in cache:
        cache[r] = vues(r); time.sleep(0.05)
    return cache[r]
for k, (i, t) in enumerate(articles.items()):
    res[i] = v_de(t)
    if k % 300 == 0: print(k, "/", len(articles))
for latin, nom in noms_voy.items():
    res["latin:" + latin] = max(v_de(nom), v_de(latin))
(DATA / "notoriete.json").write_text(json.dumps(res, separators=(",", ":")))
top = sorted(((v, i) for i, v in res.items() if not i.startswith("latin:")), reverse=True)[:15]
print("les plus vues :", [(articles[i], v) for v, i in top])
print("FIN :", sum(1 for v in res.values() if v), "animaux avec des visites")

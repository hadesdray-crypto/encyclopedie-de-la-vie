#!/usr/bin/env python3
"""Grands voyageurs, deuxième source : Dryad (données publiées avec des articles scientifiques, licence CC0).
Règles (les mêmes que pour Movebank) :
- seulement des suivis GPS (on écarte tout jeu qui parle de géolocalisateurs à la lumière, GLS ou Argos) ;
- l'espèce doit être reconnue sans doute (colonne d'espèce, ou un seul nom latin dans le titre, confirmé par GBIF) ;
- vrai premier et vrai dernier point, distance sur tous les points, points impossibles écartés ;
- sinon : on n'invente rien, on écarte le jeu.
Sortie : src/data/voyageurs-dryad.json et scripts/donnees/dryad-journal.txt"""
import csv, io, json, math, re, sys, time, traceback, urllib.parse, urllib.request, zipfile
from datetime import datetime
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
csv.field_size_limit(sys.maxsize)
import voyageurs as V  # mêmes outils : noms, groupes, distance, GBIF

R = Path(__file__).resolve().parents[2]
API = "https://datadryad.org"
UA = {"User-Agent": "EncyclopedieLeonie/1.0 (application educative)", "Accept": "application/json"}
EXCLUS = re.compile(r"geolocat|light[- ]level|\bGLS\b|argos|acoustic telemetry|radio[- ]telemetry|VHF", re.I)
MAX_OCTETS = 300_000_000
COL = {
    "lat": re.compile(r"^(location[-_. ]?lat|lat|latitude|y|gps[-_. ]?lat(itude)?)$", re.I),
    "lon": re.compile(r"^(location[-_. ]?long?|lon|long|longitude|x|lng|gps[-_. ]?lon(gitude)?)$", re.I),
    "t": re.compile(r"^(timestamp|date[-_. ]?time|datetime|time[-_. ]?stamp|t|date_time|gmt|utc|acquisition time)$", re.I),
    "id": re.compile(r"^(individual[-_. ]?local[-_. ]?identifier|individual|id|animal[-_. ]?id|animal|tag[-_. ]?id|tag[-_. ]?local[-_. ]?identifier|bird[-_. ]?id|ind|name)$", re.I),
    "esp": re.compile(r"^(individual[-_. ]?taxon[-_. ]?canonical[-_. ]?name|species|taxon|scientific[-_. ]?name)$", re.I),
}
def j(m): print(m, flush=True)

def get(url, binaire=False):
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                d = r.read()
                return d if binaire else json.loads(d)
        except Exception as e:
            if k == 2: j(f"  échec {url[:100]} : {e}"); return None
            time.sleep(3 + 3 * k)

def date(t):
    for f in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M:%S", "%m/%d/%Y %H:%M:%S", "%Y/%m/%d %H:%M:%S"):
        try: return datetime.strptime(t.strip()[:19].rstrip("Z"), f)
        except Exception: pass
    return None

def lire(flux, espece_titre):
    rd = csv.reader(flux)
    tete = next(rd, None)
    if not tete: return None
    idx = {}
    for i, c in enumerate(tete):
        for k, rx in COL.items():
            if k not in idx and rx.match(c.strip().strip('"')): idx[k] = i
    if "lat" not in idx or "lon" not in idx or "t" not in idx: return None
    if "esp" not in idx and not espece_titre: return None
    par, lu = {}, 0
    for ligne in rd:
        lu += sum(len(x) for x in ligne)
        if lu > MAX_OCTETS: return None  # trop gros : on préfère écarter que deviner la fin
        try:
            lat, lon = float(ligne[idx["lat"]]), float(ligne[idx["lon"]])
        except (ValueError, IndexError): continue
        if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0): continue
        t = date(ligne[idx["t"]])
        if not t: continue
        ind = ligne[idx["id"]] if "id" in idx else "Animal"
        esp = " ".join((ligne[idx["esp"]] if "esp" in idx else espece_titre).split()[:2])
        a = par.setdefault(ind, {"esp": esp, "pts": [], "pas": 1, "n": 0, "km": 0.0, "premier": None, "dernier": None})
        if a["dernier"]:
            d = V.dist(a["dernier"], (lat, lon)); h = (t - a["dernier"][2]).total_seconds() / 3600
            if h < 0: return None  # pas rangé dans l'ordre du temps : on ne devine pas
            if (h > 0 and d / h > 150) or (h == 0 and d > 1): continue
            if d < 0.03: a["dernier"][2] = t; continue
            a["km"] += d
        else: a["premier"] = [lat, lon, t]
        a["dernier"] = [lat, lon, t]; a["n"] += 1
        if (a["n"] - 1) % a["pas"]: continue
        a["pts"].append([lat, lon])
        if len(a["pts"]) > 2000: a["pts"], a["pas"] = a["pts"][::2], a["pas"] * 2
    return par

def main():
    sortie, page, vus = [], 1, set()
    for q in ("GPS tracking", "GPS telemetry movement", "GPS collar", "GPS tracks migration"):
        page = 1
        while page <= 20:
            r = get(f"{API}/api/v2/search?" + urllib.parse.urlencode({"q": q, "per_page": 50, "page": page}))
            ds = ((r or {}).get("_embedded") or {}).get("stash:datasets", [])
            if not ds: break
            for d in ds:
                doi = d.get("identifier", "")
                if doi in vus: continue
                vus.add(doi)
                titre, resume = d.get("title", ""), re.sub("<[^>]+>", " ", d.get("abstract", "") or "")
                lic = d.get("license", "")
                if "zero" not in lic.lower() and "cc0" not in lic.lower(): continue
                if "GPS" not in titre + resume or EXCLUS.search(titre + " " + resume): continue
                # Un seul nom latin dans le titre, confirmé par GBIF (sinon il faudra une colonne d'espèce).
                noms = {m for m in re.findall(r"\b([A-Z][a-z]+ [a-z]{3,})\b", titre + " " + " ".join(d.get("keywords", []) or [])) if V.taxon(m)[0].get("rank") == "SPECIES" and V.taxon(m)[0].get("matchType") == "EXACT"}
                espece_titre = next(iter(noms)) if len(noms) == 1 else ""
                vlink = (d.get("_links") or {}).get("stash:version", {}).get("href")
                if not vlink: continue
                fs = get(f"{API}{vlink}/files") or {}
                fichiers = [f for f in ((fs.get("_embedded") or {}).get("stash:files", [])) if re.search(r"\.(csv|txt|zip)$", f.get("path", ""), re.I) and f.get("size", 0) < MAX_OCTETS]
                n = 0
                for f in sorted(fichiers, key=lambda f: f.get("size", 0))[:3]:
                    lien = (f.get("_links") or {}).get("stash:download") or (f.get("_links") or {}).get("stash:file-download")
                    if not lien: continue  # fichier non téléchargeable
                    url = API + lien["href"]
                    brut = get(url, binaire=True)
                    if not brut: continue
                    try:
                        flux = []
                        if f["path"].lower().endswith(".zip"):
                            z = zipfile.ZipFile(io.BytesIO(brut))
                            flux = [io.TextIOWrapper(z.open(x), encoding="utf-8", errors="replace") for x in z.namelist() if x.lower().endswith(".csv")][:3]
                        else: flux = [io.StringIO(brut.decode("utf-8", "replace"))]
                        for fl in flux:
                            par = lire(fl, espece_titre)
                            if not par: continue
                            for ind, a in sorted(par.items(), key=lambda x: -x[1]["km"])[:4]:
                                if a["n"] < 20: continue
                                m, nom_gbif = V.taxon(a["esp"])
                                if m.get("rank") != "SPECIES": continue
                                e = V.PAR_LATIN.get(a["esp"])
                                pas = max(1, len(a["pts"]) // V.MAX_POINTS)
                                pts = [[round(p[0], 4), round(p[1], 4)] for p in a["pts"][::pas]]
                                pts[0] = [round(a["premier"][0], 4), round(a["premier"][1], 4)]
                                fin = [round(a["dernier"][0], 4), round(a["dernier"][1], 4)]
                                if pts[-1] != fin: pts.append(fin)
                                sortie.append({"latin": a["esp"], "nom": V.nom_app(e) if e else nom_gbif, "fiche": e["id"] if e else None, "groupe": V.groupe(a["esp"], m),
                                               "classe": m.get("class"), "individu": str(ind)[:40], "etude": titre[:160], "doi": f"https://doi.org/{doi.replace('doi:', '')}", "licence": "CC0",
                                               "depart": {"lat": round(a["premier"][0], 5), "lon": round(a["premier"][1], 5), "date": a["premier"][2].strftime("%Y-%m-%d %H:%M")},
                                               "arrivee": {"lat": round(a["dernier"][0], 5), "lon": round(a["dernier"][1], 5), "date": a["dernier"][2].strftime("%Y-%m-%d %H:%M")},
                                               "complet": True, "nbPoints": a["n"], "km": round(a["km"]), "debut": a["premier"][2].strftime("%Y-%m-%d"), "fin": a["dernier"][2].strftime("%Y-%m-%d"), "points": pts, "source": "Dryad"})
                                n += 1
                    except BaseException as ex:
                        j(f"  ✗ fichier {f.get('path')} : {type(ex).__name__} {ex}")
                if n: j(f"✓ {titre[:90]} : {n} trajets")
                (R / "src/data/voyageurs-dryad.json").write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
            page += 1
    j(f"FIN : {len(sortie)} trajets, {len({s['latin'] for s in sortie})} espèces")

if __name__ == "__main__":
    try: main()
    except BaseException: traceback.print_exc(file=sys.stdout); print("ARRÊT sur erreur", flush=True)

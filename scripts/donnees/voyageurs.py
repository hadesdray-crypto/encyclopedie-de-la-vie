#!/usr/bin/env python3
"""Les grands voyageurs : de vrais trajets GPS d'animaux, pris dans le Movebank Data Repository
(jeux de données publiés, en licence libre CC0 ou CC BY). Pour chaque jeu : quelques animaux,
et pour chacun une petite partie de ses points (assez pour dessiner le trajet).
Rien n'est inventé : la distance est calculée à partir des vrais points.
Sortie : src/data/voyageurs.json et scripts/donnees/voyageurs-journal.txt"""
import csv, io, json, math, re, time, urllib.parse, urllib.request
from pathlib import Path

R = Path(__file__).resolve().parents[2]
DATA = R / "src/data"
API = "https://datarepository.movebank.org/server/api"
UA = {"User-Agent": "EncyclopedieLeonie/1.0 (application educative)", "Accept": "application/json"}
MAX_OCTETS = 1_500_000_000     # au-delà, le fichier n'est pas lu en entier : la fin du suivi est alors marquée « non connue »
MAX_ANIMAUX = 4                # par jeu de données
MAX_POINTS = 120               # par trajet
MARINS = {"Balaenidae", "Balaenopteridae", "Delphinidae", "Eschrichtiidae", "Monodontidae", "Phocoenidae", "Physeteridae", "Kogiidae",
          "Ziphiidae", "Phocidae", "Otariidae", "Odobenidae", "Trichechidae", "Dugongidae", "Cheloniidae", "Dermochelyidae"}

def j(m): print(m, flush=True)

def get(url, binaire=False, essais=3):
    for k in range(essais):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                d = r.read()
                return d if binaire else json.loads(d)
        except Exception as e:
            if k == essais - 1:
                j(f"  échec {url[:110]} : {e}")
                return None
            time.sleep(3 + 4 * k)

# Noms et régimes des mammifères de l'application
ESP = json.loads((DATA / "mammiferes.json").read_text())["especes"]
NF = json.loads((DATA / "noms-fr.json").read_text()); NT = json.loads((DATA / "noms-traduits.json").read_text())
PAR_LATIN = {e["latin"]: e for e in ESP}
def nom_app(e): return NF.get(e["id"]) or NT.get(e["id"]) or e["nom"]

TAXON = {}
def taxon(latin):
    if latin in TAXON: return TAXON[latin]
    m = get(f"https://api.gbif.org/v1/species/match?" + urllib.parse.urlencode({"name": latin})) or {}
    nom = None
    if m.get("usageKey"):
        v = get(f"https://api.gbif.org/v1/species/{m['usageKey']}/vernacularNames?limit=200") or {}
        fr = [x["vernacularName"] for x in v.get("results", []) if x.get("language") == "fra"]
        nom = fr[0][0].upper() + fr[0][1:] if fr else None
    TAXON[latin] = (m, nom)
    return TAXON[latin]

def groupe(latin, m):
    cl, fam, ordre = m.get("class"), m.get("family"), m.get("order")
    if fam in MARINS or cl in ("Actinopterygii", "Elasmobranchii", "Chondrichthyes") or ordre == "Cetacea": return "marin"
    if cl == "Aves": return "oiseau"
    e = PAR_LATIN.get(latin)
    if e and e.get("regime") in ("carnivore", "piscivore"): return "predateur"
    if ordre == "Carnivora" or cl == "Reptilia": return "predateur"
    if cl == "Mammalia": return "herbivore"
    return "autre"

def km(points):
    d = 0
    for (a, b), (c, e) in zip(points, points[1:]):
        p1, p2, dl = math.radians(a), math.radians(c), math.radians(e - b)
        x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        d += 6371 * 2 * math.asin(min(1, math.sqrt(x)))
    return round(d)

def dist(a, b):
    p1, p2, dl = math.radians(a[0]), math.radians(b[0]), math.radians(b[1] - a[1])
    x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371 * 2 * math.asin(min(1, math.sqrt(x)))

def lire_csv(url):
    """Lit tout le fichier en continu. Pour chaque animal : le vrai premier et le vrai dernier point (avec date et heure),
    la distance sur TOUS les points, et des points espacés pour dessiner le trajet."""
    req = urllib.request.Request(url, headers={"User-Agent": UA["User-Agent"]})
    par, coupe = {}, False
    with urllib.request.urlopen(req, timeout=600) as r:
        flux = io.TextIOWrapper(r, encoding="utf-8", errors="replace", newline="")
        lu = 0
        rd = csv.reader(flux)
        tete = next(rd, None)
        if not tete: return {}, False
        col = {c.strip().lower(): i for i, c in enumerate(tete)}
        ilat, ilon = col.get("location-lat"), col.get("location-long")
        iind, itax, its = col.get("individual-local-identifier"), col.get("individual-taxon-canonical-name"), col.get("timestamp")
        ivis, iout = col.get("visible"), col.get("manually-marked-outlier")
        if None in (ilat, ilon, iind): return {}, False
        for ligne in rd:
            lu += sum(len(x) for x in ligne) + len(ligne)
            if lu > MAX_OCTETS:
                coupe = True
                break
            try:
                if ivis is not None and ligne[ivis].lower() == "false": continue
                if iout is not None and ligne[iout].lower() == "true": continue
                lat, lon = float(ligne[ilat]), float(ligne[ilon])
            except (ValueError, IndexError):
                continue
            if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0): continue
            t = ligne[its] if its is not None else ""
            a = par.setdefault(ligne[iind], {"taxon": ligne[itax] if itax is not None else "", "pts": [], "pas": 1, "n": 0, "km": 0.0,
                                             "premier": [lat, lon, t], "dernier": None})
            if a["dernier"]: a["km"] += dist(a["dernier"], (lat, lon))
            a["dernier"] = [lat, lon, t]
            a["n"] += 1
            if (a["n"] - 1) % a["pas"]: continue
            a["pts"].append([lat, lon])
            if len(a["pts"]) > 2000:
                a["pts"], a["pas"] = a["pts"][::2], a["pas"] * 2
    return par, coupe

def main():
    sortie, vus, page = [], set(), 0
    while True:
        r = get(f"{API}/discover/search/objects?dsoType=ITEM&size=50&page={page}")
        objs = (((r or {}).get("_embedded") or {}).get("searchResult") or {}).get("_embedded", {}).get("objects", [])
        if not objs: break
        for o in objs:
            it = o.get("_embedded", {}).get("indexableObject", {})
            md = it.get("metadata", {})
            titre = (md.get("dc.title") or [{}])[0].get("value", "")
            droits = " ".join(x.get("value", "") for x in md.get("dc.rights", []) + md.get("dc.rights.uri", []))
            doi = next((x.get("value") for x in md.get("dc.identifier.uri", []) if "doi" in x.get("value", "")), "")
            licence = "CC0" if ("CC0" in droits or "publicdomain/zero" in droits) else "CC BY" if re.search(r"CC[- ]BY(?![- ]NC)|licenses/by/", droits) else None
            if not licence or it.get("uuid") in vus: continue
            vus.add(it["uuid"])
            bundles = get(f"{API}/core/items/{it['uuid']}/bundles") or {}
            fichiers = []
            for b in bundles.get("_embedded", {}).get("bundles", []):
                if b.get("name") != "ORIGINAL": continue
                bs = get(b["_links"]["bitstreams"]["href"]) or {}
                for f in bs.get("_embedded", {}).get("bitstreams", []):
                    n = f.get("name", "").lower()
                    if n.endswith(".csv") and "reference" not in n and "readme" not in n:
                        fichiers.append((f.get("sizeBytes", 0), f["_links"]["content"]["href"]))
            if not fichiers: continue
            fichiers.sort()
            try:
                par, coupe = lire_csv(fichiers[0][1])
            except Exception as e:
                j(f"✗ {titre[:80]} : {e}"); continue
            trajets = []
            for ind, a in par.items():
                if a["n"] < 5 or not a["taxon"]: continue
                pas = max(1, len(a["pts"]) // MAX_POINTS)
                pts = [[round(p[0], 4), round(p[1], 4)] for p in a["pts"][::pas]]
                # Le dessin commence au vrai départ et finit à la vraie arrivée.
                pts[0] = [round(a["premier"][0], 4), round(a["premier"][1], 4)]
                fin = [round(a["dernier"][0], 4), round(a["dernier"][1], 4)]
                if pts[-1] != fin: pts.append(fin)
                trajets.append((round(a["km"]), ind, a, pts))
            trajets.sort(key=lambda x: -x[0])
            n = 0
            for distance, ind, a, pts in trajets[:MAX_ANIMAUX]:
                latin = " ".join(a["taxon"].split()[:2])
                m, nom_gbif = taxon(latin)
                e = PAR_LATIN.get(latin)
                sortie.append({"latin": latin, "nom": nom_app(e) if e else nom_gbif, "fiche": e["id"] if e else None, "groupe": groupe(latin, m),
                               "classe": m.get("class"), "individu": ind[:40], "etude": titre[:160], "doi": doi, "licence": licence,
                               "depart": {"lat": round(a["premier"][0], 5), "lon": round(a["premier"][1], 5), "date": a["premier"][2][:16]},
                               "arrivee": None if coupe else {"lat": round(a["dernier"][0], 5), "lon": round(a["dernier"][1], 5), "date": a["dernier"][2][:16]},
                               "complet": not coupe, "nbPoints": a["n"], "km": None if coupe else distance,
                               "debut": a["premier"][2][:10], "fin": "" if coupe else a["dernier"][2][:10], "points": pts})
                n += 1
            j(f"✓ {titre[:80]} ({licence}) : {n} trajets{' (fichier coupé : fin non connue)' if coupe else ''}")
            (DATA / "voyageurs.json").write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
        page += 1
    j(f"FIN : {len(sortie)} trajets, {len({s['latin'] for s in sortie})} espèces")

if __name__ == "__main__":
    main()

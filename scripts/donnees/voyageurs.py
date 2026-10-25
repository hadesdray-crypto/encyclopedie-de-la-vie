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
MAX_OCTETS = 400_000_000       # on n'avale jamais plus de 400 Mo par fichier
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

def lire_csv(url):
    """Lit le fichier en continu et garde, par animal, des points espacés (on dédouble au besoin)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA["User-Agent"]})
    par = {}
    with urllib.request.urlopen(req, timeout=300) as r:
        flux = io.TextIOWrapper(r, encoding="utf-8", errors="replace", newline="")
        lu = 0
        rd = csv.reader(flux)
        tete = next(rd, None)
        if not tete: return {}
        col = {c.strip().lower(): i for i, c in enumerate(tete)}
        ilat, ilon = col.get("location-lat"), col.get("location-long")
        iind, itax, its = col.get("individual-local-identifier"), col.get("individual-taxon-canonical-name"), col.get("timestamp")
        ivis = col.get("visible")
        if None in (ilat, ilon, iind): return {}
        for ligne in rd:
            lu += sum(len(x) for x in ligne) + len(ligne)
            if lu > MAX_OCTETS: break
            try:
                if ivis is not None and ligne[ivis].lower() == "false": continue
                lat, lon = float(ligne[ilat]), float(ligne[ilon])
            except (ValueError, IndexError):
                continue
            if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0): continue
            a = par.setdefault(ligne[iind], {"taxon": ligne[itax] if itax is not None else "", "pts": [], "pas": 1, "n": 0, "t": []})
            a["n"] += 1
            if a["n"] % a["pas"]: continue
            a["pts"].append([lat, lon]); a["t"].append(ligne[its][:10] if its is not None else "")
            if len(a["pts"]) > 2000:
                a["pts"], a["t"], a["pas"] = a["pts"][::2], a["t"][::2], a["pas"] * 2
    return par

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
                par = lire_csv(fichiers[0][1])
            except Exception as e:
                j(f"✗ {titre[:80]} : {e}"); continue
            trajets = []
            for ind, a in par.items():
                if len(a["pts"]) < 5 or not a["taxon"]: continue
                pas = max(1, len(a["pts"]) // MAX_POINTS)
                pts = [[round(p[0], 3), round(p[1], 3)] for p in a["pts"][::pas]]
                trajets.append((km(pts), ind, a, pts, a["t"][::pas]))
            trajets.sort(key=lambda x: -x[0])
            n = 0
            for dist, ind, a, pts, ts in trajets[:MAX_ANIMAUX]:
                latin = " ".join(a["taxon"].split()[:2])
                m, nom_gbif = taxon(latin)
                e = PAR_LATIN.get(latin)
                sortie.append({"latin": latin, "nom": nom_app(e) if e else nom_gbif, "fiche": e["id"] if e else None, "groupe": groupe(latin, m),
                               "classe": m.get("class"), "individu": ind[:40], "etude": titre[:160], "doi": doi, "licence": licence,
                               "debut": next((t for t in ts if t), ""), "fin": next((t for t in reversed(ts) if t), ""), "km": dist, "points": pts})
                n += 1
            j(f"✓ {titre[:80]} ({licence}) : {n} trajets")
            (DATA / "voyageurs.json").write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
        page += 1
    j(f"FIN : {len(sortie)} trajets, {len({s['latin'] for s in sortie})} espèces")

if __name__ == "__main__":
    main()

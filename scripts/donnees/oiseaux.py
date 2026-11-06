#!/usr/bin/env python3
"""Le carnet des oiseaux de Plume : photos, cris, texte, migrations.
Tourne sur GitHub Actions (.github/workflows/oiseaux.yml), qui a accès à Internet.

Usage :  python scripts/donnees/oiseaux.py [N]     (N = nombre d'espèces pour un essai ; 0 = toutes)

Sources (rien n'est inventé ; une valeur absente reste « Non connu » dans l'application) :
  - liste : oiseaux-liste.txt (noms latins, les plus connus) + les oiseaux les plus observés en France (GBIF) ;
  - nom français, texte : Wikipédia en français (+ Wikidata pour le nom latin exact) ;
  - photos : Wikimedia Commons, seulement CC0, domaine public, CC BY et CC BY-SA, toujours avec l'auteur ;
    mâle et femelle : seulement s'il existe une catégorie Commons « (male) » / « (female) » ;
  - cris : GBIF (enregistrements Xeno-canto, iNaturalist…), seulement CC0 et CC BY, 2 cris au maximum par espèce :
    le chant / cri nuptial d'abord, puis le cri le plus répandu.
Les cris et les photos sont compressés (WebM Opus ~24 kbit/s, WebP 640 px) pour garder l'appli légère.
"""
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"
RACINE = Path(__file__).resolve().parents[2]
DONNEES = RACINE / "src/data"
PHOTOS = RACINE / "public/oiseaux/p"
CRIS = RACINE / "public/oiseaux/s"
LISTE = Path(__file__).with_name("oiseaux-liste.txt")
GBIF = "https://api.gbif.org/v1"
WIKI = "https://fr.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
LICENCES_OK = ("cc0", "public domain", "pd", "cc by", "cc-by")
LICENCES_NON = ("nc", "nd")


def get(url, brut=False, essais=5):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for k in range(essais):
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                time.sleep(0.2)
                data = res.read()
                return data if brut else json.loads(data)
        except Exception as exc:  # noqa: BLE001
            if k == essais - 1:
                raise
            time.sleep(4 + k * 4 if any(c in str(exc) for c in ("429", "502", "503")) else 1.5)


def joli(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def licence_ok(texte):
    t = (texte or "").lower().replace("-", " ")
    if any(re.search(rf"\b{m}\b", t) for m in LICENCES_NON):
        return False
    return any(m in t for m in ("cc0", "public domain", "cc by", "pd "))


def identifiant(latin):
    return re.sub(r"[^a-z0-9]+", "-", latin.lower()).strip("-")


# ---------- liste des espèces ----------
def liste_especes(n):
    noms = [l.strip() for l in LISTE.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    try:  # les oiseaux les plus observés en France (GBIF, classe Aves = 212)
        r = get(f"{GBIF}/occurrence/search?country=FR&classKey=212&rank=SPECIES&facet=speciesKey&facetLimit=250&limit=0")
        for f in r.get("facets", [{}])[0].get("counts", []):
            sp = get(f"{GBIF}/species/{f['name']}")
            if sp.get("rank") == "SPECIES" and sp.get("canonicalName"):
                noms.append(sp["canonicalName"])
    except Exception as exc:  # noqa: BLE001
        print("GBIF France indisponible :", exc)
    vus, out = set(), []
    for x in noms:
        if x not in vus:
            vus.add(x)
            out.append(x)
    return out[:n] if n else out


# ---------- texte français ----------
def texte_fr(latin):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "redirects": 1, "prop": "extracts|pageprops|info",
                                "exintro": 1, "explaintext": 1, "inprop": "url", "titles": latin})
    pages = get(f"{WIKI}?{q}").get("query", {}).get("pages", {})
    for p in pages.values():
        if "missing" in p:
            continue
        return {"nom_wiki": p.get("title"), "intro": (p.get("extract") or "").strip(), "page": p.get("fullurl")}
    return None


def nom_francais(latin):
    r = get(f"{GBIF}/species/match?name={urllib.parse.quote(latin)}&kingdom=Animalia")
    if not r.get("usageKey"):
        return None, None
    v = get(f"{GBIF}/species/{r['usageKey']}/vernacularNames?limit=200").get("results", [])
    fr = [x["vernacularName"] for x in v if x.get("language") == "fra"]
    return r["usageKey"], (fr[0].capitalize() if fr else None)


# ---------- photos (Commons) ----------
def photos_commons(recherche, maxi=2, categorie=None):
    if categorie:
        q = {"action": "query", "format": "json", "generator": "categorymembers", "gcmtitle": f"Category:{categorie}",
             "gcmtype": "file", "gcmlimit": 12}
    else:
        q = {"action": "query", "format": "json", "generator": "search", "gsrsearch": f"{recherche} filetype:bitmap",
             "gsrnamespace": 6, "gsrlimit": 14}
    q.update({"prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 800})
    try:
        pages = get(f"{COMMONS}?{urllib.parse.urlencode(q)}").get("query", {}).get("pages", {})
    except Exception:  # noqa: BLE001
        return []
    out = []
    for p in sorted(pages.values(), key=lambda x: x.get("index", 0)):
        i = (p.get("imageinfo") or [{}])[0]
        m = i.get("extmetadata", {})
        lic = (m.get("LicenseShortName") or {}).get("value", "")
        if not licence_ok(lic) or not i.get("thumburl") or min(i.get("width", 0), i.get("height", 0)) < 500:
            continue
        if re.search(r"(skull|egg|oeuf|map|range|distribution|drawing|illustration|stamp|skeleton)", p["title"], re.I):
            continue
        out.append({"fichier": p["title"].replace("File:", ""), "url": i["thumburl"], "auteur": joli((m.get("Artist") or {}).get("value", ""))[:80] or "Auteur inconnu",
                    "licence": lic, "page": i.get("descriptionurl", "")})
        if len(out) >= maxi:
            break
    return out


def enregistrer_photo(p, dest):
    from PIL import Image
    img = Image.open(BytesIO(get(p["url"], brut=True))).convert("RGB")
    img.thumbnail((640, 640))
    img.save(dest, "WEBP", quality=68, method=6)
    return dest.stat().st_size


# ---------- cris (GBIF) ----------
def cris_gbif(cle, maxi=2):
    q = urllib.parse.urlencode({"taxonKey": cle, "mediaType": "Sound", "limit": 60})
    res = get(f"{GBIF}/occurrence/search?{q}").get("results", [])
    candidats = []
    for r in res:
        for m in r.get("media", []):
            if m.get("type") != "Sound" or not m.get("identifier"):
                continue
            lic = m.get("license") or r.get("license") or ""
            if not licence_ok(lic):
                continue
            texte = " ".join(str(r.get(k, "")) for k in ("behavior", "occurrenceRemarks", "establishmentMeans")).lower() + " " + (m.get("description") or "").lower()
            chant = bool(re.search(r"song|chant|courtship|nuptial|display|parade|duet", texte))
            candidats.append((not chant, m["identifier"], lic, joli(m.get("rightsHolder") or m.get("creator") or r.get("recordedBy") or "Auteur inconnu")[:80], r.get("key"), "chant" if chant else "cri"))
    candidats.sort(key=lambda c: c[0])
    out, vus = [], set()
    for _, url, lic, auteur, occ, sorte in candidats:
        if url in vus:
            continue
        vus.add(url)
        out.append({"url": url, "licence": lic, "auteur": auteur, "page": f"https://www.gbif.org/occurrence/{occ}", "sorte": sorte})
        if len(out) >= maxi:
            break
    return out


def enregistrer_cri(c, dest):
    brut = get(c["url"], brut=True)
    src = dest.with_suffix(".src")
    src.write_bytes(brut)
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-t", "12", "-ac", "1", "-ar", "24000", "-af", "loudnorm=I=-18",
           "-c:a", "libopus", "-b:a", "24k", str(dest)]
    ok = subprocess.run(cmd).returncode == 0
    src.unlink(missing_ok=True)
    return dest.stat().st_size if ok and dest.exists() else 0


# ---------- programme ----------
def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    PHOTOS.mkdir(parents=True, exist_ok=True)
    CRIS.mkdir(parents=True, exist_ok=True)
    sortie = DONNEES / "oiseaux.json"
    deja = {o["id"]: o for o in json.loads(sortie.read_text(encoding="utf-8"))["oiseaux"]} if sortie.exists() else {}
    oiseaux, poids = [], {"photos": 0, "cris": 0}
    for k, latin in enumerate(liste_especes(n), 1):
        oid = identifiant(latin)
        if oid in deja:
            oiseaux.append(deja[oid])
            continue
        try:
            cle, nom = nom_francais(latin)
            txt = texte_fr(latin)
            if not cle or not txt:
                print(f"[{k}] {latin} : introuvable, ignoré")
                continue
            fiche = {"id": oid, "latin": latin, "nom": nom or txt["nom_wiki"], "intro": txt["intro"][:900], "wiki": txt["page"], "photos": [], "cris": []}
            groupes = [("", photos_commons(latin, 2)), ("male", photos_commons(latin, 1, f"{latin} (male)")), ("femelle", photos_commons(latin, 1, f"{latin} (female)"))]
            vus = set()
            for sexe, liste in groupes:
                for p in liste:
                    if p["fichier"] in vus:
                        continue
                    vus.add(p["fichier"])
                    nom_f = f"{oid}-{len(fiche['photos'])}.webp"
                    poids["photos"] += enregistrer_photo(p, PHOTOS / nom_f)
                    fiche["photos"].append({"src": f"oiseaux/p/{nom_f}", "sexe": sexe or None, "auteur": p["auteur"], "licence": p["licence"], "page": p["page"]})
            for j, c in enumerate(cris_gbif(cle, 2)):
                nom_c = f"{oid}-{j}.webm"
                t = enregistrer_cri(c, CRIS / nom_c)
                if t:
                    poids["cris"] += t
                    fiche["cris"].append({"src": f"oiseaux/s/{nom_c}", "sorte": c["sorte"], "auteur": c["auteur"], "licence": c["licence"], "page": c["page"]})
            oiseaux.append(fiche)
            print(f"[{k}] {latin} ({fiche['nom']}) : {len(fiche['photos'])} photos, {len(fiche['cris'])} cris")
        except Exception as exc:  # noqa: BLE001
            print(f"[{k}] {latin} : erreur {exc}")
        if k % 10 == 0:
            sortie.write_text(json.dumps({"oiseaux": oiseaux}, ensure_ascii=False), encoding="utf-8")
    sortie.write_text(json.dumps({"oiseaux": oiseaux}, ensure_ascii=False), encoding="utf-8")
    print(f"TERMINÉ : {len(oiseaux)} oiseaux, photos {poids['photos']/1048576:.1f} Mo, cris {poids['cris']/1048576:.1f} Mo")


if __name__ == "__main__":
    main()

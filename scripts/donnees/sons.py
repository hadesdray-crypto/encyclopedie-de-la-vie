#!/usr/bin/env python3
"""Cris et photos manquants des mammifères les plus célèbres (tourne sur GitHub Actions : il faut Internet).

- Cris : pour les N mammifères les plus célèbres (notoriete.json) qui n'ont pas de cri, on cherche un VRAI enregistrement
  de l'espèce exacte : GBIF (archives scientifiques dont Xeno-canto), iNaturalist (observations confirmées), Wikimedia Commons.
  On préfère les licences qui permettent la vente (CC0, domaine public, CC BY, CC BY-SA) ; à défaut une licence non commerciale
  (elle sera exclue automatiquement de l'édition à vendre). « Pas de modification » (ND) : jamais.
  Extrait court (6 s environ), mono, Opus 24 kbit/s.
- Photos : pour les M mammifères les plus célèbres sans photo : Wikimedia Commons puis iNaturalist, jamais d'animal mort.

Rien n'est inventé : si rien n'est trouvé, l'espèce reste sans cri / sans photo et elle est listée dans sons-rapport.json.
Usage : python scripts/donnees/sons.py [N_cris] [M_photos]
"""
import json
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"
RACINE = Path(__file__).resolve().parents[2]
DATA = RACINE / "src/data"
GBIF = "https://api.gbif.org/v1"
INAT = "https://api.inaturalist.org/v1"
COMMONS = "https://commons.wikimedia.org/w/api.php"
CATALOGUE = {e["id"]: e for e in json.loads((DATA / "mammiferes.json").read_text())["especes"]}
MORT = 19  # iNaturalist : « Vivant ou mort » = mort


def lire(nom, defaut):
    f = DATA / nom
    return json.loads(f.read_text()) if f.exists() else defaut


def ecrire(nom, valeur):
    (DATA / nom).write_text(json.dumps(valeur, ensure_ascii=False, separators=(",", ":"), sort_keys=True))


def get(url, brut=False, essais=5, pause=0.3):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*" if brut else "application/json"})
    for k in range(essais):
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                time.sleep(pause)
                data = res.read()
                return data if brut else json.loads(data)
        except Exception as exc:  # noqa: BLE001
            if k == essais - 1:
                return None
            time.sleep(4 + k * 5 if any(c in str(exc) for c in ("429", "502", "503", "504")) else 1.5)


def joli(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def norm_licence(l):
    l = (l or "").strip()
    m = re.search(r"/licenses/([a-z\-]+)/([0-9.]+)", l)
    if m:
        return f"CC {m.group(1).upper()} {m.group(2)}"
    if "publicdomain/zero" in l or l.lower() in ("cc0", "cc0 1.0"):
        return "CC0"
    if "publicdomain/mark" in l:
        return "Domaine public"
    return l


def sans_nd(texte):
    """Toute licence ouverte, sauf « pas de modification » (ND)."""
    t = (texte or "").lower().replace("-", " ")
    return not re.search(r"\bnd\b", t) and any(m in t for m in ("cc0", "public domain", "domaine public", "cc by", "pd "))


def vendable(texte):
    t = (texte or "").lower().replace("-", " ")
    return sans_nd(texte) and not re.search(r"\bnc\b", t)


def cle_gbif(latin):
    r = get(f"{GBIF}/species/match?name={urllib.parse.quote(latin)}&kingdom=Animalia&class=Mammalia") or {}
    if r.get("matchType") not in ("EXACT", "FUZZY", "HIGHERRANK") or r.get("rank") not in ("SPECIES", "SUBSPECIES"):
        return None
    return r.get("speciesKey") or r.get("usageKey")


_datasets = {}


def titre_dataset(cle):
    if cle not in _datasets:
        d = get(f"{GBIF}/dataset/{cle}") or {}
        _datasets[cle] = d.get("title", "")
    return _datasets[cle]


# ---------------------------------------------------------------- sources de cris
def cris_gbif(latin):
    cle = cle_gbif(latin)
    if not cle:
        return []
    q = urllib.parse.urlencode({"speciesKey": cle, "mediaType": "Sound", "limit": 80})
    out = []
    for r in (get(f"{GBIF}/occurrence/search?{q}") or {}).get("results", []):
        if r.get("speciesKey") != cle and r.get("acceptedTaxonKey") != cle:
            continue
        for m in r.get("media", []):
            if m.get("type") != "Sound" or not m.get("identifier"):
                continue
            lic = norm_licence(m.get("license") or r.get("license") or "")
            if not sans_nd(lic):
                continue
            ds = titre_dataset(r.get("datasetKey", "")) if r.get("datasetKey") else ""
            xc = "xeno" in ds.lower() or "xeno-canto" in (m.get("references") or "").lower()
            out.append({"url": m["identifier"], "licence": lic, "auteur": joli(m.get("rightsHolder") or m.get("creator") or r.get("recordedBy") or "Auteur inconnu")[:90],
                        "source": m.get("references") or f"https://www.gbif.org/occurrence/{r.get('key')}", "archive": "Xeno-canto" if xc else (ds[:60] or "GBIF"), "rang": 0 if xc else 1})
    return out


def cris_inat(latin):
    q = urllib.parse.urlencode({"taxon_name": latin, "sounds": "true", "quality_grade": "research", "per_page": 30, "order_by": "votes", "without_term_value_id": MORT})
    out = []
    for o in (get(f"{INAT}/observations?{q}") or {}).get("results", []):
        nom = (o.get("taxon") or {}).get("name", "")
        if not (nom == latin or nom.startswith(latin + " ")):
            continue
        for s in o.get("sounds") or []:
            lic = {"cc0": "CC0", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc-by-nc": "CC BY-NC", "cc-by-nc-sa": "CC BY-NC-SA"}.get((s.get("license_code") or "").lower())
            if lic and s.get("file_url"):
                out.append({"url": s["file_url"], "licence": lic, "auteur": s.get("attribution") or "", "source": f"https://www.inaturalist.org/observations/{o['id']}", "archive": "iNaturalist", "rang": 2})
    return out


def fichiers_commons(latin, audio):
    """Fichiers de Wikimedia Commons dont le titre ou la description cite le nom scientifique exact."""
    mot = "filetype:audio" if audio else "filetype:bitmap"
    q = {"action": "query", "format": "json", "generator": "search", "gsrsearch": f'"{latin}" {mot}', "gsrnamespace": 6, "gsrlimit": 15,
         "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 900}
    pages = ((get(f"{COMMONS}?{urllib.parse.urlencode(q)}") or {}).get("query") or {}).get("pages", {})
    out = []
    for p in sorted(pages.values(), key=lambda x: x.get("index", 0)):
        i = (p.get("imageinfo") or [{}])[0]
        m = i.get("extmetadata", {})
        lic = (m.get("LicenseShortName") or {}).get("value", "")
        if not sans_nd(lic):
            continue
        desc = joli((m.get("ImageDescription") or {}).get("value", ""))
        cats = joli((m.get("Categories") or {}).get("value", ""))
        texte = (p["title"] + " " + desc + " " + cats).lower()
        if latin.lower() not in texte:
            continue
        if audio:
            # Seulement les vrais enregistrements de l'animal : la catégorie « Audio files of <espèce> » (ou « Sounds of »),
            # jamais une prononciation du mot, un texte lu, ni un chien/chat domestique rangé dans l'espèce sauvage.
            c = cats.lower()
            liste = [x.strip() for x in c.split("|")]
            exact = f"audio files of {latin.lower()}" in c or f"sounds of {latin.lower()}" in c
            appel = latin.lower() in liste and any(x.startswith("audio files") for x in liste) and re.search(r"(roar|howl|growl|call|vocal|cry|trumpet|bellow|grunt|squeal|chatter|whistle|bugle|purr|snort|scream|hiss|bark)", (p["title"] + " " + desc).lower())
            if not exact and not appel:
                continue
            if re.search(r"(pronunc|prononc|spoken|speech|lingua libre|ingesproken|proverb|voice of|wikipedia article|singing|song by|music)", texte):
                continue
            if not re.search(r"(familiaris|catus|domesticus)", latin) and re.search(r"(\bdogs?\b|perro|chien|\bhund|ladr|bark|\bcats?\b|gato|chat\b|domestic)", texte):
                continue
        if re.search(r"(skull|crâne|skeleton|squelette|taxiderm|specimen|dead|carcass|museum|musée|mort\b|map|range|distribution|drawing|illustration|stamp|tooth|dent\b|track|footprint|fossil)", texte):
            continue
        if not audio and min(i.get("width", 0), i.get("height", 0)) < 500:
            continue
        out.append({"url": i.get("thumburl") if not audio else i.get("url"), "licence": lic, "auteur": joli((m.get("Artist") or {}).get("value", ""))[:90] or "Auteur inconnu",
                    "source": i.get("descriptionurl", ""), "archive": "Wikimedia Commons", "rang": 3})
    return out


def photos_inat(latin):
    q = urllib.parse.urlencode({"taxon_name": latin, "photos": "true", "quality_grade": "research", "per_page": 30, "order_by": "votes",
                                "photo_license": "cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa", "without_term_value_id": MORT})
    out = []
    for o in (get(f"{INAT}/observations?{q}") or {}).get("results", []):
        nom = (o.get("taxon") or {}).get("name", "")
        if not (nom == latin or nom.startswith(latin + " ")):
            continue
        if any(a.get("controlled_attribute_id") == 17 and a.get("controlled_value_id") == MORT for a in o.get("annotations") or []):
            continue
        for p in o.get("photos") or []:
            lic = {"cc0": "CC0", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc-by-nc": "CC BY-NC", "cc-by-nc-sa": "CC BY-NC-SA"}.get((p.get("license_code") or "").lower())
            if lic and p.get("url"):
                out.append({"url": p["url"].replace("/square.", "/large."), "licence": lic, "auteur": p.get("attribution") or "", "source": f"https://www.inaturalist.org/observations/{o['id']}", "archive": "iNaturalist", "rang": 2})
                break
    return out


def trier(c):
    # D'abord ce qui peut se vendre, puis les archives scientifiques, puis le reste.
    return (0 if vendable(c["licence"]) else 1, c["rang"])


# ---------------------------------------------------------------- conversion
def convertir_cri(url, dest):
    brut = None
    for _ in range(3):
        brut = get(url, brut=True, pause=0.6)
        if brut:
            break
        time.sleep(5)
    if not brut or len(brut) < 3000:
        return 0
    with tempfile.NamedTemporaryFile(suffix=".src") as t:
        t.write(brut)
        t.flush()
        dest.parent.mkdir(parents=True, exist_ok=True)
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", t.name, "-vn", "-af",
               "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-40dB,loudnorm=I=-18,afade=t=out:st=5.5:d=0.5",
               "-t", "6", "-ac", "1", "-ar", "24000", "-c:a", "libopus", "-b:a", "24k", str(dest)]
        if subprocess.run(cmd).returncode != 0 or not dest.exists():
            dest.unlink(missing_ok=True)
            return 0
    # Pas de silence, pas de clip trop court.
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dest)], capture_output=True, text=True)
    v = subprocess.run(["ffmpeg", "-v", "info", "-i", str(dest), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    try:
        duree = float(p.stdout.strip())
        moy = float(re.search(r"mean_volume: (-?[0-9.]+) dB", v.stderr).group(1))
    except Exception:  # noqa: BLE001
        dest.unlink(missing_ok=True)
        return 0
    if duree < 0.8 or moy < -40:
        dest.unlink(missing_ok=True)
        return 0
    return dest.stat().st_size


def convertir_photo(url, dest):
    from PIL import Image, ImageStat
    brut = get(url, brut=True, pause=0.3)
    if not brut:
        return 0
    try:
        im = Image.open(BytesIO(brut)).convert("RGB")
    except Exception:  # noqa: BLE001
        return 0
    im.thumbnail((640, 640))
    _, sat, lum = ImageStat.Stat(im.convert("HSV")).mean
    if sat < 25 or lum < 45 or min(im.size) < 300:  # ni noir et blanc de piège photo, ni trop sombre, ni minuscule
        return 0
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=68, method=6)
    return dest.stat().st_size


# ---------------------------------------------------------------- principal
def main(n_cris, n_photos):
    note = lire("notoriete.json", {})
    classes = sorted(note, key=lambda k: -note[k])
    cris = set(lire("cris.json", []))
    credits_c = lire("credits-cris.json", {})
    verifies = set(lire("cris-verifies.json", []))
    photos = set(lire("photos.json", []))
    credits_p = lire("credits-photos.json", {})
    rapport = lire("sons-rapport.json", {"cris_trouves": [], "cris_introuvables": [], "photos_trouvees": [], "photos_introuvables": []})
    deja_c = {x["id"] for x in rapport["cris_introuvables"]} | set(rapport["cris_trouves"])
    deja_p = {x["id"] for x in rapport["photos_introuvables"]} | set(rapport["photos_trouvees"])
    octets_c = octets_p = 0

    cibles = [i for i in classes[:n_cris] if i in CATALOGUE and i not in cris and i not in deja_c and not CATALOGUE[i].get("disparue")]
    print(f"cris à chercher : {len(cibles)}", flush=True)
    for k, i in enumerate(cibles, 1):
        e = CATALOGUE[i]
        latin = e["latin"]
        cand = []
        for source in (cris_gbif, cris_inat):
            try:
                cand += source(latin)
            except Exception as exc:  # noqa: BLE001
                print("  ", source.__name__, latin, exc, file=sys.stderr)
        try:
            cand += fichiers_commons(latin, True)
        except Exception as exc:  # noqa: BLE001
            print("  commons", latin, exc, file=sys.stderr)
        cand.sort(key=trier)
        vus, ok = set(), False
        for c in cand[:8]:
            if c["url"] in vus:
                continue
            vus.add(c["url"])
            taille = convertir_cri(c["url"], RACINE / "public/s" / f"{i}.webm")
            if taille:
                cris.add(i)
                credits_c[i] = {"auteur": c["auteur"], "licence": c["licence"], "source": c["source"], "archive": c["archive"]}
                if c["archive"] == "Xeno-canto" or (c["rang"] <= 1 and c["archive"] not in ("iNaturalist", "Wikimedia Commons")):
                    verifies.add(i)
                rapport["cris_trouves"].append(i)
                octets_c += taille
                print(f"[{k}/{len(cibles)}] cri OK  {e['nom']} ({latin}) {c['archive']} {c['licence']} {taille} o", flush=True)
                ok = True
                break
        if not ok:
            rapport["cris_introuvables"].append({"id": i, "nom": e["nom"], "latin": latin, "candidats": len(cand)})
            print(f"[{k}/{len(cibles)}] cri --  {e['nom']} ({latin}) : rien d'utilisable ({len(cand)} candidats)", flush=True)
        if k % 25 == 0:
            sauver(cris, credits_c, verifies, photos, credits_p, rapport)

    cibles = [i for i in classes[:n_photos] if i in CATALOGUE and i not in photos and i not in deja_p and not CATALOGUE[i].get("disparue")]
    print(f"photos à chercher : {len(cibles)}", flush=True)
    for k, i in enumerate(cibles, 1):
        e = CATALOGUE[i]
        latin = e["latin"]
        cand = []
        for source in (lambda l: fichiers_commons(l, False), photos_inat):
            try:
                cand += source(latin)
            except Exception as exc:  # noqa: BLE001
                print("  photo", latin, exc, file=sys.stderr)
        cand.sort(key=trier)
        ok = False
        for c in cand[:6]:
            taille = convertir_photo(c["url"], RACINE / "public/m" / f"{i}.webp")
            if taille:
                photos.add(i)
                credits_p[i] = {"auteur": c["auteur"], "licence": c["licence"], "source": c["source"]}
                rapport["photos_trouvees"].append(i)
                octets_p += taille
                print(f"[{k}/{len(cibles)}] photo OK {e['nom']} ({latin}) {c['archive']} {c['licence']} {taille} o", flush=True)
                ok = True
                break
        if not ok:
            rapport["photos_introuvables"].append({"id": i, "nom": e["nom"], "latin": latin, "candidats": len(cand)})
            print(f"[{k}/{len(cibles)}] photo -- {e['nom']} ({latin}) : rien d'utilisable", flush=True)
    sauver(cris, credits_c, verifies, photos, credits_p, rapport)
    print(f"TOTAL : {len(rapport['cris_trouves'])} cris ({octets_c} o), {len(rapport['photos_trouvees'])} photos ({octets_p} o)")


def sauver(cris, credits_c, verifies, photos, credits_p, rapport):
    ecrire("cris.json", sorted(cris))
    ecrire("credits-cris.json", credits_c)
    ecrire("cris-verifies.json", sorted(verifies))
    ecrire("photos.json", sorted(photos))
    ecrire("credits-photos.json", credits_p)
    ecrire("sons-rapport.json", rapport)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 300, int(sys.argv[2]) if len(sys.argv) > 2 else 1000)

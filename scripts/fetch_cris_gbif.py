#!/usr/bin/env python3
"""Cris depuis GBIF puis iNaturalist. Seulement CC0 et CC BY. Sinon rien."""
import json
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

DATA = json.load(open("/workspace/src/data/mammiferes.json"))
ESPECES = DATA["especes"]
OUT = Path("/workspace/public/s")
OUT.mkdir(parents=True, exist_ok=True)
ETAT = Path("/tmp/mdd/cris-gbif.json")
UA = "EncyclopedieLeonie/1.0 (educational child app; CC0 and CC-BY calls)"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for essai in range(5):
        try:
            with urllib.request.urlopen(req, timeout=40) as res:
                time.sleep(0.25)
                return json.load(res)
        except Exception as exc:
            if any(code in str(exc) for code in ("429", "503", "502")):
                time.sleep(6 + essai * 4)
                continue
            if essai == 4:
                raise
            time.sleep(1.5)
    raise RuntimeError(url)


def licence_ok(url):
    u = (url or "").lower()
    if any(mot in u for mot in ("by-nc", "by-nd", "by-sa", "nc-sa")):
        return False
    return "publicdomain/zero" in u or "/licenses/by/" in u


def libelle(url):
    return "CC0" if "publicdomain/zero" in (url or "").lower() else "CC BY"


def meme_espece(nom, latin):
    nom = (nom or "").strip()
    return nom == latin or nom.startswith(latin + " ")


def depuis_gbif(latin):
    for code in ("CC0_1_0", "CC_BY_4_0"):
        query = urllib.parse.urlencode({
            "scientificName": latin,
            "mediaType": "Sound",
            "license": code,
            "limit": 8,
        })
        data = get("https://api.gbif.org/v1/occurrence/search?" + query)
        for occ in data.get("results", []):
            if not meme_espece(occ.get("species") or occ.get("scientificName"), latin):
                continue
            sons = [m for m in occ.get("media") or [] if m.get("type") == "Sound" and licence_ok(m.get("license")) and m.get("identifier")]
            if sons:
                return sons[0]["identifier"], libelle(sons[0].get("license"))
    return None


def depuis_inat(latin):
    query = urllib.parse.urlencode({
        "taxon_name": latin,
        "sounds": "true",
        "per_page": 5,
        "sound_license": "cc0,cc-by",
    })
    data = get("https://api.inaturalist.org/v1/observations?" + query)
    for obs in data.get("results") or []:
        taxon = obs.get("taxon") or {}
        if taxon.get("rank") != "species" or not meme_espece(taxon.get("name"), latin):
            continue
        for son in obs.get("sounds") or []:
            code = (son.get("license_code") or "").lower()
            if code in ("cc0", "cc-by") and son.get("file_url"):
                return son["file_url"], "CC0" if code == "cc0" else "CC BY"
    return None


def convertir(sid, url):
    dest = OUT / f"{sid}.mp3"
    if dest.exists() and dest.stat().st_size > 800:
        return True
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=50) as res:
        brut = res.read(20_000_000)
    tmp = Path(f"/tmp/mdd/cri-{sid}")
    tmp.write_bytes(brut)
    try:
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(tmp), "-t", "18", "-ac", "1", "-ar", "22050", "-b:a", "40k", str(dest)],
            check=True,
            timeout=45,
        )
    finally:
        tmp.unlink(missing_ok=True)
    if dest.exists() and dest.stat().st_size > 800:
        return True
    dest.unlink(missing_ok=True)
    return False


def ecrire(credits):
    ids = sorted(p.stem for p in OUT.glob("*.mp3") if p.stat().st_size > 800)
    Path("/workspace/src/data/cris.json").write_text(json.dumps(ids))
    Path("/workspace/src/data/credits-cris.json").write_text(json.dumps({i: credits[i] for i in ids if i in credits}, ensure_ascii=False))


def main():
    etat = json.load(open(ETAT)) if ETAT.exists() else {}
    credits = {}
    if Path("/workspace/src/data/credits-cris.json").exists():
        credits.update(json.load(open("/workspace/src/data/credits-cris.json")))
    nouveaux = 0
    for i, espece in enumerate(ESPECES, 1):
        latin, sid = espece["latin"], espece["id"]
        if (OUT / f"{sid}.mp3").exists() or etat.get(latin) == "nc":
            continue
        try:
            trouve = depuis_inat(latin) or depuis_gbif(latin)
        except Exception as exc:
            print("echec", latin, exc, flush=True)
            continue
        if not trouve:
            etat[latin] = "nc"
        else:
            url, licence = trouve
            try:
                if convertir(sid, url):
                    credits[sid] = licence
                    etat[latin] = licence
                    nouveaux += 1
                    print("son", sid, latin, licence, flush=True)
                else:
                    etat[latin] = "nc"
            except Exception as exc:
                print("sans", latin, exc, flush=True)
                etat[latin] = "nc"
        if i % 25 == 0:
            ETAT.write_text(json.dumps(etat))
            ecrire(credits)
            print("progres", i, "/", len(ESPECES), "nouveaux", nouveaux, flush=True)
    ETAT.write_text(json.dumps(etat))
    ecrire(credits)
    print("fini", nouveaux, flush=True)


if __name__ == "__main__":
    main()

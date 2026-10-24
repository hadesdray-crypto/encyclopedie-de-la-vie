#!/usr/bin/env python3
"""Fetch French names and light WebP portraits for every mammal species."""

import csv
import json
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image

MDD = Path("/tmp/mdd/MDD_v2.5.csv")
CACHE = Path("/tmp/mdd/wiki.json")
IMAGES = Path("/workspace/public/m")
AGENT = "LeonieEncyclopedie/1.0 (educational catalog; local preview)"


def lire_noms():
    with MDD.open(newline="", encoding="utf-8") as fichier:
        return [row["sciName"] for row in csv.DictReader(fichier)]


def obtenir(url):
    requete = urllib.request.Request(url, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(requete, timeout=40) as reponse:
        return reponse.read()


def lot_wiki(noms):
    titres = "|".join(nom.replace("_", " ") for nom in noms)
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "redirects": 1,
            "prop": "pageimages|langlinks",
            "piprop": "thumbnail",
            "pithumbsize": "420",
            "lllang": "fr",
            "lllimit": "50",
            "titles": titres,
        }
    )
    brut = json.loads(obtenir("https://en.wikipedia.org/w/api.php?" + query))
    requete = brut.get("query", {})
    normalise = {item["from"]: item["to"] for item in requete.get("normalized", [])}
    redirige = {item["from"]: item["to"] for item in requete.get("redirects", [])}
    pages = {page.get("title"): page for page in requete.get("pages", {}).values()}
    resultat = {}
    for nom in noms:
        titre = nom.replace("_", " ")
        titre = normalise.get(titre, titre)
        titre = redirige.get(titre, titre)
        page = pages.get(titre) or {}
        info = {}
        liens = page.get("langlinks") or []
        if liens:
            info["fr"] = liens[0].get("*") or liens[0].get("title") or ""
        source = (page.get("thumbnail") or {}).get("source")
        if source:
            info["img"] = source
        if info:
            resultat[nom] = info
    return resultat


def metadata():
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    noms = [nom for nom in lire_noms() if nom not in cache]
    print(f"déjà {len(cache)}, à interroger {len(noms)}", flush=True)
    for debut in range(0, len(noms), 40):
        groupe = noms[debut : debut + 40]
        try:
            cache.update(lot_wiki(groupe))
        except Exception as erreur:
            print("lot", debut, erreur, flush=True)
            time.sleep(12)
            try:
                cache.update(lot_wiki(groupe))
            except Exception as erreur2:
                print("abandon", debut, erreur2, flush=True)
        if debut % 200 == 0:
            CACHE.write_text(json.dumps(cache, ensure_ascii=False))
            print(f"meta {debut + len(groupe)} / {len(noms)} cache {len(cache)}", flush=True)
        time.sleep(1.1)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))
    print("meta fini", len(cache), flush=True)
    return cache


def image_utile(url):
    bas = url.lower()
    if any(mot in bas for mot in ("area.", "_area", "range", "distribution", "locator", "map")):
        return False
    return "/thumb/" in bas or "thumb" in bas


def convertir(nom, url):
    if not image_utile(url):
        return "echec"
    cible = IMAGES / f"{nom}.webp"
    if cible.exists() and cible.stat().st_size > 400:
        return "deja"
    time.sleep(0.4)
    try:
        brut = obtenir(url)
        image = Image.open(BytesIO(brut)).convert("RGB")
        image.thumbnail((420, 420))
        image.save(cible, "WEBP", quality=52, method=6)
        if cible.stat().st_size > 28000:
            image.thumbnail((320, 320))
            image.save(cible, "WEBP", quality=42, method=6)
        return "ok"
    except Exception:
        time.sleep(2)
        return "echec"


def images(cache, identifiants):
    IMAGES.mkdir(parents=True, exist_ok=True)
    travaux = [(identifiants[nom], info["img"]) for nom, info in cache.items() if info.get("img") and nom in identifiants]
    print("photos à tirer", len(travaux), flush=True)
    faits = {"ok": 0, "deja": 0, "echec": 0}
    with ThreadPoolExecutor(max_workers=2) as executant:
        futurs = [executant.submit(convertir, nom, url) for nom, url in travaux]
        for index, futur in enumerate(as_completed(futurs), start=1):
            faits[futur.result()] += 1
            if index % 200 == 0:
                print(index, faits, flush=True)
    print("images finies", faits, flush=True)


def identifiants():
    with MDD.open(newline="", encoding="utf-8") as fichier:
        return {row["sciName"]: row["id"] for row in csv.DictReader(fichier)}


if __name__ == "__main__":
    import subprocess

    ids = identifiants()
    cache = metadata()
    images(cache, ids)
    subprocess.check_call(["python3", "/workspace/scripts/build_mammiferes.py"])

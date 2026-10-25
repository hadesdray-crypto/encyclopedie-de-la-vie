#!/usr/bin/env python3
"""Cris vérifiés des mammifères.

1. On cherche sur GBIF les enregistrements sonores de mammifères venant d'archives scientifiques
   (muséums, phonothèques) — pas les observations d'amateurs (iNaturalist, observation.org…).
2. Chaque son est réduit à ses 15 secondes les plus fortes, puis analysé par BirdNET :
   si BirdNET entend un oiseau, un insecte, une grenouille, une voix humaine ou un moteur, le son est rejeté.
3. Le vent et le bruit de fond sont atténués (filtre sous 80 Hz + débruitage), puis volume égal pour tous. Un seul son par espèce. Jamais deux espèces avec le même fichier.
Les cris d'iNaturalist déjà présents passent aussi par BirdNET : ceux qui sont rejetés sont retirés.
Tout est écrit dans scripts/donnees/sons-journal.txt et src/data/sons-rapport.json.
"""
import hashlib, json, os, subprocess, sys, tempfile, time, urllib.parse, urllib.request
from pathlib import Path
import numpy as np

RACINE = Path(__file__).resolve().parents[2]
DATA = RACINE / "src/data"
SONS = RACINE / "public/s"
UA = "EncyclopedieLeonie/1.0 (application educative hors ligne)"
INAT = "50c9509d-22c7-4a22-a47d-8c48425ef4a7"
MOTS_ARCHIVE = ("museum", "muséum", "naturkunde", "natural history", "sound archive", "tierstimmen", "library of natural sounds",
                "phonothèque", "phonotheque", "sound library", "bioacoustic", "fonoteca", "archive", "naturalis", "smithsonian")
LICENCES = {"CC0_1_0": "CC0", "CC_BY_4_0": "CC BY", "CC_BY_NC_4_0": "CC BY-NC"}
SEUIL = 0.25

def j(msg):
    print(msg, flush=True)

def get(url, binaire=False, essais=4):
    for k in range(essais):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                d = r.read()
                return d if binaire else json.loads(d)
        except Exception as e:
            if k == essais - 1:
                j(f"  échec {url[:120]} : {e}")
                return None
            time.sleep(2 + 3 * k)

def lire(nom, defaut):
    p = DATA / nom
    return json.loads(p.read_text()) if p.exists() else defaut

ESPECES = json.loads((DATA / "mammiferes.json").read_text())["especes"]
PAR_LATIN = {e["latin"]: e for e in ESPECES}

# --- BirdNET ---------------------------------------------------------------
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
ANALYSEUR = Analyzer()
CLASSE = {}  # nom scientifique -> classe GBIF
def classe_de(nom):
    if nom not in CLASSE:
        m = get("https://api.gbif.org/v1/species/match?" + urllib.parse.urlencode({"name": nom})) or {}
        CLASSE[nom] = m.get("class") or ""
    return CLASSE[nom]

def intrus(wav, latin):
    """Ce que BirdNET entend d'autre que le mammifère. Liste vide = le son est propre."""
    rec = Recording(ANALYSEUR, str(wav), min_conf=SEUIL)
    rec.analyze()
    autres = []
    for d in rec.detections:
        nom = d.get("scientific_name", "")
        commun = d.get("common_name", "")
        if nom in ("Dog",) or commun == "Dog":
            if latin != "Canis familiaris":
                autres.append(f"chien {d['confidence']:.2f}")
            continue
        if nom in ("Human vocal", "Human non-vocal", "Human whistle", "Engine", "Siren", "Power tools", "Gun", "Fireworks", "Noise", "Environmental"):
            autres.append(f"{nom} {d['confidence']:.2f}")
            continue
        c = classe_de(nom)
        if c != "Mammalia":
            autres.append(f"{commun or nom} ({c or '?'}) {d['confidence']:.2f}")
    return autres

# --- Audio -----------------------------------------------------------------
def preparer(brut, sortie_mp3, dossier):
    """Garde les 15 secondes les plus fortes, volume égal. Renvoie le wav analysé, ou None."""
    src = Path(dossier) / "src.bin"; src.write_bytes(brut)
    wav = Path(dossier) / "tout.wav"
    if subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", "48000", "-t", "600", str(wav)]).returncode:
        return None
    import soundfile as sf
    x, sr = sf.read(str(wav))
    if len(x) < sr * 1:
        return None
    w = sr  # fenêtres d'une seconde
    rms = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, len(x) - w + 1, w)])
    if rms.max() < 10 ** (-40 / 20):
        return None  # presque muet
    n = min(15, len(rms))
    debut = int(np.argmax(np.convolve(rms, np.ones(n), "valid"))) if len(rms) > n else 0
    morceau = Path(dossier) / "morceau.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(debut), "-t", str(n), "-i", str(wav), "-af", "highpass=f=80,afftdn=nr=12:nf=-30,loudnorm=I=-18:TP=-2:LRA=11", "-ar", "48000", str(morceau)], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(morceau), "-ac", "1", "-ar", "44100", "-b:a", "64k", str(sortie_mp3)], check=True)
    return morceau

# --- 1. Les archives sonores de mammifères sur GBIF ---------------------------
def archives():
    f = get("https://api.gbif.org/v1/occurrence/search?classKey=359&mediaType=Sound&limit=0&facet=datasetKey&datasetKey.facetLimit=200") or {}
    garde = []
    for c in (f.get("facets") or [{}])[0].get("counts", []):
        k = c["name"]
        if k == INAT:
            continue
        d = get(f"https://api.gbif.org/v1/dataset/{k}") or {}
        org = get(f"https://api.gbif.org/v1/organization/{d.get('publishingOrganizationKey')}") or {}
        texte = f"{d.get('title','')} {org.get('title','')}".lower()
        ok = any(m in texte for m in MOTS_ARCHIVE) and "inaturalist" not in texte and "observation.org" not in texte
        j(f"jeu de données {k} : {c['count']} sons — « {d.get('title')} » ({org.get('title')}) → {'GARDÉ' if ok else 'écarté'}")
        if ok:
            garde.append((k, d.get("title", ""), org.get("title", "")))
    return garde

def enregistrements(cle):
    off = 0
    while True:
        r = get(f"https://api.gbif.org/v1/occurrence/search?classKey=359&mediaType=Sound&datasetKey={cle}&limit=300&offset={off}")
        if not r:
            return
        for o in r.get("results", []):
            yield o
        if r.get("endOfRecords") or not r.get("results"):
            return
        off += 300

def main():
    cris = set(lire("cris.json", []))
    credits = lire("credits-cris.json", {})
    verifies = set(lire("cris-verifies.json", []))
    rapport = {"gardes": {}, "rejets": {}, "retires_inat": {}}
    empreintes = {}
    for f in SONS.glob("*.mp3"):
        empreintes[hashlib.md5(f.read_bytes()).hexdigest()] = f.stem

    # Correspondance des noms GBIF -> nos espèces (synonymes compris)
    j("Correspondance des noms…")
    cle_espece = {}
    for e in ESPECES:
        m = get("https://api.gbif.org/v1/species/match?" + urllib.parse.urlencode({"name": e["latin"], "class": "Mammalia"})) or {}
        if m.get("speciesKey") and m.get("matchType") in ("EXACT", "FUZZY") and m.get("class") == "Mammalia":
            cle_espece[m["speciesKey"]] = e
    j(f"  {len(cle_espece)} espèces reconnues sur GBIF")

    for cle, titre, org in archives():
        n = 0
        for o in enregistrements(cle):
            e = cle_espece.get(o.get("speciesKey"))
            if not e or e["id"] in verifies or e.get("disparue"):
                continue
            if o.get("taxonRank") not in ("SPECIES", "SUBSPECIES"):
                continue
            for m in o.get("media") or []:
                if m.get("type") != "Sound" or not m.get("identifier"):
                    continue
                lic = (o.get("license") or m.get("license") or "").upper()
                lic_court = next((v for k, v in LICENCES.items() if k.replace("_", "").replace("1 0", "") in lic.replace("_", "").replace("/", "").replace("-", "").replace(".", "")), None)
                if not lic_court:
                    lic_court = "CC BY-NC" if "BY-NC" in lic or "BYNC" in lic else "CC BY" if "BY" in lic else "CC0" if "ZERO" in lic or "CC0" in lic else None
                if not lic_court or "ND" in lic:
                    continue
                brut = get(m["identifier"], binaire=True)
                if not brut or len(brut) > 80_000_000:
                    continue
                with tempfile.TemporaryDirectory() as d:
                    sortie = Path(d) / "s.mp3"
                    try:
                        wav = preparer(brut, sortie, d)
                    except Exception as ex:
                        j(f"  audio illisible {e['latin']} : {ex}"); wav = None
                    if not wav:
                        rapport["rejets"].setdefault(e["id"], []).append("muet ou illisible"); continue
                    autres = intrus(wav, e["latin"])
                    if autres:
                        rapport["rejets"].setdefault(e["id"], []).append(f"GBIF {o['key']} : " + ", ".join(autres))
                        j(f"  rejeté {e['latin']} ({o['key']}) : {', '.join(autres)}"); continue
                    h = hashlib.md5(sortie.read_bytes()).hexdigest()
                    if h in empreintes and empreintes[h] != e["id"]:
                        continue
                    (SONS / f"{e['id']}.mp3").write_bytes(sortie.read_bytes())
                    empreintes[h] = e["id"]
                cris.add(e["id"]); verifies.add(e["id"])
                credits[e["id"]] = {"auteur": m.get("rightsHolder") or m.get("creator") or o.get("recordedBy") or org, "licence": lic_court,
                                    "source": f"https://www.gbif.org/occurrence/{o['key']}", "archive": titre}
                rapport["gardes"][e["id"]] = {"latin": e["latin"], "gbif": o["key"], "archive": titre}
                n += 1
                j(f"  ✓ {e['nom']} ({e['latin']}) — {titre}")
                break
        j(f"{titre} : {n} cris vérifiés ajoutés")
        (DATA / "cris.json").write_text(json.dumps(sorted(cris), ensure_ascii=False))
        (DATA / "credits-cris.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1))
        (DATA / "cris-verifies.json").write_text(json.dumps(sorted(verifies), ensure_ascii=False))

    # 2. Les anciens cris d'iNaturalist : BirdNET, et on retire ceux où l'on entend autre chose.
    for i in sorted(cris - verifies):
        e = next((x for x in ESPECES if x["id"] == i), None)
        f = SONS / f"{i}.mp3"
        if not e or not f.exists():
            continue
        with tempfile.TemporaryDirectory() as d:
            wav = Path(d) / "a.wav"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(f), "-ac", "1", "-ar", "48000", str(wav)], check=True)
            autres = intrus(wav, e["latin"])
        if autres:
            rapport["retires_inat"][i] = f"{e['latin']} : " + ", ".join(autres)
            j(f"  retiré (iNaturalist) {e['nom']} : {', '.join(autres)}")
            f.unlink(); cris.discard(i); credits.pop(i, None)

    (DATA / "cris.json").write_text(json.dumps(sorted(cris), ensure_ascii=False))
    (DATA / "credits-cris.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1))
    (DATA / "cris-verifies.json").write_text(json.dumps(sorted(verifies), ensure_ascii=False))
    (DATA / "sons-rapport.json").write_text(json.dumps(rapport, ensure_ascii=False, indent=1))
    j(f"FIN : {len(verifies)} cris vérifiés, {len(cris)} cris en tout, {len(rapport['retires_inat'])} cris iNaturalist retirés.")

if __name__ == "__main__":
    main()

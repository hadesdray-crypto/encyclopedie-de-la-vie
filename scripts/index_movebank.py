#!/usr/bin/env python3
"""Index public Movebank studies by Latin name. No GPS tracks are stored."""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "EncyclopedieLeonie/1.0 (educational child app; public studies only)"
DATA = json.load(open("/workspace/src/data/mammiferes.json"))
LATINS = {e["latin"] for e in DATA["especes"]}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for essai in range(6):
        try:
            with urllib.request.urlopen(req, timeout=180) as res:
                return json.load(res)
        except Exception as exc:
            if "429" in str(exc) or "503" in str(exc) or "timed out" in str(exc).lower():
                time.sleep(15 + essai * 10)
                continue
            raise
    raise RuntimeError(url)


def capteur_de(texte):
    parts = [p.strip() for p in (texte or "").split(",") if p.strip()]
    for voulu in ("gps", "argos-doppler-shift", "sigfox-geolocation"):
        if voulu in parts:
            return voulu
    return parts[0] if parts else "gps"


def taxon_de(etude, capteur):
    url = (
        "https://www.movebank.org/movebank/service/public/json"
        f"?study_id={etude}&sensor_type={urllib.parse.quote(capteur)}&max_events_per_individual=1"
    )
    try:
        data = get(url)
    except Exception:
        return None
    individus = data.get("individuals") if isinstance(data, dict) else None
    if not individus:
        return None
    return individus[0].get("individual_taxon_canonical_name")


def cle_de(taxon):
    if not taxon:
        return None
    if taxon in LATINS:
        return taxon
    mots = taxon.split()
    if len(mots) >= 2:
        binomial = f"{mots[0]} {mots[1]}"
        if binomial in LATINS:
            return binomial
    return None


def main():
    etudes = get("https://www.movebank.org/movebank/service/public/json?entity_type=study")
    Path("/tmp/mdd/movebank-studies.json").write_text(json.dumps(etudes))
    chemin = Path("/workspace/src/data/suivi-gps.json")
    index = json.loads(chemin.read_text()) if chemin.exists() else {}
    for etude in etudes:
        capteur = capteur_de(etude.get("sensor_type_ids"))
        time.sleep(1.2)
        taxon = taxon_de(etude["id"], capteur)
        cle = cle_de(taxon)
        if not cle:
            continue
        index.setdefault(cle, []).append({
            "etude": etude["id"],
            "nom": etude.get("name") or str(etude["id"]),
            "capteur": capteur,
        })
        Path("/workspace/src/data/suivi-gps.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))
        print(cle, etude["id"], flush=True)
    Path("/workspace/src/data/suivi-gps.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))
    print("especes", len(index), flush=True)


if __name__ == "__main__":
    main()

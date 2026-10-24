#!/usr/bin/env python3
"""Ajoute à chaque espèce de src/data/mammiferes.json la liste des pays où elle vit
(codes à trois lettres, comme sur la carte), d'après la Mammal Diversity Database.

Usage : python3 scripts/ajout_pays.py chemin/vers/mdd.csv
(mdd.csv se trouve dans le dépôt GitHub mammaldiversity/mammaldiversity.github.io, dossier _data)
"""
import csv
import json
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
CATALOGUE = RACINE / "src/data/mammiferes.json"
CODES = RACINE / "scripts/sources/mdd_countryCodes.csv"
CARTE = RACINE / "src/data/monde.json"

def main():
    mdd = Path(sys.argv[1])
    codes = {}
    with CODES.open(encoding="utf-8") as f:
        for ligne in csv.DictReader(f):
            codes[ligne["countryName"].strip()] = ligne["countryCode"].strip()
    # Noms écrits autrement dans la base. Les îles qui appartiennent à un autre pays
    # (Canaries, Açores, Galápagos...) ne sont pas ajoutées : colorier tout le pays serait faux.
    codes.update({
        "Ireland": "IRL", "Cote d'Ivoire": "CIV", "Gambia": "GMB", "Bahamas": "BHS",
        "Kosovo": "KOS", "Palestine": "PSX", "Antarctica": "ATA", "Micronesia": "FSM",
        "Northern Marianas": "MNP", "Faroe": "FRO", "Pitcairn": "PCN", "Saint Helena": "SHN",
    })
    sur_carte = set(json.loads(CARTE.read_text())["pays"])
    pays_par_id = {}
    inconnus = set()
    with mdd.open(newline="", encoding="utf-8") as f:
        for ligne in csv.DictReader(f):
            liste = []
            for nom in (ligne["countryDistribution"] or "").split("|"):
                nom = nom.strip()
                if not nom or nom in ("NA", "Domesticated"):
                    continue
                douteux = nom.endswith("?")
                nom = nom.rstrip("?").strip()
                code = codes.get(nom)
                if not code:
                    inconnus.add(nom)
                    continue
                if douteux:
                    continue  # présence incertaine : on ne la colorie pas
                if code not in liste:
                    liste.append(code)
            pays_par_id[ligne["id"]] = liste
    data = json.loads(CATALOGUE.read_text())
    hors_carte = set()
    for espece in data["especes"]:
        liste = pays_par_id.get(espece["id"], [])
        for c in liste:
            if c not in sur_carte:
                hors_carte.add(c)
        if liste:
            espece["pays"] = liste
        else:
            espece.pop("pays", None)
    CATALOGUE.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("noms sans code :", sorted(inconnus)[:40])
    print("codes trop petits pour la carte 110m :", len(hors_carte))

main()

"""Les habitats en plus (eau douce, mer, terre ferme) d'après PHYLACINE 1.2 (Faurby et al. 2018, Ecology).

On ne garde que les données « Reported » (publiées), jamais les valeurs imputées.
Usage : python scripts/donnees/habitats.py chemin/vers/PHYLACINE_1.2/Data/Traits/Trait_data.csv
Sortie : src/data/habitats.json = { id : { "p": habitat principal corrigé (si besoin), "a": [habitats en plus] } }
"""
import csv, json, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
rows = {r["Binomial.1.2"].replace("_", " "): r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8"))}
cat = json.loads((RACINE / "src/data/mammiferes.json").read_text())
sortie = {}
for e in cat["especes"]:
    r = rows.get(e["latin"])
    if not r or r["Life.Habit.Method"] != "Reported":
        continue
    douce, mer, terre = r["Freshwater"] == "1", r["Marine"] == "1", r["Terrestrial"] == "1"
    milieu = e.get("milieu")
    fiche = {}
    en_plus = []
    if milieu == "Surtout dans la mer.":
        if douce and not mer:
            fiche["p"] = "eaudouce"  # dauphins de rivière : seulement en eau douce
        elif douce:
            en_plus.append("eaudouce")
        if terre:
            en_plus.append("sol")  # phoques, otaries : ils sortent sur la terre ferme
    elif milieu:
        if douce:
            en_plus.append("eaudouce")
        if mer:
            en_plus.append("mer")
    if en_plus:
        fiche["a"] = en_plus
    if fiche:
        sortie[e["id"]] = fiche
(RACINE / "src/data/habitats.json").write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
print(len(sortie), "espèces avec un habitat en plus")

#!/usr/bin/env python3
"""Estimations pour les fiches où une mesure n'est pas publiée.

Quand une espèce n'a pas de mesure publiée (poids, gestation, portée, longévité,
régime, milieu), on regarde les espèces du MÊME GENRE qui en ont une
(par exemple, les autres espèces de loups pour une espèce de loup mal connue).

- Pour un nombre : on donne la valeur du milieu (médiane) et l'écart, en pourcentage,
  entre les espèces cousines. On n'estime que si au moins 2 cousines sont mesurées
  et si elles ne sont pas trop différentes (écart ≤ 60 %).
- Pour le régime et le milieu : seulement si au moins 2 cousines sont connues
  et que les trois quarts d'entre elles sont d'accord.

La fiche écrit toujours « estimé » et le nombre d'espèces utilisées : on ne fait
jamais passer une estimation pour une mesure.

Usage : python3 scripts/estimations.py   →   src/data/estimations.json
"""
import json
import re
import statistics
from collections import Counter, defaultdict
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
ESPECES = json.loads((RACINE / "src/data/mammiferes.json").read_text())["especes"]


def nombre(texte):
    m = re.search(r"(\d+(?:[  ]\d{3})*(?:,\d+)?)", texte or "")
    return float(m.group(1).replace(" ", "").replace(" ", "").replace(",", ".")) if m else None


def grammes(t):
    v = nombre(t)
    if v is None:
        return None
    return v * 1000 if re.search(r"\bkg\b", t) else v


def jours_gestation(t):
    m = re.search(r"\((\d+) jours\)", t or "")
    if m:
        return float(m.group(1))
    v = nombre(t)
    if v is None:
        return None
    return v * 30.44 if "mois" in t else v


def annees(t):
    v = nombre(t)
    if v is None:
        return None
    return v / 365.25 if "jours" in t else v


def portee(t):
    return nombre(t)


def virgule(x, d):
    return f"{x:.{d}f}".replace(".", ",")


def ecrire_masse(g):
    if g < 10:
        return f"{virgule(g, 1)} g"
    if g < 1000:
        return f"{round(g)} g"
    kg = g / 1000
    return f"{virgule(kg, 1)} kg" if kg < 100 else f"{round(kg)} kg"


def ecrire_gestation(j):
    if j < 60:
        return f"{round(j)} jours"
    mois = j / 30.44
    return f"{virgule(mois, 1)} mois"


def ecrire_annees(a):
    return f"{virgule(a, 1)} ans" if a >= 1 else f"{round(a * 365.25)} jours"


def ecrire_portee(n):
    return virgule(n, 1).replace(",0", "")


NUMERIQUES = {
    "masse": (grammes, ecrire_masse, "environ"),
    "gestation": (jours_gestation, ecrire_gestation, "environ"),
    "portee": (portee, ecrire_portee, "en moyenne"),
    "longevite": (annees, ecrire_annees, "record d'environ"),
}
CATEGORIES = ["regime", "milieu"]


def main():
    par_genre = defaultdict(list)
    for e in ESPECES:
        if not e.get("disparue"):
            par_genre[e["latin"].split()[0]].append(e)

    sortie = {}
    comptes = Counter()
    for e in ESPECES:
        if e.get("disparue"):
            continue
        cousines = [c for c in par_genre[e["latin"].split()[0]] if c["id"] != e["id"]]
        est = {}
        for cle, (lire, ecrire, prefixe) in NUMERIQUES.items():
            if e.get(cle):
                continue
            valeurs = [v for v in (lire(c.get(cle)) for c in cousines if c.get(cle)) if v]
            if len(valeurs) < 2:
                continue
            mediane = statistics.median(valeurs)
            ecart = (max(valeurs) - min(valeurs)) / 2 / mediane * 100
            if ecart > 60:
                continue
            est[cle] = {"t": f"{prefixe} {ecrire(mediane)}", "p": max(5, round(ecart / 5) * 5), "n": len(valeurs)}
            comptes[cle] += 1
        for cle in CATEGORIES:
            if e.get(cle):
                continue
            valeurs = [c[cle] for c in cousines if c.get(cle)]
            if len(valeurs) < 2:
                continue
            valeur, nb = Counter(valeurs).most_common(1)[0]
            if nb / len(valeurs) < 0.75:
                continue
            est[cle] = {"t": valeur, "n": len(valeurs), "accord": round(nb / len(valeurs) * 100)}
            comptes[cle] += 1
        if est:
            sortie[e["id"]] = est
    (RACINE / "src/data/estimations.json").write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
    print(f"{len(sortie)} espèces complétées :", dict(comptes))


if __name__ == "__main__":
    main()

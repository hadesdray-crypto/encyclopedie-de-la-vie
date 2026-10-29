#!/usr/bin/env python3
"""Célébrité des animaux : nombre de visites de leur page Wikipédia en français sur les 12 derniers mois.

Tourne sur GitHub Actions (.github/workflows/notoriete.yml), parce qu'il faut Internet.
Résultat : src/data/notoriete.json, { identifiant de l'espèce : visites }.
L'application s'en sert pour montrer d'abord les animaux que Leonie connaît (src/lib/connu.ts).
Source : API publique des statistiques de Wikimedia (pas de données personnelles).
"""
import datetime as dt
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
DATA = RACINE / "src/data"
UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"


def visites(titre, debut, fin):
    url = (
        "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia/all-access/user/"
        + urllib.parse.quote(titre.replace(" ", "_"), safe="")
        + f"/monthly/{debut}/{fin}"
    )
    for essai in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as rep:
                return sum(i["views"] for i in json.load(rep).get("items", []))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return 0
            time.sleep(5 * (essai + 1))
        except Exception:
            time.sleep(5 * (essai + 1))
    return None


def main():
    articles = json.loads((DATA / "articles-fr.json").read_text())
    ancien = json.loads((DATA / "notoriete.json").read_text() or "{}")
    aujourdhui = dt.date.today().replace(day=1)
    fin = aujourdhui - dt.timedelta(days=1)
    debut = (fin.replace(day=1) - dt.timedelta(days=330)).replace(day=1)
    d, f = debut.strftime("%Y%m%d00"), fin.strftime("%Y%m%d00")
    print(f"Visites du {debut} au {fin}, {len(articles)} articles")
    resultat = {}
    for n, (ident, titre) in enumerate(articles.items(), 1):
        v = visites(titre, d, f)
        if v is None:
            v = ancien.get(ident, 0)
        if v:
            resultat[ident] = v
        time.sleep(0.08)
        if n % 250 == 0:
            print(n, titre, v)
    resultat = dict(sorted(resultat.items(), key=lambda kv: -kv[1]))
    (DATA / "notoriete.json").write_text(json.dumps(resultat, ensure_ascii=False, separators=(",", ":")))
    top = list(resultat)[:10]
    print("Les plus connus :", [articles[i] for i in top])


if __name__ == "__main__":
    main()

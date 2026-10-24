#!/usr/bin/env python3
"""Le carnet des chiens de Plume : toutes les races de chiens reconnues.
Tourne sur GitHub Actions (.github/workflows/chiens.yml), qui a accès à Internet.

Étapes :
  explorer   Affiche des extraits des sources, pour vérifier leur forme.
  collecter  Construit src/data/chiens.json et les photos public/chiens/.

Sources : la nomenclature de la FCI (Fédération cynologique internationale) pour la liste,
les groupes et les pays ; Wikipédia en français pour le texte, la taille et le poids ;
Wikidata et Wikimedia Commons pour les photos (licences libres, avec l'auteur).
On n'invente rien : une valeur absente reste « Non connu ».
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"


def get(url, data=None, accept=None):
    for essai in range(4):
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, **({"Accept": accept} if accept else {})})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            print("  erreur", url, e)
            time.sleep(3 * (essai + 1))
    return ""


def sparql(q):
    t = get("https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q), accept="application/sparql-results+json")
    return json.loads(t)["results"]["bindings"] if t else []


def explorer():
    print("==== FCI nomenclature (fr)")
    for url in ["https://www.fci.be/fr/Nomenclature/", "https://www.fci.be/fr/nomenclature/1-Chiens-de-berger-et-de-bouvier-sauf-chiens-de-bouvier-suisses-44.html"]:
        t = get(url)
        print("----", url, len(t))
        liens = sorted(set(re.findall(r'href="([^"]*[Nn]omenclature[^"]*)"', t)))
        print("liens:", liens[:80])
        i = t.find("Berger")
        print(re.sub(r"\s+", " ", t[i - 1500 : i + 2500]) if i > 0 else t[:3000])
    print("==== une race FCI")
    t = get("https://www.fci.be/fr/nomenclature/BERGER-ALLEMAND-166.html")
    print(len(t)); print(re.sub(r"\s+", " ", re.sub(r"<script.*?</script>", "", t, flags=re.S))[:6000])
    print("==== Wikidata : races de chiens (Q39367)")
    r = sparql("SELECT (COUNT(DISTINCT ?r) AS ?n) WHERE { ?r wdt:P31 wd:Q39367 }")
    print(r)
    r = sparql("""SELECT ?p ?pLabel (COUNT(?r) AS ?n) WHERE { ?r wdt:P31 wd:Q39367 ; ?pd ?v . ?p wikibase:directClaim ?pd .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". } } GROUP BY ?p ?pLabel ORDER BY DESC(?n) LIMIT 60""")
    for x in r:
        print(x["p"]["value"].split("/")[-1], x["pLabel"]["value"], x["n"]["value"])
    print("==== Wikipédia fr : Berger allemand (wikitexte)")
    t = get("https://fr.wikipedia.org/w/index.php?title=Berger_allemand&action=raw")
    print(t[:5000])
    t = get("https://fr.wikipedia.org/w/index.php?title=Caniche&action=raw")
    print(t[:3000])


if __name__ == "__main__":
    etape = sys.argv[1] if len(sys.argv) > 1 else "explorer"
    {"explorer": explorer}[etape]()

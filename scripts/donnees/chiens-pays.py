#!/usr/bin/env python3
"""Relie l'origine de chaque race (texte de Wikipédia) aux codes de pays de la carte,
pour pouvoir chercher les chiens et les chats « sur la carte ». À lancer après chiens.py."""
import json, re, unicodedata
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "src/data"
def plier(t): return unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode()
pays = json.loads((R / "pays.json").read_text())
noms = {plier(v["n"]): k for k, v in pays.items()}
ALIAS = {"angleterre": "GBR", "ecosse": "GBR", "pays de galles": "GBR", "grande-bretagne": "GBR", "royaume-uni": "GBR", "tibet": "CHN", "siberie": "RUS", "amerique": "USA", "usa": "USA", "perse": "IRN", "hollande": "NLD", "tchequie": "CZE", "republique tcheque": "CZE", "bosnie": "BIH", "viet nam": "VNM", "canaries": "ESP", "majorque": "ESP", "sardaigne": "ITA", "sicile": "ITA", "corse": "FRA", "bretagne": "FRA", "pyrenees": "FRA", "laponie": "FIN", "tchecoslovaquie": "CZE", "yougoslavie": "SRB", "birmanie": "MMR", "coree": "KOR"}
d = json.loads((R / "chiens.json").read_text())
for k in ("chiens", "chats"):
    for r in d[k]:
        t = plier(r.get("origine", ""))
        codes = []
        for nom, c in list(ALIAS.items()) + list(noms.items()):
            if re.search(r"(^|[^a-z])" + re.escape(nom) + r"([^a-z]|$)", t) and c not in codes:
                codes.append(c)
        if codes:
            r["pays"] = codes
(R / "chiens.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")))

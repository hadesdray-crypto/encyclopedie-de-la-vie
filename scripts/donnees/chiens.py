#!/usr/bin/env python3
"""Le carnet des chiens et des chats de Plume : les races de chiens et de chats.
Tourne sur GitHub Actions (.github/workflows/chiens.yml), qui a accès à Internet.

Étape :
  collecter [N]   Construit src/data/chiens.json et les photos public/chiens/
                  (N = nombre de races pour un essai ; 0 = toutes).

Sources : Wikipédia en français (articles avec l'« Infobox Race », charte chien ou chat)
pour le texte, l'origine, le groupe FCI, la taille, le poids, la robe, le caractère ;
Wikidata pour l'espérance de vie et la taille des portées ; Wikimedia Commons pour les
photos (seulement CC0, domaine public, CC BY et CC BY-SA, toujours avec l'auteur).
On n'invente rien : une valeur absente reste « Non connu » dans l'application.
"""
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"
RACINE = Path(__file__).resolve().parents[2]
DATA = RACINE / "src/data"
PHOTOS = RACINE / "public/chiens"
API = "https://fr.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"

# Les dix groupes de la FCI (Fédération cynologique internationale).
GROUPES_FCI = {
    "1": "Chiens de berger et de bouvier",
    "2": "Pinschers, schnauzers, molosses et chiens de montagne",
    "3": "Terriers",
    "4": "Teckels",
    "5": "Spitz et chiens de type primitif",
    "6": "Chiens courants et chiens de recherche au sang",
    "7": "Chiens d'arrêt",
    "8": "Rapporteurs, leveurs de gibier et chiens d'eau",
    "9": "Chiens d'agrément et de compagnie",
    "10": "Lévriers",
}
# Photos retirées à la main après vérification (carte, statue, logo, autre animal…).
RETIREES = {l.strip() for l in (RACINE / "scripts/chiens-photos-retirees.txt").read_text().splitlines() if l.strip() and not l.startswith("#")} if (RACINE / "scripts/chiens-photos-retirees.txt").exists() else set()
LICENCES_OK = ("cc0", "cc-zero", "public domain", "domaine public", "pd-", "cc by", "cc-by")


def get(url, binaire=False):
    for essai in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                b = r.read()
                return b if binaire else b.decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            print("  erreur", url[:120], e)
            time.sleep(3 * (essai + 1))
    return b"" if binaire else ""


def api(base, **p):
    p.setdefault("format", "json")
    p.setdefault("formatversion", "2")
    t = get(base + "?" + urllib.parse.urlencode(p))
    return json.loads(t) if t else {}


def sparql(q):
    t = get("https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q))
    return json.loads(t)["results"]["bindings"] if t else []


def pages_avec_infobox():
    titres, suite = [], {}
    while True:
        r = api(API, action="query", list="embeddedin", eititle="Modèle:Infobox Race", einamespace="0", eilimit="500", **suite)
        titres += [x["title"] for x in r.get("query", {}).get("embeddedin", [])]
        if "continue" not in r:
            return titres
        suite = {"eicontinue": r["continue"]["eicontinue"], "continue": r["continue"]["continue"]}


def wikitextes(titres):
    """Wikitexte et élément Wikidata de chaque article, par paquets de 50."""
    res = {}
    for i in range(0, len(titres), 50):
        r = api(API, action="query", prop="revisions|pageprops", rvprop="content", rvslots="main", ppprop="wikibase_item", titles="|".join(titres[i : i + 50]))
        for pg in r.get("query", {}).get("pages", []):
            if "revisions" in pg:
                res[pg["title"]] = (pg["revisions"][0]["slots"]["main"]["content"], pg.get("pageprops", {}).get("wikibase_item"))
        time.sleep(0.5)
    return res


def bloc_modele(texte, debut):
    """Le texte d'un modèle {{…}} complet, en comptant les accolades."""
    i = texte.find(debut)
    if i < 0:
        return ""
    n, j = 0, i
    while j < len(texte):
        if texte.startswith("{{", j):
            n += 1
            j += 2
        elif texte.startswith("}}", j):
            n -= 1
            j += 2
            if n == 0:
                return texte[i + 2 : j - 2]
        else:
            j += 1
    return ""


def infobox(texte):
    corps = bloc_modele(texte, "{{Infobox Race")
    morceaux, courant, n, k = [], "", 0, 0
    while k < len(corps):  # découper sur les « | » de premier niveau
        c2 = corps[k : k + 2]
        if c2 in ("{{", "[["):
            n += 1
            courant += c2
            k += 2
        elif c2 in ("}}", "]]"):
            n -= 1
            courant += c2
            k += 2
        elif corps[k] == "|" and n == 0:
            morceaux.append(courant)
            courant = ""
            k += 1
        else:
            courant += corps[k]
            k += 1
    morceaux.append(courant)
    champs = {}
    for m in morceaux[1:]:
        if "=" in m:
            cle, v = m.split("=", 1)
            champs[cle.strip().lower()] = v.strip()
    return champs


def nettoyer(v):
    """Wikitexte → texte simple."""
    if not v:
        return ""
    v = re.sub(r"<!--.*?-->", "", v, flags=re.S)
    v = re.sub(r"<ref[^>]*/>", "", v)
    v = re.sub(r"<ref[^>]*>.*?</ref>", "", v, flags=re.S)
    v = re.sub(r"<br\s*/?>", " ; ", v)
    v = re.sub(r"<[^>]+>", "", v)
    v = re.sub(r"\{\{\s*drapeau[^}]*\}\}", "", v, flags=re.I)
    v = re.sub(r"\{\{\s*(?:nombre|nobr|unité)\s*\|([^|}]*)\|?([^}]*)\}\}", lambda m: (m.group(1) + " " + m.group(2).replace("|", " ")).strip(), v, flags=re.I)
    v = re.sub(r"\{\{\s*lien\s*\|([^}]*)\}\}", lambda m: lien(m.group(1)), v, flags=re.I)
    v = re.sub(r"\{\{\s*([A-ZÉ][^{}|=]{1,40})\s*\}\}", r"\1", v)  # {{France}} → France
    v = re.sub(r"\{\{[^{}]*\}\}", "", v)
    v = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", v)
    v = v.replace("'''", "").replace("''", "")
    v = re.sub(r"(\s*;\s*)+", " ; ", v)
    v = re.sub(r"\s+", " ", v).strip(" ;,")
    return v


def lien(p):
    parts = [x.strip() for x in p.split("|")]
    nommes = dict(x.split("=", 1) for x in parts if "=" in x)
    for cle in ("texte", "fr"):
        if nommes.get(cle):
            return nommes[cle].strip()
    libres = [x for x in parts if "=" not in x]
    return libres[-1] if libres else ""


def extrait(titre):
    r = api(API, action="query", prop="extracts", explaintext="1", exsectionformat="wiki", titles=titre)
    pg = (r.get("query", {}).get("pages") or [{}])[0]
    return pg.get("extract", "")


def phrases(t, n):
    t = re.sub(r"\s+", " ", t or "").strip()
    ps = re.split(r"(?<=[.!?])\s+(?=[A-ZÉÈÀÂÔÎ«])", t)
    return " ".join(ps[:n]).strip()


def sections(texte):
    """L'extrait découpé : {titre de section : texte}. L'introduction a le titre ''."""
    res, titre, buf = {}, "", []
    for ligne in texte.split("\n"):
        m = re.match(r"^(=+)\s*(.*?)\s*\1\s*$", ligne)
        if m:
            res.setdefault(titre, " ".join(buf))
            titre, buf = m.group(2), []
        else:
            buf.append(ligne)
    res.setdefault(titre, " ".join(buf))
    return res


def phrase_avec(secs, expressions):
    for v in secs.values():
        for p in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", v)):
            if any(e in p.lower() for e in expressions) and 20 < len(p) < 260:
                return p.strip()
    return ""


def chercher_section(secs, *mots):
    for t, v in secs.items():
        if t and any(m in t.lower() for m in mots) and len(v.strip()) > 40:
            return v
    return ""


def wikidata(qids):
    res = {}
    for i in range(0, len(qids), 150):
        vals = " ".join("wd:" + q for q in qids[i : i + 150])
        for x in sparql(
            f"""SELECT ?r ?vie ?vieU ?portee WHERE {{ VALUES ?r {{ {vals} }}
              OPTIONAL {{ ?r p:P2250/psv:P2250 [ wikibase:quantityAmount ?vie ; wikibase:quantityUnit ?vieU ] }}
              OPTIONAL {{ ?r wdt:P7725 ?portee }} }}"""
        ):
            q = x["r"]["value"].split("/")[-1]
            d = res.setdefault(q, {})
            if "vie" in x and "vie" not in d and x.get("vieU", {}).get("value", "").endswith("/Q577"):
                d["vie"] = f"environ {float(x['vie']['value']):g} ans".replace(".", ",")
            if "portee" in x and "portee" not in d:
                d["portee"] = f"environ {float(x['portee']['value']):g} petits".replace(".", ",")
        time.sleep(1)
    return res


def especes():
    """Ce qui est vrai pour tous les chiens (Q144) et tous les chats (Q146), d'après Wikidata :
    gestation (P3063), espérance de vie (P2250), taille de portée (P7725). Valeur + unité."""
    res = {}
    for nom, q in (("chien", "Q144"), ("chat", "Q146")):
        d = {}
        for prop in ("P3063", "P2250", "P7725"):
            for x in sparql(f"""SELECT ?v ?u WHERE {{ wd:{q} p:{prop} ?st . ?st psv:{prop} ?n .
                  ?n wikibase:quantityAmount ?v . OPTIONAL {{ ?n wikibase:quantityUnit ?u }} }}"""):
                d.setdefault(prop, []).append([x["v"]["value"], x.get("u", {}).get("value", "").split("/")[-1]])
        res[nom] = d
        print("espèce", nom, d)
    return res


def info_image(fichier):
    r = api(COMMONS, action="query", prop="imageinfo", iiprop="url|extmetadata|mime", iiurlwidth="480", titles="File:" + fichier)
    pg = (r.get("query", {}).get("pages") or [{}])[0]
    ii = (pg.get("imageinfo") or [None])[0]
    if not ii or ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
        return None
    meta = ii.get("extmetadata", {})
    licence = re.sub(r"<[^>]+>", "", meta.get("LicenseShortName", {}).get("value", "")).strip()
    bas = licence.lower()
    if not licence or not any(l in bas for l in LICENCES_OK) or re.search(r"\b(nc|nd)\b", bas):
        return None
    auteur = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", ""))).strip() or "Auteur inconnu"
    return {"url": ii.get("thumburl") or ii["url"], "licence": licence, "auteur": auteur[:120], "page": ii.get("descriptionurl", "")}


def telecharger_photo(info, chemin):
    from PIL import Image

    im = Image.open(BytesIO(get(info["url"], binaire=True))).convert("RGB")
    im.thumbnail((420, 420))
    chemin.parent.mkdir(parents=True, exist_ok=True)
    im.save(chemin, "WEBP", quality=62)


def ident(titre):
    t = unicodedata.normalize("NFKD", titre).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\(.*?\)", "", t)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def collecter(limite=0):
    fichier = DATA / "chiens.json"
    deja = json.loads(fichier.read_text()) if fichier.exists() else {}
    anciennes = {r["id"]: r for k in ("chiens", "chats") for r in deja.get(k, [])}
    titres = pages_avec_infobox()
    print("pages avec « Infobox Race » :", len(titres))
    textes = wikitextes(titres)
    races = []
    for titre, (wt, qid) in textes.items():
        ib = infobox(wt)
        charte = ib.get("charte", "").strip().lower()
        if charte in ("chien", "chat"):
            races.append((titre, qid, charte, ib, wt))
    print("chiens :", sum(1 for r in races if r[2] == "chien"), "· chats :", sum(1 for r in races if r[2] == "chat"))
    if limite:
        races = [r for r in races if r[2] == "chien"][: limite // 2] + [r for r in races if r[2] == "chat"][: limite // 2]
    wd = wikidata([q for _, q, *_ in races if q])
    sortie = {"groupes": GROUPES_FCI, "chiens": [], "chats": [], "especes": especes()}
    for n, (titre, qid, charte, ib, wt) in enumerate(races):
        rid = ident(titre)
        nom = nettoyer(ib.get("nom")) or re.sub(r"\s*\(.*?\)", "", titre)
        secs = sections(extrait(titre))
        r = {
            "id": rid,
            "nom": nom[:1].upper() + nom[1:],
            "wiki": titre,
            "origine": nettoyer(ib.get("origine") or ib.get("pays d'origine") or ib.get("région d'origine")),
            "taille": nettoyer(ib.get("taille")),
            "poids": nettoyer(ib.get("poids")),
            "silhouette": nettoyer(ib.get("silhouette") or ib.get("corps")),
            "poil": nettoyer(ib.get("poil")),
            "robe": nettoyer(ib.get("robe")),
            "tete": nettoyer(ib.get("tête")),
            "yeux": nettoyer(ib.get("yeux")),
            "oreilles": nettoyer(ib.get("oreilles")),
            "queue": nettoyer(ib.get("queue")),
            "caractere": nettoyer(ib.get("caractère")),
            "intro": phrases(secs.get("", ""), 4),
            "histoire": phrases(chercher_section(secs, "histoire", "origine"), 3),
            "utilisation": phrases(chercher_section(secs, "utilisation", "fonction", "travail", "aptitude"), 2),
            "vie_texte": phrase_avec(secs, ("durée de vie", "espérance de vie", "vit en moyenne")),
        }
        # Le poids est parfois rangé dans « silhouette » ou « corps ».
        if not r["poids"] and re.search(r"\d\s*kg", r["silhouette"]):
            r["poids"], r["silhouette"] = r["silhouette"], ""
        for k in list(r):
            if k not in ("id", "wiki") and isinstance(r[k], str) and len(re.findall(r"[A-Za-zÀ-ÿ0-9]", r[k])) < 3:
                r[k] = ""
        if charte == "chien":
            g = re.sub(r"\D", "", ib.get("groupe fci", ""))
            r["groupe"] = g if g in GROUPES_FCI else ""
            r["fci"] = re.sub(r"\D", "", ib.get("numero fci", "") or ib.get("numéro fci", ""))
        if qid in wd:
            r.update(wd[qid])
        # Photos : celle de l'infobox, puis une de l'article, seulement si son nom ou sa légende
        # parle bien de cette race (pour ne pas montrer un autre animal). Licences libres seulement.
        mots = [m for m in ident(nom).split("-") if len(m) >= 4] or [ident(nom)]
        candidats = [nettoyer(ib.get("image", ""))]
        for f, reste in re.findall(r"\[\[(?:Fichier|File|Image)\s*:\s*([^|\]]+)((?:\|[^\]]*)?)\]\]", wt):
            if all(m in ident(f + " " + reste) for m in mots):
                candidats.append(f)
        photos, vus, ancien = [], set(), anciennes.get(rid, {})
        for f in candidats:
            f = f.strip()
            if not f or f in vus or f in RETIREES or len(photos) >= 2 or not re.search(r"\.(jpe?g|png|webp)$", f, re.I):
                continue
            vus.add(f)
            garde = next((p for p in ancien.get("photos", []) if p["fichier"] == f and (RACINE / "public" / p["src"]).exists()), None)
            if garde:
                photos.append(garde)
                continue
            info = info_image(f)
            if not info:
                continue
            nom_fichier = f"{rid}-{len(photos) + 1}.webp"
            try:
                telecharger_photo(info, PHOTOS / nom_fichier)
            except Exception as e:  # noqa: BLE001
                print("  photo impossible", f, e)
                continue
            photos.append({"fichier": f, "src": "chiens/" + nom_fichier, "auteur": info["auteur"], "licence": info["licence"], "page": info["page"]})
        r = {k: v for k, v in r.items() if v not in ("", None)}
        r["photos"] = photos
        sortie["chiens" if charte == "chien" else "chats"].append(r)
        if n % 25 == 0:
            print(f"{n}/{len(races)} {r['nom']} · {len(photos)} photo(s)", flush=True)
            fichier.write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
        time.sleep(0.2)
    vus = {}
    for k in ("chiens", "chats"):
        sortie[k].sort(key=lambda x: x["nom"].lower())
        for r in sortie[k]:  # identifiants uniques
            vus[r["id"]] = vus.get(r["id"], 0) + 1
            if vus[r["id"]] > 1:
                r["id"] = f"{r['id']}-{vus[r['id']]}"
    fichier.write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")))
    print("fini :", len(sortie["chiens"]), "chiens,", len(sortie["chats"]), "chats")
    for r in sortie["chiens"][:4] + sortie["chats"][:3]:
        print(json.dumps(r, ensure_ascii=False, indent=1)[:3000])


if __name__ == "__main__":
    args = sys.argv[1:] or ["collecter"]
    if args[0] == "collecter":
        collecter(int(args[1]) if len(args) > 1 else 0)

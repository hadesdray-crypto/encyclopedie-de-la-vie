#!/usr/bin/env python3
"""Images réalistes pour l'arbre de la vie et l'accueil.
Pour chaque étape, on prend l'image principale d'un article de Wikipédia en français,
seulement si sa licence est libre (CC0, domaine public, CC BY, CC BY-SA), avec l'auteur.
« photo » = vraie photo ou vue au microscope ; « reconstitution » = image faite d'après les fossiles ou les connaissances ; « fossile » = vrai fossile ou squelette.
Sortie : public/evo/<id>.webp et src/data/images-evolution.json
"""
import json, re, time, urllib.parse, urllib.request
from io import BytesIO
from pathlib import Path

UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"
R = Path(__file__).resolve().parents[2]
SORTIE = R / "public/evo"

# id de l'étape : (articles à essayer dans l'ordre, sorte)
ETAPES = {
    "terre": (["Hadéen", "Terre"], "reconstitution"), "molecules": (["Expérience de Miller-Urey"], "modele"), "briques": (["Nucléotide"], "modele"),
    "arn": (["Acide ribonucléique"], "modele"), "proteines": (["Protéine"], "modele"), "adn": (["Acide désoxyribonucléique"], "modele"),
    "luca": (["Source hydrothermale", "Fumeur noir"], "photo"), "bacteries": (["Bactérie", "Escherichia coli"], "photo"),
    "cyanobacteries": (["Stromatolithe", "Cyanobacteria"], "photo"), "bacteries-ventre": (["Escherichia coli"], "photo"),
    "bacteries-sol": (["Streptomyces"], "photo"), "bacteries-maladies": (["Salmonella"], "photo"), "archees": (["Archaea", "Halobacterium"], "photo"),
    "archees-chaleur": (["Grand Prismatic Spring"], "photo"), "archees-methane": (["Methanosarcina", "Méthanogène"], "photo"),
    "asgard": (["Fumeur noir", "Source hydrothermale"], "photo"), "eucaryotes": (["Euglena", "Volvox"], "photo"),
    "autres-eucaryotes": (["Paramécie", "Amibe"], "photo"), "plantes": (["Chêne pédonculé"], "photo"), "mousses": (["Bryophyta", "Mousse (plante)"], "photo"),
    "fougeres": (["Fougère", "Polypodiophyta"], "photo"), "coniferes": (["Pinophyta", "Conifère"], "photo"), "fleurs": (["Coquelicot", "Papaver rhoeas"], "photo"),
    "champignons": (["Amanita muscaria", "Fungi"], "photo"), "animaux": (["Tigre"], "photo"), "eponges": (["Porifera", "Éponge"], "photo"),
    "meduses": (["Aurelia aurita"], "photo"), "vers": (["Lombric commun", "Lumbricus terrestris"], "photo"), "mollusques": (["Nautilus pompilius", "Nautile"], "photo"),
    "pattes": (["Coccinelle à sept points"], "photo"), "insectes": (["Machaon", "Papilio machaon"], "photo"), "araignees": (["Salticidae", "Araignée sauteuse"], "photo"),
    "crustaces": (["Homard européen", "Crabe"], "photo"), "mille-pattes": (["Glomeris marginata", "Iule"], "photo"), "echinodermes": (["Asterias rubens", "Étoile de mer"], "photo"),
    "vertebres": (["Amphiprion ocellaris", "Poisson-clown"], "photo"), "sans-machoires": (["Agnatha"], "reconstitution"), "requins": (["Grand requin blanc"], "photo"),
    "nageoires-rayonnees": (["Poisson rouge", "Carassius auratus"], "photo"), "nageoires-charnues": (["Cœlacanthe", "Latimeria chalumnae"], "photo"),
    "hors": (["Tiktaalik"], "fossile"), "amphibiens": (["Rainette verte", "Grenouille"], "photo"), "oeuf": (["Hylonomus"], "reconstitution"),
    "reptiles": (["Iguane vert", "Iguana iguana"], "photo"), "tortues": (["Tortue verte", "Chelonia mydas"], "photo"), "lezards": (["Lézard vert occidental", "Caméléon"], "photo"),
    "crocodiles": (["Crocodile du Nil"], "photo"), "dinosaures": (["Tyrannosaurus", "Triceratops"], "fossile"), "oiseaux": (["Rouge-gorge familier"], "photo"),
    "mammiferes": (["Renard roux"], "photo"), "monotremes": (["Ornithorynque"], "photo"), "marsupiaux": (["Koala"], "photo"),
    "placentaires": (["Éléphant d'Asie", "Hippopotame"], "photo"),
    # Les médaillons de l'accueil
    "accueil-commencer": (["Terre"], "photo"), "accueil-reptiles": (["Caméléon panthère", "Tortue verte"], "photo"),
}
OK = ("cc0", "cc-zero", "public domain", "domaine public", "pd-", "cc by", "cc-by")


def get(url, binaire=False):
    for e in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                b = r.read()
                return b if binaire else b.decode()
        except Exception as x:  # noqa: BLE001
            print("  erreur", url[:100], x)
            time.sleep(3 * (e + 1))
    return b"" if binaire else ""


def api(base, **p):
    p.update(format="json", formatversion="2")
    t = get(base + "?" + urllib.parse.urlencode(p))
    return json.loads(t) if t else {}


def image_article(titre):
    r = api("https://fr.wikipedia.org/w/api.php", action="query", prop="pageimages", piprop="name", titles=titre, redirects="1")
    pg = (r.get("query", {}).get("pages") or [{}])[0]
    return pg.get("pageimage")


def info(fichier):
    r = api("https://commons.wikimedia.org/w/api.php", action="query", prop="imageinfo", iiprop="url|extmetadata|mime", iiurlwidth="700", titles="File:" + fichier)
    pg = (r.get("query", {}).get("pages") or [{}])[0]
    ii = (pg.get("imageinfo") or [None])[0]
    if not ii or ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
        return None
    m = ii.get("extmetadata", {})
    lic = re.sub(r"<[^>]+>", "", m.get("LicenseShortName", {}).get("value", "")).strip()
    if not lic or not any(o in lic.lower() for o in OK) or re.search(r"\b(nc|nd)\b", lic.lower()):
        return None
    aut = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.get("Artist", {}).get("value", ""))).strip() or "Auteur inconnu"
    return {"url": ii.get("thumburl") or ii["url"], "licence": lic, "auteur": aut[:120], "page": ii.get("descriptionurl", "")}


def main():
    from PIL import Image
    SORTIE.mkdir(parents=True, exist_ok=True)
    res = {}
    for eid, (titres, sorte) in ETAPES.items():
        for t in titres:
            f = image_article(t)
            if not f:
                continue
            i = info(f)
            if not i:
                print(eid, t, "licence non libre ou pas une photo :", f)
                continue
            im = Image.open(BytesIO(get(i["url"], binaire=True))).convert("RGB")
            im.thumbnail((640, 640))
            im.save(SORTIE / f"{eid}.webp", "WEBP", quality=72)
            res[eid] = {"src": f"evo/{eid}.webp", "sorte": sorte, "article": t, "fichier": f, **{k: i[k] for k in ("auteur", "licence", "page")}}
            print(eid, "←", t, "·", f, "·", i["licence"])
            break
        else:
            print(eid, "AUCUNE IMAGE")
        time.sleep(0.5)
    (R / "src/data/images-evolution.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print("fini :", len(res), "sur", len(ETAPES))


if __name__ == "__main__":
    main()

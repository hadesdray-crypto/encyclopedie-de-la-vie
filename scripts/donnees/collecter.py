#!/usr/bin/env python3
"""Collecte des données ouvertes pour l'encyclopédie. Tourne sur GitHub Actions
(voir .github/workflows/donnees.yml), parce qu'il faut un accès à Internet.

Étapes (on peut les lancer séparément) :
  noms      Noms français (Wikidata) et article Wikipédia en français.
  resumes   Deux ou trois phrases de Wikipédia en français, avec la source.
  photos    Une photo d'animal vivant pour les espèces qui n'en ont pas (iNaturalist).
  galerie   Deux photos de plus pour les espèces les plus observées (iNaturalist).
  cris      Vrais cris enregistrés (iNaturalist), seulement CC0 et CC BY.

Règles : on n'invente rien. On garde seulement les licences libres
(photos : CC0, CC BY, CC BY-SA ; sons : CC0, CC BY), toujours avec le nom de l'auteur.
On évite les animaux morts : les observations notées « mort » sont exclues,
et on préfère celles notées « vivant ».
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
DATA = RACINE / "src/data"
UA = "EncyclopedieLeonie/1.0 (application educative pour enfant; https://github.com/hadesdray-crypto/encyclopedie-de-la-vie)"

CATALOGUE = json.loads((DATA / "mammiferes.json").read_text())
ESPECES = CATALOGUE["especes"]
PAR_ID = {e["id"]: e for e in ESPECES}

LICENCES_PHOTO = {"cc0": "CC0", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA"}
LICENCES_SON = {"cc0": "CC0", "cc-by": "CC BY"}
# Annotation iNaturalist « Vivant ou mort » : terme 17, valeurs 18 = vivant, 19 = mort.
TERME_VIVANT, VIVANT, MORT = 17, 18, 19


def lire(nom, defaut):
    f = DATA / nom
    return json.loads(f.read_text()) if f.exists() else defaut


def ecrire(nom, valeur):
    (DATA / nom).write_text(json.dumps(valeur, ensure_ascii=False, separators=(",", ":"), sort_keys=True))


_dernier_envoi = [time.time()]


def envoyer(message, force=False):
    """Sur GitHub Actions, range le travail sur la branche « donnees-auto » toutes les 20 minutes :
    si la tâche est coupée, rien n'est perdu. Rien n'est publié sans l'accord du propriétaire :
    à la fin, une demande de publication (pull request) est ouverte."""
    import os

    if not os.environ.get("GITHUB_ACTIONS"):
        return
    if not force and time.time() - _dernier_envoi[0] < 20 * 60:
        return
    _dernier_envoi[0] = time.time()
    cmd = (
        'git add -A src/data public && (git diff --cached --quiet || git commit -q -m "%s") '
        "&& git push -q -f origin HEAD:refs/heads/donnees-auto"
    ) % message
    subprocess.run(cmd, shell=True, cwd=RACINE)


_dernier = [0.0]


def requete(url, donnees=None, json_ok=True, pause=1.05, accept="application/json"):
    """GET ou POST poli : une requête par seconde, réessais en cas de surcharge."""
    for essai in range(6):
        attente = pause - (time.time() - _dernier[0])
        if attente > 0:
            time.sleep(attente)
        _dernier[0] = time.time()
        try:
            req = urllib.request.Request(url, data=donnees, headers={"User-Agent": UA, "Accept": accept})
            with urllib.request.urlopen(req, timeout=60) as rep:
                brut = rep.read()
                return json.loads(brut) if json_ok else brut
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(10 * (essai + 1))
                continue
            raise
        except Exception:
            time.sleep(5 * (essai + 1))
    return None


# ---------------------------------------------------------------- noms
def etape_noms(limite):
    noms = lire("noms-fr.json", {})
    articles = lire("articles-fr.json", {})
    especes = ESPECES[:limite] if limite else ESPECES
    par_latin = {}
    for e in especes:
        par_latin.setdefault(e["latin"], []).append(e["id"])
    latins = list(par_latin)
    for i in range(0, len(latins), 150):
        lot = latins[i : i + 150]
        valeurs = " ".join('"%s"' % l.replace('"', "") for l in lot)
        sparql = f"""
SELECT ?nom ?fr ?article WHERE {{
  VALUES ?nom {{ {valeurs} }}
  ?item wdt:P225 ?nom .
  OPTIONAL {{ ?item rdfs:label ?fr FILTER(LANG(?fr) = "fr") }}
  OPTIONAL {{ ?article schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> }}
}}"""
        rep = requete(
            "https://query.wikidata.org/sparql",
            urllib.parse.urlencode({"query": sparql, "format": "json"}).encode(),
            pause=2,
        )
        if not rep:
            continue
        for ligne in rep["results"]["bindings"]:
            latin = ligne["nom"]["value"]
            fr = ligne.get("fr", {}).get("value", "").strip()
            article = ligne.get("article", {}).get("value", "")
            for ident in par_latin.get(latin, []):
                # Un « nom français » identique au nom latin n'en est pas un.
                if fr and fr.lower() != latin.lower() and not re.fullmatch(r"[A-Z][a-z]+ [a-z]+", fr):
                    noms[ident] = fr[0].upper() + fr[1:]
                if article:
                    articles[ident] = urllib.parse.unquote(article.rsplit("/", 1)[1]).replace("_", " ")
        print(f"noms : {min(i + 150, len(latins))}/{len(latins)} — {len(noms)} noms, {len(articles)} articles", flush=True)
    ecrire("noms-fr.json", noms)
    ecrire("articles-fr.json", articles)


# ---------------------------------------------------------------- resumes
def phrases(texte, maximum=420):
    morceaux = re.split(r"(?<=[.!?])\s+", texte.strip())
    garde = ""
    for m in morceaux:
        if len(garde) + len(m) > maximum and garde:
            break
        garde = (garde + " " + m).strip()
    return garde


def etape_resumes(limite):
    articles = lire("articles-fr.json", {})
    resumes = lire("wikipedia-fr.json", {})
    a_faire = [i for i in articles if i not in resumes]
    if limite:
        a_faire = a_faire[:limite]
    for n, ident in enumerate(a_faire, 1):
        titre = articles[ident]
        url = "https://fr.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(titre.replace(" ", "_"), safe="")
        rep = requete(url, pause=0.2)
        if rep and rep.get("type") == "standard" and rep.get("extract"):
            resumes[ident] = {"texte": phrases(rep["extract"]), "titre": titre}
        if n % 200 == 0:
            ecrire("wikipedia-fr.json", resumes)
            print(f"résumés : {n}/{len(a_faire)}", flush=True)
    ecrire("wikipedia-fr.json", resumes)
    print(f"résumés : {len(resumes)} au total")


# ---------------------------------------------------------------- photos
def observations(latin, extra):
    params = {
        "taxon_name": latin,
        "quality_grade": "research",
        "per_page": 30,
        "order_by": "votes",
        "without_term_value_id": MORT,
        **extra,
    }
    rep = requete("https://api.inaturalist.org/v1/observations?" + urllib.parse.urlencode(params))
    return (rep or {}).get("results", [])


def nom_taxon_ok(obs, latin):
    nom = (obs.get("taxon") or {}).get("name", "")
    return nom == latin or nom.startswith(latin + " ")


def est_vivant(obs):
    for a in obs.get("annotations") or []:
        if a.get("controlled_attribute_id") == TERME_VIVANT and a.get("controlled_value_id") == MORT:
            return None
    return any(
        a.get("controlled_attribute_id") == TERME_VIVANT and a.get("controlled_value_id") == VIVANT for a in obs.get("annotations") or []
    )


def choisir_photos(latin, combien):
    """Photos libres d'observations confirmées, jamais notées « mort »,
    en préférant celles notées « vivant ». Une seule photo par observation."""
    choix = []
    obs = [o for o in observations(latin, {"photos": "true", "photo_license": "cc0,cc-by,cc-by-sa"}) if nom_taxon_ok(o, latin)]
    obs.sort(key=lambda o: 0 if est_vivant(o) else 1)
    for o in obs:
        if est_vivant(o) is None:
            continue
        for p in o.get("photos") or []:
            lic = (p.get("license_code") or "").lower()
            if lic in LICENCES_PHOTO and p.get("url"):
                choix.append({
                    "url": p["url"].replace("/square.", "/medium."),
                    "auteur": p.get("attribution") or "",
                    "licence": LICENCES_PHOTO[lic],
                    "source": f"https://www.inaturalist.org/observations/{o['id']}",
                })
                break
        if len(choix) >= combien:
            break
    return choix


def enregistrer_webp(url, chemin, cote, qualite):
    from PIL import Image

    brut = requete(url, json_ok=False, pause=0.3, accept="image/*")
    if not brut:
        return False
    im = Image.open(BytesIO(brut)).convert("RGB")
    im.thumbnail((cote, cote))
    # Pas de photo de piège photographique (noir et blanc infrarouge) ni de photo trop sombre.
    from PIL import ImageStat

    _, saturation, luminosite = ImageStat.Stat(im.convert("HSV")).mean
    if saturation < 25 or luminosite < 45:
        return False
    chemin.parent.mkdir(parents=True, exist_ok=True)
    im.save(chemin, "WEBP", quality=qualite, method=6)
    return True


def etape_photos(limite):
    photos = lire("photos.json", [])
    presentes = set(photos)
    credits = lire("credits-photos.json", {})
    deja_vus = set(lire("photos-cherchees.json", []))
    a_faire = [e for e in ESPECES if e["id"] not in presentes and not e.get("disparue") and e["id"] not in deja_vus]
    if limite:
        a_faire = a_faire[:limite]
    for n, e in enumerate(a_faire, 1):
        try:
            for c in choisir_photos(e["latin"], 4):
                if enregistrer_webp(c["url"], RACINE / "public/m" / f"{e['id']}.webp", 420, 62):
                    photos.append(e["id"])
                    credits[e["id"]] = {k: c[k] for k in ("auteur", "licence", "source")}
                    break
        except Exception as exc:
            print("photo", e["latin"], exc, file=sys.stderr)
        deja_vus.add(e["id"])
        if n % 100 == 0:
            ecrire("photos.json", sorted(set(photos)))
            ecrire("credits-photos.json", credits)
            ecrire("photos-cherchees.json", sorted(deja_vus))
            print(f"photos : {n}/{len(a_faire)} — {len(credits)} nouvelles", flush=True)
            envoyer(f"Données : photos ({n}/{len(a_faire)})")
    ecrire("photos.json", sorted(set(photos)))
    ecrire("credits-photos.json", credits)
    ecrire("photos-cherchees.json", sorted(deja_vus))


def especes_populaires(nombre):
    """Les mammifères les plus observés sur iNaturalist (Mammalia = taxon 40151)."""
    noms = []
    for page in range(1, nombre // 500 + 2):
        rep = requete(
            "https://api.inaturalist.org/v1/observations/species_counts?"
            + urllib.parse.urlencode({"taxon_id": 40151, "quality_grade": "research", "per_page": 500, "page": page})
        )
        for r in (rep or {}).get("results", []):
            noms.append(r["taxon"]["name"])
        if len(noms) >= nombre:
            break
    par_latin = {e["latin"]: e for e in ESPECES}
    return [par_latin[n] for n in noms if n in par_latin][:nombre]


def etape_galerie(limite):
    galerie = lire("galerie.json", {})
    especes = especes_populaires(limite or 500)
    for n, e in enumerate(especes, 1):
        if e["id"] in galerie:
            continue
        try:
            garde = []
            for c in choisir_photos(e["latin"], 8)[1:]:
                if len(garde) == 2:
                    break
                if enregistrer_webp(c["url"], RACINE / "public/g" / f"{e['id']}-{len(garde) + 1}.webp", 380, 55):
                    garde.append({key: c[key] for key in ("auteur", "licence", "source")})
            galerie[e["id"]] = garde
        except Exception as exc:
            print("galerie", e["latin"], exc, file=sys.stderr)
        if n % 50 == 0:
            ecrire("galerie.json", galerie)
            print(f"galerie : {n}/{len(especes)}", flush=True)
    ecrire("galerie.json", galerie)


# ---------------------------------------------------------------- cris
def etape_cris(limite):
    cris = set(lire("cris.json", []))
    credits = lire("credits-cris.json", {})
    deja_vus = set(lire("cris-cherches.json", []))
    noms = lire("noms-fr.json", {})
    # D'abord les animaux qui ont un nom français : ce sont les plus connus.
    ordre = sorted((e for e in ESPECES if not e.get("disparue")), key=lambda e: 0 if (e["id"] in noms or e.get("langue") == "fr") else 1)
    a_faire = [e for e in ordre if e["id"] not in cris and e["id"] not in deja_vus]
    if limite:
        a_faire = a_faire[:limite]
    for n, e in enumerate(a_faire, 1):
        try:
            for o in observations(e["latin"], {"sounds": "true"}):
                if not nom_taxon_ok(o, e["latin"]):
                    continue
                son = next(
                    (s for s in o.get("sounds") or [] if (s.get("license_code") or "").lower() in LICENCES_SON and s.get("file_url")),
                    None,
                )
                if not son:
                    continue
                brut = requete(son["file_url"], json_ok=False, pause=0.3, accept="audio/*")
                if not brut:
                    continue
                with tempfile.NamedTemporaryFile(suffix=".audio") as t:
                    t.write(brut)
                    t.flush()
                    sortie = RACINE / "public/s" / f"{e['id']}.mp3"
                    ok = subprocess.run(
                        ["ffmpeg", "-y", "-loglevel", "error", "-i", t.name, "-t", "15", "-ac", "1", "-b:a", "48k", str(sortie)],
                    ).returncode == 0
                if ok and sortie.exists() and sortie.stat().st_size > 2000:
                    cris.add(e["id"])
                    credits[e["id"]] = {
                        "auteur": son.get("attribution") or "",
                        "licence": LICENCES_SON[son["license_code"].lower()],
                        "source": f"https://www.inaturalist.org/observations/{o['id']}",
                    }
                    break
        except Exception as exc:
            print("cri", e["latin"], exc, file=sys.stderr)
        deja_vus.add(e["id"])
        if n % 100 == 0:
            ecrire("cris.json", sorted(cris))
            ecrire("credits-cris.json", credits)
            ecrire("cris-cherches.json", sorted(deja_vus))
            print(f"cris : {n}/{len(a_faire)} — {len(cris)} cris", flush=True)
            envoyer(f"Données : cris ({n}/{len(a_faire)})")
    ecrire("cris.json", sorted(cris))
    ecrire("credits-cris.json", credits)
    ecrire("cris-cherches.json", sorted(deja_vus))


ETAPES = {"noms": etape_noms, "resumes": etape_resumes, "photos": etape_photos, "galerie": etape_galerie, "cris": etape_cris}

if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("etapes", nargs="+", choices=list(ETAPES))
    a.add_argument("--limite", type=int, default=0, help="pour essayer sur quelques espèces")
    args = a.parse_args()
    for nom in args.etapes:
        debut = time.time()
        print(f"== {nom} ==", flush=True)
        ETAPES[nom](args.limite)
        print(f"== {nom} terminé en {int(time.time() - debut)} s ==", flush=True)

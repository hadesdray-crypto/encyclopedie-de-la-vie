#!/usr/bin/env python3
"""Cris d'oiseaux nets et hors connexion (tourne sur GitHub Actions : il faut Internet).

Usage : python scripts/donnees/cris_oiseaux.py [N_ESPECES] [BUDGET_MO]
  N_ESPECES  nombre d'espèces visées (défaut 1500) : d'abord celles déjà dans le carnet, puis les plus célèbres
             (liste maison, oiseaux les plus observés en France d'après GBIF, puis dans le monde d'après iNaturalist).
  BUDGET_MO  poids maximal ajouté (défaut 25). Si ça risque de dépasser, la durée et le débit baissent en escalier.

Sources de cris, par ordre de qualité :
  1. Xeno-canto API v3 (qualité A, B...) si le secret XC_API_KEY existe ; sinon
  2. GBIF (archive Xeno-canto + autres), iNaturalist (observations confirmées), Wikimedia Commons.
Licences : CC0, domaine public, CC BY, CC BY-SA = « libre » (commercial: true) ; CC BY-NC et CC BY-NC-SA acceptées
mais marquées commercial: false (l'édition à vendre les retire, voir scripts/build.mjs) ; « pas de modification » (ND) : jamais.
Netteté : on décode le fichier, on cherche la fenêtre de 10 s où le cri ressort le plus du bruit de fond, et on refuse
tout ce qui est trop bruité, trop faible, saturé ou presque silencieux (voir analyser()).
Format : WebM Opus mono 24 kHz, 8 à 15 s, 24 kbit/s (16 à 20 kbit/s si le budget l'impose).
Chaque cri garde l'auteur, la licence, la page d'origine ; les espèces sans cri utilisable vont dans
src/data/sons-oiseaux-rapport.json. Reprend là où il s'est arrêté (état dans ce même fichier).
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import oiseaux as O  # noqa: E402  (fonctions communes : get, texte_fr, photos_commons...)

RACINE = O.RACINE
DONNEES = O.DONNEES
CRIS = O.CRIS
RAPPORT = DONNEES / "sons-oiseaux-rapport.json"
GBIF, COMMONS = O.GBIF, O.COMMONS
INAT = "https://api.inaturalist.org/v1"
XC_KEY = os.environ.get("XC_API_KEY", "").strip()
SR = 24000
# (durée max en s, débit kbit/s) : du plus beau au plus léger.
ECHELLE = [(12, 24), (10, 24), (10, 20), (8, 20), (8, 16)]


def get_json(url):
    try:
        return O.get(url)
    except Exception as exc:  # noqa: BLE001
        print("   réseau :", url[:90], str(exc)[:60], file=sys.stderr)
        return None


# ---------------------------------------------------------------- licences
def classe_licence(texte):
    """'libre' (vendable), 'nc' (famille seulement) ou None (refusée)."""
    t = (texte or "").lower().replace("-", " ").replace("_", " ")
    if re.search(r"\bnd\b", t) or not any(m in t for m in ("cc0", "public domain", "domaine public", "cc by", "pd ", "publicdomain")):
        return None
    return "nc" if re.search(r"\bnc\b", t) else "libre"


def licence_xc(url):
    m = re.search(r"/licenses/([a-z\-]+)/([0-9.]+)", url or "")
    if m:
        return f"CC {m.group(1).upper()} {m.group(2)}"
    return "CC0" if "zero" in (url or "") else (url or "")


# ---------------------------------------------------------------- candidats
def duree_xc(s):
    p = [int(x) for x in re.findall(r"\d+", s or "")]
    return p[0] * 60 + p[1] if len(p) == 2 else (p[0] if p else 0)


def cands_xc(latin):
    """Xeno-canto API v3 : qualité A puis B, au moins 8 s (nécessite XC_API_KEY)."""
    if not XC_KEY:
        return []
    out = []
    for q in ("A", "B"):
        req = urllib.parse.quote(f'sp:"{latin}" q:{q} len_gt:8 len_lt:90')
        r = get_json(f"https://xeno-canto.org/api/3/recordings?query={req}&key={XC_KEY}&per_page=50")
        for x in (r or {}).get("recordings", []):
            if f"{x.get('gen', '')} {x.get('sp', '')}".strip().lower() != latin.lower():
                continue
            lic = licence_xc(x.get("lic"))
            c = classe_licence(lic)
            if not c or not x.get("file"):
                continue
            typ = (x.get("type") or "").lower()
            out.append({"url": x["file"], "licence": lic, "classe": c, "auteur": O.joli(x.get("rec") or "Auteur inconnu")[:80],
                        "page": x.get("url") or "", "sorte": "chant" if "song" in typ else "cri", "q": q, "archive": "Xeno-canto"})
        if len(out) >= 8:
            break
    return out


def cle_gbif(latin):
    r = get_json(f"{GBIF}/species/match?name={urllib.parse.quote(latin)}&kingdom=Animalia&class=Aves") or {}
    if r.get("rank") not in ("SPECIES", "SUBSPECIES"):
        return None
    return r.get("speciesKey") or r.get("usageKey")


def cands_gbif(latin):
    cle = cle_gbif(latin)
    if not cle:
        return []
    q = urllib.parse.urlencode({"speciesKey": cle, "mediaType": "Sound", "limit": 100})
    out = []
    for r in (get_json(f"{GBIF}/occurrence/search?{q}") or {}).get("results", []):
        if r.get("speciesKey") != cle:
            continue
        for m in r.get("media", []):
            if m.get("type") != "Sound" or not m.get("identifier"):
                continue
            lic = O.norm_licence(m.get("license") or r.get("license") or "")
            c = classe_licence(lic)
            if not c:
                continue
            texte = " ".join(str(r.get(k, "")) for k in ("behavior", "occurrenceRemarks")).lower() + " " + (m.get("description") or "").lower()
            ref = (m.get("references") or "") + " " + (m.get("identifier") or "")
            xc = "xeno-canto" in ref.lower()
            out.append({"url": m["identifier"], "licence": lic, "classe": c, "q": "?" if xc else "-", "archive": "Xeno-canto" if xc else "GBIF",
                        "auteur": O.joli(m.get("rightsHolder") or m.get("creator") or r.get("recordedBy") or "Auteur inconnu")[:80],
                        "page": m.get("references") or f"https://www.gbif.org/occurrence/{r.get('key')}",
                        "sorte": "chant" if re.search(r"song|chant|courtship|nuptial|display|duet", texte) else "cri"})
    return out


def cands_inat(latin):
    q = urllib.parse.urlencode({"taxon_name": latin, "sounds": "true", "quality_grade": "research", "per_page": 30, "order_by": "votes"})
    out = []
    for o in (get_json(f"{INAT}/observations?{q}") or {}).get("results", []):
        nom = (o.get("taxon") or {}).get("name", "")
        if nom != latin:
            continue
        for s in o.get("sounds") or []:
            lic = {"cc0": "CC0", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc-by-nc": "CC BY-NC", "cc-by-nc-sa": "CC BY-NC-SA"}.get((s.get("license_code") or "").lower())
            if lic and s.get("file_url"):
                out.append({"url": s["file_url"], "licence": lic, "classe": classe_licence(lic), "q": "-", "archive": "iNaturalist", "sorte": "cri",
                            "auteur": O.joli(s.get("attribution") or "Auteur inconnu")[:80], "page": f"https://www.inaturalist.org/observations/{o['id']}"})
    return out


def cands_commons(latin):
    q = {"action": "query", "format": "json", "generator": "search", "gsrsearch": f'"{latin}" filetype:audio', "gsrnamespace": 6, "gsrlimit": 10,
         "prop": "imageinfo", "iiprop": "url|extmetadata"}
    pages = ((get_json(f"{COMMONS}?{urllib.parse.urlencode(q)}") or {}).get("query") or {}).get("pages", {})
    out = []
    for p in pages.values():
        i = (p.get("imageinfo") or [{}])[0]
        m = i.get("extmetadata", {})
        lic = (m.get("LicenseShortName") or {}).get("value", "")
        c = classe_licence(lic)
        texte = (p["title"] + " " + O.joli((m.get("ImageDescription") or {}).get("value", "")) + " " + O.joli((m.get("Categories") or {}).get("value", ""))).lower()
        if not c or latin.lower() not in texte or re.search(r"(pronunc|prononc|spoken|lingua libre|speech|music)", texte):
            continue
        out.append({"url": i.get("url"), "licence": lic, "classe": c, "q": "-", "archive": "Wikimedia Commons", "sorte": "chant" if "song" in texte else "cri",
                    "auteur": O.joli((m.get("Artist") or {}).get("value", ""))[:80] or "Auteur inconnu", "page": i.get("descriptionurl", "")})
    return out


def ordre(c):
    return (0 if c["classe"] == "libre" else 1, {"A": 0, "B": 1, "?": 2}.get(c["q"], 3))


# ---------------------------------------------------------------- netteté
def decoder(chemin, secondes=150):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", chemin, "-vn", "-t", str(secondes), "-ac", "1", "-ar", str(SR),
                        "-af", "highpass=f=200", "-f", "s16le", "-"], capture_output=True)
    if p.returncode != 0 or len(p.stdout) < SR:
        return None
    return np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def analyser(x, fenetre=10.0, mini=8.0):
    """Cherche la meilleure fenêtre. Retourne (début_s, durée_s, score) ou None si le son n'est pas net.
    Contraste = niveau des cris (95e centile) moins niveau du bruit de fond (20e centile), en dB, par images de 25 ms."""
    pas = int(0.025 * SR)
    n = len(x) // pas
    if n < 40:
        return None
    img = 20 * np.log10(np.sqrt((x[: n * pas].reshape(n, pas) ** 2).mean(axis=1)) + 1e-6)
    fps = 40
    duree = n / fps
    w = int(min(fenetre, duree) * fps)
    if w / fps < mini:
        return None
    meilleur = None
    for d in range(0, n - w + 1, fps):  # pas d'une seconde
        seg = img[d : d + w]
        haut, bas = np.percentile(seg, 95), np.percentile(seg, 20)
        contraste = haut - bas
        actif = float((seg > bas + 10).mean())
        sature = float((np.abs(x[d * pas : (d + w) * pas]) > 0.985).mean())
        if haut < -42 or contraste < 14 or not (0.04 <= actif <= 0.75) or sature > 0.004 or bas > -38:
            continue
        score = contraste + 10 * min(actif, 0.3)
        if meilleur is None or score > meilleur[2]:
            meilleur = (d / fps, w / fps, score)
    return meilleur


def encoder(chemin, debut, duree, kbit, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-v", "error", "-ss", f"{debut:.2f}", "-t", f"{duree:.2f}", "-i", chemin, "-vn", "-ac", "1", "-ar", str(SR),
           "-af", f"highpass=f=200,loudnorm=I=-18:TP=-2,afade=t=in:d=0.1,afade=t=out:st={max(duree - 0.4, 0):.2f}:d=0.4",
           "-c:a", "libopus", "-b:a", f"{kbit}k", "-application", "audio", str(dest)]
    if subprocess.run(cmd).returncode != 0 or not dest.exists():
        dest.unlink(missing_ok=True)
        return 0
    return dest.stat().st_size


def preparer(c, dest, kbit, duree_max):
    """Télécharge, juge la netteté, encode. Retourne la taille (0 = refusé)."""
    brut = None
    for _ in range(2):
        try:
            brut = O.get(c["url"], brut=True, essais=3)
            break
        except Exception:  # noqa: BLE001
            time.sleep(3)
    if not brut or len(brut) < 8000:
        return 0
    with tempfile.NamedTemporaryFile(suffix=".src") as t:
        t.write(brut)
        t.flush()
        x = decoder(t.name)
        if x is None:
            return 0
        a = analyser(x, fenetre=min(10.0, duree_max))
        if a is None:
            return 0
        debut, duree, score = a
        duree = min(max(duree, 8.0), duree_max, len(x) / SR - debut)
        if duree < 8.0 and len(x) / SR >= 8.0:
            debut = max(0, len(x) / SR - 8.0)
            duree = 8.0
        taille = encoder(t.name, debut, duree, kbit, dest)
    if taille < 4000:
        dest.unlink(missing_ok=True)
        return 0
    c["score"] = round(float(score), 1)
    c["duree"] = round(duree, 1)
    return taille


# ---------------------------------------------------------------- liste d'espèces
def liste_especes(n):
    deja = [o["latin"] for o in json.loads((DONNEES / "oiseaux.json").read_text(encoding="utf-8"))["oiseaux"]]
    noms = list(deja)
    try:  # les plus observés en France (GBIF), jusqu'à 600
        r = get_json(f"{GBIF}/occurrence/search?country=FR&classKey=212&rank=SPECIES&facet=speciesKey&facetLimit=600&limit=0") or {}
        for f in r.get("facets", [{}])[0].get("counts", []):
            sp = get_json(f"{GBIF}/species/{f['name']}") or {}
            if sp.get("rank") == "SPECIES" and sp.get("canonicalName"):
                noms.append(sp["canonicalName"])
    except Exception as exc:  # noqa: BLE001
        print("GBIF France :", exc)
    for page in range(1, 8):  # les plus observés dans le monde (iNaturalist, Aves = taxon 3)
        r = get_json(f"{INAT}/observations/species_counts?taxon_id=3&quality_grade=research&per_page=500&page={page}") or {}
        noms += [x["taxon"]["name"] for x in r.get("results", []) if x.get("taxon", {}).get("rank") == "species"]
        if len(noms) >= n * 1.6:
            break
    vus, out = set(), []
    for x in noms:
        if x and x not in vus:
            vus.add(x)
            out.append(x)
    return out[:n]


# ---------------------------------------------------------------- principal
def sauver(oiseaux, rapport):
    (DONNEES / "oiseaux.json").write_text(json.dumps({"oiseaux": oiseaux}, ensure_ascii=False), encoding="utf-8")
    RAPPORT.write_text(json.dumps(rapport, ensure_ascii=False, indent=1), encoding="utf-8")
    if os.environ.get("GITHUB_ACTIONS"):
        sh = ('git add -A src/data public && (git diff --cached --quiet || git commit -q -m "Cris d\'oiseaux (en cours)") '
              '&& git pull -q --rebase -X theirs origin sons-oiseaux && git push -q origin HEAD:sons-oiseaux')
        subprocess.run(sh, shell=True, cwd=RACINE)


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1500
    budget = float(sys.argv[2]) * 1e6 if len(sys.argv) > 2 else 25e6
    CRIS.mkdir(parents=True, exist_ok=True)
    fiches = json.loads((DONNEES / "oiseaux.json").read_text(encoding="utf-8"))["oiseaux"]
    par_id = {o["id"]: o for o in fiches}
    rapport = json.loads(RAPPORT.read_text(encoding="utf-8")) if RAPPORT.exists() else {
        "ajoutes": 0, "octets": 0, "licences": {}, "qualite": {}, "introuvables": [], "traites": [], "ajoutes_par_espece": {}}
    traites = set(rapport["traites"])
    cibles = liste_especes(n)
    print(f"{len(cibles)} espèces visées, budget {budget / 1e6:.0f} Mo, clé Xeno-canto : {'oui' if XC_KEY else 'non (GBIF + iNaturalist + Commons)'}", flush=True)
    restant = [c for c in cibles if O.identifiant(c) not in traites]
    for k, latin in enumerate(restant, 1):
        oid = O.identifiant(latin)
        if rapport["octets"] >= budget:
            print("Budget atteint : arrêt.")
            break
        fiche = par_id.get(oid)
        a_deja = [c for c in (fiche or {}).get("cris", []) if c.get("commercial")]
        # Objectif : 2 cris libres pour les 300 premiers, 1 ensuite ; on complète ceux qui n'en ont pas de libre.
        voulu = (2 if len(par_id) and k <= 300 else 1) - len(a_deja)
        if voulu <= 0:
            traites.add(oid)
            continue
        cand = []
        for source in (cands_xc, cands_gbif, cands_inat, cands_commons):
            try:
                cand += source(latin)
            except Exception as exc:  # noqa: BLE001
                print("  ", source.__name__, latin, exc, file=sys.stderr)
            if source is cands_gbif and len([c for c in cand if c["classe"] == "libre"]) >= 6:
                break
        cand.sort(key=ordre)
        pris, vus = [], set()
        for c in cand[:14]:
            if len(pris) >= voulu:
                break
            if c["url"] in vus:
                continue
            vus.add(c["url"])
            if pris and (c["sorte"] == pris[0]["sorte"] and c["auteur"] == pris[0]["auteur"]):
                continue
            reste_especes = max(len(restant) - k, 1)
            permis = (budget - rapport["octets"]) / (reste_especes * 1.3 + 1)
            duree_max, kbit = next(((d, b) for d, b in ECHELLE if d * b * 125 <= permis), ECHELLE[-1])
            j = len(a_deja) + len(pris)
            nom_f = f"{oid}-n{j}.webm"
            taille = preparer(c, CRIS / nom_f, kbit, duree_max)
            if taille:
                c.update({"src": f"oiseaux/s/{nom_f}", "octets": taille, "kbit": kbit})
                pris.append(c)
        if pris:
            if fiche is None:  # nouvelle espèce : fiche minimale (texte Wikipédia + une photo libre si possible)
                try:
                    cle, nom = O.nom_francais(latin)
                    txt = O.texte_fr(latin) or {}
                    fiche = {"v": 2, "id": oid, "latin": latin, "nom": nom or txt.get("nom_wiki") or latin, "intro": (txt.get("intro") or "")[:900],
                             "wiki": txt.get("page"), "photos": [], "cris": []}
                    for p in O.photos_commons(latin, 1):
                        nom_p = f"{oid}-0.webp"
                        O.enregistrer_photo(p, O.PHOTOS / nom_p)
                        fiche["photos"].append({"src": f"oiseaux/p/{nom_p}", "sexe": None, "auteur": p["auteur"], "licence": p["licence"], "commercial": p["commercial"], "page": p["page"]})
                except Exception as exc:  # noqa: BLE001
                    print("  fiche", latin, exc, file=sys.stderr)
                    fiche = {"v": 2, "id": oid, "latin": latin, "nom": latin, "intro": "", "wiki": None, "photos": [], "cris": []}
                fiches.append(fiche)
                par_id[oid] = fiche
            for c in pris:
                fiche["cris"].append({"src": c["src"], "sorte": c["sorte"], "auteur": c["auteur"], "licence": c["licence"],
                                      "commercial": c["classe"] == "libre", "page": c["page"], "archive": c["archive"], "qualite": c["q"], "duree": c["duree"], "netteté": c["score"]})
                rapport["ajoutes"] += 1
                rapport["octets"] += c["octets"]
                rapport["licences"][c["licence"]] = rapport["licences"].get(c["licence"], 0) + 1
                rapport["qualite"][c["q"]] = rapport["qualite"].get(c["q"], 0) + 1
            rapport["ajoutes_par_espece"][oid] = len(pris)
            print(f"[{k}/{len(restant)}] {latin} : {len(pris)} cri(s) {[x['licence'] for x in pris]}", flush=True)
        else:
            rapport["introuvables"].append({"id": oid, "latin": latin, "candidats": len(cand)})
            print(f"[{k}/{len(restant)}] {latin} : rien de net ({len(cand)} candidats)", flush=True)
        traites.add(oid)
        rapport["traites"] = sorted(traites)
        if k % 25 == 0:
            sauver(fiches, rapport)
    rapport["traites"] = sorted(traites)
    sauver(fiches, rapport)
    print(f"TERMINÉ : {rapport['ajoutes']} cris ajoutés, {rapport['octets'] / 1e6:.1f} Mo, {len(rapport['introuvables'])} espèces sans cri net")
    print("Licences :", rapport["licences"])


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Cris vérifiés des mammifères, depuis Xeno-canto (enregistrements identifiés et notés par des naturalistes).
Règles :
- seulement les enregistrements de qualité A ou B, sans autre espèce entendue derrière (« also » vide) ;
- licence Creative Commons sans « ND » ;
- l'espèce doit exister dans l'application (même nom latin) ;
- le son doit être audible après conversion (les ultrasons des chauves-souris disparaissent : ils sont écartés) ;
- un seul son par espèce (le meilleur), volume égal, bruit de fond atténué, 15 secondes au plus.
La clé vient du secret GitHub XC_API_KEY (jamais écrite dans le code)."""
import json, os, subprocess, tempfile, time, urllib.parse, urllib.request
from pathlib import Path

R = Path(__file__).resolve().parents[2]
DATA, SONS = R / "src/data", R / "public/s"
CLE = os.environ.get("XC_API_KEY", "").strip()
UA = {"User-Agent": "EncyclopedieLeonie/1.0 (application educative)"}
def j(m): print(m, flush=True)

def get(url, binaire=False):
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                d = r.read(); return d if binaire else json.loads(d)
        except Exception as e:
            if k == 2: j(f"  échec : {str(e)[:120]}"); return None
            time.sleep(3 + 3 * k)

def licence(url):
    p = [x for x in url.strip("/").split("/") if x]
    return f"CC {p[-2].upper()} {p[-1]}" if len(p) >= 2 else "Creative Commons"

def main():
    if not CLE: j("Pas de clé XC_API_KEY : rien à faire."); return
    esp = {e["latin"]: e for e in json.loads((DATA / "mammiferes.json").read_text())["especes"]}
    cris = set(json.loads((DATA / "cris.json").read_text()))
    credits = json.loads((DATA / "credits-cris.json").read_text())
    verifies = set(json.loads((DATA / "cris-verifies.json").read_text()))
    meilleurs = {}
    for groupe in ("land mammals", "bats"):
        page = 1
        while True:
            q = f'grp:"{groupe}"'
            r = get("https://xeno-canto.org/api/3/recordings?" + urllib.parse.urlencode({"query": q, "key": CLE, "page": page, "per_page": 500}))
            if not r or not r.get("recordings"): break
            for x in r["recordings"]:
                latin = f'{x.get("gen","")} {x.get("sp","")}'.strip()
                if latin not in esp or x.get("q") not in ("A", "B") or x.get("also") not in ([], [""], None): continue
                lic = x.get("lic", "")
                if "nd" in lic.lower().split("/") or "-nd" in lic.lower(): continue
                cle = ({"A": 0, "B": 1}[x["q"]], 0 if x.get("type", "").lower().find("call") >= 0 or x.get("type", "").lower().find("song") >= 0 else 1)
                if latin not in meilleurs or cle < meilleurs[latin][0]: meilleurs[latin] = (cle, x)
            j(f"{groupe} page {page}/{r.get('numPages')} : {len(meilleurs)} espèces candidates")
            if page >= int(r.get("numPages", 1)): break
            page += 1
    n = 0
    for latin, (_, x) in sorted(meilleurs.items()):
        e = esp[latin]
        url = x.get("file") or ""
        if url.startswith("//"): url = "https:" + url
        brut = get(url, binaire=True)
        if not brut: continue
        with tempfile.TemporaryDirectory() as d:
            src, sortie = Path(d) / "a", Path(d) / "s.mp3"
            src.write_bytes(brut)
            ok = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-t", "15", "-ac", "1", "-af", "highpass=f=80,afftdn=nr=12:nf=-30,loudnorm=I=-18:TP=-2:LRA=11", "-ar", "44100", "-b:a", "64k", str(sortie)]).returncode == 0
            if not ok or not sortie.exists(): continue
            vol = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(sortie), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
            mx = next((float(l.split(":")[1].split()[0]) for l in vol.splitlines() if "max_volume" in l), -99)
            if mx < -30: j(f"  écarté (inaudible) {latin}"); continue
            (SONS / f"{e['id']}.mp3").write_bytes(sortie.read_bytes())
        cris.add(e["id"]); verifies.add(e["id"]); n += 1
        credits[e["id"]] = {"auteur": f"{x.get('rec','')} (Xeno-canto XC{x.get('id')})", "licence": licence(x.get("lic", "")),
                            "source": f"https://xeno-canto.org/{x.get('id')}", "archive": "Xeno-canto"}
        j(f"  ✓ {e['nom']} ({latin}) — qualité {x['q']}")
    (DATA / "cris.json").write_text(json.dumps(sorted(cris), ensure_ascii=False))
    (DATA / "credits-cris.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1))
    (DATA / "cris-verifies.json").write_text(json.dumps(sorted(verifies), ensure_ascii=False))
    j(f"FIN : {n} cris vérifiés ajoutés (total vérifiés : {len(verifies)})")

if __name__ == "__main__":
    main()

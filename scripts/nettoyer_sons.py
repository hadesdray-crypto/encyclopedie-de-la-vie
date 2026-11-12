#!/usr/bin/env python3
"""Nettoie les sons d'animaux : ne garde que les moments où l'animal s'entend.
- repère les passages « actifs » (plus forts que le bruit de fond) ;
- enlève les longs silences (les passages trop calmes sont raccourcis) ;
- adoucit le bruit de fond (filtre grave + réduction de bruit légère), puis égalise le volume ;
- si le résultat paraît douteux (presque rien d'actif, ou trop court), le fichier d'origine est gardé tel quel.
Usage : python3 scripts/nettoyer_sons.py DOSSIER [DOSSIER…]   (écrit à la place des fichiers, rapport dans scripts/sons-nettoyes.json)
"""
import json, subprocess, sys, glob, os, tempfile
import numpy as np

SR = 48000
TRAME = int(0.02 * SR)

def decoder(f):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32)

def analyser(x):
    n = len(x) // TRAME
    if n < 10:
        return None
    # énergie après un filtre simple qui écarte le grondement grave (vent, manipulation du micro)
    y = x[: n * TRAME].astype(np.float64)
    y = np.concatenate([[0], np.diff(y)])  # pente : atténue les basses
    e = np.sqrt((y.reshape(n, TRAME) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(e + 1e-9)
    bruit = np.percentile(db, 15)
    crete = np.percentile(db, 98)
    if crete - bruit < 8:  # pas de différence nette entre l'animal et le fond
        return None
    seuil = max(bruit + 0.35 * (crete - bruit), bruit + 6)
    actif = db > seuil
    # lisser : combler les petits trous (< 0,3 s), enlever les petits bruits isolés (< 0,12 s)
    def combler(a, maxi):
        a = a.copy(); i = 0
        while i < len(a):
            if not a[i]:
                j = i
                while j < len(a) and not a[j]: j += 1
                if 0 < i and j < len(a) and (j - i) * 0.02 < maxi: a[i:j] = True
                i = j
            else: i += 1
        return a
    actif = combler(actif, 0.3)
    i = 0
    while i < len(actif):
        if actif[i]:
            j = i
            while j < len(actif) and actif[j]: j += 1
            if (j - i) * 0.02 < 0.12: actif[i:j] = False
            i = j
        else: i += 1
    return actif, n

def segments(actif):
    seg, i = [], 0
    while i < len(actif):
        if actif[i]:
            j = i
            while j < len(actif) and actif[j]: j += 1
            seg.append((i, j)); i = j
        else: i += 1
    return seg

def nettoyer(f):
    x = decoder(f)
    duree = len(x) / SR
    a = analyser(x)
    if a is None:
        return None, "garde : pas de passage net"
    actif, n = a
    seg = segments(actif)
    if not seg:
        return None, "garde : rien d'actif"
    pad = int(0.12 / 0.02)
    parts = []
    for (i, j) in seg:
        i0, j0 = max(0, i - pad), min(n, j + pad)
        if parts and i0 <= parts[-1][1]:
            parts[-1] = (parts[-1][0], max(parts[-1][1], j0))
        else:
            parts.append((i0, j0))
    gardee = sum(j - i for i, j in parts) * 0.02
    if gardee < 0.8:
        return None, "garde : trop court après nettoyage"
    if gardee > duree * 0.97 and len(parts) == 1:
        # déjà propre : on ne garde que le filtrage et le volume
        pass
    # les morceaux sont collés avec un petit silence de 0,25 s entre eux
    filtre_parts = []
    labels = []
    for k, (i, j) in enumerate(parts):
        t0, t1 = i * 0.02, j * 0.02
        filtre_parts.append(f"[0:a]atrim=start={t0:.3f}:end={t1:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={max(0,t1-t0-0.06):.3f}:d=0.06[p{k}]")
        labels.append(f"[p{k}]")
        if k < len(parts) - 1:
            filtre_parts.append(f"aevalsrc=0:d=0.25:s={SR}[s{k}]")
            labels.append(f"[s{k}]")
    fc = ";".join(filtre_parts) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=0:a=1,highpass=f=90,afftdn=nr=8:nf=-35,loudnorm=I=-18:TP=-2:LRA=9[o]"
    sortie = f + ".tmp.webm"
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-filter_complex", fc, "-map", "[o]", "-ac", "1", "-ar", "48000", "-c:a", "libopus", "-b:a", "40k", "-application", "audio", sortie], capture_output=True, text=True)
    if r.returncode or not os.path.exists(sortie):
        return None, "garde : erreur " + r.stderr[-120:]
    return sortie, f"{duree:.1f}s -> {gardee:.1f}s ({len(parts)} passages)"

if __name__ == "__main__":
    rapport = {}
    for d in sys.argv[1:]:
        for f in sorted(glob.glob(os.path.join(d, "*.webm"))):
            sortie, note = nettoyer(f)
            av = os.path.getsize(f)
            if sortie:
                ap = os.path.getsize(sortie)
                os.replace(sortie, f)
                rapport[f] = {"note": note, "octets_avant": av, "octets_apres": ap}
            else:
                rapport[f] = {"note": note, "octets_avant": av, "octets_apres": av}
    json.dump(rapport, open("scripts/sons-nettoyes.json", "w"), ensure_ascii=False, indent=1)
    gardes = sum(1 for v in rapport.values() if v["note"].startswith("garde"))
    print(len(rapport), "fichiers ;", gardes, "gardés tels quels ;", sum(v["octets_avant"] for v in rapport.values()) // 1024, "Ko ->", sum(v["octets_apres"] for v in rapport.values()) // 1024, "Ko")

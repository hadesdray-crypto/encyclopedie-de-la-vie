#!/usr/bin/env python3
"""Télécharge, une fois pour toutes, quelques points GPS par animal pour chaque étude publique
de src/data/suivi-gps.json (Movebank). Le résultat est rangé dans l'application : src/data/trajets.json.
Ainsi les trajets s'affichent même sans Internet. Rien n'est inventé : si Movebank refuse, l'étude reste vide."""
import hashlib, http.cookiejar, json, urllib.request
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "src/data"
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [("User-Agent", "EncyclopedieLeonie/1.0")]

def get(url):
    with op.open(url, timeout=120) as r:
        return r.read().decode("utf-8", "replace")

sortie = {}
for latin, etudes in json.loads((R / "suivi-gps.json").read_text()).items():
    for e in etudes:
        url = f"https://www.movebank.org/movebank/service/public/json?study_id={e['etude']}&sensor_type={e['capteur']}&max_events_per_individual=60"
        try:
            t = get(url)
            if not t.lstrip().startswith("{"):
                # Movebank demande d'accepter les conditions de l'étude : on renvoie l'empreinte du texte, comme prévu par Movebank.
                t = get(url + "&license-md5=" + hashlib.md5(t.encode()).hexdigest())
            d = json.loads(t)
            traces = []
            for i in (d.get("individuals") or [])[:6]:
                pts = [[round(p["location_lat"], 4), round(p["location_long"], 4)] for p in i.get("locations") or [] if p.get("location_lat") is not None]
                if len(pts) > 1:
                    traces.append({"individu": i.get("individual_local_identifier") or "Animal", "points": pts})
            sortie[str(e["etude"])] = traces
            print(f"{latin} — {e['nom']} : {len(traces)} animaux")
        except Exception as ex:
            print(f"{latin} — {e['nom']} : échec ({ex})")
(R / "trajets.json").write_text(json.dumps(sortie, ensure_ascii=False))

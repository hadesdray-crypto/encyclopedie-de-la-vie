# Essais d'accès aux sources (affichés dans le journal du workflow).
import json, time, urllib.parse, urllib.request
def essai(nom, u, entetes=None, donnees=None, t=20):
    d = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, data=donnees, headers=entetes or {"User-Agent": "encyclopedie-de-la-vie/1.0"}), timeout=t)
        c = r.read()
        print("==", nom, r.status, round(time.time() - d, 1), "s", len(c), "octets\n", c[:700].decode("utf8", "replace"), flush=True)
    except Exception as e:
        print("==", nom, "ERREUR", repr(e)[:300], round(time.time() - d, 1), "s", flush=True)
UA = {"User-Agent": "encyclopedie-de-la-vie/1.0 (verification des noms)"}
essai("taxref a", "https://taxref.mnhn.fr/api/taxa/search?scientificNames=Panthera%20leo", UA)
essai("taxref b", "https://taxref.mnhn.fr/api/taxa/search?scientificNames=Panthera%20leo", {**UA, "Accept": "application/hal+json"})
essai("taxref c", "https://taxref.mnhn.fr/api/taxa/search?scientificNames=Panthera+leo&page=1&size=5", {**UA, "Accept": "application/json"})
essai("taxref d", "https://taxref.mnhn.fr/api/taxa/fuzzyMatch?term=Panthera%20leo", UA)
essai("taxref e", "https://taxref.mnhn.fr/api/taxa/search?frenchVernacularNames=lion&page=1&size=3", UA)
essai("taxref f", "https://taxref.mnhn.fr/api/taxa/search?scientificNames=Panthera%20leo&page=1&size=5", UA)
essai("taxref g", "https://taxref.mnhn.fr/api/taxa/60585", UA)
essai("inpn", "https://inpn.mnhn.fr/espece/cd_nom/60585", UA)
essai("inat", "https://api.inaturalist.org/v1/taxa?rank=species&locale=fr&q=Panthera%20leo&per_page=3", UA)
q = 'SELECT ?i ?l ?lab WHERE { VALUES ?l { "Panthera leo" "Ornithorhynchus anatinus" } ?i wdt:P225 ?l . OPTIONAL { ?i rdfs:label ?lab FILTER(LANG(?lab)="fr") } }'
essai("wikidata label", "https://query.wikidata.org/sparql", {**UA, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"}, ("format=json&query=" + urllib.parse.quote(q)).encode())
essai("wikipedia fr", "https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=Panthera%20leo&prop=info", UA)
essai("col", "https://api.checklistbank.org/dataset/3LR/nameusage/search?q=Panthera%20leo&limit=2", UA)

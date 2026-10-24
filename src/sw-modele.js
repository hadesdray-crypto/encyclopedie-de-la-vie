/* Service worker : rend l'application utilisable sans Internet.
   - La « coquille » (pages, textes, dessins, polices) est enregistrée à l'installation.
   - Les photos et les cris sont enregistrés ensuite, petit à petit, quand on le demande
     depuis le Profil (bouton « Tout préparer pour le hors ligne »), ou au fur et à mesure
     qu'on les regarde.
   - Rien d'autre n'est téléchargé tout seul. Les adresses extérieures (GPS, cartes)
     ne passent jamais par ici. */
const VERSION = "__VERSION__";
const COQUILLE = __COQUILLE__;
const LOURDS = __LOURDS__;
const CACHE_BASE = `base-${VERSION}`;
const CACHE_MEDIAS = "medias-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_BASE)
      .then((cache) => cache.addAll(COQUILLE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const nom of await caches.keys()) {
        if (nom.startsWith("base-") && nom !== CACHE_BASE) await caches.delete(nom);
      }
      // Les médias qui n'existent plus dans cette version sont retirés.
      const medias = await caches.open(CACHE_MEDIAS);
      const voulus = new Set(LOURDS.map((f) => new URL(f, self.registration.scope).href));
      for (const requete of await medias.keys()) {
        if (!voulus.has(requete.url)) await medias.delete(requete);
      }
      await self.clients.claim();
    })(),
  );
});

function estMedia(url) {
  return /\/(m|fiches|s)\/[^/]+$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const deja = await caches.match(event.request, { ignoreSearch: true });
      if (deja) return deja;
      try {
        const reponse = await fetch(event.request);
        if (reponse.ok && estMedia(url)) {
          const cache = await caches.open(CACHE_MEDIAS);
          cache.put(event.request, reponse.clone());
        }
        return reponse;
      } catch (erreur) {
        if (event.request.mode === "navigate") {
          const page = await caches.match(new URL("./", self.registration.scope).href);
          if (page) return page;
        }
        if (/\/m\//.test(url.pathname)) {
          const dessin = await caches.match(new URL("m/absent.webp", self.registration.scope).href);
          if (dessin) return dessin;
        }
        throw erreur;
      }
    })(),
  );
});

async function etat() {
  const cache = await caches.open(CACHE_MEDIAS);
  const presents = new Set((await cache.keys()).map((r) => r.url));
  const manquants = LOURDS.filter((f) => !presents.has(new URL(f, self.registration.scope).href));
  return { total: LOURDS.length, prets: LOURDS.length - manquants.length, manquants };
}

async function prevenir(message) {
  for (const client of await self.clients.matchAll()) client.postMessage(message);
}

let enCours = false;
self.addEventListener("message", (event) => {
  if (event.data === "etat") {
    etat().then(({ total, prets }) => prevenir({ type: "etat", total, prets, enCours }));
  }
  if (event.data === "tout-preparer" && !enCours) {
    enCours = true;
    (async () => {
      const cache = await caches.open(CACHE_MEDIAS);
      const { total, manquants } = await etat();
      let prets = total - manquants.length;
      for (let i = 0; i < manquants.length; i += 12) {
        const lot = manquants.slice(i, i + 12);
        await Promise.all(
          lot.map(async (f) => {
            try {
              const r = await fetch(f);
              if (r.ok) {
                await cache.put(f, r);
                prets += 1;
              }
            } catch {
              /* hors ligne : on réessaiera plus tard */
            }
          }),
        );
        await prevenir({ type: "etat", total, prets, enCours: true });
      }
      enCours = false;
      await prevenir({ type: "etat", total, prets, enCours: false });
    })();
  }
});

// Le relief réel de la Terre : des tuiles d'altitude ouvertes (Terrain Tiles, SRTM / USGS / GMTED…) sont transformées,
// sur l'appareil, en ombres et en lumières (comme une vraie carte en relief). On ne change pas les couleurs de la Terre :
// on ajoute seulement une couche d'ombres douces par-dessus. Sans Internet, pas de relief, et tout le reste marche pareil.
//
// Les tuiles sont demandées en cascade (deux adresses). Chaque tuile est gardée en mémoire (et par le cache du navigateur).

export const TUILE = 256;
const ADRESSES = [
  (z: number, x: number, y: number) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
  (z: number, x: number, y: number) => `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`,
];
export const CREDIT_RELIEF = "Relief : Terrain Tiles (Mapzen / AWS Open Data, données SRTM, USGS, GMTED, ETOPO1…)";

/** Une tuile de relief : pour chaque point, la valeur de l'ombre (négatif = ombre, positif = lumière), de -127 à 127. */
export type TuileRelief = { z: number; x: number; y: number; ombre: Int8Array; canvas?: HTMLCanvasElement };

const cache = new Map<string, TuileRelief | "attente" | "perdu">();
let succes = 0, echecs = 0, pauseJusqua = 0;

/** Le relief est-il possible maintenant ? (réseau présent, et le serveur répond) */
export function reliefPossible(): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  if (!succes && echecs >= 6) return Date.now() > pauseJusqua;
  return true;
}

/** Le niveau d'agrandissement des ombres selon le zoom de la tuile (les petits reliefs vus de loin sont accentués). */
const exageration = (z: number) => Math.max(1.2, Math.min(14, 8 * Math.pow(2, -0.6 * (z - 4))));

/** Calcule les ombres (méthode classique de Horn, soleil au nord-ouest) à partir des altitudes d'une tuile. */
export function ombrerAltitudes(alt: Float32Array, z: number, y: number): Int8Array {
  const n = TUILE, sortie = new Int8Array(n * n);
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / 2 ** z))) * 180) / Math.PI;
  const cote = (156543.03 * Math.cos((lat * Math.PI) / 180)) / 2 ** z; // mètres par point
  const ze = exageration(z);
  const az = (315 * Math.PI) / 180, haut = (45 * Math.PI) / 180;
  const zen = Math.PI / 2 - haut;
  const v = (i: number, j: number) => alt[Math.max(0, Math.min(n - 1, j)) * n + Math.max(0, Math.min(n - 1, i))];
  const plat = Math.cos(zen);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = v(i - 1, j - 1), b = v(i, j - 1), c = v(i + 1, j - 1), d = v(i - 1, j), f = v(i + 1, j), g = v(i - 1, j + 1), h = v(i, j + 1), k = v(i + 1, j + 1);
      const dzdx = ((c + 2 * f + k) - (a + 2 * d + g)) / (8 * cote);
      const dzdy = ((g + 2 * h + k) - (a + 2 * b + c)) / (8 * cote);
      const pente = Math.atan(ze * Math.hypot(dzdx, dzdy));
      const expo = Math.atan2(dzdy, -dzdx);
      let s = Math.cos(zen) * Math.cos(pente) + Math.sin(zen) * Math.sin(pente) * Math.cos(az - expo);
      s = Math.max(0, Math.min(1, s));
      sortie[j * n + i] = Math.round(Math.max(-1, Math.min(1, (s - plat) / 0.6)) * 127);
    }
  }
  return sortie;
}

/** Décode les altitudes d'une image « terrarium » : hauteur = R×256 + V + B/256 − 32768 (mètres). */
export function decoderAltitudes(rgba: Uint8ClampedArray): Float32Array {
  const alt = new Float32Array(TUILE * TUILE);
  for (let i = 0; i < alt.length; i++) alt[i] = rgba[i * 4] * 256 + rgba[i * 4 + 1] + rgba[i * 4 + 2] / 256 - 32768;
  return alt;
}

async function charger(z: number, x: number, y: number): Promise<TuileRelief> {
  let derniere: unknown = null;
  for (const url of ADRESSES) {
    try {
      const rep = await fetch(url(z, x, y), { mode: "cors" });
      if (!rep.ok) throw new Error(String(rep.status));
      const img = await createImageBitmap(await rep.blob());
      const c = document.createElement("canvas");
      c.width = c.height = TUILE;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0, TUILE, TUILE);
      const alt = decoderAltitudes(g.getImageData(0, 0, TUILE, TUILE).data);
      return { z, x, y, ombre: ombrerAltitudes(alt, z, y) };
    } catch (e) {
      derniere = e;
    }
  }
  throw derniere ?? new Error("relief");
}

/** Donne la tuile de relief si elle est prête ; sinon la demande (et appelle « pret » quand elle arrive). */
export function tuileRelief(z: number, x: number, y: number, pret: () => void): TuileRelief | null {
  const n = 2 ** z;
  if (y < 0 || y >= n) return null;
  const xx = ((x % n) + n) % n;
  const cle = `${z}/${xx}/${y}`;
  const v = cache.get(cle);
  if (v && v !== "attente" && v !== "perdu") return v;
  if (v === "attente" || v === "perdu") return null;
  if (!reliefPossible()) return null;
  cache.set(cle, "attente");
  charger(z, xx, y)
    .then((t) => {
      succes++; echecs = 0;
      cache.set(cle, t);
      if (cache.size > 220) { for (const [k, val] of cache) { if (val !== "attente") { cache.delete(k); break; } } }
      pret();
    })
    .catch(() => {
      echecs++;
      if (echecs >= 6) pauseJusqua = Date.now() + 60000;
      cache.set(cle, "perdu");
      window.setTimeout(() => { if (cache.get(cle) === "perdu") cache.delete(cle); }, 20000);
    });
  return null;
}

/** L'ombre d'une tuile, dessinée en image (noir transparent pour l'ombre, blanc transparent pour la lumière). */
export function imageRelief(t: TuileRelief): HTMLCanvasElement {
  if (t.canvas) return t.canvas;
  const c = document.createElement("canvas");
  c.width = c.height = TUILE;
  const g = c.getContext("2d")!;
  const im = g.createImageData(TUILE, TUILE);
  for (let i = 0; i < t.ombre.length; i++) {
    const o = t.ombre[i] / 127;
    const [r, v, b, a] = couleurOmbre(o);
    im.data[i * 4] = r; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = a;
  }
  g.putImageData(im, 0, 0);
  t.canvas = c;
  return c;
}

/** Couleur de la couche d'ombre : ombre bleu nuit, lumière blanche chaude. */
export function couleurOmbre(o: number): [number, number, number, number] {
  if (o < 0) return [8, 12, 40, Math.min(190, Math.round(-o * 230))];
  return [255, 248, 225, Math.min(120, Math.round(o * 150))];
}

// ---------------------------------------------------------------- les coordonnées d'une tuile
export const monde = (lon: number, lat: number, z: number): [number, number] => {
  const s = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  const t = TUILE * 2 ** z;
  return [((lon + 180) / 360) * t, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * t];
};

/**
 * Dessine le relief vu de la Terre (globe) : on parcourt l'écran, on retrouve où chaque point tombe sur la Terre,
 * et on lit l'ombre dans la tuile. « proj » est la projection du globe. Retourne le nombre de tuiles encore attendues.
 */
export function relieSurEcran(
  cible: CanvasRenderingContext2D, larg: number, haut: number, pas: number,
  proj: { invert?: (p: [number, number]) => [number, number] | null },
  rayon: number, pret: () => void,
): number {
  const z = Math.max(2, Math.min(11, Math.ceil(Math.log2((rayon * 2 * Math.PI) / TUILE))));
  const nl = Math.ceil(larg / pas), nh = Math.ceil(haut / pas);
  const im = cible.createImageData(nl, nh);
  let manque = 0;
  const attendues = new Set<string>();
  for (let j = 0; j < nh; j++) {
    for (let i = 0; i < nl; i++) {
      const p = proj.invert?.([i * pas + pas / 2, j * pas + pas / 2]);
      if (!p || !Number.isFinite(p[0]) || Math.abs(p[1]) > 84.5) continue;
      const [X, Y] = monde(p[0], p[1], z);
      const tx = Math.floor(X / TUILE), ty = Math.floor(Y / TUILE);
      const t = tuileRelief(z, tx, ty, pret);
      if (!t) { const k = `${tx}/${ty}`; if (!attendues.has(k)) { attendues.add(k); manque++; } continue; }
      const o = t.ombre[Math.min(TUILE - 1, Math.floor(Y - ty * TUILE)) * TUILE + Math.min(TUILE - 1, Math.floor(X - tx * TUILE))] / 127;
      const [r, v, b, a] = couleurOmbre(o);
      const q = (j * nl + i) * 4;
      im.data[q] = r; im.data[q + 1] = v; im.data[q + 2] = b; im.data[q + 3] = a;
    }
  }
  cible.canvas.width = nl; cible.canvas.height = nh;
  cible.putImageData(im, 0, 0);
  return manque;
}

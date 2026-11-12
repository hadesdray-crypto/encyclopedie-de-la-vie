// « Voler avec lui » : on voyage avec l'animal, avec SES yeux, sur son vrai trajet GPS.
// Pas de vue du ciel : la caméra est à hauteur de l'animal, le sol défile en perspective (vraies images satellite
// Esri, les mêmes que « Voyager avec lui »), l'horizon, les nuages, le bout des ailes en bas de l'écran.
// Le voyage est découpé en étapes : on survole de près chaque étape, puis on monte très haut pour passer à la suivante.
// Une seule boucle d'animation dessine dans un canevas (le sol est tracé ligne par ligne, façon jeu de course).
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuPause, LuPlay, LuSkipForward, LuX } from "react-icons/lu";
import { geoMercator, geoPath } from "d3-geo";
import { PAYS } from "@/components/globe";
import { PlumeDessin } from "@/components/plume-dessin";
import { CREDIT_RELIEF, imageRelief, tuileRelief } from "@/lib/relief";
import { suivreLeGlobe } from "@/lib/trajet";
import { useInternet } from "@/lib/internet";
import { contexteAudio, sonsActifs } from "@/lib/sons";

type Point = [number, number];
type Props = { points: Point[]; nom: string; couleur: string; groupe: string; depart?: string; arrivee?: string; onFermer: () => void };

const TUILE = 256;
const M_ZOOM0 = 156543.03; // mètres par pixel au zoom 0, à l'équateur
const tuileUrl = (z: number, x: number, y: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const wx = (lon: number) => ((lon + 180) / 360) * TUILE;
const wy = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TUILE;
};
const lonDe = (x: number) => (x / TUILE) * 360 - 180;
const latDe = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / TUILE))) * 180) / Math.PI;
function km(a: Point, b: Point) {
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}
const fmtKm = (k: number) => (k < 1 ? `${Math.round(k * 1000)} m` : `${Math.round(k).toLocaleString("fr-FR")} km`);
const fmtH = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
function deplier(points: Point[]): Point[] {
  let decal = 0;
  return points.map(([la, lo], k) => {
    if (k) {
      const avant = points[k - 1][1];
      if (lo - avant > 180) decal -= 360;
      else if (avant - lo > 180) decal += 360;
    }
    return [la, lo + decal];
  });
}
const lerpAng = (a: number, b: number, t: number) => {
  let d = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
};
const lisse = (u: number) => u * u * (3 - 2 * u);

// ------------------------------------------------------------ les images satellite
const cache = new Map<string, HTMLImageElement>();
function tuile(z: number, x: number, y: number, ready: () => void): HTMLImageElement | null {
  const n = 2 ** z;
  const xx = ((x % n) + n) % n;
  if (y < 0 || y >= n) return null;
  const k = `${z}/${xx}/${y}`;
  let im = cache.get(k);
  if (!im) {
    im = new Image();
    im.decoding = "async";
    im.onload = ready;
    im.onerror = () => window.setTimeout(() => { if (cache.get(k) === im) cache.delete(k); }, 6000);
    im.src = tuileUrl(z, xx, y);
    cache.set(k, im);
    if (cache.size > 260) { const premier = cache.keys().next().value; if (premier) cache.delete(premier); }
  }
  return im.complete && im.naturalWidth ? im : null;
}
type Mosaique = { z: number; tx0: number; ty0: number; n: number; c: HTMLCanvasElement; manque: number };
function mosaique(m: Mosaique | null, z: number, wx0: number, wy0: number, n: number, ready: () => void, force: boolean): Mosaique {
  const tx = Math.floor((wx0 * 2 ** z) / TUILE), ty = Math.floor((wy0 * 2 ** z) / TUILE);
  const demi = Math.floor(n / 2);
  if (m && !force && m.z === z && m.tx0 === tx - demi && m.ty0 === ty - demi) return m;
  const c = m?.c ?? document.createElement("canvas");
  c.width = c.height = n * TUILE;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2a3a2c";
  g.fillRect(0, 0, c.width, c.height);
  let manque = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const im = tuile(z, tx - demi + i, ty - demi + j, ready);
    if (im) g.drawImage(im, i * TUILE, j * TUILE, TUILE, TUILE); else manque++;
  }
  return { z, tx0: tx - demi, ty0: ty - demi, n, c, manque };
}

// Sans Internet (ou sans l'accord d'un adulte) : le sol est dessiné sur l'appareil à partir des contours des pays,
// avec le relief réel quand le réseau le permet. Même format que les images satellite : le reste du vol ne change pas.
function mosaiqueVecto(m: Mosaique | null, z: number, wx0: number, wy0: number, n: number, ready: () => void, force: boolean, marin: boolean): Mosaique {
  const tx = Math.floor((wx0 * 2 ** z) / TUILE), ty = Math.floor((wy0 * 2 ** z) / TUILE);
  const demi = Math.floor(n / 2);
  if (m && !force && m.z === z && m.tx0 === tx - demi && m.ty0 === ty - demi) return m;
  const c = m?.c ?? document.createElement("canvas");
  c.width = c.height = n * TUILE;
  const g = c.getContext("2d")!;
  const tx0 = tx - demi, ty0 = ty - demi;
  const tour = 256 * 2 ** z;
  g.fillStyle = marin ? "#0c3a63" : "#2a5d8c";
  g.fillRect(0, 0, c.width, c.height);
  const terre = new Path2D();
  const chemins: Path2D[] = [];
  for (const k of [-1, 0, 1]) {
    const proj = geoMercator().scale(tour / (2 * Math.PI)).translate([tour / 2 - tx0 * TUILE + k * tour, tour / 2 - ty0 * TUILE]);
    // dessiner dans un Path2D : on passe par un contexte « enregistreur »
    const p = new Path2D();
    const rec = { beginPath() {}, moveTo: (x: number, y: number) => p.moveTo(x, y), lineTo: (x: number, y: number) => p.lineTo(x, y), closePath: () => p.closePath(), arc() {}, rect() {}, bezierCurveTo() {}, quadraticCurveTo() {} };
    geoPath(proj, rec as unknown as CanvasRenderingContext2D)(PAYS);
    terre.addPath(p);
    chemins.push(p);
  }
  g.fillStyle = marin ? "#1a4a3a" : "#5b7b43";
  g.fill(terre);
  // les glaces des pôles (au-delà des cercles polaires)
  g.save(); g.clip(terre);
  const sinP = Math.sin((66.5 * Math.PI) / 180);
  const yCercle = (0.5 - Math.log((1 + sinP) / (1 - sinP)) / (4 * Math.PI)) * tour; // le cercle polaire nord, dans le monde
  g.fillStyle = "rgba(235,242,248,.85)";
  g.fillRect(0, -99999, c.width, yCercle - ty0 * TUILE + 99999);
  g.fillRect(0, tour - yCercle - ty0 * TUILE, c.width, 99999);
  // un peu de matière : des plaques de prairie, de terre et de feuillage (toujours les mêmes au même endroit),
  // de 60 m environ pour les petites, 300 m pour les grandes
  if (!marin) {
    const mpp = (156543.03 * Math.cos(0.2)) / 2 ** z; // mètres par point (à peu près)
    const fin = Math.max(3, Math.round(60 / mpp));
    for (const [pas, force, graine] of [[fin * 5, 1, 1.7], [fin, 0.7, 3.1]] as const) {
      for (let yy = Math.floor((ty0 * TUILE) / pas) * pas; yy < (ty0 + n) * TUILE; yy += pas) {
        for (let xx = Math.floor((tx0 * TUILE) / pas) * pas; xx < (tx0 + n) * TUILE; xx += pas) {
          const hsh = Math.sin(xx * 12.9898 + yy * 78.233 + graine * 17) * 43758.5453;
          const r = hsh - Math.floor(hsh);
          g.fillStyle = r < 0.33 ? `rgba(24,52,16,${force * (0.12 + r * 0.55)})` : r < 0.66 ? `rgba(160,138,76,${force * (0.08 + (r - 0.33) * 0.5)})` : `rgba(120,160,72,${force * (0.08 + (r - 0.66) * 0.5)})`;
          g.fillRect(xx - tx0 * TUILE, yy - ty0 * TUILE, pas, pas);
        }
      }
    }
  }
  // le relief réel (ombres et lumières), sur les terres seulement
  const zr = Math.min(z, 12), f = 2 ** (z - zr), part = TUILE / f;
  let manque = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const X = tx0 + i, Y = ty0 + j;
    const t = tuileRelief(zr, Math.floor(X / f), Math.floor(Y / f), ready);
    if (!t) { manque++; continue; }
    const sx = (((X % f) + f) % f) * part, sy = (((Y % f) + f) % f) * part;
    g.drawImage(imageRelief(t), sx, sy, part, part, i * TUILE, j * TUILE, TUILE, TUILE);
  }
  g.restore();
  // les frontières, fines
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = Math.max(0.8, z / 5);
  for (const p of chemins) g.stroke(p);
  return { z, tx0, ty0, n, c, manque };
}

// ------------------------------------------------------------ la fenêtre
export function VoyageVol(p: Props) {
  const { permis, connecte } = useInternet();
  useEffect(() => {
    // la page derrière ne se dessine plus pendant le vol : plus fluide, et ça ménage la batterie
    const avant = document.body.style.overflow;
    const app = document.getElementById("app");
    const vis = app?.style.visibility ?? "";
    document.body.style.overflow = "hidden";
    if (app) app.style.visibility = "hidden";
    return () => { document.body.style.overflow = avant; if (app) app.style.visibility = vis; };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0b0820] text-white" role="dialog" aria-label={`Voler avec ${p.nom}`}>
      <Vol {...p} sat={permis && connecte} />
    </div>,
    document.body,
  );
}

const BASE: Record<string, { h: number; v: number; verbe: string }> = {
  oiseau: { h: 150, v: 45, verbe: "On vole" },
  herbivore: { h: 18, v: 16, verbe: "On court" },
  predateur: { h: 18, v: 16, verbe: "On court" },
  marin: { h: 35, v: 14, verbe: "On nage" },
  autre: { h: 18, v: 30, verbe: "On avance" },
};
const VOL_S = 18, TRANSIT_S = 14;
/** Les animaux qui marchent (tortue, lion, gnou…) restent à hauteur d'animal : jamais dans le ciel. */
const auSol = (groupe: string) => groupe !== "oiseau" && groupe !== "marin";

function Vol({ points: brut, nom, couleur, groupe, depart, arrivee, onFermer, sat }: Props & { sat: boolean }) {
  const b = BASE[groupe] ?? BASE.autre;
  const pts = useMemo(() => deplier(suivreLeGlobe(brut)), [brut]);
  const { etapes, total, at } = useMemo(() => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + km(pts[i - 1], pts[i]));
    const tot = cum[cum.length - 1] || 0;
    const at = (d: number): { x: number; y: number; lat: number } => {
      const dd = Math.max(0, Math.min(tot, d));
      let i = 1;
      while (i < cum.length - 1 && cum[i] < dd) i++;
      const a = pts[i - 1] ?? pts[0], c = pts[i] ?? pts[0];
      const f = cum[i] > cum[i - 1] ? (dd - cum[i - 1]) / (cum[i] - cum[i - 1]) : 0;
      const la = a[0] + (c[0] - a[0]) * f, lo = a[1] + (c[1] - a[1]) * f;
      return { x: wx(lo), y: wy(la), lat: la };
    };
    const M = Math.max(3, Math.min(9, Math.round(tot / 450) + 3));
    const e = Array.from({ length: M }, (_, k) => {
      const d = (tot * k) / (M - 1);
      const p0 = at(d), a = at(d - tot * 0.04), c = at(d + tot * 0.04);
      let th = Math.atan2(c.y - a.y, c.x - a.x);
      if (Math.hypot(c.x - a.x, c.y - a.y) < 1e-9) th = -Math.PI / 2;
      return { ...p0, th, d };
    });
    return { etapes: e, total: tot, at };
  }, [pts]);

  const sol = auSol(groupe);
  const phases = useMemo(() => {
    const l: { type: "vol" | "transit"; i: number; t0: number; dur: number }[] = [];
    let t = 0;
    if (sol) {
      // À pied : une seule marche continue, exactement le long des points GPS (ceux du globe), sans jamais quitter le sol.
      const duree = Math.max(60, Math.min(150, total * 20));
      const seg = duree / Math.max(1, etapes.length - 1);
      etapes.slice(0, -1).forEach((_, i) => l.push({ type: "vol", i, t0: i * seg, dur: seg }));
      return { l, fin: duree };
    }
    etapes.forEach((_, i) => {
      l.push({ type: "vol", i, t0: t, dur: VOL_S }); t += VOL_S;
      if (i < etapes.length - 1) { l.push({ type: "transit", i, t0: t, dur: TRANSIT_S }); t += TRANSIT_S; }
    });
    return { l, fin: t };
  }, [etapes, sol, total]);

  const satRef = useRef(sat);
  satRef.current = sat;
  const toile = useRef<HTMLCanvasElement>(null);
  const boite = useRef<HTMLDivElement>(null);
  const roulis = useRef<HTMLDivElement>(null);
  const E = useRef({ t: 0, joue: true, theta: 0, rowH: 2, moy: 0.016, vent: null as null | { g: GainNode; src: AudioBufferSourceNode } });
  const [ui, setUi] = useState({ joue: true, etape: 1, alt: b.h, km: 0, date: "", chargement: true, fini: false });
  const t0 = depart ? Date.parse(depart.replace(" ", "T")) : NaN;
  const t1 = arrivee ? Date.parse(arrivee.replace(" ", "T")) : NaN;

  useEffect(() => {
    const cv = toile.current, bx = boite.current;
    if (!cv || !bx) return;
    const g = cv.getContext("2d");
    if (!g) return;
    let W = 360, H = 480, y0 = 190;
    const mesurer = () => {
      const r = bx.getBoundingClientRect();
      const echelle = Math.min(1, 420 / Math.max(300, r.width));
      W = Math.max(200, Math.round(r.width * echelle)); H = Math.max(240, Math.round(r.height * echelle));
      cv.width = W; cv.height = H; y0 = H * 0.4;
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(bx);

    let near: Mosaique | null = null, far: Mosaique | null = null;
    let sale = true, dernierRebuild = 0, utilSat = satRef.current;
    const pret = () => { sale = true; };

    // où est la caméra à l'instant t ?
    const cam = (t: number) => {
      const ph = phases.l.find((q) => t >= q.t0 && t < q.t0 + q.dur) ?? phases.l[phases.l.length - 1];
      const tau = Math.min(ph.dur, t - ph.t0);
      const e = etapes[ph.i];
      const mpx = (lat: number) => M_ZOOM0 * Math.cos((lat * Math.PI) / 180);
      const avance = (et: typeof e, s: number) => ({ x: et.x + (Math.cos(et.th) * s) / mpx(et.lat), y: et.y + (Math.sin(et.th) * s) / mpx(et.lat) });
      if (sol) {
        const d = Math.min(total, (t / phases.fin) * total);
        const p0 = at(d), a = at(d - total * 0.012), c2 = at(d + total * 0.012);
        let th = Math.atan2(c2.y - a.y, c2.x - a.x);
        if (Math.hypot(c2.x - a.x, c2.y - a.y) < 1e-9) th = e.th;
        return { x: p0.x, y: p0.y, h: b.h, th, km: d, frac: d / (total || 1), i: Math.min(etapes.length - 1, Math.round((d / (total || 1)) * (etapes.length - 1))), lat: p0.lat, volant: true };
      }
      if (ph.type === "vol") {
        const p = avance(e, b.v * tau);
        return { x: p.x, y: p.y, h: b.h * (1 + 0.1 * Math.sin(tau * 0.8)), th: e.th + 0.05 * Math.sin(tau * 0.45), km: e.d + (b.v * tau) / 1000, frac: e.d / (total || 1), i: ph.i, lat: e.lat, volant: true };
      }
      const n = etapes[ph.i + 1];
      const u = lisse(tau / ph.dur);
      const dep = avance(e, b.v * VOL_S);
      const distM = Math.max(1, (n.d - e.d) * 1000);
      const pic = Math.max(700, Math.min(12000, distM / 2.5));
      const h = b.h + (pic - b.h) * Math.pow(Math.sin(Math.PI * u), 0.9);
      const la = e.lat + (n.lat - e.lat) * u;
      return { x: dep.x + (n.x - dep.x) * u, y: dep.y + (n.y - dep.y) * u, h, th: lerpAng(e.th, n.th, u), km: e.d + (n.d - e.d) * u, frac: (e.d + (n.d - e.d) * u) / (total || 1), i: ph.i + (u > 0.5 ? 1 : 0), lat: la, volant: false };
    };

    const NUAGES = Array.from({ length: 9 }, (_, k) => ({ a: (k / 9) * Math.PI * 2 + 0.3, el: 0.08 + ((k * 37) % 11) / 40, w: 60 + ((k * 53) % 70) }));
    const dessiner = (c: ReturnType<typeof cam>, now: number) => {
      const fov = (78 * Math.PI) / 180, f = W / 2 / Math.tan(fov / 2);
      // le ciel
      const ciel = g.createLinearGradient(0, 0, 0, y0 + 2);
      const haut = Math.min(1, c.h / 6000);
      if (groupe === "marin") {
        // sous l'eau : la lumière vient d'en haut, l'eau devient sombre et bleue vers le fond
        ciel.addColorStop(0, "#1b6f9e"); ciel.addColorStop(0.6, "#0f4f7c"); ciel.addColorStop(1, "#0a3a60");
      } else {
        ciel.addColorStop(0, haut > 0.5 ? "#0f2c66" : "#2b5eb3");
        ciel.addColorStop(0.7, "#7fb0e4");
        ciel.addColorStop(1, "#d6e6f3");
      }
      g.fillStyle = ciel;
      g.fillRect(0, 0, W, y0 + 2);
      if (groupe !== "marin") {
      // le soleil et les nuages (ils tournent avec le cap)
      const sx = W / 2 + lerpAngDiff(-2.2, c.th) * f * -1;
      const soleil = g.createRadialGradient(sx, y0 * 0.45, 2, sx, y0 * 0.45, 60);
      soleil.addColorStop(0, "rgba(255,248,214,.95)"); soleil.addColorStop(1, "rgba(255,248,214,0)");
      g.fillStyle = soleil; g.fillRect(sx - 70, y0 * 0.45 - 70, 140, 140);
      g.fillStyle = "rgba(255,255,255,.55)";
      for (const nu of NUAGES) {
        const x = W / 2 + lerpAngDiff(nu.a, c.th) * -f;
        if (x < -120 || x > W + 120) continue;
        const y = y0 * (1 - nu.el * 2.2) - (c.h > 3000 ? 0 : 0);
        g.beginPath(); g.ellipse(x, y, nu.w, nu.w * 0.2, 0, 0, Math.PI * 2); g.ellipse(x + nu.w * 0.4, y - 4, nu.w * 0.6, nu.w * 0.17, 0, 0, Math.PI * 2); g.fill();
      }
      }
      // le sol, ligne par ligne
      // Avec les vraies images, on descend très bas (jusqu'au niveau 17). Sans elles, le sol dessiné sur l'appareil s'arrête au niveau 9 (assez fin pour les contours des pays et le relief).
      const zn0 = Math.max(4, Math.min(17, Math.round(Math.log2((M_ZOOM0 * Math.cos((c.lat * Math.PI) / 180)) / (c.h / 40)))));
      const zn = satRef.current ? zn0 : Math.min(zn0, 10);
      const zf = Math.max(2, Math.min(zn0 - 3, satRef.current ? 17 : 9));
      const camX = c.x, camY = c.y;
      if (utilSat !== satRef.current) { utilSat = satRef.current; near = far = null; sale = true; }
      const fresh = sale && now - dernierRebuild > 220;
      if (!near || !far || fresh || near.z !== zn || Math.abs(near.tx0 + 2 - Math.floor((camX * 2 ** zn) / TUILE)) > 0 || Math.abs(near.ty0 + 2 - Math.floor((camY * 2 ** zn) / TUILE)) > 0 || far.z !== zf) {
        const mer = groupe === "marin";
        near = satRef.current ? mosaique(near, zn, camX, camY, 5, pret, fresh) : mosaiqueVecto(near, zn, camX, camY, 5, pret, fresh, mer);
        far = satRef.current ? mosaique(far, zf, camX, camY, 3, pret, fresh) : mosaiqueVecto(far, zf, camX, camY, 3, pret, fresh, mer);
        if (fresh) { sale = false; dernierRebuild = now; }
        if (near.manque + far.manque > 0 && fresh) sale = true;
      }
      const F = { x: Math.cos(c.th), y: Math.sin(c.th) }, R = { x: -F.y, y: F.x };
      const rowH = E.current.rowH;
      g.save();
      g.fillStyle = "#3d5a40"; g.fillRect(0, y0, W, H - y0);
      for (let y = Math.ceil(y0 + 2); y < H; y += rowH) {
        const dy = y + rowH / 2 - y0;
        const d = (c.h * f) / dy; // la distance devant nous
        if (d > c.h * 60) continue;
        const mo = d <= c.h * 11 ? near : far;
        if (!mo) continue;
        const echelle = 2 ** mo.z;
        const mpp = (M_ZOOM0 * Math.cos((c.lat * Math.PI) / 180)) / echelle;
        const cx = camX * echelle - mo.tx0 * TUILE, cy = camY * echelle - mo.ty0 * TUILE;
        const Cx = cx + F.x * (d / mpp), Cy = cy + F.y * (d / mpp);
        const s = (f * mpp) / d;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.save();
        g.beginPath(); g.rect(0, y, W, rowH + 1); g.clip();
        g.setTransform(s * R.x, -s * F.x, s * R.y, -s * F.y, W / 2 - s * (R.x * Cx + R.y * Cy), y + s * (F.x * Cx + F.y * Cy));
        g.drawImage(mo.c, 0, 0);
        g.restore();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.restore();
      // la brume à l'horizon
      const brume = g.createLinearGradient(0, y0 - 2, 0, y0 + (H - y0) * 0.42);
      const mer = groupe === "marin";
      brume.addColorStop(0, mer ? "rgba(14,86,130,1)" : "rgba(214,230,243,1)");
      brume.addColorStop(0.35, mer ? "rgba(12,76,118,.75)" : "rgba(190,214,236,.7)");
      brume.addColorStop(1, mer ? "rgba(10,60,100,0)" : "rgba(190,214,236,0)");
      g.fillStyle = brume; g.fillRect(0, y0 - 2, W, (H - y0) * 0.42 + 2);
      if (mer) {
        // l'eau teinte le fond, et des bulles montent doucement
        const eau = g.createLinearGradient(0, y0, 0, H);
        eau.addColorStop(0, "rgba(8,70,115,.45)"); eau.addColorStop(1, "rgba(4,30,65,.78)");
        g.fillStyle = eau; g.fillRect(0, y0, W, H - y0);
        g.fillStyle = "rgba(220,240,255,.45)";
        for (let k = 0; k < 26; k++) {
          const bx = ((k * 97) % 100) / 100 * W + Math.sin(now / 900 + k) * 6;
          const by = H - ((now / (14 + (k % 5) * 4) + k * 131) % (H + 20));
          g.beginPath(); g.arc(bx, by, 1.5 + (k % 4), 0, Math.PI * 2); g.fill();
        }
      }
      // la lumière sur les bords
      const vig = g.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, H * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(5,10,30,.38)");
      g.fillStyle = vig; g.fillRect(0, 0, W, H);
    };
    function lerpAngDiff(a: number, th: number) { let d = a - th; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

    // le vent
    const lancerVent = () => {
      if (E.current.vent || !sonsActifs()) return;
      const ac = contexteAudio();
      if (!ac) return;
      try {
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        const fl = ac.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 500; fl.Q.value = 0.6;
        const gn = ac.createGain(); gn.gain.value = 0.0;
        src.connect(fl); fl.connect(gn); gn.connect(ac.destination); src.start();
        E.current.vent = { g: gn, src };
      } catch { /* rien */ }
    };

    let raf = 0, avant = performance.now(), maj = 0, thAvant = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - avant) / 1000);
      avant = now;
      const e = E.current;
      // si la tablette peine, on dessine le sol avec de plus grosses lignes (moins fin, mais fluide)
      e.moy += (dt - e.moy) * 0.05;
      if (e.moy > 0.034 && e.rowH < 6) { e.rowH += 1; e.moy = 0.02; }
      if (e.joue && e.t < phases.fin) { e.t += dt; if (!e.vent) lancerVent(); }
      if (e.t >= phases.fin) e.joue = false;
      const c = cam(Math.min(e.t, phases.fin - 0.001));
      const vit = Math.hypot(c.th - thAvant);
      const roul = Math.max(-14, Math.min(14, ((c.th - thAvant + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 400));
      thAvant = c.th;
      void vit;
      dessiner(c, now);
      if (roulis.current) roulis.current.style.transform = `rotate(${(-roul * 0.5).toFixed(2)}deg) scale(1.08)`;
      if (e.vent) e.vent.g.gain.value = e.joue ? Math.min(0.12, 0.025 + (Math.log10(c.h) - 1.5) * 0.03) : 0;
      if (now - maj > 250) {
        maj = now;
        const date = Number.isFinite(t0) && Number.isFinite(t1) ? fmtDate(t0 + (t1 - t0) * c.frac) : "";
        const manque = (near?.manque ?? 0) + (far?.manque ?? 0);
        setUi({ joue: e.joue, etape: Math.min(etapes.length, c.i + 1), alt: c.h, km: c.km, date, chargement: manque > 14, fini: e.t >= phases.fin });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      const v = E.current.vent;
      if (v) { try { v.g.gain.value = 0; v.src.stop(); } catch { /* rien */ } E.current.vent = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases, etapes]);

  const suivante = () => {
    const e = E.current;
    const q = phases.l.find((p) => p.type === "vol" && p.t0 > e.t + 0.01);
    e.t = q ? q.t0 : phases.fin - 0.01;
    e.joue = true;
  };
  const rejouer = () => { E.current.t = 0; E.current.joue = true; };
  const bascule = () => { E.current.joue = !E.current.joue; setUi((u) => ({ ...u, joue: E.current.joue })); };
  const phrase = ui.fini ? `Voyage terminé : ${fmtKm(total)} avec ${nom} !` : ui.alt > 1500 ? "On monte très haut pour rejoindre la prochaine étape…" : `${b.verbe} avec ${nom}, ${groupe === "marin" ? "dans l'eau" : "tout près du sol"}.`;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-3">
        <button type="button" onClick={onFermer} aria-label="Fermer" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/12"><LuX className="size-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight text-[#f3d48a]">{nom}</p>
          <p className="truncate text-xs font-bold texte-doux">Étape {ui.etape} sur {etapes.length} · {fmtKm(ui.km)}{ui.date ? ` · ${ui.date}` : ""}</p>
        </div>
      </div>
      <div ref={boite} className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={roulis} className="absolute inset-0" style={{ transformOrigin: "50% 60%" }}>
          <canvas ref={toile} className="size-full" />
        </div>
        {groupe === "oiseau" ? (
          <>
            <svg viewBox="0 0 200 140" className="vol-aile-g pointer-events-none absolute bottom-[-18px] left-[-30px] w-[40%] max-w-[210px]" aria-hidden="true">
              <path d="M0 140 C20 90 70 40 190 20 C150 55 120 80 112 140 Z" fill={couleur} opacity=".92" />
              <path d="M30 140 C50 100 90 62 188 32 M62 140 C80 108 112 80 186 48" stroke="rgba(0,0,0,.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 200 140" className="vol-aile-d pointer-events-none absolute bottom-[-18px] right-[-30px] w-[40%] max-w-[210px]" aria-hidden="true">
              <path d="M0 140 C20 90 70 40 190 20 C150 55 120 80 112 140 Z" fill={couleur} opacity=".92" />
              <path d="M30 140 C50 100 90 62 188 32 M62 140 C80 108 112 80 186 48" stroke="rgba(0,0,0,.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </>
        ) : null}
        <div className="pointer-events-none absolute left-3 top-3 rounded-2xl bg-black/45 px-3 py-1.5 text-xs font-extrabold">
          {groupe === "marin" ? `Profondeur : ${fmtH(ui.alt)}` : sol ? "À hauteur de l'animal" : `Altitude : ${fmtH(ui.alt)}`}
        </div>
        {!sat ? <div className="pointer-events-none absolute inset-x-0 top-14 mx-auto w-fit max-w-[92%] rounded-full bg-black/55 px-3 py-1 text-center text-xs font-bold">Vue simplifiée : les vraies images arrivent avec Internet.</div> : ui.chargement ? <div className="pointer-events-none absolute inset-x-0 top-14 mx-auto w-fit rounded-full bg-black/55 px-3 py-1 text-xs font-bold">Les images arrivent…</div> : null}
        {!sat ? <p className="pointer-events-none absolute bottom-[4.2rem] right-2 max-w-[60%] text-right text-[9px] leading-tight text-white/55">{CREDIT_RELIEF}</p> : null}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end gap-2">
          <PlumeDessin anim={ui.alt > 1500 ? "peur" : "vole"} className="size-14 shrink-0" />
          <p className="brac-bulle rounded-2xl bg-white px-3 py-1.5 text-sm font-black text-[#2a1650] shadow-lg">{phrase}</p>
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-2 px-3 pb-3 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
        <button type="button" onClick={ui.fini ? rejouer : bascule} className="bouton-bois flex items-center justify-center gap-2 rounded-2xl py-3 font-extrabold">
          {ui.fini ? "↺ Rejouer" : ui.joue ? <><LuPause className="size-5" /> Pause</> : <><LuPlay className="size-5" /> Voler</>}
        </button>
        <button type="button" onClick={suivante} disabled={ui.fini} className="flex items-center justify-center gap-2 rounded-2xl bg-white/12 py-3 font-extrabold disabled:opacity-40"><LuSkipForward className="size-5" /> Étape suivante</button>
        <button type="button" onClick={onFermer} className="rounded-2xl bg-white/12 py-3 font-extrabold">Quitter</button>
      </div>
    </>
  );
}

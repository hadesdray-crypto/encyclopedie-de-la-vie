// Le globe : la Terre en 3D, qu'on fait tourner avec un doigt et qu'on zoome avec deux doigts.
// Tout est dessiné sur l'appareil (sans Internet), à partir des contours des pays de l'application.
import { useEffect, useRef } from "react";
import { geoArea, geoBounds, geoCentroid, geoContains, geoGraticule10, geoInterpolate, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import monde from "@/data/monde.json";

export type TraceGlobe = { i: number; couleur: string; points: [number, number][] };

// Les contours de l'application sont écrits en (x = longitude + 180, y = 90 − latitude) : on les relit en vraies coordonnées.
const PAYS: GeoPermissibleObjects = {
  type: "FeatureCollection",
  features: Object.entries((monde as { pays: Record<string, string> }).pays).map(([code, d]) => {
    const anneaux = d.split("Z").filter((x) => x.trim()).map((a) =>
      a.replace(/^M/, "").split("L").map((p) => {
        const [x, y] = p.trim().split(/\s+/).map(Number);
        return [x - 180, 90 - y] as [number, number];
      }),
    );
    // Chaque contour doit être fermé (le dernier point = le premier), et assez grand pour être dessiné.
    const fermes = anneaux
      .map((r) => (r.length && (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) ? [...r, r[0]] : r))
      .filter((r) => r.length >= 4);
    return { type: "Feature", properties: { code }, geometry: { type: "MultiPolygon", coordinates: fermes.map((r) => {
      // Le bon sens de rotation : un pays fait toujours moins d'une demi-Terre.
      const poly = { type: "Polygon" as const, coordinates: [r] };
      return geoArea(poly) > 2 * Math.PI ? [r.slice().reverse()] : [r];
    }) } };
  }),
} as unknown as GeoPermissibleObjects;
const GRILLE = geoGraticule10();
type Pays = { properties: { code: string } };
const LISTE_PAYS = (PAYS as unknown as { features: Pays[] }).features;
export const ZOOM_MAX = 3000; // assez pour voir un chat faire le tour de son jardin

type Etat = { lon: number; lat: number; zoom: number };

// Des étoiles fixes autour de la Terre (toujours les mêmes, pour qu'elles ne sautent pas).
const ETOILES = Array.from({ length: 140 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12543.123;
  return { x: a - Math.floor(a), y: b - Math.floor(b), r: 0.4 + ((i * 7) % 10) / 12, v: (i % 5) / 5 };
});

export function Globe({ traces, choisi, vers, onChoisir, pays = null, onPays, surligne = [], hauteur = "h-[62vh] min-h-[340px]" }: { traces: TraceGlobe[]; choisi: number | null; vers: { lon: number; lat: number; zoom: number; n: number } | null; onChoisir: (i: number) => void; pays?: string | null; onPays?: (code: string | null) => void; surligne?: string[]; hauteur?: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const etat = useRef<Etat>({ lon: -10, lat: 25, zoom: 1 });
  const elan = useRef({ vlon: 0, vlat: 0 });
  const doigts = useRef(new Map<number, { x: number; y: number }>());
  const avant = useRef<{ e: Etat; d: number; x: number; y: number } | null>(null);
  const bouge = useRef(0); // combien le doigt a bougé (en pixels)
  const tenu = useRef({ t: 0, max: 0 });
  const donnees = useRef({ traces, choisi, pays, surligne });
  donnees.current = { traces, choisi, pays, surligne };
  const anim = useRef<{ de: Etat; a: Etat; t0: number } | null>(null);
  const calme = useRef(performance.now()); // le dernier moment où on a touché le globe

  // Aller vers un trajet (après une recherche ou un toucher) : le globe tourne doucement jusqu'à lui.
  useEffect(() => {
    if (!vers) return;
    anim.current = { de: { ...etat.current }, a: { lon: -vers.lon, lat: vers.lat, zoom: vers.zoom }, t0: performance.now() };
    elan.current = { vlon: 0, vlat: 0 };
    calme.current = performance.now();
  }, [vers?.n]);

  useEffect(() => {
    const c = toile.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const debut = performance.now();
    const dessine = (t: number) => {
      try {
        dessiner(t);
      } catch {
        /* une image ratée : on continue avec la suivante */
      }
      raf = requestAnimationFrame(dessine);
    };
    const dessiner = (t: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const e = etat.current;
      if (anim.current) {
        const k = Math.min(1, (t - anim.current.t0) / 1100), s = 1 - Math.pow(1 - k, 3);
        const { de, a } = anim.current;
        let dl = a.lon - de.lon; dl = ((dl + 540) % 360) - 180;
        e.lon = de.lon + dl * s; e.lat = de.lat + (a.lat - de.lat) * s; e.zoom = de.zoom + (a.zoom - de.zoom) * s;
        if (k >= 1) anim.current = null;
      } else if (!doigts.current.size) {
        e.lon += elan.current.vlon; e.lat = Math.max(-80, Math.min(80, e.lat + elan.current.vlat));
        elan.current.vlon *= 0.95; elan.current.vlat *= 0.95;
        // Au repos, la Terre tourne toute seule, tout doucement (seulement vue de loin, quand rien n'est choisi).
        const d = donnees.current;
        if (t - calme.current > 3500 && e.zoom < 1.6 && d.choisi === null && !d.pays && !d.surligne.length) {
          e.lon += Math.min(1, (t - calme.current - 3500) / 2000) * 0.06;
        }
      }
      const rayon = (Math.min(w, h) / 2 - 8) * e.zoom;
      const proj = geoOrthographic().scale(rayon).translate([w / 2, h / 2]).rotate([e.lon, -e.lat]).clipAngle(90);
      const chemin = geoPath(proj, ctx);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      // L'espace : un fond bleu nuit et des étoiles qui scintillent doucement.
      const fond = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
      fond.addColorStop(0, "#101b44"); fond.addColorStop(1, "#05081a");
      ctx.fillStyle = fond; ctx.fillRect(0, 0, w, h);
      if (rayon < Math.hypot(w, h) / 2) for (const s of ETOILES) {
        ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 900 + s.v * 6.28));
        ctx.fillStyle = "#e9eeff"; ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // L'atmosphère : une lueur bleue tout autour de la Terre.
      const halo = ctx.createRadialGradient(cx, cy, rayon * 0.96, cx, cy, rayon * 1.16);
      halo.addColorStop(0, "rgba(110,170,255,.55)"); halo.addColorStop(0.35, "rgba(80,140,255,.22)"); halo.addColorStop(1, "rgba(80,140,255,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, rayon * 1.16, 0, Math.PI * 2); ctx.fill();
      // La mer, éclairée par le soleil en haut à gauche.
      const lx = cx - rayon * 0.42, ly = cy - rayon * 0.42;
      const mer = ctx.createRadialGradient(lx, ly, rayon * 0.05, cx, cy, rayon * 1.02);
      mer.addColorStop(0, "#2f5aa8"); mer.addColorStop(0.55, "#183170"); mer.addColorStop(1, "#0b1640");
      ctx.fillStyle = mer; ctx.beginPath(); chemin({ type: "Sphere" }); ctx.fill();
      ctx.strokeStyle = "rgba(170,200,255,.07)"; ctx.lineWidth = 0.6; ctx.beginPath(); chemin(GRILLE); ctx.stroke();
      // Les terres, elles aussi éclairées, avec des côtes fines et lumineuses.
      const terre = ctx.createRadialGradient(lx, ly, rayon * 0.05, cx, cy, rayon);
      terre.addColorStop(0, "#6a7fc0"); terre.addColorStop(0.6, "#45568f"); terre.addColorStop(1, "#2d3a6a");
      ctx.fillStyle = terre; ctx.beginPath(); chemin(PAYS); ctx.fill();
      ctx.strokeStyle = "rgba(190,210,255,.28)"; ctx.lineWidth = 0.6; ctx.stroke();
      // Les pays où vit l'animal cherché, en or (comme sur la carte des fiches)
      if (donnees.current.surligne.length) {
        const set = new Set(donnees.current.surligne);
        ctx.save();
        ctx.shadowColor = "#ffd77a"; ctx.shadowBlur = 8;
        ctx.fillStyle = "#f3c35a"; ctx.strokeStyle = "rgba(255,243,207,.8)"; ctx.lineWidth = 0.7; ctx.beginPath();
        for (const f of LISTE_PAYS) if (set.has(f.properties.code)) chemin(f as unknown as GeoPermissibleObjects);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      // Le pays choisi, en or (comme sur la carte des fiches)
      const choix = donnees.current.pays ? LISTE_PAYS.find((f) => f.properties.code === donnees.current.pays) : undefined;
      if (choix) {
        ctx.save();
        ctx.shadowColor = "#ffd77a"; ctx.shadowBlur = 10 + 8 * (0.5 + 0.5 * Math.sin(t / 380));
        ctx.fillStyle = "#f3c35a"; ctx.strokeStyle = "#fff3cf"; ctx.lineWidth = 1.2;
        ctx.beginPath(); chemin(choix as unknown as GeoPermissibleObjects); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      // Le relief de la sphère : le bord s'assombrit, et un reflet doux près du soleil.
      const ombre = ctx.createRadialGradient(lx, ly, rayon * 0.2, cx, cy, rayon * 1.01);
      ombre.addColorStop(0, "rgba(255,255,255,.10)"); ombre.addColorStop(0.45, "rgba(255,255,255,0)"); ombre.addColorStop(0.8, "rgba(3,6,25,.18)"); ombre.addColorStop(1, "rgba(3,6,25,.55)");
      ctx.fillStyle = ombre; ctx.beginPath(); chemin({ type: "Sphere" }); ctx.fill();
      ctx.strokeStyle = "rgba(150,195,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); chemin({ type: "Sphere" }); ctx.stroke();
      // Les trajets, et la petite lumière qui voyage sur chacun
      const { traces: tr, choisi: ch } = donnees.current;
      for (const v of tr) {
        const actif = ch === null || ch === v.i;
        ctx.globalAlpha = actif ? 0.95 : 0.22;
        ctx.strokeStyle = v.couleur; ctx.lineWidth = ch === v.i ? 3.2 : 1.8; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.beginPath(); chemin({ type: "LineString", coordinates: v.points.map(([la, lo]) => [lo, la]) }); ctx.stroke();
        if (actif && v.points.length > 1) {
          const duree = ch === v.i ? 4000 : 7000 + (v.i % 5) * 1000;
          const k = ((((t - debut) / duree + (v.i % 7) * 0.13) % 1) + 1) % 1; // toujours entre 0 et 1
          const n = v.points.length - 1, f = k * n, j = Math.floor(f);
          const [a, b] = [v.points[j], v.points[Math.min(n, j + 1)]];
          const p = geoInterpolate([a[1], a[0]], [b[1], b[0]])(f - j);
          const rot = proj.rotate();
          const xy = proj(p);
          // seulement si le point est sur la face visible
          const cosc = Math.sin((p[1] * Math.PI) / 180) * Math.sin((-rot[1] * Math.PI) / 180) + Math.cos((p[1] * Math.PI) / 180) * Math.cos((-rot[1] * Math.PI) / 180) * Math.cos(((p[0] + rot[0]) * Math.PI) / 180);
          if (xy && cosc > 0) {
            const r = ch === v.i ? 7 : 5;
            const g = ctx.createRadialGradient(xy[0], xy[1], 0, xy[0], xy[1], r * 2.2);
            g.addColorStop(0, "#ffffff"); g.addColorStop(0.25, v.couleur); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xy[0], xy[1], r * 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(dessine);
    return () => cancelAnimationFrame(raf);
  }, []);

  function point(e: React.PointerEvent) {
    const r = toile.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function depart() {
    const p = [...doigts.current.values()];
    if (!p.length) return (avant.current = null);
    const x = p.reduce((s, a) => s + a.x, 0) / p.length, y = p.reduce((s, a) => s + a.y, 0) / p.length;
    avant.current = { e: { ...etat.current }, d: p.length > 1 ? Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) : 0, x, y };
  }
  const zoomer = (f: number) => {
    anim.current = { de: { ...etat.current }, a: { ...etat.current, zoom: Math.max(0.8, Math.min(ZOOM_MAX, etat.current.zoom * f)) }, t0: performance.now() };
    calme.current = performance.now();
  };
  const remettre = () => {
    anim.current = { de: { ...etat.current }, a: { lon: -10, lat: 25, zoom: 1 }, t0: performance.now() };
    onPays?.(null);
  };
  return (
    <div className="relative h-full">
    <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
      <button type="button" aria-label="Zoomer" onClick={() => zoomer(2)} className="grid size-10 place-items-center rounded-full bg-white/10 text-xl font-black text-white ring-1 ring-white/25 backdrop-blur-md">+</button>
      <button type="button" aria-label="Dézoomer" onClick={() => zoomer(0.5)} className="grid size-10 place-items-center rounded-full bg-white/10 text-xl font-black text-white ring-1 ring-white/25 backdrop-blur-md">−</button>
      <button type="button" aria-label="Revoir toute la Terre" onClick={remettre} className="grid size-10 place-items-center rounded-full bg-white/10 text-lg text-white ring-1 ring-white/25 backdrop-blur-md">⟲</button>
    </div>
    <canvas
      ref={toile}
      className={`block ${hauteur} w-full touch-none select-none`}
      aria-label="Le globe : fais-le tourner avec le doigt"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        anim.current = null;
        calme.current = performance.now();
        doigts.current.set(e.pointerId, point(e));
        bouge.current = 0;
        tenu.current = { t: performance.now(), max: doigts.current.size };
        elan.current = { vlon: 0, vlat: 0 };
        depart();
      }}
      onPointerMove={(e) => {
        if (!doigts.current.has(e.pointerId) || !avant.current) return;
        const avantDoigt = doigts.current.get(e.pointerId)!;
        doigts.current.set(e.pointerId, point(e));
        const p = [...doigts.current.values()];
        const b = avant.current, w = toile.current!.clientWidth, h = toile.current!.clientHeight;
        const x = p.reduce((s, a) => s + a.x, 0) / p.length, y = p.reduce((s, a) => s + a.y, 0) / p.length;
        bouge.current += Math.hypot(point(e).x - avantDoigt.x, point(e).y - avantDoigt.y);
        tenu.current.max = Math.max(tenu.current.max, doigts.current.size);
        calme.current = performance.now();
        const rayon = (Math.min(w, h) / 2 - 8) * b.e.zoom;
        const deg = 90 / rayon;
        const st = etat.current;
        if (p.length > 1 && b.d > 0) st.zoom = Math.max(0.8, Math.min(ZOOM_MAX, (b.e.zoom * Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y)) / b.d));
        st.lon = b.e.lon + (x - b.x) * deg;
        st.lat = Math.max(-80, Math.min(80, b.e.lat + (y - b.y) * deg));
        const ici = point(e);
        if (p.length === 1) elan.current = { vlon: (ici.x - avantDoigt.x) * deg * 0.5, vlat: (ici.y - avantDoigt.y) * deg * 0.5 };
      }}
      onPointerUp={(e) => {
        // Un toucher, même si le doigt a un peu tremblé (comme sur un vrai téléphone).
        const tape = bouge.current < 14 && tenu.current.max === 1 && performance.now() - tenu.current.t < 700 && doigts.current.size === 1;
        doigts.current.delete(e.pointerId);
        depart();
        if (!tape) return;
        // Un toucher : le trajet le plus proche du doigt (s'il est assez près).
        const { x, y } = point(e);
        const w = toile.current!.clientWidth, h = toile.current!.clientHeight, et = etat.current;
        const proj = geoOrthographic().scale((Math.min(w, h) / 2 - 8) * et.zoom).translate([w / 2, h / 2]).rotate([et.lon, -et.lat]).clipAngle(90);
        let meilleur = -1, dist = 30;
        for (const v of donnees.current.traces) for (const [la, lo] of v.points) {
          const q = proj([lo, la]);
          if (!q) continue;
          const d = Math.hypot(q[0] - x, q[1] - y);
          if (d < dist) { dist = d; meilleur = v.i; }
        }
        if (meilleur >= 0) return onChoisir(meilleur);
        // Sinon : le pays sous le doigt.
        const lieu = proj.invert?.([x, y]);
        if (!lieu || !onPays) return;
        const f = LISTE_PAYS.find((c) => geoContains(c as unknown as GeoPermissibleObjects, lieu));
        onPays(f ? f.properties.code : null);
      }}
      onPointerCancel={(e) => { doigts.current.delete(e.pointerId); depart(); }}
      onWheel={(e) => { anim.current = null; etat.current.zoom = Math.max(0.8, Math.min(ZOOM_MAX, etat.current.zoom * (e.deltaY < 0 ? 1.25 : 1 / 1.25))); }}
    />
    </div>
  );
}

/** Le centre d'un trajet et le zoom pour bien le voir. */
export function cadrer(points: [number, number][]) {
  const la = points.map((p) => p[0]), lo = points.map((p) => p[1]);
  const lat = (Math.max(...la) + Math.min(...la)) / 2, lon = (Math.max(...lo) + Math.min(...lo)) / 2;
  const etendue = Math.max(Math.max(...la) - Math.min(...la), (Math.max(...lo) - Math.min(...lo)) * Math.cos((lat * Math.PI) / 180), 0.004);
  return { lat, lon, zoom: Math.max(1, Math.min(ZOOM_MAX, 60 / etendue)) };
}

/** Le centre d'un pays et le zoom pour bien le voir. */
export function cadrerPays(code: string) {
  const f = LISTE_PAYS.find((c) => c.properties.code === code) as unknown as GeoPermissibleObjects | undefined;
  if (!f) return null;
  const [lon, lat] = geoCentroid(f);
  const [[x0, y0], [x1, y1]] = geoBounds(f);
  const etendue = Math.max(y1 - y0, ((x1 - x0 + 360) % 360 || 360) * Math.cos((lat * Math.PI) / 180), 1);
  return { lat, lon, zoom: Math.max(1, Math.min(ZOOM_MAX, 70 / etendue)) };
}

/** Le centre et le zoom pour voir tous les pays d'une liste. */
export function cadrerListe(codes: string[]) {
  const fs = LISTE_PAYS.filter((c) => codes.includes(c.properties.code));
  if (!fs.length) return null;
  const tout = { type: "FeatureCollection", features: fs } as unknown as GeoPermissibleObjects;
  const [lon, lat] = geoCentroid(tout);
  const [[x0, y0], [x1, y1]] = geoBounds(tout);
  const etendue = Math.max(y1 - y0, ((x1 - x0 + 360) % 360 || 360) * Math.cos((lat * Math.PI) / 180), 1);
  return { lat, lon, zoom: Math.max(1, Math.min(8, 70 / etendue)) };
}

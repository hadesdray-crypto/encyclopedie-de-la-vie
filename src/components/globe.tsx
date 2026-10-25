// Le globe : la Terre en 3D, qu'on fait tourner avec un doigt et qu'on zoome avec deux doigts.
// Tout est dessiné sur l'appareil (sans Internet), à partir des contours des pays de l'application.
import { useEffect, useRef } from "react";
import { geoArea, geoGraticule10, geoInterpolate, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import monde from "@/data/monde.json";

export type TraceGlobe = { i: number; couleur: string; points: [number, number][] };

// Les contours de l'application sont écrits en (x = longitude + 180, y = 90 − latitude) : on les relit en vraies coordonnées.
const PAYS: GeoPermissibleObjects = {
  type: "FeatureCollection",
  features: Object.values((monde as { pays: Record<string, string> }).pays).map((d) => {
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
    return { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: fermes.map((r) => {
      // Le bon sens de rotation : un pays fait toujours moins d'une demi-Terre.
      const poly = { type: "Polygon" as const, coordinates: [r] };
      return geoArea(poly) > 2 * Math.PI ? [r.slice().reverse()] : [r];
    }) } };
  }),
} as unknown as GeoPermissibleObjects;
const GRILLE = geoGraticule10();

type Etat = { lon: number; lat: number; zoom: number };

export function Globe({ traces, choisi, vers, onChoisir }: { traces: TraceGlobe[]; choisi: number | null; vers: { lon: number; lat: number; zoom: number; n: number } | null; onChoisir: (i: number) => void }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const etat = useRef<Etat>({ lon: -10, lat: 25, zoom: 1 });
  const elan = useRef({ vlon: 0, vlat: 0 });
  const doigts = useRef(new Map<number, { x: number; y: number }>());
  const avant = useRef<{ e: Etat; d: number; x: number; y: number } | null>(null);
  const bouge = useRef(0);
  const donnees = useRef({ traces, choisi });
  donnees.current = { traces, choisi };
  const anim = useRef<{ de: Etat; a: Etat; t0: number } | null>(null);

  // Aller vers un trajet (après une recherche ou un toucher) : le globe tourne doucement jusqu'à lui.
  useEffect(() => {
    if (!vers) return;
    anim.current = { de: { ...etat.current }, a: { lon: -vers.lon, lat: vers.lat, zoom: vers.zoom }, t0: performance.now() };
    elan.current = { vlon: 0, vlat: 0 };
  }, [vers?.n]);

  useEffect(() => {
    const c = toile.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const debut = performance.now();
    const dessine = (t: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
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
      }
      const rayon = (Math.min(w, h) / 2 - 8) * e.zoom;
      const proj = geoOrthographic().scale(rayon).translate([w / 2, h / 2]).rotate([e.lon, -e.lat]).clipAngle(90);
      const chemin = geoPath(proj, ctx);
      ctx.clearRect(0, 0, w, h);
      // La mer, avec une petite lueur autour de la Terre
      const halo = ctx.createRadialGradient(w / 2, h / 2, rayon * 0.9, w / 2, h / 2, rayon * 1.12);
      halo.addColorStop(0, "rgba(90,140,255,.35)"); halo.addColorStop(1, "rgba(90,140,255,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(w / 2, h / 2, rayon * 1.12, 0, Math.PI * 2); ctx.fill();
      const mer = ctx.createRadialGradient(w / 2 - rayon * 0.3, h / 2 - rayon * 0.3, rayon * 0.1, w / 2, h / 2, rayon);
      mer.addColorStop(0, "#1a2a5c"); mer.addColorStop(1, "#14214a");
      ctx.fillStyle = mer; ctx.beginPath(); chemin({ type: "Sphere" }); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 0.6; ctx.beginPath(); chemin(GRILLE); ctx.stroke();
      ctx.fillStyle = "#3b4a7a"; ctx.strokeStyle = "#0f1838"; ctx.lineWidth = 0.5; ctx.beginPath(); chemin(PAYS); ctx.fill(); ctx.stroke();
      // Les trajets, et la petite lumière qui voyage sur chacun
      const { traces: tr, choisi: ch } = donnees.current;
      for (const v of tr) {
        const actif = ch === null || ch === v.i;
        ctx.globalAlpha = actif ? 0.95 : 0.22;
        ctx.strokeStyle = v.couleur; ctx.lineWidth = ch === v.i ? 3.2 : 1.8; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.beginPath(); chemin({ type: "LineString", coordinates: v.points.map(([la, lo]) => [lo, la]) }); ctx.stroke();
        if (actif && v.points.length > 1) {
          const duree = ch === v.i ? 4000 : 7000 + (v.i % 5) * 1000;
          const k = (((t - debut) / duree) + (v.i % 7) * 0.13) % 1;
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
      raf = requestAnimationFrame(dessine);
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
  return (
    <canvas
      ref={toile}
      className="block h-[62vh] min-h-[340px] w-full touch-none select-none"
      aria-label="Le globe : fais-le tourner avec le doigt"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        anim.current = null;
        doigts.current.set(e.pointerId, point(e));
        bouge.current = 0;
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
        bouge.current++;
        const rayon = (Math.min(w, h) / 2 - 8) * b.e.zoom;
        const deg = 90 / rayon;
        const st = etat.current;
        if (p.length > 1 && b.d > 0) st.zoom = Math.max(0.8, Math.min(12, (b.e.zoom * Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y)) / b.d));
        st.lon = b.e.lon + (x - b.x) * deg;
        st.lat = Math.max(-80, Math.min(80, b.e.lat + (y - b.y) * deg));
        const ici = point(e);
        if (p.length === 1) elan.current = { vlon: (ici.x - avantDoigt.x) * deg * 0.5, vlat: (ici.y - avantDoigt.y) * deg * 0.5 };
      }}
      onPointerUp={(e) => {
        const tape = bouge.current < 4 && doigts.current.size === 1;
        doigts.current.delete(e.pointerId);
        depart();
        if (!tape) return;
        // Un toucher : le trajet le plus proche du doigt (s'il est assez près).
        const { x, y } = point(e);
        const w = toile.current!.clientWidth, h = toile.current!.clientHeight, et = etat.current;
        const proj = geoOrthographic().scale((Math.min(w, h) / 2 - 8) * et.zoom).translate([w / 2, h / 2]).rotate([et.lon, -et.lat]).clipAngle(90);
        let meilleur = -1, dist = 22;
        for (const v of donnees.current.traces) for (const [la, lo] of v.points) {
          const q = proj([lo, la]);
          if (!q) continue;
          const d = Math.hypot(q[0] - x, q[1] - y);
          if (d < dist) { dist = d; meilleur = v.i; }
        }
        if (meilleur >= 0) onChoisir(meilleur);
      }}
      onPointerCancel={(e) => { doigts.current.delete(e.pointerId); depart(); }}
      onWheel={(e) => { etat.current.zoom = Math.max(0.8, Math.min(12, etat.current.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); }}
    />
  );
}

/** Le centre d'un trajet et le zoom pour bien le voir. */
export function cadrer(points: [number, number][]) {
  const la = points.map((p) => p[0]), lo = points.map((p) => p[1]);
  const lat = (Math.max(...la) + Math.min(...la)) / 2, lon = (Math.max(...lo) + Math.min(...lo)) / 2;
  const etendue = Math.max(Math.max(...la) - Math.min(...la), (Math.max(...lo) - Math.min(...lo)) * Math.cos((lat * Math.PI) / 180), 0.5);
  return { lat, lon, zoom: Math.max(1, Math.min(12, 60 / etendue)) };
}

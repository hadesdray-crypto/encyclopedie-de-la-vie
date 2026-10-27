// Un petit globe rond (projection orthographique), tourné vers les pays où vit l'animal, qui sont en or.
// Il utilise la même carte du monde que le reste de l'application (monde.json).
import { useMemo } from "react";
import monde from "@/data/monde.json";

const PAYS = (monde as { pays: Record<string, string> }).pays;
type Anneau = [number, number][]; // [longitude, latitude]

let FORMES: Map<string, Anneau[]> | null = null;
/** Les contours des pays, lus une seule fois : x = longitude + 180, y = 90 − latitude. */
function formes() {
  if (FORMES) return FORMES;
  FORMES = new Map();
  for (const [code, d] of Object.entries(PAYS)) {
    const anneaux: Anneau[] = [];
    for (const morceau of d.split("M").filter(Boolean)) {
      const pts = morceau.replace(/Z/g, "").split("L").map((p) => {
        const [x, y] = p.trim().split(/[ ,]+/).map(Number);
        return [x - 180, 90 - y] as [number, number];
      }).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
      if (pts.length > 2) anneaux.push(pts);
    }
    FORMES.set(code, anneaux);
  }
  return FORMES;
}

/** Le centre des pays choisis (moyenne des points, avec les longitudes bien gérées autour de 180°). */
function centre(codes: string[]): [number, number] {
  let sx = 0, sy = 0, sl = 0, n = 0;
  for (const c of codes) for (const a of formes().get(c) ?? []) for (const [lon, lat] of a) {
    sx += Math.cos((lon * Math.PI) / 180); sy += Math.sin((lon * Math.PI) / 180); sl += lat; n++;
  }
  if (!n) return [10, 20];
  return [(Math.atan2(sy, sx) * 180) / Math.PI, sl / n];
}

function projeter(lon0: number, lat0: number) {
  const r = Math.PI / 180, cl = Math.cos(lat0 * r), sl = Math.sin(lat0 * r);
  return ([lon, lat]: [number, number]) => {
    const l = (lon - lon0) * r, p = lat * r;
    const cosc = sl * Math.sin(p) + cl * Math.cos(p) * Math.cos(l);
    const x = Math.cos(p) * Math.sin(l);
    const y = cl * Math.sin(p) - sl * Math.cos(p) * Math.cos(l);
    return { x: 50 + x * 46, y: 50 - y * 46, vu: cosc > 0 };
  };
}

function chemin(anneaux: Anneau[], proj: ReturnType<typeof projeter>) {
  let d = "";
  for (const a of anneaux) {
    let ouvert = false;
    for (const pt of a) {
      const q = proj(pt);
      if (!q.vu) { ouvert = false; continue; }
      d += `${ouvert ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      ouvert = true;
    }
  }
  return d;
}

export function MiniGlobe({ pays, className = "" }: { pays: string[]; className?: string }) {
  const cle = pays.join(",");
  const { terres, ors } = useMemo(() => {
    const [lon0, lat0] = centre(pays);
    const proj = projeter(lon0, Math.max(-50, Math.min(50, lat0)));
    const choisis = new Set(pays);
    let terres = "", ors = "";
    for (const [code, a] of formes()) {
      const d = chemin(a, proj);
      if (choisis.has(code)) ors += d;
      else terres += d;
    }
    return { terres, ors };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Petit globe : en or, les pays où il vit">
      <defs>
        <radialGradient id="mg-mer" cx=".38" cy=".32" r=".75"><stop offset="0" stopColor="#5fb4ff" /><stop offset=".7" stopColor="#1d5fb8" /><stop offset="1" stopColor="#0e2f6b" /></radialGradient>
        <radialGradient id="mg-lumiere" cx=".32" cy=".26" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <clipPath id="mg-rond"><circle cx="50" cy="50" r="46" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#mg-mer)" />
      <g clipPath="url(#mg-rond)">
        <path d={terres} fill="#9fd37a" stroke="#4f8a3a" strokeWidth=".35" fillRule="evenodd" />
        <path d={ors} fill="#ffd34a" stroke="#a8700c" strokeWidth=".6" fillRule="evenodd" />
      </g>
      <circle cx="50" cy="50" r="46" fill="url(#mg-lumiere)" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

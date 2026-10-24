// La carte du monde de l'Aventure : les animaux suivis par GPS par des scientifiques.
// En couleur, les pays où vit chaque animal (Mammal Diversity Database).
// Les trajets ne sont dessinés que s'ils ont été chargés une fois, avec Internet et l'accord d'un adulte.
import { PAR_ID, type Espece } from "@/data/catalogue";
import suivi from "@/data/suivi-gps.json";
import monde from "@/data/monde.json";

export type Etude = { etude: number; nom: string; capteur: string };
export type Trace = { individu: string; points: [number, number][] };

const ETUDES = suivi as Record<string, Etude[]>;
const PAYS = (monde as { pays: Record<string, string> }).pays;
export const COULEURS = ["#f3c35a", "#7fd6ff", "#f3a0e0", "#9be08a", "#ff9f6e", "#c9a8ff"];
const CLE = "leonie-traces-";

export type Voyageur = { espece: Espece; etude: Etude; couleur: string; traces: Trace[] | null };

export function lireTraces(etude: number): Trace[] | null {
  try {
    return JSON.parse(localStorage.getItem(CLE + etude) || "null");
  } catch {
    return null;
  }
}

export function garderTraces(etude: number, traces: Trace[]) {
  const json = JSON.stringify(traces);
  try {
    localStorage.setItem(CLE + etude, json);
  } catch {
    /* plein */
  }
  return json.length;
}

export function voyageurs(): Voyageur[] {
  const especes = [...PAR_ID.values()];
  return Object.entries(ETUDES)
    .map(([latin, etudes], i) => {
      const espece = especes.find((e) => e.latin === latin);
      return espece ? { espece, etude: etudes[0], couleur: COULEURS[i % COULEURS.length], traces: lireTraces(etudes[0].etude) } : null;
    })
    .filter((v): v is Voyageur => !!v);
}

export function etudeDe(espece: Espece) {
  return ETUDES[espece.latin]?.[0];
}

// Le centre d'un pays, d'après le contour dessiné (carte 360 × 180).
const centres = new Map<string, [number, number]>();
function centrePays(code: string): [number, number] | null {
  if (centres.has(code)) return centres.get(code)!;
  const d = PAYS[code];
  if (!d) return null;
  const n = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  let x0 = 360, x1 = 0, y0 = 180, y1 = 0;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
  }
  const c: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2];
  centres.set(code, c);
  return c;
}

/** Où placer le point de l'animal : au milieu de son trajet, sinon au milieu des pays où il vit. */
function repere(v: Voyageur): [number, number] | null {
  const pts = v.traces?.flatMap((t) => t.points) ?? [];
  if (pts.length) {
    const x = pts.reduce((s, p) => s + p[1] + 180, 0) / pts.length;
    const y = pts.reduce((s, p) => s + 90 - p[0], 0) / pts.length;
    return [x, y];
  }
  const cs = (v.espece.pays ?? []).map(centrePays).filter((c): c is [number, number] => !!c);
  if (!cs.length) return null;
  return [cs.reduce((s, c) => s + c[0], 0) / cs.length, cs.reduce((s, c) => s + c[1], 0) / cs.length];
}

export default function CarteAventure({ petite = false, choisi }: { petite?: boolean; choisi?: string }) {
  const liste = voyageurs();
  const couleurPays = new Map<string, string>();
  for (const v of liste) for (const p of v.espece.pays ?? []) if (!couleurPays.has(p)) couleurPays.set(p, v.couleur);
  return (
    <svg
      viewBox={petite ? "0 14 360 140" : "0 12 360 150"}
      preserveAspectRatio={petite ? "xMidYMid slice" : undefined}
      className={petite ? "absolute inset-0 size-full" : "w-full rounded-3xl bg-[#14214a]"}
      role="img"
      aria-label="Carte du monde des animaux suivis par GPS"
    >
      {Object.entries(PAYS).map(([code, d]) => {
        const c = couleurPays.get(code);
        return <path key={code} d={d} fill={c ?? "#3b4a7a"} fillOpacity={c ? (petite ? 0.45 : 0.55) : 1} stroke="#22305e" strokeWidth=".3" />;
      })}
      {liste.map((v) =>
        v.traces?.map((t) => (
          <polyline key={v.etude.etude + t.individu} points={t.points.map((p) => `${p[1] + 180},${90 - p[0]}`).join(" ")} fill="none" stroke={v.couleur} strokeWidth={petite ? 0.8 : 0.6} strokeLinejoin="round" />
        )),
      )}
      {liste.map((v) => {
        const r = repere(v);
        if (!r) return null;
        const grand = choisi === v.espece.id;
        return (
          <g key={v.espece.id}>
            <circle cx={r[0]} cy={r[1]} r={grand ? 7 : 5} fill={v.couleur} opacity=".35" className="onde" style={{ transformOrigin: `${r[0]}px ${r[1]}px` }} />
            <circle cx={r[0]} cy={r[1]} r={grand ? 3.2 : 2.4} fill={v.couleur} stroke="#fff8ea" strokeWidth=".8" />
          </g>
        );
      })}
    </svg>
  );
}

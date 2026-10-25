// « Voir le parcours » : le trajet d'un animal tout seul, zoomé pour remplir la fenêtre,
// qu'il fasse 200 mètres (un chat) ou 10 000 kilomètres (un oiseau).
// Départ en vert, arrivée en rouge, une lumière qui suit le vrai chemin GPS, et une échelle en mètres ou en kilomètres.
import { useMemo, useState } from "react";
import { LuPlay } from "react-icons/lu";
import monde from "@/data/monde.json";

const PAYS = (monde as { pays: Record<string, string> }).pays;
const KM_PAR_DEGRE = 111.32;

function echelle(kmLargeur: number) {
  // Une longueur « ronde » (1, 2 ou 5 × une puissance de 10) qui fait environ le quart de la fenêtre.
  const cible = kmLargeur / 4;
  const p = Math.pow(10, Math.floor(Math.log10(cible)));
  const n = [1, 2, 5, 10].map((m) => m * p).reverse().find((x) => x <= cible) ?? p;
  const texte = n >= 1 ? `${n.toLocaleString("fr-FR")} km` : `${Math.round(n * 1000).toLocaleString("fr-FR")} m`;
  return { km: n, texte };
}

export function Parcours({ points, couleur, arrivee }: { points: [number, number][]; couleur: string; arrivee: boolean }) {
  const [rejoue, setRejoue] = useState(0);
  const d = useMemo(() => {
    // Les longitudes restent continues, même si le trajet traverse la ligne de changement de date.
    const pts: [number, number][] = [];
    let decal = 0;
    points.forEach(([la, lo], k) => {
      if (k) {
        const avant = points[k - 1][1];
        if (lo - avant > 180) decal -= 360;
        else if (avant - lo > 180) decal += 360;
      }
      pts.push([la, lo + decal]);
    });
    const las = pts.map((p) => p[0]), los = pts.map((p) => p[1]);
    const latm = (Math.max(...las) + Math.min(...las)) / 2;
    const k = Math.max(0.15, Math.cos((latm * Math.PI) / 180)); // pour que les distances est-ouest soient justes
    const xs = los.map((x) => x * k), ys = las.map((y) => -y);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const ext = Math.max(x1 - x0, y1 - y0, 0.0015);
    const pad = ext * 0.18;
    // Une fenêtre un peu plus large que haute (comme l'écran).
    let w = Math.max(x1 - x0, ext * 0.5) + pad * 2, h = Math.max(y1 - y0, ext * 0.4) + pad * 2;
    if (w / h < 1.6) w = h * 1.6; else h = w / 1.6; // exactement la forme de la fenêtre
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    x0 = cx - w / 2; y0 = cy - h / 2;
    const chemin = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(6)},${ys[i].toFixed(6)}`).join(" ");
    return { k, x0, y0, w, h, chemin, depart: [xs[0], ys[0]], fin: [xs[xs.length - 1], ys[ys.length - 1]], ech: echelle(w * KM_PAR_DEGRE) };
  }, [points]);
  const u = d.w / 100; // une petite unité de la fenêtre, pour la taille des repères
  const barre = d.ech.km / KM_PAR_DEGRE;
  return (
    <div className="mt-3">
      <div className="relative overflow-hidden rounded-2xl ring-2 ring-[#e8c98a]/50">
        <svg viewBox={`${d.x0} ${d.y0} ${d.w} ${d.h}`} className="block aspect-[1.6] w-full bg-[#14214a]" role="img" aria-label="Le parcours de l'animal, du départ à l'arrivée">
          <g transform={`scale(${d.k},1) translate(-180,-90)`}>
            {Object.entries(PAYS).map(([c, p]) => <path key={c} d={p} fill="#3b4a7a" stroke="#0f1838" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />)}
          </g>
          <path d={d.chemin} fill="none" stroke={couleur} strokeOpacity=".25" strokeWidth={u * 1.6} strokeLinecap="round" strokeLinejoin="round" />
          <path key={`t${rejoue}`} d={d.chemin} pathLength={1} className="trajet-lent" fill="none" stroke={couleur} strokeWidth={u * 0.8} strokeLinecap="round" strokeLinejoin="round" />
          <g key={`l${rejoue}`}>
            <circle r={u * 3.2} fill={couleur} opacity=".35" />
            <circle r={u * 1.6} fill="#fff" />
            <animateMotion dur="6s" repeatCount="indefinite" path={d.chemin} />
          </g>
          <circle cx={d.depart[0]} cy={d.depart[1]} r={u * 2.2} fill="#4cd964" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          {arrivee ? <circle cx={d.fin[0]} cy={d.fin[1]} r={u * 2.2} fill="#ff4d4d" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" /> : null}
          {/* L'échelle */}
          <g transform={`translate(${d.x0 + d.w * 0.05} ${d.y0 + d.h * 0.92})`}>
            <rect x={0} y={-u * 0.6} width={barre} height={u * 1.2} fill="#fff" />
            <text x={0} y={-u * 2} fontSize={u * 4.2} fontWeight={800} fill="#fff">{d.ech.texte}</text>
          </g>
        </svg>
        <button type="button" onClick={() => setRejoue((n) => n + 1)} className="absolute right-2 top-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/45 px-3 text-xs font-extrabold text-white ring-1 ring-white/25 backdrop-blur-md">
          <LuPlay className="size-3.5" /> Rejouer
        </button>
      </div>
      <p className="mt-1.5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-[#4cd964] ring-2 ring-white" /> Départ</span>
        {arrivee ? <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-[#ff4d4d] ring-2 ring-white" /> Arrivée (dernier point GPS)</span> : <span className="texte-doux">Arrivée non connue</span>}
      </p>
    </div>
  );
}

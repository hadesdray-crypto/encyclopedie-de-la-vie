// Petit aperçu satellite du trajet : une seule image légère (jpeg, ~40 Ko) au lieu de la carte en double.
// Toucher l'image ouvre le voyage en grand, où l'on peut zoomer. Sans Internet : la carte dessinée (Parcours).
import { useMemo, useState } from "react";
import { Parcours } from "@/components/parcours";
import { useInternet } from "@/lib/internet";
import { suivreLeGlobe } from "@/lib/trajet";

type P = [number, number];
const R = 6378137;
const mx = (lo: number) => (lo * Math.PI * R) / 180;
const my = (la: number) => R * Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, la)) * Math.PI) / 360));

export function ApercuSatellite({ points, couleur, arrivee, onOuvrir }: { points: P[]; couleur: string; arrivee: boolean; onOuvrir: () => void }) {
  const { permis, connecte } = useInternet();
  const [rate, setRate] = useState(false);
  const d = useMemo(() => {
    let decal = 0;
    const pts = suivreLeGlobe(points).map(([la, lo], k, a) => {
      if (k) { const av = a[k - 1][1]; if (lo - av > 180) decal -= 360; else if (av - lo > 180) decal += 360; }
      return [la, lo + decal] as P;
    });
    const xs = pts.map((q) => mx(q[1])), ys = pts.map((q) => my(q[0]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let w = Math.max(x1 - x0, 400) * 1.3, h = Math.max(y1 - y0, 250) * 1.3;
    if (w / h < 1.6) w = h * 1.6; else h = w / 1.6;
    // Au-delà d'un tour du monde l'image n'a plus de sens : on garde la carte dessinée.
    const trop = w > 38e6;
    const bx0 = cx - w / 2, by0 = cy - h / 2;
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bx0},${by0},${bx0 + w},${by0 + h}&bboxSR=3857&imageSR=3857&size=640,400&format=jpg&f=image`;
    const ligne = xs.map((x, i) => `${i ? "L" : "M"}${((x - bx0) / w * 640).toFixed(1)},${(400 - (ys[i] - by0) / h * 400).toFixed(1)}`).join(" ");
    const dep = [((xs[0] - bx0) / w) * 640, 400 - ((ys[0] - by0) / h) * 400];
    const fin = [((xs[xs.length - 1] - bx0) / w) * 640, 400 - ((ys[ys.length - 1] - by0) / h) * 400];
    return { url, ligne, trop, dep, fin };
  }, [points]);
  if (!permis || !connecte || d.trop || rate) return <Parcours points={points} couleur={couleur} arrivee={arrivee} />;
  return (
    <div className="mt-3">
      <button type="button" onClick={onOuvrir} aria-label="Agrandir et zoomer sur les images satellite" className="relative block w-full overflow-hidden rounded-2xl ring-2 ring-[#e8c98a]/50">
        <img src={d.url} alt="Le trajet vu du ciel" loading="eager" onError={() => setRate(true)} className="block aspect-[1.6] w-full bg-[#14214a] object-cover" />
        <svg viewBox="0 0 640 400" className="absolute inset-0 size-full" aria-hidden="true">
          <path d={d.ligne} fill="none" stroke="#000" strokeOpacity=".45" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d.ligne} fill="none" stroke={couleur} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={d.dep[0]} cy={d.dep[1]} r="8" fill="#4cd964" stroke="#fff" strokeWidth="2.5" />
          {arrivee ? <circle cx={d.fin[0]} cy={d.fin[1]} r="8" fill="#ff5d5d" stroke="#fff" strokeWidth="2.5" /> : null}
        </svg>
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-extrabold">Toucher pour zoomer</span>
      </button>
    </div>
  );
}

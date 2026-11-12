// Le chemin exact de l'animal, tel qu'il est tracé sur le globe : entre deux points GPS, la ligne la plus courte
// sur la sphère (un grand cercle). Les cartes à plat (images satellite) dessinaient des lignes droites,
// ce qui ne suivait pas le chemin du globe sur les longs trajets : on ajoute donc des points intermédiaires.
// Tous les vrais points sont conservés, aucun n'est déplacé.
import { geoDistance, geoInterpolate } from "d3-geo";

export type PointGps = [number, number]; // [latitude, longitude]

/** Ajoute des points sur le grand cercle entre deux points éloignés de plus de `pasKm`. */
export function suivreLeGlobe(points: PointGps[], pasKm = 100): PointGps[] {
  const sortie: PointGps[] = [];
  points.forEach((p, i) => {
    if (!i) { sortie.push(p); return; }
    const q = points[i - 1];
    const d = geoDistance([q[1], q[0]], [p[1], p[0]]) * 6371;
    const n = Math.min(400, Math.ceil(d / pasKm));
    if (n > 1) {
      const f = geoInterpolate([q[1], q[0]], [p[1], p[0]]);
      for (let k = 1; k < n; k++) { const [lo, la] = f(k / n); sortie.push([la, lo]); }
    }
    sortie.push(p);
  });
  return sortie;
}

// Fabrique src/data/monde.json : le contour de chaque pays, en coordonnées simples
// (x = longitude + 180, y = 90 - latitude), à partir de Natural Earth (domaine public).
// Usage : node scripts/carte_monde.mjs chemin/vers/ne_110m_admin_0_countries.geojson
import { readFileSync, writeFileSync } from "node:fs";

const source = process.argv[2];
if (!source) throw new Error("Donner le chemin du fichier GeoJSON Natural Earth 110m (pays).");
const geo = JSON.parse(readFileSync(source, "utf8"));

const r = (v) => Math.round(v * 10) / 10;
function anneau(points) {
  let d = "";
  let precedent = "";
  for (const [lon, lat] of points) {
    const p = `${r(lon + 180)} ${r(90 - lat)}`;
    if (p === precedent) continue;
    d += (d ? "L" : "M") + p;
    precedent = p;
  }
  return d + "Z";
}

const pays = {};
for (const f of geo.features) {
  const code = f.properties.ADM0_A3;
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const d = polys.map((poly) => poly.map(anneau).join("")).join("");
  pays[code] = (pays[code] ?? "") + d;
}
writeFileSync(new URL("../src/data/monde.json", import.meta.url), JSON.stringify({ largeur: 360, hauteur: 180, pays }));
console.log(Object.keys(pays).length, "pays");

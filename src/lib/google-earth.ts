// Préparer un voyage dans Google Earth (gratuit) : on écrit un petit fichier de visite guidée (KML) qui suit le trajet
// de l'animal, à sa hauteur (en l'air pour un oiseau, au ras du sol pour un animal terrestre), et on l'envoie à Google Earth.
// Aucune image de Google n'est copiée dans l'application : elle ne fait que transmettre le trajet.
// En cascade : 1) partager le fichier (le téléphone propose Google Earth) ; 2) le télécharger ; 3) ouvrir Google Earth au point de départ.
import { suivreLeGlobe } from "@/lib/trajet";
import type { Migration } from "@/components/migrations-connues";

export type VitesseVol = "lent" | "normal" | "rapide";
const KM_PAR_S: Record<VitesseVol, number> = { lent: 50, normal: 120, rapide: 300 };

const km = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
};
const cap = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180, dLo = (b[1] - a[1]) * r;
  const y = Math.sin(dLo) * Math.cos(b[0] * r), x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos(dLo);
  return (((Math.atan2(y, x) / r) % 360) + 360) % 360;
};
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Le trajet découpé en petits pas qui suivent le grand cercle du globe, pour que la visite suive exactement le chemin tracé. */
const densifier = (points: [number, number][]) => suivreLeGlobe(points, 250);

export function fabriquerKml(m: Migration, vitesse: VitesseVol): string {
  const air = m.categorie === "air";
  const haut = air ? 3000 : 40; // mètres au-dessus du sol
  const inclinaison = air ? 70 : 82; // 90 = regarder droit devant
  const pts = densifier(m.points);
  const vol = pts.map((p, i) => {
    const suite = pts[Math.min(pts.length - 1, i + 1)], dist = i ? km(pts[i - 1], p) : 0;
    const duree = i ? Math.max(0.6, dist / KM_PAR_S[vitesse]) : 4;
    const c = i < pts.length - 1 ? cap(p, suite) : cap(pts[i - 1] ?? p, p);
    return `<gx:FlyTo><gx:duration>${duree.toFixed(2)}</gx:duration><gx:flyToMode>smooth</gx:flyToMode><LookAt><longitude>${p[1].toFixed(4)}</longitude><latitude>${p[0].toFixed(4)}</latitude><altitude>${haut}</altitude><heading>${c.toFixed(1)}</heading><tilt>${inclinaison}</tilt><range>${air ? 400 : 60}</range><altitudeMode>relativeToGround</altitudeMode></LookAt></gx:FlyTo>`;
  }).join("");
  const etapes = m.etapes.map((e) => `<Placemark><name>${xml(e.nom)}</name><description>${xml(e.texte)}</description><Point><coordinates>${e.lon},${e.lat},0</coordinates></Point></Placemark>`).join("");
  const ligne = `<Placemark><name>${xml(m.nom)} : trajet approximatif</name><Style><LineStyle><color>ff5ac3f3</color><width>3</width></LineStyle></Style><LineString><tessellate>1</tessellate><coordinates>${m.points.map((p) => `${p[1]},${p[0]},0`).join(" ")}</coordinates></LineString></Placemark>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Document><name>${xml(m.nom)}</name>
<description>${xml(m.periode + " — " + m.pourquoi)}</description>${ligne}${etapes}
<gx:Tour><name>Voyager avec : ${xml(m.nom)}</name><gx:Playlist>${vol}</gx:Playlist></gx:Tour></Document></kml>`;
}

/** L'adresse de Google Earth (version web) posée au point de départ, à bonne hauteur. */
export function adresseEarth(m: Migration) {
  const [la, lo] = m.points[0], air = m.categorie === "air";
  const c = m.points.length > 1 ? cap(m.points[0], m.points[1]) : 0;
  return `https://earth.google.com/web/@${la.toFixed(5)},${lo.toFixed(5)},0a,${air ? 4000 : 300}d,35y,${c.toFixed(0)}h,${air ? 70 : 82}t,0r`;
}

/** Lance le voyage. Retourne une phrase qui dit à la personne ce qui s'est passé. */
export async function ouvrirGoogleEarth(m: Migration, vitesse: VitesseVol): Promise<string> {
  if (m.type === "carrefour" || m.points.length < 2) {
    window.open(adresseEarth(m), "_blank", "noopener");
    return "Google Earth s'ouvre à cet endroit. Tu peux tourner autour et regarder au sol ou dans le ciel.";
  }
  const nom = `${m.id}.kml`;
  const type = "application/vnd.google-earth.kml+xml";
  const fichier = new File([fabriquerKml(m, vitesse)], nom, { type });
  try {
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [fichier] })) {
      await nav.share({ files: [fichier], title: m.nom });
      return "Choisis Google Earth dans la liste. Puis lance la visite guidée (le triangle) : tu peux régler pause et retour dans Google Earth.";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "Annulé.";
  }
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(fichier); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => window.open(adresseEarth(m), "_blank", "noopener"), 600);
    return "Le fichier du trajet est téléchargé : ouvre-le avec Google Earth. En attendant, Google Earth s'ouvre au point de départ.";
  } catch {
    window.open(adresseEarth(m), "_blank", "noopener");
    return "Google Earth s'ouvre au point de départ du trajet.";
  }
}

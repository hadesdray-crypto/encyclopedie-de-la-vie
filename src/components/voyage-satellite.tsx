// « Voyager avec lui » : le vrai trajet GPS d'un animal, rejoué sur de vraies images satellite.
// Pour une enfant de 8 ans : un gros bouton ▶, ⏪ pour reculer, ⏩ pour avancer vite (🐢 🐇 🚀),
// une caméra qui suit l'animal (ou montre tout le voyage), et Plume qui commente avec les vrais kilomètres.
// Les images satellite viennent d'Internet (Esri World Imagery) : la page ne se lance que si un adulte
// a allumé Internet dans Profil > Coin des parents. Rien n'est enregistré sur l'appareil.
// Bonus : un fichier pour Google Earth, où l'on voit le trajet en 3D (et où l'on peut « voler » le long du trajet).
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuDownload, LuFastForward, LuLocateFixed, LuPause, LuPlay, LuRewind, LuScan, LuX } from "react-icons/lu";
import { Portrait } from "@/components/portrait";
import { PlumeDessin } from "@/components/plume-dessin";
import { useInternet } from "@/lib/internet";
import { dire } from "@/lib/parole";
import { appeler, moduleDisponible } from "@/lib/natif";

type Point = [number, number]; // [latitude, longitude]
type Props = {
  points: Point[];
  nom: string;
  photo: string | null;
  couleur: string;
  complet: boolean;
  depart?: string;
  arrivee?: string;
  onFermer: () => void;
};

const TUILE = 256;
const ZOOM_MAX = 17;
const VITESSES = [{ x: 1, emoji: "🐢", nom: "Doucement" }, { x: 3, emoji: "🐇", nom: "Vite" }, { x: 8, emoji: "🚀", nom: "Très vite" }];
const DUREE = 45; // secondes pour tout le voyage, à la vitesse 🐢
const tuileUrl = (z: number, x: number, y: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

// Coordonnées du « monde » (projection des cartes en ligne), au zoom 0 : de 0 à 256.
const wx = (lon: number) => ((lon + 180) / 360) * TUILE;
const wy = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TUILE;
};
function km(a: Point, b: Point) {
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}
const fmtKm = (k: number) => (k < 1 ? `${Math.round(k * 1000).toLocaleString("fr-FR")} m` : `${Math.round(k).toLocaleString("fr-FR")} km`);
const fmtDate = (d?: string) => (d ? new Date(d.replace(" ", "T")).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Longitudes continues (sans saut à la ligne de changement de date). */
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

export function VoyageSatellite(p: Props) {
  const { permis, connecte } = useInternet();
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = avant);
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0b0820] text-white" role="dialog" aria-label={`Le voyage de ${p.nom}`}>
      {permis && connecte ? (
        <Lecteur {...p} />
      ) : (
        <div className="m-auto max-w-sm px-6 text-center">
          <PlumeDessin anim="parle" className="mx-auto h-28 w-28" />
          <p className="mt-3 font-display text-2xl text-[#f3d48a]">Il faut Internet</p>
          <p className="mt-2 text-sm leading-relaxed">
            {permis
              ? "La tablette n'est pas connectée. Les images satellite viennent d'Internet : reviens quand il y a du réseau."
              : "Les vraies images satellite viennent d'Internet. Demande à un adulte de l'allumer dans Profil, « Coin des parents »."}
          </p>
          <button type="button" onClick={p.onFermer} className="bouton-bois mt-5 rounded-full px-6 py-3 font-extrabold">D'accord</button>
        </div>
      )}
    </div>,
    document.body,
  );
}

function Lecteur({ points: brut, nom, photo, couleur, complet, depart, arrivee, onFermer }: Props) {
  const pts = useMemo(() => deplier(brut), [brut]);
  const N = pts.length;
  const monde = useMemo(() => pts.map(([la, lo]) => ({ x: wx(lo), y: wy(la) })), [pts]);
  const cumul = useMemo(() => {
    const c = [0];
    for (let i = 1; i < N; i++) c.push(c[i - 1] + km(pts[i - 1], pts[i]));
    return c;
  }, [pts, N]);
  const total = cumul[N - 1] ?? 0;

  // La taille de la fenêtre de la carte.
  const boite = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState({ w: 360, h: 500 });
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTaille({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Le zoom qui montre tout le voyage, et celui qui suit l'animal de près.
  const vueTout = useMemo(() => {
    const xs = monde.map((m) => m.x), ys = monde.map((m) => m.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const dx = Math.max(x1 - x0, 1e-6), dy = Math.max(y1 - y0, 1e-6);
    const z = Math.log2(Math.min((taille.w * 0.78) / dx, (taille.h * 0.7) / dy));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: Math.max(1, Math.min(ZOOM_MAX, z)) };
  }, [monde, taille]);
  const zSuivi = Math.min(ZOOM_MAX, vueTout.z + 2.5);

  // L'état de la lecture vit dans une référence : l'animation tourne 60 fois par seconde.
  const etat = useRef({ t: 0, joue: false, dir: 1, v: 0, mode: "suivre" as "suivre" | "tout", cam: { x: vueTout.x, y: vueTout.y, z: vueTout.z }, deja: new Set<number>() });
  const [, setImage] = useState(0);
  const [bulle, setBulle] = useState<string>(`Voici ${nom} ! Touche ▶ et suis son vrai voyage.`);
  const [ui, setUi] = useState({ joue: false, dir: 1, v: 0, mode: "suivre" as "suivre" | "tout" });
  const majUi = () => setUi({ joue: etat.current.joue, dir: etat.current.dir, v: etat.current.v, mode: etat.current.mode });

  const position = (t: number) => {
    const i = Math.min(N - 1, Math.floor(t)), f = t - i, j = Math.min(N - 1, i + 1);
    return { x: monde[i].x + (monde[j].x - monde[i].x) * f, y: monde[i].y + (monde[j].y - monde[i].y) * f, km: cumul[i] + (cumul[j] - cumul[i]) * f };
  };

  const etapes = useMemo(() => [
    { a: 0.001, texte: `C'est parti ! ${nom} commence son voyage.` },
    { a: 0.25, texte: "" },
    { a: 0.5, texte: "" },
    { a: 0.75, texte: "" },
    { a: 0.999, texte: "" },
  ], [nom]);
  function commenter(frac: number, kmFait: number) {
    etapes.forEach((e, k) => {
      if (frac >= e.a && !etat.current.deja.has(k)) {
        etat.current.deja.add(k);
        const texte = k === 0 ? e.texte
          : k === 1 ? `Déjà ${fmtKm(kmFait)} ! Regarde le paysage sous ${nom}.`
          : k === 2 ? `La moitié du voyage : ${fmtKm(kmFait)}.`
          : k === 3 ? `Encore un effort, ${nom} ! ${fmtKm(kmFait)} déjà.`
          : complet ? `Arrivé ! ${fmtKm(total)} en tout. Bravo ${nom} !` : `Le GPS s'arrête ici, après ${fmtKm(total)}. La suite, personne ne la connaît.`;
        setBulle(texte);
      }
    });
  }

  useEffect(() => {
    let raf = 0, avant = performance.now();
    const tick = (maintenant: number) => {
      const dt = Math.min(0.1, (maintenant - avant) / 1000);
      avant = maintenant;
      const s = etat.current;
      if (s.joue && N > 1) {
        s.t += (s.dir * VITESSES[s.v].x * dt * (N - 1)) / DUREE;
        if (s.t >= N - 1) { s.t = N - 1; s.joue = false; majUi(); }
        if (s.t <= 0) { s.t = 0; s.joue = false; majUi(); }
        if (s.dir > 0) { const pos = position(s.t); commenter(s.t / (N - 1), pos.km); }
      }
      const pos = position(s.t);
      const cible = s.mode === "suivre" ? { x: pos.x, y: pos.y, z: zSuivi } : vueTout;
      const k = 1 - Math.exp(-dt * 5);
      s.cam = { x: s.cam.x + (cible.x - s.cam.x) * k, y: s.cam.y + (cible.y - s.cam.y) * k, z: s.cam.z + (cible.z - s.cam.z) * k };
      setImage((n) => (n + 1) % 1e6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [N, zSuivi, vueTout]);

  const s = etat.current;
  const { w: W, h: H } = taille;
  const cam = s.cam;
  const Z = Math.max(0, Math.min(18, Math.round(cam.z)));
  const echelle = 2 ** (cam.z - Z);
  const n = 2 ** Z;
  const gauche = cam.x * n - W / 2 / echelle, haut = cam.y * n - H / 2 / echelle;
  const tuiles: { cle: string; url: string; x: number; y: number }[] = [];
  for (let ty = Math.floor(haut / TUILE); ty <= Math.floor((haut + H / echelle) / TUILE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(gauche / TUILE); tx <= Math.floor((gauche + W / echelle) / TUILE); tx++) {
      const vraiX = ((tx % n) + n) % n;
      tuiles.push({ cle: `${Z}-${tx}-${ty}`, url: tuileUrl(Z, vraiX, ty), x: (tx * TUILE - gauche) * echelle, y: (ty * TUILE - haut) * echelle });
    }
  }
  const zoomPx = 2 ** cam.z;
  const ecran = (m: { x: number; y: number }) => [(m.x - cam.x) * zoomPx + W / 2, (m.y - cam.y) * zoomPx + H / 2] as const;
  const pos = position(s.t);
  const [ax, ay] = ecran(pos);
  const iFait = Math.floor(s.t);
  const tout = monde.map((m) => ecran(m).join(",")).join(" ");
  const fait = [...monde.slice(0, iFait + 1).map((m) => ecran(m).join(",")), `${ax},${ay}`].join(" ");
  const [dx0, dy0] = ecran(monde[0]);
  const [dx1, dy1] = ecran(monde[N - 1]);
  const frac = N > 1 ? s.t / (N - 1) : 1;

  const bouton = (dir: 1 | -1) => {
    if (dir > 0 && s.t >= N - 1) { s.t = 0; s.deja.clear(); }
    if (s.joue && s.dir === dir) s.v = (s.v + 1) % VITESSES.length;
    else s.v = Math.max(s.v, 1);
    s.dir = dir;
    s.joue = true;
    majUi();
  };
  const lecture = () => {
    if (!s.joue && s.t >= N - 1) { s.t = 0; s.deja.clear(); }
    if (!s.joue) s.dir = 1;
    s.joue = !s.joue;
    majUi();
  };

  return (
    <>
      <div ref={boite} className="relative flex-1 overflow-hidden bg-[#0d1a2b]">
        {tuiles.map((t) => (
          <img key={t.cle} src={t.url} alt="" draggable={false} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="pointer-events-none absolute max-w-none select-none" style={{ left: t.x, top: t.y, width: TUILE * echelle + 0.5, height: TUILE * echelle + 0.5 }} />
        ))}
        <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <polyline points={tout} fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="2" strokeDasharray="5 6" strokeLinejoin="round" />
          <polyline points={fait} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={fait} fill="none" stroke={couleur} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={dx0} cy={dy0} r="7" fill="#4cd964" stroke="#fff" strokeWidth="2" />
          {complet ? <circle cx={dx1} cy={dy1} r="7" fill="#ff4d4d" stroke="#fff" strokeWidth="2" /> : null}
        </svg>
        {/* L'animal, dans son médaillon doré */}
        <div className="pointer-events-none absolute" style={{ left: ax - 26, top: ay - 26 }}>
          <span className="absolute inset-0 animate-ping rounded-full" style={{ background: couleur, opacity: 0.35 }} />
          <span className="medaillon-or relative block size-[52px] overflow-hidden rounded-full bg-[#2a1650] [&_img]:size-full [&_img]:object-cover">
            {photo ? <Portrait id={photo} /> : <span className="grid size-full place-items-center text-2xl">🐾</span>}
          </span>
        </div>

        {/* En haut : le nom, et fermer */}
        <div className="absolute inset-x-0 top-0 flex items-start gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight text-[#f3d48a]">Le voyage de {nom}</p>
            <p className="text-xs text-white/80">{depart ? `Départ le ${fmtDate(depart)}` : ""}{arrivee && complet ? ` · arrivée le ${fmtDate(arrivee)}` : ""}</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onFermer} className="grid size-11 shrink-0 place-items-center rounded-full bg-black/50 ring-1 ring-white/30"><LuX className="size-6" /></button>
        </div>

        {/* Plume commente */}
        <button type="button" onClick={() => dire(bulle)} className="absolute bottom-3 left-2 right-2 flex items-end gap-2 text-left" aria-label="Écouter Plume">
          <PlumeDessin anim={s.joue ? "vole" : "parle"} className="h-16 w-16 shrink-0 drop-shadow-lg" />
          <span className="mb-2 rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm font-bold leading-snug text-[#2a1650] shadow-lg">{bulle} <span aria-hidden="true">🔊</span></span>
        </button>

        {/* Suivre l'animal, ou voir tout le voyage */}
        <div className="absolute right-2 top-20 flex flex-col gap-2">
          <button type="button" onClick={() => { s.mode = s.mode === "suivre" ? "tout" : "suivre"; majUi(); }} className="flex min-h-11 items-center gap-1.5 rounded-full bg-black/55 px-3 text-sm font-extrabold ring-1 ring-white/30 backdrop-blur">
            {ui.mode === "suivre" ? <><LuScan className="size-5" /> Tout voir</> : <><LuLocateFixed className="size-5" /> Le suivre</>}
          </button>
        </div>
        <p className="absolute bottom-0 right-1 text-[9px] text-white/70">Images satellite : Esri, Maxar, Earthstar Geographics</p>
      </div>

      {/* Les commandes */}
      <div className="bg-[#1c1240] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="text-[#f3d48a]">{fmtKm(pos.km)}</span>
          <span className="texte-doux">sur {fmtKm(total)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(frac * 1000)}
          onChange={(e) => { s.t = (Number(e.target.value) / 1000) * (N - 1); s.joue = false; majUi(); }}
          aria-label="Avancer dans le voyage"
          className="mt-1 w-full accent-[#f3d48a]"
        />
        <div className="mt-2 flex items-center justify-center gap-4">
          <button type="button" onClick={() => bouton(-1)} aria-label="Reculer" className={`grid size-14 place-items-center rounded-full ring-2 ${ui.joue && ui.dir < 0 ? "bg-[#f3d48a] text-[#2a1650] ring-[#f3d48a]" : "bg-white/10 ring-white/25"}`}>
            <LuRewind className="size-7" />
          </button>
          <button type="button" onClick={lecture} aria-label={ui.joue ? "Pause" : "Lecture"} className="grid size-[4.5rem] place-items-center rounded-full bg-[#f3d48a] text-[#2a1650] shadow-[0_0_24px_rgba(243,212,138,.55)]">
            {ui.joue ? <LuPause className="size-9" /> : <LuPlay className="ml-1 size-9" />}
          </button>
          <button type="button" onClick={() => bouton(1)} aria-label="Avancer vite" className={`grid size-14 place-items-center rounded-full ring-2 ${ui.joue && ui.dir > 0 && ui.v > 0 ? "bg-[#f3d48a] text-[#2a1650] ring-[#f3d48a]" : "bg-white/10 ring-white/25"}`}>
            <LuFastForward className="size-7" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {VITESSES.map((v, k) => (
            <button key={v.nom} type="button" onClick={() => { s.v = k; majUi(); }} className={`rounded-full px-3 py-1 text-xs font-extrabold ${ui.v === k ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>
              {v.emoji} {v.nom}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void ouvrirDansGoogleEarth(brut, nom)} className="mx-auto mt-3 flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-extrabold ring-1 ring-white/20">
          <LuDownload className="size-4" /> Voir aussi dans Google Earth (en 3D)
        </button>
      </div>
    </>
  );
}

// ------------------------------------------------------------ Google Earth
const echapper = (t: string) => t.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/** Un fichier KML : le trajet doré, le départ, l'arrivée, et une visite qui vole le long du trajet. */
export function kmlDuVoyage(points: Point[], nom: string) {
  const c = (p: Point) => `${p[1].toFixed(5)},${p[0].toFixed(5)},0`;
  const lats = points.map((p) => p[0]), lons = points.map((p) => p[1]);
  const etendue = Math.max(km([Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]), 0.3);
  const portee = Math.max(600, Math.min(2_500_000, etendue * 1000 * 0.35));
  const pas = Math.max(1, Math.floor(points.length / 60));
  const vols: string[] = [];
  for (let i = 0; i < points.length; i += pas) {
    const a = points[i], b = points[Math.min(points.length - 1, i + pas)];
    const cap = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    vols.push(`<gx:FlyTo><gx:duration>${i ? 1.6 : 3}</gx:duration><gx:flyToMode>smooth</gx:flyToMode><LookAt><longitude>${a[1].toFixed(5)}</longitude><latitude>${a[0].toFixed(5)}</latitude><altitude>0</altitude><heading>${cap.toFixed(0)}</heading><tilt>62</tilt><range>${portee.toFixed(0)}</range></LookAt></gx:FlyTo>`);
  }
  const n = echapper(nom);
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
<Document>
<name>Le voyage de ${n}</name>
<description>Vrai trajet GPS (Movebank Data Repository, licence libre). Encyclopédie de la vie, pour la princesse Leonie.</description>
<Style id="trajet"><LineStyle><color>ff8ad4f3</color><width>5</width></LineStyle></Style>
<Style id="depart"><IconStyle><color>ff64d94c</color><scale>1.3</scale></IconStyle></Style>
<Style id="arrivee"><IconStyle><color>ff4d4dff</color><scale>1.3</scale></IconStyle></Style>
<Placemark><name>Départ de ${n}</name><styleUrl>#depart</styleUrl><Point><coordinates>${c(points[0])}</coordinates></Point></Placemark>
<Placemark><name>Dernier point GPS</name><styleUrl>#arrivee</styleUrl><Point><coordinates>${c(points[points.length - 1])}</coordinates></Point></Placemark>
<Placemark><name>Le trajet de ${n}</name><styleUrl>#trajet</styleUrl><LineString><tessellate>1</tessellate><coordinates>${points.map(c).join(" ")}</coordinates></LineString></Placemark>
<gx:Tour><name>Voler avec ${n}</name><gx:Playlist>${vols.join("")}</gx:Playlist></gx:Tour>
</Document>
</kml>`;
}

/** Donne le fichier à Google Earth : partage (tablette) ou téléchargement (navigateur). */
export async function ouvrirDansGoogleEarth(points: Point[], nom: string) {
  const texte = kmlDuVoyage(points, nom);
  const fichier = `voyage-${nom.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}.kml`;
  try {
    if (moduleDisponible("Filesystem") && moduleDisponible("Share")) {
      const { uri } = await appeler<{ uri: string }>("Filesystem", "writeFile", { path: fichier, data: texte, directory: "CACHE", encoding: "utf8" });
      await appeler("Share", "share", { title: `Le voyage de ${nom}`, text: "Ouvre ce fichier avec Google Earth.", files: [uri], dialogTitle: "Ouvrir avec Google Earth" });
      return;
    }
    const f = new File([texte], fichier, { type: "application/vnd.google-earth.kml+xml" });
    if (navigator.canShare?.({ files: [f] })) {
      await navigator.share({ files: [f], title: `Le voyage de ${nom}` });
      return;
    }
  } catch {
    /* on essaie le téléchargement */
  }
  const url = URL.createObjectURL(new Blob([texte], { type: "application/vnd.google-earth.kml+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Les grands voyageurs : de vrais trajets GPS (Movebank Data Repository, licences libres),
// sur la carte du monde sombre. Bleu : animaux marins. Vert : herbivores. Doré : oiseaux. Rouge : prédateurs.
// On zoome et on fait tourner la carte avec deux doigts ; on la déplace avec un doigt ; on touche un trajet pour tout savoir.
import { useEffect, useMemo, useRef, useState, type PointerEvent as PE } from "react";
import { LuEarth, LuMap, LuMinus, LuPlus, LuRotateCcw, LuSearch, LuX } from "react-icons/lu";
import { Globe, cadrer } from "@/components/globe";
import { CadreGlobe } from "@/components/cadre-globe";
import { RecherchePlein } from "@/components/recherche-plein";
import { Parcours } from "@/components/parcours";
import liensEtudes from "@/data/voyageurs-liens.json";
import { Entete, Titre } from "@/components/entete";
import { Portrait, aUnePhoto } from "@/components/portrait";
import monde from "@/data/monde.json";
import donnees from "@/data/voyageurs.json";
import { definirEcran, plumeDit } from "@/lib/plume";
import { useInternet } from "@/lib/internet";
import { VoyageSatellite } from "@/components/voyage-satellite";
import { connuLatin } from "@/lib/connu";

type Voyageur = {
  latin: string; nom: string | null; fiche: string | null; groupe: "marin" | "herbivore" | "oiseau" | "predateur" | "autre";
  classe?: string | null; individu: string; etude: string; doi: string; licence: string; debut: string; fin: string; km: number | null; points: [number, number][];
  depart?: { lat: number; lon: number; date: string }; arrivee?: { lat: number; lon: number; date: string } | null; complet?: boolean; nbPoints?: number;
};
const VOYAGEURS = (donnees as Voyageur[]).map((v, i) => ({ ...v, i }));
const LIENS_ETUDES = liensEtudes as Record<string, { page: string; doi: string }>;
// Un trajet « complet » : on connaît son départ et son arrivée. Ce sont eux qu'on montre d'abord.
/** Les voyages GPS d'une espèce (les complets d'abord). */
export function voyagesDe(id: string, latin: string) {
  return VOYAGEURS.filter((v) => v.fiche === id || v.latin === latin).sort((a, b) => Number(estComplet(b)) - Number(estComplet(a)) || connuLatin(b.latin) - connuLatin(a.latin) || (b.km ?? 0) - (a.km ?? 0));
}
const estComplet = (v: Voyageur) => !(v as { partiel?: boolean }).partiel && v.complet !== false && !!v.arrivee;
const PAYS = (monde as { pays: Record<string, string> }).pays;

export const GROUPES_VOYAGE = {
  marin: { label: "Animaux marins", couleur: "#4fb6ff" },
  herbivore: { label: "Herbivores", couleur: "#5fe07a" },
  oiseau: { label: "Oiseaux", couleur: "#f3c35a" },
  predateur: { label: "Prédateurs", couleur: "#ff5a5a" },
  autre: { label: "Autres", couleur: "#c9a4ff" },
} as const;
type G = keyof typeof GROUPES_VOYAGE;

/** Coupe un trajet quand il traverse le bord de la carte (de +180° à −180°). */
function morceaux(points: [number, number][]) {
  const out: [number, number][][] = [[]];
  points.forEach((p, k) => {
    if (k && Math.abs(p[1] - points[k - 1][1]) > 180) out.push([]);
    out[out.length - 1].push(p);
  });
  return out.filter((m) => m.length > 1).map((m) => m.map(([la, lo]) => `${(lo + 180).toFixed(2)},${(90 - la).toFixed(2)}`).join(" "));
}

/** Le chemin que suit la petite lumière (le plus long morceau du trajet). */
function chemin(points: [number, number][]) {
  const m = morceaux(points).sort((a, b) => b.length - a.length)[0] ?? "";
  return m ? "M" + m.split(" ").join(" L") : "";
}

/** Peu de trajets quand on voit tout le monde, de plus en plus en zoomant (les plus longs d'abord). */
function parGroupe(zoom: number) {
  return zoom < 1.6 ? 3 : zoom < 3 ? 8 : zoom < 6 ? 20 : Infinity;
}

const nomDe = (v: Voyageur) => v.nom ?? v.latin;
const sansAccent = (t: string) => t.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
const date = (d: string) => (d ? new Date(d.replace(" ", "T")).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Non connue");
const heure = (d: string) => (d && d.length > 10 ? ` à ${d.slice(11, 16).replace(":", " h ")} (UTC)` : "");
const lieu = (p: { lat: number; lon: number }) => `${Math.abs(p.lat).toFixed(4)}° ${p.lat >= 0 ? "N" : "S"}, ${Math.abs(p.lon).toFixed(4)}° ${p.lon >= 0 ? "E" : "O"}`;

type Vue = { x: number; y: number; s: number; r: number };
const DEPART: Vue = { x: 0, y: 0, s: 1, r: 0 };

export function VoyageursPage({ integre = false, aMontrer }: { integre?: boolean; aMontrer?: number | null } = {}) {
  const [vue, setVue] = useState<Vue>(DEPART);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [filtres, setFiltres] = useState<Record<G, boolean>>({ marin: true, herbivore: true, oiseau: true, predateur: true, autre: true });
  const [q, setQ] = useState("");
  const [cherche, setCherche] = useState(false);
  const boite = useRef<SVGSVGElement>(null);
  const doigts = useRef(new Map<number, { x: number; y: number }>());
  const avant = useRef<{ vue: Vue; d: number; a: number; cx: number; cy: number } | null>(null);
  const bouge = useRef(0);

  const lignes = useMemo(() => VOYAGEURS.map((v) => morceaux(v.points)), []);
  const chemins = useMemo(() => VOYAGEURS.map((v) => chemin(v.points)), []);
  const classes = useMemo(() => {
    const rang = new Map<number, number>();
    (Object.keys(GROUPES_VOYAGE) as G[]).forEach((g) =>
      VOYAGEURS.filter((v) => v.groupe === g).sort((a, b) => Number(estComplet(b)) - Number(estComplet(a)) || connuLatin(b.latin) - connuLatin(a.latin) || (b.km ?? 0) - (a.km ?? 0)).forEach((v, k) => rang.set(v.i, k)),
    );
    return rang;
  }, []);
  const limite = parGroupe(vue.s);
  const visibles = VOYAGEURS.filter((v) => (filtres[v.groupe as G] ?? true) && ((classes.get(v.i) ?? 0) < limite || v.i === choisi));
  const animation = useRef(0);
  const [rejoue, setRejoue] = useState(0);
  const [globe, setGlobe] = useState(true);
  const [vers, setVers] = useState<{ lon: number; lat: number; zoom: number; n: number } | null>(null);
  // La fenêtre se met en bandeau quand on regarde un voyageur ; on peut la changer à la main.
  const [force, setForce] = useState<boolean | null>(null);
  const petit = force ?? choisi !== null;
  useEffect(() => setForce(null), [choisi]);
  const resultats = useMemo(() => {
    const t = sansAccent(q.trim());
    if (t.length < 2) return [];
    return VOYAGEURS.filter((v) => sansAccent(`${nomDe(v)} ${v.latin}`).includes(t)).sort((a, b) => Number(estComplet(b)) - Number(estComplet(a)) || connuLatin(b.latin) - connuLatin(a.latin) || (b.km ?? 0) - (a.km ?? 0)).slice(0, 20);
  }, [q]);
  const { permis } = useInternet();
  const groupesPresents = (Object.keys(GROUPES_VOYAGE) as G[]).filter((g) => VOYAGEURS.some((v) => v.groupe === g));

  // On arrive depuis la fiche d'un animal : on montre tout de suite son voyage.
  useEffect(() => {
    if (aMontrer === null || aMontrer === undefined || !VOYAGEURS[aMontrer]) return;
    const t = window.setTimeout(() => montrer(aMontrer), 300);
    return () => window.clearTimeout(t);
  }, [aMontrer]);

  // Plume explique une fois, en arrivant.
  useEffect(() => {
    const t = window.setTimeout(() => plumeDit("Touche un trajet pour savoir qui a voyagé. Deux doigts pour zoomer ou faire tourner la carte !", 6000), 1200);
    return () => window.clearTimeout(t);
  }, []);

  // La taille de la carte à l'écran : elle prend presque toute la hauteur (comme une vraie carte).
  const [haut, setHaut] = useState(180);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const maj = () => {
      const r = el.getBoundingClientRect();
      if (r.width) setHaut((360 * r.height) / r.width);
    };
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, [globe]);
  const sMin = Math.max(1, haut / 180);
  const departVue = (): Vue => ({ s: sMin, r: 0, x: 180 - 180 * sMin, y: 90 - 90 * sMin });
  const premiere = useRef(true);
  useEffect(() => {
    if (premiere.current && haut !== 180) {
      premiere.current = false;
      setVue(departVue());
    }
  }, [haut]);

  /** Le doigt, en unités de la carte, sans la rotation. */
  function local(x: number, y: number, r = vue.r) {
    const b = boite.current!.getBoundingClientRect();
    const px = ((x - b.left) / b.width) * 360, py = 90 - haut / 2 + ((y - b.top) / b.height) * haut;
    const t = (-r * Math.PI) / 180, dx = px - 180, dy = py - 90;
    return { x: 180 + dx * Math.cos(t) - dy * Math.sin(t), y: 90 + dx * Math.sin(t) + dy * Math.cos(t), ex: x, ey: y };
  }
  const vitesse = useRef({ x: 0, y: 0, t: 0 });
  function appui(e: PE<SVGSVGElement>) {
    cancelAnimationFrame(animation.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    doigts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    bouge.current = 0;
    depart();
  }
  function depart() {
    const p = [...doigts.current.values()];
    if (!p.length) return (avant.current = null);
    const cx = p.reduce((s, a) => s + a.x, 0) / p.length, cy = p.reduce((s, a) => s + a.y, 0) / p.length;
    const d = p.length > 1 ? Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) : 0;
    const a = p.length > 1 ? Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) : 0;
    const u = local(cx, cy);
    // Le point de la carte qui est sous les doigts : il doit y rester.
    avant.current = { vue, d, a, cx: (u.x - vue.x) / vue.s, cy: (u.y - vue.y) / vue.s };
  }
  function deplace(e: PE<SVGSVGElement>) {
    if (!doigts.current.has(e.pointerId) || !avant.current) return;
    const ancien = doigts.current.get(e.pointerId)!;
    doigts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...doigts.current.values()];
    const b = avant.current;
    const cx = p.reduce((s, a) => s + a.x, 0) / p.length, cy = p.reduce((s, a) => s + a.y, 0) / p.length;
    bouge.current += Math.hypot(e.clientX - ancien.x, e.clientY - ancien.y);
    let s = b.vue.s, r = b.vue.r;
    if (p.length > 1 && b.d > 0) {
      const d = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
      const a = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
      s = Math.max(sMin, Math.min(300, (b.vue.s * d) / b.d));
      r = b.vue.r + ((a - b.a) * 180) / Math.PI;
    } else {
      const t = performance.now(), dt = Math.max(1, t - vitesse.current.t);
      vitesse.current = { x: (e.clientX - ancien.x) / dt, y: (e.clientY - ancien.y) / dt, t };
    }
    const u = local(cx, cy, r);
    setVue({ s, r, x: u.x - b.cx * s, y: u.y - b.cy * s });
  }
  function lache(e: PE<SVGSVGElement>) {
    const seul = doigts.current.size === 1;
    doigts.current.delete(e.pointerId);
    depart();
    // Elle continue de glisser un peu, comme une vraie carte.
    const v = vitesse.current;
    if (seul && performance.now() - v.t < 80 && Math.hypot(v.x, v.y) > 0.3) {
      const b = boite.current!.getBoundingClientRect();
      let vx = (v.x * 360) / b.width, vy = (v.y * haut) / b.height;
      let t0 = performance.now();
      const pas = (t: number) => {
        const dt = t - t0; t0 = t;
        const k = (vue.r * Math.PI) / 180;
        setVue((w) => ({ ...w, x: w.x + (vx * Math.cos(-k) - vy * Math.sin(-k)) * dt, y: w.y + (vx * Math.sin(-k) + vy * Math.cos(-k)) * dt }));
        vx *= 0.92; vy *= 0.92;
        if (Math.hypot(vx, vy) > 0.002) animation.current = requestAnimationFrame(pas);
      };
      animation.current = requestAnimationFrame(pas);
    }
    vitesse.current = { x: 0, y: 0, t: 0 };
  }
  /** Zoom autour du centre de l'écran. */
  function zoom(f: number) {
    const s = Math.max(sMin, Math.min(300, vue.s * f));
    const mx = (180 - vue.x) / vue.s, my = (90 - vue.y) / vue.s;
    allerVers({ ...vue, s, x: 180 - mx * s, y: 90 - my * s }, 350);
  }

  /** Glisse doucement vers une vue. */
  function allerVers(cible: Vue, duree = 900) {
    cancelAnimationFrame(animation.current);
    const de = vue, t0 = performance.now();
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / duree), e = 1 - Math.pow(1 - k, 3);
      setVue({ x: de.x + (cible.x - de.x) * e, y: de.y + (cible.y - de.y) * e, s: de.s + (cible.s - de.s) * e, r: de.r + (cible.r - de.r) * e });
      if (k < 1) animation.current = requestAnimationFrame(pas);
    };
    animation.current = requestAnimationFrame(pas);
  }

  /** Choisit un voyageur : la carte glisse vers lui, son trajet se redessine et sa lumière le parcourt. */
  function montrer(i: number, centrer = true) {
    setChoisi(i);
    setSatellite(false);
    // La fiche (avec le parcours) vient se placer juste sous le bandeau.
    window.setTimeout(() => document.getElementById("fiche-voyageur")?.scrollIntoView({ behavior: "smooth", block: "start" }), 700);
    setCherche(false);
    setRejoue((n) => n + 1);
    if (globe) {
      const c = cadrer(VOYAGEURS[i].points);
      setVers((v) => ({ ...c, n: (v?.n ?? 0) + 1 }));
      return;
    }
    if (!centrer) return;
    const pts = VOYAGEURS[i].points;
    const xs = pts.map((p) => p[1] + 180), ys = pts.map((p) => 90 - p[0]);
    const w = Math.max(...xs) - Math.min(...xs) + 0.5, h = Math.max(...ys) - Math.min(...ys) + 0.5;
    const s = Math.max(sMin, Math.min(150, Math.min(360 / w, haut / h) * 0.8));
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    allerVers({ s, r: 0, x: 180 - cx * s, y: 90 - cy * s });
  }

  const v = choisi !== null ? VOYAGEURS[choisi] : null;
  // Plume peut raconter le voyage affiché.
  useEffect(() => {
    if (!v) return definirEcran(null);
    definirEcran({ id: `voyage-${v.i}`, titre: nomDe(v), etapes: [
      `Voici le vrai voyage d'un animal : ${nomDe(v)}, que les scientifiques appellent « ${v.individu} ».`,
      v.depart ? `Il est parti le ${date(v.depart.date)}${estComplet(v) && v.arrivee ? `, et le dernier point GPS date du ${date(v.arrivee.date)}` : ""}.` : "La date de départ n'est pas connue.",
      v.km ? `En additionnant tous ses points GPS, il a parcouru ${v.km.toLocaleString("fr-FR")} kilomètres.` : "La distance n'est pas connue.",
      "Dans la petite fenêtre, le point vert est le départ et le point rouge l'arrivée. Touche « Rejouer » pour revoir son voyage.",
    ] });
  }, [choisi]);
  useEffect(() => () => definirEcran(null), []);
  // La transformation : déplacement, zoom autour du point (0,0), puis rotation autour du centre de la carte.
  const transformation = `rotate(${vue.r} 180 90) translate(${vue.x} ${vue.y}) scale(${vue.s})`;

  return (
    <div className={integre ? "" : "mx-auto max-w-xl px-4 pt-4"}>
      {integre ? null : (
        <>
          <Entete siVide="/" />
          <Titre sous="De vrais trajets, suivis par GPS par des scientifiques.">Les grands voyageurs</Titre>
        </>
      )}

      {cherche ? (
        <RecherchePlein q={q} setQ={setQ} placeholder="Un animal voyageur…" onFermer={() => { setCherche(false); setQ(""); }} vide={<p className="mt-6 text-center text-sm texte-doux">Aucun voyageur à ce nom.</p>}>
          {resultats.length ? (
            <ul className="space-y-1">
              {resultats.map((r) => (
                <li key={r.i}>
                  <button type="button" onClick={() => montrer(r.i)} className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 text-left text-white active:bg-white/10">
                    <span className="size-3.5 shrink-0 rounded-full" style={{ background: GROUPES_VOYAGE[r.groupe as G].couleur, boxShadow: `0 0 8px ${GROUPES_VOYAGE[r.groupe as G].couleur}` }} />
                    <span className="min-w-0 flex-1"><span className="block font-extrabold leading-tight">{nomDe(r)}</span><span className="block text-xs italic texte-doux">{r.latin}{r.km ? ` · ${r.km.toLocaleString("fr-FR")} km` : ""}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </RecherchePlein>
      ) : null}

      {/* La carte */}
      <CadreGlobe petit={petit} onBascule={() => setForce(!petit)}>
        {globe ? (
          <Globe traces={visibles.map((t) => ({ i: t.i, couleur: GROUPES_VOYAGE[t.groupe as G].couleur, points: t.points }))} choisi={choisi} vers={vers} onChoisir={(i) => montrer(i)} hauteur="h-full" />
        ) : (
        <svg
          ref={boite}
          viewBox={`0 ${90 - haut / 2} 360 ${haut}`}
          className="block h-full w-full touch-none select-none"
          onPointerDown={appui}
          onPointerMove={deplace}
          onPointerUp={lache}
          onPointerCancel={lache}
          onWheel={(e) => zoom(e.deltaY < 0 ? 1.25 : 1 / 1.25)}
          role="img"
          aria-label="Carte du monde des trajets"
        >
          <g transform={transformation}>
            <rect x="-720" y="-540" width="1800" height="1260" fill="#14214a" />
            {Object.entries(PAYS).map(([c, d]) => <path key={c} d={d} fill="#3b4a7a" stroke="#0f1838" strokeWidth={0.3 / vue.s} />)}
            {visibles.map((t) =>
              lignes[t.i].map((pts, k) => (
                <g key={`${t.i}-${k}`} onClick={() => bouge.current < 14 && montrer(t.i, false)} style={{ cursor: "pointer" }}>
                  <polyline points={pts} fill="none" stroke="transparent" strokeWidth={16} vectorEffect="non-scaling-stroke" />
                  <polyline
                    key={t.i === choisi ? `r${rejoue}` : "n"}
                    points={pts}
                    pathLength={1}
                    className="trajet"
                    fill="none"
                    stroke={GROUPES_VOYAGE[t.groupe as G].couleur}
                    strokeOpacity={choisi === null || choisi === t.i ? 0.95 : 0.25}
                    strokeWidth={choisi === t.i ? 3.5 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )),
            )}
            {/* Les petites lumières qui voyagent le long des trajets */}
            {visibles.map((t) =>
              chemins[t.i] && (choisi === null || choisi === t.i) ? (
                <g key={`l${t.i}-${t.i === choisi ? rejoue : 0}`}>
                  <circle r={(t.i === choisi ? 7 : 4.5) / vue.s} fill={GROUPES_VOYAGE[t.groupe as G].couleur} opacity=".35" />
                  <circle r={(t.i === choisi ? 3.6 : 2.4) / vue.s} fill={GROUPES_VOYAGE[t.groupe as G].couleur} opacity=".7" />
                  <circle r={(t.i === choisi ? 1.8 : 1.2) / vue.s} fill="#fff" />
                  <animateMotion dur={`${t.i === choisi ? 4 : 7 + (t.i % 5)}s`} begin={`${t.i === choisi ? 0.4 : (t.i % 7) * 0.6}s`} repeatCount="indefinite" path={chemins[t.i]} />
                </g>
              ) : null,
            )}
          </g>
        </svg>
        )}
        <div className="absolute left-2 top-2">
          <button type="button" aria-label={globe ? "Voir la carte à plat" : "Voir le globe"} onClick={() => setGlobe((g) => !g)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 px-3 text-sm font-extrabold text-white ring-1 ring-white/25 backdrop-blur-md">
            {globe ? <><LuMap className="size-4" /> À plat</> : <><LuEarth className="size-4" /> Globe</>}
          </button>
        </div>
        <div className={`absolute right-2 top-2 flex flex-col gap-1.5 ${globe ? "hidden" : ""}`}>
          <button type="button" aria-label="Zoomer" onClick={() => zoom(1.5)} className="grid size-9 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-md"><LuPlus className="size-5" /></button>
          <button type="button" aria-label="Dézoomer" onClick={() => zoom(1 / 1.5)} className="grid size-9 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-md"><LuMinus className="size-5" /></button>
          <button type="button" aria-label="Revenir à toute la carte" onClick={() => { allerVers(departVue()); setChoisi(null); }} className="grid size-9 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-md"><LuRotateCcw className="size-5" /></button>
        </div>
        <button type="button" onClick={() => setCherche(true)} className="absolute bottom-2 left-2 flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-sm font-extrabold text-white ring-1 ring-white/25 backdrop-blur-md">
          <LuSearch className="size-4" aria-hidden="true" /> Un animal
        </button>
        {!VOYAGEURS.length ? <p className="absolute inset-x-0 bottom-3 text-center text-sm font-bold text-white/80">Les trajets arrivent : la recherche est en cours.</p> : null}
      </CadreGlobe>
      <div className={integre ? "px-3" : ""}>

      {/* La fiche du voyageur choisi */}
      {v ? (
        <section key={v.i} id="fiche-voyageur" style={{ scrollMarginTop: "calc(max(190px, 30vh) + 2.5rem)" }} className="carte-nuit apparait relative mt-2 rounded-3xl px-4 py-4">
          <button type="button" aria-label="Fermer" onClick={() => setChoisi(null)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/10"><LuX className="size-5" /></button>
          <div className="flex items-center gap-3 pr-10">
            {v.fiche && aUnePhoto(v.fiche) ? <span className="medaillon-or block size-16 shrink-0 overflow-hidden"><Portrait id={v.fiche} /></span> : <span className="grid size-16 shrink-0 place-items-center rounded-full text-3xl" style={{ background: GROUPES_VOYAGE[v.groupe as G].couleur + "33" }}>•</span>}
            <div className="min-w-0">
              <p className="font-display text-2xl leading-tight text-[#f3d48a]">{nomDe(v)}</p>
              <p className="text-sm italic texte-doux">{v.latin}{v.nom ? "" : " · nom français non connu"}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-extrabold"><span className="h-1.5 w-4 rounded-full" style={{ background: GROUPES_VOYAGE[v.groupe as G].couleur }} />{GROUPES_VOYAGE[v.groupe as G].label}</p>
            </div>
          </div>
          <p className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold ${estComplet(v) ? "bg-[#4cd964]/20 text-[#9dffb0]" : "bg-white/10 texte-doux"}`}>{estComplet(v) ? "✓ Trajet complet : départ et arrivée connus" : "Trajet partiel : seulement le début est connu"}</p>
          <Parcours key={v.i} points={v.points} couleur={GROUPES_VOYAGE[v.groupe as G].couleur} arrivee={estComplet(v)} />
          <button type="button" onClick={() => setSatellite(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f3d48a] to-[#e7b75a] py-3.5 text-base font-black text-[#2a1650] shadow-[0_0_18px_rgba(243,212,138,.45)] active:scale-[.98]">
            🛰️ Voyager avec lui, vu du ciel
          </button>
          {satellite ? <VoyageSatellite points={v.points} nom={nomDe(v)} photo={v.fiche && aUnePhoto(v.fiche) ? v.fiche : null} couleur={GROUPES_VOYAGE[v.groupe as G].couleur} complet={estComplet(v)} depart={v.depart?.date ?? v.debut} arrivee={v.arrivee?.date ?? v.fin} onFermer={() => setSatellite(false)} /> : null}
          {(() => {
            const autres = voyagesDe(v.fiche ?? "", v.latin);
            return autres.length > 1 ? (
              <div className="mt-3">
                <p className="text-xs font-extrabold texte-doux">Les {autres.length} voyages de cet animal :</p>
                <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
                  {autres.map((a, k) => (
                    <button key={a.i} type="button" onClick={() => montrer(a.i)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${a.i === v.i ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>
                      {k + 1}. « {a.individu.slice(0, 14)} »{a.km ? ` · ${a.km.toLocaleString("fr-FR")} km` : ""}{estComplet(a) ? "" : " · partiel"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white/5 px-3 py-2"><dt className="text-xs texte-doux">Distance du trajet</dt><dd className="font-display text-xl">{v.km !== null && v.km !== undefined ? `${v.km.toLocaleString("fr-FR")} km` : "Non connue"}</dd></div>
            <div className="rounded-2xl bg-white/5 px-3 py-2"><dt className="text-xs texte-doux">Points GPS</dt><dd className="font-display text-xl">{v.nbPoints ? v.nbPoints.toLocaleString("fr-FR") : "Non connu"}</dd></div>
            <div className="col-span-2 rounded-2xl bg-white/5 px-3 py-2"><dt className="text-xs texte-doux">Départ</dt><dd className="font-bold">{v.depart ? <>{date(v.depart.date)}{heure(v.depart.date)}<br /><span className="text-xs font-normal">{lieu(v.depart)}</span></> : date(v.debut)}</dd></div>
            <div className="col-span-2 rounded-2xl bg-white/5 px-3 py-2"><dt className="text-xs texte-doux">Arrivée (dernier point GPS)</dt><dd className="font-bold">{v.arrivee ? <>{date(v.arrivee.date)}{heure(v.arrivee.date)}<br /><span className="text-xs font-normal">{lieu(v.arrivee)}</span></> : (v as { partiel?: boolean }).partiel ? "Non connue : seuls les premiers points de ce suivi sont dans l'application." : v.complet === false ? "Non connue : le fichier du suivi est trop gros pour être lu en entier." : date(v.fin)}</dd></div>
          </dl>
          <p className="mt-2 text-[11px] texte-doux">Distance additionnée entre tous les vrais points GPS (seulement le GPS ; les points impossibles et le tremblement du GPS sont écartés).</p>
          <p className="mt-2 text-xs">Animal suivi : « {v.individu} ». Étude : {v.etude}. Licence {v.licence}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {v.fiche ? <a href={`#/mammiferes/e-${v.fiche}`} className="bouton-bois rounded-full px-4 py-2 text-sm font-extrabold">Voir sa fiche</a> : null}
            {LIENS_ETUDES[v.etude] && permis ? <a href={LIENS_ETUDES[v.etude].doi || LIENS_ETUDES[v.etude].page} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold">Les vraies données GPS (gratuit)</a> : null}
          </div>
        </section>
      ) : null}
      {/* Légende : touche une couleur pour l'afficher ou la cacher */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {groupesPresents.map((g) => (
          <button key={g} type="button" aria-pressed={filtres[g]} onClick={() => setFiltres((f) => ({ ...f, [g]: !f[g] }))} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold ${filtres[g] ? "bg-[#2a1844] text-white" : "bg-[#2a1844]/40 text-white/50 line-through"}`}>
            <span className="h-1.5 w-5 rounded-full" style={{ background: GROUPES_VOYAGE[g].couleur }} /> {GROUPES_VOYAGE[g].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs texte-doux">{visibles.length} trajets sur {VOYAGEURS.length}{visibles.length < VOYAGEURS.length ? " · zoome pour en voir plus" : ""} · un doigt pour déplacer, deux pour zoomer et tourner.</p>

      <TousLesVoyageurs choisi={choisi} onChoisir={(i) => { montrer(i); }} />
      <PlusLoin />
      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] texte-doux">Données : Movebank Data Repository (jeux de données publiés en licence libre). Rien n'est inventé : chaque trait est un vrai suivi GPS.</p>
      </div>
    </div>
  );
}

/** Tous les voyageurs : une carte par animal (les espèces avec un trajet complet d'abord). On touche : son plus beau voyage s'affiche. */
const ESPECES_VOYAGE = (() => {
  const par = new Map<string, (typeof VOYAGEURS)[number][]>();
  for (const v of VOYAGEURS) {
    if (!par.has(v.latin)) par.set(v.latin, []);
    par.get(v.latin)!.push(v);
  }
  return [...par.values()]
    .map((vs) => vs.sort((a, b) => Number(estComplet(b)) - Number(estComplet(a)) || connuLatin(b.latin) - connuLatin(a.latin) || (b.km ?? 0) - (a.km ?? 0)))
    .sort((a, b) => Number(estComplet(b[0])) - Number(estComplet(a[0])) || Number(!!b[0].nom) - Number(!!a[0].nom) || connuLatin(b[0].latin) - connuLatin(a[0].latin) || b.length - a.length || nomDe(a[0]).localeCompare(nomDe(b[0]), "fr"));
})();

function TousLesVoyageurs({ choisi, onChoisir }: { choisi: number | null; onChoisir: (i: number) => void }) {
  const [groupe, setGroupe] = useState<G | null>(null);
  const [montre, setMontre] = useState(12);
  const liste = groupe ? ESPECES_VOYAGE.filter((vs) => vs[0].groupe === groupe) : ESPECES_VOYAGE;
  const presents = (Object.keys(GROUPES_VOYAGE) as G[]).filter((g) => ESPECES_VOYAGE.some((vs) => vs[0].groupe === g));
  return (
    <section className="carte-nuit mt-4 rounded-3xl px-3 py-4">
      <p className="px-1 font-display text-2xl text-[#f3d48a]">Tous les voyageurs</p>
      <p className="px-1 text-xs texte-doux">{ESPECES_VOYAGE.length} animaux différents, {VOYAGEURS.length} vrais voyages GPS. Touche un animal pour voir son voyage.</p>
      <div className="mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <button type="button" onClick={() => { setGroupe(null); setMontre(12); }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${groupe === null ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>Tous</button>
        {presents.map((g) => (
          <button key={g} type="button" onClick={() => { setGroupe(g); setMontre(12); }} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${groupe === g ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>
            <span className="h-1.5 w-4 rounded-full" style={{ background: GROUPES_VOYAGE[g].couleur }} /> {GROUPES_VOYAGE[g].label}
          </button>
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {liste.slice(0, montre).map((vs) => {
          const v = vs[0], c = GROUPES_VOYAGE[v.groupe as G].couleur, actif = vs.some((x) => x.i === choisi);
          return (
            <li key={v.latin}>
              <button type="button" onClick={() => onChoisir(v.i)} className={`flex h-full w-full items-center gap-2 rounded-2xl px-2 py-2 text-left ${actif ? "bg-[#f3d48a]/20 ring-2 ring-[#f3d48a]" : "bg-white/5 active:bg-white/10"}`}>
                {v.fiche && aUnePhoto(v.fiche) ? (
                  <span className="block size-12 shrink-0 overflow-hidden rounded-full [&_img]:size-full [&_img]:object-cover" style={{ boxShadow: `0 0 0 2px ${c}` }}><Portrait id={v.fiche} /></span>
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-full" style={{ background: c + "33", boxShadow: `0 0 0 2px ${c}` }}><span className="size-3 rounded-full" style={{ background: c }} /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold leading-tight">{nomDe(v)}</span>
                  <span className="block text-[11px] leading-tight texte-doux">{vs.length > 1 ? `${vs.length} voyages` : "1 voyage"}{v.km ? ` · ${v.km.toLocaleString("fr-FR")} km` : ""}</span>
                  {estComplet(v) ? null : <span className="block text-[10px] font-bold texte-doux">début seulement</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {montre < liste.length ? (
        <button type="button" onClick={() => setMontre((n) => n + 24)} className="bouton-bois mt-3 w-full rounded-2xl py-3 font-extrabold">Voir plus d'animaux ({liste.length - montre} encore)</button>
      ) : null}
    </section>
  );
}

/** Pour aller plus loin : des liens vers Google Earth et les cartes des scientifiques (sur Internet). */
const LIENS: { titre: string; sous: string; url: string }[] = [
  { titre: "Les éléphants de Samburu (Kenya)", sous: "Google Earth, avec l'association Save the Elephants, qui suit des éléphants par GPS.", url: "https://earth.google.com/web/data=CkwSShIgYzYxYzZiNGZmZGM2MTFlNjgwY2YxYjMxZWFiNDNjN2QaJlRyZWtzOiBTYW1idXJ1IE5hdGlvbmFsIFJlc2VydmUsIEtlbnlhKAI" },
  { titre: "Les chimpanzés de Gombe (Tanzanie)", sous: "Google Earth, avec Jane Goodall, qui étudie les chimpanzés depuis des dizaines d'années.", url: "https://earth.google.com/web/data=Cj8SPRIgMTA2NTQ0Mzg0ZWFmMTFlNmI2MTYxOWZkN2FmNGM1ZTAaGUdvb2RhbGwsIEdvbWJlIGFuZCBHb29nbGU" },
  { titre: "Le golfe de Californie (Mexique)", sous: "Google Earth, avec l'océanographe Sylvia Earle : raies mobula et vie marine.", url: "https://earth.google.com/web/data=CkcSRRIgOTEzMzAyMmVkZjQ1MTFlNmFjMzAwZjRkOGQ3ZDM0OWQaIUhvcGUgU3BvdDogVGhlIEd1bGYgb2YgQ2FsaWZvcm5pYQ" },
  { titre: "Protéger la faune d'Afrique", sous: "Google Earth : comment on protège les animaux sauvages d'Afrique.", url: "https://earth.google.com/web/data=CkISQBIgODBkNjNmY2ZkZjU4MTFlNmE0YWIwZjRkOGQ3ZDM0OWQaHFByb3RlY3RpbmcgQWZyaWNhJ3MgV2lsZGxpZmU" },
  { titre: "La carte de Movebank", sous: "La grande carte des scientifiques : des milliers d'études de suivi d'animaux (site en anglais).", url: "https://www.movebank.org/cms/webapp" },
  { titre: "L'application Animal Tracker", sous: "Pour suivre des animaux équipés de balises, avec l'institut Max Planck (site en anglais).", url: "https://www.movebank.org/cms/movebank-content/animal-tracker" },
  { titre: "OCEARCH", sous: "Des requins et des tortues suivis en mer (site en anglais).", url: "https://www.ocearch.org/" },
];

function PlusLoin() {
  const { permis } = useInternet();
  return (
    <details className="carte-nuit mt-4 rounded-3xl px-4 py-3">
      <summary className="cursor-pointer list-none font-display text-lg text-[#f3d48a]">📁 Pour aller plus loin</summary>
      <p className="mt-1 text-xs texte-doux">Ces liens s'ouvrent sur Internet (Google Earth et les sites des scientifiques). Ils ne font pas partie de l'application.</p>
      {permis ? (
        <ul className="mt-2 space-y-2">
          {LIENS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-white/5 px-3 py-2">
                <span className="block font-extrabold">{l.titre}</span>
                <span className="block text-xs texte-doux">{l.sous}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm font-bold">Un adulte peut allumer Internet dans le Coin des parents (Options) pour ouvrir ces liens.</p>
      )}
    </details>
  );
}

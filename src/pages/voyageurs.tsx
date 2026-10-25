// Les grands voyageurs : de vrais trajets GPS (Movebank Data Repository, licences libres),
// sur la carte du monde sombre. Bleu : animaux marins. Vert : herbivores. Doré : oiseaux. Rouge : prédateurs.
// On zoome et on fait tourner la carte avec deux doigts ; on la déplace avec un doigt ; on touche un trajet pour tout savoir.
import { useEffect, useMemo, useRef, useState, type PointerEvent as PE } from "react";
import { LuEarth, LuMap, LuMinus, LuPlus, LuRotateCcw, LuSearch, LuX } from "react-icons/lu";
import { Globe, cadrer } from "@/components/globe";
import { Entete, Titre } from "@/components/entete";
import { Portrait, aUnePhoto } from "@/components/portrait";
import monde from "@/data/monde.json";
import donnees from "@/data/voyageurs.json";
import { plumeDit } from "@/lib/plume";

type Voyageur = {
  latin: string; nom: string | null; fiche: string | null; groupe: "marin" | "herbivore" | "oiseau" | "predateur" | "autre";
  classe?: string | null; individu: string; etude: string; doi: string; licence: string; debut: string; fin: string; km: number; points: [number, number][];
};
const VOYAGEURS = (donnees as Voyageur[]).map((v, i) => ({ ...v, i }));
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
const date = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "Non connu");

type Vue = { x: number; y: number; s: number; r: number };
const DEPART: Vue = { x: 0, y: 0, s: 1, r: 0 };

export function VoyageursPage() {
  const [vue, setVue] = useState<Vue>(DEPART);
  const [choisi, setChoisi] = useState<number | null>(null);
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
      VOYAGEURS.filter((v) => v.groupe === g).sort((a, b) => b.km - a.km).forEach((v, k) => rang.set(v.i, k)),
    );
    return rang;
  }, []);
  const limite = parGroupe(vue.s);
  const visibles = VOYAGEURS.filter((v) => (filtres[v.groupe as G] ?? true) && ((classes.get(v.i) ?? 0) < limite || v.i === choisi));
  const animation = useRef(0);
  const [rejoue, setRejoue] = useState(0);
  const [globe, setGlobe] = useState(true);
  const [vers, setVers] = useState<{ lon: number; lat: number; zoom: number; n: number } | null>(null);
  const resultats = useMemo(() => {
    const t = sansAccent(q.trim());
    if (t.length < 2) return [];
    return VOYAGEURS.filter((v) => sansAccent(`${nomDe(v)} ${v.latin}`).includes(t)).slice(0, 12);
  }, [q]);
  const groupesPresents = (Object.keys(GROUPES_VOYAGE) as G[]).filter((g) => VOYAGEURS.some((v) => v.groupe === g));

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
  }, []);
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
    bouge.current += 1;
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
  // La transformation : déplacement, zoom autour du point (0,0), puis rotation autour du centre de la carte.
  const transformation = `rotate(${vue.r} 180 90) translate(${vue.x} ${vue.y}) scale(${vue.s})`;

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/aventure" />
      <Titre sous="De vrais trajets, suivis par GPS par des scientifiques.">Les grands voyageurs</Titre>

      {/* Recherche discrète */}
      <div className="relative mt-3 flex justify-end">
        {cherche ? (
          <label className="flex w-full items-center gap-2 rounded-full bg-card px-4 py-2.5">
            <LuSearch className="size-5 text-[#6d5648]" aria-hidden="true" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un animal…" className="w-full bg-transparent outline-none placeholder:text-[#8a7462]" />
            <button type="button" aria-label="Fermer la recherche" onClick={() => { setCherche(false); setQ(""); }}><LuX className="size-5 text-[#6d5648]" /></button>
          </label>
        ) : (
          <button type="button" aria-label="Chercher un animal" onClick={() => setCherche(true)} className="grid size-10 place-items-center rounded-full bg-[#2a1844] text-[#f3d48a] ring-1 ring-[#e8c98a]/50">
            <LuSearch className="size-5" />
          </button>
        )}
        {cherche && resultats.length ? (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-2xl bg-card p-1 shadow-xl">
            {resultats.map((r) => (
              <li key={r.i}>
                <button type="button" onClick={() => montrer(r.i)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: GROUPES_VOYAGE[r.groupe as G].couleur }} />
                  <span className="min-w-0 flex-1"><span className="block font-extrabold leading-tight">{nomDe(r)}</span><span className="block text-xs italic">{r.latin} · {r.km.toLocaleString("fr-FR")} km</span></span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* La carte */}
      <div className="relative mt-2 overflow-hidden rounded-3xl border-2 border-[#e8c98a]/60 bg-[#0b1230] shadow-[0_10px_22px_rgba(0,0,0,.45)]">
        {globe ? (
          <Globe traces={visibles.map((t) => ({ i: t.i, couleur: GROUPES_VOYAGE[t.groupe as G].couleur, points: t.points }))} choisi={choisi} vers={vers} onChoisir={(i) => montrer(i)} />
        ) : (
        <svg
          ref={boite}
          viewBox={`0 ${90 - haut / 2} 360 ${haut}`}
          className="block h-[62vh] min-h-[340px] w-full touch-none select-none"
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
                <g key={`${t.i}-${k}`} onClick={() => bouge.current < 4 && montrer(t.i, false)} style={{ cursor: "pointer" }}>
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
          <button type="button" aria-label={globe ? "Voir la carte à plat" : "Voir le globe"} onClick={() => setGlobe((g) => !g)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/50 px-3 text-sm font-extrabold text-white backdrop-blur">
            {globe ? <><LuMap className="size-4" /> À plat</> : <><LuEarth className="size-4" /> Globe</>}
          </button>
        </div>
        <div className={`absolute right-2 top-2 flex flex-col gap-1.5 ${globe ? "hidden" : ""}`}>
          <button type="button" aria-label="Zoomer" onClick={() => zoom(1.5)} className="grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><LuPlus className="size-5" /></button>
          <button type="button" aria-label="Dézoomer" onClick={() => zoom(1 / 1.5)} className="grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><LuMinus className="size-5" /></button>
          <button type="button" aria-label="Revenir à toute la carte" onClick={() => { allerVers(departVue()); setChoisi(null); }} className="grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><LuRotateCcw className="size-5" /></button>
        </div>
        {!VOYAGEURS.length ? <p className="absolute inset-x-0 bottom-3 text-center text-sm font-bold text-white/80">Les trajets arrivent : la recherche est en cours.</p> : null}
      </div>

      {/* Légende : touche une couleur pour l'afficher ou la cacher */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {groupesPresents.map((g) => (
          <button key={g} type="button" aria-pressed={filtres[g]} onClick={() => setFiltres((f) => ({ ...f, [g]: !f[g] }))} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold ${filtres[g] ? "bg-[#2a1844] text-white" : "bg-[#2a1844]/40 text-white/50 line-through"}`}>
            <span className="h-1.5 w-5 rounded-full" style={{ background: GROUPES_VOYAGE[g].couleur }} /> {GROUPES_VOYAGE[g].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs texte-doux">{visibles.length} trajets sur {VOYAGEURS.length}{visibles.length < VOYAGEURS.length ? " · zoome pour en voir plus" : ""} · un doigt pour déplacer, deux pour zoomer et tourner.</p>

      {/* La fiche du voyageur choisi */}
      {v ? (
        <section className="carte-nuit relative mt-4 rounded-3xl px-4 py-4">
          <button type="button" aria-label="Fermer" onClick={() => setChoisi(null)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/10"><LuX className="size-5" /></button>
          <div className="flex items-center gap-3 pr-10">
            {v.fiche && aUnePhoto(v.fiche) ? <span className="medaillon-or block size-16 shrink-0 overflow-hidden"><Portrait id={v.fiche} /></span> : <span className="grid size-16 shrink-0 place-items-center rounded-full text-3xl" style={{ background: GROUPES_VOYAGE[v.groupe as G].couleur + "33" }}>•</span>}
            <div className="min-w-0">
              <p className="font-display text-2xl leading-tight text-[#f3d48a]">{nomDe(v)}</p>
              <p className="text-sm italic texte-doux">{v.latin}{v.nom ? "" : " · nom français non connu"}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-extrabold"><span className="h-1.5 w-4 rounded-full" style={{ background: GROUPES_VOYAGE[v.groupe as G].couleur }} />{GROUPES_VOYAGE[v.groupe as G].label}</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white/5 px-3 py-2"><dt className="text-xs texte-doux">Distance du trajet</dt><dd className="font-display text-xl">{v.km.toLocaleString("fr-FR")} km</dd></div>
            <div className="rounded-2xl bg-white/5 px-3 py-2"><dt className="text-xs texte-doux">Suivi</dt><dd className="font-bold">{date(v.debut)} → {date(v.fin)}</dd></div>
          </dl>
          <p className="mt-2 text-[11px] texte-doux">Distance mesurée entre les points GPS gardés : le vrai chemin est un peu plus long.</p>
          <p className="mt-2 text-xs">Animal suivi : « {v.individu} ». Étude : {v.etude}. Licence {v.licence}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {v.fiche ? <a href={`#/mammiferes/e-${v.fiche}`} className="bouton-bois rounded-full px-4 py-2 text-sm font-extrabold">Voir sa fiche</a> : null}
            {v.doi ? <a href={v.doi} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold">La source scientifique</a> : null}
          </div>
        </section>
      ) : null}
      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] texte-doux">Données : Movebank Data Repository (jeux de données publiés en licence libre). Rien n'est inventé : chaque trait est un vrai suivi GPS.</p>
    </main>
  );
}

// Les grands voyageurs : de vrais trajets GPS (Movebank Data Repository, licences libres),
// sur la carte du monde sombre. Bleu : animaux marins. Vert : herbivores. Doré : oiseaux. Rouge : prédateurs.
// On zoome et on fait tourner la carte avec deux doigts ; on la déplace avec un doigt ; on touche un trajet pour tout savoir.
import { useEffect, useMemo, useRef, useState, type PointerEvent as PE } from "react";
import { LuMinus, LuPlus, LuRotateCcw, LuSearch, LuX } from "react-icons/lu";
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

  const visibles = VOYAGEURS.filter((v) => filtres[v.groupe as G] ?? true);
  const lignes = useMemo(() => VOYAGEURS.map((v) => morceaux(v.points)), []);
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

  /** Coordonnées du doigt dans l'image de la carte (unités de la carte, 360 × 180). */
  function local(x: number, y: number) {
    const r = boite.current!.getBoundingClientRect();
    return { x: ((x - r.left) / r.width) * 360, y: ((y - r.top) / r.height) * 180 };
  }
  function appui(e: PE<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    doigts.current.set(e.pointerId, local(e.clientX, e.clientY));
    bouge.current = 0;
    depart();
  }
  function depart() {
    const p = [...doigts.current.values()];
    if (!p.length) return (avant.current = null);
    const cx = p.reduce((s, a) => s + a.x, 0) / p.length, cy = p.reduce((s, a) => s + a.y, 0) / p.length;
    const d = p.length > 1 ? Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) : 0;
    const a = p.length > 1 ? Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) : 0;
    avant.current = { vue, d, a, cx, cy };
  }
  function deplace(e: PE<SVGSVGElement>) {
    if (!doigts.current.has(e.pointerId) || !avant.current) return;
    doigts.current.set(e.pointerId, local(e.clientX, e.clientY));
    const p = [...doigts.current.values()];
    const b = avant.current;
    const cx = p.reduce((s, a) => s + a.x, 0) / p.length, cy = p.reduce((s, a) => s + a.y, 0) / p.length;
    bouge.current += 1;
    if (p.length > 1 && b.d > 0) {
      const d = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
      const a = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
      const s = Math.max(1, Math.min(40, (b.vue.s * d) / b.d));
      setVue({ x: b.vue.x + (cx - b.cx), y: b.vue.y + (cy - b.cy), s, r: b.vue.r + ((a - b.a) * 180) / Math.PI });
    } else setVue({ ...b.vue, x: b.vue.x + (cx - b.cx), y: b.vue.y + (cy - b.cy) });
  }
  function lache(e: PE<SVGSVGElement>) {
    doigts.current.delete(e.pointerId);
    depart();
  }
  function zoom(f: number) {
    setVue((v) => ({ ...v, s: Math.max(1, Math.min(40, v.s * f)) }));
  }

  /** Centre la carte sur un trajet. */
  function montrer(i: number) {
    setChoisi(i);
    setCherche(false);
    const pts = VOYAGEURS[i].points;
    const xs = pts.map((p) => p[1] + 180), ys = pts.map((p) => 90 - p[0]);
    const w = Math.max(...xs) - Math.min(...xs) + 6, h = Math.max(...ys) - Math.min(...ys) + 6;
    const s = Math.max(1, Math.min(30, Math.min(360 / w, 180 / h) * 0.8));
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    setVue({ s, r: 0, x: 180 - cx * s, y: 90 - cy * s });
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
        <svg
          ref={boite}
          viewBox="0 0 360 180"
          className="block aspect-[2/1] w-full touch-none select-none"
          onPointerDown={appui}
          onPointerMove={deplace}
          onPointerUp={lache}
          onPointerCancel={lache}
          onWheel={(e) => zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2)}
          role="img"
          aria-label="Carte du monde des trajets"
        >
          <g transform={transformation}>
            <rect x="-360" y="-180" width="1080" height="540" fill="#0b1230" />
            {Object.entries(PAYS).map(([c, d]) => <path key={c} d={d} fill="#1e2b55" stroke="#0b1230" strokeWidth={0.3 / vue.s} />)}
            {visibles.map((t) =>
              lignes[t.i].map((pts, k) => (
                <g key={`${t.i}-${k}`} onClick={() => bouge.current < 4 && setChoisi(t.i)} style={{ cursor: "pointer" }}>
                  <polyline points={pts} fill="none" stroke="transparent" strokeWidth={16} vectorEffect="non-scaling-stroke" />
                  <polyline
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
          </g>
        </svg>
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button type="button" aria-label="Zoomer" onClick={() => zoom(1.5)} className="grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><LuPlus className="size-5" /></button>
          <button type="button" aria-label="Dézoomer" onClick={() => zoom(1 / 1.5)} className="grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><LuMinus className="size-5" /></button>
          <button type="button" aria-label="Revenir à toute la carte" onClick={() => { setVue(DEPART); setChoisi(null); }} className="grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"><LuRotateCcw className="size-5" /></button>
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
      <p className="mt-2 text-center text-xs texte-doux">{visibles.length} trajets · un doigt pour déplacer, deux pour zoomer et tourner.</p>

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

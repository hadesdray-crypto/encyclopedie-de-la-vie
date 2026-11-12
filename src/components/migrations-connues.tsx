// Les trajets migratoires CONNUS (même sans GPS) : des zones de couleur où l'animal séjourne selon la saison,
// des traits en pointillés pour le chemin approximatif entre deux zones, et tout ce qu'on sait : pourquoi, quand, sources.
// Pour les oiseaux et les animaux terrestres, un bouton prépare le voyage dans Google Earth (gratuit) ; pas pour les animaux marins.
import { useEffect, useMemo, useState } from "react";
import { LuEarth, LuExternalLink } from "react-icons/lu";
import { Globe, cadrer, type TraceGlobe, type ZoneGlobe } from "@/components/globe";
import donnees from "@/data/migrations-connues.json";
import { FicheAnimal } from "@/components/fiche-animal";
import { VoyageSatellite } from "@/components/voyage-satellite";
import { ouvrirGoogleEarth, type VitesseVol } from "@/lib/google-earth";

export type Migration = {
  id: string; type: "route" | "carrefour"; categorie: "air" | "terre" | "mer"; nom: string; latin: string | null;
  points: [number, number][]; etapes: { nom: string; lat: number; lon: number; texte: string }[];
  distance_km: number | null; periode: string; pourquoi: string; chiffre_cle: string; incertitude: string;
  sources: { titre: string; url: string }[]; fiche_app: string | null; verifie: boolean;
};
const TOUS = donnees as unknown as Migration[];
const COULEUR = { air: "#f3c35a", terre: "#5fe07a", mer: "#4fb6ff" } as const;
const RAYON = { air: 5, terre: 3.5, mer: 6 } as const; // en degrés : la taille de la zone colorée
const ONGLETS = [
  { id: "air", titre: "Dans les airs" }, { id: "terre", titre: "Sur terre" }, { id: "mer", titre: "Dans la mer" }, { id: "carrefour", titre: "Carrefours" },
] as const;
type Onglet = (typeof ONGLETS)[number]["id"];

export function MigrationsConnues() {
  const [onglet, setOnglet] = useState<Onglet>("air");
  const liste = useMemo(() => TOUS.filter((m) => (onglet === "carrefour" ? m.type === "carrefour" : m.type === "route" && m.categorie === onglet)), [onglet]);
  const [id, setId] = useState<string | null>(null);
  const m = liste.find((x) => x.id === id) ?? null;
  const [vitesse, setVitesse] = useState<VitesseVol>("normal");
  const [msg, setMsg] = useState("");

  const zones: ZoneGlobe[] = useMemo(() => {
    if (!m) return [];
    const r = m.type === "carrefour" ? 3 : RAYON[m.categorie];
    return m.etapes.map((e) => ({ lat: e.lat, lon: e.lon, rayon: r, couleur: COULEUR[m.categorie] }));
  }, [m]);
  // Tous les trajets de l'onglet sont sur le globe : on touche un chemin pour ouvrir la fiche de l'animal.
  const traces: TraceGlobe[] = useMemo(
    () => liste.flatMap((x, k) => (x.type === "route" && (!m || m.id === x.id) ? [{ i: k, couleur: COULEUR[x.categorie], points: x.points, pointille: true }] : [])),
    [liste, m],
  );
  const choisi = m ? liste.findIndex((x) => x.id === m.id) : null;
  const vers = useMemo(() => {
    // Un animal choisi : on le cadre. Sinon : on tourne le globe vers tous les trajets (ou carrefours) de l'onglet.
    const pts: [number, number][] = m
      ? m.type === "carrefour" ? [[m.points[0][0] - 3, m.points[0][1] - 3], [m.points[0][0] + 3, m.points[0][1] + 3]] : m.points
      : liste.flatMap((x) => x.points);
    if (!pts.length) return null;
    const c = cadrer(pts);
    return { lon: c.lon, lat: c.lat, zoom: Math.min(c.zoom, m ? 2.4 : 1.4), n: Date.now() };
  }, [m, liste]);

  return (
    <section className="carte-nuit mt-6 rounded-3xl px-4 py-4">
      <h2 className="font-display text-2xl text-[#f3d48a]">Les trajets connus</h2>
      <p className="mt-1 text-sm">Même sans GPS, on connaît où ils séjournent et par où ils passent. Les zones colorées : où ils vivent selon la saison. Les pointillés : le chemin approximatif entre deux zones.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist">
        {ONGLETS.map((o) => (
          <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} onClick={() => { setOnglet(o.id); setId(null); setMsg(""); }}
            className={`min-h-11 rounded-full px-4 text-sm font-extrabold ${onglet === o.id ? "bouton-bois" : "bg-white/10"}`}>{o.titre}</button>
        ))}
      </div>
      <label className="mt-3 block text-sm font-extrabold">Choisis un animal
        <select value={id ?? ""} onChange={(e) => { setId(e.target.value || null); setMsg(""); }} className="mt-1 min-h-11 w-full rounded-2xl bg-card px-3 text-[#2a1c14]">
          <option value="">Tous (vue d'ensemble)</option>
          {liste.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
        </select>
      </label>
      <div className="mt-3 h-[46vh] min-h-[300px] overflow-hidden rounded-2xl">
        <Globe traces={traces} zones={zones} choisi={choisi} vers={vers} onChoisir={(k) => { setId(liste[k]?.id ?? null); setMsg(""); }} hauteur="h-full" />
      </div>
      {m ? <Fiche m={m} vitesse={vitesse} setVitesse={setVitesse} msg={msg} setMsg={setMsg} /> : <p className="mt-3 text-sm texte-doux">{liste.length} {onglet === "carrefour" ? "carrefours" : "trajets"}. Touche un chemin sur le globe, ou choisis-le dans la liste : tu verras sa fiche.</p>}
    </section>
  );
}

function Fiche({ m, vitesse, setVitesse, msg, setMsg }: { m: Migration; vitesse: VitesseVol; setVitesse: (v: VitesseVol) => void; msg: string; setMsg: (s: string) => void }) {
  const [suivi, setSuivi] = useState(false);
  useEffect(() => setSuivi(false), [m.id]);
  return (
    <div className="mt-4 text-sm leading-relaxed">
      <h3 className="font-display text-xl text-[#f3d48a]">{m.nom}</h3>
      {m.latin ? <p className="italic texte-doux">{m.latin}</p> : null}
      <p className="mt-2"><b>Quand : </b>{m.periode}</p>
      <p className="mt-1"><b>Pourquoi : </b>{m.pourquoi}</p>
      <p className="mt-1"><b>À retenir : </b>{m.chiffre_cle}</p>
      {m.type === "route" ? (
        <ol className="mt-2 space-y-1">
          {m.etapes.map((e, k) => <li key={k}><b>{k + 1}. {e.nom}</b> — {e.texte}</li>)}
        </ol>
      ) : <p className="mt-1">{m.etapes[0]?.texte}</p>}
      <p className="mt-2 text-xs texte-doux"><b>Ce qu'on ignore : </b>{m.incertitude}{m.verifie ? "" : " (informations à confirmer avec davantage de sources)"}</p>
      <ul className="mt-2 space-y-0.5 text-xs">
        {m.sources.map((s, k) => <li key={k}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.titre}</a></li>)}
      </ul>
      {m.type === "route" && m.points.length > 1 ? (
        <button type="button" onClick={() => setSuivi(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f3d48a] to-[#e7b75a] py-3.5 text-base font-black text-[#2a1650] shadow-[0_0_18px_rgba(243,212,138,.45)] active:scale-[.98]">
          <LuEarth aria-hidden /> Suivre ce trajet, vu du ciel
        </button>
      ) : null}
      {suivi ? <VoyageSatellite points={m.points} nom={m.nom} photo={null} couleur={COULEUR[m.categorie]} complet depart={undefined} arrivee={undefined} onFermer={() => setSuivi(false)} /> : null}
      {m.categorie !== "mer" ? (
        <div className="mt-4 rounded-2xl bg-white/5 p-3">
          <p className="font-extrabold">Voyager comme {m.categorie === "air" ? "l'oiseau" : "l'animal"}</p>
          <p className="text-xs texte-doux">Ouvre Google Earth (gratuit, avec ton compte Google) pour {m.categorie === "air" ? "voler" : "avancer au ras du sol"} le long de ce trajet. Tu peux y mettre pause et revenir en arrière.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(["lent", "normal", "rapide"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setVitesse(v)} className={`min-h-11 rounded-full px-4 text-sm font-extrabold ${vitesse === v ? "bouton-bois" : "bg-white/10"}`}>{v === "lent" ? "Lent" : v === "normal" ? "Normal" : "Rapide"}</button>
            ))}
          </div>
          <button type="button" onClick={async () => setMsg(await ouvrirGoogleEarth(m, vitesse))} className="bouton-bois mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-extrabold">
            <LuEarth aria-hidden /> Ouvrir dans Google Earth <LuExternalLink aria-hidden className="size-4" />
          </button>
          {msg ? <p className="mt-2 text-xs">{msg}</p> : null}
        </div>
      ) : <p className="mt-3 text-xs texte-doux">Sous l'eau, il n'y a pas d'images : on ne propose pas de voyage « à la place de l'animal » pour les animaux marins.</p>}
      {m.type === "route" ? <FicheAnimal id={m.fiche_app} latin={m.latin} /> : null}
    </div>
  );
}

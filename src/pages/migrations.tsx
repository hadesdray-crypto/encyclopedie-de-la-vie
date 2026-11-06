// Les migrations, en trois catégories : dans les airs, sur terre, dans la mer.
// Tout vient de vrais suivis GPS (Movebank Data Repository). Sous l'eau, personne ne filme :
// on suit l'émetteur de l'animal quand il revient respirer à la surface, et on raconte son parcours avec ses vraies distances.
import { useEffect, useMemo, useState } from "react";
import { Entete, Titre } from "@/components/entete";
import { Portrait, aUnePhoto } from "@/components/portrait";
import donnees from "@/data/voyageurs.json";

type V = { latin: string; nom: string | null; fiche: string | null; groupe: string; individu: string; km: number | null; debut: string; fin: string; complet?: boolean; points: [number, number][] };
const TOUS = donnees as unknown as V[];
const nb = (x: number) => Math.round(x).toLocaleString("fr-FR");
const lieu = (p: [number, number]) => `${Math.abs(p[0]).toFixed(2)}° ${p[0] >= 0 ? "N" : "S"}, ${Math.abs(p[1]).toFixed(2)}° ${p[1] >= 0 ? "E" : "O"}`;

const CATEGORIES = [
  { id: "oiseau", titre: "Dans les airs", sous: "Les oiseaux migrateurs.", groupes: ["oiseau"], lien: "oiseau" },
  { id: "terre", titre: "Sur terre", sous: "Herbivores et prédateurs.", groupes: ["herbivore", "predateur", "autre"], lien: "herbivore" },
  { id: "marin", titre: "Dans la mer", sous: "Baleines, cachalots, phoques…", groupes: ["marin"], lien: "marin" },
];

export function MigrationsPage() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-4">
      <Entete siVide="/animaux" />
      <Titre sous="De vrais trajets, mesurés par GPS. Rien n'est inventé.">Les migrations</Titre>
      <ul className="mt-5 space-y-3">
        {CATEGORIES.map((c) => {
          const n = TOUS.filter((v) => c.groupes.includes(v.groupe)).length;
          return (
            <li key={c.id}>
              <a href={`#/aventure?voyages=1&groupe=${c.lien}`} className="block rounded-3xl bg-card px-4 py-4 text-[#2a1c14]">
                <span className="block font-display text-2xl leading-tight">{c.titre}</span>
                <span className="block text-sm leading-snug">{c.sous}</span>
                <span className="block text-xs font-black text-[#8d4e1f]">{n} trajets suivis</span>
              </a>
            </li>
          );
        })}
      </ul>
      <Nage />
    </main>
  );
}

/** Le voyage d'un animal marin, raconté avec ses vraies distances : l'animal avance sur son trajet réel. */
function Nage() {
  const liste = useMemo(() => TOUS.filter((v) => v.groupe === "marin" && v.complet && v.km && v.points.length > 5).sort((a, b) => (b.km ?? 0) - (a.km ?? 0)), []);
  const [choix, setChoix] = useState(0);
  const [p, setP] = useState(0);
  const v = liste[choix];
  useEffect(() => {
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }
    setP(0);
    const t = setInterval(() => setP((x) => (x >= 1 ? 1 : Math.min(1, x + 0.01))), 120);
    return () => clearInterval(t);
  }, [v]);
  if (!v) return null;
  const jours = Math.max(1, Math.round((new Date(v.fin).getTime() - new Date(v.debut).getTime()) / 86400000));
  const pos = v.points[Math.min(v.points.length - 1, Math.floor(p * (v.points.length - 1)))];
  const fait = (v.km ?? 0) * p;
  const nom = v.nom ?? v.latin;
  return (
    <section className="carte-nuit mt-6 rounded-3xl px-4 py-4">
      <h2 className="font-display text-2xl text-[#f3d48a]">Suivre un animal marin</h2>
      <p className="mt-1 text-sm">Personne ne filme sous l'eau. On suit l'émetteur de l'animal quand il revient respirer à la surface.</p>
      <label className="mt-3 block text-sm font-extrabold">Choisis un voyage
        <select value={choix} onChange={(e) => setChoix(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-2xl bg-card px-3 text-[#2a1c14]">
          {liste.map((x, k) => <option key={k} value={k}>{(x.nom ?? x.latin)} · {nb(x.km ?? 0)} km · {x.debut.slice(0, 4)}</option>)}
        </select>
      </label>
      <div className="relative mt-5 h-14">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#4fb6ff]/40" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#4fb6ff]" style={{ width: `${p * 100}%` }} />
        <span className="medaillon-or absolute top-0 block size-14 overflow-hidden" style={{ left: `calc(${p * 100}% - ${p * 56}px)` }}>
          {v.fiche && aUnePhoto(v.fiche) ? <Portrait id={v.fiche} /> : null}
        </span>
      </div>
      <p className="mt-3 leading-relaxed">
        {nom} est suivi pendant {jours} jours. Il a nagé {nb(v.km ?? 0)} km au total, soit environ {nb((v.km ?? 0) / jours)} km par jour.
        {" "}Là, il a déjà fait {nb(fait)} km. Sa position : {lieu(pos)}.
      </p>
      <button type="button" onClick={() => setP(0)} className="bouton-bois mt-3 min-h-11 rounded-full px-5 font-extrabold">Rejouer le voyage</button>
      <p className="mt-2 text-[11px] texte-doux">Données : Movebank Data Repository, licences libres. Le « pourquoi » du trajet (nourriture, reproduction) sera ajouté avec des sources vérifiées.</p>
    </section>
  );
}

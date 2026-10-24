import { useState } from "react";
import { ESPECES } from "@/data/catalogue";
import { REGIMES, type RegimeId } from "@/data/fiches-vie";
import { ETAPES, FRISE } from "@/data/arbre";
import { noterReponse } from "@/lib/carnet";
import { Entete, Titre } from "@/components/entete";
import { Portrait, aUnePhoto } from "@/components/portrait";
import { Vignette } from "@/components/icone";

function melanger<T>(l: T[]) {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

const POOL = ESPECES.filter((e) => e.regime && e.langue === "fr" && !e.disparue && aUnePhoto(e.id));

function questionRegime() {
  const e = POOL[Math.floor(Math.random() * POOL.length)];
  const bon = e.regime as RegimeId;
  const autres = melanger((Object.keys(REGIMES) as RegimeId[]).filter((r) => r !== bon)).slice(0, 2);
  return { e, bon, choix: melanger([bon, ...autres]) };
}

// Seulement les étapes prouvées, assez éloignées dans le temps pour qu'il n'y ait pas de doute.
const DATEES = FRISE.filter((e) => e.savoir === "preuve");
function questionTemps() {
  for (;;) {
    const [a, b] = melanger(DATEES).slice(0, 2);
    const ecart = Math.abs(a.ma! - b.ma!) / Math.max(a.ma!, b.ma!);
    if (ecart > 0.25) return { a, b, bon: a.ma! > b.ma! ? a.id : b.id };
  }
}

export function JouerPage() {
  const [jeu, setJeu] = useState<"regime" | "temps">("regime");
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre>Défis du jour</Titre>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setJeu("regime")} className={`min-h-12 rounded-2xl font-extrabold ${jeu === "regime" ? "bouton-bois" : "bg-card"}`}>Qu'est-ce qu'il mange ?</button>
        <button type="button" onClick={() => setJeu("temps")} className={`min-h-12 rounded-2xl font-extrabold ${jeu === "temps" ? "bouton-bois" : "bg-card"}`}>Qui est arrivé en premier ?</button>
      </div>
      {jeu === "regime" ? <JeuRegime /> : <JeuTemps />}
    </main>
  );
}

function JeuRegime() {
  const [q, setQ] = useState(questionRegime);
  const [rep, setRep] = useState<RegimeId | null>(null);
  return (
    <section className="mt-5">
      <a href={`#/mammiferes/e-${q.e.id}`} className="medaillon-or mx-auto block size-36 overflow-hidden"><Portrait id={q.e.id} /></a>
      <p className="titre-or mt-4 text-center text-3xl">{q.e.nom}</p>
      <p className="text-center">Il mange surtout…</p>
      <ul className="mt-4 space-y-3">
        {q.choix.map((id) => {
          const juste = rep !== null && id === q.bon;
          const faux = rep === id && id !== q.bon;
          return (
            <li key={id}>
              <button type="button" onClick={() => { if (!rep) { setRep(id); noterReponse(id === q.bon); } }} className={`w-full rounded-2xl px-4 py-4 text-left text-[#2a1c14] ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"}`}>
                <span className="block font-display text-2xl">{REGIMES[id].nom}</span>
                <span className="block text-sm">{REGIMES[id].explique}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rep ? <button type="button" onClick={() => { setQ(questionRegime()); setRep(null); }} className="bouton-bois au-dessus-barre mt-4 w-full rounded-2xl py-4 font-display text-2xl">Une autre</button> : null}
    </section>
  );
}

function JeuTemps() {
  const [q, setQ] = useState(questionTemps);
  const [rep, setRep] = useState<string | null>(null);
  return (
    <section className="mt-5">
      <p className="text-center text-lg">Touche celui qui est apparu en premier sur Terre.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[q.a, q.b].map((e) => {
          const juste = rep && e.id === q.bon;
          const faux = rep === e.id && e.id !== q.bon;
          return (
            <button key={e.id} type="button" onClick={() => { if (!rep) { setRep(e.id); noterReponse(e.id === q.bon); } }} className={`flex flex-col items-center rounded-3xl px-2 py-4 text-[#2a1c14] ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"}`}>
              <span className="medaillon block size-24 overflow-hidden"><Vignette image={e.image} icone={e.icone} /></span>
              <span className="mt-2 font-display text-xl leading-tight">{e.nom}</span>
              {rep ? <span className="mt-1 text-sm">{e.quand}</span> : null}
            </button>
          );
        })}
      </div>
      {rep ? (
        <>
          <p className="mt-4 text-center text-lg font-extrabold">{rep === q.bon ? "Bravo !" : `Non : c'est « ${ETAPES[q.bon].nom} » qui est arrivé avant.`}</p>
          <button type="button" onClick={() => { setQ(questionTemps()); setRep(null); }} className="bouton-bois au-dessus-barre mt-4 w-full rounded-2xl py-4 font-display text-2xl">Une autre</button>
        </>
      ) : null}
    </section>
  );
}

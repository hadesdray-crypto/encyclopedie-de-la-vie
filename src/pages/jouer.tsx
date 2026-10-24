import { useEffect, useState } from "react";
import type { Espece } from "@/data/catalogue";
import { lireVues } from "@/lib/carnet";
import { sons } from "@/lib/sons";
import { gagnerPaquet } from "@/lib/recompenses";
import { grammesDe } from "@/lib/poids";
import { CarteMonde } from "@/components/carte-monde";
import { CarteVerso } from "@/components/carte-animal";
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

type Jeu = "regime" | "temps" | "memoire" | "poids" | "carte";

export function JouerPage({ params }: { params: URLSearchParams }) {
  const [jeu, setJeu] = useState<Jeu>((params.get("jeu") as Jeu) || "memoire");
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre>Défis du jour</Titre>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {([["memoire", "Mémoire"], ["poids", "Le plus lourd ?"], ["carte", "Qui vit ici ?"], ["regime", "Qu'est-ce qu'il mange ?"], ["temps", "Qui est arrivé en premier ?"]] as const).map(([id, nom]) => (
          <button key={id} type="button" onClick={() => setJeu(id)} className={`min-h-12 rounded-2xl px-3 text-sm font-extrabold leading-tight ${jeu === id ? "bouton-bois" : "bg-card"}`}>{nom}</button>
        ))}
      </div>
      {jeu === "memoire" ? <JeuMemoire /> : jeu === "poids" ? <JeuPoids /> : jeu === "carte" ? <JeuCarte /> : jeu === "regime" ? <JeuRegime /> : <JeuTemps />}
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
              <button type="button" onClick={() => { if (!rep) { setRep(id); noterReponse(id === q.bon); if (id === q.bon) sons.bonne(); else sons.mauvaise(); } }} className={`w-full rounded-2xl px-4 py-4 text-left text-[#2a1c14] ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"}`}>
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
            <button key={e.id} type="button" onClick={() => { if (!rep) { setRep(e.id); noterReponse(e.id === q.bon); if (e.id === q.bon) sons.bonne(); else sons.mauvaise(); } }} className={`flex flex-col items-center rounded-3xl px-2 py-4 text-[#2a1c14] ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"}`}>
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

// ---------- Jeu de mémoire ----------
const NIVEAUX_MEMOIRE = [
  { paires: 6, nom: "Facile", colonnes: "grid-cols-3" },
  { paires: 8, nom: "Moyen", colonnes: "grid-cols-4" },
  { paires: 10, nom: "Difficile", colonnes: "grid-cols-4" },
];

type CaseMemoire = { cle: number; espece: Espece };

function tirerAnimaux(n: number, collection: boolean): Espece[] {
  const vus = new Set(lireVues());
  const miens = POOL.filter((e) => vus.has(e.id));
  const source = collection && miens.length >= n ? miens : POOL;
  return melanger(source).slice(0, n);
}

function JeuMemoire() {
  const [niveau, setNiveau] = useState(0);
  const [collection, setCollection] = useState(true);
  const [cases, setCases] = useState<CaseMemoire[]>([]);
  const [ouvertes, setOuvertes] = useState<number[]>([]);
  const [trouvees, setTrouvees] = useState<Set<string>>(new Set());
  const [coups, setCoups] = useState(0);
  const [bloque, setBloque] = useState(false);

  function nouvellePartie(n = niveau, c = collection) {
    const animaux = tirerAnimaux(NIVEAUX_MEMOIRE[n].paires, c);
    setCases(melanger(animaux.flatMap((e, i) => [{ cle: i * 2, espece: e }, { cle: i * 2 + 1, espece: e }])));
    setOuvertes([]);
    setTrouvees(new Set());
    setCoups(0);
    setBloque(false);
  }

  useEffect(() => nouvellePartie(), []);

  function toucher(i: number) {
    if (bloque || ouvertes.includes(i) || trouvees.has(cases[i].espece.id)) return;
    sons.retourner();
    const suite = [...ouvertes, i];
    setOuvertes(suite);
    if (suite.length < 2) return;
    setCoups((c) => c + 1);
    const [a, b] = suite;
    if (cases[a].espece.id === cases[b].espece.id) {
      const t = new Set(trouvees).add(cases[a].espece.id);
      setTrouvees(t);
      setOuvertes([]);
      if (t.size === cases.length / 2) {
        window.setTimeout(() => sons.victoire(), 300);
        window.setTimeout(() => gagnerPaquet("Jeu de mémoire réussi"), 1400);
      }
      else window.setTimeout(() => sons.bonne(), 250);
    } else {
      setBloque(true);
      window.setTimeout(() => {
        setOuvertes([]);
        setBloque(false);
      }, 1000);
    }
  }

  const fini = cases.length > 0 && trouvees.size === cases.length / 2;
  const n = NIVEAUX_MEMOIRE[niveau];
  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {NIVEAUX_MEMOIRE.map((nv, i) => (
          <button key={nv.nom} type="button" onClick={() => { setNiveau(i); nouvellePartie(i); }} className={`rounded-full px-4 py-2 text-sm font-extrabold ${i === niveau ? "bouton-bois" : "bg-card"}`}>
            {nv.nom} · {nv.paires} paires
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center justify-center gap-2 text-sm">
        <input type="checkbox" checked={collection} onChange={(e) => { setCollection(e.target.checked); nouvellePartie(niveau, e.target.checked); }} className="size-5 accent-[#d9b56a]" />
        Avec les animaux de ma collection
      </label>
      <p className="mt-2 text-center font-extrabold text-[#f0d090]">{trouvees.size} paire{trouvees.size > 1 ? "s" : ""} sur {n.paires} · {coups} coup{coups > 1 ? "s" : ""}</p>
      <ul className={`mt-3 grid ${n.colonnes} gap-2`}>
        {cases.map((c, i) => {
          const visible = ouvertes.includes(i) || trouvees.has(c.espece.id);
          return (
            <li key={c.cle}>
              <button type="button" onClick={() => toucher(i)} className={`retournable block aspect-[3/4] w-full ${visible ? "retourne" : ""}`} aria-label={visible ? c.espece.nom : "Carte cachée"}>
                <span className="retournable-interieur block">
                  <span className="face block"><CarteVerso /></span>
                  <span className={`face face-recto flex flex-col overflow-hidden rounded-2xl bg-card p-1 ${trouvees.has(c.espece.id) ? "ring-4 ring-[#9be08a]" : ""}`}>
                    <span className="block min-h-0 flex-1 overflow-hidden rounded-xl"><Portrait id={c.espece.id} /></span>
                    <span className="line-clamp-2 pt-0.5 text-center text-[11px] font-extrabold leading-tight text-[#2a1c14]">{c.espece.nom}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {fini ? (
        <div className="arrivee mt-5 rounded-3xl bg-card px-4 py-4 text-center">
          <p className="font-display text-3xl">Bravo !</p>
          <p className="mt-1">Toutes les paires en {coups} coups. Le minimum possible, c'est {n.paires}.</p>
          <p className="mt-3 text-sm font-extrabold">Les animaux de cette partie :</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[...new Map(cases.map((c) => [c.espece.id, c.espece])).values()].map((e) => (
              <a key={e.id} href={`#/mammiferes/e-${e.id}`} className="rounded-full bg-[#fff8ea] px-3 py-1 text-sm font-extrabold underline">{e.nom}</a>
            ))}
          </div>
          <button type="button" onClick={() => nouvellePartie()} className="bouton-bois mt-4 w-full rounded-2xl py-4 font-display text-2xl">Rejouer</button>
        </div>
      ) : null}
    </section>
  );
}

// ---------- Le plus lourd ? ----------
const PESES = ESPECES.filter((e) => e.langue === "fr" && !e.disparue && aUnePhoto(e.id) && grammesDe(e.masse));

function questionPoids() {
  for (;;) {
    const [a, b] = melanger(PESES).slice(0, 2);
    const ga = grammesDe(a.masse)!;
    const gb = grammesDe(b.masse)!;
    // Au moins deux fois plus lourd : la réponse ne fait aucun doute.
    if (Math.max(ga, gb) / Math.min(ga, gb) >= 2) return { a, b, bon: ga > gb ? a.id : b.id };
  }
}

function JeuPoids() {
  const [q, setQ] = useState(questionPoids);
  const [rep, setRep] = useState<string | null>(null);
  return (
    <section className="mt-5">
      <p className="text-center text-lg">Touche l'animal le plus lourd, quand il est adulte.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[q.a, q.b].map((e) => {
          const juste = rep && e.id === q.bon;
          const faux = rep === e.id && e.id !== q.bon;
          return (
            <button key={e.id} type="button" onClick={() => { if (!rep) { setRep(e.id); noterReponse(e.id === q.bon); if (e.id === q.bon) sons.bonne(); else sons.mauvaise(); } }} className={`flex flex-col items-center rounded-3xl px-2 py-4 text-[#2a1c14] ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"}`}>
              <span className="medaillon block size-28 overflow-hidden"><Portrait id={e.id} /></span>
              <span className="mt-2 font-display text-xl leading-tight">{e.nom}</span>
              {rep ? <span className="mt-1 text-sm font-extrabold">{e.masse}</span> : null}
            </button>
          );
        })}
      </div>
      {rep ? (
        <>
          <p className="mt-4 text-center text-lg font-extrabold">{rep === q.bon ? "Bravo !" : "Raté, regarde les poids !"}</p>
          <button type="button" onClick={() => { setQ(questionPoids()); setRep(null); }} className="bouton-bois au-dessus-barre mt-4 w-full rounded-2xl py-4 font-display text-2xl">Une autre</button>
        </>
      ) : null}
    </section>
  );
}

// ---------- Qui vit ici ? ----------
const LOCALISES = ESPECES.filter((e) => e.langue === "fr" && !e.disparue && aUnePhoto(e.id) && e.pays && e.pays.length > 0 && e.pays.length <= 25);

function questionCarte() {
  for (;;) {
    const bon = LOCALISES[Math.floor(Math.random() * LOCALISES.length)];
    const ici = new Set(bon.pays);
    // Les autres choix ne vivent dans aucun des pays coloriés.
    const autres = melanger(LOCALISES.filter((e) => e.id !== bon.id && !e.pays!.some((p) => ici.has(p)))).slice(0, 2);
    if (autres.length === 2) return { bon, choix: melanger([bon, ...autres]) };
  }
}

function JeuCarte() {
  const [q, setQ] = useState(questionCarte);
  const [rep, setRep] = useState<string | null>(null);
  return (
    <section className="mt-5">
      <p className="text-center text-lg">Les pays en or montrent où vit un animal. Lequel ?</p>
      <div className="mt-3"><CarteMonde pays={q.bon.pays!} /></div>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {q.choix.map((e) => {
          const juste = rep && e.id === q.bon.id;
          const faux = rep === e.id && e.id !== q.bon.id;
          return (
            <li key={e.id}>
              <button type="button" onClick={() => { if (!rep) { setRep(e.id); noterReponse(e.id === q.bon.id); if (e.id === q.bon.id) sons.bonne(); else sons.mauvaise(); } }} className={`flex h-full w-full flex-col items-center rounded-3xl px-1 py-3 text-[#2a1c14] ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"}`}>
                <span className="medaillon block size-20 overflow-hidden"><Portrait id={e.id} /></span>
                <span className="mt-2 text-sm font-extrabold leading-tight">{e.nom}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rep ? (
        <>
          <p className="mt-4 text-center text-lg font-extrabold">{rep === q.bon.id ? "Bravo !" : `C'était ${q.bon.nom}.`}</p>
          <p className="text-center text-sm">{q.bon.ou}</p>
          <button type="button" onClick={() => { setQ(questionCarte()); setRep(null); }} className="bouton-bois au-dessus-barre mt-4 w-full rounded-2xl py-4 font-display text-2xl">Une autre</button>
        </>
      ) : null}
    </section>
  );
}

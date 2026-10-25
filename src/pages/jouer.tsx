import { useEffect, useState } from "react";
import type { Espece } from "@/data/catalogue";
import { lireVues } from "@/lib/carnet";
import { sons } from "@/lib/sons";
import { gagnerPaquet } from "@/lib/recompenses";
import { plumeReagit } from "@/lib/plume";
import { grammesDe } from "@/lib/poids";
import { CarteMonde } from "@/components/carte-monde";
import { CarteVerso } from "@/components/carte-animal";
import { ESPECES } from "@/data/catalogue";
import { REGIMES, type RegimeId } from "@/data/fiches-vie";
import { ETAPES, FRISE } from "@/data/arbre";
import { noterReponse } from "@/lib/carnet";
import { Entete, Titre } from "@/components/entete";
import { aujourdhui, lireDefis, noterDefi, serie } from "@/lib/defis";
import { Portrait, aUnePhoto } from "@/components/portrait";
import { Vignette } from "@/components/icone";
import { PAR_ID } from "@/data/catalogue";
import crisConnus from "@/data/cris.json";
import { LuChevronLeft, LuFlame } from "react-icons/lu";
import { useModeJeu } from "@/lib/mode-jeu";
import { revenir } from "@/lib/routeur";
import { PlumeDessin } from "@/components/plume-dessin";
import { ouvrirPlume, usePlume } from "@/lib/plume";
import { useIndice } from "@/lib/indice";
import { Bataille, LePlusRapide, MemoryPlusieurs, MimeAnimal, SeptFamilles } from "@/pages/jeux-plusieurs";

function melanger<T>(l: T[], rnd: () => number = Math.random) {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
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

type Jeu = "defi" | "regime" | "temps" | "memoire" | "bataille" | "rapide" | "mime" | "familles" | "poids" | "carte" | "cri";

const JEUX: { id: Jeu; nom: string; sous: string; niveau: 1 | 2 | 3; joueurs: string }[] = [
  { id: "defi", nom: "Le défi du jour", sous: "Cinq questions, chaque jour.", niveau: 1, joueurs: "Seule" },
  { id: "memoire", nom: "Mémory", sous: "Retrouve les paires d'animaux.", niveau: 1, joueurs: "1 à 4" },
  { id: "bataille", nom: "La bataille des animaux", sous: "Le plus gros chiffre gagne les cartes.", niveau: 2, joueurs: "2 à 4" },
  { id: "rapide", nom: "Le plus rapide", sous: "Face à face : le premier qui touche le bon animal.", niveau: 1, joueurs: "2 à 4" },
  { id: "mime", nom: "Mime l'animal", sous: "Mime un animal, les autres devinent.", niveau: 1, joueurs: "2 et plus" },
  { id: "familles", nom: "Les 7 familles", sous: "Réunis des familles d'animaux complètes.", niveau: 3, joueurs: "2 à 4" },
  { id: "cri", nom: "Devine qui crie", sous: "De vrais cris d'animaux.", niveau: 1, joueurs: "Seule" },
  { id: "poids", nom: "Le plus lourd ?", sous: "Lequel pèse le plus ?", niveau: 1, joueurs: "Seule" },
  { id: "carte", nom: "Qui vit ici ?", sous: "Les pays en or sur la carte.", niveau: 2, joueurs: "Seule" },
  { id: "regime", nom: "Qu'est-ce qu'il mange ?", sous: "Viande, plantes, insectes…", niveau: 1, joueurs: "Seule" },
  { id: "temps", nom: "Qui est arrivé en premier ?", sous: "Dans l'histoire de la vie.", niveau: 2, joueurs: "Seule" },
];

export function JouerPage({ params }: { params: URLSearchParams }) {
  const jeu = params.get("jeu") as Jeu | null;
  const choisi = JEUX.find((j) => j.id === jeu);
  if (!choisi) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-4">
        <Entete siVide="/" />
        <Titre sous="Touche un jeu pour commencer.">Jouer</Titre>
        <ul className="mt-4 space-y-2">
          {JEUX.map((j) => (
            <li key={j.id}>
              <a href={`#/jouer?jeu=${j.id}`} className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3 text-[#2a1c14]">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl leading-tight">{j.nom}</span>
                  <span className="block text-sm">{j.sous}</span>
                </span>
                <span className="shrink-0 text-right text-xs font-black">
                  <span className="block text-[#d6a531]">{"★".repeat(j.niveau)}<span className="text-[#cdb89a]">{"★".repeat(3 - j.niveau)}</span></span>
                  <span className="block">{j.joueurs}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  return (
    <ModeJeu titre={choisi.nom} jeu={jeu}>
      {jeu === "defi" ? <DefiDuJour /> : jeu === "cri" ? <JeuCri /> : jeu === "memoire" ? <MemoryPlusieurs /> : jeu === "bataille" ? <Bataille /> : jeu === "rapide" ? <LePlusRapide /> : jeu === "mime" ? <MimeAnimal /> : jeu === "familles" ? <SeptFamilles /> : jeu === "poids" ? <JeuPoids /> : jeu === "carte" ? <JeuCarte /> : jeu === "regime" ? <JeuRegime /> : <JeuTemps />}
    </ModeJeu>
  );
}

/** Le jeu prend tout l'écran : seulement un petit bandeau en haut, avec Plume et Retour. */
function ModeJeu({ titre, jeu, children }: { titre: string; jeu: string; children: React.ReactNode }) {
  useModeJeu();
  // Plume fait les gestes du jeu : en garde pour la bataille, elle applaudit pour les autres, et saute de joie à la fin.
  const { presence, fete } = usePlume();
  const [bravo, setBravo] = useState(false);
  useEffect(() => {
    if (!fete) return;
    setBravo(true);
    const t = window.setTimeout(() => setBravo(false), 3200);
    return () => window.clearTimeout(t);
  }, [fete]);
  const caractere = ({ discrete: 1, presente: 2, etudiante: 3, passionnee: 4, repos: 0 } as const)[presence] ?? 0;
  return (
    <main className="mx-auto max-w-xl px-3 pt-2">
      <header className="sticky top-0 z-30 -mx-3 flex items-center gap-2 bg-[#120c2c]/90 px-3 py-1.5 backdrop-blur">
        <button type="button" onClick={() => ouvrirPlume(true, "page")} aria-label="Plume : aide" className="size-11 shrink-0">
          <PlumeDessin className="size-full" caractere={caractere} anim={bravo ? "bravo" : presence === "discrete" || presence === "repos" ? "rien" : jeu === "bataille" ? "bataille" : "jeu"} />
        </button>
        <p className="min-w-0 flex-1 truncate font-display text-lg text-[#f3d48a]">{titre}</p>
        <button type="button" onClick={() => revenir("/jouer")} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-card px-3.5 text-sm font-extrabold text-[#2a1c14]">
          <LuChevronLeft className="size-5" aria-hidden="true" /> Retour
        </button>
      </header>
      {children}
    </main>
  );
}

function JeuRegime() {
  const [q, setQ] = useState(questionRegime);
  const [rep, setRep] = useState<RegimeId | null>(null);
  const effaces = useIndice(q.e.id, q.choix, q.bon, rep !== null);
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
              <button type="button" disabled={!rep && effaces.has(id)} onClick={() => { if (!rep) { setRep(id); noterReponse(id === q.bon); if (id === q.bon) sons.bonne(); else sons.mauvaise(); } }} className={`w-full rounded-2xl px-4 py-4 text-left text-[#2a1c14] transition-opacity ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"} ${!rep && effaces.has(id) ? "opacity-25" : ""}`}>
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
        window.setTimeout(() => plumeReagit("memoire"), 600);
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
  const effaces = useIndice(q.bon.id, q.choix.map((e) => e.id), q.bon.id, rep !== null);
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
              <button type="button" disabled={!rep && effaces.has(e.id)} onClick={() => { if (!rep) { setRep(e.id); noterReponse(e.id === q.bon.id); if (e.id === q.bon.id) sons.bonne(); else sons.mauvaise(); } }} className={`flex h-full w-full flex-col items-center rounded-3xl px-1 py-3 text-[#2a1c14] transition-opacity ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"} ${!rep && effaces.has(e.id) ? "opacity-25" : ""}`}>
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

// ---------- Devine qui crie ----------
// Seulement les vrais cris enregistrés (licence libre). Jamais de son fabriqué.
const CRIEURS = (crisConnus as string[]).map((id) => PAR_ID.get(id)).filter((e): e is Espece => !!e && e.langue === "fr" && aUnePhoto(e.id));

function questionCri(rnd: () => number = Math.random) {
  const [bon, ...autres] = melanger(CRIEURS, rnd).slice(0, 3);
  return { bon, choix: melanger([bon, ...autres], rnd) };
}

function JeuCri() {
  if (CRIEURS.length < 3) {
    return (
      <section className="carte-nuit mt-5 rounded-3xl px-4 py-5 text-center">
        <p className="font-display text-2xl text-[#f3d48a]">Bientôt !</p>
        <p className="mt-2">On cherche encore les vrais cris des animaux. Ce jeu s'ouvrira quand on en aura assez.</p>
      </section>
    );
  }
  return <QuestionCri key="cri" />;
}

function QuestionCri() {
  const [q, setQ] = useState(() => questionCri());
  const [rep, setRep] = useState<string | null>(null);
  const effaces = useIndice(q.bon.id, q.choix.map((e) => e.id), q.bon.id, rep !== null);
  return (
    <section className="mt-5 text-center">
      <p className="text-lg">Écoute bien. Quel animal fait ce bruit ?</p>
      <audio key={q.bon.id} controls preload="auto" src={`s/${q.bon.id}.mp3`} className="mx-auto mt-3 w-full max-w-sm" />
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {q.choix.map((e) => {
          const juste = rep && e.id === q.bon.id;
          const faux = rep === e.id && e.id !== q.bon.id;
          return (
            <li key={e.id}>
              <button type="button" disabled={!rep && effaces.has(e.id)} onClick={() => { if (!rep) { setRep(e.id); noterReponse(e.id === q.bon.id); if (e.id === q.bon.id) sons.bonne(); else sons.mauvaise(); } }} className={`flex h-full w-full flex-col items-center rounded-3xl px-1 py-3 text-[#2a1c14] transition-opacity ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"} ${!rep && effaces.has(e.id) ? "opacity-25" : ""}`}>
                <span className="medaillon block size-20 overflow-hidden"><Portrait id={e.id} /></span>
                <span className="mt-2 text-sm font-extrabold leading-tight">{e.nom}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rep ? (
        <>
          <p className="mt-4 text-lg font-extrabold">{rep === q.bon.id ? "Bravo !" : `C'était ${q.bon.nom}.`}</p>
          <button type="button" onClick={() => { setQ(questionCri()); setRep(null); }} className="bouton-bois au-dessus-barre mt-4 w-full rounded-2xl py-4 font-display text-2xl">Un autre cri</button>
        </>
      ) : null}
    </section>
  );
}

// ---------- Défi du jour ----------
// Cinq questions, les mêmes pour toute la journée. Une série compte les jours réussis d'affilée.
function hasard(graine: string) {
  let h = 1779033703;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 3432918353) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

type QDefi = { consigne: string; audio?: string; carte?: string[]; choix: { id: string; nom: string; detail?: string }[]; bon: string; apres: string };

function questionsDuJour(): QDefi[] {
  const rnd = hasard(aujourdhui());
  const types = melanger(["poids", "carte", "regime", "poids", "carte", ...(CRIEURS.length >= 3 ? ["cri", "cri"] : ["regime"])], rnd).slice(0, 5);
  return types.map((t) => {
    if (t === "cri") {
      const q = questionCri(rnd);
      return { consigne: "Quel animal fait ce bruit ?", audio: q.bon.id, choix: q.choix.map((e) => ({ id: e.id, nom: e.nom })), bon: q.bon.id, apres: `C'est ${q.bon.nom}.` };
    }
    if (t === "carte") {
      for (;;) {
        const bon = LOCALISES[Math.floor(rnd() * LOCALISES.length)];
        const ici = new Set(bon.pays);
        const autres = melanger(LOCALISES.filter((e) => e.id !== bon.id && !e.pays!.some((p) => ici.has(p))), rnd).slice(0, 2);
        if (autres.length === 2) {
          const choix = melanger([bon, ...autres], rnd);
          return { consigne: "Qui vit dans les pays en or ?", carte: bon.pays, choix: choix.map((e) => ({ id: e.id, nom: e.nom })), bon: bon.id, apres: `C'est ${bon.nom}. ${bon.ou}` };
        }
      }
    }
    if (t === "regime") {
      const e = POOL[Math.floor(rnd() * POOL.length)];
      const bon = e.regime as RegimeId;
      const autres = melanger((Object.keys(REGIMES) as RegimeId[]).filter((r) => r !== bon), rnd).slice(0, 2);
      return { consigne: `${e.nom} mange surtout…`, carte: undefined, choix: melanger([bon, ...autres], rnd).map((r) => ({ id: r, nom: REGIMES[r].nom, detail: REGIMES[r].explique })), bon, apres: `${e.nom} est ${REGIMES[bon].nom.toLowerCase()}.`, audio: undefined, ...{ portrait: e.id } };
    }
    for (;;) {
      const [a, b] = melanger(PESES, rnd).slice(0, 2);
      const ga = grammesDe(a.masse)!;
      const gb = grammesDe(b.masse)!;
      if (Math.max(ga, gb) / Math.min(ga, gb) >= 2) {
        return { consigne: "Lequel est le plus lourd, adulte ?", choix: [a, b].map((e) => ({ id: e.id, nom: e.nom, detail: e.masse })), bon: ga > gb ? a.id : b.id, apres: `${a.nom} : ${a.masse}. ${b.nom} : ${b.masse}.` };
      }
    }
  });
}

function DefiDuJour() {
  const [defis, setDefis] = useState(lireDefis);
  const [questions] = useState(questionsDuJour);
  const [i, setI] = useState(0);
  const [rep, setRep] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const fait = defis[aujourdhui()];
  const n = serie(defis);
  const enCours = questions[i];
  const effaces = useIndice(`defi-${i}`, enCours ? enCours.choix.map((c) => c.id) : [], enCours?.bon ?? "", rep !== null || !enCours || (fait !== undefined && i === 0));

  if (fait !== undefined && i === 0 && !rep) {
    return (
      <section className="mt-5 text-center">
        <SerieFlamme n={n} />
        <p className="titre-or mt-3 text-3xl">Défi réussi aujourd'hui !</p>
        <p className="mt-1">Tu as eu {fait} bonne{fait > 1 ? "s" : ""} réponse{fait > 1 ? "s" : ""} sur 5. Reviens demain pour un nouveau défi.</p>
      </section>
    );
  }

  const q = questions[i];
  const fin = i >= questions.length;
  if (fin) {
    return (
      <section className="arrivee mt-5 text-center">
        <SerieFlamme n={n} />
        <p className="titre-or mt-3 text-3xl">{score >= 4 ? "Bravo !" : "Défi terminé !"}</p>
        <p className="mt-1">{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""} sur 5. Un paquet de cartes t'attend !</p>
      </section>
    );
  }

  function choisir(id: string) {
    if (rep) return;
    setRep(id);
    const bonne = id === q.bon;
    noterReponse(bonne);
    if (bonne) {
      sons.bonne();
      setScore((x) => x + 1);
    } else sons.mauvaise();
  }

  function suivante() {
    if (i + 1 >= questions.length) {
      const total = score;
      setDefis(noterDefi(total));
      sons.victoire();
      window.setTimeout(() => gagnerPaquet("Défi du jour terminé"), 900);
    }
    setI(i + 1);
    setRep(null);
  }

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <SerieFlamme n={n} petite />
        <p className="font-extrabold text-[#f0d090]">Question {i + 1} sur 5</p>
      </div>
      <p className="titre-or mt-3 text-center text-2xl">{q.consigne}</p>
      {q.audio ? <audio key={q.audio} controls preload="auto" src={`s/${q.audio}.mp3`} className="mx-auto mt-3 w-full max-w-sm" /> : null}
      {q.carte ? <div className="mt-3"><CarteMonde pays={q.carte} /></div> : null}
      {"portrait" in q ? <span className="medaillon-or mx-auto mt-3 block size-28 overflow-hidden"><Portrait id={(q as { portrait: string }).portrait} /></span> : null}
      <ul className={`mt-4 grid gap-2 ${q.choix.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
        {q.choix.map((c) => {
          const juste = rep && c.id === q.bon;
          const faux = rep === c.id && c.id !== q.bon;
          const animal = PAR_ID.get(c.id);
          return (
            <li key={c.id}>
              <button type="button" disabled={!rep && effaces.has(c.id)} onClick={() => choisir(c.id)} className={`flex h-full w-full items-center gap-3 rounded-3xl px-3 py-3 text-left text-[#2a1c14] transition-opacity ${juste ? "bg-[#d9f0c8]" : faux ? "bg-[#f3c7c7]" : "bg-card"} ${q.choix.length === 2 ? "flex-col text-center" : ""} ${!rep && effaces.has(c.id) ? "opacity-25" : ""}`}>
                {animal ? <span className="medaillon block size-16 shrink-0 overflow-hidden"><Portrait id={animal.id} /></span> : null}
                <span>
                  <span className="block font-display text-xl leading-tight">{c.nom}</span>
                  {c.detail && (rep || !animal) ? <span className="block text-sm">{c.detail}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {rep ? (
        <>
          <p className="mt-3 text-center font-extrabold">{rep === q.bon ? "Bravo !" : "Pas tout à fait."} {q.apres}</p>
          <button type="button" onClick={suivante} className="bouton-bois mt-4 w-full rounded-2xl py-4 font-display text-2xl">
            {i + 1 >= questions.length ? "Voir mon résultat" : "Question suivante"}
          </button>
        </>
      ) : null}
    </section>
  );
}

function SerieFlamme({ n, petite = false }: { n: number; petite?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#2a1650] font-extrabold text-[#ffb35c] ${petite ? "px-3 py-1 text-sm" : "px-4 py-2 text-lg"}`}>
      <LuFlame className={petite ? "size-4" : "size-6"} aria-hidden="true" />
      {n} jour{n > 1 ? "s" : ""} d'affilée
    </span>
  );
}

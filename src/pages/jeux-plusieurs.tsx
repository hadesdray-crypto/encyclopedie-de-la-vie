import { useEffect, useMemo, useState } from "react";
import type { Explication } from "@/data/guide";
import { Portrait } from "@/components/portrait";
import { CarteVerso } from "@/components/carte-animal";
import { BoutonRegles, Choix, Preparation, Table, useAnnonceTour, vainqueur, type Mode } from "@/components/table";
import { CARACS, PAQUETS_MEMORY, lireJoueurs, melanger, paquetBataille, type CarteBataille, type CarteImage, type Joueur } from "@/lib/partie";
import { sons } from "@/lib/sons";
import { gagnerPaquet } from "@/lib/recompenses";
import { plumeDit } from "@/lib/plume";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";
import { PAR_ID, type Espece } from "@/data/catalogue";
import { useQuitterPartie } from "@/lib/mode-jeu";
import { useCallback } from "react";

// ---------------------------------------------------------------- les règles, que Plume explique

export const REGLES_MEMORY: Explication = {
  id: "regles-memory",
  titre: "Les règles du mémory",
  etapes: [
    "Toutes les cartes sont retournées. Chaque animal est caché deux fois.",
    "À ton tour, retourne deux cartes. Si c'est le même animal, tu gagnes la paire et tu rejoues.",
    "Sinon, les cartes se retournent, et c'est au joueur suivant. Essaie de retenir où sont les animaux !",
    "Quand toutes les paires sont trouvées, celui qui en a le plus gagne. En équipes, on additionne les paires de l'équipe.",
  ],
};

export const REGLES_BATAILLE: Explication = {
  id: "regles-bataille",
  titre: "Les règles de la bataille",
  etapes: [
    "Chaque joueur reçoit le même nombre de cartes d'animaux. On ne regarde que la carte du dessus.",
    "À ton tour, choisis un chiffre de ta carte : le poids, la longévité, les petits, la gestation ou le nombre de pays.",
    "Tout le monde montre sa carte. Le plus gros chiffre gagne toutes les cartes du tour, et c'est lui qui choisit au tour suivant.",
    "En cas d'égalité, les cartes restent au milieu : le gagnant du tour suivant les prendra.",
    "Si tu n'as plus de cartes, tu as perdu. La partie s'arrête quand il ne reste qu'un joueur, ou au bout de 20 tours : celui qui a le plus de cartes gagne.",
  ],
};

function Vignette({ c }: { c: CarteImage }) {
  return c.photo ? <img src={c.photo} alt="" className="size-full object-cover" /> : <Portrait id={c.espece!} />;
}

// ---------------------------------------------------------------- mémory (1 à 4 joueurs)

const PAIRES = [6, 8, 10, 12, 15];

export function MemoryPlusieurs() {
  const [joueurs, setJoueurs] = useState<Joueur[]>(lireJoueurs);
  const [mode, setMode] = useState<Mode>("chacun");
  const [faceAFace, setFaceAFace] = useState(false);
  const [paquet, setPaquet] = useState("collection");
  const [paires, setPaires] = useState(8);
  const [partie, setPartie] = useState<{ cases: { cle: number; c: CarteImage }[] } | null>(null);
  const [ouvertes, setOuvertes] = useState<number[]>([]);
  const [trouvees, setTrouvees] = useState<Map<string, number>>(new Map());
  const [tour, setTour] = useState(0);
  const [bloque, setBloque] = useState(false);
  const [note, setNote] = useState("");

  useAnnonceTour(joueurs[tour], `${tour}-${partie ? 1 : 0}`, !!partie && joueurs.length > 1);
  const arreter = useCallback(() => setPartie(null), []);
  useQuitterPartie(!!partie, arreter);

  function commencer() {
    let source = PAQUETS_MEMORY.find((p) => p.id === paquet)!.cartes();
    let info = "";
    if (source.length < paires) {
      info = `Pas assez d'animaux dans « ${PAQUETS_MEMORY.find((p) => p.id === paquet)!.nom} » : on complète avec d'autres mammifères.`;
      const ids = new Set(source.map((c) => c.id));
      source = [...source, ...melanger(PAQUETS_MEMORY[1].cartes().filter((c) => !ids.has(c.id)))];
    }
    const choisis = melanger(source).slice(0, paires);
    setPartie({ cases: melanger(choisis.flatMap((c, i) => [{ cle: i * 2, c }, { cle: i * 2 + 1, c }])) });
    setOuvertes([]);
    setTrouvees(new Map());
    setTour(0);
    setBloque(false);
    setNote(info);
  }

  if (!partie) {
    return (
      <>
        <div className="mt-3 flex justify-center"><BoutonRegles regles={REGLES_MEMORY} /></div>
        <Preparation joueurs={joueurs} setJoueurs={setJoueurs} mode={mode} setMode={setMode} faceAFace={faceAFace} setFaceAFace={setFaceAFace} onJouer={commencer}>
          <div>
            <p className="px-1 text-sm font-black text-[#f0d090]">Avec quelles cartes ?</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {PAQUETS_MEMORY.map((p) => <Choix key={p.id} actif={paquet === p.id} onClick={() => setPaquet(p.id)}>{p.nom}</Choix>)}
            </div>
          </div>
          <div>
            <p className="px-1 text-sm font-black text-[#f0d090]">Combien de paires ?</p>
            <div className="mt-1.5 grid grid-cols-5 gap-1.5">
              {PAIRES.map((n) => <Choix key={n} actif={paires === n} onClick={() => setPaires(n)}>{n}<span className="block text-[10px]">{n * 2} cartes</span></Choix>)}
            </div>
          </div>
        </Preparation>
      </>
    );
  }

  const cases = partie.cases;
  const fini = trouvees.size === cases.length / 2;
  const points = joueurs.map((_, i) => [...trouvees.values()].filter((v) => v === i).length);

  function toucher(i: number) {
    if (bloque || fini || ouvertes.includes(i) || trouvees.has(cases[i].c.id)) return;
    sons.retourner();
    const suite = [...ouvertes, i];
    setOuvertes(suite);
    if (suite.length < 2) return;
    const [a, b] = suite;
    if (cases[a].c.id === cases[b].c.id) {
      const t = new Map(trouvees).set(cases[a].c.id, tour);
      setTrouvees(t);
      setOuvertes([]);
      window.setTimeout(() => sons.bonne(), 200);
      if (t.size === cases.length / 2) {
        window.setTimeout(() => sons.victoire(), 400);
        window.setTimeout(() => gagnerPaquet("Mémory réussi"), 1500);
      }
    } else {
      setBloque(true);
      window.setTimeout(() => {
        setOuvertes([]);
        setBloque(false);
        setTour((x) => (x + 1) % joueurs.length);
      }, 1100);
    }
  }

  const colonnes = paires <= 6 ? "grid-cols-4" : paires <= 10 ? "grid-cols-5" : "grid-cols-6";
  const plateau = (
    <>
      {note ? <p className="mb-1 text-center text-xs texte-doux">{note}</p> : null}
      <ul className={`grid ${colonnes} gap-1`}>
        {cases.map((k, i) => {
          const visible = ouvertes.includes(i) || trouvees.has(k.c.id);
          const qui = trouvees.get(k.c.id);
          return (
            <li key={k.cle}>
              <button type="button" onClick={() => toucher(i)} className={`retournable block aspect-[3/4] w-full ${visible ? "retourne" : ""}`} aria-label={visible ? k.c.nom : "Carte cachée"}>
                <span className="retournable-interieur block">
                  <span className="face block"><CarteVerso /></span>
                  <span className="face face-recto flex flex-col overflow-hidden rounded-xl bg-card p-0.5" style={qui !== undefined ? { boxShadow: `0 0 0 3px ${joueurs[qui].couleur}` } : undefined}>
                    <span className="block min-h-0 flex-1 overflow-hidden rounded-lg"><Vignette c={k.c} /></span>
                    <span className="line-clamp-2 text-center text-[9px] font-extrabold leading-tight text-[#2a1c14]">{k.c.nom}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {fini ? <Fin texte={joueurs.length > 1 ? vainqueur(joueurs, points, mode).texte : "Bravo, toutes les paires !"} onRejouer={commencer} onReglages={() => setPartie(null)} /> : null}
    </>
  );

  return (
    <Table
      joueurs={joueurs}
      actif={fini ? null : tour}
      faceAFace={faceAFace}
      onQuitter={() => setPartie(null)}
      centre={plateau}
      zone={(i) => <p className="text-sm font-black text-white">{points[i]} paire{points[i] > 1 ? "s" : ""}</p>}
    />
  );
}

function Fin({ texte, onRejouer, onReglages }: { texte: string; onRejouer: () => void; onReglages: () => void }) {
  useEffect(() => {
    plumeDit(texte, 4000);
    if (voixPossible()) dire(texte);
  }, []);
  return (
    <div className="arrivee mt-3 rounded-3xl bg-card px-4 py-4 text-center text-[#2a1c14]">
      <p className="font-display text-2xl">{texte}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onRejouer} className="bouton-bois rounded-2xl py-3 font-extrabold">Rejouer</button>
        <button type="button" onClick={onReglages} className="rounded-2xl bg-[#f3e2c2] py-3 font-extrabold">Changer les joueurs</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- la bataille des animaux (2 à 4 joueurs)

type EtatBataille = { mains: CarteBataille[][]; pot: CarteBataille[]; tour: number; manche: number; duel: { carac: string; cartes: (CarteBataille | null)[]; gagnant: number | null } | null };

const MAX_MANCHES = 20;

export function Bataille() {
  const [joueurs, setJoueurs] = useState<Joueur[]>(() => {
    const j = lireJoueurs();
    return j.length >= 2 ? j : [...j, { nom: "Joueur 2", couleur: "#2f5fa8", equipe: 1 }];
  });
  const [mode, setMode] = useState<Mode>("chacun");
  const [faceAFace, setFaceAFace] = useState(false);
  const [source, setSource] = useState<"collection" | "tous">("collection");
  const [parJoueur, setParJoueur] = useState(8);
  const [e, setE] = useState<EtatBataille | null>(null);
  const [note, setNote] = useState("");

  useAnnonceTour(joueurs[e?.tour ?? 0], `${e?.tour}-${e?.manche}`, !!e && !e.duel);
  const arreter = useCallback(() => setE(null), []);
  useQuitterPartie(!!e, arreter);

  function commencer() {
    let paquet = paquetBataille(source);
    let info = "";
    const besoin = parJoueur * joueurs.length;
    if (paquet.length < besoin) {
      if (source === "collection") info = "Pas encore assez de cartes dans ta collection : on prend aussi d'autres mammifères.";
      const ids = new Set(paquet.map((c) => c.id));
      paquet = [...paquet, ...melanger(paquetBataille("tous").filter((c) => !ids.has(c.id)))];
    }
    const tirees = melanger(paquet).slice(0, besoin);
    setE({ mains: joueurs.map((_, i) => tirees.slice(i * parJoueur, (i + 1) * parJoueur)), pot: [], tour: 0, manche: 1, duel: null });
    setNote(info);
  }

  if (!e) {
    return (
      <>
        <div className="mt-3 flex justify-center"><BoutonRegles regles={REGLES_BATAILLE} /></div>
        <Preparation joueurs={joueurs} setJoueurs={setJoueurs} min={2} mode={mode} setMode={setMode} faceAFace={faceAFace} setFaceAFace={setFaceAFace} onJouer={commencer}>
          <div>
            <p className="px-1 text-sm font-black text-[#f0d090]">Avec quelles cartes ?</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <Choix actif={source === "collection"} onClick={() => setSource("collection")}>Ma collection</Choix>
              <Choix actif={source === "tous"} onClick={() => setSource("tous")}>Tous les mammifères</Choix>
            </div>
            <p className="mt-1 px-1 text-xs texte-doux">Seulement les animaux dont on connaît les cinq chiffres : on n'invente rien.</p>
          </div>
          <div>
            <p className="px-1 text-sm font-black text-[#f0d090]">Combien de cartes chacun ?</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {[5, 8, 12].map((n) => <Choix key={n} actif={parJoueur === n} onClick={() => setParJoueur(n)}>{n} cartes{n === 5 ? " · court" : n === 12 ? " · long" : ""}</Choix>)}
            </div>
          </div>
        </Preparation>
      </>
    );
  }

  const vivants = e.mains.map((m) => m.length > 0);
  const restants = vivants.filter(Boolean).length;
  const fini = !e.duel && (restants <= 1 || e.manche > MAX_MANCHES);
  const points = e.mains.map((m) => m.length);

  function choisir(carac: string) {
    if (!e || e.duel) return;
    const cartes = e.mains.map((m) => m[0] ?? null);
    const valeurs = cartes.map((c) => (c ? c.caracs.find((x) => x.id === carac)!.valeur : -1));
    const max = Math.max(...valeurs);
    const gagnants = valeurs.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
    const gagnant = gagnants.length === 1 ? gagnants[0] : null;
    setE({ ...e, duel: { carac, cartes, gagnant } });
    sons.retourner();
    const nom = CARACS.find((c) => c.id === carac)!.nom.toLowerCase();
    const phrase = gagnant === null ? `Égalité sur ${nom} ! Les cartes restent au milieu.` : `${joueurs[gagnant].nom} gagne avec ${cartes[gagnant]!.nom}.`;
    window.setTimeout(() => {
      if (gagnant !== null) sons.bonne();
      plumeDit(phrase, 3000);
    }, 500);
  }

  function suite() {
    if (!e?.duel) return;
    const { cartes, gagnant } = e.duel;
    const jouees = cartes.filter((c): c is CarteBataille => !!c);
    const mains = e.mains.map((m) => m.slice(1));
    let pot = [...e.pot, ...jouees];
    let tour = e.tour;
    if (gagnant !== null) {
      mains[gagnant] = [...mains[gagnant], ...melanger(pot)];
      pot = [];
      tour = gagnant;
    }
    // Si le joueur qui doit choisir n'a plus de cartes, on passe au suivant qui en a.
    for (let k = 0; k < joueurs.length && !mains[tour].length; k++) tour = (tour + 1) % joueurs.length;
    setE({ mains, pot, tour, manche: e.manche + 1, duel: null });
  }

  const duel = e.duel;
  const centre = fini ? (
    <Fin texte={vainqueur(joueurs, points, mode).texte} onRejouer={commencer} onReglages={() => setE(null)} />
  ) : duel ? (
    <div className="text-center">
      <p className="font-display text-2xl text-[#f3d48a]">{CARACS.find((c) => c.id === duel.carac)!.nom} !</p>
      {!faceAFace ? (
        <div className={`mt-2 grid gap-2 ${joueurs.length > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {duel.cartes.map((c, i) => (c ? <PetiteCarte key={i} c={c} joueur={joueurs[i]} carac={duel.carac} gagne={duel.gagnant === i} /> : null))}
        </div>
      ) : null}
      <p className="mt-2 font-display text-xl text-white">{duel.gagnant === null ? "Égalité !" : `${joueurs[duel.gagnant].nom} gagne les cartes !`}</p>
      <button type="button" onClick={suite} className="bouton-bois mt-2 rounded-full px-6 py-2.5 font-extrabold">Tour suivant</button>
    </div>
  ) : (
    <div className="text-center text-sm">
      <p className="font-extrabold text-[#f0d090]">Tour {e.manche} sur {MAX_MANCHES}{e.pot.length ? ` · ${e.pot.length} carte${e.pot.length > 1 ? "s" : ""} au milieu` : ""}</p>
      {note ? <p className="mt-1 text-xs texte-doux">{note}</p> : null}
      {faceAFace ? <p className="mt-2">{joueurs[e.tour].nom} choisit un chiffre sur sa carte.</p> : null}
    </div>
  );

  return (
    <Table
      joueurs={joueurs}
      actif={fini ? null : duel ? duel.gagnant : e.tour}
      faceAFace={faceAFace}
      onQuitter={() => setE(null)}
      centre={centre}
      zone={(i) => {
        const main = e.mains[i];
        if (fini) return <p className="text-sm font-black text-white">{points[i]} cartes</p>;
        if (!main.length) return <p className="text-sm font-black text-white/80">Plus de cartes</p>;
        if (duel) return faceAFace ? <PetiteCarte c={duel.cartes[i]!} joueur={joueurs[i]} carac={duel.carac} gagne={duel.gagnant === i} compacte /> : null;
        // En face à face, chacun voit sa carte ; sinon, seulement le joueur dont c'est le tour.
        if (!faceAFace && i !== e.tour) return null;
        return <GrandeCarte c={main[0]} reste={main.length} choisir={i === e.tour ? choisir : undefined} compacte={faceAFace} />;
      }}
    />
  );
}

function GrandeCarte({ c, reste, choisir, compacte = false }: { c: CarteBataille; reste: number; choisir?: (id: string) => void; compacte?: boolean }) {
  return (
    <div className={`mx-auto w-full rounded-2xl bg-[linear-gradient(160deg,#fff1b8,#d6a531_55%,#fbe08a)] text-[#2a1c14] shadow-[0_10px_24px_rgba(0,0,0,.5)] ${compacte ? "flex max-w-md gap-1.5 p-1" : "max-w-xs p-2"}`}>
      <div className={compacte ? "w-[34%] shrink-0" : ""}>
        <div className={`overflow-hidden rounded-xl ${compacte ? "aspect-square" : "h-36"}`}><Portrait id={c.espece} /></div>
        <p className={`text-center font-display leading-tight ${compacte ? "text-sm" : "mt-1 text-2xl"}`}>{c.nom}</p>
        {!compacte ? <p className="text-center text-[11px] font-extrabold">{reste} carte{reste > 1 ? "s" : ""} dans ta main</p> : null}
      </div>
      <div className={`flex-1 ${compacte ? "space-y-0.5" : "mt-1 space-y-1"}`}>
        {c.caracs.map((x) => (
          <button
            key={x.id}
            type="button"
            disabled={!choisir}
            onClick={() => choisir?.(x.id)}
            className={`flex w-full items-center justify-between rounded-lg bg-[#fff8ea] font-extrabold ${compacte ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-2 text-sm"} ${choisir ? "ring-2 ring-[#6a3fc0]/40 active:bg-[#efe3ff]" : ""}`}
          >
            <span>{x.nom}</span>
            <span className="font-display">{x.texte}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PetiteCarte({ c, joueur, carac, gagne, compacte = false }: { c: CarteBataille; joueur: Joueur; carac: string; gagne: boolean; compacte?: boolean }) {
  const v = c.caracs.find((x) => x.id === carac)!;
  return (
    <div className={`arrivee mx-auto rounded-2xl bg-[linear-gradient(160deg,#fff1b8,#d6a531_55%,#fbe08a)] text-center text-[#2a1c14] ${compacte ? "flex w-full max-w-xs items-center gap-2 p-1" : "p-1.5"}`} style={{ boxShadow: gagne ? "0 0 0 4px #9be08a, 0 0 24px 6px rgba(155,224,138,.6)" : "none", opacity: gagne ? 1 : 0.85 }}>
      {!compacte ? <p className="text-xs font-black" style={{ color: joueur.couleur }}>{joueur.nom}</p> : null}
      <div className={`overflow-hidden rounded-xl ${compacte ? "size-14 shrink-0" : "h-24"}`}><Portrait id={c.espece} /></div>
      <div className={compacte ? "text-left" : ""}>
        <p className="font-display text-base leading-tight">{c.nom}</p>
        <p className="font-display text-2xl">{v.texte}</p>
      </div>
    </div>
  );
}

/** Pour l'aide de Plume : combien de cartes de bataille existent. */
export function useNombreCartes() {
  return useMemo(() => paquetBataille("tous").length, []);
}

// ---------------------------------------------------------------- le plus rapide (2 à 4, face à face)

export const REGLES_RAPIDE: Explication = {
  id: "regles-rapide",
  titre: "Les règles du plus rapide",
  etapes: [
    "Posez le téléphone à plat : chacun a son côté de l'écran, avec les mêmes trois animaux.",
    "Une consigne apparaît, par exemple « Touche le plus lourd ! ». Le premier qui touche le bon animal gagne un point.",
    "Attention : si tu te trompes, tu ne peux plus jouer pendant ce tour !",
    "Après dix tours, celui qui a le plus de points gagne. Tous les chiffres sont vrais.",
  ],
};

const CONSIGNES: { carac: string; texte: string }[] = [
  { carac: "poids", texte: "Touche le plus lourd !" },
  { carac: "vie", texte: "Touche celui qui peut vivre le plus longtemps !" },
  { carac: "portee", texte: "Touche celui qui a le plus de petits à la fois !" },
  { carac: "pays", texte: "Touche celui qui vit dans le plus de pays !" },
  { carac: "gestation", texte: "Touche celui qui porte son bébé le plus longtemps !" },
];
const TOURS_RAPIDE = 10;

function questionRapide() {
  const pool = paquetBataille("tous");
  for (;;) {
    const c = CONSIGNES[Math.floor(Math.random() * CONSIGNES.length)];
    const trois = melanger(pool).slice(0, 3);
    const v = trois.map((x) => x.caracs.find((k) => k.id === c.carac)!.valeur).sort((a, b) => b - a);
    // La réponse doit être claire : le premier dépasse nettement le deuxième.
    if (v[0] >= v[1] * 1.4) {
      const bon = trois.find((x) => x.caracs.find((k) => k.id === c.carac)!.valeur === v[0])!;
      return { consigne: c, trois, bon: bon.id };
    }
  }
}

export function LePlusRapide() {
  const [joueurs, setJoueurs] = useState<Joueur[]>(() => {
    const j = lireJoueurs();
    return j.length >= 2 ? j : [...j, { nom: "Joueur 2", couleur: "#2f5fa8", equipe: 1 }];
  });
  const [mode, setMode] = useState<Mode>("chacun");
  const [enCours, setEnCours] = useState(false);
  const [n, setN] = useState(1);
  const [q, setQ] = useState(questionRapide);
  const [points, setPoints] = useState<number[]>([]);
  const [bloques, setBloques] = useState<Set<number>>(new Set());
  const [gagnant, setGagnant] = useState<number | null | undefined>(undefined);
  const arreter = useCallback(() => setEnCours(false), []);
  useQuitterPartie(enCours, arreter);

  function commencer() {
    setPoints(joueurs.map(() => 0));
    setN(1);
    setQ(questionRapide());
    setBloques(new Set());
    setGagnant(undefined);
    setEnCours(true);
  }

  function suivant() {
    setN((x) => x + 1);
    setQ(questionRapide());
    setBloques(new Set());
    setGagnant(undefined);
  }

  function toucher(i: number, id: string) {
    if (gagnant !== undefined || bloques.has(i)) return;
    if (id === q.bon) {
      sons.bonne();
      setGagnant(i);
      setPoints((p) => p.map((x, k) => (k === i ? x + 1 : x)));
      window.setTimeout(suivant, 2200);
    } else {
      sons.mauvaise();
      const b = new Set(bloques).add(i);
      setBloques(b);
      if (b.size >= joueurs.length) {
        setGagnant(null);
        window.setTimeout(suivant, 2200);
      }
    }
  }

  if (!enCours) {
    return (
      <>
        <div className="mt-3 flex justify-center"><BoutonRegles regles={REGLES_RAPIDE} /></div>
        <Preparation joueurs={joueurs} setJoueurs={setJoueurs} min={2} mode={mode} setMode={setMode} faceAFace onJouer={commencer} setFaceAFace={() => {}} sansFaceAFace>
          <p className="px-1 text-sm texte-doux">Ce jeu se joue toujours en face à face : posez le téléphone à plat entre vous.</p>
        </Preparation>
      </>
    );
  }

  const fini = n > TOURS_RAPIDE;
  const bonNom = q.trois.find((x) => x.id === q.bon)!.nom;
  const resultat = gagnant === undefined ? null : gagnant === null ? `Personne ! C'était ${bonNom}.` : `${joueurs[gagnant].nom} gagne : ${bonNom} !`;
  return (
    <Table
      joueurs={joueurs}
      actif={null}
      faceAFace
      onQuitter={arreter}
      centre={
        fini ? (
          <Fin texte={vainqueur(joueurs, points, mode).texte} onRejouer={commencer} onReglages={arreter} />
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-xs font-extrabold text-[#f0d090]">Tour {n} sur {TOURS_RAPIDE}</p>
              {resultat ? <p className="arrivee mt-1 font-display text-xl text-white">{resultat}</p> : <p className="mt-1 text-sm">Le premier qui touche le bon animal gagne !</p>}
              <p className="mt-2 text-xs">{joueurs.map((j, i) => `${j.nom} : ${points[i]}`).join(" · ")}</p>
            </div>
          </div>
        )
      }
      zone={(i) =>
        fini ? (
          <p className="text-sm font-black text-white">{points[i]} point{points[i] > 1 ? "s" : ""}</p>
        ) : (
          <div className={bloques.has(i) ? "opacity-40" : ""}>
            <p className="font-display text-sm leading-tight text-white">{q.consigne.texte}</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {q.trois.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toucher(i, c.id)}
                  className="overflow-hidden rounded-xl bg-card text-[#2a1c14]"
                  style={gagnant !== undefined && c.id === q.bon ? { boxShadow: "0 0 0 3px #9be08a" } : undefined}
                >
                  <span className="block aspect-[4/3] overflow-hidden"><Portrait id={c.espece} /></span>
                  <span className="line-clamp-2 block px-0.5 text-[10px] font-extrabold leading-tight">{c.nom}</span>
                </button>
              ))}
            </div>
          </div>
        )
      }
    />
  );
}

// ---------------------------------------------------------------- mime l'animal (2 à 4 et plus)

export const REGLES_MIME: Explication = {
  id: "regles-mime",
  titre: "Les règles de mime l'animal",
  etapes: [
    "Chacun son tour, un joueur prend le téléphone. Les autres ne regardent pas !",
    "Il découvre un animal, et il doit le mimer sans parler, ni faire de bruit… sauf le cri de l'animal, si vous êtes d'accord.",
    "Les autres ont une minute pour deviner. Celui qui trouve et celui qui mime gagnent chacun un point.",
    "Après chaque animal, je vous dis une petite chose vraie sur lui.",
  ],
};

// Des animaux faciles à mimer (noms latins de la Mammal Diversity Database).
const A_MIMER = [
  "Panthera leo", "Panthera tigris", "Loxodonta africana", "Giraffa camelopardalis", "Pan troglodytes", "Gorilla gorilla", "Osphranter rufus",
  "Ursus arctos", "Oryctolagus cuniculus", "Canis familiaris", "Felis catus", "Equus caballus", "Bos taurus", "Ovis aries", "Capra hircus",
  "Erinaceus europaeus", "Sciurus vulgaris", "Tursiops truncatus", "Balaenoptera musculus", "Phoca vitulina", "Odobenus rosmarus",
  "Phascolarctos cinereus", "Ailuropoda melanoleuca", "Equus quagga", "Hippopotamus amphibius", "Ceratotherium simum", "Camelus dromedarius",
  "Canis lupus", "Vulpes vulpes", "Suricata suricatta", "Procyon lotor", "Castor fiber", "Mus musculus", "Talpa europaea", "Bradypus variegatus",
  "Ornithorhynchus anatinus", "Ursus maritimus", "Lama glama", "Sus scrofa", "Macaca fuscata",
];

function faitVrai(e: { nom: string; masse?: string; longevite?: string; ou?: string; pays?: string[] }) {
  if (e.masse) return `${e.nom} : ${e.masse}, d'après les mesures des scientifiques.`;
  if (e.longevite) return `${e.nom} : longévité ${e.longevite}.`;
  return `${e.nom}. ${e.ou ?? ""}`;
}

export function MimeAnimal() {
  const [joueurs, setJoueurs] = useState<Joueur[]>(() => {
    const j = lireJoueurs();
    return j.length >= 2 ? j : [...j, { nom: "Joueur 2", couleur: "#2f5fa8", equipe: 1 }];
  });
  const [mode, setMode] = useState<Mode>("chacun");
  const [enCours, setEnCours] = useState(false);
  const [tour, setTour] = useState(0);
  const [etape, setEtape] = useState<"cache" | "voit" | "mime" | "fait">("cache");
  const [animaux, setAnimaux] = useState<string[]>([]);
  const [points, setPoints] = useState<number[]>([]);
  const [temps, setTemps] = useState(60);
  const arreter = useCallback(() => setEnCours(false), []);
  useQuitterPartie(enCours, arreter);

  const liste = useMemo(() => A_MIMER.map((l) => [...PAR_ID.values()].find((e) => e.latin === l)).filter((e): e is Espece => !!e && e.langue === "fr"), []);

  useEffect(() => {
    if (etape !== "mime") return;
    if (temps <= 0) {
      setEtape("fait");
      return;
    }
    const t = window.setTimeout(() => setTemps((x) => x - 1), 1000);
    return () => window.clearTimeout(t);
  }, [etape, temps]);

  function commencer() {
    setAnimaux(melanger(liste.map((e) => e.id)));
    setPoints(joueurs.map(() => 0));
    setTour(0);
    setEtape("cache");
    setEnCours(true);
  }

  if (!enCours) {
    return (
      <>
        <div className="mt-3 flex justify-center"><BoutonRegles regles={REGLES_MIME} /></div>
        <Preparation joueurs={joueurs} setJoueurs={setJoueurs} min={2} mode={mode} setMode={setMode} faceAFace={false} setFaceAFace={() => {}} sansFaceAFace onJouer={commencer} />
      </>
    );
  }

  const mimeur = tour % joueurs.length;
  const e = PAR_ID.get(animaux[tour % animaux.length])!;
  function trouve(qui: number | null) {
    setPoints((p) => p.map((x, k) => (qui !== null && (k === qui || k === mimeur) ? x + 1 : x)));
    if (qui !== null) sons.bonne();
    const fait = faitVrai(e);
    plumeDit(fait, 5000);
    if (voixPossible()) dire(fait);
    setEtape("fait");
  }
  function suivant() {
    setTour((t) => t + 1);
    setEtape("cache");
    setTemps(60);
  }

  return (
    <section className="mt-3 text-center">
      <p className="text-sm">{joueurs.map((j, i) => `${j.nom} : ${points[i]}`).join(" · ")}</p>
      {etape === "cache" ? (
        <div className="mt-6">
          <p className="font-display text-3xl" style={{ color: joueurs[mimeur].couleur }}>À toi de mimer, {joueurs[mimeur].nom} !</p>
          <p className="mt-2">Prends le téléphone. Les autres ne regardent pas !</p>
          <button type="button" onClick={() => setEtape("voit")} className="bouton-bois mt-5 rounded-full px-6 py-3 font-extrabold">Voir mon animal</button>
        </div>
      ) : etape === "voit" ? (
        <div className="mt-4">
          <span className="medaillon-or mx-auto block size-48 overflow-hidden"><Portrait id={e.id} /></span>
          <p className="titre-or mt-3 text-4xl">{e.nom}</p>
          <p className="mt-2 text-sm">Cache l'écran, puis mime cet animal sans parler.</p>
          <button type="button" onClick={() => { setTemps(60); setEtape("mime"); }} className="mt-4 w-full rounded-[1.4rem] bg-[linear-gradient(180deg,#ff9f4a,#c2402a)] py-3.5 font-display text-2xl text-white">Je suis prête, on lance la minute !</button>
        </div>
      ) : etape === "mime" ? (
        <div className="mt-4">
          <p className="font-display text-7xl text-[#f3d48a]">{temps}</p>
          <p className="mt-1">secondes pour deviner</p>
          <p className="mt-4 font-extrabold">Qui a trouvé ?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {joueurs.map((j, i) => (i === mimeur ? null : <button key={i} type="button" onClick={() => trouve(i)} className="rounded-2xl py-3 font-extrabold text-white" style={{ background: j.couleur }}>{j.nom}</button>))}
          </div>
          <button type="button" onClick={() => trouve(null)} className="mt-2 w-full rounded-2xl bg-[#f3e2c2] py-3 font-extrabold text-[#2a1c14]">Personne</button>
        </div>
      ) : (
        <div className="mt-4">
          <span className="medaillon-or mx-auto block size-36 overflow-hidden"><Portrait id={e.id} /></span>
          <p className="titre-or mt-2 text-3xl">C'était : {e.nom}</p>
          <p className="mx-auto mt-2 max-w-sm rounded-2xl bg-[#fff8ea] px-3 py-2 text-sm font-bold text-[#4a2a8a]">{faitVrai(e)}</p>
          <a href={`#/mammiferes/e-${e.id}`} className="mt-2 inline-block text-sm font-extrabold underline">Voir sa fiche</a>
          <button type="button" onClick={suivant} className="bouton-bois mt-4 w-full rounded-2xl py-3 font-extrabold">Joueur suivant</button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- les 7 familles (2 à 4, on se passe le téléphone)

export const REGLES_FAMILLES: Explication = {
  id: "regles-familles",
  titre: "Les règles des 7 familles",
  etapes: [
    "Il y a sept familles d'animaux, avec six animaux dans chaque famille. Le but : réunir des familles complètes.",
    "Chacun son tour, on prend le téléphone. Les autres ne regardent pas tes cartes !",
    "Demande une carte à un joueur : « Dans la famille des félins, je voudrais le lion. » Tu dois déjà avoir une carte de cette famille.",
    "S'il l'a, il te la donne et tu rejoues. Sinon : « Pioche ! » Si tu pioches la carte demandée, tu rejoues aussi.",
    "Une famille complète se pose devant toi. À la fin, celui qui a le plus de familles gagne.",
  ],
};

const FAMILLES_JEU = ["Felidae", "Canidae", "Cervidae", "Delphinidae", "Sciuridae", "Mustelidae", "Macropodidae"];
const NOMS_FAMILLES: Record<string, string> = {
  Felidae: "félins", Canidae: "loups et renards", Cervidae: "cerfs", Delphinidae: "dauphins", Sciuridae: "écureuils", Mustelidae: "belettes et loutres", Macropodidae: "kangourous",
};
type CarteFam = { id: string; nom: string; famille: string };

function paquetFamilles(): CarteFam[] {
  const toutes = [...PAR_ID.values()];
  return FAMILLES_JEU.flatMap((f) =>
    melanger(toutes.filter((e) => e.famille === f && e.langue === "fr" && !e.disparue && aUnePhotoFam(e.id)))
      .slice(0, 6)
      .map((e) => ({ id: e.id, nom: e.nom, famille: f })),
  );
}
import { aUnePhoto as aUnePhotoFam } from "@/components/portrait";

type EtatFam = { mains: CarteFam[][]; pioche: CarteFam[]; posees: string[][]; tour: number; vue: "cache" | "main" | "reponse"; message: string; rejoue: boolean };

export function SeptFamilles() {
  const [joueurs, setJoueurs] = useState<Joueur[]>(() => {
    const j = lireJoueurs();
    return j.length >= 2 ? j : [...j, { nom: "Joueur 2", couleur: "#2f5fa8", equipe: 1 }];
  });
  const [mode, setMode] = useState<Mode>("chacun");
  const [e, setE] = useState<EtatFam | null>(null);
  const [cible, setCible] = useState<number | null>(null);
  const [famille, setFamille] = useState<string | null>(null);
  const arreter = useCallback(() => setE(null), []);
  useQuitterPartie(!!e, arreter);

  function poser(main: CarteFam[], posees: string[]) {
    let m = main;
    const p = [...posees];
    for (const f of FAMILLES_JEU) {
      if (m.filter((c) => c.famille === f).length === 6) {
        m = m.filter((c) => c.famille !== f);
        p.push(f);
      }
    }
    return { m, p };
  }

  function commencer() {
    const paquet = melanger(paquetFamilles());
    const n = joueurs.length === 2 ? 7 : 5;
    const mains = joueurs.map((_, i) => paquet.slice(i * n, (i + 1) * n));
    setE({ mains, pioche: paquet.slice(joueurs.length * n), posees: joueurs.map(() => []), tour: 0, vue: "cache", message: "", rejoue: false });
    setCible(null);
    setFamille(null);
  }

  if (!e) {
    return (
      <>
        <div className="mt-3 flex justify-center"><BoutonRegles regles={REGLES_FAMILLES} /></div>
        <Preparation joueurs={joueurs} setJoueurs={setJoueurs} min={2} mode={mode} setMode={setMode} faceAFace={false} setFaceAFace={() => {}} sansFaceAFace onJouer={commencer}>
          <p className="px-1 text-sm texte-doux">Les familles : {FAMILLES_JEU.map((f) => NOMS_FAMILLES[f]).join(", ")}. Six vrais animaux dans chacune.</p>
        </Preparation>
      </>
    );
  }

  const total = e.posees.reduce((s, p) => s + p.length, 0);
  const fini = total === FAMILLES_JEU.length;
  const moi = e.tour;
  const main = e.mains[moi];

  function demander(carte: CarteFam) {
    if (!e || cible === null) return;
    const mains = e.mains.map((m) => [...m]);
    const posees = e.posees.map((p) => [...p]);
    let pioche = [...e.pioche];
    let message: string;
    let rejoue = false;
    const chez = mains[cible].findIndex((c) => c.id === carte.id);
    const phrase = `Dans la famille des ${NOMS_FAMILLES[carte.famille]}, je voudrais ${carte.nom}.`;
    if (chez >= 0) {
      mains[cible].splice(chez, 1);
      mains[moi].push(carte);
      message = `${phrase} ${joueurs[cible].nom} l'avait ! Tu rejoues.`;
      rejoue = true;
      sons.bonne();
    } else if (pioche.length) {
      const tiree = pioche[0];
      pioche = pioche.slice(1);
      mains[moi].push(tiree);
      rejoue = tiree.id === carte.id;
      message = `${phrase} ${joueurs[cible].nom} ne l'a pas : pioche ! Tu as pioché ${tiree.nom}.${rejoue ? " Bonne pioche, tu rejoues !" : ""}`;
    } else {
      message = `${phrase} ${joueurs[cible].nom} ne l'a pas, et la pioche est vide.`;
    }
    const r = poser(mains[moi], posees[moi]);
    if (r.p.length > posees[moi].length) message += ` Famille complète : les ${NOMS_FAMILLES[r.p[r.p.length - 1]]} !`;
    mains[moi] = r.m;
    posees[moi] = r.p;
    plumeDit(phrase, 3000);
    if (voixPossible()) dire(phrase);
    setE({ ...e, mains, posees, pioche, vue: "reponse", message, rejoue });
    setCible(null);
    setFamille(null);
  }

  function continuer() {
    if (!e) return;
    if (e.rejoue && e.mains[moi].length) {
      setE({ ...e, vue: "main", message: "" });
      return;
    }
    // Joueur suivant qui a encore des cartes (ou qui peut piocher).
    let t = (e.tour + 1) % joueurs.length;
    for (let k = 0; k < joueurs.length && !e.mains[t].length && !e.pioche.length; k++) t = (t + 1) % joueurs.length;
    const mains = e.mains.map((m) => [...m]);
    let pioche = e.pioche;
    if (!mains[t].length && pioche.length) {
      mains[t].push(pioche[0]);
      pioche = pioche.slice(1);
    }
    setE({ ...e, mains, pioche, tour: t, vue: "cache", message: "", rejoue: false });
  }

  const scores = e.posees.map((p) => p.length);
  const parFamille = FAMILLES_JEU.map((f) => [f, main.filter((c) => c.famille === f)] as const).filter(([, l]) => l.length);
  const autres = joueurs.map((_, i) => i).filter((i) => i !== moi && e.mains[i].length);

  return (
    <section className="mt-3">
      <p className="text-center text-sm">{joueurs.map((j, i) => `${j.nom} : ${scores[i]} famille${scores[i] > 1 ? "s" : ""}`).join(" · ")} · pioche : {e.pioche.length}</p>
      {fini ? (
        <Fin texte={vainqueur(joueurs, scores, mode).texte} onRejouer={commencer} onReglages={arreter} />
      ) : e.vue === "cache" ? (
        <div className="mt-8 text-center">
          <p className="font-display text-3xl" style={{ color: joueurs[moi].couleur }}>À toi, {joueurs[moi].nom} !</p>
          <p className="mt-2">Prends le téléphone. Les autres ne regardent pas tes cartes !</p>
          <button type="button" onClick={() => setE({ ...e, vue: "main" })} className="bouton-bois mt-5 rounded-full px-6 py-3 font-extrabold">Voir mes cartes</button>
        </div>
      ) : e.vue === "reponse" ? (
        <div className="arrivee mt-6 text-center">
          <p className="mx-auto max-w-sm rounded-3xl bg-[#fff8ea] px-4 py-3 font-bold text-[#4a2a8a]">{e.message}</p>
          <button type="button" onClick={continuer} className="bouton-bois mt-4 rounded-full px-6 py-3 font-extrabold">{e.rejoue ? "Je rejoue" : "Cacher mes cartes et passer"}</button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-center font-display text-2xl" style={{ color: joueurs[moi].couleur }}>Tes cartes, {joueurs[moi].nom}</p>
          {e.posees[moi].length ? <p className="text-center text-xs">Tes familles : {e.posees[moi].map((f) => NOMS_FAMILLES[f]).join(", ")}</p> : null}
          <div className="mt-2 space-y-2">
            {parFamille.map(([f, l]) => (
              <div key={f} className="rounded-2xl bg-[#2a1844]/70 px-2 py-1.5">
                <p className="text-xs font-black text-[#f0d090]">Famille des {NOMS_FAMILLES[f]} · {l.length} sur 6</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {l.map((c) => (
                    <span key={c.id} className="w-16 text-center">
                      <span className="block aspect-square overflow-hidden rounded-xl ring-2 ring-[#d9b56a]"><Portrait id={c.id} /></span>
                      <span className="line-clamp-2 block text-[9px] font-extrabold leading-tight">{c.nom}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!main.length ? (
            <button type="button" onClick={continuer} className="bouton-bois mt-3 w-full rounded-2xl py-3 font-extrabold">Je n'ai plus de cartes : passer</button>
          ) : (
            <div className="mt-3 rounded-3xl bg-card px-3 py-3 text-[#2a1c14]">
              <p className="font-extrabold">1. À qui demander ?</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {autres.map((i) => <button key={i} type="button" onClick={() => setCible(i)} className="rounded-full px-3 py-1.5 font-extrabold text-white" style={{ background: joueurs[i].couleur, outline: cible === i ? "3px solid #2a1c14" : "none" }}>{joueurs[i].nom}</button>)}
                {!autres.length ? <p className="text-sm">Les autres n'ont plus de cartes.</p> : null}
              </div>
              {cible !== null ? (
                <>
                  <p className="mt-2 font-extrabold">2. Quelle famille ?</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {parFamille.map(([f]) => <Choix key={f} actif={famille === f} onClick={() => setFamille(f)}>{NOMS_FAMILLES[f]}</Choix>)}
                  </div>
                </>
              ) : null}
              {cible !== null && famille ? (
                <>
                  <p className="mt-2 font-extrabold">3. Quelle carte veux-tu ?</p>
                  <div className="mt-1 grid grid-cols-3 gap-1.5">
                    {paquetFamillesConnu(e, famille).filter((c) => !main.some((m) => m.id === c.id)).map((c) => (
                      <button key={c.id} type="button" onClick={() => demander(c)} className="rounded-xl bg-[#fff8ea] p-1 text-center">
                        <span className="block aspect-square overflow-hidden rounded-lg"><Portrait id={c.id} /></span>
                        <span className="line-clamp-2 block text-[10px] font-extrabold leading-tight">{c.nom}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Les six cartes d'une famille dans cette partie (où qu'elles soient). */
function paquetFamillesConnu(e: EtatFam, famille: string) {
  const toutes = [...e.mains.flat(), ...e.pioche];
  return toutes.filter((c) => c.famille === famille).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

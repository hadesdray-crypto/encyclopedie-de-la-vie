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

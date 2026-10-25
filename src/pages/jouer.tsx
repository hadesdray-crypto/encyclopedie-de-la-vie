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
import crisVerifies from "@/data/cris-verifies.json";
import { LuChevronLeft, LuFlame, LuGalleryVertical, LuLayoutGrid, LuList, LuUser, LuUsers } from "react-icons/lu";
import { useModeJeu } from "@/lib/mode-jeu";
import { revenir } from "@/lib/routeur";
import { PlumeDessin } from "@/components/plume-dessin";
import { ouvrirPlume, usePlume } from "@/lib/plume";
import { useIndice } from "@/lib/indice";
import { TablesMultiplication } from "@/pages/tables";
import { Bataille, LePlusRapide, MemoryPlusieurs, MimeAnimal, SeptFamilles, REGLES_BATAILLE, REGLES_FAMILLES, REGLES_MEMORY, REGLES_MIME, REGLES_RAPIDE } from "@/pages/jeux-plusieurs";
import { definirEcran } from "@/lib/plume";
import { CarteChoix, Consigne, Resultat, Versus, etatDe } from "@/components/jeu-ui";
import type { Explication } from "@/data/guide";

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

type Jeu = "tables" | "defi" | "regime" | "temps" | "memoire" | "bataille" | "rapide" | "mime" | "familles" | "poids" | "carte" | "cri";

// Chaque jeu a son animal (une vraie photo) et ses couleurs.
const LOOK: Record<Jeu, { latin: string; fond: string }> = {
  defi: { latin: "Panthera leo", fond: "linear-gradient(160deg,#ffb347,#c2402a)" },
  memoire: { latin: "Elephas maximus", fond: "linear-gradient(160deg,#a57bf0,#4a2a8a)" },
  bataille: { latin: "Ceratotherium simum", fond: "linear-gradient(160deg,#ff7a6b,#8a1f3a)" },
  rapide: { latin: "Acinonyx jubatus", fond: "linear-gradient(160deg,#ffd84a,#c27a1a)" },
  mime: { latin: "Pan troglodytes", fond: "linear-gradient(160deg,#7fd6a8,#2f7d6d)" },
  familles: { latin: "Suricata suricatta", fond: "linear-gradient(160deg,#f0b860,#8d4e1f)" },
  cri: { latin: "Canis lupus", fond: "linear-gradient(160deg,#7fb2ff,#2a3f8a)" },
  poids: { latin: "Loxodonta africana", fond: "linear-gradient(160deg,#c9b8a0,#6b5a3a)" },
  carte: { latin: "Phascolarctos cinereus", fond: "linear-gradient(160deg,#5fc2b0,#1f5f7a)" },
  regime: { latin: "Ailuropoda melanoleuca", fond: "linear-gradient(160deg,#9be07a,#3f8a2a)" },
  tables: { latin: "Pongo abelii", fond: "linear-gradient(160deg,#ffd84a,#8d4e1f)" },
  temps: { latin: "Tachyglossus aculeatus", fond: "linear-gradient(160deg,#f07aa8,#6a2a8a)" },
};
function photoDuJeu(j: Jeu) {
  const e = ESPECES.find((x) => x.latin === LOOK[j].latin);
  return e && aUnePhoto(e.id) ? e.id : null;
}

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
  { id: "tables", nom: "Les tables magiques", sous: "Toutes les tables de 1 à 9 : tu gagnes le Plumedex !", niveau: 2, joueurs: "Seule" },
];

// Les règles de chaque jeu : quand on touche Plume (ou « Aide ») pendant un jeu, elle explique exactement celui-là.
const PAQUET = "Chaque bonne réponse compte : huit bonnes réponses te font gagner un paquet de cartes.";
const REGLES_SOLO: Partial<Record<Jeu, Explication>> = {
  poids: { id: "regles-poids", titre: "Le plus lourd ?", etapes: ["Deux animaux sont face à face.", "Touche celui qui pèse le plus lourd quand il est adulte.", "Après ta réponse, je te montre le vrai poids de chacun.", PAQUET] },
  carte: { id: "regles-carte", titre: "Qui vit ici ?", etapes: ["Sur la carte, les pays en or montrent où vit un animal.", "Regarde bien où ils sont, puis touche l'animal qui vit là.", "Après ta réponse, je te dis où il vit vraiment.", PAQUET] },
  regime: { id: "regles-regime", titre: "Qu'est-ce qu'il mange ?", etapes: ["Je te montre un animal.", "Choisis ce qu'il mange surtout : chaque réponse explique le mot (herbivore, carnivore…).", "Touche « Une autre » pour un nouvel animal.", PAQUET] },
  temps: { id: "regles-temps", titre: "Qui est arrivé en premier ?", etapes: ["Deux êtres vivants de l'histoire de la vie.", "Touche celui qui est apparu en premier sur Terre.", "Après ta réponse, je te dis quand chacun est apparu.", PAQUET] },
  cri: { id: "regles-cri", titre: "Devine qui crie", etapes: ["Appuie sur le bouton lecture pour écouter le cri. Ce sont de vrais enregistrements faits dans la nature.", "Puis touche l'animal qui fait ce bruit.", PAQUET] },
  memoire: REGLES_MEMORY, bataille: REGLES_BATAILLE, rapide: REGLES_RAPIDE, mime: REGLES_MIME, familles: REGLES_FAMILLES,
};

export function JouerPage({ params }: { params: URLSearchParams }) {
  const jeu = params.get("jeu") as Jeu | null;
  const choisi = JEUX.find((j) => j.id === jeu);
  // Plume explique toujours là où on est : la liste des jeux, ou les règles du jeu ouvert.
  useEffect(() => {
    const r = jeu ? REGLES_SOLO[jeu] : undefined;
    if (r) definirEcran(r);
    else if (!choisi) definirEcran({ id: "menu-jeux", titre: "Les jeux", etapes: ["Voici tous les jeux. Touche celui qui te fait envie !", ...JEUX.map((j) => `« ${j.nom} » : ${j.sous} ${j.joueurs === "Seule" ? "Tu joues seule." : `Joueurs : ${j.joueurs}.`}`)] });
    else definirEcran(null);
    return () => definirEcran(null);
  }, [jeu]);
  if (!choisi) return <MenuJeux />;
  return (
    <ModeJeu titre={choisi.nom} jeu={jeu}>
      {jeu === "defi" ? <DefiDuJour /> : jeu === "cri" ? <JeuCri /> : jeu === "memoire" ? <MemoryPlusieurs /> : jeu === "bataille" ? <Bataille /> : jeu === "rapide" ? <LePlusRapide /> : jeu === "mime" ? <MimeAnimal /> : jeu === "familles" ? <SeptFamilles /> : jeu === "poids" ? <JeuPoids /> : jeu === "carte" ? <JeuCarte /> : jeu === "regime" ? <JeuRegime /> : jeu === "tables" ? <TablesMultiplication /> : <JeuTemps />}
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
        <button type="button" onClick={() => ouvrirPlume(true, "page")} className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-[#6a3fc0] px-3 text-sm font-extrabold text-white">Aide</button>
        <p className="min-w-0 flex-1 truncate font-display text-lg text-[#f3d48a]">{titre}</p>
        <button type="button" onClick={() => revenir("/jouer")} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-card px-3.5 text-sm font-extrabold text-[#2a1c14]">
          <LuChevronLeft className="size-5" aria-hidden="true" /> Retour
        </button>
      </header>
      {children}
    </main>
  );
}

const EMOJI_REGIME: Record<string, string> = { carnivore: "🥩", piscivore: "🐟", insectivore: "🐜", invertivore: "🦑", herbivore: "🌿", folivore: "🍃", frugivore: "🍎", nectarivore: "🌸", omnivore: "🍽️" };

function JeuRegime() {
  const [q, setQ] = useState(questionRegime);
  const [rep, setRep] = useState<RegimeId | null>(null);
  const effaces = useIndice(q.e.id, q.choix, q.bon, rep !== null);
  const choisir = (id: RegimeId) => { if (rep) return; setRep(id); noterReponse(id === q.bon); if (id === q.bon) sons.bonne(); else sons.mauvaise(); };
  return (
    <section className="mt-4">
      <a href={`#/mammiferes/e-${q.e.id}`} className="halo-jeu apparait mx-auto mt-2 block size-40 overflow-hidden rounded-full"><Portrait id={q.e.id} /></a>
      <Consigne sous="Il mange surtout…">{q.e.nom}</Consigne>
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {q.choix.map((id) => (
          <li key={id}>
            <CarteChoix emoji={EMOJI_REGIME[id]} nom={REGIMES[id].nom} etat={etatDe(id, rep, q.bon, effaces)} onClick={() => choisir(id)} taille="petite" />
          </li>
        ))}
      </ul>
      {rep ? <Resultat juste={rep === q.bon} texte={`${q.e.nom} : ${REGIMES[q.bon].nom.toLowerCase()}. ${REGIMES[q.bon].explique}`} suite={() => { setQ(questionRegime()); setRep(null); }} /> : null}
    </section>
  );
}

function JeuTemps() {
  const [q, setQ] = useState(questionTemps);
  const [rep, setRep] = useState<string | null>(null);
  const choisir = (id: string) => { if (rep) return; setRep(id); noterReponse(id === q.bon); if (id === q.bon) sons.bonne(); else sons.mauvaise(); };
  return (
    <section className="mt-2">
      <Consigne sous="Dans la longue histoire de la vie">Qui est apparu en premier ?</Consigne>
      <div className="relative mt-5 grid grid-cols-2 gap-4">
        {[q.a, q.b].map((e) => (
          <CarteChoix key={e.id} image={<Vignette image={e.image} icone={e.icone} />} nom={e.nom} revele={e.quand} etat={etatDe(e.id, rep, q.bon)} onClick={() => choisir(e.id)} taille="grande" />
        ))}
        <Versus />
      </div>
      {rep ? <Resultat juste={rep === q.bon} texte={rep === q.bon ? `« ${ETAPES[q.bon].nom} » est bien arrivé avant.` : `C'est « ${ETAPES[q.bon].nom} » qui est arrivé avant.`} suite={() => { setQ(questionTemps()); setRep(null); }} /> : null}
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
  const choisir = (id: string) => { if (rep) return; setRep(id); noterReponse(id === q.bon); if (id === q.bon) sons.bonne(); else sons.mauvaise(); };
  const ga = grammesDe(q.a.masse) ?? 0, gb = grammesDe(q.b.masse) ?? 0;
  return (
    <section className="mt-2">
      <Consigne sous="Quand il est adulte">Lequel est le plus lourd ?</Consigne>
      <div className="relative mt-5 grid grid-cols-2 gap-4">
        {[q.a, q.b].map((e) => (
          <CarteChoix key={e.id} image={<Portrait id={e.id} />} nom={e.nom} revele={e.masse} etat={etatDe(e.id, rep, q.bon)} onClick={() => choisir(e.id)} taille="grande" />
        ))}
        <Versus />
      </div>
      {rep ? (
        <>
          {/* La balance : chaque barre montre le poids de l'animal (le plus lourd prend toute la place). */}
          <div className="resultat-jeu apparait mt-4 space-y-1.5 rounded-[1.6rem] bg-white/8 px-4 py-3">
            {[{ e: q.a, g: ga }, { e: q.b, g: gb }].map(({ e, g }) => (
              <div key={e.id}>
                <p className="flex justify-between text-xs font-extrabold"><span>{e.nom}</span><span>{e.masse}</span></p>
                <div className="mt-0.5 h-3 overflow-hidden rounded-full bg-white/10"><div className="barre-poids h-full rounded-full bg-gradient-to-r from-[#f3c35a] to-[#ff8a3d]" style={{ width: `${Math.max(2, (100 * g) / Math.max(ga, gb))}%` }} /></div>
              </div>
            ))}
            <p className="pt-1 text-center text-xs texte-doux">{Math.max(ga, gb) / Math.max(1, Math.min(ga, gb)) >= 10 ? `Le plus lourd pèse plus de ${Math.floor(Math.max(ga, gb) / Math.max(1, Math.min(ga, gb)))} fois plus !` : `Le plus lourd pèse environ ${Math.round(Math.max(ga, gb) / Math.max(1, Math.min(ga, gb)))} fois plus.`}</p>
          </div>
          <Resultat juste={rep === q.bon} suite={() => { setQ(questionPoids()); setRep(null); }} />
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
  const choisir = (id: string) => { if (rep) return; setRep(id); noterReponse(id === q.bon.id); if (id === q.bon.id) sons.bonne(); else sons.mauvaise(); };
  return (
    <section className="mt-2">
      <Consigne sous="Les pays en or montrent où il vit">Qui vit ici ?</Consigne>
      <div className="carte-jeu mt-4"><CarteMonde pays={q.bon.pays!} /></div>
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {q.choix.map((e) => (
          <li key={e.id}>
            <CarteChoix image={<Portrait id={e.id} />} nom={e.nom} etat={etatDe(e.id, rep, q.bon.id, effaces)} onClick={() => choisir(e.id)} taille="petite" />
          </li>
        ))}
      </ul>
      {rep ? <Resultat juste={rep === q.bon.id} texte={`${rep === q.bon.id ? "" : `C'était ${q.bon.nom}. `}${q.bon.ou}`} suite={() => { setQ(questionCarte()); setRep(null); }} /> : null}
    </section>
  );
}

// ---------- Devine qui crie ----------
// Seulement les vrais cris enregistrés (licence libre). Jamais de son fabriqué.
const CRIEURS = (crisVerifies as string[]).map((id) => PAR_ID.get(id))
  // Pas les chauves-souris : leurs cris se ressemblent trop (et sont souvent des ultrasons).
  .filter((e): e is Espece => !!e && e.langue === "fr" && e.ordre !== "Chiroptera" && aUnePhoto(e.id));

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
  const choisir = (id: string) => { if (rep) return; setRep(id); noterReponse(id === q.bon.id); if (id === q.bon.id) sons.bonne(); else sons.mauvaise(); };
  return (
    <section className="mt-2">
      <Consigne sous="Un vrai enregistrement, fait dans la nature">Qui fait ce bruit ?</Consigne>
      <div className="lecteur-cri mx-auto mt-4 max-w-sm rounded-full p-1.5">
        <audio key={q.bon.id} controls preload="auto" src={`s/${q.bon.id}.webm`} className="w-full" />
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {q.choix.map((e) => (
          <li key={e.id}>
            <CarteChoix image={<Portrait id={e.id} />} nom={e.nom} etat={etatDe(e.id, rep, q.bon.id, effaces)} onClick={() => choisir(e.id)} taille="petite" />
          </li>
        ))}
      </ul>
      {rep ? <Resultat juste={rep === q.bon.id} texte={rep === q.bon.id ? undefined : `C'était ${q.bon.nom}.`} suite={() => { setQ(questionCri()); setRep(null); }} libelle="Un autre cri" /> : null}
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
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#f3c35a] to-[#ff8a3d] transition-[width] duration-500" style={{ width: `${(100 * (i + (rep ? 1 : 0))) / questions.length}%` }} /></div>
      <Consigne>{q.consigne}</Consigne>
      {q.audio ? <div className="lecteur-cri mx-auto mt-4 max-w-sm rounded-full p-1.5"><audio key={q.audio} controls preload="auto" src={`s/${q.audio}.webm`} className="w-full" /></div> : null}
      {q.carte ? <div className="carte-jeu mt-4"><CarteMonde pays={q.carte} /></div> : null}
      {"portrait" in q ? <span className="halo-jeu mx-auto mt-4 block size-32 overflow-hidden rounded-full"><Portrait id={(q as { portrait: string }).portrait} /></span> : null}
      <ul key={i} className={`relative mt-4 grid gap-3 ${q.choix.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {q.choix.map((c) => {
          const animal = PAR_ID.get(c.id);
          return (
            <li key={c.id}>
              <CarteChoix image={animal ? <Portrait id={animal.id} /> : undefined} emoji={animal ? undefined : EMOJI_REGIME[c.id]} nom={c.nom} revele={animal && q.choix.length === 2 ? c.detail : undefined} etat={etatDe(c.id, rep, q.bon, effaces)} onClick={() => choisir(c.id)} taille={q.choix.length === 2 ? "grande" : "petite"} />
            </li>
          );
        })}
        {q.choix.length === 2 ? <Versus /> : null}
      </ul>
      {rep ? <Resultat juste={rep === q.bon} texte={q.apres} suite={suivante} libelle={i + 1 >= questions.length ? "Voir mon résultat" : "Question suivante"} /> : null}
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

/* ---------- Le menu des jeux : trois façons de les afficher ---------- */
type Affichage = "cartes" | "medaillons" | "liste";
const CLE_AFFICHAGE = "leonie-jeux-affichage";
function lireAffichage(): Affichage {
  try {
    const v = localStorage.getItem(CLE_AFFICHAGE);
    return v === "medaillons" || v === "liste" ? v : "cartes";
  } catch {
    return "cartes";
  }
}

function Etoiles({ n, clair = false }: { n: number; clair?: boolean }) {
  return (
    <span aria-label={`Niveau ${n} sur 3`} className="tracking-tight">
      <span className="text-[#f3d48a]">{"★".repeat(n)}</span>
      <span className={clair ? "text-white/35" : "text-[#cdb89a]"}>{"★".repeat(3 - n)}</span>
    </span>
  );
}
function Joueurs({ t }: { t: string }) {
  const seule = t === "Seule";
  return (
    <span className="inline-flex items-center gap-1">
      {seule ? <LuUser className="size-3.5" aria-hidden="true" /> : <LuUsers className="size-3.5" aria-hidden="true" />}
      {seule ? "Seule" : `${t} joueurs`}
    </span>
  );
}
function Photo({ j }: { j: Jeu }) {
  const id = photoDuJeu(j);
  return id ? <Portrait id={id} /> : <span className="block size-full" style={{ background: LOOK[j].fond }} />;
}

function MenuJeux() {
  const [aff, setAff] = useState<Affichage>(lireAffichage);
  const choisir = (a: Affichage) => {
    setAff(a);
    try {
      localStorage.setItem(CLE_AFFICHAGE, a);
    } catch {
      /* rien */
    }
  };
  const MODES: { id: Affichage; label: string; icone: typeof LuList }[] = [
    { id: "cartes", label: "Grandes cartes", icone: LuGalleryVertical },
    { id: "medaillons", label: "Médaillons", icone: LuLayoutGrid },
    { id: "liste", label: "Liste", icone: LuList },
  ];
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <div className="flex items-end justify-between gap-2">
        <Titre sous="Touche un jeu pour commencer.">Jouer</Titre>
        <div role="radiogroup" aria-label="Affichage des jeux" className="mb-1 flex shrink-0 gap-1 rounded-full bg-[#2a1844] p-1 ring-1 ring-[#e8c98a]/40">
          {MODES.map(({ id, label, icone: I }) => (
            <button key={id} type="button" role="radio" aria-checked={aff === id} aria-label={label} onClick={() => choisir(id)} className={`grid size-9 place-items-center rounded-full ${aff === id ? "bg-[#f3d48a] text-[#2a1650]" : "text-[#f3d48a]"}`}>
              <I className="size-5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {aff === "cartes" ? (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {JEUX.map((j, i) => (
            <li key={j.id} className={i === 0 ? "col-span-2" : ""}>
              <a href={`#/jouer?jeu=${j.id}`} className={`carte-jeu relative block overflow-hidden rounded-[1.4rem] border-2 border-[#e8c98a]/80 shadow-[0_10px_22px_rgba(0,0,0,.45)] ${i === 0 ? "h-44" : "h-52"}`} style={{ background: LOOK[j.id].fond }}>
                <span className="absolute inset-0 [&_img]:size-full [&_img]:object-cover"><Photo j={j.id} /></span>
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(18,10,40,.92)_85%)]" />
                <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-black backdrop-blur-sm"><Etoiles n={j.niveau} clair /></span>
                <span className="absolute inset-x-0 bottom-0 px-3 pb-2.5 text-white">
                  <span className={`block font-display leading-tight [text-shadow:0_2px_6px_#000] ${i === 0 ? "text-2xl" : "text-lg"}`}>{j.nom}</span>
                  <span className="mt-0.5 block text-xs font-bold leading-snug text-white/85">{j.sous}</span>
                  <span className="mt-1.5 inline-flex rounded-full bg-[#f3d48a] px-2 py-0.5 text-[11px] font-black text-[#2a1650]"><Joueurs t={j.joueurs} /></span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : aff === "medaillons" ? (
        <ul className="mt-5 grid grid-cols-3 gap-x-2 gap-y-5">
          {JEUX.map((j) => (
            <li key={j.id} className="text-center">
              <a href={`#/jouer?jeu=${j.id}`} className="block">
                <span className="medaillon-or relative mx-auto block aspect-square w-[88%] overflow-hidden [&_img]:size-full [&_img]:object-cover"><Photo j={j.id} /></span>
                <span className="mt-1.5 block font-display text-[15px] leading-tight text-[#f3d48a]">{j.nom}</span>
                <span className="block text-[11px] font-black text-[#e7d7ff]"><Etoiles n={j.niveau} clair /> · <Joueurs t={j.joueurs} /></span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-2">
          {JEUX.map((j) => (
            <li key={j.id}>
              <a href={`#/jouer?jeu=${j.id}`} className="flex items-center gap-3 rounded-3xl bg-card px-3 py-2.5 text-[#2a1c14]">
                <span className="medaillon-or block size-14 shrink-0 overflow-hidden [&_img]:size-full [&_img]:object-cover"><Photo j={j.id} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{j.nom}</span>
                  <span className="block text-sm leading-snug">{j.sous}</span>
                </span>
                <span className="shrink-0 text-right text-xs font-black">
                  <span className="block"><Etoiles n={j.niveau} /></span>
                  <span className="block"><Joueurs t={j.joueurs} /></span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

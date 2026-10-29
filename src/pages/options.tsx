import { changerInterface, useInterface, type Ouverture, type StyleBoutons } from "@/lib/interface";
import { revivrePremiereFois } from "@/lib/plume";
import { activerDex, useDex } from "@/lib/dex";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LuVolume2 } from "react-icons/lu";
import { Entete, Titre } from "@/components/entete";
import { PlumeDessin } from "@/components/plume-dessin";
import { voixPossible } from "@/components/voix";
import { BoutonEcouter, CartePage, Ligne, TitreSous, Tuile, texteInterrupteur, type Interrupteur } from "@/components/reglages-ui";
import { Application, CoinParents } from "@/pages/profil";
import { dire, taire, useParle } from "@/lib/parole";
import { ouvrirPlume, usePlume } from "@/lib/plume";
import { VITESSES, choisirDireBoutons, choisirGrosTexte, choisirVitesseVoix, direBoutons, grosTexte, vitesseVoix, type Vitesse } from "@/lib/reglages";
import { activerSons, sonsActifs } from "@/lib/sons";
import { choisirLectureLongue, lectureLongue } from "@/lib/lecture-longue";
import { MAX_BONUS, useCompagnon, useCompagnons } from "@/lib/compagnons";
import { CARACTERES, NUM, creerBonus } from "@/lib/personnages";
import { choisirPlumeParle, plumeParleSeule } from "@/lib/plume";

/*
 * Les options, rangées en menus et sous-menus :
 *  - en haut, les personnages (on touche un personnage : sa page s'ouvre, avec sa voix, sa tenue, ses paroles…) ;
 *  - en dessous, quelques grosses tuiles : chacune ouvre un petit écran avec peu de réglages.
 * Chaque réglage est écrit en phrases simples, et Plume peut le lire à voix haute (le petit haut-parleur).
 */

const VOIX: Interrupteur[] = [
  { id: "seule", titre: "Plume lit toute seule", explication: "Quand Plume explique quelque chose, elle le lit aussi à voix haute, sans qu'on appuie.", lire: plumeParleSeule, choisir: choisirPlumeParle },
  { id: "longue", titre: "Appuyer longtemps pour écouter", explication: "Appuie longtemps sur un texte, et Plume te le lit à voix haute.", lire: lectureLongue, choisir: choisirLectureLongue },
  { id: "boutons", titre: "Dire le nom des boutons", explication: "Quand tu touches un bouton de la barre du bas, Plume dit son nom.", lire: direBoutons, choisir: choisirDireBoutons },
];

const SONS: Interrupteur[] = [
  { id: "sons", titre: "Sons des jeux", explication: "Les petits bruits quand on ouvre un paquet de cartes, ou quand on gagne.", lire: sonsActifs, choisir: activerSons },
];

const ECRAN: Interrupteur[] = [
  { id: "gros", titre: "Écrire plus gros", explication: "Toutes les lettres de l'application deviennent un peu plus grandes.", lire: grosTexte, choisir: choisirGrosTexte },
];

const NOM_VITESSE: Record<Vitesse, string> = { lente: "lente", normale: "normale", rapide: "rapide" };

const TEXTE_ACCUEIL = [
  "Les options.",
  "En haut, tes personnages : Plume discrète, présente, étudiante ou passionnée, et tes personnages bonus. Touche-en un pour le choisir et régler sa voix.",
  "En dessous, quelques boutons : la voix et les sons, l'apparence, les présentations, la boîte à idées, l'application, et un coin pour les grandes personnes.",
].join(" ");

export function OptionsPage({ params }: { params?: URLSearchParams }) {
  const s = params?.get("s");
  if (s === "voix") return <SousVoix />;
  if (s === "apparence") return <SousApparence />;
  if (s === "presentations") return <SousPresentations />;
  if (s === "dex") return <SousDex />;
  if (s === "appli") return <SousAppli />;
  if (s === "parents") return <SousParents />;
  return <Accueil creer={!!params?.get("creer")} />;
}

// ------------------------------------------------------------ l'écran principal
function Accueil({ creer }: { creer: boolean }) {
  const parle = useParle();
  const { gagne } = useDex();
  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-4">
      <Entete siVide="/" />
      <Titre>Options</Titre>
      {voixPossible() ? (
        <button type="button" onClick={() => (parle ? taire() : dire(TEXTE_ACCUEIL))} className="mx-auto mt-2 flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-extrabold ring-1 ring-white/20">
          <LuVolume2 className="size-4" aria-hidden="true" />
          {parle ? "Arrêter" : "Écouter"}
        </button>
      ) : null}

      <ChoixPersonnages ouvrirCreation={creer} />

      <h2 className="mt-7 text-center font-display text-xl text-[#f3d48a]">Les réglages</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Tuile href="#/options?s=voix" icone="🔊" titre="Voix et sons" />
        <Tuile href="#/options?s=apparence" icone="🎨" titre="Apparence" />
        <Tuile href="#/options?s=presentations" icone="👋" titre="Présentations" />
        {gagne ? <Tuile href="#/options?s=dex" icone="🏆" titre="Le Plumedex" /> : null}
        <Tuile href="#/idees" icone="💡" titre="Boîte à idées" />
        <Tuile href="#/options?s=appli" icone="📱" titre="L'application" />
        <Tuile href="#/options?s=parents" icone="🛡️" titre="Grandes personnes" />
        <Tuile href="#/sources" icone="📚" titre="Sources" />
      </div>
    </main>
  );
}

/** Les personnages : les quatre Plume, le repos, et les personnages bonus. Toucher un personnage ouvre sa page. */
function ChoixPersonnages({ ouvrirCreation }: { ouvrirCreation: boolean }) {
  const { presence } = usePlume();
  const actif = useCompagnon();
  const bonus = useCompagnons();
  const [creation, setCreation] = useState(ouvrirCreation);
  const vides = Math.max(0, MAX_BONUS - bonus.length);
  const plumeActive = (id: string) => !actif && presence === id;
  return (
    <section className="mt-5" aria-label="Mes personnages">
      <h2 className="text-center font-display text-xl text-[#f3d48a]">Choisis ton personnage</h2>

      <div className="carte-nuit mt-2 rounded-[1.75rem] px-2 py-3">
        <p className="px-2 text-xs font-extrabold uppercase tracking-wide text-[#f3d48a]/80">Plume</p>
        <ul className="mt-1 grid grid-cols-4 gap-1">
          {CARACTERES.map((p) => (
            <li key={p.id}>
              <Pastille href={`#/personnage?id=${p.id}`} actif={plumeActive(p.id)} nom={p.court}>
                <PlumeDessin caractere={p.num} className="size-full" />
              </Pastille>
            </li>
          ))}
        </ul>
        <a href="#/personnage?id=repos" className={`mx-2 mt-2 flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-extrabold ${plumeActive("repos") ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>
          😴 Plume se repose {plumeActive("repos") ? "✓" : ""}
        </a>

        <p className="mt-4 px-2 text-xs font-extrabold uppercase tracking-wide text-[#f3d48a]/80">Mes personnages bonus</p>
        <ul className="mt-1 grid grid-cols-4 gap-1">
          {bonus.map((c) => (
            <li key={c.id}>
              <Pastille href={`#/personnage?id=${c.id}`} actif={actif?.id === c.id} nom={c.nom}>
                <PlumeDessin caractere={NUM[c.caractere]} look={c.look} className="size-full" />
              </Pastille>
            </li>
          ))}
          {vides > 0 ? (
            <li>
              <button type="button" onClick={() => setCreation(true)} className="flex w-full flex-col items-center px-0.5 py-1 text-center" aria-label="Créer un personnage bonus">
                <span className="grid size-[4.25rem] place-items-center rounded-full bg-gradient-to-b from-[#ff6b5a] to-[#d2302a] text-4xl font-black leading-none text-white shadow-[0_0_16px_rgba(226,69,60,.45)]">＋</span>
                <span className="mt-1 text-[11px] font-extrabold leading-tight">{bonus.length ? "Un autre" : "Créer le tien"}</span>
              </button>
            </li>
          ) : null}
        </ul>
      </div>
      {creation ? <CreerPersonnage onFermer={() => setCreation(false)} /> : null}
    </section>
  );
}

function Pastille({ href, actif, nom, children }: { href: string; actif: boolean; nom: string; children: ReactNode }) {
  return (
    <a href={href} aria-current={actif ? "true" : undefined} className="flex flex-col items-center px-0.5 py-1 text-center transition-transform active:scale-95">
      <span className={`relative block size-[4.25rem] rounded-full bg-[#2a1844] p-1 ${actif ? "ring-4 ring-[#f3d48a] shadow-[0_0_18px_rgba(243,212,138,.6)]" : "ring-1 ring-white/20"}`}>
        {children}
        {actif ? <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-[#5cc28a] text-sm font-black text-[#0f3320] ring-2 ring-[#26153f]">✓</span> : null}
      </span>
      <span className="mt-1 max-w-full truncate text-[11px] font-extrabold leading-tight">{nom}</span>
    </a>
  );
}

/** « Comment il s'appelle ? » : on crée le personnage tout de suite, puis on règle le reste dans sa page. */
function CreerPersonnage({ onFermer }: { onFermer: () => void }) {
  const [nom, setNom] = useState("");
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = avant);
  }, []);
  function creer() {
    const c = creerBonus(nom);
    onFermer();
    window.location.hash = `#/personnage?id=${c.id}`;
  }
  return createPortal(
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/65 px-4 backdrop-blur-sm" role="dialog" aria-label="Créer un personnage bonus">
      <div className="carte-nuit apparait w-full max-w-sm rounded-[1.75rem] px-5 pb-5 pt-4 text-center text-white">
        <PlumeDessin anim="coucou" className="mx-auto h-28 w-28" />
        <p className="font-display text-2xl text-[#f3d48a]">Un nouveau personnage !</p>
        <p className="mt-1 text-sm texte-doux">Comment s'appelle-t-il ? Ensuite, tu choisiras sa tenue, sa voix et ses paroles.</p>
        <input
          autoFocus
          value={nom}
          maxLength={16}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && creer()}
          placeholder="Pompon"
          aria-label="Son nom"
          className="mt-3 w-full rounded-full bg-white/10 px-4 py-3 text-center text-xl font-extrabold text-white outline-none placeholder:text-white/35"
        />
        <button type="button" onClick={creer} className="bouton-jeu mt-3 w-full rounded-full py-3.5 font-display text-xl">Créer ➜</button>
        <button type="button" onClick={onFermer} className="mt-2 w-full rounded-full py-2 text-sm font-extrabold texte-doux">Plus tard</button>
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------ les sous-menus
function SousPage({ titre, icone, sous, children }: { titre: string; icone: string; sous?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-4">
      <Entete siVide="/options" />
      <TitreSous icone={icone} sous={sous}>{titre}</TitreSous>
      {children}
    </main>
  );
}

function SousVoix() {
  const voix = voixPossible();
  return (
    <SousPage titre="Voix et sons" icone="🔊" sous="Choisir la voix de chaque personnage se fait dans sa page.">
      {voix ? (
        <CartePage>
          <ChoixVitesse />
          {VOIX.map((r) => <Ligne key={r.id} r={r} />)}
          {SONS.map((r) => <Ligne key={r.id} r={r} />)}
        </CartePage>
      ) : (
        <CartePage>
          <p className="px-1 py-2 text-sm">La voix n'est pas disponible sur cet appareil.</p>
          {SONS.map((r) => <Ligne key={r.id} r={r} />)}
        </CartePage>
      )}
    </SousPage>
  );
}

function SousApparence() {
  return (
    <SousPage titre="Apparence" icone="🎨" sous="Comment l'application s'ouvre et se présente.">
      <CartePage>
        <ChoixInterface />
        {ECRAN.map((r) => <Ligne key={r.id} r={r} />)}
      </CartePage>
    </SousPage>
  );
}

/** Les deux présentations, au même endroit. */
function SousPresentations() {
  const [sur, setSur] = useState(false);
  return (
    <SousPage titre="Présentations" icone="👋" sous="Pour retrouver les explications de Plume.">
      <div className="mt-4 space-y-3 rounded-3xl bg-card px-4 py-4 text-[#2a1c14]">
        <div>
          <button type="button" onClick={() => (sur ? revivrePremiereFois() : setSur(true))} className="w-full rounded-full bg-[#6a3fc0] py-3 font-extrabold text-white">
            {sur ? "Oui, on recommence comme la première fois" : "Présentation pour un nouvel utilisateur"}
          </button>
          <p className="mt-1 text-center text-xs">Comme la toute première fois : Plume présente toute l'application et comment lui parler, puis réexplique chaque page. Les cartes, les progrès et les réglages sont gardés.</p>
          {sur ? <button type="button" onClick={() => setSur(false)} className="mx-auto mt-1 block text-sm font-extrabold underline">Non, annuler</button> : null}
        </div>
        <div>
          <button type="button" onClick={() => ouvrirPlume(true, "presentation")} className="w-full rounded-full bg-[#efe3ff] py-3 font-extrabold text-[#4a2a8a]">
            Plume se présente
          </button>
          <p className="mt-1 text-center text-xs">Plume redit sa présentation tout de suite, toute seule, puis propose les explications en détail.</p>
        </div>
      </div>
    </SousPage>
  );
}

/** Le Plumedex : visible seulement quand il a été gagné (toutes les tables de multiplication). */
function SousDex() {
  const { gagne, actif } = useDex();
  return (
    <SousPage titre="Le Plumedex" icone="🏆">
      <div className="mt-4 rounded-3xl bg-card px-4 py-3 text-[#2a1c14]">
        {gagne ? (
          <button type="button" onClick={() => activerDex(!actif)} className="flex w-full items-center justify-between gap-3 text-left font-extrabold">
            <span>Le cadre du Plumedex autour de l'application</span>
            <span className={`rounded-full px-3 py-1 text-sm ${actif ? "bg-[#b3261e] text-white" : "bg-[#e8d9bf]"}`}>{actif ? "Allumé" : "Éteint"}</span>
          </button>
        ) : (
          <p className="font-bold">Pas encore gagné : il faut remplir toutes les tables de multiplication de 1 à 9 (Jouer → Les tables magiques).</p>
        )}
      </div>
    </SousPage>
  );
}

function SousAppli() {
  return (
    <SousPage titre="L'application" icone="📱">
      <Application />
    </SousPage>
  );
}

function SousParents() {
  return (
    <SousPage titre="Grandes personnes" icone="🛡️">
      <CoinParents />
    </SousPage>
  );
}

// ------------------------------------------------------------ les réglages détaillés
function ChoixVitesse() {
  const [v, setV] = useState<Vitesse>(vitesseVoix);
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-2">
        <BoutonEcouter texte={() => `La vitesse de la voix. En ce moment, elle est ${NOM_VITESSE[vitesseVoix()]}.`} label="Vitesse de la voix" />
        <div className="flex-1">
          <p className="font-extrabold leading-tight">Vitesse de la voix</p>
          <p className="text-xs leading-snug">Plume parle plus lentement, ou plus vite.</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Vitesse de la voix">
        {VITESSES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={v === x.id}
            onClick={() => {
              choisirVitesseVoix(x.id);
              setV(x.id);
              dire(x.id === "lente" ? "Je parle doucement." : x.id === "rapide" ? "Je parle plus vite !" : "Je parle normalement.");
            }}
            className={`min-h-11 rounded-2xl font-extrabold ${v === x.id ? "bouton-bois" : "bg-[#f3e2c2]"}`}
          >
            {x.nom}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Changer l'interface : comment les pages s'ouvrent, le style des boutons du bas, et le bouton à mettre en avant. */
function ChoixInterface() {
  const i = useInterface();
  const Choix = ({ titre, sous, options, valeur, choisir }: { titre: string; sous: string; options: { id: string; nom: string }[]; valeur: string; choisir: (id: string) => void }) => (
    <div className="py-2.5">
      <p className="font-extrabold leading-tight">{titre}</p>
      <p className="text-xs leading-snug">{sous}</p>
      <div className={`mt-2 grid gap-2 ${options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`} role="group" aria-label={titre}>
        {options.map((x) => (
          <button key={x.id} type="button" aria-pressed={valeur === x.id} onClick={() => choisir(x.id)} className={`min-h-11 rounded-2xl px-1 text-sm font-extrabold leading-tight ${valeur === x.id ? "bouton-bois" : "bg-[#f3e2c2]"}`}>{x.nom}</button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <Choix titre="Quand une page s'ouvre" sous="Après un bouton du bas : la page monte comme un volet, sort du centre, ou s'affiche tout de suite." options={[{ id: "volet", nom: "Volet du bas" }, { id: "centre", nom: "Du centre" }, { id: "aucune", nom: "Sans animation" }]} valeur={i.ouverture} choisir={(id) => changerInterface({ ouverture: id as Ouverture })} />
      <Choix titre="Les boutons du bas" sous="De vrais boutons qui s'enfoncent, ou des médailles dessinées." options={[{ id: "3d", nom: "Boutons 3D" }, { id: "medailles", nom: "Médailles" }]} valeur={i.boutons} choisir={(id) => changerInterface({ boutons: id as StyleBoutons })} />
      <Choix titre="Mettre un bouton en avant" sous="Le bouton choisi est plus gros que les autres." options={[{ id: "", nom: "Aucun" }, { id: "/", nom: "Accueil" }, { id: "/arbre", nom: "Arbre" }, { id: "/voyageurs", nom: "Carte" }, { id: "/cartes", nom: "Cartes" }, { id: "/jouer", nom: "Jouer" }]} valeur={i.vedette ?? ""} choisir={(id) => changerInterface({ vedette: id || null })} />
    </>
  );
}


import { revivrePremiereFois } from "@/lib/plume";
import { activerDex, useDex } from "@/lib/dex";
import { useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuFeather, LuMonitorSmartphone, LuMusic, LuShieldCheck, LuSparkles, LuType, LuVolume2 } from "react-icons/lu";
import { Entete, Titre } from "@/components/entete";
import { PlumeDessin } from "@/components/plume-dessin";
import { voixPossible } from "@/components/voix";
import { Application, CoinParents } from "@/pages/profil";
import { dire, taire, useParle } from "@/lib/parole";
import {
  choisirPlumeBouge,
  choisirPlumeExplique,
  choisirReactions,
  PRESENCES,
  choisirPlumeParle,
  choisirPresence,
  plumeParleSeule,
  ouvrirPlume,
  usePlume,
  plumeBouge,
  plumeExpliqueSeule,
  reactionsActives,
} from "@/lib/plume";
import { VITESSES, choisirDireBoutons, choisirGrosTexte, choisirVitesseVoix, direBoutons, grosTexte, vitesseVoix, type Vitesse } from "@/lib/reglages";
import { activerSons, sonsActifs } from "@/lib/sons";
import { choisirLectureLongue, lectureLongue } from "@/lib/lecture-longue";
import { presence as presenceActuelle } from "@/lib/plume";
import { MAX_BONUS, choisirCompagnon, useCompagnon, useCompagnons } from "@/lib/compagnons";

/*
 * Les options : chaque réglage est écrit en phrases simples, et Plume peut le lire à voix haute
 * (le petit haut-parleur à côté de chaque réglage, ou « Écouter toute la page »).
 */

type Interrupteur = { id: string; titre: string; explication: string; lire: () => boolean; choisir: (oui: boolean) => void };

const VOIX: Interrupteur[] = [
  { id: "seule", titre: "Plume lit toute seule", explication: "Quand Plume explique quelque chose, elle le lit aussi à voix haute, sans qu'on appuie.", lire: plumeParleSeule, choisir: choisirPlumeParle },
  { id: "longue", titre: "Appuyer longtemps pour écouter", explication: "Appuie longtemps sur un texte, et Plume te le lit à voix haute.", lire: lectureLongue, choisir: choisirLectureLongue },
  { id: "boutons", titre: "Dire le nom des boutons", explication: "Quand tu touches un bouton de la barre du bas, Plume dit son nom.", lire: direBoutons, choisir: choisirDireBoutons },
];

const PLUME: Interrupteur[] = [
  { id: "explique", titre: "Plume explique chaque nouvelle page", explication: "La première fois que tu ouvres une page, Plume vient t'expliquer. Sinon, elle attend que tu la touches.", lire: plumeExpliqueSeule, choisir: choisirPlumeExplique },
  { id: "reactions", titre: "Plume te félicite pendant les jeux", explication: "Une petite bulle à côté de Plume quand tu gagnes ou quand tu te trompes.", lire: reactionsActives, choisir: choisirReactions },
  { id: "bouge", titre: "Plume fait coucou", explication: "De temps en temps, Plume agite son aile pour te dire bonjour.", lire: plumeBouge, choisir: choisirPlumeBouge },
];

const SONS: Interrupteur[] = [
  { id: "sons", titre: "Sons des jeux", explication: "Les petits bruits quand on ouvre un paquet de cartes, ou quand on gagne.", lire: sonsActifs, choisir: activerSons },
];

const ECRAN: Interrupteur[] = [
  { id: "gros", titre: "Écrire plus gros", explication: "Toutes les lettres de l'application deviennent un peu plus grandes.", lire: grosTexte, choisir: choisirGrosTexte },
];

const NOM_VITESSE: Record<Vitesse, string> = { lente: "lente", normale: "normale", rapide: "rapide" };

function texteInterrupteur(r: Interrupteur) {
  return `${r.titre}. ${r.explication} En ce moment : ${r.lire() ? "oui" : "non"}.`;
}

function textePage() {
  const morceaux = [
    "Les options. Ici, tu choisis comment marche ton encyclopédie.",
    "La voix.",
    `La vitesse de la voix. En ce moment, elle est ${NOM_VITESSE[vitesseVoix()]}.`,
    ...VOIX.map(texteInterrupteur),
    "Plume.",
    `Comment Plume reste avec toi. En ce moment : ${PRESENCES.find((p) => p.id === presenceActuelle())?.nom}.`,
    ...PRESENCES.map((p) => `${p.nom} : ${p.explique}`),
    ...PLUME.map(texteInterrupteur),
    "Tout en haut, les présentations : pour un nouvel utilisateur, ou juste Plume qui se présente.",
    ...SONS.map(texteInterrupteur),
    ...ECRAN.map(texteInterrupteur),
    "Tout en bas, il y a la version de l'application, et un coin pour les grandes personnes.",
  ];
  return morceaux.join(" ");
}

export function OptionsPage() {
  const parle = useParle();
  const voix = voixPossible();
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre sous="Ici, tu choisis comment marche ton encyclopédie. Touche le haut-parleur pour que Plume te lise un réglage.">Options</Titre>
      {voix ? (
        <button
          type="button"
          onClick={() => (parle ? taire() : dire(textePage()))}
          className="bouton-bois mx-auto mt-4 flex min-h-12 items-center gap-2 rounded-full px-5 font-extrabold"
        >
          <LuVolume2 className="size-5" aria-hidden="true" />
          {parle ? "Arrêter la lecture" : "Écouter toute la page"}
        </button>
      ) : null}

      <Presentations />

      <Groupe icone={LuVolume2} titre="La voix">
        {voix ? <ChoixVitesse /> : <p className="px-1 py-2 text-sm">La voix n'est pas disponible sur cet appareil.</p>}
        {voix ? VOIX.map((r) => <Ligne key={r.id} r={r} />) : null}
      </Groupe>

      <Groupe icone={LuFeather} titre="Plume">
        <ChoixPresence />
        {PLUME.map((r) => (
          <Ligne key={r.id} r={r} />
        ))}

      </Groupe>

      <ChoixDex />

      <Groupe icone={LuMusic} titre="Les sons">
        {SONS.map((r) => (
          <Ligne key={r.id} r={r} />
        ))}
      </Groupe>

      <Groupe icone={LuType} titre="L'écran">
        {ECRAN.map((r) => (
          <Ligne key={r.id} r={r} />
        ))}
      </Groupe>

      <h2 className="mt-7 flex items-center justify-center gap-2 font-display text-2xl text-[#f3d48a]">
        <LuMonitorSmartphone className="size-6" aria-hidden="true" />
        L'application
      </h2>
      <Application />

      <h2 className="mt-7 flex items-center justify-center gap-2 font-display text-2xl text-[#f3d48a]">
        <LuShieldCheck className="size-6" aria-hidden="true" />
        Pour les grandes personnes
      </h2>
      <CoinParents />
      <a href="#/sources" className="mt-4 block text-center font-extrabold underline">
        Sources et crédits
      </a>
    </main>
  );
}

/** Le Plumedex : visible seulement quand il a été gagné (toutes les tables de multiplication). */
function ChoixDex() {
  const { gagne, actif } = useDex();
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 px-1 font-display text-2xl text-[#f3d48a]">Le Plumedex</h2>
      <div className="mt-2 rounded-3xl bg-card px-4 py-3 text-[#2a1c14]">
        {gagne ? (
          <button type="button" onClick={() => activerDex(!actif)} className="flex w-full items-center justify-between gap-3 text-left font-extrabold">
            <span>Le cadre du Plumedex autour de l'application</span>
            <span className={`rounded-full px-3 py-1 text-sm ${actif ? "bg-[#b3261e] text-white" : "bg-[#e8d9bf]"}`}>{actif ? "Allumé" : "Éteint"}</span>
          </button>
        ) : (
          <p className="font-bold">Pas encore gagné : il faut remplir toutes les tables de multiplication de 1 à 9 (Jouer → Les tables magiques).</p>
        )}
      </div>
    </section>
  );
}

/** Les deux présentations, au même endroit. */
function Presentations() {
  const [sur, setSur] = useState(false);
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 px-1 font-display text-2xl text-[#f3d48a]">
        <LuSparkles className="size-6" aria-hidden="true" />
        Les présentations
      </h2>
      <div className="mt-2 space-y-3 rounded-3xl bg-card px-4 py-4 text-[#2a1c14]">
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
    </section>
  );
}

function Groupe({ icone: Icone, titre, children }: { icone: IconType; titre: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 px-1 font-display text-2xl text-[#f3d48a]">
        <Icone className="size-6" aria-hidden="true" />
        {titre}
      </h2>
      <div className="mt-2 divide-y divide-[#a07a45]/30 rounded-3xl bg-card px-3 py-1 text-[#2a1c14]">{children}</div>
    </section>
  );
}

function BoutonEcouter({ texte, label }: { texte: () => string; label: string }) {
  if (!voixPossible()) return null;
  return (
    <button type="button" onClick={() => dire(texte())} aria-label={`Écouter : ${label}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#efe3ff] text-[#6a3fc0]">
      <LuVolume2 className="size-5" aria-hidden="true" />
    </button>
  );
}

function Ligne({ r }: { r: Interrupteur }) {
  const [oui, setOui] = useState(r.lire);
  return (
    <div className="flex items-center gap-2 py-2.5">
      <BoutonEcouter texte={() => texteInterrupteur(r)} label={r.titre} />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold leading-tight">{r.titre}</p>
        <p className="text-xs leading-snug">{r.explication}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={oui}
        aria-label={r.titre}
        onClick={() => {
          r.choisir(!oui);
          setOui(!oui);
          if (direBoutons() && voixPossible()) dire(oui ? "Non" : "Oui");
        }}
        className={`relative h-9 w-[4.6rem] shrink-0 rounded-full text-xs font-black transition-colors ${oui ? "bg-[#4f9a4a] text-white" : "bg-[#cdb89a] text-[#4a3a2a]"}`}
      >
        <span className={`absolute top-1 size-7 rounded-full bg-white shadow transition-all ${oui ? "left-[calc(100%-2rem)]" : "left-1"}`} />
        <span className={`absolute inset-y-0 grid place-items-center ${oui ? "left-2.5" : "right-2.5"}`}>{oui ? "Oui" : "Non"}</span>
      </button>
    </div>
  );
}

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

function ChoixPresence() {
  const { presence } = usePlume();
  const perso = useCompagnon();
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-2">
        <BoutonEcouter texte={() => `Comment Plume reste avec toi. ${PRESENCES.map((p) => `${p.nom} : ${p.explique}`).join(" ")}`} label="Comment Plume reste avec toi" />
        <div className="flex-1">
          <p className="font-extrabold leading-tight">Le caractère de Plume</p>
          <p className="text-xs leading-snug">Tu peux aussi appuyer longtemps sur Plume.</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Le caractère de Plume">
        {PRESENCES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={presence === p.id && !perso}
            onClick={() => {
              choisirCompagnon(null);
              choisirPresence(p.id);
              if (voixPossible() && p.id !== "repos") dire(p.explique);
            }}
            className={`rounded-2xl px-3 py-2 text-left ${presence === p.id && !perso ? "bouton-bois" : "bg-[#f3e2c2]"}`}
          >
            {p.id !== "repos" ? (
              <span className="mb-1 flex justify-center gap-1">
                <PlumeDessin caractere={({ discrete: 1, presente: 2, etudiante: 3, passionnee: 4 } as const)[p.id as "discrete"]} className="size-16" />
                <PlumeDessin caractere={({ discrete: 1, presente: 2, etudiante: 3, passionnee: 4 } as const)[p.id as "discrete"]} lit className="size-16" />
              </span>
            ) : null}
            <span className="block font-extrabold leading-tight">{p.nom}</span>
            <span className="block text-[11px] leading-snug">{p.explique}</span>
          </button>
        ))}
      </div>
      <PersonnagesBonus />
    </div>
  );
}

/** Les personnages bonus : à la suite des 4 caractères de Plume. Jusqu'à 4, créés par la famille. */
function PersonnagesBonus() {
  const liste = useCompagnons();
  const actif = useCompagnon();
  const vides = Math.max(0, MAX_BONUS - liste.length);
  return (
    <div className="mt-4">
      <p className="font-extrabold leading-tight">Les personnages bonus</p>
      <p className="text-xs leading-snug">Crée jusqu'à {MAX_BONUS} compagnons : ils font tout comme Plume (aider, réagir, jouer), avec leur nom, leur look, leur caractère et tes paroles enregistrées.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {liste.map((c) => (
          <div key={c.id} className={`rounded-2xl px-2 py-2 text-center ${actif?.id === c.id ? "bouton-bois" : "bg-[#f3e2c2]"}`}>
            <button type="button" onClick={() => { choisirCompagnon(c.id); choisirPresence(c.caractere); }} className="block w-full" aria-pressed={actif?.id === c.id}>
              <PlumeDessin caractere={({ discrete: 1, presente: 2, etudiante: 3, passionnee: 4 } as const)[c.caractere]} look={c.look} className="mx-auto size-16" />
              <span className="block font-extrabold leading-tight">{c.nom}</span>
              <span className="block text-[11px] leading-snug">{c.age ? `${c.age} ans · ` : ""}{c.createur ? `créé par ${c.createur}` : "personnage bonus"}</span>
            </button>
            <a href={`#/atelier?id=${c.id}`} className="mt-1 inline-block text-xs font-extrabold underline">Modifier</a>
          </div>
        ))}
        {vides > 0 ? (
          <a href="#/atelier" className="grid min-h-28 place-items-center rounded-2xl bg-gradient-to-b from-[#ff6b5a] to-[#d2302a] px-2 py-2 text-center font-extrabold text-white shadow-[0_0_18px_rgba(226,69,60,.45)]">
            <span><span className="block text-4xl leading-none">＋</span>{liste.length ? "Encore un personnage" : "Créer un personnage bonus"}<span className="block text-[11px] font-bold opacity-85">{vides} place{vides > 1 ? "s" : ""} libre{vides > 1 ? "s" : ""}</span></span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

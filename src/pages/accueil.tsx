import { Suspense, lazy, useEffect, useState, type ComponentType } from "react";
import { LuBone, LuBookOpen, LuChevronRight, LuCrown, LuDices, LuDog, LuFlame, LuHourglass, LuLayers, LuMap, LuPawPrint, LuSearch, LuSettings, LuTv } from "react-icons/lu";
import { Installer } from "@/components/installer";
import { voixPossible } from "@/components/voix";
import { avatar } from "@/lib/reglages";
import { paquetsDisponibles, paquetsIllimites } from "@/lib/recompenses";
import { lireVues } from "@/lib/carnet";
import { defiFait, serie } from "@/lib/defis";
import { dire } from "@/lib/parole";
import { plumeDit, plumeParleSeule, plumePeutProposer, presentationFaite } from "@/lib/plume";

// La carte du monde de l'Aventure est lourde : elle se charge juste après la page.
const CarteAventure = lazy(() => import("@/components/carte-aventure"));

/*
 * La page d'accueil, centrée sur Leonie :
 * son nom en grand (Plume lui dit un mot depuis son coin), le voyage dans le temps au milieu,
 * puis Jouer, Mes cartes, l'Aventure et les autres salles.
 */

type Medaillon = { vers: string; image: string; label: string; x: number; y: number };

const BRANCHES: Medaillon[] = [
  { vers: "/arbre/reptiles", image: "evo/accueil-reptiles.webp", label: "Reptiles", x: 50, y: 13 },
  { vers: "/arbre/bacteries", image: "evo/bacteries.webp", label: "Bactéries", x: 83, y: 31.5 },
  { vers: "/arbre/archees", image: "evo/archees.webp", label: "Archées", x: 83, y: 68.5 },
  { vers: "/arbre/animaux", image: "evo/animaux.webp", label: "Animaux", x: 50, y: 87 },
  { vers: "/arbre/champignons", image: "evo/champignons.webp", label: "Champignons", x: 17, y: 68.5 },
  { vers: "/arbre/plantes", image: "evo/plantes.webp", label: "Plantes", x: 17, y: 31.5 },
];

const PETITS: { vers: string; label: string; icone: ComponentType<{ className?: string }>; fond: string }[] = [
  { vers: "/animaux", label: "Animaux", icone: LuPawPrint, fond: "linear-gradient(160deg,#e2843f,#a84e1c)" },
  { vers: "/fossiles", label: "Fossiles", icone: LuBone, fond: "linear-gradient(160deg,#a99067,#6b5a3a)" },
  { vers: "/frise", label: "Frise", icone: LuHourglass, fond: "linear-gradient(160deg,#5fc2b0,#2f7d6d)" },
  { vers: "/lexique", label: "Vrais mots", icone: LuBookOpen, fond: "linear-gradient(160deg,#f07aa8,#b8457a)" },
  { vers: "/compagnons", label: "Chiens et chats", icone: LuDog, fond: "linear-gradient(160deg,#f0b860,#b5562a)" },
  { vers: "/kratt", label: "Frères Kratt", icone: LuTv, fond: "linear-gradient(160deg,#6fd36a,#1f7a3a)" },
];

/** Ce que Plume dit à Leonie en arrivant, selon ce qui l'attend. */
function phraseDuJour(paquets: number, defi: boolean, jours: number) {
  const phrases: string[] = [];
  if (paquets > 0) phrases.push(paquets > 1 ? `Tu as ${paquets} paquets de cartes à ouvrir !` : "Tu as un paquet de cartes à ouvrir !");
  if (defi) phrases.push(jours > 0 ? `Le défi du jour t'attend. Ta flamme : ${jours} jour${jours > 1 ? "s" : ""} !` : "Le défi du jour t'attend !");
  if (!defi && jours > 1) phrases.push(`Bravo, ${jours} jours de défi d'affilée !`);
  if (!phrases.length) phrases.push("Coucou Leonie ! On continue l'aventure ?", "Quel animal on découvre aujourd'hui ?", "Je suis contente de te revoir, Leonie !");
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function Accueil() {
  const illimite = paquetsIllimites();
  const paquets = illimite ? 0 : paquetsDisponibles();
  const defi = !defiFait();
  const jours = serie();
  const trouves = lireVues().length;
  const [image, setImage] = useState(avatar);
  useEffect(() => setImage(avatar()), []);
  // Plume dit un petit mot depuis son coin, si elle n'est pas en mode discret.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!plumePeutProposer() || !presentationFaite()) return;
      const phrase = phraseDuJour(paquets, defi, jours);
      plumeDit(phrase, 4500);
      if (plumeParleSeule() && voixPossible()) dire(phrase);
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="mx-auto max-w-xl px-3.5 pt-3">
      {/* Le nom de Leonie */}
      <header className="grid grid-cols-[3.6rem_1fr_3.6rem] items-center gap-1 pt-3">
        <a href="#/options" aria-label="Options" className="grid size-11 place-items-center rounded-full bg-[#2a1844] text-[#f3d48a] ring-1 ring-[#e8c98a]/50">
          <LuSettings className="size-5" aria-hidden="true" />
        </a>
        <div className="relative text-center">
          <LuCrown className="absolute left-1/2 top-0 size-6 -translate-x-1/2 -translate-y-[85%] text-[#f3d48a] drop-shadow-[0_0_8px_rgba(243,212,138,.7)]" aria-hidden="true" />
          <p className="font-display text-[13px] tracking-wide text-[#e7d7ff]">L'encyclopédie de la vie de</p>
          <h1 className="nom-leonie font-display text-[clamp(2.4rem,11vw,3.1rem)] leading-none">Leonie</h1>
        </div>
        <a href="#/profil" aria-label="Mon carnet" className="medaillon-or block size-13 justify-self-end overflow-hidden">
          <img src={image} alt="" className="size-full object-cover" />
        </a>
      </header>

      {/* Chercher un animal (ou sur la carte) */}
      <div className="mt-3 flex gap-2">
        <a href="#/chercher" className="flex min-h-11 flex-1 items-center gap-2 rounded-full border-2 border-[#e8c98a]/70 bg-card px-4 text-[#8a7462]">
          <LuSearch className="size-5 text-[#8d4e1f]" aria-hidden="true" />
          Chercher un animal…
        </a>
        <a href="#/chercher?carte=1" aria-label="Chercher sur la carte du monde" className="grid size-11 place-items-center rounded-full bg-[#2a1844] text-[#f3d48a] ring-1 ring-[#e8c98a]/50">
          <LuMap className="size-5" aria-hidden="true" />
        </a>
      </div>
      <Installer />

      {/* Le voyage dans le temps */}
      <div className="relative mx-auto mt-2 aspect-[300/282] w-full max-w-[22rem]">
        <span className="absolute left-1/2 top-1/2 size-[63%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#b48cff55,transparent_68%)]" />
        <span className="absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[#e8c98a55]" />
        {BRANCHES.map((b, i) => (
          <a
            key={b.vers}
            href={`#${b.vers}`}
            className="orbit bob-x absolute w-[18.5%] text-center"
            style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${i * 0.25}s` }}
          >
            <span className="medaillon-or block aspect-square w-full overflow-hidden">
              <img src={b.image} alt="" className="size-full object-cover" />
            </span>
            <span className="mt-1 block whitespace-nowrap font-display text-[clamp(.7rem,3vw,.85rem)] text-[#f3d48a] [text-shadow:0_1px_6px_#000]">{b.label}</span>
          </a>
        ))}
        <a
          href="#/arbre/terre"
          aria-label="Commencer au tout début de la vie"
          className="absolute left-1/2 top-1/2 w-[32%] -translate-x-1/2 -translate-y-1/2"
        >
          <span className="medaillon-or glow block aspect-square w-full overflow-hidden">
            <img src="evo/accueil-commencer.webp" alt="" className="size-full scale-110 object-cover" />
          </span>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[linear-gradient(180deg,#f3d48a,#d6a531)] px-3 py-0.5 font-display text-sm text-[#2a1650]">
            Commencer
          </span>
        </a>
      </div>

      {/* Jouer et Mes cartes */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <a href="#/jouer" className="relative min-h-[6.2rem] overflow-hidden rounded-[1.4rem] bg-[linear-gradient(160deg,#ff9f4a,#c2402a)] px-3 py-2.5 shadow-[0_10px_22px_rgba(0,0,0,.45)]">
          <span className="block font-display text-[1.35rem] text-white">Jouer</span>
          <span className="block text-[12.5px] font-bold leading-tight text-white/90">Défi du jour, mémoire, cris d'animaux…</span>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-black text-white">
            <LuFlame className="size-3.5" aria-hidden="true" />
            {defi ? "Défi à faire" : `${jours} jour${jours > 1 ? "s" : ""}`}
          </span>
          <LuDices className="absolute -bottom-1 right-1 size-12 text-white/35" aria-hidden="true" />
        </a>
        <a href="#/cartes" className="relative min-h-[6.2rem] overflow-hidden rounded-[1.4rem] bg-[linear-gradient(160deg,#a57bf0,#5b2fa8)] px-3 py-2.5 shadow-[0_10px_22px_rgba(0,0,0,.45)]">
          <span className="block font-display text-[1.35rem] text-white">Mes cartes</span>
          <span className="block text-[12.5px] font-bold leading-tight text-white/90">
            {trouves} animal{trouves > 1 ? "ux" : ""} trouvé{trouves > 1 ? "s" : ""}
          </span>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-black text-white">
            {illimite ? "Paquets illimités" : paquets > 0 ? `${paquets} paquet${paquets > 1 ? "s" : ""} à ouvrir` : "Voir l'album"}
          </span>
          <LuLayers className="absolute -bottom-1 right-1 size-12 text-white/35" aria-hidden="true" />
        </a>
      </div>

      {/* L'Aventure */}
      <a href="#/voyageurs" className="relative mt-2.5 block h-[7.4rem] overflow-hidden rounded-[1.4rem] border-2 border-[#e8c98a] bg-[#14214a] shadow-[0_10px_22px_rgba(0,0,0,.45)]">
        <Suspense fallback={null}>
          <CarteAventure petite />
        </Suspense>
        <span className="absolute left-3 top-2">
          <span className="block font-display text-[1.35rem] text-[#f3d48a] [text-shadow:0_2px_6px_#000]">Aventure</span>
          <span className="block text-[12.5px] font-bold text-[#dbe6ff] [text-shadow:0_1px_4px_#000]">Les animaux voyageurs, suivis par GPS</span>
        </span>
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-0.5 rounded-full bg-[#f3d48a] px-3 py-1 text-[13px] font-black text-[#2a1650]">
          Explorer
          <LuChevronRight className="size-4" aria-hidden="true" />
        </span>
      </a>

      {/* Les autres salles */}
      <nav className="mt-3 grid grid-cols-6 gap-0.5" aria-label="Les autres salles">
        {PETITS.map(({ vers, label, icone: Icone, fond }) => (
          <a key={vers} href={`#${vers}`} className="text-center text-[10.5px] font-extrabold leading-tight">
            <span className="mx-auto mb-1 grid size-11 place-items-center rounded-2xl text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.2),0_6px_12px_rgba(0,0,0,.35)]" style={{ background: fond }}>
              <Icone className="size-6" aria-hidden="true" />
            </span>
            {label}
          </a>
        ))}
      </nav>
    </main>
  );
}

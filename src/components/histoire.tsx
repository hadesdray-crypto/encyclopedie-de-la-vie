// L'histoire de Plume à l'écran : les scènes (l'ami arrive, les câlins, l'œuf, le bébé),
// l'ami et le bébé qui restent à côté de Plume, et le braconnier qu'on fait tomber d'un toucher.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PlumeDessin } from "@/components/plume-dessin";
import type { Look } from "@/components/garde-robe";
import { dire } from "@/lib/parole";
import { plumeAPeur, plumeDit, plumeFete, plumeGeste } from "@/lib/plume";
import {
  NOMS_AMI, NOMS_BEBE, ageBebe, amiPresent, bebePresent, braconnierEstVenu, braconnierPossible, braconnierRenvoye,
  nommerAmi, nommerBebe, noterOuverture, oeufPresent, sceneEnAttente, sceneVue, useHistoire, type Scene,
} from "@/lib/histoire";

export const LOOK_AMI: Look = { couleur: "bleu", epaisseur: 2, haut: "echarpe", bas: "aucun", chapeau: "aucun", lunettes: "rondes", chaussures: "aucune", objet: "aucun", couleurs: { haut: "rouge" } };
export const LOOK_BEBE: Look = { couleur: "gris", epaisseur: 3, haut: "aucun", bas: "aucun", chapeau: "aucun", lunettes: "aucune", chaussures: "aucune", objet: "aucun", couleurs: {} };

/** Tout ce qui vit autour de Plume. À placer une fois dans l'application. */
export function Histoire() {
  useEffect(() => noterOuverture(), []);
  return (
    <>
      <Scenes />
      <FamillePresDePlume />
      <Braconnier />
    </>
  );
}

// ------------------------------------------------------------ dessins
export function Oeuf({ className = "", tremble = true }: { className?: string; tremble?: boolean }) {
  return (
    <svg viewBox="0 0 100 120" className={`${className} ${tremble ? "hist-oeuf" : ""}`} aria-label="L'œuf de Plume" role="img">
      <ellipse cx="50" cy="112" rx="34" ry="6" fill="#000" opacity=".25" />
      <path d="M50 6 C78 6 92 48 92 72 C92 98 73 112 50 112 C27 112 8 98 8 72 C8 48 22 6 50 6 Z" fill="#fff6e4" stroke="#e8d3a8" strokeWidth="3" />
      <circle cx="34" cy="50" r="5" fill="#e9d2a6" />
      <circle cx="62" cy="38" r="4" fill="#e9d2a6" />
      <circle cx="66" cy="78" r="6" fill="#e9d2a6" />
      <circle cx="40" cy="88" r="3.5" fill="#e9d2a6" />
      <path d="M30 28 C36 18 44 14 50 14" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".9" />
    </svg>
  );
}

export function Couple({ ami = true, oeuf = false, bebe = false, coeurs = false, triste = false }: { ami?: boolean; oeuf?: boolean; bebe?: boolean; coeurs?: boolean; triste?: boolean }) {
  return (
    <div className="relative mx-auto flex h-36 items-end justify-center">
      <PlumeDessin anim={triste ? "triste" : "coucou"} className="hist-bob h-32 w-32" />
      {oeuf ? <Oeuf className="-mx-3 mb-1 h-14 w-12" /> : null}
      {bebe ? <PlumeDessin look={LOOK_BEBE} anim="coucou" className="hist-bob -mx-4 h-16 w-16 [animation-delay:.4s]" /> : null}
      {ami ? <PlumeDessin look={LOOK_AMI} anim={coeurs ? "bravo" : "coucou"} miroir className="hist-bob h-32 w-32 [animation-delay:.8s]" /> : null}
      {coeurs ? ["10%", "45%", "75%"].map((l, k) => <span key={l} className="hist-coeur absolute text-2xl" style={{ left: l, bottom: "60%", animationDelay: `${k * 0.6}s` }}>💞</span>) : null}
    </div>
  );
}

// ------------------------------------------------------------ scènes
const TEXTES: Record<Scene, (ami: string) => { titre: string; texte: string }> = {
  ami: () => ({ titre: "Toc, toc !", texte: "Ce matin, un petit hibou est venu frapper au nid de Plume. Il est un peu timide… Il aimerait bien rester quelques jours. Comment s'appelle-t-il ? C'est toi qui choisis !" }),
  calins: (a) => ({ titre: "Psst… un secret !", texte: `Hier soir, quand la tablette dormait, Plume et ${a} s'ennuyaient un peu. Alors ils se sont fait plein de câlins d'amoureux ! Ils sont amoureux, maintenant.` }),
  ventre: (a) => ({ titre: "Aïe, aïe…", texte: `Plume a un peu mal au ventre aujourd'hui. Elle reste bien au chaud dans le nid, et ${a} lui apporte à manger. Qu'est-ce qui va se passer ? Reviens demain !` }),
  oeuf: (a) => ({ titre: "Surprise !!!", texte: `Plume a pondu un œuf ! Chez les chouettes, c'est surtout la maman qui couve, et le papa apporte à manger. ${a} est très fier. Aide Plume : va dans le nid et réchauffe l'œuf une fois par jour.` }),
  eclosion: () => ({ titre: "Crac… crac… CRAC !", texte: "L'œuf s'est ouvert : le bébé est né ! C'est un poussin tout doux, couvert de duvet. Comment va-t-il s'appeler ? C'est toi qui choisis !" }),
};

function Scenes() {
  const h = useHistoire();
  const enAttente = sceneEnAttente(h);
  const [prete, setPrete] = useState(false);
  // On laisse l'application s'ouvrir avant de montrer la scène.
  useEffect(() => {
    setPrete(false);
    if (!enAttente) return;
    // On attend que rien d'autre ne soit ouvert (la bulle de Plume, une autre fenêtre).
    const t = window.setInterval(() => {
      if (!document.querySelector('[role="dialog"]')) {
        setPrete(true);
        window.clearInterval(t);
      }
    }, 2500);
    return () => window.clearInterval(t);
  }, [enAttente]);
  if (!enAttente || !prete) return null;
  const ami = h.nomAmi ?? "son ami";
  const { titre, texte } = TEXTES[enAttente](ami);
  const choix = enAttente === "ami" ? NOMS_AMI : enAttente === "eclosion" ? NOMS_BEBE : null;
  const choisir = (nom: string) => {
    if (enAttente === "ami") nommerAmi(nom);
    else nommerBebe(nom);
    sceneVue(enAttente);
    plumeFete();
  };
  return createPortal(
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 px-4 backdrop-blur-sm" role="dialog" aria-label={titre}>
      <div className="carte-nuit apparait w-full max-w-sm rounded-[1.75rem] px-5 pb-5 pt-4 text-center text-white">
        <Couple
          coeurs={enAttente === "calins"}
          triste={enAttente === "ventre"}
          oeuf={enAttente === "oeuf"}
          bebe={enAttente === "eclosion"}
        />
        <p className="mt-2 font-display text-2xl text-[#f3d48a]">{titre}</p>
        <p className="mt-2 text-[15px] leading-relaxed">{texte}</p>
        <button type="button" onClick={() => dire(`${titre} ${texte}`)} className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-sm font-extrabold">🔊 Écouter</button>
        {choix ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {choix.map((n) => (
              <button key={n} type="button" onClick={() => choisir(n)} className="bouton-bois rounded-2xl py-3 font-extrabold">{n}</button>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex justify-center gap-2">
            {enAttente === "oeuf" ? (
              <a href="#/nid" onClick={() => sceneVue(enAttente)} className="rounded-full bg-[#f3d48a] px-5 py-3 font-extrabold text-[#2a1650]">🪺 Aller au nid</a>
            ) : null}
            <button type="button" onClick={() => sceneVue(enAttente)} className="bouton-bois rounded-full px-6 py-3 font-extrabold">{enAttente === "calins" ? "Trop mignon !" : "D'accord !"}</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------ la famille à côté de Plume
/** Où est Plume à l'écran (elle peut se déplacer) : on la cherche régulièrement. */
function usePositionPlume() {
  const [r, setR] = useState<DOMRect | null>(null);
  useEffect(() => {
    const f = () => {
      const el = document.querySelector(".plume-racine");
      const b = el?.getBoundingClientRect();
      setR((avant) => {
        if (!b || b.width < 10) return null;
        if (avant && Math.abs(avant.left - b.left) < 2 && Math.abs(avant.top - b.top) < 2 && Math.abs(avant.width - b.width) < 2) return avant;
        return b;
      });
    };
    f();
    const t = window.setInterval(f, 400);
    return () => window.clearInterval(t);
  }, []);
  return r;
}

function FamillePresDePlume() {
  const h = useHistoire();
  const r = usePositionPlume();
  if (!r || !amiPresent(h) || sceneEnAttente(h)) return null;
  const taille = Math.max(44, Math.min(80, r.height * 0.72));
  const aDroite = r.left + r.width / 2 > window.innerWidth / 2;
  const bebeL = bebePresent(h) ? taille * (0.55 + Math.min(ageBebe(h), 10) * 0.025) : 0;
  const oeufL = oeufPresent(h) ? taille * 0.4 : 0;
  const left = aDroite ? r.left - taille - bebeL - oeufL + 4 : r.right - 4;
  const bebe = bebePresent(h);
  const tailleBebe = bebeL;
  const boite = (t: number, enfant: ReactNode, cle: string) => <span key={cle} className="block shrink-0" style={{ width: t, height: t }}>{enfant}</span>;
  return (
    <a
      href="#/nid"
      aria-label={`${h.nomAmi}${bebe ? ` et ${h.nomBebe}` : ""} : aller au nid de Plume`}
      className="fixed z-[49] flex items-end transition-[left,top] duration-300"
      style={{ left, top: r.bottom - taille, height: taille, flexDirection: aDroite ? "row" : "row-reverse" }}
    >
      {bebe ? boite(tailleBebe, <PlumeDessin look={LOOK_BEBE} anim="rien" className="hist-bob size-full [animation-delay:.3s]" />, "b") : null}
      {oeufPresent(h) ? boite(taille * 0.4, <Oeuf className="size-full" />, "o") : null}
      {boite(taille, <PlumeDessin look={LOOK_AMI} anim="rien" miroir={!aDroite} className="hist-bob size-full" />, "a")}
    </a>
  );
}

// ------------------------------------------------------------ le braconnier
type Phase = "rien" | "arrive" | "tombe" | "releve" | "rate" | "part";

function DessinBraconnier({ phase }: { phase: Phase }) {
  const filetHaut = phase === "arrive";
  return (
    <svg viewBox="0 0 120 170" className="size-full overflow-visible" aria-hidden="true">
      <ellipse cx="55" cy="166" rx="30" ry="4" fill="#000" opacity=".3" />
      {/* jambes */}
      <g className={phase === "arrive" || phase === "part" ? "hist-marche" : ""}>
        <rect x="40" y="118" width="11" height="42" rx="5" fill="#4a3b2a" />
        <rect x="57" y="118" width="11" height="42" rx="5" fill="#3d3022" />
        <ellipse cx="44" cy="162" rx="11" ry="5" fill="#222" />
        <ellipse cx="65" cy="162" rx="11" ry="5" fill="#222" />
      </g>
      {/* corps : veste verte */}
      <rect x="32" y="70" width="46" height="56" rx="16" fill="#4d6b2f" />
      <rect x="52" y="74" width="5" height="48" fill="#3a5222" />
      <circle cx="47" cy="88" r="2.5" fill="#c9a24a" />
      <circle cx="47" cy="102" r="2.5" fill="#c9a24a" />
      {/* tête */}
      <circle cx="55" cy="52" r="20" fill="#f1c7a0" />
      <circle cx="62" cy="48" r="2.6" fill="#2a1c14" />
      <circle cx="49" cy="48" r="2.6" fill="#2a1c14" />
      <path d="M44 41 L52 43 M60 43 L68 40" stroke="#3a2a1a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 60 C49 55 61 55 67 60 C61 63 50 63 44 60 Z" fill="#5a3a22" />
      <circle cx="56" cy="55" r="3.4" fill="#e3a07a" />
      {phase === "releve" ? <path d="M48 66 Q55 62 62 66" stroke="#6a2a1a" strokeWidth="2" fill="none" /> : null}
      {/* chapeau */}
      <path d="M30 36 L80 36 L76 30 L68 16 L42 16 L34 30 Z" fill="#6b4a2a" />
      <rect x="26" y="33" width="58" height="6" rx="3" fill="#523720" />
      {/* bras et filet à papillons */}
      <g style={{ transformOrigin: "70px 84px", transform: filetHaut ? "rotate(-28deg)" : phase === "rate" ? "rotate(40deg)" : "rotate(10deg)", transition: "transform .35s" }}>
        <rect x="66" y="78" width="26" height="10" rx="5" fill="#4d6b2f" />
        <circle cx="93" cy="83" r="6" fill="#f1c7a0" />
        <rect x="91" y="20" width="4" height="70" rx="2" fill="#8a6a3a" />
        <ellipse cx="93" cy="14" rx="17" ry="11" fill="none" stroke="#7a5a2a" strokeWidth="3" />
        <path d="M77 14 Q93 50 109 14" fill="#ffffff" opacity=".55" stroke="#ddd" strokeWidth="1" />
        <path d="M82 18 L104 18 M85 26 L101 26 M89 34 L97 34" stroke="#ccc" strokeWidth=".8" />
      </g>
    </svg>
  );
}

function Braconnier() {
  const [phase, setPhase] = useState<Phase>("rien");
  const [pos, setPos] = useState({ x: -150, y: 0, duree: 0 });
  const boite = useRef<HTMLButtonElement>(null);
  const minuteurs = useRef<number[]>([]);
  const apres = (ms: number, f: () => void) => minuteurs.current.push(window.setTimeout(f, ms));
  useEffect(() => () => minuteurs.current.forEach(clearTimeout), []);

  // De temps en temps, s'il peut venir, il arrive.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (phase !== "rien" || document.hidden || !braconnierPossible()) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (Math.random() > 0.12) return;
      lancer();
    }, 15000);
    return () => window.clearInterval(t);
  }, [phase]);

  // Le coin des parents peut le faire venir tout de suite.
  useEffect(() => {
    const f = () => phase === "rien" && window.setTimeout(lancer, 1200);
    window.addEventListener("leonie-braconnier", f);
    return () => window.removeEventListener("leonie-braconnier", f);
  }, [phase]);

  function cible() {
    const b = document.querySelector(".plume-racine")?.getBoundingClientRect();
    const h = 150;
    if (b && b.width > 10) return { x: Math.max(8, b.left - 95), y: Math.min(window.innerHeight - h - 90, b.bottom - h) };
    return { x: window.innerWidth - 220, y: window.innerHeight - h - 120 };
  }
  function lancer() {
    braconnierEstVenu();
    const c = cible();
    setPos({ x: -150, y: c.y, duree: 0 });
    setPhase("arrive");
    requestAnimationFrame(() => requestAnimationFrame(() => setPos({ x: c.x, y: c.y, duree: 8 })));
    apres(900, () => plumeAPeur("Au secours ! Un braconnier avec un filet ! Touche-le vite pour le faire tomber !", 6000));
    apres(8600, () => setPhase((p) => {
      if (p !== "arrive") return p;
      plumeGeste("vole");
      plumeDit("Ouf ! Je me suis envolée juste à temps ! La prochaine fois, touche-le pour le faire tomber.", 5000);
      apres(1400, partir);
      return "rate";
    }));
  }
  function partir() {
    setPhase("part");
    setPos((p) => ({ ...p, x: -170, duree: 3.2 }));
    apres(3400, () => setPhase("rien"));
  }
  function toucher() {
    if (phase !== "arrive") return;
    const b = boite.current?.getBoundingClientRect();
    setPos((p) => ({ ...p, x: b ? b.left : p.x, duree: 0 }));
    setPhase("tombe");
    braconnierRenvoye();
    apres(1800, () => {
      setPhase("releve");
      apres(1500, () => {
        partir();
        plumeFete();
        plumeDit("Merci Leonie, tu m'as sauvée ! Les braconniers attrapent des animaux sauvages, et c'est interdit. Des gardes protègent les animaux dans les parcs.", 7000);
      });
    });
  }

  if (phase === "rien") return null;
  const rotation = phase === "tombe" ? "rotate(-88deg) translate(-40px, 10px)" : "none";
  return createPortal(
    <button
      ref={boite}
      type="button"
      onClick={toucher}
      aria-label="Le braconnier : touche-le pour le faire tomber"
      className="fixed z-[60] h-[150px] w-[106px] touch-manipulation"
      style={{ left: pos.x, top: pos.y, transition: `left ${pos.duree}s linear` }}
    >
      <span className="block size-full" style={{ transform: `${phase === "part" ? "scaleX(-1)" : ""} ${rotation}`, transformOrigin: "50% 95%", transition: "transform .35s cubic-bezier(.5,1.8,.6,1)" }}>
        <DessinBraconnier phase={phase} />
      </span>
      {phase === "tombe" ? <span className="hist-etoiles absolute -top-2 left-0 text-2xl">💫</span> : null}
      {phase === "releve" || phase === "rate" ? (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-3 py-1 text-sm font-black text-[#2a1650] shadow-lg">
          {phase === "releve" ? "Pfff… raté ! 😤" : "Raté !"}
        </span>
      ) : null}
    </button>,
    document.body,
  );
}

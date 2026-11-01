// L'histoire de Plume à l'écran : les scènes (un prétendant frappe au nid, les câlins, l'œuf, le bébé),
// le compagnon et le bébé qui restent à côté de Plume, et le braconnier qu'on fait tomber d'un toucher.
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PlumeDessin, type Caractere } from "@/components/plume-dessin";
import { Braconnier } from "@/components/braconnier";
import type { Look } from "@/components/garde-robe";
import { dire } from "@/lib/parole";
import { plumeFete } from "@/lib/plume";
import {
  NOMS_BEBE, accepterPretendant, ageBebe, amiPresent, bebePresent, nommerBebe, noterOuverture, oeufPresent,
  pretendantAmi, pretendantEnCours, refuserPretendant, refusDe, MAX_VISITES, visiteEnCours, sceneEnAttente, sceneVue, useHistoire, type Scene,
} from "@/lib/histoire";
import { NON, NON_DEFINITIF, OUI, type Pretendant } from "@/lib/pretendants";

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

/** Le compagnon de Plume : le dessin du prétendant qui est resté (ou, pour les anciennes parties, l'ancien hibou bleu). */
export function Compagnon({ p, anim = "coucou", miroir = true, className = "" }: { p: Pretendant | null; anim?: "coucou" | "bravo" | "rien" | "triste"; miroir?: boolean; className?: string }) {
  return p
    ? <PlumeDessin look={p.look} caractere={p.caractere} extra={p.extra} joues={p.joues} anim={anim} miroir={miroir} className={className} />
    : <PlumeDessin look={LOOK_AMI} anim={anim} miroir={miroir} className={className} />;
}

/** Plume, son compagnon (un peu plus grand qu'elle, jamais plus petit : sinon on le prendrait pour un enfant), l'œuf et le bébé. */
export function Couple({ ami = true, amiDe = null, oeuf = false, bebe = false, coeurs = false, triste = false }: { ami?: boolean; amiDe?: Pretendant | null; oeuf?: boolean; bebe?: boolean; coeurs?: boolean; triste?: boolean }) {
  return (
    <div className="relative mx-auto flex h-36 items-end justify-center">
      <PlumeDessin anim={triste ? "triste" : "coucou"} className="hist-bob h-32 w-32" />
      {oeuf ? <Oeuf className="-mx-3 mb-1 h-14 w-12" /> : null}
      {bebe ? <PlumeDessin look={LOOK_BEBE} anim="coucou" className="hist-bob -mx-4 h-16 w-16 [animation-delay:.4s]" /> : null}
      {ami ? <Compagnon p={amiDe} anim={coeurs ? "bravo" : "coucou"} className="hist-bob h-[8.4rem] w-[8.4rem] [animation-delay:.8s]" /> : null}
      {coeurs ? ["10%", "45%", "75%"].map((l, k) => <span key={l} className="hist-coeur absolute text-2xl" style={{ left: l, bottom: "60%", animationDelay: `${k * 0.6}s` }}>💞</span>) : null}
    </div>
  );
}

// ------------------------------------------------------------ scènes
const TEXTES: Record<Scene, (ami: string) => { titre: string; texte: string }> = {
  ami: () => pretendantEnCours().visites[visiteEnCours()],
  calins: (a) => ({ titre: "Psst… un secret !", texte: `Hier soir, quand la tablette dormait, Plume et ${a} s'ennuyaient un peu. Alors ils se sont fait plein de câlins d'amoureux ! Ils sont amoureux, maintenant.` }),
  ventre: (a) => ({ titre: "Aïe, aïe…", texte: `Plume a un peu mal au ventre aujourd'hui. Elle reste bien au chaud dans le nid, et ${a} lui apporte à manger. Qu'est-ce qui va se passer ? Reviens demain !` }),
  oeuf: (a) => ({ titre: "Surprise !!!", texte: `Plume a pondu un œuf ! Chez les chouettes, c'est surtout la maman qui couve, et le papa apporte à manger. ${a} est très fier. Aide Plume : va dans le nid et réchauffe l'œuf une fois par jour.` }),
  eclosion: () => ({ titre: "Crac… crac… CRAC !", texte: "L'œuf s'est ouvert : le bébé est né ! C'est un poussin tout doux, couvert de duvet. Comment va-t-il s'appeler ? C'est toi qui choisis !" }),
};

function Scenes() {
  const h = useHistoire();
  const enAttente = sceneEnAttente(h);
  const [prete, setPrete] = useState(false);
  // Après avoir répondu oui ou non, on montre la réponse, même si l'histoire a déjà avancé derrière.
  const [reponse, setReponse] = useState<{ oui: boolean; p: Pretendant } | null>(null);
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

  if (reponse) {
    const texte = reponse.oui ? OUI(reponse.p) : refusDe(reponse.p.id) >= MAX_VISITES ? NON_DEFINITIF(reponse.p) : NON(reponse.p);
    const titre = reponse.oui ? "Il reste !" : refusDe(reponse.p.id) >= MAX_VISITES ? "Au revoir…" : "Il s'en va…";
    return createPortal(
      <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 px-4 backdrop-blur-sm" role="dialog" aria-label={titre}>
        <div className="carte-nuit apparait w-full max-w-sm rounded-[1.75rem] px-5 pb-5 pt-4 text-center text-white">
          <Couple amiDe={reponse.p} coeurs={reponse.oui} triste={!reponse.oui} />
          <p className="mt-2 font-display text-2xl text-[#f3d48a]">{titre}</p>
          <p className="mt-2 text-[15px] leading-relaxed">{texte}</p>
          <button type="button" onClick={() => dire(`${titre} ${texte}`)} className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-sm font-extrabold">🔊 Écouter</button>
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => { if (reponse.oui) plumeFete(); setReponse(null); }} className="bouton-bois rounded-full px-6 py-3 font-extrabold">{reponse.oui ? "Trop mignon !" : "D'accord"}</button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }
  if (!enAttente || !prete) return null;
  const ami = h.nomAmi ?? "son compagnon";
  const { titre, texte } = TEXTES[enAttente](ami);
  const choix = enAttente === "eclosion" ? NOMS_BEBE : null;
  const prochain = enAttente === "ami" ? pretendantEnCours(h) : null;
  const choisir = (nom: string) => {
    nommerBebe(nom);
    sceneVue(enAttente);
    plumeFete();
  };
  const repondre = (oui: boolean) => {
    if (!prochain) return;
    setReponse({ oui, p: prochain });
    if (oui) {
      accepterPretendant();
      sceneVue("ami");
    } else refuserPretendant();
  };
  return createPortal(
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 px-4 backdrop-blur-sm" role="dialog" aria-label={titre}>
      <div className="carte-nuit apparait w-full max-w-sm rounded-[1.75rem] px-5 pb-5 pt-4 text-center text-white">
        <Couple
          amiDe={prochain ?? pretendantAmi(h)}
          coeurs={enAttente === "calins"}
          triste={enAttente === "ventre"}
          oeuf={enAttente === "oeuf"}
          bebe={enAttente === "eclosion"}
        />
        <p className="mt-2 font-display text-2xl text-[#f3d48a]">{titre}</p>
        <p className="mt-2 text-[15px] leading-relaxed">{texte}</p>
        {prochain ? <p className="mt-2 text-[15px] font-extrabold leading-relaxed">Plume te regarde. Elle attend ton conseil : est-ce qu'il peut rester ?</p> : null}
        <button type="button" onClick={() => dire(`${titre} ${texte}`)} className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-sm font-extrabold">🔊 Écouter</button>
        {prochain ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => repondre(true)} className="bouton-bois rounded-2xl py-3 font-extrabold">Oui, il reste</button>
            <button type="button" onClick={() => repondre(false)} className="rounded-2xl bg-white/12 py-3 font-extrabold">Pas maintenant</button>
          </div>
        ) : choix ? (
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
  // Le compagnon est un peu plus grand que Plume (jamais plus petit : on le prendrait pour un enfant).
  const taille = Math.max(60, r.height * 1.05);
  const aDroite = r.left + r.width / 2 > window.innerWidth / 2;
  const bebeL = bebePresent(h) ? taille * (0.55 + Math.min(ageBebe(h), 10) * 0.025) : 0;
  const oeufL = oeufPresent(h) ? taille * 0.4 : 0;
  const gauche = aDroite ? r.left - taille - bebeL - oeufL + 4 : r.right - 4;
  const left = Math.max(2, Math.min(window.innerWidth - taille - bebeL - oeufL - 2, gauche));
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
      {boite(taille, <Compagnon p={pretendantAmi(h)} anim="rien" miroir={!aDroite} className="hist-bob size-full" />, "a")}
    </a>
  );
}

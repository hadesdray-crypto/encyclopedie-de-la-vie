import { plumeFete } from "@/lib/plume";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { LuCircleHelp, LuMinus, LuPlus, LuX } from "react-icons/lu";
import type { Explication } from "@/data/guide";
import { COULEURS, NOMS_EQUIPES, garderJoueurs, type Joueur } from "@/lib/partie";
import { ouvrirRegles, plumeDit, plumePeutProposer } from "@/lib/plume";
import { FORCES, PLUME_JOUEUSE, garderForce, lireForce, plumeJoueuseDit, type Force } from "@/lib/plume-joueuse";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";

/*
 * La table de jeu, commune à tous les jeux à plusieurs.
 * - Préparation : les prénoms (2 à 4 joueurs), chacun pour soi ou en équipes, le face à face.
 * - Face à face : on pose le téléphone (ou la tablette) à plat ; chaque joueur a sa zone,
 *   tournée vers lui (en bas, en haut, à gauche, à droite). Au milieu, le jeu.
 * - On voit toujours à qui c'est le tour : sa zone s'allume, les autres s'assombrissent.
 */

export type Mode = "chacun" | "equipes";

export function BoutonRegles({ regles }: { regles: Explication }) {
  return (
    <button type="button" onClick={() => ouvrirRegles(regles)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#6a3fc0] px-4 font-extrabold text-white">
      <LuCircleHelp className="size-5" aria-hidden="true" /> Règles
    </button>
  );
}

export function Preparation({
  joueurs, setJoueurs, min = 1, mode, setMode, faceAFace, setFaceAFace, children, onJouer, sansFaceAFace = false, avecPlume = false,
}: {
  joueurs: Joueur[]; setJoueurs: (j: Joueur[]) => void; min?: number; mode: Mode; setMode: (m: Mode) => void;
  faceAFace: boolean; setFaceAFace: (b: boolean) => void; children?: ReactNode; onJouer: () => void; sansFaceAFace?: boolean; avecPlume?: boolean;
}) {
  const [force, setForce] = useState<Force>(lireForce);
  const plumeIci = joueurs.some((j) => j.plume);
  const humains = joueurs.filter((j) => !j.plume).length;
  const changer = (j: Joueur[]) => {
    setJoueurs(j);
    garderJoueurs(j);
  };
  return (
    <section className="mt-4 space-y-4">
      <div>
        <p className="px-1 text-sm font-black text-[#f0d090]">Les joueurs ({min === 1 ? "1" : "2"} à 4)</p>
        <ul className="mt-1.5 space-y-2">
          {joueurs.map((j, i) => (
            <li key={i} className="verre-jeu flex items-center gap-2 rounded-full px-2 py-1.5 text-white">
              <span className="grid size-9 shrink-0 place-items-center rounded-full font-black text-white" style={{ background: j.couleur }}>{j.plume ? "🦉" : (j.nom[0] ?? "?").toUpperCase()}</span>
              {j.plume ? <span className="min-w-0 flex-1 text-lg font-extrabold">Plume <span className="text-xs font-bold text-white/70">· {FORCES.find((f) => f.id === force)?.nom}</span></span> : <input
                value={j.nom}
                onChange={(e) => changer(joueurs.map((x, k) => (k === i ? { ...x, nom: e.target.value.slice(0, 14) } : x)))}
                aria-label={`Prénom du joueur ${i + 1}`}
                className="min-w-0 flex-1 bg-transparent text-lg font-extrabold text-white outline-none"
              />}
              {mode === "equipes" && joueurs.length > 2 ? (
                <button type="button" onClick={() => changer(joueurs.map((x, k) => (k === i ? { ...x, equipe: x.equipe ? 0 : 1 } : x)))} className={`rounded-full px-2.5 py-1 text-xs font-black ${j.equipe ? "bg-[#ffe7a8]" : "bg-[#e7d7ff]"}`}>
                  Équipe {NOMS_EQUIPES[j.equipe]}
                </button>
              ) : null}
              {joueurs.length > min && (j.plume || humains > 1) ? (
                <button type="button" onClick={() => changer(joueurs.filter((_, k) => k !== i))} aria-label={`Enlever ${j.nom}`} className="grid size-8 place-items-center rounded-full bg-white/15 text-white">
                  <LuMinus className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {avecPlume && !plumeIci && joueurs.length < 4 ? (
          <button type="button" onClick={() => changer([...joueurs, { ...PLUME_JOUEUSE, equipe: (joueurs.length % 2) as 0 | 1 }])} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8a5cf0] to-[#c27af0] py-2.5 font-extrabold text-white shadow-[0_0_20px_rgba(160,110,255,.45)]">
            🦉 Jouer avec Plume
          </button>
        ) : null}
        {avecPlume && plumeIci ? (
          <div className="verre-jeu mt-2 rounded-[1.4rem] px-3 py-2.5">
            <p className="text-sm font-black text-[#f3d48a]">La force de Plume</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {FORCES.map((f) => <Choix key={f.id} actif={force === f.id} onClick={() => { setForce(f.id); garderForce(f.id); }}>{f.nom}</Choix>)}
            </div>
            <p className="mt-1 text-xs text-white/75">{FORCES.find((f) => f.id === force)?.explique}</p>
          </div>
        ) : null}
        {joueurs.length < 4 ? (
          <button
            type="button"
            onClick={() => changer([...joueurs, { nom: `Joueur ${joueurs.length + 1}`, couleur: COULEURS[joueurs.length], equipe: (joueurs.length % 2) as 0 | 1 }])}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white/8 py-2.5 font-extrabold text-[#f3d48a] ring-1 ring-white/20"
          >
            <LuPlus className="size-5" /> Ajouter un joueur
          </button>
        ) : null}
      </div>

      {joueurs.length >= 3 ? (
        <div>
          <p className="px-1 text-sm font-black text-[#f0d090]">Comment on joue ?</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <Choix actif={mode === "chacun"} onClick={() => setMode("chacun")}>Chacun pour soi</Choix>
            <Choix actif={mode === "equipes"} onClick={() => setMode("equipes")}>En équipes ({NOMS_EQUIPES.join(" contre ")})</Choix>
          </div>
        </div>
      ) : null}

      {joueurs.length >= 2 && !sansFaceAFace ? (
        <label className="verre-jeu flex items-center gap-3 rounded-[1.4rem] px-3 py-2.5 text-white">
          <input type="checkbox" checked={faceAFace} onChange={(e) => setFaceAFace(e.target.checked)} className="size-6 accent-[#6a3fc0]" />
          <span>
            <span className="block font-extrabold">Face à face</span>
            <span className="block text-xs text-white/75">Le téléphone est posé à plat, chacun a son côté de l'écran. Plus pratique sur une tablette à 4.</span>
          </span>
        </label>
      ) : null}

      {children}

      <button type="button" onClick={onJouer} className="bouton-jeu w-full rounded-full py-3.5 font-display text-2xl">
        C'est parti ! ➜
      </button>
    </section>
  );
}

export function Choix({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={actif} onClick={onClick} className={`min-h-11 rounded-full px-3 py-2 text-sm font-extrabold leading-tight transition-all ${actif ? "bg-gradient-to-b from-[#fff0b8] to-[#f3c35a] text-[#2a1650] shadow-[0_0_18px_rgba(243,195,90,.5)]" : "verre-jeu text-white"}`}>
      {children}
    </button>
  );
}

/** Annonce du tour : écrit en grand, et dit par Plume si elle n'est pas discrète. */
export function useAnnonceTour(joueur: Joueur | undefined, cle: unknown, actif = true) {
  useEffect(() => {
    if (!joueur || !actif) return;
    if (joueur.plume) return plumeJoueuseDit("tour");
    if (plumePeutProposer()) {
      plumeDit(`À toi, ${joueur.nom} !`, 2000);
      if (voixPossible()) dire(`À toi, ${joueur.nom} !`);
    }
  }, [cle]);
}

/**
 * La table. zone(i) dessine la zone du joueur i ; centre, le plateau commun.
 * Sans face à face : les joueurs en haut, le plateau, puis la zone du joueur dont c'est le tour.
 */
export function Table({
  joueurs, actif, faceAFace, zone, centre, onQuitter,
}: {
  joueurs: Joueur[]; actif: number | null; faceAFace: boolean; zone: (i: number) => ReactNode; centre: ReactNode; onQuitter: () => void;
}) {
  if (!faceAFace || joueurs.length < 2) {
    return (
      <section className="mt-3">
        <div className="flex flex-wrap justify-center gap-1.5">
          {joueurs.map((j, i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-sm font-black transition-all ${i === actif ? "scale-110 text-white shadow-[0_0_14px_3px_rgba(255,255,255,.35)]" : "opacity-60"}`} style={{ background: i === actif ? j.couleur : "#2a1844", color: i === actif ? "#fff" : "#e7d7be" }}>
              {j.nom}
            </span>
          ))}
        </div>
        {actif !== null && joueurs.length > 1 ? (
          <p key={actif} className="arrivee mt-2 text-center font-display text-3xl" style={{ color: joueurs[actif].couleur, textShadow: "0 0 12px rgba(255,255,255,.35)" }}>
            À toi, {joueurs[actif].nom} !
          </p>
        ) : null}
        <div className="mt-3">{centre}</div>
        {actif !== null ? <div className="mt-3">{zone(actif)}</div> : null}
      </section>
    );
  }

  return <FaceAFace joueurs={joueurs} actif={actif} zone={zone} centre={centre} onQuitter={onQuitter} />;
}

function FaceAFace({ joueurs, actif, zone, centre, onQuitter }: { joueurs: Joueur[]; actif: number | null; zone: (i: number) => ReactNode; centre: ReactNode; onQuitter: () => void }) {
  // Pendant le face à face, Plume se cache (elle prendrait la place d'un joueur).
  useEffect(() => {
    document.body.dataset.faceAFace = "oui";
    return () => {
      delete document.body.dataset.faceAFace;
    };
  }, []);
  // Face à face : bas = joueur 1, haut = joueur 2 (à l'envers), gauche = joueur 3, droite = joueur 4.
  const n = joueurs.length;
  const cotes = n === 2;
  const Z = ({ i, sens }: { i: number; sens: "bas" | "haut" | "gauche" | "droite" }) => {
    const j = joueurs[i];
    const tour = i === actif;
    const rot = sens === "haut" ? "rotate(180deg)" : sens === "gauche" ? "rotate(90deg)" : sens === "droite" ? "rotate(-90deg)" : "";
    const lateral = sens === "gauche" || sens === "droite";
    return (
      <div className="relative overflow-hidden transition-all" style={{ background: tour ? j.couleur : "#1d1238", opacity: tour || actif === null ? 1 : 0.55, boxShadow: tour ? "inset 0 0 24px rgba(255,255,255,.4)" : "none" }}>
        <div
          className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center p-1.5 text-center"
          style={{ transform: `translate(-50%,-50%) ${rot}`, width: lateral ? "var(--h-milieu)" : "100%", height: lateral ? "var(--l-cote)" : "100%" }}
        >
          <p className="font-display text-lg leading-none text-white">{tour ? `À toi, ${j.nom} !` : j.nom}</p>
          <div className="mt-1 w-full min-h-0">{zone(i)}</div>
        </div>
      </div>
    );
  };
  return (
    <div
      className="fixed inset-0 z-[45] grid bg-[#0b0820]"
      style={
        {
          "--h-bord": cotes ? "26dvh" : "22dvh",
          "--h-milieu": cotes ? "48dvh" : "56dvh",
          "--l-cote": "21vw",
          gridTemplateRows: "var(--h-bord) var(--h-milieu) var(--h-bord)",
          gridTemplateColumns: n >= 3 ? "var(--l-cote) 1fr var(--l-cote)" : "1fr",
        } as CSSProperties
      }
    >
      <div style={{ gridColumn: n >= 3 ? "1 / 4" : "1" }} className="grid">
        <Z i={1} sens="haut" />
      </div>
      {n >= 3 ? <Z i={2} sens="gauche" /> : null}
      <div className="relative min-h-0 overflow-auto p-1.5">
        {centre}
        <button type="button" onClick={onQuitter} aria-label="Quitter la partie" className="absolute right-1 top-1 z-10 grid size-8 place-items-center rounded-full bg-[#2a1844] text-white">
          <LuX className="size-4" />
        </button>
      </div>
      {n >= 4 ? <Z i={3} sens="droite" /> : n === 3 ? <div /> : null}
      <div style={{ gridColumn: n >= 3 ? "1 / 4" : "1" }} className="grid">
        <Z i={0} sens="bas" />
      </div>
    </div>
  );
}

/** Le gagnant (ou l'équipe gagnante) à partir des points de chacun. */
export function vainqueur(joueurs: Joueur[], points: number[], mode: Mode) {
  plumeFete();
  if (mode === "equipes" && joueurs.length >= 3) {
    const t = [0, 0];
    joueurs.forEach((j, i) => (t[j.equipe] += points[i]));
    if (t[0] === t[1]) return { texte: "Égalité entre les deux équipes !", t };
    const e = t[0] > t[1] ? 0 : 1;
    return { texte: `L'équipe ${NOMS_EQUIPES[e]} gagne !`, t };
  }
  const max = Math.max(...points);
  const g = joueurs.filter((_, i) => points[i] === max);
  return { texte: g.length > 1 ? `Égalité : ${g.map((j) => j.nom).join(" et ")} !` : `${g[0].nom} gagne !`, t: points };
}

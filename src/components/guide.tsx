import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as PE } from "react";
import { LuBookOpen, LuChevronLeft, LuChevronRight, LuCircleHelp, LuLightbulb, LuPause, LuPlay, LuSettings, LuX } from "react-icons/lu";
import { ASTUCES, PRESENTATION, explicationPour } from "@/data/guide";
import { voixPossible } from "@/components/voix";
import { PlumeDessin, type AnimPlume, type Caractere } from "@/components/plume-dessin";
import {
  PRESENCES,
  choisirPresence,
  dejaExplique,
  marquerExplique,
  marquerPresentation,
  ouvrirPlume,
  plumeBouge,
  plumeExpliqueSeule,
  plumeCostumee,
  plumeParleSeule,
  plumePassionnee,
  plumePeutProposer,
  presence as presenceActuelle,
  plumePropose,
  presentationFaite,
  reglesEnCours,
  usePlume,
} from "@/lib/plume";
import { dire, taire, useParle } from "@/lib/parole";
import { aller } from "@/lib/routeur";
import { motDuLexique, type MotLexique } from "@/data/lexique";

/** La tenue de Plume : celle de son caractère (1 à 4). Les lunettes seulement quand elle lit. */
const CARACTERE: Record<string, Caractere> = { discrete: 1, presente: 2, etudiante: 3, passionnee: 4, repos: 0 };

/** Le titre de la page (pour le tableau noir de Plume). */
function titrePage() {
  return (document.querySelector("main h1")?.textContent ?? "").trim().slice(0, 40) || "Je t'explique !";
}

/** Les mots de scientifique visibles sur la page (ceux en pointillés). */
function motsDeLaPage(): MotLexique[] {
  const ids = [...new Set([...document.querySelectorAll<HTMLElement>("main [data-mot]")].map((b) => b.dataset.mot!))];
  return ids.map((id) => motDuLexique(id)).filter((m): m is MotLexique => !!m).slice(0, 14);
}

/*
 * Plume, la petite chouette de Leonie.
 * Elle flotte dans un coin de l'écran, au-dessus de la barre du bas. On peut la déplacer avec le doigt.
 * - On la touche : une petite bulle s'ouvre à côté d'elle (la page reste visible et utilisable).
 * - On appuie longtemps : on choisit si elle est discrète, présente, toujours là, ou au repos.
 * Elle ne s'ouvre jamais toute seule, sauf la toute première fois pour se présenter.
 */

type Position = { cote: "gauche" | "droite"; bas: number };
const CLE_POSITION = "leonie-plume-position";
const TAILLE = 62;

function lirePosition(): Position {
  try {
    const p = JSON.parse(localStorage.getItem(CLE_POSITION) || "null");
    if (p && (p.cote === "gauche" || p.cote === "droite") && typeof p.bas === "number") return p;
  } catch {
    /* rien */
  }
  return { cote: "droite", bas: 100 };
}

function garderPosition(p: Position) {
  try {
    localStorage.setItem(CLE_POSITION, JSON.stringify(p));
  } catch {
    /* rien */
  }
}

function limiterBas(bas: number) {
  return Math.max(92, Math.min(window.innerHeight - TAILLE - 70, bas));
}

export function Plume({ chemin, params }: { chemin: string; params: URLSearchParams }) {
  const { ouvert, contenu, reaction, proposition, presence, coucou } = usePlume();
  const parle = useParle();
  const [pos, setPos] = useState(lirePosition);
  const [glisse, setGlisse] = useState<{ x: number; y: number } | null>(null);
  const [anim, setAnim] = useState<AnimPlume>("rien");
  const depart = useRef<{ x: number; y: number; t: number; long: number; bouge: boolean } | null>(null);
  const premier = useRef(true);
  const explicationPage = explicationPour(chemin, params);

  // Première ouverture : Plume se présente. Ensuite, elle ne s'ouvre seule que si on l'a demandé dans les Options.
  useEffect(() => {
    if (premier.current && !presentationFaite()) {
      premier.current = false;
      marquerPresentation();
      marquerExplique(explicationPage.id);
      window.setTimeout(() => ouvrirPlume(true, "presentation"), 600);
      return;
    }
    premier.current = false;
    taire();
    if (plumeExpliqueSeule() && presence !== "repos" && !dejaExplique(explicationPage.id)) {
      marquerExplique(explicationPage.id);
      ouvrirPlume(true, "page");
    } else ouvrirPlume(false);
  }, [explicationPage.id]);

  // Une page avec des mots de scientifique : Plume propose (une fois) de les expliquer.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!plumePeutProposer() || !presentationFaite()) return;
      const mots = motsDeLaPage();
      if (mots.length < 2) return;
      const cle = `leonie-mots-proposes`;
      let vus: string[] = [];
      try {
        vus = JSON.parse(sessionStorage.getItem(cle) || "[]");
      } catch {
        /* rien */
      }
      if (vus.includes(explicationPage.id)) return;
      try {
        sessionStorage.setItem(cle, JSON.stringify([...vus, explicationPage.id]));
      } catch {
        /* rien */
      }
      plumePropose({ texte: "Il y a des mots de scientifique ici. Je te les explique ?", oui: "Oui", action: () => { plumePropose(null); ouvrirPlume(true, "mots"); } });
      window.setTimeout(() => plumePropose(null), 7000);
    }, 3500);
    return () => window.clearTimeout(t);
  }, [chemin]);

  // Passionnée : sur une page à lire, elle propose (une fois) de la lire, avec enthousiasme.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!plumePassionnee() || !plumePeutProposer() || !voixPossible()) return;
      const bouton = [...document.querySelectorAll<HTMLButtonElement>("main button")].find((b) => b.textContent?.trim() === "Écouter");
      if (!bouton) return;
      const cle = "leonie-lecture-proposee";
      let vus: string[] = [];
      try {
        vus = JSON.parse(sessionStorage.getItem(cle) || "[]");
      } catch {
        /* rien */
      }
      if (vus.includes(chemin)) return;
      try {
        sessionStorage.setItem(cle, JSON.stringify([...vus, chemin]));
      } catch {
        /* rien */
      }
      plumePropose({ texte: "Oh, je peux te lire tout ça ? J'adore expliquer !", oui: "Oui, lis !", action: () => { plumePropose(null); bouton.click(); } });
      window.setTimeout(() => plumePropose(null), 8000);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [chemin, presence]);

  // Petit coucou de l'aile : quand elle s'ouvre, et rarement de temps en temps.
  useEffect(() => {
    if (!coucou) return;
    setAnim("coucou");
    const t = window.setTimeout(() => setAnim("rien"), 1600);
    return () => window.clearTimeout(t);
  }, [coucou]);
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible" && plumeBouge() && presenceActuelle() !== "discrete" && Math.random() < (plumePassionnee() ? 0.7 : 0.25)) {
        setAnim("coucou");
        window.setTimeout(() => setAnim("rien"), 1600);
      }
    }, 45000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const replacer = () => setPos((p) => ({ ...p, bas: limiterBas(p.bas) }));
    window.addEventListener("resize", replacer);
    return () => window.removeEventListener("resize", replacer);
  }, []);

  // Au repos, Plume se cache (sauf pour sa toute première présentation).
  if (presence === "repos" && !(ouvert && contenu === "presentation")) return null;

  function appui(e: PE<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const long = window.setTimeout(() => {
      if (depart.current && !depart.current.bouge) {
        depart.current = null;
        navigator.vibrate?.(15);
        ouvrirPlume(true, "presence");
      }
    }, 600);
    depart.current = { x: e.clientX, y: e.clientY, t: Date.now(), long, bouge: false };
  }

  function deplacement(e: PE<HTMLButtonElement>) {
    const d = depart.current;
    if (!d) return;
    if (!d.bouge && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) {
      d.bouge = true;
      window.clearTimeout(d.long);
    }
    if (d.bouge) setGlisse({ x: e.clientX, y: e.clientY });
  }

  function lacher(e: PE<HTMLButtonElement>) {
    const d = depart.current;
    depart.current = null;
    if (!d) return;
    window.clearTimeout(d.long);
    if (d.bouge) {
      const p: Position = { cote: e.clientX < window.innerWidth / 2 ? "gauche" : "droite", bas: limiterBas(window.innerHeight - e.clientY - TAILLE / 2) };
      setPos(p);
      garderPosition(p);
      setGlisse(null);
      return;
    }
    // Un simple toucher : ouvrir ou fermer la bulle.
    // Si elle parle, un toucher l'arrête et ouvre sa bulle.
    if (parle) {
      taire();
      ouvrirPlume(true, motsDeLaPage().length ? "mots" : "page");
    } else if (ouvert) {
      taire();
      ouvrirPlume(false);
    } else ouvrirPlume(true, "page");
  }

  const gauche = pos.cote === "gauche";
  const style: CSSProperties = glisse
    ? { left: glisse.x - TAILLE / 2, top: glisse.y - TAILLE / 2, width: TAILLE, height: TAILLE }
    : { [gauche ? "left" : "right"]: 10, bottom: `calc(env(safe-area-inset-bottom, 0px) + ${pos.bas}px)`, width: TAILLE, height: TAILLE };
  const cote = gauche ? "left-full ml-1.5 rounded-bl-sm" : "right-full mr-1.5 rounded-br-sm";

  return (
    <>
      <div className={`plume-racine fixed z-50 ${glisse ? "" : "transition-[left,right,bottom] duration-300"}`} style={style}>
        <button
          type="button"
          onPointerDown={appui}
          onPointerMove={deplacement}
          onPointerUp={lacher}
          onPointerCancel={() => {
            if (depart.current) window.clearTimeout(depart.current.long);
            depart.current = null;
            setGlisse(null);
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Plume. Touche pour de l'aide, appuie longtemps pour la régler."
          aria-expanded={ouvert}
          className={`block size-full touch-none select-none ${glisse || ouvert || parle ? "" : presence === "passionnee" ? "plume-impatiente" : presence === "discrete" ? "" : "plume-flotte"}`}
        >
          <span className="absolute inset-1 -z-10 rounded-full bg-[radial-gradient(circle,rgba(180,140,255,.45),transparent_70%)]" />
          {parle ? <span className="onde-plume pointer-events-none absolute -inset-1 -z-10 rounded-full border-2 border-[#c9a4ff]" /> : null}
          {presence === "passionnee" && !ouvert ? (
            <>
              <span className="etincelle pointer-events-none absolute -left-2 top-1 text-sm text-[#f3d48a]">✦</span>
              <span className="etincelle etincelle-2 pointer-events-none absolute -right-1 top-4 text-xs text-[#9fe3ff]">✦</span>
              <span className="etincelle etincelle-3 pointer-events-none absolute -top-2 left-1/2 text-[10px] text-[#ff9fcf]">✦</span>
            </>
          ) : null}
          <span className="block size-full transition-transform duration-300" style={{ transform: parle ? "rotate(-8deg) translateY(2px)" : "none" }}>
            <PlumeDessin anim={parle ? "parle" : ouvert ? "ailes" : anim} caractere={CARACTERE[presence] ?? 0} lit={parle} className="size-full drop-shadow-[0_6px_10px_rgba(0,0,0,.5)]" />
          </span>
        </button>

        {/* Passionnée : quand elle lit, un petit tableau noir à côté d'elle. */}
        {parle && !ouvert && presence === "passionnee" ? (
          <span className={`tableau-noir arrivee pointer-events-none absolute bottom-full mb-2 w-52 rounded-lg px-3 py-2.5 text-center ${gauche ? "left-0" : "right-0"}`}>
            <span className="craie block text-[11px] tracking-widest opacity-80">★ LEÇON DE PLUME ★</span>
            <span className="craie mt-1 block font-display text-lg leading-tight">{titrePage()}</span>
            <span className="craie mt-1 block text-sm tracking-[0.3em] opacity-90">? → ! ✦</span>
          </span>
        ) : null}

        {/* Quand Plume parle, bulle fermée : un petit bouton Pause à côté d'elle. */}
        {parle && !ouvert ? (
          <button type="button" onClick={taire} aria-label="Pause" className={`arrivee absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-[#6a3fc0] text-white shadow-lg ring-2 ring-[#fff3d0] ${gauche ? "left-full ml-1.5" : "right-full mr-1.5"}`}>
            <LuPause className="size-5" />
          </button>
        ) : null}

        {/* Une petite phrase, quelques secondes. */}
        {reaction && !ouvert && !parle && !proposition ? (
          <span role="status" className={`arrivee pointer-events-none absolute bottom-3 w-max max-w-[min(15rem,70vw)] rounded-2xl bg-[#fff8ea] px-3 py-2 text-sm font-extrabold leading-snug text-[#4a2a8a] shadow-[0_6px_18px_rgba(0,0,0,.4)] ${cote}`}>
            {reaction}
          </span>
        ) : null}

        {/* Une proposition d'aide : on peut dire oui, ou l'ignorer. */}
        {proposition && !ouvert && !parle ? (
          <div role="status" className={`arrivee absolute bottom-2 w-max max-w-[min(15rem,70vw)] rounded-2xl bg-[#fff8ea] px-3 py-2 text-[#4a2a8a] shadow-[0_6px_18px_rgba(0,0,0,.45)] ${cote}`}>
            <p className="text-sm font-extrabold leading-snug">{proposition.texte}</p>
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={proposition.action} className="min-h-9 rounded-full bg-[#6a3fc0] px-3 text-sm font-extrabold text-white">
                {proposition.oui}
              </button>
              <button type="button" onClick={() => plumePropose(null)} className="min-h-9 rounded-full px-2 text-sm font-extrabold underline">
                Non merci
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {ouvert ? <Bulle chemin={chemin} params={params} pos={pos} /> : null}
    </>
  );
}

/** La petite bulle de Plume, posée à côté d'elle. Elle se referme quand on touche ailleurs. */
function Bulle({ chemin, params, pos }: { chemin: string; params: URLSearchParams; pos: Position }) {
  const { contenu, presence } = usePlume();
  const parle = useParle();
  const ref = useRef<HTMLDivElement>(null);
  const explicationPage = explicationPour(chemin, params);
  const astuces = ASTUCES[explicationPage.id] ?? ASTUCES.accueil;
  const [astuce, setAstuce] = useState(() => Math.floor(Math.random() * astuces.length));
  const mots = contenu === "mots" ? motsDeLaPage() : [];
  const [motChoisi, setMotChoisi] = useState<string | null>(null);
  useEffect(() => setMotChoisi(null), [contenu]);
  const defMot = motChoisi ? motDuLexique(motChoisi) : undefined;
  const explication =
    contenu === "mots"
      ? { id: "mots", titre: "Les mots de cette page", etapes: [defMot ? `${defMot.mot} : ${defMot.definition}` : mots.length ? "Touche un mot, je te l'explique." : "Il n'y a pas de mot compliqué sur cette page."] }
      : contenu === "presentation" ? PRESENTATION : contenu === "regles" && reglesEnCours() ? reglesEnCours()! : contenu === "astuce" ? { id: "astuce", titre: "Une astuce", etapes: [astuces[astuce % astuces.length]] } : explicationPage;
  const [etape, setEtape] = useState(0);
  const [lecture, setLecture] = useState(false);

  useEffect(() => setEtape(0), [contenu]);

  const texte = explication.etapes[etape] ?? explication.etapes[0];
  const derniere = etape >= explication.etapes.length - 1;
  const voix = voixPossible();

  // Plume lit si on le lui a demandé (bouton Écouter, ou « toujours avec moi »).
  useEffect(() => {
    if (contenu !== "presence" && !(contenu === "mots" && motChoisi) && voix && (plumeParleSeule() || lecture)) dire(texte);
  }, [texte, contenu]);

  // Toucher ailleurs referme la bulle (la page reste utilisable).
  useEffect(() => {
    const dehors = (e: PointerEvent) => {
      const cible = e.target as Node;
      if (ref.current?.contains(cible)) return;
      if ((cible as HTMLElement).closest?.('[aria-label^="Plume."]')) return;
      fermer();
    };
    const t = window.setTimeout(() => document.addEventListener("pointerdown", dehors), 50);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", dehors);
    };
  }, []);

  function fermer() {
    taire();
    ouvrirPlume(false);
  }

  const gauche = pos.cote === "gauche";
  const style: CSSProperties = {
    [gauche ? "left" : "right"]: 10,
    bottom: `calc(env(safe-area-inset-bottom, 0px) + ${pos.bas + TAILLE + 6}px)`,
  };
  const haut = pos.bas > window.innerHeight * 0.55;
  if (haut) {
    delete style.bottom;
    style.top = `calc(${window.innerHeight - pos.bas + 6}px)`;
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Plume : ${contenu === "presence" ? "comment je reste" : explication.titre}`}
      className={`arrivee fixed z-50 w-[min(20rem,calc(100vw-1.25rem))] rounded-3xl border-2 border-[#c9a4ff] bg-[#fff8ea] px-3.5 pb-3 pt-2.5 text-[#2a1c14] shadow-[0_16px_36px_rgba(0,0,0,.55)] ${haut ? "" : gauche ? "rounded-bl-md" : "rounded-br-md"}`}
      style={style}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 font-display text-lg leading-tight text-[#6a3fc0]">{contenu === "presence" ? "Je reste comment ?" : explication.titre}</p>
        <button type="button" onClick={fermer} aria-label="Fermer" className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-[#7a5a8a]">
          <LuX className="size-5" />
        </button>
      </div>

      {contenu === "presence" ? (
        <ul className="mt-1.5 space-y-1.5">
          {PRESENCES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={presence === p.id}
                onClick={() => {
                  choisirPresence(p.id);
                  if (voix && p.id !== "repos") dire(p.explique);
                }}
                className={`w-full rounded-2xl px-3 py-2 text-left ${presence === p.id ? "bg-[#6a3fc0] text-white" : "bg-[#efe3ff] text-[#2a1c14]"}`}
              >
                <span className="block font-extrabold leading-tight">{p.nom}</span>
                <span className="block text-xs leading-snug">{p.explique}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {explication.etapes.length > 1 ? (
            <p className="mt-1 flex gap-1" aria-label={`Bulle ${etape + 1} sur ${explication.etapes.length}`}>
              {explication.etapes.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full ${i === etape ? "w-4 bg-[#6a3fc0]" : "w-1.5 bg-[#d9c7f0]"}`} />
              ))}
            </p>
          ) : null}
          <p key={`${contenu}-${etape}-${motChoisi}`} className="arrivee mt-1.5 text-[1.05rem] leading-snug">
            {texte}
          </p>
          {contenu === "mots" && mots.length ? (
            <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {mots.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMotChoisi(m.id);
                    if (voix) dire(`${m.mot}. ${m.definition}`);
                  }}
                  className={`rounded-full px-2.5 py-1 text-sm font-extrabold ${motChoisi === m.id ? "bg-[#6a3fc0] text-white" : "bg-[#efe3ff] text-[#4a2a8a]"}`}
                >
                  {m.mot}
                </button>
              ))}
            </div>
          ) : null}
          {explication.etapes.length > 1 ? (
            <div className="mt-2 flex items-center gap-1.5">
              {etape > 0 ? (
                <button type="button" onClick={() => setEtape(etape - 1)} aria-label="Bulle précédente" className="grid size-10 place-items-center rounded-full bg-[#efe3ff] text-[#6a3fc0]">
                  <LuChevronLeft className="size-5" />
                </button>
              ) : null}
              {!derniere ? (
                <button type="button" onClick={fermer} className="min-h-10 px-2 text-sm font-extrabold text-[#7a5a8a] underline">
                  Passer
                </button>
              ) : null}
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => (derniere ? fermer() : setEtape(etape + 1))}
                className="inline-flex min-h-10 items-center gap-0.5 rounded-full bg-[#f3d48a] px-4 font-extrabold text-[#2a1c14]"
              >
                {derniere ? (contenu === "presentation" || contenu === "regles" ? "C'est parti !" : "J'ai compris") : "Suivant"}
                {derniere ? null : <LuChevronRight className="size-5" />}
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Les quatre boutons ronds de Plume */}
      <div className="mt-2.5 flex justify-between border-t border-[#e3d3f5] pt-2">
        {voix ? (
          <Rond
            icone={parle ? LuPause : LuPlay}
            label={parle ? "Pause" : "Écouter"}
            plein
            onClick={() => {
              if (parle) {
                taire();
                setLecture(false);
              } else {
                setLecture(true);
                dire(contenu === "presence" ? PRESENCES.map((p) => `${p.nom}. ${p.explique}`).join(" ") : texte);
              }
            }}
          />
        ) : null}
        <Rond icone={LuCircleHelp} label="Aide" actif={contenu === "page"} onClick={() => ouvrirPlume(true, "page")} />
        <Rond icone={LuBookOpen} label="Mots" actif={contenu === "mots"} onClick={() => ouvrirPlume(true, "mots")} />
        <Rond
          icone={LuLightbulb}
          label="Astuce"
          actif={contenu === "astuce"}
          onClick={() => {
            if (contenu === "astuce") setAstuce((a) => a + 1);
            ouvrirPlume(true, "astuce");
          }}
        />
        <Rond
          icone={LuSettings}
          label="Réglages"
          onClick={() => {
            fermer();
            aller("/options");
          }}
        />
      </div>
    </div>
  );
}

function Rond({ icone: Icone, label, onClick, plein = false, actif = false }: { icone: typeof LuPlay; label: string; onClick: () => void; plein?: boolean; actif?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex w-[4.2rem] flex-col items-center gap-0.5 text-[11px] font-extrabold text-[#6a3fc0]">
      <span className={`grid size-10 place-items-center rounded-full ${plein ? "bg-[#6a3fc0] text-white" : actif ? "bg-[#f3d48a] text-[#2a1c14]" : "bg-[#efe3ff]"}`}>
        <Icone className="size-5" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

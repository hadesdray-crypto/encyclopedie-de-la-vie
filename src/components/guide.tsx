import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as PE } from "react";
import { LuBookOpen, LuChevronLeft, LuChevronRight, LuCircleHelp, LuLightbulb, LuPause, LuPlay, LuSettings, LuX } from "react-icons/lu";
import { ASTUCES, PRESENTATION, SUJETS, explicationPour } from "@/data/guide";
import { voixDePresentation, voixPossible } from "@/components/voix";
import { sons } from "@/lib/sons";
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
  ecranEnCours,
  parler,
  palier,
  plumeDit,
  usePlume,
} from "@/lib/plume";
import { dire, taire, useParle } from "@/lib/parole";
import { choisirCompagnon, choisirVersion, compagnonExprime, jouerVersion, useCompagnon, useCompagnons, type Expression } from "@/lib/compagnons";
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
 * - Deux touchers : son menu. Appui long : on la prend et on la pose où on veut. Geste rapide : on la lance.
 * Elle ne s'ouvre jamais toute seule, sauf la toute première fois pour se présenter.
 */

type Position = { cote: "gauche" | "droite"; bas: number; x?: number };
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

function limiterX(x: number) {
  return Math.max(4, Math.min(window.innerWidth - TAILLE - 4, x));
}
/** La place choisie : là où on a posé Plume, exactement. */
function placeA(cx: number, cy: number): Position {
  return { cote: cx < window.innerWidth / 2 ? "gauche" : "droite", bas: limiterBas(window.innerHeight - cy - TAILLE / 2), x: limiterX(cx - TAILLE / 2) };
}

function limiterBas(bas: number) {
  return Math.max(92, Math.min(window.innerHeight - TAILLE - 70, bas));
}

export function Plume({ chemin, params }: { chemin: string; params: URLSearchParams }) {
  const { ouvert, contenu, reaction, proposition, presence, coucou, peur, geste } = usePlume();
  const perso = useCompagnon();
  const bonus = useCompagnons();
  const parle = useParle();
  const [pos, setPos] = useState(lirePosition);
  const [glisse, setGlisse] = useState<{ x: number; y: number } | null>(null);
  const [anim, setAnim] = useState<AnimPlume>("rien");
  const depart = useRef<{ x: number; y: number; t: number; long: number; bouge: boolean; prise: boolean; cx: number; cy: number } | null>(null);
  const dernierToucher = useRef(0);
  const toucherSimple = useRef(0);
  // Les derniers mouvements du doigt : pour savoir si on a lancé Plume (et à quelle vitesse).
  const traces = useRef<{ x: number; y: number; t: number }[]>([]);
  const [vol, setVol] = useState<{ x: number; y: number; r: number } | null>(null);
  const premier = useRef(true);
  const explicationPage = ecranEnCours() ?? explicationPour(chemin, params);
  const jeu = chemin === "/jouer" ? params.get("jeu") : null;
  const [bravo, setBravo] = useState(false);
  const { fete } = usePlume();
  useEffect(() => {
    if (!fete) return;
    setBravo(true);
    const t = window.setTimeout(() => setBravo(false), 3200);
    return () => window.clearTimeout(t);
  }, [fete]);
  const animJeu: AnimPlume | null = !jeu || presence === "discrete" || presence === "repos" ? null : bravo ? "bravo" : jeu === "bataille" ? "bataille" : "jeu";

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

  // La peur : elle se cache les yeux et tremble, avec un petit « Hou ! ».
  useEffect(() => {
    if (!peur) return;
    sons.hou();
    setAnim("peur");
    const t = window.setTimeout(() => setAnim("rien"), 2200);
    return () => window.clearTimeout(t);
  }, [peur]);

  // Un geste devant un animal (joie pour un chien, tristesse pour une espèce disparue…).
  useEffect(() => {
    if (!geste.n || presence === "discrete" || presence === "repos") return;
    setAnim(geste.anim as AnimPlume);
    const t = window.setTimeout(() => setAnim("rien"), 2800);
    return () => window.clearTimeout(t);
  }, [geste.n]);

  // On secoue le téléphone : seule Plume réagit, chacune à sa façon (au plus une fois toutes les 8 secondes).
  useEffect(() => {
    let dernier = 0, secousses = 0, debut = 0, prec: { x: number; y: number; z: number } | null = null;
    // Plus on la secoue, plus elle s'énerve (4 paliers), chacune à sa façon. Elle se calme si on la laisse tranquille.
    const REACTIONS: Record<string, [AnimPlume, string][]> = {
      discrete: [["etourdie", "Oh… ça tourne un peu."], ["etourdie", "Doucement, s'il te plaît…"], ["triste", "Ça me fait tourner la tête… j'aimerais qu'on arrête."], ["triste", "Je vais me reposer un peu, d'accord ?"]],
      presente: [["peur", "Ouh là ! Tout bouge !"], ["fachee", "Hé ! Arrête un peu de secouer !"], ["fachee", "Ça suffit ! J'ai la tête qui tourne !"], ["triste", "Je boude… Repose le téléphone, et on redevient amis."]],
      etudiante: [["etourdie", "Un tremblement de terre ? Non… c'est toi qui secoues !"], ["etourdie", "Mon oreille interne n'aime pas ça : c'est elle qui garde l'équilibre."], ["fachee", "Bon. Une chouette étourdie ne peut pas t'aider à apprendre !"], ["triste", "Je fais une pause. Pose le téléphone deux minutes."]],
      passionnee: [["bravo", "Wouhou, un manège !"], ["etourdie", "Encore ?! Ouh là là, ça tourne !"], ["fachee", "STOP ! Mes plumes vont s'envoler partout !"], ["fachee", "Grrr ! Je suis TRÈS fâchée… Bon, je te pardonne si tu arrêtes !"]],
      repos: [["coucou", "Hein ? Je dormais…"], ["coucou", "Laisse-moi dormir…"], ["triste", "Zzz… pfff…"], ["triste", "Zzz…"]],
    };
    const mouvement = (ev: DeviceMotionEvent) => {
      const a = ev.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const m = { x: a.x, y: a.y, z: a.z };
      if (prec) {
        const choc = Math.abs(m.x - prec.x) + Math.abs(m.y - prec.y) + Math.abs(m.z - prec.z);
        const t = Date.now();
        if (choc > 28) {
          if (t - debut > 700) { debut = t; secousses = 0; }
          secousses++;
          if (secousses >= 4 && t - dernier > 8000 && !document.body.hasAttribute("data-face-a-face")) {
            dernier = t; secousses = 0;
            const l = REACTIONS[presenceActuelle()] ?? REACTIONS.presente;
            const [a1, p1] = l[Math.min(l.length - 1, palier("secoue", 120000))];
            plumePropose(null);
            setAnim(a1);
            parler("secoue", p1, 2800);
            navigator.vibrate?.(20);
            window.setTimeout(() => setAnim("rien"), 2800);
          }
        }
      }
      prec = m;
    };
    window.addEventListener("devicemotion", mouvement);
    return () => window.removeEventListener("devicemotion", mouvement);
  }, []);

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
    const replacer = () => setPos((p) => ({ ...p, bas: limiterBas(p.bas), x: p.x === undefined ? undefined : limiterX(p.x) }));
    window.addEventListener("resize", replacer);
    return () => window.removeEventListener("resize", replacer);
  }, []);

  // Au repos, Plume se cache (sauf pour sa toute première présentation).
  if (presence === "repos" && !(ouvert && contenu === "presentation")) return null;

  function appui(e: PE<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    // Appui long : on prend Plume, et on la pose où on veut.
    const long = window.setTimeout(() => {
      const d = depart.current;
      if (d && !d.bouge) {
        d.prise = true;
        navigator.vibrate?.(15);
        setGlisse({ x: d.x, y: d.y });
      }
    }, 450);
    const r = e.currentTarget.getBoundingClientRect();
    depart.current = { x: e.clientX, y: e.clientY, t: Date.now(), long, bouge: false, prise: false, cx: e.clientX - (r.left + r.width / 2), cy: e.clientY - (r.top + r.height / 2) };
  }

  function deplacement(e: PE<HTMLButtonElement>) {
    const d = depart.current;
    if (!d) return;
    if (!d.bouge && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) {
      d.bouge = true;
      window.clearTimeout(d.long);
    }
    if (d.bouge) {
      if (d.prise) setGlisse({ x: e.clientX, y: e.clientY });
      traces.current = [...traces.current.slice(-5), { x: e.clientX, y: e.clientY, t: performance.now() }];
    }
  }

  /** Plume est lancée : chaque caractère réagit à sa façon. */
  function lancer(x: number, y: number, vx: number, vy: number) {
    const sorte = presence === "presente" ? "vole" : presence === "passionnee" ? "looping" : "tombe";
    const sol = window.innerHeight - TAILLE - 86;
    const largeur = window.innerWidth - TAILLE;
    let px = x - TAILLE / 2, py = y - TAILLE / 2, r = 0;
    let t0 = performance.now(), debut = t0;
    setGlisse(null);
    setAnim(sorte === "tombe" ? "rien" : "vole");
    const maison = lirePosition();
    const cible = { x: maison.x ?? (maison.cote === "gauche" ? 10 : window.innerWidth - TAILLE - 10), y: window.innerHeight - maison.bas - TAILLE };
    // Après chaque lancer, un petit mécontentement : chacune à sa façon.
    // Plus on la lance, plus elle est mécontente (paliers).
    const FACHE: Record<string, string[]> = {
      discrete: ["Ce n'était pas très gentil…", "Encore… ça me fait un peu peur.", "S'il te plaît, pose-moi doucement.", "Je suis triste quand on me lance comme ça…"],
      presente: ["Hé ! Je préfère quand on me pose doucement.", "Encore ?! Ça devient agaçant !", "Ça suffit ! Je ne suis pas un ballon !", "Je boude. Hmpf !"],
      etudiante: ["Hmpf ! Une chouette, ça se pose délicatement.", "Deuxième atterrissage forcé. Je note.", "Les chouettes volent très bien toutes seules, merci !", "Je refuse de continuer cette expérience !"],
      passionnee: ["Bon… c'était drôle, mais pas trop souvent, hein !", "Hé ! Mes plumes ! Mes belles plumes !", "GRRR ! Je vais me fâcher tout rouge !", "Je suis FURIEUSE ! … Bon, d'accord, je te pardonne. Mais c'est la dernière fois !"],
    };
    const fin = (p: Position, apres: AnimPlume, phrase?: string) => {
      setVol(null);
      plumePropose(null);
      setPos(p);
      garderPosition(p);
      setAnim(apres);
      if (phrase && presence !== "repos") plumeDit(phrase, 2400);
      window.setTimeout(() => {
        if (presence === "repos") return setAnim("rien");
        setAnim("fachee");
        const l = FACHE[presence] ?? FACHE.presente;
        parler("fache", l[Math.min(l.length - 1, palier("lance", 120000))], 2800);
        window.setTimeout(() => setAnim("rien"), 2600);
      }, 2400);
    };
    const pas = (t: number) => {
      const dt = Math.min(32, t - t0) / 16;
      t0 = t;
      if (sorte === "tombe") {
        vy += 0.9 * dt;
        px += vx * dt;
        py += vy * dt;
        r += vx * 1.5 * dt;
        if (px < 0 || px > largeur) { vx = -vx * 0.6; px = Math.max(0, Math.min(largeur, px)); }
        if (py < 0) { py = 0; vy = -vy * 0.5; }
        if (py >= sol) {
          py = sol;
          if (Math.abs(vy) > 4) { vy = -vy * 0.4; vx *= 0.7; navigator.vibrate?.(10); }
          else {
            const p: Position = { ...placeA(px + TAILLE / 2, sol + TAILLE / 2) };
            if (presence === "discrete") fin(p, "triste", "Oh… doucement, s'il te plaît.");
            else if (presence === "etudiante") fin(p, "etourdie", "Aïe ! Tout ce qui tombe va de plus en plus vite : c'est la gravité.");
            else fin(p, "rien");
            return;
          }
        }
      } else {
        // Elle reprend son vol et revient à sa place, en battant des ailes (la passionnée fait un looping).
        const k = Math.min(1, (t - debut) / 1300);
        const e = 1 - Math.pow(1 - k, 3);
        px = px + (cible.x - px) * e * 0.12 + vx * (1 - k) * 0.6;
        py = py + (cible.y - py) * e * 0.12 + vy * (1 - k) * 0.6 - Math.sin(k * Math.PI) * 2;
        r = sorte === "looping" ? k * 360 : Math.sin(k * Math.PI * 4) * 12;
        if (k >= 1) {
          fin(maison, sorte === "looping" ? "bravo" : "coucou", sorte === "looping" ? "Wouhouuu ! Encore ! Encore !" : "Je vole ! Les chouettes volent sans bruit, grâce à leurs plumes toutes douces.");
          return;
        }
      }
      setVol({ x: px, y: py, r });
      requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }

  function lacher(e: PE<HTMLButtonElement>) {
    const d = depart.current;
    depart.current = null;
    if (!d) return;
    window.clearTimeout(d.long);
    if (d.bouge) {
      const tr = traces.current;
      traces.current = [];
      if (tr.length >= 2) {
        const a = tr[0], b = tr[tr.length - 1];
        const dt = Math.max(1, b.t - a.t);
        const vx = ((b.x - a.x) / dt) * 16, vy = ((b.y - a.y) / dt) * 16;
        const centre = Math.hypot(d.cx, d.cy) < TAILLE * 0.3;
        const loin = Math.hypot(b.x - d.x, b.y - d.y) > 90;
        if (centre && loin && Math.hypot(vx, vy) > 24 && performance.now() - b.t < 90) {
          lancer(b.x, b.y, Math.max(-40, Math.min(40, vx)), Math.max(-40, Math.min(40, vy)));
          return;
        }
      }
      // Posée là où on l'a lâchée (seulement si on l'avait prise par un appui long).
      if (d.prise) {
        const p = placeA(e.clientX, e.clientY);
        setPos(p);
        garderPosition(p);
      }
      setGlisse(null);
      return;
    }
    if (d.prise) {
      setGlisse(null);
      return;
    }
    // Si elle parle, un toucher l'arrête et ouvre sa bulle.
    if (parle) {
      taire();
      ouvrirPlume(true, motsDeLaPage().length ? "mots" : "page");
      return;
    }
    // Deux touchers rapides : ouvrir (ou fermer) son menu. Un seul toucher : un petit coucou.
    const t = Date.now();
    if (t - dernierToucher.current < 380) {
      dernierToucher.current = 0;
      window.clearTimeout(toucherSimple.current);
      if (ouvert) {
        taire();
        ouvrirPlume(false);
      } else {
        ouvrirPlume(true, "page");
        compagnonExprime("menu");
      }
      return;
    }
    dernierToucher.current = t;
    toucherSimple.current = window.setTimeout(() => {
      if (ouvert) return;
      setAnim("coucou");
      const perso = compagnonExprime("coucou");
      if (perso) plumeDit(perso, 2500);
      window.setTimeout(() => setAnim("rien"), 1600);
    }, 400);
  }

  const gauche = pos.cote === "gauche";
  const style: CSSProperties = vol
    ? { left: vol.x, top: vol.y, width: TAILLE, height: TAILLE }
    : glisse
    ? { left: glisse.x - TAILLE / 2, top: glisse.y - TAILLE / 2, width: TAILLE, height: TAILLE }
    : pos.x !== undefined
    ? { left: limiterX(pos.x), bottom: `calc(env(safe-area-inset-bottom, 0px) + ${pos.bas}px)`, width: TAILLE, height: TAILLE }
    : { [gauche ? "left" : "right"]: 10, bottom: `calc(env(safe-area-inset-bottom, 0px) + ${pos.bas}px)`, width: TAILLE, height: TAILLE };
  const cote = gauche ? "left-full ml-1.5 rounded-bl-sm" : "right-full mr-1.5 rounded-br-sm";

  return (
    <>
      <div className={`plume-racine fixed z-50 ${glisse || vol ? "" : "transition-[left,right,bottom] duration-300"}`} style={style}>
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
          aria-label="Plume. Touche deux fois pour son menu, appuie longtemps pour la déplacer."
          aria-expanded={ouvert}
          className={`block size-full touch-none select-none ${glisse || ouvert || parle ? "" : presence === "passionnee" ? "plume-impatiente" : presence === "discrete" ? "" : "plume-flotte"}`}
        >
          <span className="absolute inset-1 -z-10 rounded-full bg-[radial-gradient(circle,rgba(180,140,255,.45),transparent_70%)]" />
          {presence === "passionnee" && !ouvert ? (
            <>
              <span className="etincelle pointer-events-none absolute -left-2 top-1 text-sm text-[#f3d48a]">✦</span>
              <span className="etincelle etincelle-2 pointer-events-none absolute -right-1 top-4 text-xs text-[#9fe3ff]">✦</span>
              <span className="etincelle etincelle-3 pointer-events-none absolute -top-2 left-1/2 text-[10px] text-[#ff9fcf]">✦</span>
            </>
          ) : null}
          <span className="block size-full transition-transform duration-200" style={vol ? { transform: `rotate(${vol.r}deg)` } : glisse ? { transform: "scale(1.22) translateY(-4px)" } : undefined}>
            <PlumeDessin anim={["peur", "vole", "triste", "etourdie", "bravo", "fachee", "coucou"].includes(anim) ? anim : parle ? "parle" : ouvert ? "ailes" : animJeu ?? anim} caractere={ouvert && contenu === "presentation" && !perso ? 3 : CARACTERE[presence] ?? 0} look={perso?.look} lit={parle && !["peur", "vole", "triste", "etourdie", "fachee"].includes(anim)} miroir={gauche} className="size-full drop-shadow-[0_6px_10px_rgba(0,0,0,.5)]" />
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
        {reaction && !ouvert && !parle && !proposition && !vol ? (
          <span role="status" className={`arrivee pointer-events-none absolute bottom-3 w-max max-w-[min(15rem,70vw)] rounded-2xl bg-[#fff8ea] px-3 py-2 text-sm font-extrabold leading-snug text-[#4a2a8a] shadow-[0_6px_18px_rgba(0,0,0,.4)] ${cote}`}>
            {reaction}
          </span>
        ) : null}

        {/* Une proposition d'aide : on peut dire oui, ou l'ignorer. */}
        {proposition && !ouvert && !parle && !vol ? (
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
  const perso = useCompagnon();
  const bonus = useCompagnons();
  const { contenu, presence } = usePlume();
  const parle = useParle();
  const ref = useRef<HTMLDivElement>(null);
  const explicationPage = ecranEnCours() ?? explicationPour(chemin, params);
  const jeu = chemin === "/jouer" ? params.get("jeu") : null;
  const [bravo, setBravo] = useState(false);
  const { fete } = usePlume();
  useEffect(() => {
    if (!fete) return;
    setBravo(true);
    const t = window.setTimeout(() => setBravo(false), 3200);
    return () => window.clearTimeout(t);
  }, [fete]);
  const animJeu: AnimPlume | null = !jeu || presence === "discrete" || presence === "repos" ? null : bravo ? "bravo" : jeu === "bataille" ? "bataille" : "jeu";
  const astuces = ASTUCES[explicationPage.id] ?? ASTUCES.accueil;
  const [astuce, setAstuce] = useState(() => Math.floor(Math.random() * astuces.length));
  const mots = contenu === "mots" ? motsDeLaPage() : [];
  const [motChoisi, setMotChoisi] = useState<string | null>(null);
  useEffect(() => setMotChoisi(null), [contenu]);
  const defMot = motChoisi ? motDuLexique(motChoisi) : undefined;
  // Présentation : après le résumé, on peut choisir un sujet à expliquer en détail.
  const [sujet, setSujet] = useState<string | null>(null);
  const explicationBrute =
    contenu === "mots"
      ? { id: "mots", titre: "Les mots de cette page", etapes: [defMot ? `${defMot.mot} : ${defMot.definition}` : mots.length ? "Touche un mot, je te l'explique." : "Il n'y a pas de mot compliqué sur cette page."] }
      : contenu === "presentation" ? (sujet ? SUJETS.find((x) => x.id === sujet) ?? PRESENTATION : PRESENTATION) : contenu === "regles" && reglesEnCours() ? reglesEnCours()! : contenu === "astuce" ? { id: "astuce", titre: "Une astuce", etapes: [astuces[astuce % astuces.length]] } : explicationPage;
  const [etape, setEtape] = useState(0);
  const [lecture, setLecture] = useState(false);
  const contenuRef = useRef(contenu);
  contenuRef.current = contenu;

  useEffect(() => {
    setEtape(0);
    setSujet(null);
  }, [contenu]);

  /** « C'est bon, je vais explorer » : Plume dit c'est parti, et se range dans son coin. */
  function explorer() {
    const phrase = "C'est parti ! Je te laisse explorer, Leonie. Touche-moi deux fois si tu as besoin de moi.";
    fermer();
    window.setTimeout(() => {
      plumeDit(phrase, 5000);
      if (voixPossible()) dire(phrase);
    }, 300);
  }

  // Un personnage bonus explique avec son nom à lui, et avec son propre texte s'il en a écrit un pour cette page.
  const avecNom = (t: string) => (perso ? t.replace(/\bPlume\b/g, perso.nom) : t);
  // Une version de son explication pour cette page (choisie au hasard une fois, quand la page s'ouvre).
  const versionPage = useMemo(() => (perso && contenu === "page" ? choisirVersion(perso, `page:${explicationBrute.id}` as Expression) : null), [perso?.id, contenu, explicationBrute.id]);
  const textePerso = versionPage?.texte || undefined;
  const explication = perso ? { ...explicationBrute, titre: avecNom(explicationBrute.titre), etapes: textePerso ? [textePerso] : explicationBrute.etapes.map(avecNom) } : explicationBrute;
  const texte = explication.etapes[etape] ?? explication.etapes[0];
  const derniere = etape >= explication.etapes.length - 1;
  const voix = voixPossible();

  // Plume lit si on le lui a demandé (bouton Écouter, ou « toujours avec moi »). La présentation a sa propre lecture.
  useEffect(() => {
    if (contenu === "presentation") return;
    if (contenu !== "presence" && !(contenu === "mots" && motChoisi) && voix && (plumeParleSeule() || lecture)) dire(texte);
  }, [texte, contenu]);

  // La présentation se déroule toute seule : Plume lit chaque bulle d'une voix normale, puis passe à la suivante,
  // jusqu'à la fin du résumé (ou du sujet choisi). Ensuite seulement, on choisit.
  useEffect(() => {
    if (contenu !== "presentation") return;
    let fini = false;
    const suivante = () => {
      if (fini) return;
      if (!derniere) setEtape((n) => n + 1);
    };
    let minuteur = 0;
    // Chaque bulle reste au moins le temps de la lire, même si la voix du téléphone s'arrête trop tôt.
    const minimum = Math.max(2500, texte.length * 38);
    const debut = Date.now();
    if (voix) {
      voixDePresentation(true);
      dire(texte, () => {
        minuteur = window.setTimeout(suivante, Math.max(450, minimum - (Date.now() - debut)));
      });
    } else minuteur = window.setTimeout(suivante, minimum);
    return () => {
      fini = true;
      window.clearTimeout(minuteur);
    };
  }, [texte, contenu, sujet]);
  useEffect(() => () => voixDePresentation(false), []);

  // Toucher ailleurs referme la bulle (la page reste utilisable).
  useEffect(() => {
    const dehors = (e: PointerEvent) => {
      // Pendant la présentation, toucher ailleurs ne la coupe pas.
      if (contenuRef.current === "presentation") return;
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
    voixDePresentation(false);
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
      aria-label={`${perso?.nom ?? "Plume"} : ${contenu === "presence" ? "comment je reste" : explication.titre}`}
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
                  choisirCompagnon(null);
                  choisirPresence(p.id);
                  if (voix && p.id !== "repos") dire(p.explique);
                }}
                className={`w-full rounded-2xl px-3 py-2 text-left ${presence === p.id && !perso ? "bg-[#6a3fc0] text-white" : "bg-[#efe3ff] text-[#2a1c14]"}`}
              >
                <span className="block font-extrabold leading-tight">{p.nom}</span>
                <span className="block text-xs leading-snug">{p.explique}</span>
              </button>
            </li>
          ))}
          {bonus.map((c) => (
            <li key={c.id}>
              <button type="button" aria-pressed={perso?.id === c.id} onClick={() => { choisirCompagnon(c.id); choisirPresence(c.caractere); }} className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left ${perso?.id === c.id ? "bg-[#6a3fc0] text-white" : "bg-[#efe3ff] text-[#2a1c14]"}`}>
                <PlumeDessin caractere={CARACTERE[c.caractere]} look={c.look} className="size-10 shrink-0" />
                <span><span className="block font-extrabold leading-tight">Bonus · {c.nom}</span><span className="block text-xs leading-snug">{c.createur ? `Créé par ${c.createur}` : "Personnage bonus"}</span></span>
              </button>
            </li>
          ))}
          {bonus.length < 4 ? <li><a href="#/atelier" className="block w-full rounded-2xl bg-gradient-to-b from-[#ff6b5a] to-[#d2302a] px-3 py-2 text-center text-sm font-extrabold text-white">＋ {bonus.length ? "Encore un personnage bonus" : "Créer un personnage bonus"}</a></li> : null}
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
          {contenu === "presentation" && derniere && !sujet ? (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                {SUJETS.map((x) => (
                  <button key={x.id} type="button" onClick={() => { setSujet(x.id); setEtape(0); }} className="rounded-full bg-[#efe3ff] px-3 py-1.5 text-sm font-extrabold text-[#4a2a8a]">
                    {x.bouton}
                  </button>
                ))}
              </div>
              <button type="button" onClick={explorer} className="mt-2 w-full rounded-full bg-[#f3d48a] py-2.5 font-extrabold text-[#2a1c14]">
                C'est bon, je vais explorer !
              </button>
            </div>
          ) : contenu === "presentation" && sujet && derniere ? (
            <div className="mt-2 flex gap-1.5">
              <button type="button" onClick={() => { setSujet(null); setEtape(PRESENTATION.etapes.length - 1); }} className="flex-1 rounded-full bg-[#efe3ff] py-2.5 text-sm font-extrabold text-[#4a2a8a]">
                Autre chose ?
              </button>
              <button type="button" onClick={explorer} className="flex-1 rounded-full bg-[#f3d48a] py-2.5 text-sm font-extrabold text-[#2a1c14]">
                J'explore !
              </button>
            </div>
          ) : explication.etapes.length > 1 ? (
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
                // Sa propre voix enregistrée pour cette page ? On la fait entendre à la place de la voix de synthèse.
                if (perso && contenu === "page" && versionPage) {
                  jouerVersion(perso.id, `page:${explicationBrute.id}` as Expression, versionPage.i, () => setLecture(false)).then((ok) => { if (!ok) dire(texte); });
                } else dire(contenu === "presence" ? PRESENCES.map((p) => `${p.nom}. ${p.explique}`).join(" ") : texte);
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

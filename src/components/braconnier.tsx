// Le braconnier, façon Bip Bip et Coyote : il veut attraper Plume, et c'est toujours Plume qui gagne.
//
// Trois scènes, au hasard :
//  - le filet : il s'approche en douce… Plume s'envole, et le filet finit sur sa propre tête ;
//  - le fusil : il vise, il tire… le bouclier du Concepteur (qui protège toujours les plus faibles)
//    renvoie la balle, qui lui fait sauter le chapeau et lui noircit la figure ;
//  - la course : il court après Plume, Plume s'envole au dernier moment, il s'écrase contre le bord de l'écran.
//
// À tout moment, Leonie peut l'attraper du doigt et le lancer : vraie gravité, rebonds, rotation.
// À chaque gros choc, un bobo (pansement, bosse, bandage), des étoiles… et au bout de deux fois, il s'en va en boitant.
// Rien de méchant : des chocs de dessin animé, pas de sang, et il repart toujours sur ses deux pieds.
import { useEffect, useRef, useState, type PointerEvent as PE } from "react";
import { createPortal } from "react-dom";
import { PlumeDessin, type AnimPlume } from "@/components/plume-dessin";
import { plumeAPeur, plumeDit, plumeFete, plumeGeste } from "@/lib/plume";
import { sons } from "@/lib/sons";
import { braconnierEstVenu, braconnierPossible, braconnierRenvoye, histoire } from "@/lib/histoire";

export type Scenario = "filet" | "fusil" | "course";
type Mode = "marche" | "attrape" | "vise" | "attente" | "course" | "tenu" | "vol" | "allonge" | "releve" | "ecrase" | "fuite";
type Particule = { id: number; type: "poussiere" | "etincelle" | "fumee" | "mot" | "flash" | "vitesse"; x: number; y: number; fin: number; texte?: string; dx?: number; dy?: number; taille?: number; r?: number };
type Objet = { id: number; type: "chapeau" | "fusil"; x: number; y: number; vx: number; vy: number; a: number; va: number; pose: number };
type Acteur = { x: number; y: number; phase: "saute" | "court" | "attend" | "envol" | "retour"; t: number; de: { x: number; y: number }; vers: { x: number; y: number }; anim: AnimPlume; miroir: boolean };

const BW = 96, BH = 136; // la taille du braconnier à l'écran
const G = 2600; // la gravité (pixels par seconde²)
let idSuivant = 1;

const DIT_LANCE = ["Aaaaaah !", "Ouh là là !", "Au secouuuurs !", "Pas par là !", "Je voleeee !"];
const DIT_FUITE = ["Je reviendrai !", "Ouille, ouille, ouille…", "Maudite chouette !", "Maman…", "Plus jamais !"];
const MOTS = ["BOING !", "PAF !", "BONK !", "OUILLE !", "BADABOUM !", "SPLATCH !"];

function solY() {
  const b = document.querySelector(".barre-bas")?.getBoundingClientRect();
  return b && b.top > 200 ? b.top - 4 : window.innerHeight - 16;
}
function centrePlume() {
  const b = document.querySelector(".plume-racine")?.getBoundingClientRect();
  if (b && b.width > 10) return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: Math.max(b.width, b.height) * 0.62 };
  return { x: window.innerWidth - 60, y: solY() - 60, r: 52 };
}
const hasard = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

// ------------------------------------------------------------ le dessin
function Dessin({ m, bobos, chapeau, suie, filetTete, arme, vise, etourdi, pas }: {
  m: Mode; bobos: number; chapeau: boolean; suie: boolean; filetTete: boolean; arme: "filet" | "fusil" | null; vise: number; etourdi: boolean; pas: number;
}) {
  const marche = m === "marche" || m === "fuite" || m === "course";
  const jambe = marche ? Math.sin(pas) * (m === "course" ? 30 : 18) : m === "vol" || m === "tenu" ? 22 : 0;
  const peau = suie ? "#5b5048" : "#f1c7a0";
  const brasRot = arme === "fusil" ? vise : m === "attrape" ? 55 : m === "vol" || m === "tenu" ? -70 : arme === "filet" ? -25 : 10;
  return (
    <svg viewBox="0 0 120 170" className="size-full overflow-visible" aria-hidden="true">
      <ellipse cx="55" cy="166" rx="30" ry="4" fill="#000" opacity={m === "vol" || m === "tenu" ? 0 : 0.3} />
      {/* jambes */}
      <g style={{ transformOrigin: "46px 120px", transform: `rotate(${jambe}deg)` }}>
        <rect x="40" y="118" width="11" height="42" rx="5" fill="#4a3b2a" />
        <ellipse cx="45" cy="161" rx="11" ry="5" fill="#222" />
      </g>
      <g style={{ transformOrigin: "62px 120px", transform: `rotate(${-jambe}deg)` }}>
        <rect x="57" y="118" width="11" height="42" rx="5" fill="#3d3022" />
        <ellipse cx="64" cy="161" rx="11" ry="5" fill="#222" />
      </g>
      {/* corps : la veste verte */}
      <rect x="32" y="70" width="46" height="56" rx="16" fill="#4d6b2f" />
      <rect x="52" y="74" width="5" height="48" fill="#3a5222" />
      <circle cx="47" cy="88" r="2.5" fill="#c9a24a" />
      <circle cx="47" cy="102" r="2.5" fill="#c9a24a" />
      {/* l'autre bras, en arrière */}
      <rect x="22" y="80" width="14" height="30" rx="7" fill="#425c27" transform={`rotate(${m === "vol" || m === "tenu" ? 60 : marche ? Math.sin(pas) * 25 : 8} 30 82)`} />
      {/* tête */}
      <circle cx="55" cy="52" r="20" fill={peau} />
      {suie ? <path d="M38 40 Q42 30 47 38 Q50 28 55 37 Q60 27 63 38 Q68 30 72 40" stroke="#3a3a3a" strokeWidth="3" fill="none" /> : null}
      {etourdi ? (
        <>
          <path d="M45 44 l7 7 M52 44 l-7 7 M58 44 l7 7 M65 44 l-7 7" stroke="#2a1c14" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="62" cy="48" r={m === "vol" || m === "tenu" ? 4 : 2.6} fill={suie ? "#fff" : "#2a1c14"} />
          <circle cx="49" cy="48" r={m === "vol" || m === "tenu" ? 4 : 2.6} fill={suie ? "#fff" : "#2a1c14"} />
          {suie ? <><circle cx="62" cy="48" r="1.3" fill="#2a1c14" /><circle cx="49" cy="48" r="1.3" fill="#2a1c14" /></> : null}
          <path d={m === "vise" ? "M43 42 L52 45 M60 45 L69 42" : "M44 41 L52 43 M60 43 L68 40"} stroke="#3a2a1a" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      <path d="M44 60 C49 55 61 55 67 60 C61 63 50 63 44 60 Z" fill="#5a3a22" />
      <circle cx="56" cy="55" r="3.4" fill={suie ? "#6b5a52" : "#e3a07a"} />
      {m === "vol" || m === "tenu" ? <ellipse cx="56" cy="66" rx="4" ry="5" fill="#5a2020" /> : m === "fuite" || etourdi ? <path d="M48 67 Q55 63 62 67" stroke="#6a2a1a" strokeWidth="2" fill="none" /> : null}
      {/* les bobos */}
      {bobos >= 1 ? <g transform="rotate(-20 40 58)"><rect x="33" y="55" width="14" height="6" rx="2" fill="#f2c28a" /><rect x="38" y="55" width="4" height="6" fill="#e0a86a" /></g> : null}
      {bobos >= 2 ? <ellipse cx="68" cy="34" rx="7" ry="6" fill="#f5a0a0" stroke="#d07070" strokeWidth="1" /> : null}
      {bobos >= 3 ? <path d="M35 44 Q55 38 75 44 L75 50 Q55 44 35 50 Z" fill="#ffffff" stroke="#ddd" strokeWidth="1" /> : null}
      {bobos >= 4 ? <g transform="rotate(25 58 56)"><rect x="52" y="53" width="13" height="5" rx="2" fill="#f2c28a" /></g> : null}
      {/* chapeau */}
      {chapeau ? (
        <g>
          <path d="M30 36 L80 36 L76 30 L68 16 L42 16 L34 30 Z" fill="#6b4a2a" />
          <rect x="26" y="33" width="58" height="6" rx="3" fill="#523720" />
        </g>
      ) : (
        <ellipse cx="55" cy="35" rx="16" ry="6" fill={suie ? "#4a423c" : "#e8b890"} />
      )}
      {/* le filet sur sa propre tête */}
      {filetTete ? (
        <g>
          <path d="M28 70 Q55 -2 82 70" fill="#ffffff" opacity=".45" stroke="#7a5a2a" strokeWidth="3" />
          <path d="M34 50 L76 50 M38 36 L72 36 M46 24 L64 24 M55 12 L55 70 M42 20 L40 66 M68 20 L70 66" stroke="#ccc" strokeWidth=".9" />
          <rect x="80" y="62" width="4" height="60" rx="2" fill="#8a6a3a" transform="rotate(20 82 66)" />
        </g>
      ) : null}
      {/* le bras qui tient le filet ou le fusil */}
      <g style={{ transformOrigin: "70px 84px", transform: `rotate(${brasRot}deg)`, transition: m === "vise" || m === "attente" ? "none" : "transform .25s" }}>
        <rect x="66" y="78" width="26" height="10" rx="5" fill="#4d6b2f" />
        <circle cx="93" cy="83" r="6" fill={peau} />
        {arme === "filet" && !filetTete ? (
          <g>
            <rect x="91" y="20" width="4" height="70" rx="2" fill="#8a6a3a" />
            <ellipse cx="93" cy="14" rx="17" ry="11" fill="none" stroke="#7a5a2a" strokeWidth="3" />
            <path d="M77 14 Q93 50 109 14" fill="#ffffff" opacity=".55" stroke="#ddd" strokeWidth="1" />
          </g>
        ) : null}
        {arme === "fusil" ? <Fusil x={74} y={78} /> : null}
      </g>
      {/* les étoiles qui tournent */}
      {etourdi ? (
        <g className="brac-etoiles" style={{ transformOrigin: "55px 26px" }}>
          {[0, 1, 2, 3].map((k) => (
            <text key={k} x={55 + Math.cos((k * Math.PI) / 2) * 26} y={26 + Math.sin((k * Math.PI) / 2) * 8} fontSize="13" textAnchor="middle">⭐</text>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

function Fusil({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 2 L22 0 L24 10 L4 14 Z" fill="#7a4a22" />
      <rect x="20" y="1" width="52" height="5" rx="2" fill="#5b5f66" />
      <rect x="20" y="6" width="30" height="3" rx="1" fill="#41444a" />
      <rect x="66" y="-1" width="3" height="3" fill="#41444a" />
    </g>
  );
}

// ------------------------------------------------------------ le braconnier
type Etat = {
  actif: boolean; scenario: Scenario; mode: Mode; t: number; dir: 1 | -1; vitesse: number; cibleX: number;
  x: number; y: number; vx: number; vy: number; a: number; va: number; sx: number; sy: number; pas: number;
  bobos: number; chapeau: boolean; suie: boolean; filetTete: boolean; arme: "filet" | "fusil" | null; vise: number; etoiles: number;
  dit: { texte: string; fin: number } | null; coups: number; fini: boolean; lisse: number;
  objets: Objet[]; parts: Particule[]; balle: { x: number; y: number; vx: number; vy: number; retour: boolean } | null; bouclier: number;
  acteur: Acteur | null; saisie: { dx: number; dy: number; pts: { x: number; y: number; t: number }[] } | null; temps: number;
};
const neuf = (): Etat => ({
  actif: false, scenario: "filet", mode: "marche", t: 0, dir: 1, vitesse: 150, cibleX: 0,
  x: -80, y: 0, vx: 0, vy: 0, a: 0, va: 0, sx: 1, sy: 1, pas: 0,
  bobos: 0, chapeau: true, suie: false, filetTete: false, arme: "filet", vise: 0, etoiles: 0,
  dit: null, coups: 0, fini: false, lisse: 0, objets: [], parts: [], balle: null, bouclier: 0, acteur: null, saisie: null, temps: 0,
});

export function Braconnier() {
  const S = useRef<Etat>(neuf());
  const [, setImage] = useState(0);
  const boucle = useRef(0);

  // De temps en temps (au plus une fois par jour), il arrive.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (S.current.actif || document.hidden || !braconnierPossible()) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (Math.random() > 0.12) return;
      lancer();
    }, 15000);
    const surDemande = (e: Event) => {
      if (S.current.actif) return;
      const sc = (e as CustomEvent<{ scenario?: Scenario }>).detail?.scenario;
      window.setTimeout(() => lancer(sc), 1200);
    };
    window.addEventListener("leonie-braconnier", surDemande);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("leonie-braconnier", surDemande);
      cancelAnimationFrame(boucle.current);
      delete document.body.dataset.plumeActeur;
    };
  }, []);

  // ---------------- petits outils
  const s = () => S.current;
  const dire = (texte: string, duree = 1.8) => (s().dit = { texte, fin: s().temps + duree });
  function effet(p: Omit<Particule, "id" | "fin">, duree: number) {
    s().parts.push({ ...p, id: idSuivant++, fin: s().temps + duree });
  }
  function poussiere(x: number, y: number, n = 6, force = 1) {
    for (let k = 0; k < n; k++) effet({ type: "poussiere", x, y, dx: (Math.random() - 0.5) * 90 * force, dy: -Math.random() * 40 * force, taille: 18 + Math.random() * 22 * force }, 0.7);
  }
  function etincelles(x: number, y: number, n = 10) {
    for (let k = 0; k < n; k++) {
      const ang = Math.random() * Math.PI * 2, v = 40 + Math.random() * 70;
      effet({ type: "etincelle", x, y, dx: Math.cos(ang) * v, dy: Math.sin(ang) * v, r: (ang * 180) / Math.PI }, 0.5);
    }
  }
  const mot = (x: number, y: number, texte: string) => effet({ type: "mot", x, y, texte, r: (Math.random() - 0.5) * 24 }, 0.9);

  function lancer(choix?: Scenario) {
    const sc: Scenario = choix ?? (histoire().renvoyes === 0 ? "filet" : hasard<Scenario>(["filet", "fusil", "course", "fusil", "course"]));
    braconnierEstVenu();
    const p = centrePlume();
    const e = neuf();
    e.actif = true;
    e.scenario = sc;
    e.arme = sc === "fusil" ? "fusil" : "filet";
    const plumeADroite = p.x > window.innerWidth / 2;
    e.dir = plumeADroite ? 1 : -1;
    e.x = plumeADroite ? -70 : window.innerWidth + 70;
    e.y = solY() - BH / 2;
    e.vitesse = sc === "fusil" ? 120 : 105;
    e.cibleX = sc === "fusil" ? (plumeADroite ? window.innerWidth * 0.24 : window.innerWidth * 0.76) : p.x - e.dir * (sc === "course" ? 150 : 95);
    S.current = e;
    dire(sc === "fusil" ? "Hé hé hé…" : "Chuuut… je vais l'attraper…", 2.5);
    window.setTimeout(() => {
      if (!s().actif) return;
      if (sc === "fusil") plumeAPeur("Oh non ! Le braconnier a un fusil !", 4000);
      else if (sc === "filet") plumeAPeur("Au secours ! Un braconnier avec un filet ! Touche-le, ou lance-le loin !", 5000);
      else plumeAPeur("Hi hi, encore lui ? Il ne m'attrapera jamais !", 4000);
    }, 900);
    let avant = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - avant) / 1000);
      avant = now;
      avancer(dt);
      setImage((n) => (n + 1) % 1e6);
      if (s().actif) boucle.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(boucle.current);
    boucle.current = requestAnimationFrame(tick);
  }

  function terminer() {
    const e = s();
    e.actif = false;
    delete document.body.dataset.plumeActeur;
    braconnierRenvoye(
      e.coups ? "Leonie a fait voler le braconnier. Il est reparti en boitant !"
        : e.scenario === "fusil" ? "Le braconnier a tiré, mais le bouclier du Concepteur a protégé Plume !"
        : e.scenario === "course" ? "Le braconnier a couru après Plume… et s'est écrasé contre le bord de l'écran !"
        : "Le braconnier a raté Plume : son filet a fini sur sa tête !",
    );
    plumeFete();
    plumeDit(e.coups ? "Merci Leonie ! Tu m'as sauvée ! Il ne reviendra pas de sitôt." : "Hi hi ! Il est reparti. Les braconniers attrapent des animaux sauvages, c'est interdit : des gardes protègent les animaux dans les parcs.", 6000);
    window.setTimeout(() => setImage((n) => n + 1), 50);
  }

  // ---------------- la fin d'une chute : il se relève, puis continue ou s'en va
  function decider() {
    const e = s();
    e.a = 0;
    e.va = 0;
    if (e.fini || e.coups >= 2 || e.bobos >= 3 || e.scenario === "course" || (e.scenario === "fusil" && e.arme !== "fusil")) return fuir();
    e.mode = "marche";
    e.dir = e.cibleX > e.x ? 1 : -1;
    dire(hasard(["Grrr… même pas mal !", "Tu ne m'arrêteras pas !", "Bon… je recommence."]), 2);
  }
  function fuir() {
    const e = s();
    e.mode = "fuite";
    e.t = 0;
    e.dir = e.x < window.innerWidth / 2 ? -1 : 1;
    e.vitesse = 170;
    dire(hasard(DIT_FUITE), 2.4);
  }

  // ---------------- une image (60 fois par seconde)
  function avancer(dt: number) {
    const e = s();
    e.temps += dt;
    e.t += dt;
    e.sx += (1 - e.sx) * Math.min(1, dt * 9);
    e.sy += (1 - e.sy) * Math.min(1, dt * 9);
    e.etoiles = Math.max(0, e.etoiles - dt);
    e.bouclier = Math.max(0, e.bouclier - dt);
    e.parts = e.parts.filter((p) => p.fin > e.temps);
    if (e.dit && e.dit.fin < e.temps) e.dit = null;
    const sol = solY();
    const p = centrePlume();

    switch (e.mode) {
      case "marche":
      case "fuite": {
        e.x += e.dir * e.vitesse * dt;
        e.pas += dt * (e.mode === "fuite" ? 9 : 7);
        e.y = sol - BH / 2 - (e.mode === "fuite" ? Math.abs(Math.sin(e.pas)) * 6 : 0);
        e.a = e.mode === "fuite" ? Math.sin(e.pas) * 6 : 0;
        if (Math.floor(e.pas / Math.PI) !== Math.floor((e.pas - dt * 7) / Math.PI)) sons.pas();
        if (e.mode === "fuite") {
          if (e.x < -120 || e.x > window.innerWidth + 120) terminer();
        } else if (e.dir * (e.cibleX - e.x) <= 0) arriver();
        break;
      }
      case "attrape": {
        if (e.t > 0.3 && !e.lisse) {
          e.lisse = 1;
          plumeGeste("vole");
          sons.zoom();
          dire("Raté ?!", 1.2);
        }
        if (e.t > 1.1 && !e.filetTete) {
          e.filetTete = true;
          sons.bonk();
          mot(e.x, e.y - BH / 2, "TCHAC !");
          e.sy = 0.8;
          dire("Hé ! Qui a éteint la lumière ?", 2.2);
          plumeDit("Hi hi ! Il s'est attrapé tout seul !", 4000);
        }
        if (e.t > 3.2) {
          e.fini = true;
          fuir();
        }
        break;
      }
      case "vise": {
        // Il vise Plume : le bras suit la chouette.
        const px = e.x + e.dir * (70 - 60) * (BW / 120), py = e.y + (84 - 85) * (BH / 170);
        e.vise = (Math.atan2(p.y - py, (p.x - px) * e.dir) * 180) / Math.PI;
        if (e.t > 2.4) tirer(p);
        break;
      }
      case "attente":
        break;
      case "course": {
        e.vitesse = Math.min(620, e.vitesse + 650 * dt);
        e.x += e.dir * e.vitesse * dt;
        e.pas += dt * 16;
        e.y = sol - BH / 2;
        e.a = e.dir * 8;
        if (Math.random() < dt * 20) effet({ type: "poussiere", x: e.x - e.dir * 30, y: sol - 6, dx: -e.dir * 30, dy: -10, taille: 20 }, 0.6);
        const bord = e.dir < 0 ? e.x - BW / 2 <= 0 : e.x + BW / 2 >= window.innerWidth;
        if (bord) {
          e.mode = "ecrase";
          e.t = 0;
          e.x = e.dir < 0 ? BW / 2 : window.innerWidth - BW / 2;
          e.a = 0;
          e.bobos = Math.min(5, e.bobos + 1);
          e.etoiles = 2.5;
          e.fini = true;
          sons.bonk();
          sons.boing();
          mot(e.x - e.dir * 40, e.y - 30, "BONG !");
          poussiere(e.x, e.y, 10, 1.4);
          if (navigator.vibrate) try { navigator.vibrate(60); } catch { /* rien */ }
        }
        break;
      }
      case "ecrase": {
        e.sx = 0.22;
        e.sy = 1.08;
        e.y = sol - BH / 2 + Math.max(0, e.t - 1.0) * 30;
        if (e.t > 1.8) {
          e.mode = "vol";
          e.vx = -e.dir * 90;
          e.vy = 0;
          e.va = -e.dir * 140;
          e.sx = 1;
          e.sy = 1;
          dire("Ouille…", 1.5);
        }
        break;
      }
      case "tenu":
        break;
      case "vol": {
        e.vy += G * dt;
        e.vx *= 1 - 0.12 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.a += e.va * dt;
        const rad = (e.a * Math.PI) / 180;
        const hx = Math.abs(Math.cos(rad)) * BW * 0.42 + Math.abs(Math.sin(rad)) * BH * 0.47;
        const hy = Math.abs(Math.sin(rad)) * BW * 0.42 + Math.abs(Math.cos(rad)) * BH * 0.47;
        const W = window.innerWidth;
        // le sol
        if (e.y + hy > sol) {
          e.y = sol - hy;
          if (e.vy > 0) {
            choc(e.vy, e.x, sol - 4, "sol");
            e.vy = -e.vy * 0.4;
            e.vx *= 0.72;
            e.va = e.va * 0.55 + e.vx * 0.3;
          }
          e.vx *= 1 - Math.min(1, 5 * dt);
          if (Math.abs(e.vy) < 140 && Math.abs(e.vx) < 70) poser();
        }
        // les bords et le haut de l'écran
        if (e.x - hx < 0 && e.vx < 0) { e.x = hx; choc(-e.vx, 4, e.y, "mur"); e.vx = -e.vx * 0.5; e.va = -e.va * 0.7; }
        if (e.x + hx > W && e.vx > 0) { e.x = W - hx; choc(e.vx, W - 4, e.y, "mur"); e.vx = -e.vx * 0.5; e.va = -e.va * 0.7; }
        if (e.y - hy < 8 && e.vy < 0) { e.y = hy + 8; choc(-e.vy, e.x, 6, "plafond"); e.vy = -e.vy * 0.35; }
        break;
      }
      case "allonge": {
        e.etoiles = Math.max(e.etoiles, 0.3);
        if (e.t > 1.5) { e.mode = "releve"; e.t = 0; e.lisse = e.a; }
        break;
      }
      case "releve": {
        const k = Math.min(1, e.t / 0.45);
        e.a = e.lisse * (1 - k);
        const rad = (e.a * Math.PI) / 180;
        e.y = sol - (Math.abs(Math.sin(rad)) * BW * 0.42 + Math.abs(Math.cos(rad)) * BH * 0.47);
        if (k >= 1) { e.y = sol - BH / 2; decider(); }
        break;
      }
    }

    // la balle
    const b = e.balle;
    if (b) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (Math.random() < 0.6) effet({ type: "vitesse", x: b.x, y: b.y, taille: 6 }, 0.18);
      if (!b.retour && Math.hypot(b.x - p.x, b.y - p.y) <= p.r) {
        // Le bouclier du Concepteur : la balle rebondit et repart vers le chapeau du braconnier.
        e.bouclier = 1.8;
        sons.bing();
        etincelles(b.x, b.y, 14);
        mot(b.x - e.dir * 30, b.y - 30, "BING !");
        const tx = e.x + e.dir * 4, ty = e.y - BH / 2 + 22;
        const d = Math.hypot(tx - b.x, ty - b.y) || 1;
        b.vx = ((tx - b.x) / d) * 1300;
        b.vy = ((ty - b.y) / d) * 1300;
        b.retour = true;
        plumeDit("Le Concepteur me protège avec son bouclier magique : il protège toujours les plus faibles !", 6000);
      } else if (b.retour && Math.hypot(b.x - e.x, b.y - (e.y - BH / 2 + 22)) < 26) {
        e.balle = null;
        sons.bonk();
        mot(e.x, e.y - BH / 2 - 10, "PAF !");
        if (e.chapeau) {
          e.chapeau = false;
          e.objets.push({ id: idSuivant++, type: "chapeau", x: e.x, y: e.y - BH / 2 + 10, vx: -e.dir * 220, vy: -950, a: 0, va: -e.dir * 760, pose: 0 });
        }
        e.suie = true;
        e.bobos = Math.min(5, e.bobos + 1);
        for (let k = 0; k < 7; k++) effet({ type: "fumee", x: e.x + (Math.random() - 0.5) * 40, y: e.y - BH / 2 + 15, dx: (Math.random() - 0.5) * 30, dy: -60 - Math.random() * 40, taille: 14 + Math.random() * 14 }, 1.4);
        dire("…", 1.2);
        window.setTimeout(() => s().actif && s().mode === "attente" && dire("Grrr ! Maudite chouette !", 1.8), 1300);
        window.setTimeout(() => { if (s().actif && s().mode === "attente") { e.fini = true; fuir(); } }, 3000);
      } else if (b.x < -50 || b.x > window.innerWidth + 50 || b.y < -50 || b.y > window.innerHeight + 50) {
        e.balle = null;
        if (e.mode === "attente") { e.fini = true; fuir(); }
      }
    }

    // les objets qui tombent (chapeau, fusil)
    for (const o of e.objets) {
      if (o.pose) { o.pose += dt; continue; }
      o.vy += G * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.a += o.va * dt;
      if (o.y > sol - 8) {
        o.y = sol - 8;
        if (o.vy > 300) { o.vy = -o.vy * 0.35; o.vx *= 0.6; o.va *= 0.5; poussiere(o.x, sol - 4, 3, 0.5); }
        else { o.vy = 0; o.vx = 0; o.va = 0; o.a = o.type === "chapeau" ? 0 : 6; o.pose = 0.001; }
      }
      if (o.x < 10 || o.x > window.innerWidth - 10) o.vx = -o.vx * 0.5;
    }
    e.objets = e.objets.filter((o) => !o.pose || o.pose < 4);

    // Plume qui joue la course
    const a = e.acteur;
    if (a) jouerActeur(a, dt, sol);
  }

  function arriver() {
    const e = s();
    e.t = 0;
    e.lisse = 0;
    if (e.scenario === "filet") e.mode = "attrape";
    else if (e.scenario === "fusil") {
      e.mode = "vise";
      dire("Cette fois, je t'aurai !", 2.2);
    } else commencerCourse();
  }

  function tirer(p: { x: number; y: number }) {
    const e = s();
    e.mode = "attente";
    const ang = (e.vise * Math.PI) / 180;
    // le bout du canon, à l'écran
    const pivotX = e.x + e.dir * (70 - 60) * (BW / 120), pivotY = e.y + (84 - 85) * (BH / 170);
    const long = 76 * (BW / 120);
    const mx = pivotX + e.dir * Math.cos(ang) * long, my = pivotY + Math.sin(ang) * long;
    effet({ type: "flash", x: mx, y: my, taille: 46 }, 0.25);
    for (let k = 0; k < 5; k++) effet({ type: "fumee", x: mx, y: my, dx: e.dir * (20 + k * 12), dy: -20 - k * 8, taille: 12 + k * 4 }, 1.1);
    mot(mx, my - 34, "PAN !");
    sons.pan();
    e.x -= e.dir * 10;
    e.sx = 0.9;
    const d = Math.hypot(p.x - mx, p.y - my) || 1;
    e.balle = { x: mx, y: my, vx: ((p.x - mx) / d) * 1500, vy: ((p.y - my) / d) * 1500, retour: false };
  }

  function choc(vitesse: number, x: number, y: number, ou: "sol" | "mur" | "plafond") {
    const e = s();
    if (vitesse < 260) return;
    const fort = vitesse > 900;
    poussiere(x, y, fort ? 9 : 5, fort ? 1.3 : 0.8);
    if (ou === "sol") { e.sx = 1.25; e.sy = 0.78; } else { e.sx = 0.75; e.sy = 1.15; }
    if (vitesse > 520) {
      mot(x + (ou === "mur" ? (x < 50 ? 50 : -50) : 0), y - 40, hasard(MOTS));
      if (ou === "mur" || ou === "plafond") sons.boing(); else sons.bonk();
      e.bobos = Math.min(5, e.bobos + (fort ? 1 : 0));
      if (fort) { e.etoiles = 1.6; if (navigator.vibrate) try { navigator.vibrate(40); } catch { /* rien */ } }
    }
  }

  function poser() {
    const e = s();
    e.vx = e.vy = 0;
    e.va = 0;
    let a = ((e.a % 360) + 540) % 360 - 180;
    if (Math.abs(a) < 40) {
      e.a = a;
      e.mode = "releve";
      e.t = 0;
      e.lisse = a;
      return;
    }
    a = a > 0 ? 90 : -90; // il finit allongé
    e.a = a;
    e.y = solY() - BW * 0.42;
    e.mode = "allonge";
    e.t = 0;
    e.etoiles = 1.8;
    dire(hasard(["Ouille…", "Aïe aïe aïe…", "Je vois des étoiles…"]), 1.4);
  }

  // ---------------- la course (Bip Bip !)
  function commencerCourse() {
    const e = s();
    const p = centrePlume();
    document.body.dataset.plumeActeur = "1";
    e.acteur = { x: p.x, y: p.y, phase: "saute", t: 0, de: { x: p.x, y: p.y }, vers: { x: e.x - e.dir * 150, y: p.y }, anim: "vole", miroir: e.dir > 0 };
    e.mode = "attente";
    sons.bipbip();
    dire("Hein ?!", 1);
  }
  function jouerActeur(a: Acteur, dt: number, sol: number) {
    const e = s();
    a.t += dt;
    const plumeY = sol - 40;
    switch (a.phase) {
      case "saute": {
        const k = Math.min(1, a.t / 0.55);
        a.x = a.de.x + (a.vers.x - a.de.x) * k;
        a.y = a.de.y + (plumeY - a.de.y) * k - Math.sin(k * Math.PI) * 150;
        if (k >= 1) {
          a.phase = "court";
          a.t = 0;
          a.anim = "jeu";
          sons.zoom();
          if (e.mode === "attente") {
            e.mode = "course";
            e.dir = (e.dir * -1) as 1 | -1;
            e.vitesse = 60;
            dire("Reviens ici !", 1.6);
          }
        }
        break;
      }
      case "court": {
        const vers = e.dir; // elle court dans le même sens que lui, devant lui
        a.x += vers * 640 * dt;
        a.y = plumeY - Math.abs(Math.sin(a.t * 22)) * 8;
        if (Math.random() < dt * 30) effet({ type: "poussiere", x: a.x - vers * 20, y: sol - 6, dx: -vers * 40, dy: -8, taille: 16 }, 0.5);
        if (Math.random() < dt * 25) effet({ type: "vitesse", x: a.x - vers * 40, y: a.y + (Math.random() - 0.5) * 30, taille: 30 }, 0.2);
        const bord = vers < 0 ? a.x < 60 : a.x > window.innerWidth - 60;
        if (bord) { a.x = vers < 0 ? 60 : window.innerWidth - 60; a.phase = "attend"; a.t = 0; a.anim = "coucou"; sons.bipbip(); }
        break;
      }
      case "attend": {
        const proche = Math.abs(e.x - a.x) < 190 && e.mode === "course";
        if (proche || a.t > 2.5) { a.phase = "envol"; a.t = 0; a.de = { x: a.x, y: a.y }; a.anim = "vole"; sons.zoom(); }
        break;
      }
      case "envol": {
        const k = Math.min(1, a.t / 0.35);
        a.y = a.de.y - k * 230;
        a.x = a.de.x + Math.sin(a.t * 10) * 4;
        if (a.t > 1.3) {
          a.phase = "retour";
          a.t = 0;
          a.de = { x: a.x, y: a.y };
          const b = document.querySelector(".plume-racine")?.getBoundingClientRect();
          a.vers = b && b.width > 10 ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : { x: window.innerWidth - 60, y: sol - 60 };
          a.miroir = a.vers.x < a.x;
        }
        break;
      }
      case "retour": {
        const k = Math.min(1, a.t / 0.9);
        const l = k * k * (3 - 2 * k);
        a.x = a.de.x + (a.vers.x - a.de.x) * l;
        a.y = a.de.y + (a.vers.y - a.de.y) * l - Math.sin(l * Math.PI) * 80;
        if (k >= 1) {
          e.acteur = null;
          delete document.body.dataset.plumeActeur;
          plumeDit("Bip bip ! Hi hi, il est trop lent ! Et moi, je sais voler.", 5000);
          if (e.mode === "attente") fuir();
        }
        break;
      }
    }
  }

  // ---------------- le doigt de Leonie
  function attraper(ev: PE<HTMLDivElement>) {
    const e = s();
    if (!e.actif || e.mode === "ecrase") return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    if (e.arme === "fusil" && e.mode !== "vol") {
      // Il lâche son fusil.
      e.objets.push({ id: idSuivant++, type: "fusil", x: e.x + e.dir * 30, y: e.y, vx: e.dir * 120, vy: -380, a: 0, va: e.dir * 420, pose: 0 });
      e.arme = null;
    }
    e.mode = "tenu";
    e.saisie = { dx: ev.clientX - e.x, dy: ev.clientY - e.y, pts: [{ x: ev.clientX, y: ev.clientY, t: performance.now() }] };
    e.etoiles = 0;
    dire(hasard(["Hé ! Lâche-moi !", "Oh oh…", "Pas touche !"]), 1.2);
  }
  function bouger(ev: PE<HTMLDivElement>) {
    const e = s();
    if (e.mode !== "tenu" || !e.saisie) return;
    const t = performance.now();
    const nx = ev.clientX - e.saisie.dx, ny = Math.min(solY() - BH / 2, ev.clientY - e.saisie.dy);
    e.a = Math.max(-35, Math.min(35, (nx - e.x) * 1.5));
    e.x = nx;
    e.y = ny;
    e.saisie.pts.push({ x: ev.clientX, y: ev.clientY, t });
    e.saisie.pts = e.saisie.pts.filter((p) => t - p.t < 90);
  }
  function lacher() {
    const e = s();
    if (e.mode !== "tenu" || !e.saisie) return;
    const pts = e.saisie.pts;
    const a = pts[0], b = pts[pts.length - 1];
    const dtp = Math.max(16, b.t - a.t) / 1000;
    let vx = (b.x - a.x) / dtp, vy = (b.y - a.y) / dtp;
    const v = Math.hypot(vx, vy);
    if (v < 160) {
      // Un simple toucher : une pichenette qui le fait culbuter en arrière.
      vx = -e.dir * 420;
      vy = -1150;
      e.va = -e.dir * 760;
    } else {
      const k = Math.min(1, 3400 / v);
      vx *= k;
      vy *= k;
      e.va = vx * 0.55 + (Math.random() - 0.5) * 200;
    }
    e.vx = vx;
    e.vy = vy;
    e.mode = "vol";
    e.saisie = null;
    e.coups += 1;
    if (vy < -700) sons.sifflet();
    dire(hasard(DIT_LANCE), 1.4);
    if (e.coups === 1) plumeDit(hasard(["Bravo Leonie !", "Wouah, quel lancer !", "Hi hi, il vole !"]), 2500);
  }

  // ---------------- l'affichage
  const e = S.current;
  if (!e.actif) return null;
  const p = e.bouclier ? centrePlume() : null;
  const a = e.acteur;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-live="polite">
      {/* le bouclier du Concepteur */}
      {p ? (
        <span className="bouclier-concepteur absolute rounded-full" style={{ left: p.x - p.r * 1.25, top: p.y - p.r * 1.25, width: p.r * 2.5, height: p.r * 2.5, opacity: Math.min(1, e.bouclier * 1.5) }} />
      ) : null}

      {/* les objets tombés */}
      {e.objets.map((o) => (
        <span key={o.id} className="absolute block" style={{ left: o.x - 30, top: o.y - 14, width: 60, height: 28, transform: `rotate(${o.a}deg)`, opacity: o.pose > 3 ? 4 - o.pose : 1 }}>
          <svg viewBox={o.type === "chapeau" ? "24 12 62 30" : "-4 -4 80 22"} className="size-full overflow-visible">
            {o.type === "chapeau" ? (
              <g><path d="M30 36 L80 36 L76 30 L68 16 L42 16 L34 30 Z" fill="#6b4a2a" /><rect x="26" y="33" width="58" height="6" rx="3" fill="#523720" /></g>
            ) : <Fusil />}
          </svg>
        </span>
      ))}

      {/* le braconnier */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Le braconnier : touche-le ou lance-le avec le doigt"
        onPointerDown={attraper}
        onPointerMove={bouger}
        onPointerUp={lacher}
        onPointerCancel={lacher}
        className="pointer-events-auto absolute cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ left: e.x - BW / 2, top: e.y - BH / 2, width: BW, height: BH, transform: `rotate(${e.a}deg) scale(${e.sx}, ${e.sy})`, transformOrigin: e.mode === "ecrase" ? (e.dir < 0 ? "0% 50%" : "100% 50%") : "50% 70%" }}
      >
        <div className="size-full" style={{ transform: `scaleX(${e.dir})` }}>
          <Dessin m={e.mode} bobos={e.bobos} chapeau={e.chapeau} suie={e.suie} filetTete={e.filetTete} arme={e.arme} vise={e.vise} etourdi={e.etoiles > 0} pas={e.pas} />
        </div>
      </div>
      {e.dit ? (
        <span className="brac-bulle absolute whitespace-nowrap rounded-2xl bg-white px-3 py-1 text-sm font-black text-[#2a1650] shadow-lg" style={{ left: Math.max(8, Math.min(window.innerWidth - 190, e.x - 60)), top: Math.max(8, e.y - BH / 2 - 44) }}>
          {e.dit.texte}
        </span>
      ) : null}

      {/* la balle */}
      {e.balle ? <span className="absolute block size-2.5 rounded-full bg-[#2a2a2a] shadow-[0_0_6px_#fff]" style={{ left: e.balle.x - 5, top: e.balle.y - 5 }} /> : null}

      {/* Plume, quand elle joue la course */}
      {a ? (
        <span className="absolute block" style={{ left: a.x - 34, top: a.y - 34, width: 68, height: 68 }}>
          <PlumeDessin anim={a.anim} miroir={a.miroir} className="size-full" />
          {a.phase === "saute" || a.phase === "attend" || a.phase === "envol" ? <span className="brac-bulle absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-2.5 py-0.5 text-sm font-black text-[#7a4fd0] shadow">Bip bip !</span> : null}
        </span>
      ) : null}

      {/* les effets */}
      {e.parts.map((q) => (
        <span
          key={q.id}
          className={`eff-${q.type} absolute block`}
          style={{ left: q.x, top: q.y, ["--dx" as string]: `${q.dx ?? 0}px`, ["--dy" as string]: `${q.dy ?? 0}px`, ["--r" as string]: `${q.r ?? 0}deg`, ["--s" as string]: `${q.taille ?? 20}px` }}
        >
          {q.type === "mot" ? q.texte : null}
        </span>
      ))}
    </div>,
    document.body,
  );
}

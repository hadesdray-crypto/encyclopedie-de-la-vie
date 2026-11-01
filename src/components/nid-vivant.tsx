// Le nid vivant : un petit monde où Plume, son compagnon et le bébé vivent pour de vrai avec le braconnier.
//  - une seule gravité pour tout le monde (on peut tout attraper et lancer, braconnier compris) ;
//  - les oiseaux sont lourds : du haut vers le bas ils ouvrent les ailes et glissent en ligne droite,
//    du bas vers le haut ils galèrent (ils montent, retombent…) ; le bébé essaie tout le temps de voler ;
//  - chaque compagnon protège à sa façon, jusqu'à se sacrifier : il se fait prendre dans l'épuisette… et s'échappe ;
//  - pour caresser ou gratouiller : on dessine un rond (doucement) ou un zigzag (vite) sur le personnage.
// Tout est calculé dans une seule boucle, avec des déplacements directs (pas de redessin à chaque image).
import { useEffect, useRef, useState } from "react";
import { PlumeDessin, type AnimPlume } from "@/components/plume-dessin";
import { Dessin as DessinBrac, type Mode as ModeBrac } from "@/components/braconnier";
import { LOOK_AMI, LOOK_BEBE } from "@/components/histoire";
import { sons } from "@/lib/sons";
import { PRETENDANTS, pretendant, type Pretendant } from "@/lib/pretendants";

const G = 2200;
type Kind = "plume" | "male" | "bebe" | "brac" | "baie";
type M = "sol" | "saut" | "vol" | "planer" | "monte" | "tenu" | "pris" | "entre" | "chasse" | "filet" | "emporte" | "etourdi" | "allonge" | "releve" | "fuite";
type Plan = { type: "charge" | "fumigene" | "chant" | "baie" | "sacrifice" | "hesite"; t: number; fait: boolean; faible?: boolean };
type C = {
  id: string; k: Kind; w: number; h: number; x: number; y: number; vx: number; vy: number; a: number; va: number; dir: 1 | -1;
  mode: M; anim: AnimPlume; animFin: number; t: number; bulle: { texte: string; fin: number } | null; sx: number; sy: number;
  pas: number; flaps: number; maxFlaps: number; air: boolean; surf: number; prochain: number; plan: Plan | null; stun: number; slow: number;
  bobos: number; coups: number; carry: C | null; cible: C | null; force: boolean; evasions: number; cible_x: number; chute: number; attente: number; fait_filet: boolean; lisse: number;
};
type Part = { id: number; x: number; y: number; txt: string };
type Monde = {
  W: number; H: number; sol: number; pf: { x0: number; x1: number; y: number }; cs: C[]; brac: C | null; temps: number;
  held: { c: C; dx: number; dy: number; pts: { x: number; y: number; t: number }[] } | null;
  geste: { x: number; y: number; t: number }[]; ring: { id: string; fin: number } | null; sig: string; marche: boolean;
};

export const mesure = { fps: 0, n: 0 };
export function useFps() {
  const [v, setV] = useState({ fps: 0, n: 0 });
  useEffect(() => {
    const t = window.setInterval(() => setV({ fps: mesure.fps, n: mesure.n }), 600);
    return () => window.clearInterval(t);
  }, []);
  return v;
}

const hasard = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const DIT_PRIS: Record<string, string> = {
  costaud: "Même pas mal !", savant: "C'était calculé !", poete: "La liberté !", gourmand: "J'ai mordu le filet !", fanfaron: "C'était prévu !", timide: "Pardon, pardon…",
};
let idPart = 1;

function nouveau(id: string, k: Kind, w: number, h: number, x: number, sol: number): C {
  return {
    id, k, w, h, x, y: sol - h / 2 + 3, vx: 0, vy: 0, a: 0, va: 0, dir: 1, mode: "sol", anim: "rien", animFin: 0, t: 0, bulle: null, sx: 1, sy: 1,
    pas: 0, flaps: 0, maxFlaps: 2, air: false, surf: sol, prochain: 1 + Math.random() * 2, plan: null, stun: 0, slow: 0,
    bobos: 0, coups: 0, carry: null, cible: null, force: false, evasions: 0, cible_x: x, chute: 0, attente: 0, fait_filet: false, lisse: 0,
  };
}

export function NidVivant({ idMale, parents = false, onMale }: { idMale?: string; parents?: boolean; onMale?: (id: string) => void }) {
  const male: Pretendant | null = pretendant(idMale) ?? null;
  const scene = useRef<HTMLDivElement>(null);
  const ringEl = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, { o: HTMLDivElement | null; i: HTMLDivElement | null }>>({});
  const monde = useRef<Monde | null>(null);
  const [, setN] = useState(0);
  const [parts, setParts] = useState<Part[]>([]);
  const [outil, setOutil] = useState<"main" | "caresse">("main");
  const outilRef = useRef(outil);
  outilRef.current = outil;
  const [enCours, setEnCours] = useState(false);
  const verbe = useRef<{ venir: () => void; remettre: () => void }>({ venir: () => {}, remettre: () => {} });

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const mesurer = () => {
      const r = el.getBoundingClientRect();
      return { W: r.width || 320, H: r.height || 340 };
    };
    const geo = (W: number, H: number) => {
      const sol = H - 12;
      return { sol, pf: { x0: W * 0.56, x1: W * 0.97, y: sol - 128 } };
    };
    const creer = (): Monde => {
      const { W, H } = mesurer();
      const { sol, pf } = geo(W, H);
      const cs = [
        nouveau("male", "male", 88, 88, W * 0.22, sol),
        nouveau("bebe", "bebe", 52, 52, W * 0.38, sol),
        nouveau("plume", "plume", 78, 78, W * 0.5, sol),
      ];
      cs[0].dir = 1; cs[1].dir = 1; cs[2].dir = -1;
      return { W, H, sol, pf, cs, brac: null, temps: 0, held: null, geste: [], ring: null, sig: "", marche: true };
    };
    monde.current = creer();
    const m = () => monde.current as Monde;
    const birds = () => m().cs.filter((c) => c.k === "plume" || c.k === "male" || c.k === "bebe");
    const bas = (c: C) => c.y + c.h / 2 - 3;
    const poser = (c: C, y: number) => { c.y = y - c.h / 2 + 3; c.surf = y; };

    // ---------------- petits outils
    const dit = (c: C, texte: string, d = 2) => { c.bulle = { texte, fin: m().temps + d }; };
    const geste = (c: C, a: AnimPlume, d: number) => { c.anim = a; c.animFin = m().temps + d; };
    const effet = (x: number, y: number, txt: string) => {
      const p = { id: idPart++, x, y, txt };
      setParts((l) => [...l.slice(-14), p]);
      window.setTimeout(() => setParts((l) => l.filter((q) => q.id !== p.id)), 1300);
    };
    const son = (f: () => void) => { try { f(); } catch { /* rien */ } };
    const poussiere = (c: C) => effet(c.x, bas(c), "💨");

    // ---------------- le braconnier arrive
    const venir = () => {
      const w = m();
      if (w.brac) return;
      const b = nouveau("brac", "brac", 70, 100, -50, w.sol);
      b.mode = "entre";
      b.dir = 1;
      b.cible_x = w.W * 0.2;
      dit(b, hasard(["Chuuut… je vais les attraper…", "Hé hé hé…"]), 2.5);
      w.cs.push(b);
      w.brac = b;
      setEnCours(true);
    };
    const remettre = () => { monde.current = creer(); setEnCours(false); setN((n) => n + 1); };
    verbe.current = { venir, remettre };

    // ---------------- les compagnons protègent, chacun à sa façon
    const planDe = (p: Pretendant | null): Plan["type"] => {
      switch (p?.id) {
        case "costaud": return "charge";
        case "savant": return "fumigene";
        case "poete": return "chant";
        case "gourmand": return "baie";
        case "fanfaron": return "sacrifice";
        case "timide": return "hesite";
        default: return "charge";
      }
    };
    const lancerPlan = (c: C, type: Plan["type"], faible = false) => { c.plan = { type, t: 0, fait: false, faible }; };
    const finPlan = (c: C) => {
      c.plan = null;
      const b = m().brac;
      if (b && b.mode === "chasse" && b.cible && b.cible !== c && !b.carry && Math.random() < 0.45) lancerPlan(c, "sacrifice");
    };
    const frapper = (c: C, b: C, fx: number, fy: number, texte: string) => {
      if (b.carry) { const p = b.carry; p.mode = "vol"; p.vy = -200; p.vx = c.dir * 80; geste(p, "bravo", 1.2); b.carry = null; }
      b.mode = "vol"; b.vx = c.dir * fx; b.vy = fy; b.va = c.dir * 700; b.bobos += 1; b.coups += 1;
      dit(c, texte, 1.8); geste(c, "bravo", 1.5);
      effet(b.x, b.y - 30, "💥");
      son(() => sons.bonk());
    };
    const jouerPlan = (c: C, dt: number) => {
      const p = c.plan, b = m().brac;
      if (!p) return;
      if (!b || b.mode === "fuite") { c.plan = null; return; }
      p.t += dt;
      const dx = b.x - c.x;
      c.dir = dx >= 0 ? 1 : -1;
      const dist = Math.abs(dx);
      switch (p.type) {
        case "charge":
          if (dist > 80) { c.x += c.dir * (p.faible ? 190 : 285) * dt; c.pas += dt * 14; c.anim = "bataille"; c.animFin = m().temps + 0.2; c.y = c.surf - c.h / 2 + 3 - Math.abs(Math.sin(c.pas)) * 5; }
          else if (!p.fait) { p.fait = true; frapper(c, b, p.faible ? 420 : 760, p.faible ? -650 : -980, p.faible ? "Laisse-les tranquilles !" : "Pas touche !"); finPlan(c); }
          if (p.t > 4) finPlan(c);
          break;
        case "fumigene":
          if (p.t < 0.9) { if (!c.bulle) dit(c, "Fumigène !", 1); geste(c, "ailes", 0.3); }
          else if (!p.fait) { p.fait = true; effet(b.x, b.y - 20, "💨"); effet(b.x - 20, b.y, "💨"); effet(b.x + 20, b.y - 40, "💨"); b.stun = 2.6; dit(b, "Cof ! Cof !", 2); dit(c, "Selon mes calculs…", 2); }
          if (p.t > 2) finPlan(c);
          break;
        case "chant":
          geste(c, "parle", 0.3);
          if (!p.fait) { p.fait = true; dit(c, "♪ La la la…", 2.4); b.slow = 3.2; }
          if (Math.floor(p.t * 2.5) !== Math.floor((p.t - dt) * 2.5)) effet(c.x + c.dir * 30, c.y - 40, "♪");
          if (p.t > 3) finPlan(c);
          break;
        case "baie":
          if (p.t > 0.5 && !p.fait) {
            p.fait = true;
            const t = nouveau("baie" + idPart++, "baie", 20, 20, c.x, m().sol);
            t.y = c.y - 30; t.mode = "vol";
            t.vx = ((b.x - c.x) / 0.7); t.vy = ((b.y - t.y) / 0.7) - 0.5 * G * 0.7;
            m().cs.push(t);
            dit(c, "À table !", 1.2);
          }
          if (p.t > 1.8) finPlan(c);
          break;
        case "hesite":
          geste(c, "peur", 0.3);
          if (!c.bulle) dit(c, "… Euh…", 1.3);
          if (p.t > 1.5) lancerPlan(c, "charge", true);
          break;
        case "sacrifice":
          if (dist > 74) { c.x += c.dir * 240 * dt; c.pas += dt * 14; c.y = c.surf - c.h / 2 + 3 - Math.abs(Math.sin(c.pas)) * 5; }
          else if (!p.fait) {
            p.fait = true;
            b.cible = c; b.force = true;
            dit(c, hasard(["Prends-moi, moi !", "Laisse-les, c'est moi que tu veux !"]), 2);
          }
          if (p.t > 3) finPlan(c);
          break;
      }
    };

    // ---------------- le braconnier réfléchit
    const choisir = (b: C): C | null => {
      if (b.force && b.cible && (b.cible.mode === "sol" || b.cible.mode === "saut")) return b.cible;
      let meilleur: C | null = null, d = 1e9;
      for (const c of birds()) {
        if (c.mode !== "sol" && c.mode !== "saut") continue;
        if (c.surf !== m().sol) continue;
        const dd = Math.abs(c.x - b.x);
        if (dd < d) { d = dd; meilleur = c; }
      }
      return meilleur;
    };
    const pris = (b: C, c: C) => {
      c.mode = "pris"; b.carry = c; b.mode = "emporte"; b.t = 0; b.force = false;
      b.dir = b.x < m().W / 2 ? -1 : 1;
      dit(b, "Je te tiens !", 1.6); geste(c, "peur", 3);
      son(() => sons.zoom());
      const p = birds().find((o) => o.k === "plume" && o !== c);
      if (p) { dit(p, c.k === "male" ? `Oh non ! ${male?.nom ?? "Il"} est pris !` : "Au secours !", 2.2); geste(p, "peur", 2); }
    };
    const echapper = (b: C) => {
      const c = b.carry;
      if (!c) return;
      c.mode = "vol"; c.vx = -b.dir * 210; c.vy = -680; c.va = 0; c.chute = 0;
      geste(c, "bravo", 1.5);
      dit(c, c.k === "male" ? (DIT_PRIS[male?.id ?? ""] ?? "Ouf !") : c.k === "bebe" ? "Piou ! Piou !" : "Hi hi ! Raté !", 2);
      b.carry = null; b.mode = "etourdi"; b.t = 0; b.evasions += 1; b.stun = 1.6;
      dit(b, "Raté ?!", 1.6);
      effet(b.x, b.y - 40, "💫");
    };
    const cerveau = (b: C, dt: number) => {
      const w = m();
      b.t += dt;
      b.stun = Math.max(0, b.stun - dt);
      b.slow = Math.max(0, b.slow - dt);
      const vit = (b.slow > 0 ? 0.3 : 1);
      switch (b.mode) {
        case "entre":
          b.x += b.dir * 120 * dt; b.pas += dt * 7; b.y = w.sol - b.h / 2 + 3;
          if (b.dir * (b.cible_x - b.x) <= 0) { b.mode = "chasse"; b.t = 0; }
          break;
        case "chasse": {
          b.pas += dt * (b.stun > 0 ? 0 : 7);
          if (b.stun > 0) break;
          const c = choisir(b);
          if (!c) {
            b.attente += dt;
            if (b.attente > 1 && !b.bulle) dit(b, hasard(["Descendez de là !", "Je vous attends…"]), 2);
            if (b.attente > 7) { b.mode = "fuite"; dit(b, "Bon… une autre fois.", 2); }
            break;
          }
          b.attente = 0;
          if (b.cible !== c) {
            b.cible = c;
            for (const o of birds()) if (o.k === "male" && o.mode === "sol" && !o.plan && o !== c && c.k !== "male") lancerPlan(o, planDe(male));
            if (c.k === "male") for (const o of birds()) if (o.k === "plume") { dit(o, `Attention ${male?.nom ?? ""} !`, 1.8); geste(o, "peur", 1.8); }
          }
          const dx = c.x - b.x;
          b.dir = dx >= 0 ? 1 : -1;
          b.x += b.dir * 108 * vit * dt;
          b.y = w.sol - b.h / 2 + 3;
          if (Math.abs(dx) < 92) { b.mode = "filet"; b.t = 0; }
          break;
        }
        case "filet": {
          b.pas = 0;
          if (b.t > 0.4 && !b.fait_filet) {
            b.fait_filet = true;
            const c = b.cible;
            const hx = b.x + b.dir * 58;
            if (c && (c.mode === "sol" || c.mode === "saut") && Math.abs(c.x - hx) < 70 && c.surf === w.sol) pris(b, c);
            else { b.mode = "etourdi"; b.stun = 1.2; b.t = 0; b.force = false; dit(b, "Raté !", 1.2); }
          }
          break;
        }
        case "emporte": {
          b.pas += dt * 8;
          b.x += b.dir * 88 * vit * dt;
          b.y = w.sol - b.h / 2 + 3;
          const c = b.carry;
          if (c) { c.x = b.x + b.dir * 52; c.y = b.y - 22; c.vx = c.vy = 0; c.dir = (b.dir * -1) as 1 | -1; }
          if (b.t > 2.6 || b.x < 40 || b.x > w.W - 40) echapper(b);
          break;
        }
        case "etourdi":
          b.pas = 0;
          if (b.t > Math.max(0.5, b.stun)) {
            b.fait_filet = false;
            if (b.evasions >= 3 || b.bobos >= 3) { b.mode = "fuite"; dit(b, hasard(["Je reviendrai !", "Maudites chouettes !"]), 2.2); }
            else { b.mode = "chasse"; b.t = 0; b.cible = null; }
          }
          break;
        case "fuite":
          b.dir = b.x < w.W / 2 ? -1 : 1;
          b.x += b.dir * 175 * dt; b.pas += dt * 9; b.y = w.sol - b.h / 2 + 3 - Math.abs(Math.sin(b.pas)) * 5;
          if (b.x < -90 || b.x > w.W + 90) {
            w.cs = w.cs.filter((c) => c !== b);
            w.brac = null;
            setEnCours(false);
            const p = birds().find((o) => o.k === "plume");
            if (p) { dit(p, "Hi hi ! Ensemble, on est plus forts !", 3); geste(p, "bravo", 2); }
            for (const o of birds()) { o.plan = null; }
          }
          break;
        case "allonge":
          b.a = b.a;
          if (b.t > 1.3) { b.mode = "releve"; b.t = 0; b.lisse = b.a; }
          break;
        case "releve": {
          const k = Math.min(1, b.t / 0.45);
          b.a = b.lisse * (1 - k);
          b.y = w.sol - b.h / 2 + 3;
          if (k >= 1) { b.a = 0; b.mode = (b.coups >= 2 || b.bobos >= 3) ? "fuite" : "etourdi"; b.t = 0; b.stun = 0.8; if (b.mode === "fuite") dit(b, hasard(["Ouille, ouille, ouille…", "Maman…"]), 2.2); }
          break;
        }
      }
    };

    // ---------------- les oiseaux
    const vers = (c: C, x: number, v: number, dt: number) => { c.dir = x >= c.x ? 1 : -1; c.x += c.dir * v * dt; c.pas += dt * 9; };
    const planer = (c: C, dir: 1 | -1) => { c.mode = "planer"; c.dir = dir; c.vx = dir * 245; c.vy = 195; c.va = 0; c.a = dir * 9; c.anim = "vole"; c.animFin = 1e9; };
    const atterrir = (c: C, y: number, force: number) => {
      poser(c, y);
      c.vy = 0; c.vx *= 0.2; c.va = 0; c.a = 0; c.air = false; c.flaps = 0; c.chute = 0; c.t = 0;
      c.mode = "sol";
      if (c.anim === "vole") { c.anim = "rien"; c.animFin = 0; }
      c.sy = 0.8; c.sx = 1.15;
      if (force > 200) { poussiere(c); if (force > 600) son(() => sons.bonk()); }
    };
    const murs = (c: C) => {
      const w = m();
      const hx = c.w * 0.38;
      if (c.x < hx) { c.x = hx; c.vx = Math.abs(c.vx) * 0.5; if (c.mode === "planer") { c.dir = 1; c.vx = 245; c.a = 9; } }
      if (c.x > w.W - hx) { c.x = w.W - hx; c.vx = -Math.abs(c.vx) * 0.5; if (c.mode === "planer") { c.dir = -1; c.vx = -245; c.a = -9; } }
      if (c.y - c.h / 2 < 4 && c.vy < 0) { c.y = c.h / 2 + 4; c.vy = Math.abs(c.vy) * 0.3; }
    };
    /** Gravité et rebonds : le même pour tout le monde. */
    const tomber = (c: C, dt: number, flap = false) => {
      const w = m();
      const avant = bas(c);
      c.vy += G * dt;
      if (flap && c.vy > 170) c.vy = 170;
      c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt;
      murs(c);
      const b = bas(c);
      if (c.vy >= 0 && avant <= w.pf.y + 3 && b >= w.pf.y && c.x > w.pf.x0 && c.x < w.pf.x1 && c.k !== "brac" && c.k !== "baie") { atterrir(c, w.pf.y, c.vy); return true; }
      if (b >= w.sol) {
        if (c.k === "brac") return false;
        if (c.k === "baie") return false;
        if (c.vy > 520 && c.mode === "vol") { c.vy = -c.vy * 0.33; c.vx *= 0.7; c.y = w.sol - c.h / 2 + 3; c.sy = 0.78; c.sx = 1.2; poussiere(c); son(() => sons.boing()); return false; }
        atterrir(c, w.sol, c.vy);
        return true;
      }
      return false;
    };
    const oiseau = (c: C, dt: number) => {
      const w = m();
      const b = w.brac;
      const danger = b && !b.fait_filet && ["chasse", "filet", "emporte", "entre"].includes(b.mode) ? Math.abs(b.x - c.x) : 1e9;
      c.t += dt;
      switch (c.mode) {
        case "pris": case "tenu": return;
        case "vol": {
          tomber(c, dt);
          c.chute = c.vy > 0 ? c.chute + dt : 0;
          if (c.mode === "vol" && c.vy > 0 && c.chute > 0.22 && w.sol - bas(c) > 95) planer(c, c.vx >= 0 ? 1 : -1);
          return;
        }
        case "planer": {
          const avant = bas(c);
          c.x += c.vx * dt; c.y += c.vy * dt;
          murs(c);
          const bb = bas(c);
          if (avant <= w.pf.y + 3 && bb >= w.pf.y && c.x > w.pf.x0 && c.x < w.pf.x1) atterrir(c, w.pf.y, 150);
          else if (bb >= w.sol) atterrir(c, w.sol, 150);
          return;
        }
        case "saut": {
          c.anim = "vole"; c.animFin = m().temps + 0.2;
          if (tomber(c, dt, true)) { c.prochain = 0.7 + Math.random() * 1.6; }
          return;
        }
        case "monte": {
          if (!c.air) {
            const cx = (w.pf.x0 + w.pf.x1) / 2;
            const bord = c.x < w.pf.x0 - 50 ? w.pf.x0 - 40 : c.x > w.pf.x1 ? w.pf.x1 - 30 : c.x;
            if (c.surf === w.pf.y) { c.mode = "sol"; return; }
            if (Math.abs(bord - c.x) > 18 && c.x < w.pf.x0 - 50) { vers(c, bord, 70, dt); c.y = c.surf - c.h / 2 + 3 - Math.abs(Math.sin(c.pas)) * 4; return; }
            if (c.t > 0.45) {
              c.air = true; c.vy = -640; c.vx = (cx > c.x ? 1 : -1) * 105; c.flaps = 0; c.maxFlaps = hasard([0, 1, 2, 2, 2]); c.dir = c.vx > 0 ? 1 : -1; c.anim = "vole"; c.animFin = 1e9; c.sy = 1.12; c.sx = 0.9;
            }
            return;
          }
          const aterri = tomber(c, dt);
          if (aterri) { c.t = 0; return; }
          if (c.vy > 0 && c.flaps < c.maxFlaps) { c.flaps += 1; c.vy = -(440 - c.flaps * 90); c.sy = 1.1; }
          return;
        }
        case "sol": {
          c.pas += 0;
          c.y = c.surf - c.h / 2 + 3;
          if (c.surf === w.pf.y && (c.x < w.pf.x0 || c.x > w.pf.x1)) { c.mode = "vol"; c.vy = 0; return; }
          if (c.plan) { jouerPlan(c, dt); return; }
          // le danger : les oiseaux fuient (en galérant vers la branche) ; le compagnon garde
          if (c.k === "male" && b && danger < 400) { c.dir = b.x >= c.x ? 1 : -1; return; }
          if (c.k !== "male" && danger < 240 && c.surf === w.sol) {
            c.mode = "monte"; c.t = 0; c.air = false;
            if (!c.bulle) dit(c, c.k === "bebe" ? "Piou !" : "Vite, la branche !", 1.6);
            geste(c, "peur", 1.4);
            return;
          }
          // la vie de tous les jours
          if (c.k === "bebe") {
            c.prochain -= dt;
            if (c.prochain <= 0) { c.mode = "saut"; c.vy = -540 - Math.random() * 120; c.vx = (Math.random() - 0.5) * 220; c.dir = c.vx >= 0 ? 1 : -1; c.sy = 1.15; c.prochain = 0.6 + Math.random() * 1.5; if (Math.random() < 0.3) dit(c, hasard(["Piou !", "Je vole !", "Regarde !"]), 1.2); }
            return;
          }
          if (c.surf === w.pf.y) {
            if (c.t > 5.5) { c.cible_x = w.pf.x0 + 6; }
            if (c.t > 5.5 && c.x <= w.pf.x0 + 12) { planer(c, -1); c.x = w.pf.x0 - 6; return; }
            if (c.t > 5.5) { vers(c, c.cible_x, 70, dt); c.y = c.surf - c.h / 2 + 3 - Math.abs(Math.sin(c.pas)) * 3; return; }
          }
          c.prochain -= dt;
          if (c.prochain <= 0) {
            c.prochain = 2 + Math.random() * 3;
            if (c.k === "plume" && c.surf === w.sol && Math.random() < 0.3 && !w.brac) { c.mode = "monte"; c.t = 0; c.air = false; return; }
            c.cible_x = Math.max(c.w * 0.5, Math.min(w.W - c.w * 0.5, c.x + (Math.random() - 0.5) * 160));
          }
          if (Math.abs(c.cible_x - c.x) > 6) { vers(c, c.cible_x, 42, dt); c.y = c.surf - c.h / 2 + 3 - Math.abs(Math.sin(c.pas)) * 3; }
          return;
        }
      }
    };

    // ---------------- le braconnier lancé
    const braconnierVol = (b: C, dt: number) => {
      const w = m();
      b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
      murs(b);
      if (bas(b) >= w.sol) {
        b.y = w.sol - b.h / 2 + 3;
        if (b.vy > 420) {
          const fort = b.vy > 900;
          if (fort) { b.bobos += 1; effet(b.x, b.y - 50, "💫"); }
          b.vy = -b.vy * 0.36; b.vx *= 0.7; b.va = b.va * 0.5; b.sy = 0.75; b.sx = 1.25;
          poussiere(b); son(() => sons.bonk());
        } else {
          b.vy = 0; b.vx = 0; b.va = 0;
          let a = ((b.a % 360) + 540) % 360 - 180;
          if (Math.abs(a) < 40) { b.a = a; b.mode = "releve"; b.lisse = a; b.t = 0; }
          else { b.a = a > 0 ? 90 : -90; b.y = w.sol - b.w * 0.42; b.mode = "allonge"; b.t = 0; dit(b, hasard(["Aïe aïe aïe…", "Je vois des étoiles…"]), 1.4); }
        }
      }
    };

    // ---------------- les gestes : attraper / lancer / caresser / gratouiller
    const local = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const sous = (x: number, y: number) => {
      let meilleur: C | null = null, d = 1e9;
      for (const c of m().cs) {
        if (c.k === "baie") continue;
        const dd = Math.hypot((c.x - x) / (c.w * 0.55), (c.y - y) / (c.h * 0.55));
        if (dd < 1 && dd < d) { d = dd; meilleur = c; }
      }
      return meilleur;
    };
    const analyser = (pts: { x: number; y: number; t: number }[]) => {
      const n = pts.length;
      if (n < 8) return null;
      let L = 0, turn = 0, rev = 0, last = 0, prev: number | null = null;
      for (let i = 1; i < n; i++) {
        const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, d = Math.hypot(dx, dy);
        if (d < 4) continue;
        L += d;
        const ang = Math.atan2(dy, dx);
        if (prev !== null) { let da = ang - prev; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; turn += da; }
        prev = ang;
        if (Math.abs(dx) > 5) { const s = Math.sign(dx); if (last && s !== last) rev += 1; last = s; }
      }
      const dur = Math.max(0.05, (pts[n - 1].t - pts[0].t) / 1000);
      const v = L / dur;
      if (rev >= 5 && v > 450) return "gratte";
      if (Math.abs(turn) >= 4.4 && v < 700) return "caresse";
      return null;
    };
    const majorite = (pts: { x: number; y: number }[]) => {
      const compte = new Map<C, number>();
      for (const p of pts) { const c = sous(p.x, p.y); if (c) compte.set(c, (compte.get(c) ?? 0) + 1); }
      let best: C | null = null, n = 0;
      compte.forEach((k, c) => { if (k > n) { n = k; best = c; } });
      return best && n >= Math.max(3, pts.length * 0.4) ? (best as C) : null;
    };
    const ecarter = (c: C) => {
      for (const o of m().cs) {
        if (o === c || o.k === "baie" || o.mode !== "sol" || Math.abs(o.x - c.x) > (o.w + c.w) * 0.6) continue;
        o.mode = "saut"; o.vy = -300; o.vx = (o.x >= c.x ? 1 : -1) * 150;
      }
    };
    const effetCaresse = (c: C, type: "caresse" | "gratte") => {
      const t = m().temps;
      m().ring = { id: c.id, fin: t + 1.1 };
      if (c.k === "brac") {
        c.stun = 2.4; c.bulle = { texte: type === "caresse" ? "Euh… merci ?" : "Hi ! Ça chatouille !", fin: t + 2 }; effet(c.x, c.y - 50, "💗");
        if (c.mode === "chasse" || c.mode === "etourdi") { c.mode = "etourdi"; c.stun = 2.4; c.t = 0; }
        return;
      }
      if (type === "caresse") {
        geste(c, "bravo", 1.8); dit(c, hasard(["Hou… c'est doux !", "Merci, princesse !", "Ronron…"]), 1.8);
        effet(c.x - 18, c.y - c.h * 0.5, "💗"); effet(c.x + 14, c.y - c.h * 0.6, "💞");
      } else {
        geste(c, "jeu", 1.6); dit(c, hasard(["Hi hi hi ! Ça chatouille !", "Encore, encore !", "Hihihi !"]), 1.8);
        effet(c.x - 16, c.y - c.h * 0.5, "✨"); effet(c.x + 16, c.y - c.h * 0.55, "✨");
        c.sx = 1.12; c.sy = 0.9;
      }
      ecarter(c);
    };

    const sur = {
      bas: (e: PointerEvent) => {
        el.setPointerCapture(e.pointerId);
        const p = local(e), w = m();
        if (outilRef.current === "caresse") {
          w.geste = [{ x: p.x, y: p.y, t: performance.now() }];
          return;
        }
        const c = sous(p.x, p.y);
        if (!c) return;
        if (c.mode === "pris") {
          const b = w.brac;
          if (b && b.carry === c) { b.carry = null; b.mode = "etourdi"; b.stun = 1.6; b.t = 0; dit(b, "Hé ! Rends-le !", 1.6); }
        }
        if (c.k === "brac") { c.carry = c.carry; if (c.carry) { const p2 = c.carry; p2.mode = "vol"; p2.vy = -200; c.carry = null; } c.mode = "tenu"; dit(c, hasard(["Hé ! Lâche-moi !", "Pas touche !"]), 1.2); }
        else { c.mode = "tenu"; geste(c, "peur", 20); c.plan = null; }
        c.a = 0; c.va = 0; c.sx = 1; c.sy = 1;
        w.held = { c, dx: p.x - c.x, dy: p.y - c.y, pts: [{ x: p.x, y: p.y, t: performance.now() }] };
      },
      bouge: (e: PointerEvent) => {
        const p = local(e), w = m(), t = performance.now();
        if (outilRef.current === "caresse") {
          if (!w.geste.length) return;
          w.geste.push({ x: p.x, y: p.y, t });
          w.geste = w.geste.filter((q) => t - q.t < 900);
          const c = majorite(w.geste.slice(-14));
          if (c) w.ring = { id: c.id, fin: w.temps + 0.5 };
          const r = analyser(w.geste);
          if (r) {
            const cible = majorite(w.geste);
            if (cible) effetCaresse(cible, r);
            w.geste = [];
          }
          return;
        }
        const h = w.held;
        if (!h) return;
        const c = h.c;
        c.x = Math.max(c.w * 0.4, Math.min(w.W - c.w * 0.4, p.x - h.dx));
        c.y = Math.max(c.h * 0.5, Math.min(w.sol - c.h / 2 + 3, p.y - h.dy));
        h.pts.push({ x: p.x, y: p.y, t });
        h.pts = h.pts.filter((q) => t - q.t < 90);
        c.a = Math.max(-30, Math.min(30, (h.pts[h.pts.length - 1].x - h.pts[0].x) * 0.4));
      },
      haut: () => {
        const w = m();
        w.geste = [];
        const h = w.held;
        if (!h) return;
        w.held = null;
        const c = h.c;
        const a = h.pts[0], b = h.pts[h.pts.length - 1];
        const dtp = Math.max(16, b.t - a.t) / 1000;
        let vx = (b.x - a.x) / dtp, vy = (b.y - a.y) / dtp;
        const v = Math.hypot(vx, vy);
        if (v < 140) { vx = c.k === "brac" ? -c.dir * 380 : (Math.random() - 0.5) * 260; vy = c.k === "brac" ? -1050 : -420; }
        else { const k = Math.min(1, 2800 / v); vx *= k; vy *= k; }
        c.vx = vx; c.vy = vy; c.mode = "vol"; c.chute = 0; c.va = c.k === "brac" ? vx * 0.5 : 0; c.air = false;
        if (c.k === "brac") { c.coups += 1; c.cible = null; c.force = false; dit(c, hasard(["Aaaaaah !", "Je voleeee !", "Au secouuurs !"]), 1.4); son(() => sons.sifflet()); }
        else { geste(c, "peur", 1.5); }
      },
    };
    const d = sur.bas as (e: Event) => void, mv = sur.bouge as (e: Event) => void, up = sur.haut as (e: Event) => void;
    el.addEventListener("pointerdown", d);
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    // ---------------- la boucle
    const ro = new ResizeObserver(() => {
      const w = m();
      const { W, H } = mesurer();
      if (Math.abs(W - w.W) < 1 && Math.abs(H - w.H) < 1) return;
      const { sol, pf } = geo(W, H);
      w.W = W; w.H = H; w.sol = sol; w.pf = pf;
      for (const c of w.cs) { if (c.surf !== pf.y && c.mode === "sol") poser(c, sol); c.x = Math.min(c.x, W - c.w * 0.4); }
    });
    ro.observe(el);

    let raf = 0, avant = performance.now(), cumul = 0, images = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.033, (now - avant) / 1000);
      avant = now;
      cumul += dt; images += 1;
      if (cumul >= 0.5) { mesure.fps = Math.round(images / (now - (now - cumul * 1000)) * 1000); mesure.fps = Math.round(images / cumul); mesure.n = m().cs.filter((c) => c.k !== "baie").length; cumul = 0; images = 0; }
      const w = m();
      w.temps += dt;
      for (const c of w.cs) {
        c.sx += (1 - c.sx) * Math.min(1, dt * 10);
        c.sy += (1 - c.sy) * Math.min(1, dt * 10);
        if (c.animFin && c.animFin < w.temps && c.mode !== "tenu") { c.anim = c.k === "brac" ? "rien" : "rien"; c.animFin = 0; }
        if (c.bulle && c.bulle.fin < w.temps) c.bulle = null;
        if (c.k === "brac") {
          if (c.mode === "vol") braconnierVol(c, dt);
          else if (c.mode !== "tenu") cerveau(c, dt);
        } else if (c.k === "baie") {
          c.vy += G * dt; c.x += c.vx * dt; c.y += c.vy * dt;
          const b = w.brac;
          if (b && Math.hypot(c.x - b.x, c.y - (b.y - 20)) < 44) { c.k = "baie"; c.y = 9999; b.stun = 1.4; b.sx = 0.9; dit(b, "Glissé !", 1.2); effet(b.x, b.y - 40, "🫐"); if (b.mode === "chasse") { b.mode = "etourdi"; b.t = 0; } }
          if (c.y > w.sol + 20) c.y = 9999;
        } else oiseau(c, dt);
      }
      w.cs = w.cs.filter((c) => !(c.k === "baie" && c.y >= 9999));
      // l'affichage direct
      for (const c of w.cs) {
        const r = refs.current[c.id];
        if (!r || !r.o || !r.i) continue;
        r.o.style.transform = `translate3d(${(c.x - c.w / 2).toFixed(1)}px,${(c.y - c.h / 2).toFixed(1)}px,0)`;
        const pris = c.mode === "pris" ? 0.66 : 1;
        r.i.style.transform = `rotate(${c.a.toFixed(1)}deg) scale(${(c.sx * pris).toFixed(3)},${(c.sy * pris).toFixed(3)})`;
      }
      if (ringEl.current) {
        const rg = w.ring && w.ring.fin > w.temps ? w.cs.find((c) => c.id === w.ring?.id) : null;
        if (rg) {
          const s = Math.max(rg.w, rg.h) * 1.15;
          ringEl.current.style.opacity = "1";
          ringEl.current.style.width = ringEl.current.style.height = `${s}px`;
          ringEl.current.style.transform = `translate3d(${(rg.x - s / 2).toFixed(1)}px,${(rg.y - s / 2).toFixed(1)}px,0)`;
        } else ringEl.current.style.opacity = "0";
      }
      // ce qui change vraiment (dessins, bulles) : on redessine
      const sig = w.cs.map((c) => `${c.id}${c.anim}${c.dir}${c.bulle ? 1 : 0}${c.k === "brac" ? c.mode + c.bobos + Math.floor(c.pas * 1.2) + (c.stun > 0 ? 1 : 0) : ""}`).join("|");
      if (sig !== w.sig) { w.sig = sig; setN((n) => (n + 1) % 1e6); }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", d);
      el.removeEventListener("pointermove", mv);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      mesure.fps = 0; mesure.n = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idMale]);

  const w = monde.current;
  const t = w?.temps ?? 0;
  return (
    <section className="carte-nuit mt-3 overflow-hidden rounded-[1.75rem] px-3 pb-3 pt-3">
      <p className="text-center font-display text-xl text-[#f3d48a]">Le nid vivant</p>
      <p className="texte-doux mt-0.5 text-center text-xs">Attrape et lance qui tu veux. Ou caresse en dessinant un rond, gratouille en zigzag.</p>
      <div
        ref={scene}
        className="relative mt-2 h-[21.5rem] w-full touch-none select-none overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(#27407a 0%, #4a6fb5 55%, #86b5d8 100%)" }}
        aria-label="Le nid vivant"
      >
        {/* le sol et la branche */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14px] bg-gradient-to-b from-[#4f8a3a] to-[#356a2a]" />
        {w ? (
          <div className="pointer-events-none absolute" style={{ left: w.pf.x0 - 10, top: w.pf.y - 2, width: w.pf.x1 - w.pf.x0 + 20, height: 20 }}>
            <div className="size-full rounded-full bg-gradient-to-b from-[#8a5a2b] to-[#5b3a1c] shadow-[inset_0_3px_0_rgba(255,255,255,.18)]" />
            <span className="absolute -top-3 left-2 text-2xl">🌿</span><span className="absolute -top-3 right-3 text-2xl">🍃</span>
          </div>
        ) : null}
        <div ref={ringEl} className="pointer-events-none absolute left-0 top-0 rounded-full border-4 border-[#f3d48a] opacity-0 shadow-[0_0_14px_#f3d48a]" />
        {w?.cs.map((c) => (
          <div key={c.id} ref={(n) => { (refs.current[c.id] ??= { o: null, i: null }).o = n; }} className="pointer-events-none absolute left-0 top-0" style={{ width: c.w, height: c.h, zIndex: c.k === "brac" ? 6 : c.mode === "pris" ? 7 : 3 }}>
            <div ref={(n) => { (refs.current[c.id] ??= { o: null, i: null }).i = n; }} className="size-full" style={{ transformOrigin: "50% 70%" }}>
              <Sprite c={c} male={male} />
            </div>
            {c.bulle && c.bulle.fin > t ? (
              <span className="brac-bulle absolute -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-2.5 py-0.5 text-xs font-black text-[#2a1650] shadow-lg" style={{ bottom: c.h + 2, left: Math.max(bw(c.bulle.texte), Math.min((w?.W ?? 320) - bw(c.bulle.texte), c.x)) - (c.x - c.w / 2) }}>{c.bulle.texte}</span>
            ) : null}
          </div>
        ))}
        {parts.map((p) => (
          <span key={p.id} className="np-flotte pointer-events-none absolute z-10 text-2xl" style={{ left: p.x - 12, top: p.y - 12 }}>{p.txt}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOutil("main")} className={`rounded-2xl py-2.5 text-sm font-extrabold ${outil === "main" ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>✋ Attraper / lancer</button>
        <button type="button" onClick={() => setOutil("caresse")} className={`rounded-2xl py-2.5 text-sm font-extrabold ${outil === "caresse" ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>🤗 Caresser</button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" disabled={enCours} onClick={() => verbe.current.venir()} className="bouton-bois rounded-2xl py-2.5 text-sm font-extrabold disabled:opacity-50">😈 Le braconnier arrive</button>
        <button type="button" onClick={() => verbe.current.remettre()} className="rounded-2xl bg-white/10 py-2.5 text-sm font-extrabold">↺ Tout remettre</button>
      </div>
      {parents ? (
        <div className="mt-2 rounded-2xl bg-white/5 px-2 py-2">
          <p className="text-center text-xs font-extrabold texte-doux">Tester avec le compagnon :</p>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {PRETENDANTS.map((p) => (
              <button key={p.id} type="button" onClick={() => onMale?.(p.id)} className={`rounded-full px-3 py-1 text-xs font-extrabold ${p.id === (male?.id ?? "costaud") ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>{p.nom}</button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const bw = (t: string) => t.length * 3.6 + 14;

function Sprite({ c, male }: { c: C; male: Pretendant | null }) {
  const miroir = c.dir < 0;
  if (c.k === "plume") return <PlumeDessin anim={c.anim} miroir={miroir} className="size-full" />;
  if (c.k === "bebe") return <PlumeDessin look={LOOK_BEBE} anim={c.anim} miroir={miroir} className="size-full" />;
  if (c.k === "male") {
    return male
      ? <PlumeDessin look={male.look} caractere={male.caractere} extra={male.extra} joues={male.joues} anim={c.anim} miroir={miroir} className="size-full" />
      : <PlumeDessin look={LOOK_AMI} anim={c.anim} miroir={miroir} className="size-full" />;
  }
  if (c.k === "baie") return <span className="block text-center text-lg leading-none">🫐</span>;
  const mode: ModeBrac = c.mode === "vol" || c.mode === "tenu" ? (c.mode as ModeBrac) : c.mode === "filet" ? "attrape" : c.mode === "allonge" ? "allonge" : c.mode === "releve" ? "releve" : c.mode === "fuite" ? "fuite" : c.mode === "etourdi" ? "attente" : "marche";
  return (
    <div className="size-full" style={{ transform: `scaleX(${c.dir})` }}>
      <DessinBrac m={mode} bobos={c.bobos} chapeau suie={false} filetTete={false} arme="filet" vise={0} etourdi={c.stun > 0} pas={c.pas} />
    </div>
  );
}

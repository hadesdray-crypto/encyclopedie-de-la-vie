import { useEffect, useId, useMemo, useRef, useState } from "react";
import { sons } from "@/lib/sons";

const L = 200;
const H = 290;
const TEAR = 54;

/** La ligne de déchirure : en dents de scie, comme du vrai papier. */
const DECHIRURE: [number, number][] = Array.from({ length: 21 }, (_, i) => [i * 10, TEAR + [0, -3, 2, -2, 3, -1, 2, -3, 1, -2, 3][i % 11]]);
const ligne = DECHIRURE.map(([x, y]) => `${x},${y}`).join(" ");
const clipHaut = `0,0 ${ligne} ${L},0`;
const clipBas = `0,${H} ${ligne} ${L},${H}`;

/** Le bord serti du paquet : des petites dents. */
function dents(y0: number, y1: number) {
  let d = `M0 ${y1}`;
  for (let x = 0; x < L; x += 8) d += ` L${x + 4} ${y0} L${x + 8} ${y1}`;
  return d;
}

const COULEURS_PAPIER = ["#ffd24a", "#ff7ab6", "#7fe0d2", "#a77bff", "#ffffff"];

type Props = {
  duJour: boolean;
  taille: number | null;
  /** Vrai quand le paquet est déchiré : la bande s'envole, les cartes sortent. */
  ouvert: boolean;
  /** Appelé quand on a déchiré jusqu'au bout. */
  onDechire: () => void;
  /** La couleur de la meilleure carte (la lueur qui sort du paquet). */
  lueur?: string;
};

/** Un paquet de cartes qu'on déchire : on le glisse du doigt, ou on le touche, et la bande se détache. */
export function PaquetCartes({ duJour, taille, ouvert, onDechire, lueur = "#ffd24a" }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [p, setP] = useState(0);
  const depart = useRef<{ x: number; y: number; bouge: boolean } | null>(null);
  const anim = useRef(0);
  const fini = useRef(false);
  const couleur = duJour ? { corps: "#ff9a3c", clair: "#ffd36b", sombre: "#c9651a", encre: "#5a2a00" } : { corps: "#2fb3a0", clair: "#8fe6d8", sombre: "#1d7f70", encre: "#07372f" };

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  function aller(vers: number, ms: number, apres?: () => void) {
    cancelAnimationFrame(anim.current);
    const de = p;
    const t0 = performance.now();
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setP(de + (vers - de) * (1 - Math.pow(1 - k, 2)));
      if (k < 1) anim.current = requestAnimationFrame(pas);
      else apres?.();
    };
    anim.current = requestAnimationFrame(pas);
  }
  function terminer() {
    if (fini.current) return;
    fini.current = true;
    sons.dechirer();
    onDechire();
  }
  function auto() {
    if (fini.current || ouvert) return;
    sons.crac();
    aller(1, 560, terminer);
  }

  function bas(e: React.PointerEvent) {
    if (fini.current || ouvert) return;
    cancelAnimationFrame(anim.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    depart.current = { x: e.clientX, y: e.clientY, bouge: false };
  }
  function incline(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--px", `${(-y * 16).toFixed(1)}deg`);
    e.currentTarget.style.setProperty("--py", `${(x * 20).toFixed(1)}deg`);
  }
  function bouge(e: React.PointerEvent) {
    incline(e);
    const d = depart.current;
    if (!d || fini.current) return;
    const largeur = e.currentTarget.getBoundingClientRect().width;
    const dx = Math.abs(e.clientX - d.x), dy = Math.abs(e.clientY - d.y);
    if (dx + dy > 8) d.bouge = true;
    if (!d.bouge) return;
    const v = Math.min(1, (dx + dy * 0.5) / (largeur * 0.55));
    setP((avant) => {
      if (v > avant + 0.07) sons.crac();
      return v;
    });
  }
  function haut() {
    const d = depart.current;
    depart.current = null;
    if (!d || fini.current) return;
    if (!d.bouge) return auto();
    if (p > 0.5) aller(1, 220, terminer);
    else aller(0, 260);
  }

  const papiers = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      dx: Math.round((Math.random() - 0.5) * 260),
      dy: Math.round(-60 - Math.random() * 190),
      r: Math.round((Math.random() - 0.5) * 900),
      c: COULEURS_PAPIER[i % COULEURS_PAPIER.length],
      g: Math.round(Math.random() * 40),
    })),
    [],
  );

  const bande = ouvert
    ? undefined
    : `rotate(${(-p * 26).toFixed(1)} 2 ${TEAR}) translate(${(p * 5).toFixed(1)} ${(-p * 5).toFixed(1)})`;

  const contenu = (
    <g id={`contenu-${uid}`}>
      <rect width={L} height={H} fill={couleur.corps} />
      <rect y="14" width={L} height="34" fill={couleur.sombre} opacity=".35" />
      <rect y={H - 48} width={L} height="34" fill={couleur.sombre} opacity=".35" />
      {/* des petits points, à plat */}
      <g fill={couleur.clair} opacity=".55">
        {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={12 + (i % 6) * 35 + (Math.floor(i / 6) % 2) * 15} cy={80 + Math.floor(i / 6) * 38} r="2.6" />)}
      </g>
      {/* l'emblème : une grosse patte sur un rond crème */}
      <circle cx="100" cy="150" r="56" fill="#fff7e2" stroke={couleur.encre} strokeWidth="4" />
      <g fill={couleur.corps} stroke={couleur.encre} strokeWidth="3">
        <ellipse cx="100" cy="166" rx="26" ry="21" />
        <ellipse cx="68" cy="142" rx="10" ry="14" transform="rotate(-18 68 142)" />
        <ellipse cx="88" cy="123" rx="10" ry="14" transform="rotate(-6 88 123)" />
        <ellipse cx="112" cy="123" rx="10" ry="14" transform="rotate(6 112 123)" />
        <ellipse cx="132" cy="142" rx="10" ry="14" transform="rotate(18 132 142)" />
      </g>
      <g fill="#fff7e2" stroke={couleur.encre} strokeWidth="2.5">
        {[[26, 112, 9], [176, 100, 7], [170, 200, 10], [30, 205, 7]].map(([x, y, r]) => (
          <path key={`${x}${y}`} d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z`} />
        ))}
      </g>
      <text x="100" y="35" textAnchor="middle" className="font-display" fontSize="19" fill="#fff7e2" stroke={couleur.encre} strokeWidth="3" paintOrder="stroke">{duJour ? "Paquet du jour" : "Animaux !"}</text>
      <text x="100" y="246" textAnchor="middle" className="font-display" fontSize="17" fill="#fff7e2" stroke={couleur.encre} strokeWidth="3" paintOrder="stroke">{taille ? `${taille} cartes` : duJour ? "5, 10 ou 15 cartes ?" : "10 cartes… ou 11 ?"}</text>
      <text x="100" y="268" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={couleur.encre}>Déchire pour découvrir</text>
      {/* les bords sertis */}
      <path d={dents(0, 12)} fill={couleur.clair} stroke={couleur.encre} strokeWidth="1.5" />
      <path d={dents(H, H - 12)} fill={couleur.clair} stroke={couleur.encre} strokeWidth="1.5" />
      <g stroke={couleur.encre} strokeWidth="1" opacity=".35">
        {Array.from({ length: 25 }, (_, i) => <line key={i} x1={i * 8} y1="12" x2={i * 8} y2="20" />)}
        {Array.from({ length: 25 }, (_, i) => <line key={i} x1={i * 8} y1={H - 12} x2={i * 8} y2={H - 20} />)}
      </g>
      <rect x="1.5" y="1.5" width={L - 3} height={H - 3} rx="6" fill="none" stroke={couleur.encre} strokeWidth="3" />
    </g>
  );

  return (
    <div className="relative mx-auto w-full max-w-[15rem]">
      <div
        role="button"
        tabIndex={0}
        aria-label="Déchirer le paquet"
        onPointerDown={bas}
        onPointerMove={bouge}
        onPointerUp={haut}
        onPointerCancel={() => { depart.current = null; if (!fini.current) aller(0, 200); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); auto(); } }}
        className="paquet-incline relative select-none outline-offset-4"
        onPointerLeave={(e) => { e.currentTarget.style.setProperty("--px", "0deg"); e.currentTarget.style.setProperty("--py", "0deg"); }}
      >
        <svg viewBox={`-6 -40 ${L + 12} ${H + 52}`} className={`paquet-svg ${p === 0 && !ouvert ? "paquet-attend" : ""}`} aria-hidden="true">
          <defs>
            <clipPath id={`haut-${uid}`}><polygon points={clipHaut} /></clipPath>
            <clipPath id={`bas-${uid}`}><polygon points={clipBas} /></clipPath>
            <radialGradient id={`lueur-${uid}`}><stop offset="0" stopColor="#fff" /><stop offset=".4" stopColor={lueur} /><stop offset="1" stopColor={lueur} stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="100" cy={H + 8} rx="78" ry="9" fill="#000" opacity=".28" />
          {/* la lueur qui sort de l'ouverture */}
          <ellipse cx="100" cy={TEAR - 4} rx="120" ry="70" fill={`url(#lueur-${uid})`} opacity={ouvert ? 0.9 : p * 0.7} />
          {/* les cartes qui sortent */}
          {ouvert ? (
            <g className="cartes-sortent" style={{ ["--haut" as string]: "-82px" }}>
              {[-7, 0, 7].map((r, i) => (
                <g key={r} transform={`rotate(${r} 100 120)`}>
                  <rect x="34" y={TEAR + 6 + i * 4} width="132" height="150" rx="9" fill="#3d2a78" stroke="#e8c98a" strokeWidth="4" />
                  <circle cx="100" cy={TEAR + 81 + i * 4} r="22" fill="#f6e3bd" />
                </g>
              ))}
            </g>
          ) : null}
          {/* le corps du paquet, sous la déchirure */}
          <g clipPath={`url(#bas-${uid})`}>{contenu}</g>
          {/* la bande du haut, qui se détache */}
          <g transform={bande} className={ouvert ? "bande-part" : undefined} style={ouvert ? { transformOrigin: `2px ${TEAR}px` } : undefined}>
            <g clipPath={`url(#haut-${uid})`}><use href={`#contenu-${uid}`} /></g>
            <polyline points={ligne} fill="none" stroke="#fffbe8" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
          <polyline points={ligne} fill="none" stroke="#fffbe8" strokeWidth="2.5" strokeLinejoin="round" opacity={p > 0 || ouvert ? 1 : 0} />
          {/* « déchire ici » : des tirets sur la ligne, et des ciseaux */}
          {p === 0 && !ouvert ? (
            <g>
              <polyline points={ligne} fill="none" stroke="#fffbe8" strokeWidth="2.5" strokeDasharray="7 5" strokeLinejoin="round" />
              <text x="178" y={TEAR - 10} fontSize="18" textAnchor="middle" aria-hidden="true">✂️</text>
            </g>
          ) : null}
        </svg>
        {!ouvert ? <span className="paquet-brille" aria-hidden="true" /> : null}
      </div>
      {ouvert ? (
        <div className="pointer-events-none absolute left-1/2 top-[20%] size-0" aria-hidden="true">
          {papiers.map((q, i) => (
            <span key={i} className="papier" style={{ background: q.c, ["--dx" as string]: `${q.dx}px`, ["--dy" as string]: `${q.dy}px`, ["--r" as string]: `${q.r}deg`, animationDelay: `${q.g}ms` }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

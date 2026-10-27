// Les icônes dessinées de la barre du bas : une médaille ronde avec un cadre doré pour chaque salle.
// L'Arbre montre le vrai arbre de la vie en rond (comme le dos des cartes), la Carte notre propre globe,
// les Cartes un joli porte-cartes au nom de Leonie, Jouer un dé et une manette.
import { useId } from "react";
import { DosCarte, BranchesArbre } from "@/components/carte-collection";
import { MiniGlobe } from "@/components/mini-globe";

function Medaille({ fond, children }: { fond: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c2" /><stop offset=".4" stopColor="#e3b04b" /><stop offset=".7" stopColor="#fff0b8" /><stop offset="1" stopColor="#a8700c" /></linearGradient>
        <radialGradient id={`${id}f`} cx=".4" cy=".3" r=".8"><stop offset="0" stopColor={fond} stopOpacity=".75" /><stop offset="1" stopColor={fond} /></radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${id}o)`} />
      <circle cx="32" cy="32" r="27.5" fill={`url(#${id}f)`} />
      {children}
      <ellipse cx="25" cy="16" rx="13" ry="6" fill="#fff" opacity=".18" />
    </svg>
  );
}

export function IconeAccueil() {
  return (
    <Medaille fond="#3b2370">
      <path d="M17 31 L32 18 L47 31" fill="none" stroke="#c4552f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="40" y="19" width="4" height="8" fill="#9a3f22" />
      <path d="M21 30 L32 21 L43 30 V46 H21 Z" fill="#fff1d2" />
      <rect x="28.5" y="36" width="7" height="10" rx="3.5" fill="#8a5a2b" />
      <rect x="23.5" y="32" width="5" height="5" rx="1" fill="#ffd34a" />
      <rect x="35.5" y="32" width="5" height="5" rx="1" fill="#ffd34a" />
      <path d="M14 47 H50" stroke="#7bc96f" strokeWidth="3" strokeLinecap="round" />
    </Medaille>
  );
}

export function IconeArbre() {
  return (
    <Medaille fond="#140c30">
      <svg x="7" y="7" width="50" height="50" viewBox="95 225 440 430">
        <BranchesArbre epais />
      </svg>
    </Medaille>
  );
}

export function IconeCarte() {
  return (
    <Medaille fond="#0e2f6b">
      <foreignObject x="8" y="8" width="48" height="48"><MiniGlobe pays={[]} className="size-full" /></foreignObject>
    </Medaille>
  );
}

/** Le porte-cartes : une boîte en métal, avec une fenêtre qui montre le dos d'une carte et une étiquette « Leonie ». */
export function PorteCartes({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <span className={`relative block ${className}`}>
      <svg viewBox="0 0 100 120" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5b2aad" /><stop offset=".25" stopColor="#9a6ae6" /><stop offset=".55" stopColor="#6a3fc0" /><stop offset="1" stopColor="#3a1a7a" /></linearGradient>
          <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c2" /><stop offset=".45" stopColor="#e3b04b" /><stop offset="1" stopColor="#a8700c" /></linearGradient>
        </defs>
        {/* des cartes qui dépassent */}
        <rect x="22" y="4" width="50" height="30" rx="4" fill="#e3b04b" transform="rotate(-8 47 20)" />
        <rect x="30" y="2" width="50" height="30" rx="4" fill="#fff2c2" stroke="#a8700c" transform="rotate(7 55 18)" />
        {/* la boîte */}
        <rect x="8" y="22" width="84" height="94" rx="10" fill={`url(#${id}m)`} stroke={`url(#${id}o)`} strokeWidth="4" />
        <rect x="8" y="22" width="84" height="16" rx="8" fill="#fff" opacity=".15" />
        <rect x="24" y="40" width="52" height="50" rx="6" fill="#120c2c" stroke={`url(#${id}o)`} strokeWidth="3" />
        <path d="M14 98 H86 L80 110 H20 Z" fill={`url(#${id}o)`} />
        <text x="50" y="107.5" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight="800" fontSize="10" fill="#3a1a7a">Leonie</text>
        {[[14, 30], [86, 30], [14, 92], [86, 92]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill={`url(#${id}o)`} />)}
      </svg>
      <span className="absolute left-[26%] top-[35%] block w-[48%] overflow-hidden rounded-[4px]" style={{ height: "39%" }}><span className="block w-full -translate-y-[12%]"><DosCarte modele="arbre" /></span></span>
    </span>
  );
}

export function IconeCartes() {
  return (
    <Medaille fond="#2a1650">
      <foreignObject x="13" y="9" width="38" height="46"><PorteCartes className="size-full" /></foreignObject>
    </Medaille>
  );
}

export function IconeJouer() {
  return (
    <Medaille fond="#5a1f6b">
      <g transform="rotate(-14 26 34)">
        <rect x="13" y="22" width="24" height="24" rx="5" fill="#fff8ea" stroke="#c9a4ff" strokeWidth="1.5" />
        {[[19, 28], [31, 28], [25, 34], [19, 40], [31, 40]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.3" fill="#6a3fc0" />)}
      </g>
      <path d="M44 16 L46.5 23 L54 23.5 L48 28 L50 35 L44 31 L38 35 L40 28 L34 23.5 L41.5 23 Z" fill="#ffd34a" stroke="#a8700c" strokeWidth="1" />
      <circle cx="46" cy="44" r="6" fill="#ff7ab6" stroke="#fff" strokeWidth="1.5" />
    </Medaille>
  );
}

/** Les pastilles : le nombre de paquets à ouvrir, en pièce d'or ou en petit paquet. */
export function PastillePiece({ n }: { n: number }) {
  return <span className="pastille-piece grid place-items-center font-black">{n > 9 ? "9+" : n}</span>;
}
export function PastillePaquet({ n }: { n: number }) {
  return <span className="pastille-paquet grid place-items-center font-black">{n > 9 ? "9+" : n}</span>;
}

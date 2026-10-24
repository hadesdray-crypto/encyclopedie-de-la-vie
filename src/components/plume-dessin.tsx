/**
 * Plume, dessinée en direct pour pouvoir bouger : elle fait coucou avec son aile,
 * cligne des yeux, sautille quand elle parle et ouvre grand ses ailes pour le menu.
 */
export type AnimPlume = "rien" | "coucou" | "parle" | "ailes";

export function PlumeDessin({ anim = "rien", className = "" }: { anim?: AnimPlume; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`plume-svg plume-${anim} ${className}`} aria-hidden="true">
      <defs>
        <radialGradient id="pl-corps" cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor="#c9a4ff" />
          <stop offset="1" stopColor="#7a4fd0" />
        </radialGradient>
        <radialGradient id="pl-ventre" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#fff6e6" />
          <stop offset="1" stopColor="#f3d9b8" />
        </radialGradient>
      </defs>
      <g className="pl-aile-g">
        <path d="M34 108 q-22 30 6 56 q10-30 6-56 Z" fill="#6a3fc0" />
      </g>
      <g className="pl-aile-d">
        <path d="M166 108 q22 30 -6 56 q-10-30 -6-56 Z" fill="#6a3fc0" />
      </g>
      <g className="pl-tete">
        <path d="M48 62 L40 22 L78 48 Z" fill="#7a4fd0" />
        <path d="M152 62 L160 22 L122 48 Z" fill="#7a4fd0" />
        <path d="M50 55 L46 32 L68 48 Z" fill="#f3a0e0" />
        <path d="M150 55 L154 32 L132 48 Z" fill="#f3a0e0" />
        <ellipse cx="100" cy="112" rx="70" ry="74" fill="url(#pl-corps)" />
        <ellipse cx="100" cy="140" rx="42" ry="42" fill="url(#pl-ventre)" />
        <path d="M84 128 q8 6 16 0 q8 6 16 0 M86 146 q7 5 14 0 q7 5 14 0" stroke="#e2bf8f" strokeWidth="3" fill="none" strokeLinecap="round" />
        <g className="pl-yeux">
          <circle cx="72" cy="92" r="24" fill="#fff" />
          <circle cx="128" cy="92" r="24" fill="#fff" />
          <circle cx="74" cy="95" r="17" fill="#2a1650" />
          <circle cx="126" cy="95" r="17" fill="#2a1650" />
          <circle cx="74" cy="99" r="10" fill="#5b3fb0" />
          <circle cx="126" cy="99" r="10" fill="#5b3fb0" />
          <circle cx="81" cy="87" r="7" fill="#fff" />
          <circle cx="133" cy="87" r="7" fill="#fff" />
          <circle cx="68" cy="104" r="3" fill="#fff" />
          <circle cx="120" cy="104" r="3" fill="#fff" />
        </g>
        <ellipse cx="50" cy="118" rx="10" ry="6" fill="#ff9fcf" opacity=".75" />
        <ellipse cx="150" cy="118" rx="10" ry="6" fill="#ff9fcf" opacity=".75" />
        <path className="pl-bec" d="M93 112 L107 112 L100 124 Z" fill="#f3b54a" />
        <path d="M80 44 L86 26 L94 38 L100 22 L106 38 L114 26 L120 44 Z" fill="#f3d48a" stroke="#c9963a" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="100" cy="22" r="4" fill="#ff9fcf" />
        <path d="M82 184 q-4 8 4 8 q4-4 8 0 q2-6 -4-10 Z M118 184 q4 8 -4 8 q-4-4 -8 0 q-2-6 4-10 Z" fill="#f3b54a" />
      </g>
    </svg>
  );
}

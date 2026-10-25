/**
 * Plume, dessinée en direct pour pouvoir bouger : elle fait coucou avec son aile,
 * cligne des yeux, sautille quand elle parle et ouvre grand ses ailes pour le menu.
 */
export type AnimPlume = "rien" | "coucou" | "parle" | "ailes";

/** Les tenues de Plume : des accessoires légers, qui suivent ses mouvements. */
export type Tenue = "aucune" | "lecture" | "exploratrice" | "carnet" | "savante" | "savante-lit";

export function PlumeDessin({ anim = "rien", className = "", tenue = "aucune" }: { anim?: AnimPlume; className?: string; tenue?: Tenue }) {
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
        {tenue === "lecture" || tenue === "exploratrice" ? null : (
          <>
            <path d="M80 44 L86 26 L94 38 L100 22 L106 38 L114 26 L120 44 Z" fill="#f3d48a" stroke="#c9963a" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="100" cy="22" r="4" fill="#ff9fcf" />
          </>
        )}
        {tenue === "lecture" ? (
          <g>
            {/* Lunettes rondes */}
            <circle cx="72" cy="93" r="27" fill="none" stroke="#3a2a1a" strokeWidth="4" />
            <circle cx="128" cy="93" r="27" fill="none" stroke="#3a2a1a" strokeWidth="4" />
            <path d="M99 90 q1 -5 2 0" stroke="#3a2a1a" strokeWidth="4" fill="none" />
            {/* Chapeau d'étudiant, avec son pompon */}
            <path d="M76 36 L76 50 Q100 60 124 50 L124 36 Z" fill="#2a1c3a" />
            <path d="M54 32 L100 12 L146 32 L100 52 Z" fill="#3a2a5a" stroke="#1d1238" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="100" cy="32" r="3.5" fill="#f3d48a" />
            <path d="M100 32 L136 40 L138 58" stroke="#f3d48a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M134 56 L142 56 L140 66 L136 66 Z" fill="#f3d48a" />
          </g>
        ) : null}
        {tenue === "exploratrice" ? (
          <g>
            {/* Chapeau d'exploratrice */}
            <ellipse cx="100" cy="44" rx="52" ry="9" fill="#b8925a" stroke="#8a6a3a" strokeWidth="2" />
            <path d="M68 44 Q70 14 100 14 Q130 14 132 44 Z" fill="#d9b87a" stroke="#8a6a3a" strokeWidth="2" />
            <path d="M69 37 Q100 44 131 37 L131 43 Q100 50 69 43 Z" fill="#6a3fc0" />
          </g>
        ) : null}
        {tenue === "savante" || tenue === "savante-lit" ? (
          <g>
            {/* La blouse blanche de scientifique (un peu folle) */}
            <path d="M58 132 Q62 176 92 186 L100 150 L108 186 Q138 176 142 132 Q128 150 112 150 L100 186 L88 150 Q72 150 58 132 Z" fill="#fbfbff" stroke="#c9c4e0" strokeWidth="2" strokeLinejoin="round" />
            <path d="M88 150 L100 166 L112 150" fill="none" stroke="#c9c4e0" strokeWidth="2" />
            <rect x="114" y="160" width="12" height="9" rx="2" fill="#e7e3f5" stroke="#c9c4e0" />
            <path d="M117 160 L117 154 M121 160 L121 152" stroke="#6a3fc0" strokeWidth="2" strokeLinecap="round" />
            {tenue === "savante-lit" ? (
              <>
                <circle cx="72" cy="93" r="27" fill="none" stroke="#3a2a1a" strokeWidth="4" />
                <circle cx="128" cy="93" r="27" fill="none" stroke="#3a2a1a" strokeWidth="4" />
                <path d="M99 90 q1 -5 2 0" stroke="#3a2a1a" strokeWidth="4" fill="none" />
              </>
            ) : null}
          </g>
        ) : null}
        {tenue === "carnet" ? (
          /* Un petit nœud rouge, pour son carnet des chiens et des chats */
          <path d="M100 160 L80 150 L80 170 Z M100 160 L120 150 L120 170 Z" fill="#e2453c" stroke="#a82a24" strokeWidth="2" strokeLinejoin="round" />
        ) : null}
        <path d="M82 184 q-4 8 4 8 q4-4 8 0 q2-6 -4-10 Z M118 184 q4 8 -4 8 q-4-4 -8 0 q-2-6 4-10 Z" fill="#f3b54a" />
      </g>
    </svg>
  );
}

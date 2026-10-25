/**
 * Plume, dessinée en direct pour pouvoir bouger : elle fait coucou avec son aile,
 * cligne des yeux, sautille quand elle parle et ouvre grand ses ailes pour le menu.
 *
 * Chaque caractère a sa tenue complète : un vêtement, quelque chose sur la tête,
 * des yeux qui lui ressemblent, et une paire de lunettes seulement quand elle lit.
 */
/** Les situations : chacune a ses gestes (lire, avoir peur, jouer à la bataille, encourager, fêter une victoire). */
export type AnimPlume = "rien" | "coucou" | "parle" | "ailes" | "peur" | "bataille" | "jeu" | "bravo";

/** 0 = tenue de tous les jours (petite couronne) ; 1 à 4 = les caractères. */
export type Caractere = 0 | 1 | 2 | 3 | 4;

export function PlumeDessin({
  anim = "rien",
  className = "",
  caractere = 0,
  lit = false,
  miroir = false,
}: {
  anim?: AnimPlume;
  className?: string;
  caractere?: Caractere;
  lit?: boolean;
  /** Plume est à gauche de l'écran : sa main à outil passe de l'autre côté, vers le texte. */
  miroir?: boolean;
}) {
  return (
    <svg viewBox="0 0 200 200" className={`plume-svg plume-${anim} plume-c${caractere} ${lit ? "plume-lit" : ""} ${className}`} aria-hidden="true" style={{ overflow: "visible" }}>
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

        <Vetement caractere={caractere} />
        <Yeux caractere={caractere} />

        <ellipse cx="50" cy="118" rx="10" ry="6" fill="#ff9fcf" opacity=".75" />
        <ellipse cx="150" cy="118" rx="10" ry="6" fill="#ff9fcf" opacity=".75" />
        <path className="pl-bec" d="M93 112 L107 112 L100 124 Z" fill="#f3b54a" />

        <Chapeau caractere={caractere} lit={lit} />
        {lit ? <Lunettes caractere={caractere} /> : null}
        {caractere === 0 ? <path d="M82 184 q-4 8 4 8 q4-4 8 0 q2-6 -4-10 Z M118 184 q4 8 -4 8 q-4-4 -8 0 q-2-6 4-10 Z" fill="#f3b54a" /> : null}
      </g>
      {caractere !== 0 ? (
        <g className="pl-membres" transform={miroir ? "matrix(-1 0 0 1 200 0)" : undefined}>
          <Chaussures caractere={caractere} />
          <MainOutil caractere={caractere} />
          {/* Bataille : les deux poings levés, « en garde ! » (pour rire) */}
          <g className="pl-main pl-main-boxe">
            <g className="pl-poing-g"><Main caractere={caractere} x={34} y={140} /></g>
            <g className="pl-poing-d"><Main caractere={caractere} x={166} y={140} /></g>
          </g>
          {/* Pendant les jeux : elle applaudit et encourage */}
          <g className="pl-main pl-main-applaudit">
            <g className="pl-clap-g"><Main caractere={caractere} x={28} y={150} /></g>
            <g className="pl-clap-d"><Main caractere={caractere} x={172} y={150} /></g>
          </g>
          {/* Victoire : les bras en l'air ! */}
          <g className="pl-main pl-main-bravo">
            <g className="pl-bravo-g"><Main caractere={caractere} x={14} y={40} /></g>
            <g className="pl-bravo-d"><Main caractere={caractere} x={186} y={40} /></g>
          </g>
          <g className="pl-mains-peur">
            <Main caractere={caractere} x={72} y={94} r={24} />
            <Main caractere={caractere} x={128} y={94} r={24} />
          </g>
        </g>
      ) : null}
    </svg>
  );
}

/** Les yeux : doux et calmes (1), pétillants (2), attentifs avec sourcils (3), grands yeux de savante folle (4). */
function Yeux({ caractere }: { caractere: Caractere }) {
  const fou = caractere === 4;
  return (
    <g className="pl-yeux">
      <circle cx="72" cy="92" r={fou ? 27 : 24} fill="#fff" />
      <circle cx="128" cy="92" r={fou ? 27 : 24} fill="#fff" />
      <circle cx="74" cy="95" r={fou ? 12 : 17} fill="#2a1650" />
      <circle cx="126" cy="95" r={fou ? 12 : 17} fill="#2a1650" />
      <circle cx="74" cy="99" r={fou ? 6 : 10} fill={fou ? "#2fb36a" : "#5b3fb0"} />
      <circle cx="126" cy="99" r={fou ? 6 : 10} fill={fou ? "#2fb36a" : "#5b3fb0"} />
      <circle cx="81" cy="87" r="7" fill="#fff" />
      <circle cx="133" cy="87" r="7" fill="#fff" />
      <circle cx="68" cy="104" r="3" fill="#fff" />
      <circle cx="120" cy="104" r="3" fill="#fff" />
      {caractere === 1 ? (
        // Paupières à moitié baissées : Plume est calme, tranquille.
        <><path d="M46 86 Q72 94 98 86 L98 70 Q72 62 46 70 Z M102 86 Q128 94 154 86 L154 70 Q128 62 102 70 Z" fill="#9a74e6" /><path d="M46 86 Q72 94 98 86 M102 86 Q128 94 154 86" stroke="#5b3fb0" strokeWidth="3" fill="none" strokeLinecap="round" /></>
      ) : null}
      {caractere === 2 ? (
        // Des étoiles qui pétillent dans les yeux.
        <path d="M84 84 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z M136 84 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z" fill="#fff6b0" />
      ) : null}
      {caractere === 3 ? (
        // Sourcils attentifs : elle réfléchit.
        <path d="M52 64 Q72 56 92 64 M108 64 Q128 56 148 64" stroke="#3a2066" strokeWidth="5" fill="none" strokeLinecap="round" />
      ) : null}
      {caractere === 4 ? (
        // Sourcils en bataille, très haut : elle est survoltée !
        <path d="M46 60 L60 52 L72 60 L86 50 M114 50 L128 60 L140 52 L154 60" stroke="#f4f1ff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </g>
  );
}

/** Le vêtement de chaque caractère. */
function Vetement({ caractere }: { caractere: Caractere }) {
  if (caractere === 1) {
    // Une grande écharpe douce, en tricot.
    return (
      <g>
        <path d="M44 136 Q100 162 156 136 L156 152 Q100 180 44 152 Z" fill="#7fc8b8" stroke="#4f9a8a" strokeWidth="2" />
        <path d="M60 144 v12 M76 150 v12 M92 153 v12 M108 153 v12 M124 150 v12 M140 144 v12" stroke="#a9e0d4" strokeWidth="3" />
        <path d="M124 152 L134 194 L152 190 L140 150 Z" fill="#7fc8b8" stroke="#4f9a8a" strokeWidth="2" />
        <path d="M134 194 v6 M140 193 v6 M146 192 v6 M152 190 v6" stroke="#4f9a8a" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  }
  if (caractere === 2) {
    // Un joli foulard à pois, noué devant.
    return (
      <g>
        <path d="M46 132 Q100 158 154 132 L150 146 Q100 172 50 146 Z" fill="#ff7fb6" stroke="#d24f8a" strokeWidth="2" />
        <path d="M100 150 L84 178 L100 170 L116 178 Z" fill="#ff7fb6" stroke="#d24f8a" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="66" cy="142" r="3.5" fill="#fff" /><circle cx="86" cy="148" r="3.5" fill="#fff" /><circle cx="114" cy="148" r="3.5" fill="#fff" />
        <circle cx="134" cy="142" r="3.5" fill="#fff" /><circle cx="100" cy="164" r="3.5" fill="#fff" />
      </g>
    );
  }
  if (caractere === 3) {
    // Le col blanc et la cravate de l'élève sérieuse.
    return (
      <g>
        <path d="M66 136 L100 150 L134 136 L128 156 L100 160 L72 156 Z" fill="#ffffff" stroke="#c9c4e0" strokeWidth="2" strokeLinejoin="round" />
        <path d="M94 150 L106 150 L110 160 L104 192 L100 198 L96 192 L90 160 Z" fill="#c2402a" stroke="#8a2a1a" strokeWidth="2" strokeLinejoin="round" />
        <path d="M92 168 L108 176 M92 182 L108 190" stroke="#f3d48a" strokeWidth="3" />
      </g>
    );
  }
  if (caractere === 4) {
    // La blouse blanche de savante folle, avec sa fiole qui bouillonne.
    return (
      <g>
        <path d="M40 120 Q44 180 90 192 L100 152 L110 192 Q156 180 160 120 Q140 148 114 150 L100 192 L86 150 Q60 148 40 120 Z" fill="#fbfbff" stroke="#b9b4d8" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M86 150 L100 170 L114 150" fill="none" stroke="#b9b4d8" strokeWidth="2.5" />
        <circle cx="94" cy="178" r="3" fill="#b9b4d8" />
        <rect x="118" y="164" width="16" height="12" rx="2" fill="#eeeaf8" stroke="#b9b4d8" strokeWidth="2" />
        <path d="M122 164 L122 154 M128 164 L128 150" stroke="#e2453c" strokeWidth="3" strokeLinecap="round" />
        <g className="pl-fiole">
          <path d="M164 112 L164 128 L152 154 Q150 162 158 162 L186 162 Q194 162 190 154 L178 128 L178 112 Z" fill="#e8fff4" fillOpacity=".9" stroke="#4a7a5a" strokeWidth="2.5" />
          <path d="M155 146 Q171 141 187 146 L190 154 Q194 162 186 162 L158 162 Q150 162 152 154 Z" fill="#5fe07a" />
          <circle className="pl-bulle1" cx="166" cy="142" r="4" fill="#b9ffc4" />
          <circle className="pl-bulle2" cx="176" cy="146" r="3" fill="#b9ffc4" />
        </g>
      </g>
    );
  }
  return null;
}

/** Sur la tête : bonnet (1), grand nœud (2), chapeau d'étudiant (3), plumes ébouriffées et lunettes de labo (4). */
function Chapeau({ caractere, lit }: { caractere: Caractere; lit: boolean }) {
  if (caractere === 0) {
    return (
      <>
        <path d="M80 44 L86 26 L94 38 L100 22 L106 38 L114 26 L120 44 Z" fill="#f3d48a" stroke="#c9963a" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="100" cy="22" r="4" fill="#ff9fcf" />
      </>
    );
  }
  if (caractere === 1) {
    return (
      <g>
        <path d="M56 50 Q58 8 100 6 Q142 8 144 50 Z" fill="#7fc8b8" stroke="#4f9a8a" strokeWidth="2.5" />
        <path d="M54 44 Q100 56 146 44 L146 54 Q100 66 54 54 Z" fill="#5fae9e" />
        <path d="M70 20 v22 M85 12 v30 M100 9 v32 M115 12 v30 M130 20 v22" stroke="#a9e0d4" strokeWidth="2.5" />
        <circle cx="100" cy="0" r="12" fill="#f4f1ff" stroke="#c9c4e0" strokeWidth="2" />
      </g>
    );
  }
  if (caractere === 2) {
    return (
      <g>
        <path d="M100 34 L58 12 Q48 28 58 46 Z M100 34 L142 12 Q152 28 142 46 Z" fill="#ff7fb6" stroke="#d24f8a" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="100" cy="32" r="10" fill="#ff9fcf" stroke="#d24f8a" strokeWidth="2.5" />
        <circle cx="72" cy="26" r="3.5" fill="#fff" /><circle cx="128" cy="26" r="3.5" fill="#fff" /><circle cx="64" cy="38" r="3" fill="#fff" /><circle cx="136" cy="38" r="3" fill="#fff" />
      </g>
    );
  }
  if (caractere === 3) {
    return (
      <g>
        <path d="M70 34 L70 52 Q100 64 130 52 L130 34 Z" fill="#2a1c3a" />
        <path d="M40 30 L100 4 L160 30 L100 56 Z" fill="#3a2a5a" stroke="#1d1238" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="100" cy="30" r="4.5" fill="#f3d48a" />
        <path d="M100 30 L150 40 L152 66" stroke="#f3d48a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M146 64 L158 64 L156 78 L148 78 Z" fill="#f3d48a" />
      </g>
    );
  }
  // 4 : plumes ébouriffées, et les lunettes de laboratoire sur le front (descendues sur les yeux quand elle lit).
  return (
    <g>
      <path d="M62 46 L48 6 L74 30 L76 -6 L92 24 L100 -12 L108 24 L124 -6 L126 30 L152 6 L138 46 Z" fill="#f4f1ff" stroke="#c9c4e0" strokeWidth="2.5" strokeLinejoin="round" />
      {lit ? null : (
        <>
          <path d="M50 54 Q100 38 150 54" stroke="#4a2a8a" strokeWidth="6" fill="none" />
          <circle cx="80" cy="48" r="14" fill="#9fe3ff" fillOpacity=".8" stroke="#4a2a8a" strokeWidth="5" />
          <circle cx="120" cy="48" r="14" fill="#9fe3ff" fillOpacity=".8" stroke="#4a2a8a" strokeWidth="5" />
          <circle cx="76" cy="44" r="4" fill="#fff" />
          <circle cx="116" cy="44" r="4" fill="#fff" />
        </>
      )}
    </g>
  );
}

/** Les lunettes de lecture, différentes pour chaque caractère. */
function Lunettes({ caractere }: { caractere: Caractere }) {
  if (caractere === 4) {
    // Les grosses lunettes de labo, descendues sur les yeux.
    return (
      <g>
        <path d="M40 92 Q100 76 160 92" stroke="#4a2a8a" strokeWidth="7" fill="none" />
        <circle cx="72" cy="93" r="30" fill="#9fe3ff" fillOpacity=".35" stroke="#4a2a8a" strokeWidth="7" />
        <circle cx="128" cy="93" r="30" fill="#9fe3ff" fillOpacity=".35" stroke="#4a2a8a" strokeWidth="7" />
        <circle cx="62" cy="82" r="6" fill="#fff" fillOpacity=".8" />
        <circle cx="118" cy="82" r="6" fill="#fff" fillOpacity=".8" />
      </g>
    );
  }
  const couleur = caractere === 1 ? "#4f9a8a" : caractere === 2 ? "#d24f8a" : "#2a1c14";
  const forme =
    caractere === 2 ? (
      // Lunettes en forme de cœur
      <path d="M72 120 C44 100 46 72 72 82 C98 72 100 100 72 120 Z M128 120 C100 100 102 72 128 82 C154 72 156 100 128 120 Z" fill="#ffd1e8" fillOpacity=".35" stroke={couleur} strokeWidth="5" />
    ) : (
      <>
        <circle cx="72" cy="93" r={caractere === 3 ? 29 : 26} fill="#fff" fillOpacity=".15" stroke={couleur} strokeWidth={caractere === 3 ? 6 : 4} />
        <circle cx="128" cy="93" r={caractere === 3 ? 29 : 26} fill="#fff" fillOpacity=".15" stroke={couleur} strokeWidth={caractere === 3 ? 6 : 4} />
      </>
    );
  return (
    <g>
      {forme}
      <path d="M98 90 q2 -6 4 0" stroke={couleur} strokeWidth="5" fill="none" />
      <path d="M46 90 L34 84 M154 90 L166 84" stroke={couleur} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

/* ---------- Les mains et les chaussures flottantes (comme Rayman : elles ne touchent pas le corps) ---------- */

const GANT: Record<number, [string, string]> = {
  1: ["#7fc8b8", "#4f9a8a"], // moufle tricotée
  2: ["#ff9fcf", "#d24f8a"], // gant rose
  3: ["#ffffff", "#9d97c0"], // gant blanc
  4: ["#ffd84a", "#b8901a"], // gant de labo jaune
};

/** Une petite main ronde, posée en (x, y). */
function Main({ caractere, x, y, r = 15 }: { caractere: Caractere; x: number; y: number; r?: number }) {
  const [fond, trait] = GANT[caractere] ?? GANT[3];
  const k = r / 11;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fond} stroke={trait} strokeWidth="2.5" />
      <ellipse cx={x + 8 * k} cy={y - 6 * k} rx={5 * k} ry={4 * k} fill={fond} stroke={trait} strokeWidth="2.5" />
      <path d={`M${x - 5 * k} ${y - 4 * k} v${7 * k} M${x} ${y - 5 * k} v${8 * k}`} stroke={trait} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** La main qui tient l'outil de chaque caractère. Elle flotte du côté du texte. */
function MainOutil({ caractere }: { caractere: Caractere }) {
  if (caractere === 1) {
    // Discrète : quand elle lit, sa moufle remonte doucement ses lunettes.
    return (
      <g className="pl-main pl-main-lunettes">
        <Main caractere={1} x={30} y={96} />
      </g>
    );
  }
  if (caractere === 2) {
    return (
      <>
        {/* Elle fait coucou de temps en temps */}
        <g className="pl-main pl-main-coucou">
          <Main caractere={2} x={14} y={92} />
        </g>
        {/* Quand elle lit : un petit livre ouvert, dont elle tourne les pages */}
        <g className="pl-main pl-main-livre">
          <path d="M-14 128 L10 124 L10 156 L-14 160 Z" fill="#fff8ea" stroke="#d24f8a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M10 124 L34 128 L34 160 L10 156 Z" fill="#ffe3f0" stroke="#d24f8a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M-9 134 l14 -2 M-9 141 l14 -2 M-9 148 l14 -2 M15 132 l14 2 M15 139 l14 2" stroke="#e8a0c4" strokeWidth="2" strokeLinecap="round" />
          <path className="pl-page" d="M10 124 L30 127 L30 158 L10 156 Z" fill="#fff" stroke="#d24f8a" strokeWidth="2" strokeLinejoin="round" />
          <Main caractere={2} x={22} y={164} />
        </g>
      </>
    );
  }
  if (caractere === 3) {
    return (
      <>
        {/* Elle réfléchit : petits coups de crayon sur le menton */}
        <g className="pl-main pl-main-crayon">
          <path d="M22 132 L46 104" stroke="#f3b54a" strokeWidth="6" strokeLinecap="round" />
          <path d="M46 104 L52 97" stroke="#2a1c14" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 134 L24 130" stroke="#ff9fcf" strokeWidth="7" strokeLinecap="round" />
          <Main caractere={3} x={22} y={136} />
        </g>
        {/* Quand elle lit : la baguette levée vers le texte */}
        <g className="pl-main pl-main-baguette">
          <path d="M18 112 L-34 40" stroke="#8a5a2e" strokeWidth="5" strokeLinecap="round" />
          <circle cx="-34" cy="40" r="5" fill="#e2453c" />
          <Main caractere={3} x={18} y={114} />
        </g>
      </>
    );
  }
  return (
    <>
      {/* Passionnée : elle inspecte tout à la loupe */}
      <g className="pl-main pl-main-loupe">
        <circle cx="0" cy="96" r="15" fill="#9fe3ff" fillOpacity=".45" stroke="#4a2a8a" strokeWidth="5" />
        <circle cx="-5" cy="91" r="4" fill="#fff" fillOpacity=".9" />
        <path d="M10 108 L22 124" stroke="#8a5a2e" strokeWidth="7" strokeLinecap="round" />
        <Main caractere={4} x={22} y={126} />
      </g>
      {/* Quand elle lit : la craie qui gribouille vers son tableau */}
      <g className="pl-main pl-main-craie">
        <path d="M14 100 L-2 78" stroke="#f4f1e6" strokeWidth="7" strokeLinecap="round" />
        <Main caractere={4} x={16} y={104} />
      </g>
    </>
  );
}

/** Les chaussures, posées sous Plume sans la toucher. La droite tape du pied. */
function Chaussures({ caractere }: { caractere: Caractere }) {
  const forme = (cote: "g" | "d") => {
    const chaussure =
      caractere === 1 ? (
        // Chaussons tout doux, avec un pompon
        <>
          <path d="M106 210 Q104 196 116 196 Q132 196 138 203 Q142 210 134 211 Z" fill="#7fc8b8" stroke="#4f9a8a" strokeWidth="2.5" />
          <circle cx="128" cy="198" r="5" fill="#f4f1ff" stroke="#c9c4e0" strokeWidth="1.5" />
        </>
      ) : caractere === 2 ? (
        // Ballerines roses avec un petit nœud
        <>
          <path d="M106 209 Q106 199 118 199 Q134 199 140 206 Q140 211 132 211 L110 211 Z" fill="#ff7fb6" stroke="#d24f8a" strokeWidth="2.5" />
          <path d="M126 200 l-6 -5 v9 Z M126 200 l6 -5 v9 Z" fill="#fff" stroke="#d24f8a" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      ) : caractere === 3 ? (
        // Souliers vernis d'écolière
        <>
          <path d="M106 210 L106 198 Q112 194 120 198 Q136 199 140 205 Q141 211 134 211 Z" fill="#2a1c3a" stroke="#120a20" strokeWidth="2" />
          <path d="M110 200 L122 200" stroke="#f3d48a" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="132" cy="203" rx="4" ry="2" fill="#fff" fillOpacity=".6" />
        </>
      ) : (
        // Grosses baskets rouges de savante folle
        <>
          <path d="M104 212 L104 194 Q112 188 122 194 Q140 196 146 204 L146 212 Z" fill="#e2453c" stroke="#8a1f1a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M102 212 L148 212 L148 216 L102 216 Z" fill="#fff" stroke="#b9b4d8" strokeWidth="1.5" />
          <path d="M112 196 l8 6 M118 194 l8 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M120 198 q6 -12 14 -6" stroke="#fff" strokeWidth="2" fill="none" />
        </>
      );
    return cote === "d" ? (
      <g className="pl-pied-d">{chaussure}</g>
    ) : (
      <g transform="matrix(-1 0 0 1 200 0)">
        <g className="pl-pied-g">{chaussure}</g>
      </g>
    );
  };
  return (
    <g className="pl-pieds">
      {forme("g")}
      {forme("d")}
    </g>
  );
}

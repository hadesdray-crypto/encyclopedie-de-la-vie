// Le vestiaire des personnages bonus : chaque morceau se choisit séparément et se mélange.
// Haut, bas, chapeau, lunettes, chaussures, objet dans la main ; et la couleur de chaque morceau.
// Tout est dessiné (SVG, repère 200 × 200 de Plume) : c'est léger, et facile d'en ajouter (une ligne + un dessin).
import type { ReactNode } from "react";

export type Piece = { id: string; nom: string; pour: "filles" | "garcons" | "tous" };
export type Tenue = { haut: string; bas: string; chapeau: string; lunettes: string; chaussures: string; objet: string; couleurs: Partial<Record<"haut" | "bas" | "chapeau" | "chaussures" | "objet", string>> };

export const TEINTES: { id: string; nom: string; c: string }[] = [
  { id: "rouge", nom: "Rouge", c: "#e2453c" }, { id: "orange", nom: "Orange", c: "#ff8a3d" }, { id: "jaune", nom: "Jaune", c: "#f3c35a" },
  { id: "vert", nom: "Vert", c: "#4fb05a" }, { id: "bleu", nom: "Bleu", c: "#3f7fd0" }, { id: "violet", nom: "Violet", c: "#8a5cf0" },
  { id: "rose", nom: "Rose", c: "#ff7fb6" }, { id: "blanc", nom: "Blanc", c: "#f7f5ff" }, { id: "noir", nom: "Noir", c: "#2a2438" }, { id: "marron", nom: "Marron", c: "#9a6a3a" },
];
const teinte = (id: string | undefined, defaut: string) => TEINTES.find((t) => t.id === id)?.c ?? defaut;
/** Une couleur plus foncée, pour les contours. */
function fonce(hex: string, k = 0.62) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

export const HAUTS: Piece[] = [
  { id: "aucun", nom: "Rien", pour: "tous" },
  { id: "danseuse", nom: "Justaucorps de danseuse", pour: "filles" }, { id: "princesse", nom: "Corsage de princesse", pour: "filles" },
  { id: "fleurs", nom: "Blouse à fleurs", pour: "filles" }, { id: "gilet", nom: "Gilet d'écolière", pour: "filles" }, { id: "cuisine", nom: "Tablier de cuisine", pour: "filles" },
  { id: "foot", nom: "Maillot de foot", pour: "garcons" }, { id: "pompier", nom: "Veste de pompier", pour: "garcons" },
  { id: "medecin", nom: "Blouse de médecin", pour: "garcons" }, { id: "cravate", nom: "Chemise et cravate", pour: "garcons" }, { id: "chevalier", nom: "Armure de chevalier", pour: "garcons" },
  { id: "echarpe", nom: "Écharpe tricotée", pour: "tous" }, { id: "cape", nom: "Cape de super-héros", pour: "tous" }, { id: "securite", nom: "Gilet de sécurité", pour: "tous" },
];
export const BAS: Piece[] = [
  { id: "aucun", nom: "Rien", pour: "tous" },
  { id: "tutu", nom: "Tutu", pour: "filles" }, { id: "plissee", nom: "Jupe plissée", pour: "filles" }, { id: "longue", nom: "Robe longue", pour: "filles" },
  { id: "volants", nom: "Short à volants", pour: "filles" }, { id: "etoiles", nom: "Leggings à étoiles", pour: "filles" },
  { id: "pantalon", nom: "Pantalon", pour: "garcons" }, { id: "shortfoot", nom: "Short de foot", pour: "garcons" }, { id: "jean", nom: "Jean", pour: "garcons" },
  { id: "kilt", nom: "Kilt écossais", pour: "garcons" }, { id: "salopette", nom: "Salopette", pour: "garcons" },
];
export const CHAPEAUX2: Piece[] = [
  { id: "aucun", nom: "Rien", pour: "tous" },
  { id: "diademe", nom: "Diadème", pour: "filles" }, { id: "noeud", nom: "Grand nœud", pour: "filles" }, { id: "fleurs", nom: "Couronne de fleurs", pour: "filles" },
  { id: "paille", nom: "Chapeau de paille", pour: "filles" }, { id: "bonnet", nom: "Bonnet à pompon", pour: "filles" },
  { id: "casquette", nom: "Casquette", pour: "garcons" }, { id: "pirate", nom: "Chapeau de pirate", pour: "garcons" }, { id: "cowboy", nom: "Chapeau de cow-boy", pour: "garcons" },
  { id: "pompier", nom: "Casque de pompier", pour: "garcons" }, { id: "chevalier", nom: "Casque de chevalier", pour: "garcons" },
  { id: "couronne", nom: "Couronne", pour: "tous" }, { id: "diplome", nom: "Chapeau de diplômé", pour: "tous" }, { id: "magicien", nom: "Chapeau de magicien", pour: "tous" },
  { id: "toque", nom: "Toque de cuisinier", pour: "tous" }, { id: "haut", nom: "Haut-de-forme", pour: "tous" },
];
export const LUNETTES: Piece[] = [
  { id: "aucune", nom: "Rien", pour: "tous" },
  { id: "coeurs", nom: "Lunettes cœur", pour: "filles" }, { id: "papillon", nom: "Lunettes papillon", pour: "filles" }, { id: "etoiles", nom: "Lunettes étoiles", pour: "filles" },
  { id: "roses", nom: "Rondes roses", pour: "filles" }, { id: "strass", nom: "Lunettes à paillettes", pour: "filles" },
  { id: "rondes", nom: "Rondes noires", pour: "garcons" }, { id: "soleil", nom: "Lunettes de soleil", pour: "garcons" }, { id: "aviateur", nom: "Lunettes d'aviateur", pour: "garcons" },
  { id: "ski", nom: "Masque de ski", pour: "garcons" }, { id: "monocle", nom: "Monocle", pour: "garcons" },
];
export const CHAUSSURES: Piece[] = [
  { id: "aucune", nom: "Selon son caractère", pour: "tous" },
  { id: "ballerines", nom: "Ballerines", pour: "filles" }, { id: "pluie", nom: "Bottes de pluie", pour: "filles" }, { id: "sandales", nom: "Sandales", pour: "filles" },
  { id: "pointes", nom: "Chaussons de danse", pour: "filles" }, { id: "talons", nom: "Petits talons", pour: "filles" },
  { id: "baskets", nom: "Baskets", pour: "garcons" }, { id: "crampons", nom: "Chaussures de foot", pour: "garcons" }, { id: "bottescowboy", nom: "Bottes de cow-boy", pour: "garcons" },
  { id: "bottespompier", nom: "Bottes de pompier", pour: "garcons" }, { id: "vernis", nom: "Souliers vernis", pour: "garcons" },
];
export const OBJETS: Piece[] = [
  { id: "aucun", nom: "Rien", pour: "tous" },
  { id: "baguette", nom: "Baguette magique", pour: "filles" }, { id: "fleur", nom: "Une fleur", pour: "filles" }, { id: "micro", nom: "Micro de chanteuse", pour: "filles" },
  { id: "pinceau", nom: "Pinceau", pour: "filles" }, { id: "arrosoir", nom: "Arrosoir", pour: "filles" },
  { id: "batte", nom: "Batte de baseball", pour: "garcons" }, { id: "guitare", nom: "Guitare", pour: "garcons" }, { id: "ballon", nom: "Ballon", pour: "garcons" },
  { id: "pelle", nom: "Pelle", pour: "garcons" }, { id: "epee", nom: "Épée en bois", pour: "garcons" },
  { id: "piqure", nom: "Piqûre de docteur", pour: "tous" }, { id: "rateau", nom: "Râteau", pour: "tous" }, { id: "balai", nom: "Balai", pour: "tous" }, { id: "livre", nom: "Livre", pour: "tous" },
];

export const TENUE_VIDE: Tenue = { haut: "aucun", bas: "aucun", chapeau: "aucun", lunettes: "aucune", chaussures: "aucune", objet: "aucun", couleurs: {} };

/* ------------------------------------------------------------------ les dessins */

export function Haut({ t }: { t: Tenue }): ReactNode {
  const c = teinte(t.couleurs.haut, "#3f7fd0"), f = fonce(c);
  switch (t.haut) {
    case "danseuse": return <path d="M60 128 Q100 150 140 128 L136 168 Q100 178 64 168 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" />;
    case "princesse": return <g><path d="M58 128 Q100 146 142 128 L134 166 Q100 176 66 166 Z" fill={c} stroke={f} strokeWidth="2.5" /><path d="M58 128 Q100 146 142 128" stroke="#fff" strokeWidth="4" fill="none" /><circle cx="100" cy="150" r="5" fill="#f3d48a" stroke="#b8862e" strokeWidth="1.5" /></g>;
    case "fleurs": return <g><path d="M50 130 Q100 152 150 130 L152 168 Q100 182 48 168 Z" fill={c} stroke={f} strokeWidth="2.5" />{[[70, 148], [100, 160], [130, 148], [84, 168], [116, 168]].map(([x, y]) => <g key={x + "-" + y}><circle cx={x} cy={y} r="4" fill="#fff" /><circle cx={x} cy={y} r="1.6" fill="#f3d48a" /></g>)}</g>;
    case "gilet": return <g><path d="M50 128 L86 146 L86 186 Q62 182 46 166 Z M150 128 L114 146 L114 186 Q138 182 154 166 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><circle cx="80" cy="158" r="3" fill="#fff" /><circle cx="80" cy="172" r="3" fill="#fff" /><path d="M86 146 L100 156 L114 146" stroke="#fff" strokeWidth="4" fill="none" /></g>;
    case "cuisine": return <g><path d="M70 136 L130 136 L136 190 Q100 198 64 190 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><path d="M70 136 L60 118 M130 136 L140 118" stroke={c} strokeWidth="5" strokeLinecap="round" /><rect x="88" y="160" width="24" height="14" rx="3" fill="#fff" fillOpacity=".5" stroke={f} strokeWidth="1.5" /></g>;
    case "foot": return <g><path d="M44 132 Q100 156 156 132 L160 168 Q140 186 100 188 Q60 186 40 168 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><path d="M84 142 L100 156 L116 142" stroke="#fff" strokeWidth="4" fill="none" /><text x="100" y="182" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff" fontFamily="sans-serif">8</text></g>;
    case "pompier": return <g><path d="M42 130 Q100 156 158 130 L160 170 Q140 190 100 192 Q60 190 40 170 Z" fill={c} stroke={f} strokeWidth="2.5" /><path d="M42 162 Q100 184 158 162" stroke="#e8f0e8" strokeWidth="6" fill="none" /><path d="M100 150 L100 190" stroke={f} strokeWidth="2.5" /></g>;
    case "medecin": return <g><path d="M40 122 Q44 180 90 192 L100 152 L110 192 Q156 180 160 122 Q140 148 114 150 L100 192 L86 150 Q60 148 40 122 Z" fill="#fbfbff" stroke="#b9b4d8" strokeWidth="2.5" strokeLinejoin="round" /><path d="M76 146 Q70 172 86 176 Q100 178 98 164" stroke={c} strokeWidth="3.5" fill="none" /><circle cx="98" cy="162" r="4" fill="#8a8aa8" /><path d="M124 162 h12 M130 156 v12" stroke={c} strokeWidth="4" strokeLinecap="round" /></g>;
    case "cravate": return <g><path d="M66 136 L100 150 L134 136 L128 156 L100 160 L72 156 Z" fill="#ffffff" stroke="#c9c4e0" strokeWidth="2" /><path d="M94 150 L106 150 L110 160 L104 192 L100 198 L96 192 L90 160 Z" fill={c} stroke={f} strokeWidth="2" strokeLinejoin="round" /></g>;
    case "chevalier": return <g><path d="M46 132 Q100 156 154 132 L156 172 Q130 192 100 192 Q70 192 44 172 Z" fill="#c8cbd8" stroke="#6a6f88" strokeWidth="2.5" /><path d="M100 148 L100 190 M60 150 Q100 170 140 150" stroke="#8a8fa8" strokeWidth="2.5" fill="none" /><path d="M88 158 L112 158 L112 172 Q100 182 88 172 Z" fill={c} stroke={f} strokeWidth="2" /></g>;
    case "echarpe": return <g><path d="M44 136 Q100 162 156 136 L156 152 Q100 180 44 152 Z" fill={c} stroke={f} strokeWidth="2" /><path d="M124 152 L134 194 L152 190 L140 150 Z" fill={c} stroke={f} strokeWidth="2" /></g>;
    case "cape": return <g><path d="M48 128 Q100 150 152 128 L150 140 Q100 162 50 140 Z" fill={c} stroke={f} strokeWidth="2.5" /><circle cx="100" cy="166" r="14" fill="#f3d48a" stroke="#b8862e" strokeWidth="2.5" /><path d="M100 156 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z" fill={c} /></g>;
    case "securite": return <g><path d="M48 132 L84 148 L84 192 Q60 188 44 170 Z M152 132 L116 148 L116 192 Q140 188 156 170 Z" fill="#d6ff3a" stroke="#8aa01a" strokeWidth="2.5" strokeLinejoin="round" /><path d="M46 162 L84 170 M154 162 L116 170" stroke="#e8e8f0" strokeWidth="5" strokeLinecap="round" /></g>;
    default: return null;
  }
}

/** Le bas : il se dessine sur le bas du ventre (le corps de Plume est tout rond, sans jambes). */
export function Bas({ t }: { t: Tenue }): ReactNode {
  const c = teinte(t.couleurs.bas, "#ff7fb6"), f = fonce(c);
  switch (t.bas) {
    case "tutu": return <path d="M40 172 Q48 158 60 170 Q70 156 82 170 Q92 156 100 170 Q108 156 118 170 Q130 156 140 170 Q152 158 160 172 Q150 188 100 190 Q50 188 40 172 Z" fill={c} fillOpacity=".85" stroke={f} strokeWidth="2.5" strokeLinejoin="round" />;
    case "plissee": return <g><path d="M54 166 L146 166 L156 192 Q100 202 44 192 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><path d="M66 168 L60 196 M82 168 L80 198 M100 168 L100 199 M118 168 L120 198 M134 168 L140 196" stroke={f} strokeWidth="1.8" /></g>;
    case "longue": return <g><path d="M56 160 Q100 172 144 160 L166 200 Q100 214 34 200 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><path d="M40 196 Q100 208 160 196" stroke="#fff" strokeWidth="3" fill="none" strokeDasharray="2 6" strokeLinecap="round" /></g>;
    case "volants": return <g><path d="M58 168 L142 168 L146 186 Q100 194 54 186 Z" fill={c} stroke={f} strokeWidth="2.5" /><path d="M54 186 Q62 194 70 188 Q78 196 86 189 Q94 197 100 190 Q106 197 114 189 Q122 196 130 188 Q138 194 146 186" stroke={f} strokeWidth="2" fill={c} /></g>;
    case "etoiles": return <g><path d="M60 166 L140 166 L138 196 L104 196 L100 180 L96 196 L62 196 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" />{[[76, 178], [124, 178], [84, 190], [116, 190]].map(([x, y]) => <path key={x + "-" + y} d={`M${x} ${y - 4} l1.2 2.8 l3 .3 l-2.3 2 l.7 3 l-2.6 -1.6 l-2.6 1.6 l.7 -3 l-2.3 -2 l3 -.3 Z`} fill="#fff6b0" />)}</g>;
    case "pantalon": return <path d="M58 166 L142 166 L142 198 L106 198 L100 182 L94 198 L58 198 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" />;
    case "shortfoot": return <g><path d="M56 166 L144 166 L146 190 L106 190 L100 178 L94 190 L54 190 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><path d="M56 184 L94 184 M106 184 L146 184" stroke="#fff" strokeWidth="3" /></g>;
    case "jean": return <g><path d="M58 166 L142 166 L142 198 L106 198 L100 182 L94 198 L58 198 Z" fill={teinte(t.couleurs.bas, "#3a66b8")} stroke={fonce(teinte(t.couleurs.bas, "#3a66b8"))} strokeWidth="2.5" strokeLinejoin="round" /><path d="M64 172 Q72 180 82 172 M118 172 Q128 180 136 172" stroke="#f3c35a" strokeWidth="1.8" fill="none" strokeDasharray="3 3" /></g>;
    case "kilt": return <g><path d="M54 166 L146 166 L152 194 Q100 202 48 194 Z" fill={c} stroke={f} strokeWidth="2.5" /><path d="M54 176 L148 176 M52 186 L150 186 M74 166 L70 196 M100 166 L100 199 M126 166 L130 196" stroke={f} strokeWidth="2.2" opacity=".7" /><rect x="118" y="168" width="8" height="16" rx="2" fill="#f3d48a" /></g>;
    case "salopette": return <g><path d="M66 150 L134 150 L138 196 L106 196 L100 182 L94 196 L62 196 Z" fill={c} stroke={f} strokeWidth="2.5" strokeLinejoin="round" /><path d="M72 152 L62 118 M128 152 L138 118" stroke={c} strokeWidth="8" strokeLinecap="round" /><circle cx="72" cy="152" r="4" fill="#f3d48a" /><circle cx="128" cy="152" r="4" fill="#f3d48a" /></g>;
    default: return null;
  }
}

export function Chapeau2({ t }: { t: Tenue }): ReactNode {
  const c = teinte(t.couleurs.chapeau, ""), f = c ? fonce(c) : "";
  const col = (defaut: string) => c || defaut;
  const tr = (defaut: string) => f || fonce(defaut);
  switch (t.chapeau) {
    case "diademe": return <g><path d="M64 46 Q100 26 136 46" stroke={col("#f3d48a")} strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M86 36 L92 22 L100 32 L108 22 L114 36" fill={col("#f3d48a")} stroke={tr("#f3d48a")} strokeWidth="2" strokeLinejoin="round" /><circle cx="100" cy="30" r="4" fill="#9fe3ff" /></g>;
    case "noeud": return <g><path d="M100 34 L58 12 Q48 28 58 46 Z M100 34 L142 12 Q152 28 142 46 Z" fill={col("#ff7fb6")} stroke={tr("#ff7fb6")} strokeWidth="2.5" strokeLinejoin="round" /><circle cx="100" cy="32" r="10" fill={col("#ff7fb6")} stroke={tr("#ff7fb6")} strokeWidth="2.5" /></g>;
    case "fleurs": return <g>{[60, 76, 92, 108, 124, 140].map((x, i) => <g key={x} transform={`translate(${x} ${44 - Math.sin((i / 5) * Math.PI) * 14})`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-5" rx="4" ry="6" fill={i % 2 ? col("#ff9fcf") : "#fff"} transform={`rotate(${a})`} />)}<circle r="3" fill="#f3d48a" /></g>)}</g>;
    case "paille": return <g><path d="M70 42 Q70 12 100 12 Q130 12 130 42 Z" fill="#f0d68a" stroke="#b89a4a" strokeWidth="2.5" /><path d="M36 44 Q100 62 164 44 Q160 54 100 56 Q40 54 36 44 Z" fill="#f0d68a" stroke="#b89a4a" strokeWidth="2.5" /><path d="M70 38 Q100 46 130 38" stroke={col("#ff7fb6")} strokeWidth="6" fill="none" /></g>;
    case "bonnet": return <g><path d="M56 50 Q58 8 100 6 Q142 8 144 50 Z" fill={col("#7fc8b8")} stroke={tr("#7fc8b8")} strokeWidth="2.5" /><circle cx="100" cy="0" r="12" fill="#f4f1ff" stroke="#c9c4e0" strokeWidth="2" /></g>;
    case "casquette": return <g><path d="M58 48 Q60 10 100 10 Q140 10 142 48 Z" fill={col("#3f7fd0")} stroke={tr("#3f7fd0")} strokeWidth="2.5" /><path d="M118 46 Q160 40 176 52 Q160 60 118 54 Z" fill={col("#3f7fd0")} stroke={tr("#3f7fd0")} strokeWidth="2.5" /></g>;
    case "pirate": return <g><path d="M36 50 Q60 0 100 8 Q140 0 164 50 Q100 30 36 50 Z" fill={col("#2a1c2a")} stroke="#120a12" strokeWidth="2.5" /><circle cx="100" cy="26" r="7" fill="#fff" /><path d="M94 32 l12 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></g>;
    case "cowboy": return <g><path d="M70 42 Q68 4 100 6 Q132 4 130 42 Z" fill={col("#b87a3a")} stroke={tr("#b87a3a")} strokeWidth="2.5" /><path d="M30 38 Q40 56 100 52 Q160 56 170 38 Q164 50 100 46 Q36 50 30 38 Z" fill={col("#b87a3a")} stroke={tr("#b87a3a")} strokeWidth="2.5" /></g>;
    case "pompier": return <g><path d="M56 50 Q56 4 100 4 Q144 4 144 50 Z" fill={col("#e2453c")} stroke={tr("#e2453c")} strokeWidth="2.5" /><path d="M44 48 Q100 62 156 48 L158 56 Q100 70 42 56 Z" fill={col("#e2453c")} stroke={tr("#e2453c")} strokeWidth="2.5" /><path d="M90 22 L110 22 L112 36 L100 42 L88 36 Z" fill="#f3d48a" /></g>;
    case "chevalier": return <g><path d="M56 56 Q56 2 100 2 Q144 2 144 56 Z" fill="#c8cbd8" stroke="#6a6f88" strokeWidth="2.5" /><path d="M100 2 Q112 -16 124 -8 Q110 -4 104 6" fill={col("#e2453c")} /><path d="M70 40 L130 40" stroke="#6a6f88" strokeWidth="3" /></g>;
    case "couronne": return <path d="M80 44 L86 26 L94 38 L100 22 L106 38 L114 26 L120 44 Z" fill={col("#f3d48a")} stroke={tr("#f3d48a")} strokeWidth="2" strokeLinejoin="round" />;
    case "diplome": return <g><path d="M70 34 L70 52 Q100 64 130 52 L130 34 Z" fill={col("#2a1c3a")} /><path d="M40 30 L100 4 L160 30 L100 56 Z" fill={col("#3a2a5a")} stroke="#1d1238" strokeWidth="2.5" strokeLinejoin="round" /><path d="M100 30 L150 40 L150 64" stroke="#f3d48a" strokeWidth="3" fill="none" /></g>;
    case "magicien": return <g><path d="M58 50 L100 -30 L142 50 Z" fill={col("#3a2a8a")} stroke={tr("#3a2a8a")} strokeWidth="2.5" strokeLinejoin="round" /><path d="M96 6 l3 -7 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 Z" fill="#f3d48a" /></g>;
    case "toque": return <g><path d="M66 48 L66 22 Q52 6 72 0 Q80 -14 100 -8 Q120 -14 128 0 Q148 6 134 22 L134 48 Z" fill={col("#ffffff")} stroke="#c9c4e0" strokeWidth="2.5" strokeLinejoin="round" /><path d="M66 40 L134 40" stroke="#c9c4e0" strokeWidth="2" /></g>;
    case "haut": return <g><rect x="72" y="-10" width="56" height="52" rx="4" fill={col("#2a1c3a")} stroke="#120a20" strokeWidth="2.5" /><rect x="72" y="28" width="56" height="9" fill="#c2402a" /><path d="M54 44 Q100 54 146 44 L146 50 Q100 60 54 50 Z" fill={col("#2a1c3a")} stroke="#120a20" strokeWidth="2.5" /></g>;
    default: return null;
  }
}

export function Lunettes2({ t }: { t: Tenue }): ReactNode {
  switch (t.lunettes) {
    case "coeurs": return <path d="M72 120 C44 100 46 72 72 82 C98 72 100 100 72 120 Z M128 120 C100 100 102 72 128 82 C154 72 156 100 128 120 Z" fill="#ff7fb6" fillOpacity=".35" stroke="#d24f8a" strokeWidth="5" />;
    case "papillon": return <g><path d="M44 84 Q60 70 98 82 Q96 110 72 112 Q48 110 44 84 Z M156 84 Q140 70 102 82 Q104 110 128 112 Q152 110 156 84 Z" fill="#ffd1e8" fillOpacity=".3" stroke="#c2457a" strokeWidth="5" strokeLinejoin="round" /><path d="M98 88 L102 88" stroke="#c2457a" strokeWidth="5" /></g>;
    case "etoiles": return <g>{[72, 128].map((x) => <path key={x} d={`M${x} 64 l8 18 l20 2 l-15 13 l5 20 l-18 -10 l-18 10 l5 -20 l-15 -13 l20 -2 Z`} fill="#fff6b0" fillOpacity=".35" stroke="#f3a83a" strokeWidth="4" strokeLinejoin="round" />)}</g>;
    case "roses": return <g><circle cx="72" cy="93" r="26" fill="#ffd1e8" fillOpacity=".25" stroke="#ff7fb6" strokeWidth="5" /><circle cx="128" cy="93" r="26" fill="#ffd1e8" fillOpacity=".25" stroke="#ff7fb6" strokeWidth="5" /></g>;
    case "strass": return <g><circle cx="72" cy="93" r="26" fill="#fff" fillOpacity=".15" stroke="#c9a4ff" strokeWidth="5" /><circle cx="128" cy="93" r="26" fill="#fff" fillOpacity=".15" stroke="#c9a4ff" strokeWidth="5" />{[[50, 76], [94, 76], [106, 76], [150, 76], [72, 67], [128, 67]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="3" fill="#fff" />)}</g>;
    case "rondes": return <g><circle cx="72" cy="93" r="26" fill="#fff" fillOpacity=".15" stroke="#2a1c14" strokeWidth="4" /><circle cx="128" cy="93" r="26" fill="#fff" fillOpacity=".15" stroke="#2a1c14" strokeWidth="4" /><path d="M98 90 q2 -6 4 0" stroke="#2a1c14" strokeWidth="5" fill="none" /></g>;
    case "soleil": return <path d="M44 80 Q72 74 98 80 Q98 112 72 112 Q46 112 44 80 Z M102 80 Q128 74 156 80 Q154 112 128 112 Q102 112 102 80 Z" fill="#1d1238" stroke="#0a0618" strokeWidth="3" strokeLinejoin="round" />;
    case "aviateur": return <g><path d="M46 82 Q72 76 96 84 Q94 116 70 114 Q48 110 46 82 Z M104 84 Q128 76 154 82 Q152 110 130 114 Q106 116 104 84 Z" fill="#c9a050" fillOpacity=".55" stroke="#8a6a2a" strokeWidth="3.5" /><path d="M96 84 L104 84 M46 82 L34 80 M154 82 L166 80" stroke="#8a6a2a" strokeWidth="3.5" /></g>;
    case "ski": return <g><path d="M38 78 Q100 64 162 78 Q164 112 100 114 Q36 112 38 78 Z" fill="#4fb6ff" fillOpacity=".6" stroke="#2a1c3a" strokeWidth="5" /><path d="M54 84 Q76 78 92 84" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" /></g>;
    case "monocle": return <g><circle cx="128" cy="93" r="26" fill="#fff" fillOpacity=".15" stroke="#b8862e" strokeWidth="5" /><path d="M150 108 Q160 140 146 170" stroke="#b8862e" strokeWidth="2" fill="none" /></g>;
    default: return null;
  }
}

/** Une chaussure droite (la gauche est la même, retournée). */
export function Chaussure({ t }: { t: Tenue }): ReactNode {
  const c = teinte(t.couleurs.chaussures, ""), col = (d: string) => c || d, tr = (d: string) => fonce(c || d);
  switch (t.chaussures) {
    case "ballerines": return <g><path d="M106 209 Q106 199 118 199 Q134 199 140 206 Q140 211 132 211 L110 211 Z" fill={col("#ff7fb6")} stroke={tr("#ff7fb6")} strokeWidth="2.5" /><path d="M126 200 l-6 -5 v9 Z M126 200 l6 -5 v9 Z" fill="#fff" /></g>;
    case "pluie": return <path d="M108 212 L108 186 L124 186 L124 200 Q140 200 142 206 L142 212 Z" fill={col("#f3c35a")} stroke={tr("#f3c35a")} strokeWidth="2.5" strokeLinejoin="round" />;
    case "sandales": return <g><path d="M104 210 L144 210 L144 214 L104 214 Z" fill={col("#9a6a3a")} /><path d="M110 210 Q118 196 128 210 M124 210 Q132 200 140 210" stroke={tr("#9a6a3a")} strokeWidth="3" fill="none" /></g>;
    case "pointes": return <g><path d="M108 210 Q106 198 118 198 Q134 200 146 208 Q140 212 130 212 L112 212 Z" fill={col("#ffc4e4")} stroke={tr("#ffc4e4")} strokeWidth="2.5" /><path d="M112 200 Q118 186 126 182 M118 200 Q126 188 134 186" stroke={col("#ffc4e4")} strokeWidth="2" fill="none" /></g>;
    case "talons": return <g><path d="M106 206 Q110 196 122 198 Q138 200 144 208 L144 212 L118 212 Z" fill={col("#e2453c")} stroke={tr("#e2453c")} strokeWidth="2.5" /><path d="M108 206 L108 214" stroke={tr("#e2453c")} strokeWidth="4" strokeLinecap="round" /></g>;
    case "baskets": return <g><path d="M104 212 L104 194 Q112 188 122 194 Q140 196 146 204 L146 212 Z" fill={col("#3f7fd0")} stroke={tr("#3f7fd0")} strokeWidth="2.5" strokeLinejoin="round" /><path d="M102 212 L148 212 L148 216 L102 216 Z" fill="#fff" /><path d="M112 196 l8 6 M118 194 l8 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></g>;
    case "crampons": return <g><path d="M104 210 L104 196 Q112 190 122 196 Q140 198 146 206 L146 210 Z" fill={col("#2a2438")} stroke="#0a0618" strokeWidth="2.5" /><path d="M108 210 v4 M118 210 v4 M128 210 v4 M138 210 v4" stroke="#c8cbd8" strokeWidth="3" strokeLinecap="round" /><path d="M114 200 L134 204" stroke={c || "#ff8a3d"} strokeWidth="3" /></g>;
    case "bottescowboy": return <g><path d="M108 212 L106 184 L124 184 L124 200 Q140 198 146 206 L146 212 Z" fill={col("#9a6a3a")} stroke={tr("#9a6a3a")} strokeWidth="2.5" strokeLinejoin="round" /><path d="M110 192 Q116 196 122 190" stroke="#f3d48a" strokeWidth="2" fill="none" /></g>;
    case "bottespompier": return <g><path d="M108 212 L108 184 L126 184 L126 200 Q140 200 144 206 L144 212 Z" fill={col("#2a2438")} stroke="#0a0618" strokeWidth="2.5" /><path d="M108 192 L126 192" stroke="#f3d48a" strokeWidth="4" /></g>;
    case "vernis": return <g><path d="M106 210 L106 198 Q112 194 120 198 Q136 199 140 205 Q141 211 134 211 Z" fill={col("#2a1c3a")} stroke="#120a20" strokeWidth="2" /><ellipse cx="132" cy="203" rx="4" ry="2" fill="#fff" fillOpacity=".6" /></g>;
    default: return null;
  }
}

/** L'objet tenu dans la main (côté droit). La main est dessinée par Plume. */
export function Objet({ t }: { t: Tenue }): ReactNode {
  const c = teinte(t.couleurs.objet, ""), col = (d: string) => c || d, tr = (d: string) => fonce(c || d);
  switch (t.objet) {
    case "baguette": return <g><path d="M178 150 L206 96" stroke={col("#3a2a8a")} strokeWidth="5" strokeLinecap="round" /><path d="M206 84 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1 Z" fill="#f3d48a" stroke="#b8862e" strokeWidth="1.5" /></g>;
    case "fleur": return <g><path d="M178 150 Q184 120 190 104" stroke="#4fb05a" strokeWidth="4" fill="none" /><g transform="translate(190 98)">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-8" rx="6" ry="9" fill={col("#ff7fb6")} transform={`rotate(${a})`} />)}<circle r="5" fill="#f3d48a" /></g></g>;
    case "micro": return <g><path d="M178 150 L190 112" stroke="#2a2438" strokeWidth="7" strokeLinecap="round" /><circle cx="192" cy="104" r="10" fill={col("#c8cbd8")} stroke="#6a6f88" strokeWidth="2.5" /></g>;
    case "pinceau": return <g><path d="M178 150 L200 104" stroke={col("#b87a3a")} strokeWidth="5" strokeLinecap="round" /><path d="M198 106 L210 82 L214 100 Z" fill="#e2453c" /></g>;
    case "arrosoir": return <g><rect x="168" y="126" width="34" height="26" rx="5" fill={col("#4fb05a")} stroke={tr("#4fb05a")} strokeWidth="2.5" /><path d="M202 134 L222 120" stroke={col("#4fb05a")} strokeWidth="6" strokeLinecap="round" /><path d="M176 126 Q185 110 194 126" stroke={tr("#4fb05a")} strokeWidth="3" fill="none" /></g>;
    case "batte": return <path d="M176 154 L214 70 Q218 62 224 66 Q228 72 222 80 L184 158 Z" fill={col("#c88a4a")} stroke={tr("#c88a4a")} strokeWidth="2.5" strokeLinejoin="round" />;
    case "guitare": return <g><path d="M170 150 L214 90" stroke="#6a3f1a" strokeWidth="6" strokeLinecap="round" /><ellipse cx="168" cy="158" rx="18" ry="14" fill={col("#e2453c")} stroke={tr("#e2453c")} strokeWidth="2.5" transform="rotate(-35 168 158)" /><circle cx="168" cy="158" r="4" fill="#2a1c14" /><rect x="210" y="82" width="10" height="12" rx="2" fill="#6a3f1a" transform="rotate(35 215 88)" /></g>;
    case "ballon": return <g><circle cx="190" cy="132" r="15" fill={col("#ffffff")} stroke="#2a2438" strokeWidth="2.5" /><path d="M190 122 l7 5 l-3 8 l-8 0 l-3 -8 Z" fill="#2a2438" /></g>;
    case "pelle": return <g><path d="M178 152 L204 90" stroke={col("#9a6a3a")} strokeWidth="5" strokeLinecap="round" /><path d="M196 92 L214 98 L210 74 Q206 66 200 70 Z" fill="#c8cbd8" stroke="#6a6f88" strokeWidth="2" strokeLinejoin="round" /></g>;
    case "epee": return <g><path d="M178 150 L206 80" stroke={col("#c88a4a")} strokeWidth="7" strokeLinecap="round" /><path d="M170 136 L192 146" stroke="#6a3f1a" strokeWidth="6" strokeLinecap="round" /></g>;
    case "piqure": return <g><rect x="180" y="104" width="12" height="34" rx="3" fill="#f7f5ff" fillOpacity=".85" stroke="#8a8aa8" strokeWidth="2" transform="rotate(20 186 121)" /><path d="M192 100 L198 86" stroke="#8a8aa8" strokeWidth="2" /><path d="M182 136 L178 146" stroke={col("#3f7fd0")} strokeWidth="5" strokeLinecap="round" /><rect x="183" y="114" width="7" height="12" fill={col("#3f7fd0")} fillOpacity=".7" transform="rotate(20 186 121)" /></g>;
    case "rateau": return <g><path d="M180 154 L204 74" stroke={col("#9a6a3a")} strokeWidth="5" strokeLinecap="round" /><path d="M190 72 L218 80" stroke="#6a6f88" strokeWidth="5" strokeLinecap="round" />{[192, 199, 206, 213].map((x, i) => <path key={x} d={`M${x} ${72.5 + i * 2} l-3 10`} stroke="#6a6f88" strokeWidth="3" strokeLinecap="round" />)}</g>;
    case "balai": return <g><path d="M180 70 L196 150" stroke={col("#c88a4a")} strokeWidth="5" strokeLinecap="round" /><path d="M186 146 L206 146 L214 176 L178 176 Z" fill="#e8c46a" stroke="#9a7a2a" strokeWidth="2.5" strokeLinejoin="round" /></g>;
    case "livre": return <g><path d="M168 132 L190 128 L190 158 L168 162 Z" fill="#fff8ea" stroke={tr("#3f7fd0")} strokeWidth="2.5" /><path d="M190 128 L212 132 L212 162 L190 158 Z" fill={col("#3f7fd0")} stroke={tr("#3f7fd0")} strokeWidth="2.5" /></g>;
    default: return null;
  }
}

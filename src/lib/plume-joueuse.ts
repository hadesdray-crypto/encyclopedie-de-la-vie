// Plume joueuse : elle peut prendre une place autour de la table (Mémory, Bataille, Le plus rapide).
// Sa force se règle (débutante, moyenne, championne) et elle parle selon son caractère.
import type { Joueur } from "@/lib/partie";
import { calmer, palier, parler, plumeDit, presence } from "@/lib/plume";
import { compagnonExprime, nomCompagnon, type Expression } from "@/lib/compagnons";
import { dire } from "@/lib/parole";
import { voixPossible } from "@/components/voix";

export const PLUME_JOUEUSE: Joueur = { nom: "Plume", couleur: "#8a5cf0", equipe: 1, plume: true };
/** La joueuse « Plume » prend le nom du personnage choisi (Plume, ou un personnage bonus). */
export const joueuseCompagnon = (): Joueur => ({ ...PLUME_JOUEUSE, nom: nomCompagnon() });
export const estPlume = (j: Joueur | undefined) => !!j?.plume;

export type Force = 1 | 2 | 3;
export const FORCES: { id: Force; nom: string; explique: string }[] = [
  { id: 1, nom: "Débutante", explique: "Elle oublie souvent et se trompe parfois." },
  { id: 2, nom: "Moyenne", explique: "Elle joue bien, mais pas parfaitement." },
  { id: 3, nom: "Championne", explique: "Elle retient presque tout et réfléchit vite !" },
];
const CLE = "leonie-plume-force";
export function lireForce(): Force {
  try {
    const n = Number(localStorage.getItem(CLE));
    return n === 1 || n === 2 || n === 3 ? n : 2;
  } catch {
    return 2;
  }
}
export function garderForce(f: Force) {
  try {
    localStorage.setItem(CLE, String(f));
  } catch {
    /* rien */
  }
}

// Ce que Plume dit en jouant, selon son caractère.
type Moment = "tour" | "bien" | "rate" | "gagne" | "perd";
const PHRASES: Record<string, Record<Moment, string[]>> = {
  discrete: {
    tour: ["À moi…", "Je joue, tout doucement."],
    bien: ["Oh, j'ai réussi.", "Ça marche !"],
    rate: ["Oups…", "Tant pis."],
    gagne: ["J'ai gagné… merci d'avoir joué avec moi.", "Hihi, j'ai gagné."],
    perd: ["Bravo, tu as gagné !", "Tu es très forte !"],
  },
  presente: {
    tour: ["À moi de jouer !", "C'est mon tour, regarde bien !"],
    bien: ["Youpi, bien joué moi !", "Trouvé !"],
    rate: ["Raté ! À toi de jouer !", "Oh non, je me suis trompée !"],
    gagne: ["J'ai gagné ! On refait une partie ?", "Victoire ! Tu prends ta revanche ?"],
    perd: ["Bravo, tu m'as battue !", "Tu as gagné, super partie !"],
  },
  etudiante: {
    tour: ["Réfléchissons… à moi.", "Je vais appliquer une bonne stratégie."],
    bien: ["Bonne déduction.", "Exactement ce que j'avais prévu."],
    rate: ["Hypothèse fausse. Je note.", "Erreur de ma part, j'analyse."],
    gagne: ["Partie gagnée : bonne stratégie !", "J'ai gagné. On analyse la partie ?"],
    perd: ["Bien joué, ta stratégie était meilleure !", "Tu as gagné, bravo !"],
  },
  passionnee: {
    tour: ["À MOI ! Par toutes mes plumes !", "Mon tour ! Je vais tout donner !"],
    bien: ["OUIII ! Fantastique !", "Incroyable, j'ai trouvé !"],
    rate: ["Nooon ! Mes plumes tremblent !", "Argh ! Presque !"],
    gagne: ["VICTOIRE ! Quelle partie extraordinaire !", "J'ai gagné ! C'était passionnant !"],
    perd: ["Bravo ! Tu es une championne !", "Tu m'as battue ! Quelle partie !"],
  },
};
// Quand elle rate plusieurs fois de suite : les caractères « cool » restent bons joueurs,
// les autres deviennent de plus en plus mauvais joueurs (pour rire, et toujours gentiment à la fin).
const RATE_PALIERS: Record<string, string[]> = {
  discrete: ["Oups…", "Tant pis, ce n'est qu'un jeu.", "Tu joues vraiment bien !", "Bravo à toi, moi j'apprends encore."],
  etudiante: ["Hypothèse fausse. Je note.", "Hmm… ma stratégie n'est pas la bonne.", "Je dois revoir ma méthode !", "Tu es plus forte que moi : bien joué !"],
  presente: ["Raté ! À toi de jouer !", "Oh non, encore raté !", "Pfff… ce n'est pas juste !", "Bon, d'accord… tu es trop forte ! On fait la revanche ?"],
  passionnee: ["Nooon ! Mes plumes tremblent !", "ENCORE RATÉ ?! C'est pas possible !", "Ce jeu est ensorcelé, je le savais !", "Je ne joue plus ! … Bon si, je rejoue. Mais je vais gagner !"],
};
// Quand elle réussit plusieurs fois de suite, la passionnée et la présente se vantent un peu (pour rire).
const BIEN_PALIERS: Record<string, string[]> = {
  presente: ["Trouvé !", "Encore moi !", "Hihi, je suis en forme aujourd'hui !"],
  passionnee: ["OUIII ! Fantastique !", "Et de deux ! Je suis une championne !", "Imbattable ! La plus grande chouette du monde !"],
};
const EXPR: Partial<Record<Moment, Expression>> = { tour: "tour", bien: "trouve", rate: "rate" };
export function plumeJoueuseDit(m: Moment) {
  const car = presence();
  const p = PHRASES[car] ?? PHRASES.presente;
  let l = p[m];
  let texte = l[Math.floor(Math.random() * l.length)];
  if (m === "rate") {
    calmer("partie-bien");
    const r = RATE_PALIERS[car] ?? RATE_PALIERS.presente;
    texte = r[Math.min(r.length - 1, palier("partie-rate", 10 * 60000))];
  } else if (m === "bien") {
    calmer("partie-rate");
    const b = BIEN_PALIERS[car];
    const n = palier("partie-bien", 10 * 60000);
    if (b) texte = b[Math.min(b.length - 1, n)];
  }
  const e = EXPR[m];
  if (e) return parler(e, texte, 2800);
  plumeDit(texte, 2800);
}

// Avant de jouer, Plume remercie toujours la princesse Leonie (c'est grâce à elle qu'on peut jouer)
// et le Concepteur. Ses mots gentils parlent pour elle.
let enJeu = false;
export const plumeEnJeu = () => enJeu;
export function plumeOuvrePartie(joueurs: Joueur[]) {
  enJeu = joueurs.some((j) => j.plume);
  calmer("partie-rate");
  calmer("partie-bien");
  if (!enJeu) return;
  const leonieJoue = joueurs.some((j) => !j.plume && j.nom.trim().toLocaleLowerCase("fr").startsWith("l") && j.nom.trim().toLocaleLowerCase("fr").replace("é", "e").startsWith("leonie"));
  const phrases = leonieJoue
    ? [
        "Quelle joie de jouer avec toi, princesse Leonie ! Et merci au Concepteur, qui a fabriqué ce jeu pour nous.",
        "Princesse Leonie, c'est toujours un bonheur de jouer avec toi. Merci au Concepteur pour ce beau jeu !",
      ]
    : [
        "Merci à la princesse Leonie : grâce à elle, on peut jouer à ce jeu ! Et merci au Concepteur, qui l'a fabriqué.",
        "Avant de commencer, un grand merci à la princesse Leonie, sans qui ce jeu n'existerait pas, et au Concepteur qui l'a construit !",
      ];
  const t = phrases[Math.floor(Math.random() * phrases.length)];
  const perso = compagnonExprime("debut");
  plumeDit(perso ?? t, 6000);
  // Si le personnage bonus a son propre enregistrement, on n'ajoute pas la voix de synthèse.
  if (!perso && voixPossible()) dire(t);
}

// De temps en temps, à la fin d'une partie, un petit mot gentil.
const GENTILS = [
  "La princesse Leonie serait fière de cette partie !",
  "Le Concepteur a bien fait les choses : quel beau jeu !",
  "Je garde ce souvenir pour la princesse Leonie.",
  "Merci au Concepteur pour ces moments ensemble !",
];
export function plumeMotGentil() {
  if (Math.random() < 0.5) window.setTimeout(() => plumeDit(GENTILS[Math.floor(Math.random() * GENTILS.length)], 4000), 3000);
}

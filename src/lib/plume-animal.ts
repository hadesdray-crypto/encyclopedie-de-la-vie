// Ce que Plume peut raconter sur un animal précis : pourquoi sa carte est rare, et ses particularités.
// Tout vient des vraies données du catalogue (nombre de pays, statut UICN, poids, petits, âge record…).
// Si une donnée manque, Plume n'en parle pas : elle n'invente jamais.
import type { Espece } from "@/data/catalogue";
import { REGIMES } from "@/data/fiches-vie";
import { rareteDe } from "@/lib/paquets";
import { STATUTS, habitatsDe } from "@/data/pictos";

function nbPays(e: Espece) {
  return e.pays?.length || Number(e.ou.match(/(\d+)\s+pays/)?.[1] ?? 0);
}

/** Pourquoi la carte de cet animal est rare (ou commune), dit par Plume. */
export function plumeRarete(e: Espece, special?: string | null, chance?: boolean): string[] {
  const l: string[] = [];
  if (chance) l.push("Waouh, une carte chance ! Elle sort très rarement d'un paquet. Garde-la bien !");
  if (special === "Le plus fort") l.push(`${e.nom} fait partie des 12 mammifères les plus lourds que l'on connaisse. C'est pour ça que sa carte est spéciale !`);
  if (special === "Le plus petit") l.push(`${e.nom} fait partie des 12 mammifères les plus légers que l'on connaisse. Tout petit, mais sa carte est spéciale !`);
  const pays = nbPays(e);
  const r = rareteDe(e);
  if (!pays || !r) l.push("On ne sait pas encore bien dans quels pays il vit : c'est pour ça qu'on ne peut pas dire si sa carte est rare.");
  else if (r === "Très peu répandu") l.push(pays === 1 ? "Celle-là est légendaire ! Tu vois, il ne vit que dans un seul pays au monde." : `Celle-là est légendaire ! Tu vois, il ne vit que dans ${pays} pays au monde. C'est très peu !`);
  else if (r === "Peu répandu") l.push(`Une carte super rare ! Il ne vit que dans ${pays} pays.`);
  else if (r === "Assez peu répandu") l.push(`Une carte rare : il ne vit que dans ${pays} pays.`);
  else if (r === "Pas très répandu") l.push(`Il vit dans ${pays} pays : ni partout, ni très peu. Sa carte est « Jolie ».`);
  else l.push(`Lui, on le trouve dans beaucoup de pays (${pays}). C'est pour ça que sa carte est commune. Mais commune ne veut pas dire pas intéressante !`);
  if (e.statut === "En danger" || e.statut === "En danger critique") l.push("Et en plus, il est en danger dans la nature : chaque carte de lui est précieuse.");
  return l;
}

/** Les particularités de l'animal, une phrase par info connue. */
export function plumeParticularites(e: Espece): string[] {
  const l: string[] = [];
  if (e.disparue) l.push(`${e.nom} a disparu : on le connaît grâce aux scientifiques qui l'ont décrit.`);
  if (e.domestique) l.push("C'est un animal domestique : il vit avec les humains.");
  const h = habitatsDe(e);
  if (h.principal.id !== "inconnu") l.push(`Il vit surtout ${h.principal.phrase}${h.autres.length ? `, et aussi ${h.autres.map((x) => x.phrase).join(" et ")}` : ""}.${h.principal.id === "vol" ? " C'est une chauve-souris !" : ""}`);
  const regime = e.regime ? REGIMES[e.regime as keyof typeof REGIMES] : undefined;
  if (regime) l.push(`C'est un ${regime.nom.toLowerCase()} : ${regime.explique.charAt(0).toLowerCase()}${regime.explique.slice(1)}`);
  if (e.masse) l.push(`Un adulte pèse ${e.masse}.`);
  if (e.portee) {
    const n = e.portee.replace(/^en moyenne /, "");
    l.push(n === "1" ? "La maman a en général un seul bébé à la fois." : `La maman a en moyenne ${n.replace(".", ",")} bébés à la fois.`);
  }
  if (e.gestation) l.push(`Le bébé grandit dans le ventre de sa maman pendant ${e.gestation}.`);
  if (e.longevite) l.push(`Le record d'âge connu : ${e.longevite.replace(/^record connu : /, "")}.`);
  if (STATUTS[e.statut ?? ""]?.phrase) l.push(STATUTS[e.statut!].phrase);
  return l;
}

/** Tout ce que Plume peut dire sur une carte : d'abord pourquoi elle est rare, puis les particularités. */
export function plumeCarte(e: Espece, special?: string | null, chance?: boolean): string[] {
  return [...plumeRarete(e, special, chance), ...plumeParticularites(e)];
}

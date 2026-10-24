// Comparer un poids publié avec des choses connues. Le calcul part de la masse
// publiée ; les objets de référence ont des poids connus (environ).
const REPERES = [
  { g: 7.5, un: "une pièce de 1 euro", des: "pièces de 1 euro", note: "7,5 g" },
  { g: 1000, un: "une bouteille d'eau de 1 litre", des: "bouteilles d'eau de 1 litre", note: "environ 1 kg" },
  { g: 4000, un: "un chat domestique", des: "chats domestiques", note: "environ 4 kg" },
  { g: 25000, un: "un enfant de 8 ans", des: "enfants de 8 ans", note: "environ 25 kg" },
  { g: 1000000, un: "une petite voiture", des: "petites voitures", note: "environ 1 tonne" },
];

export function grammesDe(masse?: string) {
  if (!masse) return null;
  const m = masse.match(/([\d]+(?:,\d+)?)\s*(kg|g)\b/);
  if (!m) return null;
  const v = Number(m[1].replace(",", "."));
  return m[2] === "kg" ? v * 1000 : v;
}

export function comparerPoids(masse?: string) {
  const g = grammesDe(masse);
  if (!g) return null;
  if (g < 7.5 * 0.75) return `Moins lourd qu'${REPERES[0].un} (${REPERES[0].note}) !`;
  // On garde le repère qui donne un nombre entre 1 et 20.
  let repere = REPERES[0];
  for (const r of REPERES) if (g >= r.g * 0.75) repere = r;
  const n = g / repere.g;
  if (n < 1.5) return `À peu près le poids d'${repere.un} (${repere.note}).`;
  const arrondi = n < 10 ? Math.round(n) : Math.round(n / 5) * 5;
  return `À peu près le poids de ${arrondi} ${repere.des} (${repere.note} chacun${repere.des.startsWith("bouteilles") || repere.des.startsWith("pièces") || repere.des.startsWith("petites") ? "e" : ""}).`;
}

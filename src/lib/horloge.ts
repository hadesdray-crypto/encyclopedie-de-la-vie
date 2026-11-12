// L'heure de l'application. Pour tester, un développeur peut décaler l'heure dans le Coin des parents (mode développeur) :
// « comme si on était tel jour, à telle heure ». Les jours, les défis, les paquets et l'histoire de Plume suivent cette heure.
const CLE = "leonie-dev-decalage";
export function decalageMs(): number {
  try {
    return Number(localStorage.getItem(CLE) ?? 0) || 0;
  } catch {
    return 0;
  }
}
export function maintenant(): Date {
  return new Date(Date.now() + decalageMs());
}
export function definirDecalage(ms: number) {
  try {
    if (ms) localStorage.setItem(CLE, String(Math.round(ms)));
    else localStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
}
/** Fait comme s'il était cette date et cette heure (format « 2026-11-13 » et « 08:30 »). */
export function faireCommeSi(date: string, heure: string) {
  const voulu = new Date(`${date}T${heure || "00:00"}:00`).getTime();
  if (!Number.isNaN(voulu)) definirDecalage(voulu - Date.now());
}
export const heureTestActive = () => decalageMs() !== 0;

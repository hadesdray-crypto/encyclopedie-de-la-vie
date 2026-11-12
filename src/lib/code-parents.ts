// Le code du Coin des parents : 4 chiffres choisis par un adulte, gardés sur l'appareil (jamais en clair).
// Une fois le code donné, le coin reste ouvert 10 minutes, puis se referme tout seul.
const CLE = "leonie-code-parents";
const CLE_OUVERT = "leonie-parents-ouvert-jusqua";
const SEL = "leonie-encyclopedie-2026";

async function empreinte(code: string): Promise<string> {
  try {
    const donnees = new TextEncoder().encode(SEL + code);
    const h = await crypto.subtle.digest("SHA-256", donnees);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 5381;
    for (const c of SEL + code) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return `s${h}`;
  }
}
export const codeDefini = () => {
  try { return !!localStorage.getItem(CLE); } catch { return false; }
};
export async function definirCode(code: string) {
  try { localStorage.setItem(CLE, await empreinte(code)); } catch { /* rien */ }
  ouvrirPourUnTemps();
}
export async function verifierCode(code: string) {
  try {
    if ((await empreinte(code)) === localStorage.getItem(CLE)) { ouvrirPourUnTemps(); return true; }
  } catch { /* rien */ }
  return false;
}
export function effacerCode() {
  try { localStorage.removeItem(CLE); } catch { /* rien */ }
  ouvrirPourUnTemps();
}
function ouvrirPourUnTemps() {
  try { sessionStorage.setItem(CLE_OUVERT, String(Date.now() + 10 * 60 * 1000)); } catch { /* rien */ }
}
export function fermerCoin() {
  try { sessionStorage.removeItem(CLE_OUVERT); } catch { /* rien */ }
}
export const coinOuvert = () => {
  try { return Number(sessionStorage.getItem(CLE_OUVERT) ?? 0) > Date.now(); } catch { return false; }
};

/** Le code du mode développeur (6 chiffres), comparé sans être écrit en clair. */
export async function verifierCodeDev(code: string) {
  return (await empreinte("dev:" + code)) === (await empreinte("dev:" + "666666"));
}

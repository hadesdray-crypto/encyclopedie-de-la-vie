// Petits bruitages fabriqués par le navigateur (Web Audio) : aucun fichier, marche sans Internet.
// Ce ne sont pas des cris d'animaux : les cris restent de vrais enregistrements, ou « NC ».
const CLE = "leonie-sons";
let ctx: AudioContext | null = null;

export function sonsActifs() {
  try {
    return localStorage.getItem(CLE) !== "non";
  } catch {
    return true;
  }
}

export function activerSons(oui: boolean) {
  try {
    localStorage.setItem(CLE, oui ? "oui" : "non");
  } catch {
    /* rien */
  }
}

function audio() {
  if (!sonsActifs()) return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(f: number, debut: number, duree: number, type: OscillatorType = "sine", volume = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + debut;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + duree + 0.05);
}

function souffle(debut: number, duree: number, de: number, vers: number, volume = 0.25) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + debut;
  const n = Math.floor(a.sampleRate * duree);
  const tampon = a.createBuffer(1, n, a.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = tampon;
  const filtre = a.createBiquadFilter();
  filtre.type = "bandpass";
  filtre.Q.value = 1.2;
  filtre.frequency.setValueAtTime(de, t);
  filtre.frequency.exponentialRampToValueAtTime(vers, t + duree);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + duree * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(filtre).connect(g).connect(a.destination);
  src.start(t);
}

export const sons = {
  trembler() {
    for (let i = 0; i < 6; i++) note(90 + i * 6, i * 0.09, 0.08, "triangle", 0.12);
  },
  dechirer() {
    souffle(0, 0.45, 600, 4000, 0.35);
  },
  retourner() {
    souffle(0, 0.18, 1500, 500, 0.18);
  },
  brillant() {
    [880, 1109, 1319, 1760].forEach((f, i) => note(f, i * 0.07, 0.35, "sine", 0.12));
  },
  fanfare() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(f, i * 0.12, i === 5 ? 0.7 : 0.2, "triangle", 0.16));
  },
  bonne() {
    note(660, 0, 0.15, "sine");
    note(990, 0.12, 0.3, "sine");
  },
  mauvaise() {
    note(300, 0, 0.18, "triangle", 0.12);
    note(220, 0.15, 0.3, "triangle", 0.12);
  },
  clic() {
    note(1200, 0, 0.05, "square", 0.04);
  },
  victoire() {
    [523, 587, 659, 784, 880, 1047].forEach((f, i) => note(f, i * 0.09, 0.3, "triangle", 0.15));
    [1047, 1319, 1568].forEach((f) => note(f, 0.6, 0.9, "sine", 0.08));
  },
};

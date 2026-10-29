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

/** Le haut-parleur du téléphone, même si les petits bruitages sont coupés (la voix d'un personnage doit toujours pouvoir passer). */
export function contexteAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
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

/** Une note qui glisse d'une hauteur à une autre (boing, sifflet…). */
function glisse(de: number, vers: number, debut: number, duree: number, type: OscillatorType = "sine", volume = 0.15) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + debut;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(de, t);
  o.frequency.exponentialRampToValueAtTime(vers, t + duree);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + duree + 0.05);
}

export const sons = {
  /** Bruitages de dessin animé, pour le braconnier. */
  boing() {
    glisse(140, 520, 0, 0.12, "sine", 0.18);
    glisse(520, 180, 0.12, 0.28, "sine", 0.14);
  },
  bonk() {
    note(180, 0, 0.12, "square", 0.08);
    souffle(0, 0.08, 1400, 600, 0.25);
  },
  pan() {
    souffle(0, 0.35, 2600, 200, 0.5);
    note(60, 0, 0.3, "triangle", 0.25);
  },
  bing() {
    glisse(2400, 3400, 0, 0.35, "triangle", 0.12);
    note(4200, 0.02, 0.25, "sine", 0.05);
  },
  sifflet() {
    glisse(1800, 500, 0, 0.7, "sine", 0.08);
  },
  zoom() {
    souffle(0, 0.35, 600, 4000, 0.16);
  },
  bipbip() {
    note(1050, 0, 0.09, "square", 0.05);
    note(1050, 0.16, 0.09, "square", 0.05);
  },
  pas() {
    souffle(0, 0.05, 400, 250, 0.08);
  },
  /** Le petit « Hou ! » de Plume quand elle a peur : deux notes douces qui descendent. */
  hou() {
    note(700, 0, 0.14, "sine", 0.1);
    note(520, 0.16, 0.3, "sine", 0.1);
  },
  trembler() {
    for (let i = 0; i < 6; i++) note(90 + i * 6, i * 0.09, 0.08, "triangle", 0.12);
  },
  /** Un vrai bruit de papier qu'on déchire : une série de petits craquements qui s'accélèrent, puis un grand « fffrrt ». */
  dechirer() {
    let t = 0;
    for (let i = 0; i < 22; i++) {
      souffle(t, 0.045, 2400 + Math.random() * 3200, 1400 + Math.random() * 900, 0.2 + Math.random() * 0.12);
      t += 0.034 - i * 0.0006 + Math.random() * 0.012;
    }
    souffle(0, 0.7, 900, 5200, 0.22);
    note(70, 0, 0.25, "triangle", 0.12);
  },
  /** Un petit craquement, pendant qu'on tire sur la bande. */
  crac() {
    souffle(0, 0.05, 2800 + Math.random() * 1500, 1600, 0.22);
    souffle(0.03, 0.04, 3600, 1800, 0.14);
  },
  /** Un « pop » brillant quand une carte spéciale apparaît. */
  eclater() {
    [660, 990, 1320, 1980].forEach((f, i) => note(f, i * 0.045, 0.22, "sine", 0.1));
    souffle(0, 0.25, 6000, 1500, 0.15);
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

// Sur le téléphone, le haut-parleur ne s'allume que si on l'a réveillé avec un vrai toucher.
// On le réveille donc dès le premier toucher n'importe où : ensuite, Plume et les personnages bonus peuvent parler.
if (typeof document !== "undefined") {
  const reveiller = () => {
    const c = contexteAudio();
    if (!c) return;
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {
      /* rien */
    }
  };
  for (const nom of ["pointerdown", "touchend", "click"]) document.addEventListener(nom, reveiller, { passive: true });
}

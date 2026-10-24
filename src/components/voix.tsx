import { useEffect, useState } from "react";
import { LuVolume2 as Volume2, LuVolumeX as VolumeX } from "react-icons/lu";

function voixFrancaise() {
  return window.speechSynthesis
    .getVoices()
    .find((item) => item.lang.toLowerCase().startsWith("fr"));
}

function attendreVoix() {
  const deja = voixFrancaise();
  if (deja || window.speechSynthesis.getVoices().length > 0) return Promise.resolve(deja);
  return new Promise<SpeechSynthesisVoice | undefined>((resolve) => {
    const fin = () => {
      window.clearTimeout(delai);
      window.speechSynthesis.removeEventListener("voiceschanged", fin);
      resolve(voixFrancaise());
    };
    const delai = window.setTimeout(fin, 500);
    window.speechSynthesis.addEventListener("voiceschanged", fin);
    window.speechSynthesis.getVoices();
  });
}

// Dans l'application Android, la voix passe par le moteur de lecture du téléphone
// (plugin Capacitor), qui marche sans Internet. Dans un navigateur : speechSynthesis.
type TTS = { speak: (o: { text: string; lang: string; rate: number }) => Promise<void>; stop: () => Promise<void> };
function voixNative(): TTS | undefined {
  return (window as unknown as { Capacitor?: { Plugins?: { TextToSpeech?: TTS } } }).Capacitor?.Plugins?.TextToSpeech;
}

export function voixPossible() {
  return typeof window !== "undefined" && (!!voixNative() || "speechSynthesis" in window);
}

export async function lire(texte: string, onFin: () => void) {
  const native = voixNative();
  if (native) {
    try {
      await native.stop();
      await native.speak({ text: texte, lang: "fr-FR", rate: 0.95 });
    } catch {
      /* pas de voix française installée */
    }
    onFin();
    return;
  }
  if (!("speechSynthesis" in window)) {
    onFin();
    return;
  }
  window.speechSynthesis.cancel();
  const voix = await attendreVoix();
  const morceaux = texte
    .split(/(?<=[.!?])\s+/)
    .map((morceau) => morceau.trim())
    .filter(Boolean);
  if (morceaux.length === 0) {
    onFin();
    return;
  }
  let index = 0;
  const suite = () => {
    if (index >= morceaux.length) {
      onFin();
      return;
    }
    const phrase = new SpeechSynthesisUtterance(morceaux[index]);
    index += 1;
    phrase.lang = "fr-FR";
    phrase.rate = 0.95;
    if (voix) phrase.voice = voix;
    phrase.onend = suite;
    phrase.onerror = () => onFin();
    window.speechSynthesis.speak(phrase);
  };
  window.speechSynthesis.resume();
  suite();
}

export function stopper() {
  voixNative()?.stop().catch(() => {});
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function Ecouter({ texte, gros = false }: { texte: string; gros?: boolean }) {
  const [enCours, setEnCours] = useState(false);

  const possible = voixPossible();
  useEffect(() => {
    if (!possible) return;
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => stopper();
  }, [possible]);
  if (!possible) return null;

  function basculer() {
    if (enCours) {
      stopper();
      setEnCours(false);
      return;
    }
    lire(texte, () => setEnCours(false));
    setEnCours(true);
  }

  const Icone = enCours ? VolumeX : Volume2;
  return (
    <button
      type="button"
      onClick={basculer}
      className={
        gros
          ? "inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 text-base font-extrabold text-white"
          : "inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-sm font-extrabold text-teal ring-1 ring-line"
      }
    >
      <Icone className="size-4" aria-hidden="true" />
      {enCours ? "Stop" : "Écouter"}
    </button>
  );
}

import { useEffect, useState } from "react";
import { LuVolume2 as Volume2, LuVolumeX as VolumeX } from "react-icons/lu";
import { tauxVoix } from "@/lib/reglages";
import { appeler, moduleDisponible } from "@/lib/natif";

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
// (module TextToSpeech), qui marche sans Internet. Dans un navigateur : speechSynthesis.
const TTS = "TextToSpeech";
type TTSNatif = { speak: (o: { text: string; lang: string; rate: number }) => Promise<void>; stop: () => Promise<void> };
function voixNative(): TTSNatif | undefined {
  if (!moduleDisponible(TTS)) return undefined;
  return {
    speak: (o) => appeler<void>(TTS, "speak", { ...o, pitch: 1.1, volume: 1, category: "playback" }),
    stop: () => appeler<void>(TTS, "stop"),
  };
}

export function voixPossible() {
  return typeof window !== "undefined" && (!!voixNative() || "speechSynthesis" in window);
}

// Chaque lecture a un numéro : quand on arrête ou qu'on relance, l'ancienne lecture se tait pour de bon.
let jeton = 0;

export async function lire(texte: string, onFin: () => void) {
  const moi = ++jeton;
  const fini = () => {
    if (moi === jeton) onFin();
  };
  const native = voixNative();
  if (native) {
    try {
      await native.stop();
      if (moi !== jeton) return;
      await native.speak({ text: texte, lang: "fr-FR", rate: tauxVoix() });
    } catch {
      /* pas de voix française installée */
    }
    fini();
    return;
  }
  if (!("speechSynthesis" in window)) {
    fini();
    return;
  }
  window.speechSynthesis.cancel();
  const voix = await attendreVoix();
  const morceaux = texte
    .split(/(?<=[.!?])\s+/)
    .map((morceau) => morceau.trim())
    .filter(Boolean);
  if (morceaux.length === 0 || moi !== jeton) {
    fini();
    return;
  }
  let index = 0;
  const suite = () => {
    if (moi !== jeton) return;
    if (index >= morceaux.length) {
      fini();
      return;
    }
    const phrase = new SpeechSynthesisUtterance(morceaux[index]);
    index += 1;
    phrase.lang = "fr-FR";
    phrase.rate = tauxVoix();
    if (voix) phrase.voice = voix;
    phrase.onend = suite;
    phrase.onerror = () => fini();
    window.speechSynthesis.speak(phrase);
  };
  window.speechSynthesis.resume();
  suite();
}

export function stopper() {
  jeton++;
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

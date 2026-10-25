import { useEffect, useState } from "react";
import { LuVolume2 as Volume2, LuVolumeX as VolumeX } from "react-icons/lu";
import { tauxVoix } from "@/lib/reglages";
import { appeler, moduleDisponible } from "@/lib/natif";
import { dire, taire, useParle } from "@/lib/parole";
import { debutLecture, presence } from "@/lib/plume";

// Chaque caractère de Plume a sa voix : hauteur (pitch) et vitesse, multipliées par la vitesse choisie dans les Options.
const VOIX: Record<string, { hauteur: number; vitesse: number }> = {
  // Des écarts doux : chaque voix reste très claire et bien audible.
  discrete: { hauteur: 0.97, vitesse: 0.93 }, // douce et calme
  presente: { hauteur: 1.1, vitesse: 1 }, // claire et gaie
  etudiante: { hauteur: 1.02, vitesse: 0.95 }, // posée, comme une maîtresse
  passionnee: { hauteur: 1.2, vitesse: 1.07 }, // plus aiguë et un peu pressée
  repos: { hauteur: 1.05, vitesse: 1 },
};
// Pendant la présentation, une voix normale et une vitesse normale, quel que soit le caractère choisi.
let voixNormale = false;
export function voixDePresentation(oui: boolean) {
  voixNormale = oui;
}
const voixDePlume = () => (voixNormale ? { hauteur: 1.02, vitesse: 1.05 } : VOIX[presence()] ?? VOIX.presente);

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
type TTSNatif = { speak: (o: { text: string; lang: string; rate: number; pitch: number }) => Promise<void>; stop: () => Promise<void> };
function voixNative(): TTSNatif | undefined {
  if (!moduleDisponible(TTS)) return undefined;
  return {
    speak: (o) => appeler<void>(TTS, "speak", { ...o, volume: 1, category: "playback" }),
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
      await native.speak({ text: texte, lang: "fr-FR", rate: tauxVoix() * voixDePlume().vitesse, pitch: voixDePlume().hauteur });
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
    phrase.rate = tauxVoix() * voixDePlume().vitesse;
    phrase.pitch = voixDePlume().hauteur;
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
  // La même voix que Plume : quand ce bouton lit, Plume s'anime (c'est elle qui parle).
  const [moi, setMoi] = useState(false);
  const parle = useParle();
  const enCours = moi && parle;

  const possible = voixPossible();
  useEffect(() => {
    if (!possible) return;
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, [possible]);
  useEffect(() => () => {
    if (moi) taire();
  }, [moi]);
  if (!possible) return null;

  function basculer() {
    if (enCours) {
      taire();
      setMoi(false);
      return;
    }
    setMoi(true);
    dire(debutLecture() + texte, () => setMoi(false));
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

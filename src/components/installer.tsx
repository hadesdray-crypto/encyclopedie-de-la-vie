import { useEffect, useState } from "react";
import { EST_APK, LIEN_APK } from "@/lib/maj-apk";

type Invite = Event & { prompt: () => Promise<void> };
const CLE = "leonie-installer-masque";

function plateforme() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "autre";
}

function dejaInstallee() {
  return EST_APK || window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/**
 * Bouton « Installer l'application », affiché seulement quand on ouvre l'encyclopédie
 * depuis son lien Internet. Une fois installée, tout est sur le téléphone :
 * seules les mises à jour et le suivi GPS ont besoin d'Internet.
 */
export function Installer() {
  const [masque, setMasque] = useState(() => {
    try {
      return localStorage.getItem(CLE) === "oui";
    } catch {
      return false;
    }
  });
  const [invite, setInvite] = useState<Invite | null>(null);
  const [aide, setAide] = useState(false);
  useEffect(() => {
    const garder = (e: Event) => {
      e.preventDefault();
      setInvite(e as Invite);
    };
    window.addEventListener("beforeinstallprompt", garder);
    return () => window.removeEventListener("beforeinstallprompt", garder);
  }, []);
  if (dejaInstallee() || masque) return null;
  const p = plateforme();

  function cacher() {
    try {
      localStorage.setItem(CLE, "oui");
    } catch {
      /* rien */
    }
    setMasque(true);
  }

  return (
    <section className="carte-nuit mx-auto mt-3 max-w-md rounded-2xl px-3 py-2">
      <div className="flex items-center gap-2">
        {p === "android" ? (
          <a href={LIEN_APK} onClick={() => setAide(true)} className="bouton-bois flex-1 rounded-xl px-3 py-2.5 text-center font-extrabold">
            Installer l'application · 82 Mo
          </a>
        ) : p === "autre" && invite ? (
          <button type="button" onClick={() => invite.prompt()} className="bouton-bois flex-1 rounded-xl px-3 py-2.5 font-extrabold">
            Installer l'application
          </button>
        ) : (
          <button type="button" onClick={() => setAide((a) => !a)} className="bouton-bois flex-1 rounded-xl px-3 py-2.5 font-extrabold">
            Installer l'application
          </button>
        )}
        <button type="button" onClick={cacher} aria-label="Ne plus afficher" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#2a1844] text-lg font-extrabold">
          ×
        </button>
      </div>
      {aide ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-left text-sm">
          {p === "android" ? (
            <>
              <li>Attends la fin du téléchargement, puis ouvre le fichier.</li>
              <li>Si le téléphone bloque : « Paramètres », active « Autoriser depuis cette source », puis reviens.</li>
              <li>Touche « Installer » (et « Installer quand même » si Play Protect le demande).</li>
            </>
          ) : p === "ios" ? (
            <>
              <li>Dans Safari, touche Partager (le carré avec une flèche).</li>
              <li>Choisis « Sur l'écran d'accueil », puis « Ajouter ».</li>
              <li>Ouvre l'encyclopédie depuis sa nouvelle icône, avec Internet, quelques minutes : elle enregistre les photos.</li>
            </>
          ) : (
            <li>Ouvre ce lien sur un téléphone Android pour installer l'application complète.</li>
          )}
        </ol>
      ) : (
        <p className="mt-1 text-center text-xs">Tout est rangé dans le téléphone : ensuite, plus besoin d'Internet.</p>
      )}
    </section>
  );
}

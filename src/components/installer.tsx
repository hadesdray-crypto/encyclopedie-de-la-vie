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
    <section className="carte-nuit mx-auto mt-3 max-w-md rounded-3xl px-4 py-4 text-center">
      <p className="font-display text-xl text-[#f3d48a]">Installer l'encyclopédie</p>
      <p className="mt-1 text-sm">
        Tout s'installe sur le téléphone : les photos, les fiches, les jeux et les cartes. Ensuite, elle marche sans Internet.
      </p>
      {p === "android" ? (
        <>
          <a href={LIEN_APK} onClick={() => setAide(true)} className="bouton-bois mt-3 block rounded-2xl py-4 font-display text-xl">
            Installer l'application (82 Mo)
          </a>
          {aide ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-left text-sm">
              <li>Attends la fin du téléchargement, puis ouvre le fichier.</li>
              <li>Si le téléphone bloque l'installation : « Paramètres », active « Autoriser depuis cette source », puis reviens.</li>
              <li>Touche « Installer » (et « Installer quand même » si Play Protect le demande).</li>
              <li>L'icône « Encyclopédie de la vie » apparaît avec les autres applications.</li>
            </ol>
          ) : (
            <p className="mt-2 text-xs">Mieux vaut être en Wi-Fi.</p>
          )}
        </>
      ) : p === "ios" ? (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-left text-sm">
          <li>Dans Safari, touche le bouton Partager (le carré avec une flèche).</li>
          <li>Choisis « Sur l'écran d'accueil », puis « Ajouter ».</li>
          <li>Ouvre l'encyclopédie depuis sa nouvelle icône, avec Internet, et laisse-la ouverte quelques minutes : elle enregistre les photos.</li>
        </ol>
      ) : invite ? (
        <button type="button" onClick={() => invite.prompt()} className="bouton-bois mt-3 block w-full rounded-2xl py-4 font-display text-xl">
          Installer l'application
        </button>
      ) : (
        <p className="mt-3 text-sm">Sur un téléphone Android, ouvre ce lien pour avoir le bouton d'installation.</p>
      )}
      <button type="button" onClick={cacher} className="mt-3 text-sm underline">
        Ne plus afficher
      </button>
    </section>
  );
}

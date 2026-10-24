import { useState } from "react";
import { accepterMiseAJour, useHorsLigne } from "@/lib/hors-ligne";
import { EST_APK, telechargerApk, useMajApk } from "@/lib/maj-apk";
import { useNouveautes } from "@/lib/nouveautes";

/** Bandeau « Mise à jour disponible ». Rien ne change tant qu'on n'a pas dit oui. */
export function MiseAJour() {
  const { majDisponible } = useHorsLigne();
  const apk = useMajApk();
  const [plusTard, setPlusTard] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const visible = EST_APK ? apk.nouvelle !== null : majDisponible;
  const nouveautes = useNouveautes(visible);
  if (!visible || plusTard) return null;
  const derniere = nouveautes?.[0];
  return (
    <div
      role="dialog"
      aria-label="Mise à jour disponible"
      className="arrivee fixed inset-x-0 z-50 mx-auto w-[min(92%,30rem)] rounded-3xl border-2 border-[#e8c98a] bg-[#24123f] px-4 py-3 shadow-[0_0_30px_rgba(160,110,255,.6)]"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
    >
      <p className="font-display text-xl text-[#f3d48a]">Mise à jour disponible</p>
      {EST_APK ? (
        <p className="mt-1 text-sm">
          La version 1.{apk.nouvelle} est prête. Touche « Télécharger », puis ouvre le fichier et touche « Mettre à jour ». Les cartes et les points sont gardés.
        </p>
      ) : (
        <p className="mt-1 text-sm">Une nouvelle version de l'encyclopédie est prête. Les cartes et les points sont gardés.</p>
      )}
      {derniere ? (
        <div className="mt-2 rounded-2xl bg-[#2f1a55] px-3 py-2">
          <p className="text-sm font-extrabold text-[#f3d48a]">Ce qui change : {derniere.titre}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {derniere.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={enCours}
          onClick={() => {
            setEnCours(true);
            if (EST_APK) telechargerApk();
            else accepterMiseAJour();
          }}
          className="bouton-bois rounded-2xl py-3 font-extrabold"
        >
          {enCours ? "Un instant…" : EST_APK ? "Télécharger" : "Mettre à jour"}
        </button>
        <button type="button" onClick={() => setPlusTard(true)} className="rounded-2xl bg-card py-3 font-extrabold">
          Plus tard
        </button>
      </div>
    </div>
  );
}

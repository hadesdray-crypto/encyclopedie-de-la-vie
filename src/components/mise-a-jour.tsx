import { useEffect, useState } from "react";
import { CLE_MAJ_WEB, accepterMiseAJour, useHorsLigne } from "@/lib/hors-ligne";
import { EST_APK, fermerMaj, lancerMajApk, redemarrerApk, useMajApk } from "@/lib/maj-apk";
import { useNouveautes } from "@/lib/nouveautes";
import { sons } from "@/lib/sons";
import { PlumeDessin } from "@/components/plume-dessin";

/**
 * La mise à jour, en étapes très simples, sans jamais quitter l'application :
 * « Nouvelle mise à jour » → Mettre à jour → barre de chargement → Redémarrer → « Mise à jour terminée ! »
 */
export function MiseAJour() {
  const web = useHorsLigne();
  const apk = useMajApk();
  const [plusTard, setPlusTard] = useState(false);
  const [webPhase, setWebPhase] = useState<"rien" | "pret" | "termine">("rien");

  // Après le redémarrage de la version Internet : « Mise à jour terminée ! ».
  useEffect(() => {
    try {
      if (!EST_APK && localStorage.getItem(CLE_MAJ_WEB) === "oui") {
        localStorage.removeItem(CLE_MAJ_WEB);
        setWebPhase("termine");
      }
    } catch {
      /* rien */
    }
  }, []);

  const phase = EST_APK ? apk.phase : webPhase === "rien" && web.majDisponible ? "propose" : webPhase;
  const nouveautes = useNouveautes(phase === "propose" || phase === "termine");
  const derniere = nouveautes?.[0];

  useEffect(() => {
    if (phase === "termine") sons.victoire();
  }, [phase]);

  if (phase === "rien" || (phase === "propose" && plusTard)) return null;

  if (phase === "propose") {
    return (
      <div role="dialog" aria-label="Nouvelle mise à jour" className="arrivee fixed inset-x-0 z-50 mx-auto w-[min(92%,30rem)] rounded-3xl border-2 border-[#e8c98a] bg-[#24123f] px-4 py-3 shadow-[0_0_30px_rgba(160,110,255,.6)]" style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <div className="flex items-center gap-3">
          <img src="theme/plume.svg" alt="" className="size-12 shrink-0" />
          <p className="font-display text-xl text-[#f3d48a]">Nouvelle mise à jour !</p>
        </div>
        {derniere ? (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
            {derniere.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm">Il y a des nouveautés dans l'encyclopédie.</p>
        )}
        <p className="mt-2 text-xs">Tes cartes, tes points et tes médailles sont gardés.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (EST_APK) lancerMajApk();
              else setWebPhase("pret");
            }}
            className="bouton-bois rounded-2xl py-3 font-display text-lg"
          >
            Mettre à jour
          </button>
          <button type="button" onClick={() => setPlusTard(true)} className="rounded-2xl bg-card py-3 font-extrabold">
            Plus tard
          </button>
        </div>
      </div>
    );
  }

  // Les autres étapes prennent tout l'écran : on ne peut pas se tromper.
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#0b0820]/90 px-6 backdrop-blur-sm">
      <div className="arrivee w-full max-w-sm rounded-[2rem] border-2 border-[#e8c98a] bg-[#24123f] px-5 py-6 text-center shadow-[0_0_40px_rgba(160,110,255,.6)]">
        <PlumeDessin anim={phase === "telechargement" ? "parle" : phase === "termine" ? "coucou" : "rien"} className="mx-auto size-24" />

        {phase === "telechargement" ? (
          <>
            <p className="titre-or mt-3 text-3xl">Chargement…</p>
            <p className="mt-1">Laisse l'application ouverte.</p>
            <div className="mt-5 h-6 overflow-hidden rounded-full border-2 border-[#e8c98a] bg-[#140a26]" role="progressbar" aria-valuenow={apk.pourcent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#f3d48a,#ffb35c)] transition-[width] duration-300" style={{ width: `${Math.max(4, apk.pourcent)}%` }} />
            </div>
            <p className="mt-2 font-display text-2xl text-[#f3d48a]">{apk.pourcent} %</p>
          </>
        ) : null}

        {phase === "pret" ? (
          <>
            <p className="titre-or mt-3 text-3xl">C'est prêt !</p>
            <div className="mt-4 h-6 overflow-hidden rounded-full border-2 border-[#e8c98a] bg-[#140a26]">
              <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#9be08a,#5cc28a)]" />
            </div>
            <p className="mt-3">Touche le bouton : l'application va se relancer toute seule.</p>
            <button type="button" onClick={() => (EST_APK ? redemarrerApk() : accepterMiseAJour())} className="bouton-bois mt-5 w-full rounded-2xl py-4 font-display text-2xl">
              Redémarrer l'application
            </button>
          </>
        ) : null}

        {phase === "erreur" ? (
          <>
            <p className="titre-or mt-3 text-3xl">Oups !</p>
            <p className="mt-2">Le chargement s'est arrêté, peut-être à cause d'Internet. Ton application n'a pas changé : tout marche comme avant.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => lancerMajApk()} className="bouton-bois rounded-2xl py-3 font-extrabold">Réessayer</button>
              <button type="button" onClick={() => fermerMaj()} className="rounded-2xl bg-card py-3 font-extrabold">Plus tard</button>
            </div>
          </>
        ) : null}

        {phase === "termine" ? (
          <>
            <p className="titre-or mt-3 text-3xl">Mise à jour terminée !</p>
            {derniere ? (
              <ul className="mt-3 list-disc space-y-0.5 pl-5 text-left text-sm">
                {derniere.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            ) : (
              <p className="mt-2">Ton encyclopédie est toute neuve.</p>
            )}
            <button
              type="button"
              onClick={() => (EST_APK ? fermerMaj() : setWebPhase("rien"))}
              className="bouton-bois mt-5 w-full rounded-2xl py-4 font-display text-2xl"
            >
              Super !
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

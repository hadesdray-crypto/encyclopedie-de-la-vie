// Quand le temps d'écran du jour est passé, Plume le dit avec douceur, chacune à sa manière.
// 10 minutes avant, elle prévient. Si Leonie est en pleine partie, elle peut la finir.
import { useEffect, useMemo, useState } from "react";
import { PlumeDessin, type Caractere } from "@/components/plume-dessin";
import { voixPossible } from "@/components/voix";
import { dire, taire } from "@/lib/parole";
import { plumeDit, plumeParleSeule, usePlume, type Presence } from "@/lib/plume";
import { encoreDuTemps, marquerPrevenu, sansLimiteAujourdhui, useTempsEcran } from "@/lib/temps-ecran";

const CARACTERE: Record<Presence, Caractere> = { discrete: 1, presente: 2, etudiante: 3, passionnee: 4, repos: 0 };

const FIN: Record<Presence, string> = {
  discrete: "Leonie… on a beaucoup regardé l'écran aujourd'hui. On éteint la tablette, et on va dehors ? À demain.",
  presente: "Ça fait longtemps qu'on regarde l'écran, Leonie ! On éteint la tablette et on va profiter du monde dehors ? À demain !",
  etudiante: "D'après ce que savent les scientifiques, jouer dehors fait du bien aux yeux et au corps. On éteint la tablette ? À demain, Leonie !",
  passionnee: "Eh oui, Leonie ! Le vrai monde est plein d'animaux à découvrir ! On éteint la tablette et on part explorer dehors ? À demain !",
  repos: "Ça fait longtemps qu'on regarde l'écran, Leonie ! On éteint la tablette et on va profiter du monde dehors ? À demain !",
};
const BIENTOT: Record<Presence, string> = {
  discrete: "Encore un petit moment, Leonie, et on ira dehors.",
  presente: "Encore un petit moment, Leonie, et on ira dehors !",
  etudiante: "Encore dix minutes, Leonie, et on ira observer le vrai monde !",
  passionnee: "Leonie, Leonie ! Encore un petit moment, et on file explorer dehors !",
  repos: "Encore un petit moment, Leonie, et on ira dehors !",
};

function enPartie() {
  return document.body.hasAttribute("data-jeu") || document.body.hasAttribute("data-face-a-face");
}

export function TempsEcran() {
  const e = useTempsEcran();
  const { presence } = usePlume();

  // 10 minutes avant : une petite phrase dans la bulle de Plume.
  useEffect(() => {
    if (!e.prevenir) return;
    marquerPrevenu();
    const phrase = BIENTOT[presence];
    plumeDit(phrase, 6000);
    if (plumeParleSeule() && voixPossible()) dire(phrase);
  }, [e.prevenir]);

  const montrer = e.fini && !enPartie();
  useEffect(() => {
    if (!montrer) return;
    if (voixPossible()) {
      taire();
      const t = window.setTimeout(() => dire(FIN[presence]), 600);
      return () => window.clearTimeout(t);
    }
  }, [montrer]);

  if (!montrer) return null;
  return <EcranRepos presence={presence} />;
}

function EcranRepos({ presence }: { presence: Presence }) {
  const [adulte, setAdulte] = useState(false);
  const [reponse, setReponse] = useState("");
  // Une multiplication différente à chaque fois : Leonie ne peut pas apprendre la réponse par cœur.
  const [a, b] = useMemo(() => [12 + Math.floor(Math.random() * 8), 6 + Math.floor(Math.random() * 4)], []);
  const bon = reponse.trim() === String(a * b);
  return (
    <div role="dialog" aria-modal="true" aria-label="Temps d'écran terminé" className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[radial-gradient(circle_at_50%_30%,#3a2470,#120c2c_70%)] px-5 py-8 text-center text-[#fff3d0]">
      <div className="mx-auto max-w-sm">
        <div className="relative mx-auto size-44">
          <span className="coeur-flotte absolute -right-2 top-0 text-4xl" aria-hidden="true">💜</span>
          <span className="coeur-flotte coeur-2 absolute -left-3 top-10 text-2xl" aria-hidden="true">💛</span>
          <PlumeDessin caractere={CARACTERE[presence]} anim="coucou" className="size-full drop-shadow-[0_10px_18px_rgba(0,0,0,.5)]" />
        </div>
        <p className="titre-or mt-4 font-display text-3xl">C'est l'heure d'aller dehors&nbsp;!</p>
        <p className="mt-3 text-lg font-bold leading-snug">{FIN[presence]}</p>
        <button type="button" onClick={() => dire(FIN[presence])} className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold">
          Écouter Plume
        </button>

        <div className="mt-8 rounded-2xl bg-white/5 px-4 py-3 text-sm">
          {!adulte ? (
            <button type="button" onClick={() => setAdulte(true)} className="font-extrabold underline">Pour un adulte</button>
          ) : (
            <>
              <label className="block font-extrabold">Pour un adulte : combien font {a} × {b} ?</label>
              <input inputMode="numeric" value={reponse} onChange={(ev) => setReponse(ev.target.value)} className="mt-2 w-28 rounded-xl bg-white px-3 py-2 text-center text-[#2a1c14]" />
              {bon ? (
                <div className="mt-3 grid gap-2">
                  <button type="button" onClick={() => encoreDuTemps(15)} className="bouton-bois rounded-full py-2 font-extrabold">15 minutes de plus</button>
                  <button type="button" onClick={() => encoreDuTemps(30)} className="bouton-bois rounded-full py-2 font-extrabold">30 minutes de plus</button>
                  <button type="button" onClick={() => sansLimiteAujourdhui()} className="rounded-full bg-white/10 py-2 font-extrabold">Sans limite aujourd'hui</button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

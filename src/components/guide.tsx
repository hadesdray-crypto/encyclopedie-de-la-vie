import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuVolume2, LuVolumeX, LuX } from "react-icons/lu";
import { explicationPour } from "@/data/guide";
import { lire, stopper, voixPossible } from "@/components/voix";
import { dejaExplique, marquerExplique, ouvrirPlume, plumeParleSeule, usePlume } from "@/lib/plume";
import { VITESSES, choisirVitesseVoix, vitesseVoix } from "@/lib/reglages";

/** Le bouton Plume, placé dans l'en-tête de chaque page : il ne cache jamais rien. */
export function BoutonPlume({ taille = "size-12" }: { taille?: string }) {
  const { ouvert, reaction } = usePlume();
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => ouvrirPlume(!ouvert)}
        aria-label="Plume t'explique la page"
        aria-expanded={ouvert}
        className={`plume-bouton block shrink-0 ${taille}`}
      >
        <img src="theme/plume.svg" alt="" className="size-full drop-shadow-[0_4px_10px_rgba(0,0,0,.45)]" />
      </button>
      {reaction ? (
        <span role="status" className="arrivee pointer-events-none absolute left-full top-1 z-40 ml-2 w-max max-w-[60vw] rounded-2xl rounded-tl-sm bg-[#fff8ea] px-3 py-2 text-sm font-extrabold text-[#4a2a8a] shadow-[0_6px_18px_rgba(0,0,0,.4)]">
          {reaction}
        </span>
      ) : null}
    </span>
  );
}

/** La bulle de Plume : une explication en plusieurs petites étapes, avec la voix. */
export function PanneauPlume({ chemin, params }: { chemin: string; params: URLSearchParams }) {
  const { ouvert } = usePlume();
  const explication = explicationPour(chemin, params);
  const [etape, setEtape] = useState(0);
  const [parle, setParle] = useState(false);
  // Une fois qu'on a touché « Écouter », Plume continue de parler quand on passe à la bulle suivante.
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState(vitesseVoix);

  // Nouvelle page : on repart de la première bulle. La première fois, Plume se présente toute seule.
  useEffect(() => {
    setEtape(0);
    stopper();
    setParle(false);
    if (!dejaExplique(explication.id)) {
      marquerExplique(explication.id);
      ouvrirPlume(true);
    } else ouvrirPlume(false);
  }, [explication.id]);

  const texte = explication.etapes[etape] ?? explication.etapes[0];
  const derniere = etape >= explication.etapes.length - 1;

  function dire(t: string) {
    if (!voixPossible()) return;
    setParle(true);
    lire(t, () => setParle(false));
  }

  useEffect(() => {
    if (ouvert && (plumeParleSeule() || lecture)) dire(texte);
    if (!ouvert) {
      stopper();
      setParle(false);
      setLecture(false);
    }
  }, [ouvert, texte]);

  if (!ouvert) return null;

  function fermer() {
    stopper();
    setParle(false);
    ouvrirPlume(false);
  }

  return (
    <div className="fixed inset-0 z-40" onClick={fermer}>
      <div
        role="dialog"
        aria-label={`Plume : ${explication.titre}`}
        onClick={(e) => e.stopPropagation()}
        className="arrivee absolute left-1/2 w-[min(92%,26rem)] -translate-x-1/2 rounded-3xl border-[3px] border-[#c9a4ff] bg-[#fff8ea] px-4 pb-4 pt-3 text-[#2a1c14] shadow-[0_0_0_6px_rgba(122,79,208,.35),0_18px_40px_rgba(0,0,0,.55)]"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 4.5rem)" }}
      >
        <div className="flex items-center gap-3">
          <img src="theme/plume.svg" alt="" className={`size-14 shrink-0 ${parle ? "plume-parle" : "plume-flotte"}`} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight text-[#6a3fc0]">{explication.titre}</p>
            {explication.etapes.length > 1 ? (
              <p className="mt-0.5 flex gap-1" aria-label={`Bulle ${etape + 1} sur ${explication.etapes.length}`}>
                {explication.etapes.map((_, i) => (
                  <span key={i} className={`h-2 rounded-full ${i === etape ? "w-5 bg-[#6a3fc0]" : "w-2 bg-[#d9c7f0]"}`} />
                ))}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={fermer} aria-label="Fermer" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#efe3ff] text-[#6a3fc0]">
            <LuX className="size-5" />
          </button>
        </div>

        <p key={etape} className="arrivee mt-3 min-h-[4.5rem] text-lg leading-snug">{texte}</p>

        {voixPossible() ? (
          <div className="mt-2 flex items-center gap-1.5 text-sm" role="group" aria-label="Vitesse de la voix">
            <span className="font-extrabold text-[#6a3fc0]">Voix :</span>
            {VITESSES.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={vitesse === v.id}
                onClick={() => {
                  choisirVitesseVoix(v.id);
                  setVitesse(v.id);
                  if (parle) dire(texte);
                }}
                className={`min-h-9 rounded-full px-3 font-extrabold ${vitesse === v.id ? "bg-[#6a3fc0] text-white" : "bg-[#efe3ff] text-[#6a3fc0]"}`}
              >
                {v.nom}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          {voixPossible() ? (
            <button
              type="button"
              onClick={() => {
                if (parle) {
                  stopper();
                  setParle(false);
                  setLecture(false);
                } else {
                  setLecture(true);
                  dire(texte);
                }
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#6a3fc0] px-4 font-extrabold text-white"
            >
              {parle ? <LuVolumeX className="size-5" /> : <LuVolume2 className="size-5" />}
              {parle ? "Stop" : "Écouter"}
            </button>
          ) : null}
          <span className="flex-1" />
          {etape > 0 ? (
            <button type="button" onClick={() => setEtape(etape - 1)} aria-label="Bulle précédente" className="grid size-12 place-items-center rounded-full bg-[#efe3ff] text-[#6a3fc0]">
              <LuChevronLeft className="size-6" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (derniere ? fermer() : setEtape(etape + 1))}
            className="inline-flex min-h-12 items-center gap-1 rounded-full bg-[#f3d48a] px-4 font-extrabold text-[#2a1c14]"
          >
            {derniere ? "J'ai compris !" : "Suivant"}
            {derniere ? null : <LuChevronRight className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

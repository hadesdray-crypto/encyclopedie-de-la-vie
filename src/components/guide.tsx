import { useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuCircleHelp, LuMusic, LuPause, LuPlay, LuRotateCcw, LuSparkles, LuX } from "react-icons/lu";
import { PRESENTATION, explicationPour } from "@/data/guide";
import { voixPossible } from "@/components/voix";
import { PlumeDessin, type AnimPlume } from "@/components/plume-dessin";
import {
  choisirPlumeParle,
  dejaExplique,
  marquerExplique,
  marquerPresentation,
  ouvrirPlume,
  plumeParleSeule,
  presentationFaite,
  usePlume,
} from "@/lib/plume";
import { VITESSES, choisirVitesseVoix, vitesseVoix } from "@/lib/reglages";
import { activerSons, sonsActifs } from "@/lib/sons";
import { dire, redire, taire, useParle } from "@/lib/parole";

/**
 * Plume, dans l'en-tête de chaque page. Elle fait coucou de temps en temps.
 * Quand elle parle, un petit bouton Pause apparaît à côté d'elle.
 * On la touche : elle ouvre ses ailes (le menu de la voix) et explique la page.
 */
export function BoutonPlume({ taille = "size-12" }: { taille?: string }) {
  const { ouvert, reaction, coucou } = usePlume();
  const parle = useParle();
  const [anim, setAnim] = useState<AnimPlume>("coucou");

  // Coucou à l'arrivée, à chaque toucher, puis de temps en temps.
  useEffect(() => {
    setAnim("coucou");
    const fin = window.setTimeout(() => setAnim("rien"), 1700);
    return () => window.clearTimeout(fin);
  }, [coucou]);
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible" && Math.random() < 0.5) {
        setAnim("coucou");
        window.setTimeout(() => setAnim("rien"), 1700);
      }
    }, 20000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => ouvrirPlume(!ouvert)}
        aria-label="Plume : ouvrir ses ailes et expliquer la page"
        aria-expanded={ouvert}
        className={`block shrink-0 ${taille}`}
      >
        <PlumeDessin anim={parle && !ouvert ? "parle" : anim} className="size-full drop-shadow-[0_4px_10px_rgba(0,0,0,.45)]" />
      </button>
      {parle && !ouvert ? (
        <button type="button" onClick={taire} className="arrivee inline-flex min-h-10 items-center gap-1 rounded-full border-2 border-[#e8c98a] bg-[#24123f] px-3 text-sm font-extrabold text-[#f3d48a]">
          <LuPause className="size-4" aria-hidden="true" />
          Pause
        </button>
      ) : null}
      {reaction && !parle ? (
        <span role="status" className="arrivee pointer-events-none absolute left-full top-1 z-40 ml-2 w-max max-w-[60vw] rounded-2xl rounded-tl-sm bg-[#fff8ea] px-3 py-2 text-sm font-extrabold text-[#4a2a8a] shadow-[0_6px_18px_rgba(0,0,0,.4)]">
          {reaction}
        </span>
      ) : null}
    </span>
  );
}

/** Plume ailes ouvertes : le menu de la voix, et la bulle qui explique. */
export function PanneauPlume({ chemin, params }: { chemin: string; params: URLSearchParams }) {
  const { ouvert, contenu } = usePlume();
  const parle = useParle();
  const explicationPage = explicationPour(chemin, params);
  const explication = contenu === "presentation" ? PRESENTATION : explicationPage;
  const [etape, setEtape] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState(vitesseVoix);
  const [sonsJeux, setSonsJeux] = useState(sonsActifs);
  const [seule, setSeule] = useState(plumeParleSeule);
  const premier = useRef(true);

  // Première ouverture de l'application : Plume se présente. Ensuite, la première visite de chaque page.
  useEffect(() => {
    taire();
    setEtape(0);
    setLecture(false);
    if (premier.current && !presentationFaite()) {
      premier.current = false;
      marquerPresentation();
      marquerExplique(explicationPage.id);
      ouvrirPlume(true, "presentation");
      return;
    }
    premier.current = false;
    if (!dejaExplique(explicationPage.id)) {
      marquerExplique(explicationPage.id);
      ouvrirPlume(true, "page");
    } else ouvrirPlume(false);
  }, [explicationPage.id]);

  useEffect(() => {
    setEtape(0);
  }, [contenu]);

  const texte = explication.etapes[etape] ?? explication.etapes[0];
  const derniere = etape >= explication.etapes.length - 1;

  // « Suivant » continue la lecture si on a demandé à Plume de lire.
  useEffect(() => {
    if (ouvert && voixPossible() && (seule || lecture)) dire(texte);
    if (!ouvert) {
      taire();
      setLecture(false);
    }
  }, [ouvert, texte]);

  if (!ouvert) return null;

  function fermer() {
    taire();
    setLecture(false);
    ouvrirPlume(false);
  }

  function lecturePause() {
    if (parle) {
      taire();
      setLecture(false);
    } else {
      setLecture(true);
      dire(texte);
    }
  }

  const voix = voixPossible();

  return (
    <div className="fixed inset-0 z-40 bg-[#0b0820]/70" onClick={fermer}>
      <div className="mx-auto w-[min(100%,28rem)] px-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }} onClick={(e) => e.stopPropagation()}>
        {/* Plume ailes ouvertes */}
        <div className="ailes-menu relative mx-auto h-[15.5rem]">
          <div className="aile-panneau aile-g absolute left-0 top-16 flex w-[37%] flex-col items-stretch gap-1.5 px-2.5 py-3 text-[13px]">
            <button
              type="button"
              aria-pressed={sonsJeux}
              onClick={() => {
                activerSons(!sonsJeux);
                setSonsJeux(!sonsJeux);
              }}
              className={`flex min-h-10 items-center gap-1.5 rounded-xl px-2 font-extrabold ${sonsJeux ? "bg-[#fff8ea] text-[#4a2a8a]" : "bg-[#3a2266] text-[#e7d7ff]"}`}
            >
              <LuMusic className="size-4 shrink-0" aria-hidden="true" />
              {sonsJeux ? "Sons : oui" : "Sons : non"}
            </button>
            {voix ? (
              <>
                <div className="flex justify-between gap-1" role="group" aria-label="Vitesse de la voix">
                  {VITESSES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={vitesse === v.id}
                      aria-label={`Voix ${v.nom.toLowerCase()}`}
                      onClick={() => {
                        choisirVitesseVoix(v.id);
                        setVitesse(v.id);
                        if (parle) dire(texte);
                      }}
                      className={`min-h-9 flex-1 rounded-lg text-[11px] font-extrabold ${vitesse === v.id ? "bg-[#f3d48a] text-[#2a1c14]" : "bg-[#fff8ea] text-[#4a2a8a]"}`}
                    >
                      {v.id === "lente" ? "Lent" : v.id === "rapide" ? "Vite" : "Normal"}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setLecture(true); redire(); }} className="flex min-h-10 items-center gap-1.5 rounded-xl bg-[#fff8ea] px-2 font-extrabold text-[#4a2a8a]">
                  <LuRotateCcw className="size-4 shrink-0" aria-hidden="true" />
                  Relire
                </button>
              </>
            ) : null}
          </div>
          <div className="aile-panneau aile-d absolute right-0 top-16 flex w-[37%] flex-col items-stretch gap-1.5 px-2.5 py-3 text-[13px]">
            {voix ? (
              <button
                type="button"
                aria-pressed={seule}
                onClick={() => {
                  choisirPlumeParle(!seule);
                  setSeule(!seule);
                }}
                className={`flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-left font-extrabold leading-tight ${seule ? "bg-[#f3d48a] text-[#2a1c14]" : "bg-[#fff8ea] text-[#4a2a8a]"}`}
              >
                Je lis toute seule
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => ouvrirPlume(true, contenu === "presentation" ? "page" : "presentation")}
              className="flex min-h-10 items-center gap-1.5 rounded-xl bg-[#fff8ea] px-2 text-left font-extrabold leading-tight text-[#4a2a8a]"
            >
              {contenu === "presentation" ? <LuCircleHelp className="size-4 shrink-0" aria-hidden="true" /> : <LuSparkles className="size-4 shrink-0" aria-hidden="true" />}
              {contenu === "presentation" ? "Aide de la page" : "Qui est Plume ?"}
            </button>
            <button type="button" onClick={fermer} className="flex min-h-10 items-center gap-1.5 rounded-xl bg-[#fff8ea] px-2 font-extrabold text-[#4a2a8a]">
              <LuX className="size-4 shrink-0" aria-hidden="true" />
              Fermer
            </button>
          </div>
          <div className="absolute left-1/2 top-0 z-10 w-[38%] -translate-x-1/2">
            <PlumeDessin anim={parle ? "parle" : "ailes"} className="w-full drop-shadow-[0_8px_18px_rgba(0,0,0,.5)]" />
            {voix ? (
              <button
                type="button"
                onClick={lecturePause}
                aria-label={parle ? "Pause" : "Écouter Plume"}
                className="absolute left-1/2 top-[64%] grid size-14 -translate-x-1/2 place-items-center rounded-full border-4 border-[#fff3d0] bg-[#6a3fc0] text-white shadow-[0_0_0_6px_rgba(106,63,192,.35),0_6px_14px_rgba(0,0,0,.45)]"
              >
                {parle ? <LuPause className="size-7" /> : <LuPlay className="ml-1 size-7" />}
              </button>
            ) : null}
          </div>
        </div>

        {/* La bulle */}
        <div role="dialog" aria-label={`Plume : ${explication.titre}`} className="arrivee mt-2 rounded-3xl border-[3px] border-[#c9a4ff] bg-[#fff8ea] px-4 pb-4 pt-3 text-[#2a1c14] shadow-[0_18px_40px_rgba(0,0,0,.55)]">
          <div>
            <p className="font-display text-xl leading-tight text-[#6a3fc0]">{explication.titre}</p>
            {explication.etapes.length > 1 ? (
              <p className="mt-1 flex gap-1" aria-label={`Bulle ${etape + 1} sur ${explication.etapes.length}`}>
                {explication.etapes.map((_, i) => (
                  <span key={i} className={`h-2 rounded-full ${i === etape ? "w-5 bg-[#6a3fc0]" : "w-2 bg-[#d9c7f0]"}`} />
                ))}
              </p>
            ) : null}
          </div>
          <p key={`${contenu}-${etape}`} className="arrivee mt-2 min-h-[4.5rem] text-lg leading-snug">
            {texte}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {etape > 0 ? (
              <button type="button" onClick={() => setEtape(etape - 1)} aria-label="Bulle précédente" className="grid size-12 place-items-center rounded-full bg-[#efe3ff] text-[#6a3fc0]">
                <LuChevronLeft className="size-6" />
              </button>
            ) : null}
            {!derniere ? (
              <button type="button" onClick={fermer} className="min-h-12 rounded-full px-3 text-sm font-extrabold text-[#7a5a8a] underline">
                Passer
              </button>
            ) : null}
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => (derniere ? fermer() : setEtape(etape + 1))}
              className="inline-flex min-h-12 items-center gap-1 rounded-full bg-[#f3d48a] px-5 font-extrabold text-[#2a1c14]"
            >
              {derniere ? (contenu === "presentation" ? "C'est parti !" : "J'ai compris !") : "Suivant"}
              {derniere ? null : <LuChevronRight className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

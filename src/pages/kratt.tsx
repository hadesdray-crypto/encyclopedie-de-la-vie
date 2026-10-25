// Les frères Kratt : Chris et Martin Kratt, deux frères américains qui étudient les animaux
// (Chris est biologiste, Martin est zoologiste). Leur dessin animé « Les frères Kratt » (Wild Kratts) existe depuis 2011.
// L'application ne contient pas leurs vidéos : elle ouvre une recherche, d'abord sans publicité.
import { Entete, Titre } from "@/components/entete";
import { SANS_PUB } from "@/components/videos";
import { useInternet } from "@/lib/internet";
import { LuPlay } from "react-icons/lu";

const THEMES = ["guépard", "loup", "orque", "panda", "koala", "chauve-souris", "pieuvre", "éléphant", "fourmilier", "loutre", "ornithorynque", "lion"];

function Liens({ q }: { q: string }) {
  const e = encodeURIComponent(q);
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <a href={`${SANS_PUB}/search?q=${e}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#f3d48a] px-3 text-sm font-extrabold text-[#2a1650]">
        <LuPlay className="size-4" aria-hidden="true" /> Sans pub
      </a>
      <a href={`https://www.youtube.com/results?search_query=${e}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-extrabold text-white">
        <LuPlay className="size-4" aria-hidden="true" /> YouTube
      </a>
    </div>
  );
}

export function KrattPage() {
  const { permis } = useInternet();
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre sous="Deux frères qui adorent les animaux, comme toi.">Les frères Kratt</Titre>
      <section className="carte-nuit mt-4 rounded-3xl px-4 py-4">
        <p className="leading-relaxed">
          Chris et Martin Kratt sont deux vrais frères, venus des États-Unis. Chris est biologiste et Martin est zoologiste : ils étudient les animaux. Dans leur dessin animé, « Les frères Kratt », ils ont des combinaisons qui leur donnent les pouvoirs des animaux.
        </p>
        <p className="mt-2 text-xs texte-doux">Les vidéos ne sont pas dans l'application : elles sont sur Internet. « Sans pub » s'ouvre dans NewPipe s'il est installé, sinon sur Invidious.</p>
      </section>
      {permis ? (
        <>
          <section className="carte-nuit mt-4 rounded-3xl px-4 py-4">
            <p className="font-display text-xl text-[#f3d48a]">Tous leurs épisodes</p>
            <Liens q="Les frères Kratt épisode" />
          </section>
          <p className="mt-5 font-display text-xl text-[#f3d48a]">Un épisode sur…</p>
          <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {THEMES.map((t) => (
              <li key={t} className="carte-nuit rounded-3xl px-3 py-3">
                <p className="font-display text-lg capitalize">{t}</p>
                <Liens q={`Les frères Kratt ${t}`} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 rounded-3xl bg-card px-4 py-4 font-extrabold text-[#2a1c14]">Les vidéos sont sur Internet : un adulte peut les allumer dans le Coin des parents (dans Options).</p>
      )}
    </main>
  );
}

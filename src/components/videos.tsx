// Voir l'animal en vidéo : d'abord un lien sans publicité, puis YouTube.
// « Sans pub » ouvre Invidious (un site qui montre les vidéos YouTube sans publicité) ;
// si l'application NewPipe est installée sur la tablette, c'est elle qui ouvre le lien.
// Les vidéos s'ouvrent sur Internet : un adulte les allume dans le Coin des parents.
import videos from "@/data/videos.json";
import { useInternet } from "@/lib/internet";
import { LuPlay, LuSearch } from "react-icons/lu";

export const SANS_PUB = "https://yewtu.be";
type Video = { v: string; t: string; c: string };
const VIDEOS = videos as Record<string, Video>;

export function Videos({ id, nom, latin }: { id: string; nom: string; latin: string }) {
  const { permis } = useInternet();
  const v = VIDEOS[id];
  const q = encodeURIComponent(`${nom} ${latin}`);
  const liens = v
    ? [
        { url: `${SANS_PUB}/watch?v=${v.v}`, texte: "Voir sans pub", icone: LuPlay, fort: true },
        { url: `https://www.youtube.com/watch?v=${v.v}`, texte: "Voir sur YouTube", icone: LuPlay, fort: false },
      ]
    : [
        { url: `${SANS_PUB}/search?q=${q}`, texte: "Chercher sans pub", icone: LuSearch, fort: true },
        { url: `https://www.youtube.com/results?search_query=${q}`, texte: "Chercher sur YouTube", icone: LuSearch, fort: false },
      ];
  return (
    <section className="carte-nuit mt-4 rounded-3xl px-4 py-3">
      <p className="font-display text-lg text-[#f3d48a]">En vidéo</p>
      {v ? <p className="mt-1 text-sm">« {v.t} » — {v.c}</p> : <p className="mt-1 text-sm">Pas encore de vidéo choisie pour cet animal : on peut la chercher.</p>}
      {permis ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {liens.map(({ url, texte, icone: I, fort }) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-extrabold ${fort ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10 text-white"}`}>
              <I className="size-4" aria-hidden="true" /> {texte}
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm font-bold">Les vidéos sont sur Internet : un adulte peut les allumer dans le Coin des parents.</p>
      )}
      {permis ? (
        <a href={`${SANS_PUB}/search?q=${encodeURIComponent(`Les frères Kratt ${nom}`)}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center text-sm font-extrabold underline">
          Chercher un épisode des frères Kratt
        </a>
      ) : null}
      <p className="mt-1.5 text-[11px] texte-doux">« Sans pub » s'ouvre dans NewPipe s'il est installé, sinon sur Invidious.</p>
    </section>
  );
}

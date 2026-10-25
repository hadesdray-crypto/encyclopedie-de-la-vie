// Les pièces communes des jeux : de belles cartes à toucher, un bandeau de question,
// et un résultat qui fait la fête (confettis) ou encourage (« Presque ! »).
import type { ReactNode } from "react";

export type EtatChoix = "neutre" | "juste" | "faux" | "efface" | "autre";

/** L'état d'un choix, une fois qu'on a répondu (ou pas encore). */
export function etatDe(id: string, rep: string | null, bon: string, effaces?: Set<string>): EtatChoix {
  if (rep === null) return effaces?.has(id) ? "efface" : "neutre";
  if (id === bon) return "juste";
  if (id === rep) return "faux";
  return "autre";
}

/** Une carte à toucher : une grande image (ou un emoji), le nom sur un ruban, et ce qu'on découvre après la réponse. */
export function CarteChoix({ image, emoji, nom, detail, revele, etat, onClick, taille = "moyenne" }: { image?: ReactNode; emoji?: string; nom: string; detail?: string; revele?: ReactNode; etat: EtatChoix; onClick: () => void; taille?: "petite" | "moyenne" | "grande" }) {
  const t = taille === "grande" ? "text-[1.35rem]" : taille === "petite" ? "text-[13px]" : "text-base";
  return (
    <button type="button" disabled={etat === "efface"} onClick={onClick} className={`choix-jeu choix-${etat} ${image ? "choix-photo" : "choix-icone"} relative flex h-full w-full flex-col overflow-hidden text-left`}>
      {image ? (
        <>
          <span className="relative block aspect-[4/5] w-full overflow-hidden [&_img]:size-full">{image}</span>
          {/* Le nom glisse sur la photo, dans un dégradé (pas de cadre). */}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#120a26] via-[#120a26]/75 to-transparent px-2 pb-2 pt-8 text-center text-white">
            <span className={`block font-display ${t} leading-tight [text-shadow:0_2px_6px_rgba(0,0,0,.7)]`}>{nom}</span>
            {revele && etat !== "neutre" && etat !== "efface" ? <span className="apparait mt-1 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-black backdrop-blur">{revele}</span> : null}
          </span>
        </>
      ) : (
        <span className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center text-white">
          <span className="bulle-emoji grid size-16 place-items-center rounded-full text-4xl" aria-hidden="true">{emoji}</span>
          <span className={`mt-2 block font-display ${t} leading-tight`}>{nom}</span>
          {detail ? <span className="apparait mt-1 block text-[11.5px] leading-snug text-white/80">{detail}</span> : null}
        </span>
      )}
      {etat === "juste" ? <span className="badge-jeu bg-[#3fbf5f]" aria-label="Bonne réponse">✓</span> : etat === "faux" ? <span className="badge-jeu bg-[#e2453c]" aria-label="Mauvaise réponse">✗</span> : null}
    </button>
  );
}

/** La question, sur un ruban doré. */
export function Consigne({ children, sous }: { children: ReactNode; sous?: ReactNode }) {
  return (
    <div className="consigne-jeu relative mx-auto mt-4 max-w-md px-4 text-center">
      <p className="titre-jeu font-display text-[1.75rem] leading-tight">{children}</p>
      {sous ? <p className="mt-1 text-sm font-bold text-[#d9c7ff]">{sous}</p> : null}
    </div>
  );
}

/** Le « VS » entre deux cartes. */
export function Versus() {
  return <span className="versus-jeu pointer-events-none absolute left-1/2 top-[42%] z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display text-lg text-[#2a1650]">VS</span>;
}

const CONFETTIS = Array.from({ length: 18 }, (_, i) => ({ x: ((i * 37) % 100) - 50, d: (i % 6) * 0.04, c: ["#f3c35a", "#ff7ab6", "#5fe07a", "#4fb6ff", "#c9a4ff", "#ff8a3d"][i % 6], r: (i * 47) % 360 }));

/** Le résultat : la fête si c'est juste, un encouragement sinon, puis le bouton pour continuer. */
export function Resultat({ juste, texte, suite, libelle = "Une autre" }: { juste: boolean; texte?: ReactNode; suite: () => void; libelle?: string }) {
  return (
    <div className="apparait relative mt-4">
      {juste ? (
        <div className="pointer-events-none absolute inset-x-0 -top-4 h-0" aria-hidden="true">
          {CONFETTIS.map((k, i) => <span key={i} className="confetti" style={{ left: `calc(50% + ${k.x}%)`, background: k.c, animationDelay: `${k.d}s`, rotate: `${k.r}deg` }} />)}
        </div>
      ) : null}
      <div className={`resultat-jeu rounded-[1.6rem] px-4 py-3 text-center ${juste ? "resultat-juste" : "resultat-presque"}`}>
        <p className="font-display text-2xl">{juste ? "🎉 Bravo !" : "💪 Presque !"}</p>
        {texte ? <p className="mt-1 text-sm leading-snug">{texte}</p> : null}
      </div>
      <button type="button" onClick={suite} className="bouton-jeu au-dessus-barre mt-3 w-full rounded-full py-4 font-display text-2xl">{libelle} ➜</button>
    </div>
  );
}

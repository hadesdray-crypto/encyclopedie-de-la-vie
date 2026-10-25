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
  const t = taille === "grande" ? "text-xl" : taille === "petite" ? "text-[13px]" : "text-base";
  return (
    <button type="button" disabled={etat === "efface"} onClick={onClick} className={`choix-jeu choix-${etat} relative flex h-full w-full flex-col overflow-hidden rounded-[1.4rem] text-left`}>
      {image ? (
        <span className="relative block aspect-square w-full overflow-hidden bg-[#1d1336] [&_img]:size-full">{image}</span>
      ) : emoji ? (
        <span className="grid place-items-center pt-3 text-5xl drop-shadow-[0_3px_4px_rgba(0,0,0,.35)]" aria-hidden="true">{emoji}</span>
      ) : null}
      <span className={`ruban-jeu block px-2 py-2 text-center ${image ? "" : "pt-1"}`}>
        <span className={`block font-display ${t} leading-tight`}>{nom}</span>
        {detail ? <span className="mt-0.5 block text-[11.5px] leading-snug opacity-80">{detail}</span> : null}
        {revele && etat !== "neutre" && etat !== "efface" ? <span className="apparait mt-1 block text-sm font-black">{revele}</span> : null}
      </span>
      {etat === "juste" ? <span className="badge-jeu bg-[#3fbf5f]" aria-label="Bonne réponse">✓</span> : etat === "faux" ? <span className="badge-jeu bg-[#e2453c]" aria-label="Mauvaise réponse">✗</span> : null}
    </button>
  );
}

/** La question, sur un ruban doré. */
export function Consigne({ children, sous }: { children: ReactNode; sous?: ReactNode }) {
  return (
    <div className="consigne-jeu mx-auto mt-4 max-w-md rounded-2xl px-4 py-3 text-center">
      <p className="font-display text-[1.45rem] leading-tight text-[#2a1650]">{children}</p>
      {sous ? <p className="mt-0.5 text-sm font-bold text-[#5a3a1a]">{sous}</p> : null}
    </div>
  );
}

/** Le « VS » entre deux cartes. */
export function Versus() {
  return <span className="versus-jeu pointer-events-none absolute left-1/2 top-[38%] z-10 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display text-lg text-[#2a1650]">VS</span>;
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
      <div className={`rounded-2xl px-4 py-3 text-center ${juste ? "bg-[#3fbf5f]/20 ring-2 ring-[#5fe07a]/70" : "bg-[#ff8a3d]/15 ring-2 ring-[#ffb36b]/60"}`}>
        <p className="font-display text-2xl">{juste ? "🎉 Bravo !" : "💪 Presque !"}</p>
        {texte ? <p className="mt-1 text-sm leading-snug">{texte}</p> : null}
      </div>
      <button type="button" onClick={suite} className="bouton-bois au-dessus-barre mt-3 w-full rounded-2xl py-4 font-display text-2xl">{libelle}</button>
    </div>
  );
}

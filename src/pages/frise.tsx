import { FRISE, SAVOIR } from "@/data/arbre";
import { Entete, Titre } from "@/components/entete";
import { Vignette } from "@/components/icone";

/** Heure sur une journée de 24 h qui représenterait les 4,54 milliards d'années de la Terre. */
function heure(ma: number) {
  const minutes = Math.round(((4540 - ma) / 4540) * 24 * 60);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

export function FrisePage() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre sous="De la naissance de la Terre jusqu'à aujourd'hui. Si toute cette histoire tenait en une seule journée, la Terre naîtrait à minuit, et l'heure à droite dit quand chaque étape arriverait.">La frise du temps</Titre>
      <ol className="relative mt-6 space-y-4 border-l-4 border-[#e8c98a]/60 pl-5">
        {FRISE.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[2.05rem] top-4 size-4 rounded-full bg-[#f3d48a] shadow-[0_0_12px_#f3d48a]" />
            <a href={`#/arbre/${e.id}`} className="flex items-center gap-3 rounded-3xl bg-card px-3 py-3">
              <span className="medaillon block size-14 shrink-0 overflow-hidden"><Vignette image={e.image} icone={e.icone} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl leading-tight">{e.nom}</span>
                <span className="block text-sm">{e.quand}</span>
                {e.savoir !== "preuve" ? <span className="text-xs font-extrabold text-[#8d4e1f]">{SAVOIR[e.savoir].titre}</span> : null}
              </span>
              {e.savoir === "preuve" ? <span className="shrink-0 rounded-xl bg-[#2a1844] px-2 py-1 text-sm font-extrabold text-[#f3d48a]">{heure(e.ma!)}</span> : null}
            </a>
          </li>
        ))}
        <li className="relative">
          <span className="absolute -left-[2.05rem] top-4 size-4 rounded-full bg-[#f3a0e0]" />
          <div className="carte-nuit rounded-3xl px-4 py-3">
            <p className="font-display text-xl text-[#f3d48a]">Les humains</p>
            <p className="text-sm">Homo sapiens existe depuis environ 300 000 ans : à 23 h 59 min 54 s, dans les 6 dernières secondes de la journée.</p>
          </div>
        </li>
      </ol>
    </main>
  );
}

import { useState } from "react";
import { LuChevronDown, LuGitBranch, LuMapPin } from "react-icons/lu";
import { Vignette } from "@/components/icone";
import { Portrait } from "@/components/portrait";
import { cheminEvolution, cousins, dateEnClair, heureTerre, type Noeud } from "@/lib/evolution";

/** Où l'animal se place dans l'évolution : l'horloge de la Terre, la frise, les cousins, et le grand arbre. */
export function CheminEvolution({ id, nom }: { id: string; nom: string }) {
  const chemin = cheminEvolution(id);
  const [tout, setTout] = useState(false);
  if (!chemin.length) return null;
  const debut = chemin.findIndex((n) => n.cle === "e:animaux");
  const visibles = tout || debut <= 0 ? chemin : chemin.slice(debut);
  const datees = chemin.filter((n) => n.ma !== undefined);
  const { memeFamille, autresFamilles } = cousins(id);
  const dernier = chemin.length - 1;

  return (
    <section className="carte-nuit mt-4 rounded-3xl px-4 py-4" aria-label="Sa place dans l'évolution">
      <h2 className="flex items-center gap-2 font-display text-2xl text-[#f3d48a]"><LuGitBranch className="size-6" aria-hidden="true" /> Sa place dans l'évolution</h2>
      <p className="mt-1 text-sm leading-relaxed">De la Terre jusqu'à {nom}, en {chemin.length} étapes. Touche une étape pour en savoir plus.</p>

      {datees.length ? (
        <div className="mt-3">
          <p className="text-xs font-extrabold text-[#f0d090]">Si la Terre durait une seule journée de 24 heures…</p>
          <div className="relative mt-4 h-3 rounded-full bg-[linear-gradient(90deg,#1b1240,#3a2470_45%,#d6a531)]">
            {datees.map((n) => (
              <span key={n.cle} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1b1240] bg-[#f3d48a]" style={{ left: `${((4540 - n.ma!) / 4540) * 100}%` }} title={`${n.nom} : ${heureTerre(n.ma!)}`} />
            ))}
            <span className="absolute -top-1 right-0 size-5 rounded-full bg-[#ff7ab6] ring-2 ring-white" title="Aujourd'hui" />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-extrabold text-[#e7d7be]"><span>0 h : la Terre naît</span><span>24 h : aujourd'hui</span></div>
          {datees.length ? <p className="mt-2 text-sm">Les {datees[datees.length - 1].nom.toLowerCase()} arrivent vers <b>{heureTerre(datees[datees.length - 1].ma!)}</b>. Les humains ? Dans les toutes dernières secondes.</p> : null}
        </div>
      ) : null}

      {debut > 0 && !tout ? (
        <button type="button" onClick={() => setTout(true)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl bg-[#2a1844] py-2 text-sm font-extrabold"><LuChevronDown className="size-4" aria-hidden="true" /> Remonter jusqu'à la naissance de la Terre</button>
      ) : null}

      <ol className="mt-3">
        {visibles.map((n) => {
          const i = chemin.indexOf(n);
          const ici = i === dernier;
          return (
            <li key={n.cle} className="relative flex gap-3 pb-3 last:pb-0">
              {!ici ? <span className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-[#e8c98a]/40" aria-hidden="true" /> : null}
              <a href={`#${n.vers}`} className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full ${ici ? "ring-4 ring-[#ff7ab6]" : "ring-2 ring-[#e8c98a]/60"}`} aria-label={n.nom}>
                {n.sorte === "etape" ? <Vignette image={n.image} icone={n.icone} /> : n.sorte === "espece" ? <Portrait id={n.id} /> : <span className="grid size-full place-items-center bg-[#4a2d78] text-[#f3d48a]"><LuMapPin className="size-5" aria-hidden="true" /></span>}
              </a>
              <div className="min-w-0 flex-1">
                <a href={`#${n.vers}`} className={`block font-extrabold leading-tight ${ici ? "text-[#ffb3d1]" : "text-[#f6edd8]"}`}>{ici ? `Toi ici : ${n.nom}` : n.nom}</a>
                <span className="block text-xs text-[#e7d7be]">
                  {n.sorte === "etape" ? "Étape" : n.sorte === "ordre" ? "Ordre" : n.sorte === "famille" ? "Famille" : "Espèce"}
                  {n.ma !== undefined ? ` · ${dateEnClair(n.ma)} · ${heureTerre(n.ma)} sur 24 h` : n.quand ? ` · ${n.quand}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {memeFamille.length ? (
        <div className="mt-3">
          <p className="text-sm font-extrabold text-[#f0d090]">Ses cousins les plus proches (même famille)</p>
          <ul className="mt-2 flex gap-3 overflow-x-auto pb-2">
            {memeFamille.map((c) => (
              <li key={c.id} className="w-20 shrink-0 text-center">
                <a href={`#/mammiferes/e-${c.id}`}><span className="medaillon mx-auto block size-16 overflow-hidden"><Portrait id={c.id} /></span><span className="mt-1 block text-[11px] font-extrabold leading-tight">{c.nom}</span></a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {autresFamilles.length ? (
        <div className="mt-2">
          <p className="text-sm font-extrabold text-[#f0d090]">Les autres familles de son ordre</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {autresFamilles.map((f) => <a key={f.code} href={`#/mammiferes/f-${f.code}`} className="rounded-full bg-[#2a1844] px-2.5 py-1 text-xs font-extrabold">{f.nom}</a>)}
          </div>
        </div>
      ) : null}

      <a href={`#/evolution?ici=s:${id}`} className="bouton-bois mt-4 flex items-center justify-center gap-2 rounded-2xl py-3 font-display text-xl"><LuGitBranch className="size-5" aria-hidden="true" /> Ouvrir le grand arbre</a>
    </section>
  );
}

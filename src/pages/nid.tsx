// Le nid de Plume : où en est l'histoire (l'ami, l'œuf à réchauffer, le bébé), le journal,
// et un petit coin des parents (braconnier oui ou non, faire avancer l'histoire).
import { useState } from "react";
import { Entete, Titre } from "@/components/entete";
import { Couple, Oeuf } from "@/components/histoire";
import { dire } from "@/lib/parole";
import { plumeFete } from "@/lib/plume";
import {
  COUVAGES_POUR_ECLORE, ageBebe, amiPresent, avancerUnJour, bebePresent, couver, dejaCouveAujourdhui, oeufPresent,
  permettreBraconnier, recommencerHistoire, useHistoire,
} from "@/lib/histoire";

export function NidPage() {
  const h = useHistoire();
  const [savoir, setSavoir] = useState<string | null>(null);
  const [chaleur, setChaleur] = useState(0);
  const [parents, setParents] = useState(false);
  const oeuf = oeufPresent(h), bebe = bebePresent(h), ami = amiPresent(h);
  const fait = dejaCouveAujourdhui(h);

  const rechauffer = () => {
    const s = couver();
    if (!s) return;
    setSavoir(s);
    setChaleur((n) => n + 1);
    plumeFete();
    dire(`Merci Leonie ! ${s}`);
  };

  let phrase = "Le nid de Plume est tout calme… Reviens demain : il va peut-être se passer quelque chose !";
  if (ami && !oeuf && !bebe) phrase = `Plume et ${h.nomAmi} sont bien installés dans le nid.`;
  if (oeuf) phrase = fait ? "L'œuf est bien au chaud pour aujourd'hui. Reviens demain pour le réchauffer encore !" : "Touche l'œuf pour le réchauffer. Une fois par jour, c'est parfait.";
  if (bebe) {
    const age = ageBebe(h);
    phrase = age === 0 ? `${h.nomBebe} vient de naître ! Les poussins de chouette naissent les yeux fermés, couverts d'un duvet tout doux.`
      : age < 4 ? `${h.nomBebe} grandit. Ses parents lui apportent à manger, et il réclame sans arrêt !`
      : `${h.nomBebe} a bien grandi. Plume, ${h.nomAmi} et ${h.nomBebe} sont une vraie famille.`;
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-4">
      <Entete siVide="/" />
      <Titre sous="La petite famille de Plume.">Le nid de Plume</Titre>

      <section className="carte-nuit mt-3 rounded-[1.75rem] px-4 pb-5 pt-4 text-center">
        <div className="relative">
          <Couple ami={ami} bebe={bebe} />
          {/* Le nid */}
          <div className="mx-auto -mt-4 h-8 w-64 rounded-[50%] bg-gradient-to-b from-[#8a5a2b] to-[#5b3a1c] shadow-[inset_0_4px_0_rgba(255,255,255,.15)]" />
        </div>

        {oeuf ? (
          <div className="mt-4">
            <button type="button" onClick={rechauffer} disabled={fait} aria-label="Réchauffer l'œuf" className="relative mx-auto block h-28 w-24 transition-transform active:scale-95 disabled:opacity-90">
              <Oeuf className="size-full" tremble={!fait} />
              {chaleur ? ["10%", "45%", "75%"].map((l, k) => <span key={`${chaleur}-${l}`} className="hist-chaleur absolute bottom-6 text-xl" style={{ left: l, animationDelay: `${k * 0.15}s` }}>🔥</span>) : null}
            </button>
            <div className="mx-auto mt-2 flex max-w-[14rem] justify-center gap-1.5">
              {Array.from({ length: COUVAGES_POUR_ECLORE }, (_, k) => (
                <span key={k} className={`h-3 flex-1 rounded-full ${k < h.couvages.length ? "bg-[#f3a23a] shadow-[0_0_8px_#f3a23a]" : "bg-white/15"}`} />
              ))}
            </div>
            <p className="mt-1 text-xs font-extrabold text-[#f3d48a]">Réchauffé {h.couvages.length} fois sur {COUVAGES_POUR_ECLORE}</p>
          </div>
        ) : null}

        <p className="mt-3 text-[15px] leading-relaxed">{phrase}</p>
        {savoir ? <p className="apparait mt-3 rounded-2xl bg-white/8 px-3 py-2 text-left text-sm leading-snug">🦉 <b>Le savais-tu ?</b> {savoir}</p> : null}
        {h.renvoyes ? <p className="mt-3 text-sm font-extrabold">🛡️ Braconniers renvoyés : {h.renvoyes}</p> : null}
      </section>

      {h.journal.length ? (
        <section className="carte-nuit mt-3 rounded-[1.75rem] px-4 py-4">
          <p className="font-display text-lg text-[#f3d48a]">📖 Le journal du nid</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {[...h.journal].reverse().slice(0, 15).map((l, k) => (
              <li key={k} className="flex gap-2"><span className="shrink-0 font-extrabold text-[#f3d48a]">Jour {l.jour}</span><span>{l.texte}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-3 rounded-[1.75rem] bg-white/5 px-4 py-3">
        <button type="button" onClick={() => setParents((o) => !o)} className="w-full text-left text-sm font-extrabold texte-doux">Coin des parents {parents ? "−" : "+"}</button>
        {parents ? (
          <div className="mt-2 space-y-2 text-sm">
            <p className="texte-doux">L'histoire avance avec les jours où Leonie ouvre l'application (un ami, des câlins, un œuf à réchauffer 5 jours, un bébé). Le braconnier vient au plus une fois par jour, au hasard (filet, fusil ou course) : Plume gagne toujours. On peut le toucher ou le lancer avec le doigt : il rebondit, a des bobos, puis s'en va en boitant.</p>
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2 font-bold">
              Le braconnier peut venir
              <input type="checkbox" checked={h.braconnier} onChange={(e) => permettreBraconnier(e.target.checked)} className="size-5 accent-[#f3d48a]" />
            </label>
            <p className="pt-1 font-extrabold">Faire venir le braconnier (sur l'accueil) :</p>
            <div className="grid grid-cols-3 gap-2">
              {([["filet", "🦋 Le filet"], ["fusil", "🛡️ Le fusil"], ["course", "💨 La course"]] as const).map(([id, nom]) => (
                <button key={id} type="button" onClick={() => { window.location.hash = "#/"; window.dispatchEvent(new CustomEvent("leonie-braconnier", { detail: { scenario: id } })); }} className="rounded-2xl bg-white/10 py-2.5 text-xs font-extrabold">{nom}</button>
              ))}
            </div>
            <button type="button" onClick={avancerUnJour} className="w-full rounded-2xl bg-white/10 py-2.5 font-extrabold">Faire avancer l'histoire d'un jour</button>
            <button type="button" onClick={() => { if (window.confirm("Recommencer toute l'histoire de Plume depuis le début ?")) recommencerHistoire(); }} className="w-full rounded-2xl bg-white/5 py-2 text-xs font-extrabold texte-doux">Recommencer l'histoire</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

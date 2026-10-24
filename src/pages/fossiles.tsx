import { useState } from "react";
import { EXTINCTIONS, FOSSILES_TRIES } from "@/data/fossiles";
import { ESPECES, FAMILLES } from "@/data/catalogue";
import { Entete, Titre } from "@/components/entete";
import { Vignette } from "@/components/icone";
import { Portrait } from "@/components/portrait";
import { Texte } from "@/components/mot";

const DISPARUES = ESPECES.filter((e) => e.disparue).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

export function FossilesPage() {
  const [onglet, setOnglet] = useState<"anciens" | "extinctions" | "recents">("anciens");
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre sous="Des os, des coquilles, des dents, des empreintes. Les fossiles racontent la vie d'avant.">Albums et fossiles</Titre>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {([["anciens", "Fossiles"], ["extinctions", "Extinctions"], ["recents", "Disparus récemment"]] as const).map(([id, nom]) => (
          <button key={id} type="button" onClick={() => setOnglet(id)} className={`min-h-12 rounded-2xl px-2 text-sm font-extrabold ${onglet === id ? "bouton-bois" : "bg-card"}`}>{nom}</button>
        ))}
      </div>
      {onglet === "anciens" ? (
        <ul className="mt-5 space-y-3">
          {FOSSILES_TRIES.map((f) => (
            <li key={f.id} className="rounded-3xl bg-card px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="medaillon block size-16 shrink-0 overflow-hidden"><Vignette image={f.image} icone={f.icone} /></span>
                <div><p className="font-display text-2xl leading-tight">{f.nom}</p>{f.latin ? <p className="text-sm italic">{f.latin}</p> : null}<p className="text-sm font-extrabold text-[#8d4e1f]">{f.groupe}</p></div>
              </div>
              <p className="mt-2 text-sm font-extrabold">{f.quand} · {f.ou}</p>
              <p className="mt-1 leading-relaxed"><Texte>{f.texte}</Texte></p>
              {f.anecdote ? <p className="mt-2 rounded-2xl bg-[#fff8ea] px-3 py-2 text-sm">✨ <Texte>{f.anecdote}</Texte></p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {onglet === "extinctions" ? (
        <ol className="mt-5 space-y-3">
          {EXTINCTIONS.map((x) => (
            <li key={x.nom} className="rounded-3xl bg-card px-4 py-3"><p className="font-display text-xl">{x.nom}</p><p className="text-sm font-extrabold text-[#8d4e1f]">{x.quand}</p><p className="mt-1"><Texte>{x.texte}</Texte></p></li>
          ))}
        </ol>
      ) : null}
      {onglet === "recents" ? (
        <>
          <p className="mt-4 text-center">{DISPARUES.length} mammifères ont disparu depuis l'an 1500.</p>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {DISPARUES.map((e) => (
              <li key={e.id}><a href={`#/mammiferes/e-${e.id}`} className="flex h-full flex-col items-center rounded-3xl bg-card px-2 py-3 text-center"><span className="medaillon block size-20 overflow-hidden"><Portrait id={e.id} /></span><span className="mt-2 text-sm font-extrabold leading-tight">{e.nom}</span><span className="text-xs">{FAMILLES[e.famille]?.nom}</span></a></li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}

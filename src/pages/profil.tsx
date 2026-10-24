import { useState } from "react";
import { LuCrown } from "react-icons/lu";
import { PAR_ID } from "@/data/catalogue";
import { lireScore, lireVues } from "@/lib/carnet";
import { relancerHorsLigne, useHorsLigne } from "@/lib/hors-ligne";
import { permettreInternet, useInternet } from "@/lib/internet";
import { Portrait } from "@/components/portrait";

export function ProfilPage() {
  const vues = lireVues();
  const score = lireScore();
  const hl = useHorsLigne();
  return (
    <main className="mx-auto max-w-xl px-4 pt-6">
      <div className="medaillon-or mx-auto grid size-24 place-items-center bg-[radial-gradient(circle_at_35%_30%,#3f2470,#140a26)] text-[#f3d48a]"><LuCrown className="size-12" aria-hidden="true" /></div>
      <h1 className="titre-or mt-4 text-center text-4xl">Princesse Leonie</h1>
      <p className="mt-2 text-center">Ton carnet. Il reste sur cet appareil.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <a href="#/cartes" className="rounded-3xl bg-card px-4 py-4"><p className="font-display text-3xl">{vues.length}</p><p>fiches et cartes vues</p></a>
        <a href="#/jouer" className="rounded-3xl bg-card px-4 py-4"><p className="font-display text-3xl">{score.points} / {score.parties}</p><p>bonnes réponses</p></a>
      </div>
      {vues.length ? (
        <>
          <h2 className="titre-or mt-6 text-center text-2xl">Déjà vus</h2>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {vues.slice(-24).reverse().map((id) => {
              const e = PAR_ID.get(id);
              return e ? <li key={id}><a href={`#/mammiferes/e-${id}`} className="block text-center"><span className="medaillon mx-auto block size-14 overflow-hidden"><Portrait id={id} /></span><span className="mt-1 block text-[11px] font-extrabold leading-tight">{e.nom}</span></a></li> : null;
            })}
          </ul>
        </>
      ) : null}
      <section className="carte-nuit mt-6 rounded-3xl px-4 py-4">
        <p className="font-display text-xl text-[#f3d48a]">Sans Internet</p>
        {hl.possible ? (
          <>
            <p className="mt-1 text-sm">Photos et cris enregistrés sur l'appareil : {hl.prets} sur {hl.total}.</p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#0f0a20]"><div className="h-full bg-[#f3d48a]" style={{ width: `${hl.total ? (hl.prets / hl.total) * 100 : 0}%` }} /></div>
            {hl.prets < hl.total && !hl.enCours ? <button type="button" onClick={relancerHorsLigne} className="bouton-bois mt-3 rounded-full px-4 py-2 font-extrabold">Finir d'enregistrer</button> : null}
          </>
        ) : (
          <p className="mt-1 text-sm">L'application s'enregistre sur l'appareil quand on l'ouvre depuis son adresse Internet.</p>
        )}
      </section>
      <CoinParents />
      <a href="#/sources" className="mt-4 block text-center font-extrabold underline">Sources et crédits</a>
    </main>
  );
}

function CoinParents() {
  const { permis } = useInternet();
  const [reponse, setReponse] = useState("");
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="mt-4 rounded-3xl bg-card px-4 py-4">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="w-full text-left font-display text-xl">Coin des parents</button>
      {ouvert ? (
        <div className="mt-2 text-sm">
          <p>Certaines options ont besoin d'une connexion : les trajets GPS (Movebank). Elles sont éteintes. Rien ne se télécharge tout seul.</p>
          {permis ? (
            <button type="button" onClick={() => permettreInternet(false)} className="bouton-bois mt-3 rounded-full px-4 py-2 font-extrabold">Éteindre les options Internet</button>
          ) : (
            <div className="mt-3">
              <label className="block font-extrabold">Pour un adulte : combien font 13 × 7 ?</label>
              <input inputMode="numeric" value={reponse} onChange={(e) => setReponse(e.target.value)} className="mt-1 w-28 rounded-xl border border-[#a07a45] bg-white px-3 py-2" />
              <button type="button" disabled={reponse.trim() !== "91"} onClick={() => permettreInternet(true)} className="bouton-bois ml-2 rounded-full px-4 py-2 font-extrabold disabled:opacity-40">Allumer</button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

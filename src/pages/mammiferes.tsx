import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { FAMILLES, GROUPES, PAR_ID, chercher, chercherFamilles, chercherOrdres, especesDe, famillesDe, ordreDe, type Espece } from "@/data/catalogue";
import { FICHES } from "@/data/fiches";
import { REGIMES, VIE } from "@/data/fiches-vie";
import crisConnus from "@/data/cris.json";
import creditsCris from "@/data/credits-cris.json";
import suivi from "@/data/suivi-gps.json";
import { Entete, Titre } from "@/components/entete";
import { Portrait } from "@/components/portrait";
import { Mot, Texte } from "@/components/mot";
import { Ecouter } from "@/components/voix";
import { CarteMonde } from "@/components/carte-monde";
import { voirAnimal } from "@/lib/carnet";

const CRIS = new Set(crisConnus as string[]);
const CREDITS = creditsCris as Record<string, string>;
const SUIVI = suivi as Record<string, { etude: number }[]>;
const FICHE_PAR_LATIN = new Map(FICHES.map((f) => [f.latin, f]));

export function MammiferesPage({ id, params }: { id?: string; params: URLSearchParams }) {
  if (!id) return <Index groupe={params.get("groupe") ?? ""} />;
  if (id.startsWith("o-")) return <Ordre id={id.slice(2)} />;
  if (id.startsWith("f-")) return <Famille id={id.slice(2)} />;
  if (id.startsWith("e-")) return <Fiche id={id.slice(2)} />;
  return <Inconnue />;
}

function Index({ groupe }: { groupe: string }) {
  const [texte, setTexte] = useState("");
  const [ouvert, setOuvert] = useState(groupe || "carnivores");
  const cherche = texte.trim().length >= 2;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre sous="Dix groupes pour s'y retrouver. Dedans, les vrais ordres, puis les familles, puis les espèces.">Mammifères</Titre>
      <label className="mt-4 flex items-center gap-2 rounded-full bg-card px-4 py-3">
        <LuSearch className="size-5 text-[#6d5648]" aria-hidden="true" />
        <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Un animal, une famille, un ordre" className="w-full bg-transparent text-base outline-none placeholder:text-[#8a7462]" />
      </label>
      {cherche ? (
        <div className="mt-4 space-y-2">
          {chercherOrdres(texte).map((o) => <Ligne key={o.id} vers={`/mammiferes/o-${o.id}`} titre={o.nom} sous={o.phrase} />)}
          {chercherFamilles(texte).map(([code, f]) => <Ligne key={code} vers={`/mammiferes/f-${code}`} titre={f.nom} sous={`${f.n} espèces`} />)}
          {chercher(texte).map((e) => <LigneEspece key={e.id} espece={e} />)}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {GROUPES.map((g) => {
            const actif = ouvert === g.id;
            return (
              <li key={g.id} className="rounded-3xl bg-card">
                <button type="button" onClick={() => setOuvert(actif ? "" : g.id)} className="w-full px-4 py-4 text-left" aria-expanded={actif}>
                  <span className="block font-display text-2xl">{g.nom}</span>
                  <span className="mt-1 block text-sm">{g.phrase}</span>
                </button>
                {actif ? (
                  <div className="space-y-3 px-3 pb-4">
                    {g.ordres.map((o) => (
                      <div key={o}>
                        <a href={`#/mammiferes/o-${o}`} className="mb-1 block px-1 text-sm font-extrabold text-[#8d4e1f] underline">{ordreDe(o)?.nom}</a>
                        <ul className="space-y-2">
                          {famillesDe(o).map(([code, f]) => (
                            <li key={code}><a href={`#/mammiferes/f-${code}`} className="flex justify-between rounded-2xl bg-[#fff8ea] px-3 py-3 font-extrabold"><span>{f.nom}</span><span className="text-[#8d4e1f]">{f.n}</span></a></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Ligne({ vers, titre, sous }: { vers: string; titre: string; sous: string }) {
  return <a href={`#${vers}`} className="block rounded-3xl bg-card px-4 py-3"><span className="block font-display text-xl">{titre}</span><span className="text-sm">{sous}</span></a>;
}

function LigneEspece({ espece }: { espece: Espece }) {
  return (
    <a href={`#/mammiferes/e-${espece.id}`} className="flex items-center gap-3 rounded-3xl bg-card px-3 py-2">
      <span className="block size-14 shrink-0 overflow-hidden rounded-full"><Portrait id={espece.id} /></span>
      <span><span className="block font-extrabold">{espece.nom}</span><span className="block text-sm">{FAMILLES[espece.famille]?.nom}</span></span>
    </a>
  );
}

function Ordre({ id }: { id: string }) {
  const ordre = ordreDe(id);
  if (!ordre) return <Inconnue />;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/mammiferes" />
      <Titre sous={ordre.phrase}>{ordre.nom}</Titre>
      <p className="text-center text-sm texte-doux">{id}</p>
      <ul className="mt-5 space-y-3">
        {famillesDe(id).map(([code, f]) => (
          <li key={code}><a href={`#/mammiferes/f-${code}`} className="flex items-center justify-between rounded-3xl bg-card px-4 py-4"><span><span className="block font-display text-2xl">{f.nom}</span><span className="text-sm">{code}</span></span><span className="font-extrabold text-[#8d4e1f]">{f.n}</span></a></li>
        ))}
      </ul>
    </main>
  );
}

function Famille({ id }: { id: string }) {
  const famille = FAMILLES[id];
  const [montre, setMontre] = useState(40);
  if (!famille) return <Inconnue />;
  const especes = especesDe(id);
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide={`/mammiferes/o-${famille.ordre}`} />
      <p className="mt-4 text-center text-sm font-extrabold text-[#f0d090]"><a href="#/mammiferes" className="underline">Mammifères</a> · <a href={`#/mammiferes/o-${famille.ordre}`} className="underline">{ordreDe(famille.ordre)?.nom}</a></p>
      <Titre sous={`${especes.length} espèces`}>{famille.nom}</Titre>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {especes.slice(0, montre).map((e) => (
          <li key={e.id}>
            <a href={`#/mammiferes/e-${e.id}`} className="flex h-full flex-col items-center rounded-3xl bg-card px-2 py-4 text-center">
              <span className="medaillon block size-24 overflow-hidden"><Portrait id={e.id} /></span>
              <span className="mt-2 font-extrabold leading-tight">{e.nom}</span>
              {e.disparue ? <span className="text-xs font-extrabold text-[#8d4e1f]">Disparue</span> : null}
            </a>
          </li>
        ))}
      </ul>
      {montre < especes.length ? (
        <button type="button" onClick={() => setMontre((n) => n + 40)} className="bouton-bois au-dessus-barre mt-4 w-full rounded-2xl py-4 font-display text-xl">Voir la suite ({especes.length - montre} encore)</button>
      ) : null}
    </main>
  );
}

function Fiche({ id }: { id: string }) {
  const e = PAR_ID.get(id);
  useEffect(() => { if (e) voirAnimal(e.id); }, [e]);
  if (!e) return <Inconnue />;
  const grande = FICHE_PAR_LATIN.get(e.latin);
  const vie = grande ? VIE[grande.id] : undefined;
  const regime = e.regime ? REGIMES[e.regime as keyof typeof REGIMES] : vie ? REGIMES[vie.regime] : undefined;
  const etude = (SUIVI[e.latin] ?? []).length > 0;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide={`/mammiferes/f-${e.famille}`} />
      <div className={`mx-auto mt-4 grid justify-center gap-4 ${grande?.imageFemelle ? "grid-cols-2" : "grid-cols-1"}`}>
        <figure className="text-center">
          <span className="medaillon-or mx-auto block size-40 overflow-hidden"><Portrait id={e.id} src={grande?.image} /></span>
          {grande?.imageFemelle ? <figcaption className="mt-2 text-sm">Mâle</figcaption> : null}
        </figure>
        {grande?.imageFemelle ? (
          <figure className="text-center"><span className="medaillon-or mx-auto block size-40 overflow-hidden"><Portrait id={e.id} src={grande.imageFemelle} /></span><figcaption className="mt-2 text-sm">Femelle</figcaption></figure>
        ) : null}
      </div>
      <Titre>{e.nom}</Titre>
      <p className="text-center italic texte-doux">{e.latin}</p>
      <p className="text-center text-sm"><Mot id="nom-scientifique" /></p>
      {e.langue === "en" ? <p className="mt-1 text-center text-sm texte-doux">Nom anglais : le nom français n'est pas encore dans l'application.</p> : null}
      <p className="mt-2 text-center text-sm font-extrabold text-[#f0d090]"><a href={`#/mammiferes/f-${e.famille}`} className="underline">{FAMILLES[e.famille]?.nom}</a> · <a href={`#/mammiferes/o-${e.ordre}`} className="underline">{ordreDe(e.ordre)?.nom}</a></p>
      <div className="mt-3 flex justify-center">
        <Ecouter gros texte={[e.nom, grande?.phrase, `Répartition. ${vie?.ou ?? e.ou}`, regime ? `Régime. ${regime.nom}. ${regime.explique}` : "Régime. Mal connu.", `Portée. ${vie?.bebes ?? e.portee ?? "Mal connu."}`, `Gestation. ${vie?.gestation ?? e.gestation ?? "Mal connu."}`, `Longévité. ${grande?.vie ?? e.longevite ?? "Mal connu."}`, `Statut. ${e.statut ?? "Non évalué."}`].filter(Boolean).join(" ")} />
      </div>
      {e.disparue ? <p className="mt-2 text-center font-extrabold text-[#f3a0a0]">Espèce disparue.</p> : null}
      {e.domestique ? <p className="mt-2 text-center font-extrabold">Espèce domestique.</p> : null}
      {grande ? <p className="mx-auto mt-3 max-w-sm text-center text-lg"><Texte>{grande.phrase}</Texte></p> : null}
      <dl className="mt-5 space-y-3">
        <Bloc mot="repartition" texte={vie?.ou ?? e.ou}>{e.pays?.length ? <div className="mt-2"><CarteMonde pays={e.pays} /><p className="mt-1 text-xs">Pays en or : d'après la Mammal Diversity Database. Les très petites îles n'apparaissent pas.</p></div> : null}</Bloc>
        <div className="rounded-3xl bg-card px-4 py-3">
          <Mot id="regime" />
          <div className="mt-1 font-display text-2xl">{regime ? regime.nom : "Mal connu."}</div>
          {regime ? <div className="mt-1"><Texte>{regime.explique}</Texte></div> : null}
          {vie?.mange ?? e.mange ? <div className="mt-2"><Mot id="alimentation" /> : <Texte>{(vie?.mange ?? e.mange)!}</Texte></div> : null}
        </div>
        <Bloc mot="milieu" texte={e.milieu ?? "Mal connu."} />
        <Bloc mot="portee" texte={vie?.bebes ?? e.portee ?? "Mal connu."} />
        <Bloc mot="gestation" texte={vie?.gestation ?? e.gestation ?? "Mal connu."} />
        {grande ? (<><Bloc mot="male" texte={grande.male} /><Bloc mot="femelle" texte={grande.femelle} /><Bloc mot="dimorphisme" texte={grande.difference} /></>) : <Bloc mot="masse" texte={e.masse ?? "Mal connu."} />}
        <Bloc mot="longevite" texte={grande?.vie ?? e.longevite ?? "Mal connu."} />
        <Bloc mot="statut" texte={e.statut ?? "Non évalué."} />
        <div className="rounded-3xl bg-card px-4 py-3">
          <Mot id="cri" />
          {CRIS.has(e.id) ? (<><audio controls preload="none" src={`s/${e.id}.mp3`} className="mt-2 w-full" /><p className="mt-1 text-xs">Licence : {CREDITS[e.id] ?? "libre"}</p></>) : <p className="mt-1 font-display text-3xl">NC <span className="font-sans text-base font-extrabold">non connu</span></p>}
        </div>
        <div className="rounded-3xl bg-card px-4 py-3">
          <p className="font-extrabold">{etude ? "Une étude GPS publique existe" : "Pas de suivi GPS enregistré"}</p>
          {etude ? <a href={`#/suivi/${e.id}`} className="bouton-bois mt-2 inline-block rounded-full px-4 py-2 font-extrabold">Voir les déplacements</a> : <p className="text-sm">Aucune étude publique n'est notée pour cet animal.</p>}
        </div>
      </dl>
      <p className="mx-auto mt-4 max-w-sm text-center text-sm texte-doux">Classement : Mammal Diversity Database. Les chiffres sont des mesures publiées. « Mal connu » veut dire que la mesure n'est pas publiée.</p>
    </main>
  );
}

function Bloc({ mot, texte, children }: { mot: string; texte: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card px-4 py-3">
      <dt><Mot id={mot} /></dt>
      <dd className="mt-1 leading-relaxed"><Texte>{texte}</Texte>{children}</dd>
    </div>
  );
}

function Inconnue() {
  return <main className="mx-auto max-w-xl px-4 py-10 text-center"><p className="titre-or text-3xl">Cette page n'existe pas.</p><a href="#/mammiferes" className="mt-4 inline-block rounded-2xl bg-card px-5 py-3 font-extrabold">Retour</a></main>;
}

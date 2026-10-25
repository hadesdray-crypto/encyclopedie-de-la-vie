import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { FAMILLES, GROUPES, PAR_ID, especesDe, famillesDe, ordreDe, type Espece } from "@/data/catalogue";
import { chercherTout } from "@/lib/recherche";
import { FICHES } from "@/data/fiches";
import { REGIMES, VIE } from "@/data/fiches-vie";
import crisConnus from "@/data/cris.json";
import creditsCris from "@/data/credits-cris.json";
import suivi from "@/data/suivi-gps.json";
import { Entete, Titre } from "@/components/entete";
import { Portrait } from "@/components/portrait";
import { Mot, Texte } from "@/components/mot";
import { Ecouter } from "@/components/voix";
import { Videos } from "@/components/videos";
import { PhotoEntiere } from "@/components/photo-entiere";
import { CarteMonde, ilesDe } from "@/components/carte-monde";
import { voirAnimal } from "@/lib/carnet";
import { LuBaby, LuEar, LuHeartPulse, LuHourglass, LuMapPin, LuSatellite, LuScale, LuShieldCheck, LuTreePine, LuUsers, LuUtensils } from "react-icons/lu";
import type { IconType } from "react-icons";
import { lireFiche } from "@/lib/recompenses";
import { plumeRegarde } from "@/lib/caractere";
import { comparerPoids } from "@/lib/poids";
import wikipedia from "@/data/wikipedia-fr.json";
import galerie from "@/data/galerie.json";
import crisVerifies from "@/data/cris-verifies.json";
import creditsPhotos from "@/data/credits-photos.json";
import estimations from "@/data/estimations.json";

type Estimation = { t: string; n: number; p?: number; accord?: number };
const ESTIMATIONS = estimations as Record<string, Record<string, Estimation>>;

/** Petite ligne grise sous une valeur estimée : on dit toujours que c'est une estimation. */
function NoteEstimation({ est }: { est: Estimation }) {
  return (
    <span className="mt-0.5 block text-xs font-extrabold text-[#7a5a8a]">
      Estimé d'après {est.n} espèces du même genre{est.p ? ` · ± ${est.p} %` : ""}
    </span>
  );
}

const CRIS = new Set(crisConnus as string[]);
type Credit = { auteur: string; licence: string; source: string };
const CREDITS = creditsCris as Record<string, string | Credit>;
const WIKI = wikipedia as Record<string, { texte: string; titre: string }>;
const GALERIE = galerie as Record<string, Credit[]>;
const VERIFIES = new Set(crisVerifies as string[]);
const CREDITS_PHOTOS = creditsPhotos as Record<string, Credit>;

function credit(c: string | Credit | undefined) {
  if (!c) return "Licence libre";
  if (typeof c === "string") return `Licence : ${c}`;
  return `${c.auteur.replace(/, some rights reserved/i, "")} — ${c.licence}`;
}
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
        <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Un animal, une race, une famille…" className="w-full bg-transparent text-base outline-none placeholder:text-[#8a7462]" />
      </label>
      {cherche ? (
        <div className="mt-4 space-y-2">
          {chercherTout(texte).slice(0, 40).map((r) =>
            r.sorte === "espece" ? <LigneEspece key={r.id} espece={PAR_ID.get(r.id)!} /> : <Ligne key={`${r.sorte}-${r.id}`} vers={r.vers} titre={r.nom} sous={r.sous} />,
          )}
          <a href={`#/chercher?q=${encodeURIComponent(texte)}`} className="block text-center font-extrabold underline">Chercher aussi par catégorie ou sur la carte</a>
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
              {e.langue === "en" ? <span className="text-[10px] font-bold text-[#8a7462]">nom anglais · français en cours</span> : e.langue === "trad" ? <span className="text-[10px] font-bold text-[#8a7462]">nom traduit</span> : null}
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
  useEffect(() => {
    if (e) {
      voirAnimal(e.id);
      lireFiche(e.id);
      plumeRegarde(e);
    }
  }, [e]);
  if (!e) return <Inconnue />;
  const grande = FICHE_PAR_LATIN.get(e.latin);
  const vie = grande ? VIE[grande.id] : undefined;
  const est = ESTIMATIONS[e.id] ?? {};
  const regimeEstime = !e.regime && !vie && est.regime ? est.regime : undefined;
  const regime = e.regime ? REGIMES[e.regime as keyof typeof REGIMES] : vie ? REGIMES[vie.regime] : regimeEstime ? REGIMES[regimeEstime.t as keyof typeof REGIMES] : undefined;
  /** La mesure publiée ; sinon l'estimation (marquée) ; sinon « Mal connu ». */
  const valeur = (cle: string, mesure: string | undefined) =>
    mesure ? { texte: mesure } : est[cle] ? { texte: est[cle].t, note: est[cle] } : { texte: "Mal connu." };
  const etude = (SUIVI[e.latin] ?? []).length > 0;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide={`/mammiferes/f-${e.famille}`} />
      <div className={`mx-auto mt-4 grid justify-center gap-4 ${grande?.imageFemelle ? "grid-cols-2" : "grid-cols-1"}`}>
        <figure className="text-center">
          <PhotoEntiere src={grande?.image ?? `m/${e.id}.webp`} id={e.id} nom={e.nom} className="medaillon-or mx-auto block size-40 overflow-hidden"><Portrait id={e.id} src={grande?.image} /></PhotoEntiere>
          <p className="mt-1 text-[11px] texte-doux">Touche la photo pour la voir en entier.</p>
          {grande?.imageFemelle ? <figcaption className="mt-2 text-sm">Mâle</figcaption> : null}
        </figure>
        {grande?.imageFemelle ? (
          <figure className="text-center"><PhotoEntiere src={grande.imageFemelle} id={e.id} nom={e.nom} className="medaillon-or mx-auto block size-40 overflow-hidden"><Portrait id={e.id} src={grande.imageFemelle} /></PhotoEntiere><figcaption className="mt-2 text-sm">Femelle</figcaption></figure>
        ) : null}
      </div>
      <Titre>{e.nom}</Titre>
      <p className="text-center italic texte-doux">{e.latin}</p>
      <p className="text-center text-sm"><Mot id="nom-scientifique" /></p>
      {e.langue === "trad" ? <p className="mx-auto mt-1 max-w-sm text-center text-sm texte-doux">Pas encore de nom français officiel : nom traduit de l'anglais (« {e.nomAnglais} ») par Claude, l'IA qui a fabriqué l'application.</p> : e.langue !== "fr" ? <p className="mt-1 text-center text-sm texte-doux">Nom anglais : le nom français est en cours.</p> : null}
      <p className="mt-2 text-center text-sm font-extrabold text-[#f0d090]"><a href={`#/mammiferes/f-${e.famille}`} className="underline">{FAMILLES[e.famille]?.nom}</a> · <a href={`#/mammiferes/o-${e.ordre}`} className="underline">{ordreDe(e.ordre)?.nom}</a></p>
      <div className="mt-3 flex justify-center">
        <Ecouter gros texte={[e.nom, grande?.phrase, `Répartition. ${vie?.ou ?? e.ou}`, regime ? `Régime. ${regime.nom}. ${regime.explique}` : "Régime. Mal connu.", `Portée. ${vie?.bebes ?? e.portee ?? "Mal connu."}`, `Gestation. ${vie?.gestation ?? e.gestation ?? "Mal connu."}`, `Longévité. ${grande?.vie ?? e.longevite ?? "Mal connu."}`, `Statut. ${e.statut ?? "Non évalué."}`].filter(Boolean).join(" ")} />
      </div>
      {e.disparue ? <p className="mt-2 text-center font-extrabold text-[#f3a0a0]">Espèce disparue.</p> : null}
      {e.domestique ? <p className="mt-2 text-center font-extrabold">Espèce domestique.</p> : null}
      {e.latin === "Canis familiaris" || e.latin === "Felis catus" ? (
        <a href={`#/compagnons/${e.latin === "Canis familiaris" ? "chiens" : "chats"}`} className="bouton-bois mx-auto mt-3 flex w-max items-center gap-2 rounded-full px-5 py-2.5 font-extrabold">
          {e.latin === "Canis familiaris" ? "Toutes les races de chiens" : "Toutes les races de chats"} · le carnet de Plume
        </a>
      ) : null}
      {grande ? <p className="mx-auto mt-3 max-w-sm text-center text-lg"><Texte>{grande.phrase}</Texte></p> : null}
      {CREDITS_PHOTOS[e.id] && !grande ? <p className="mt-1 text-center text-[11px] texte-doux">Photo : {credit(CREDITS_PHOTOS[e.id])}</p> : null}
      {GALERIE[e.id]?.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {GALERIE[e.id].map((c, i) => (
            <figure key={i}>
              <PhotoEntiere src={`g/${e.id}-${i + 1}.webp`} id={e.id} nom={e.nom} className="block w-full"><img src={`g/${e.id}-${i + 1}.webp`} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_8px_18px_rgba(0,0,0,.4)]" /></PhotoEntiere>
              <figcaption className="mt-1 text-[10px] leading-tight texte-doux">{credit(c)}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {WIKI[e.id] ? (
        <section className="carte-nuit mt-4 rounded-3xl px-4 py-3">
          <p className="font-display text-lg text-[#f3d48a]">Ce qu'en dit Wikipédia</p>
          <p className="mt-1 leading-relaxed">{WIKI[e.id].texte}</p>
          <p className="mt-1 text-[11px] texte-doux">Extrait de l'article « {WIKI[e.id].titre} », Wikipédia en français, licence CC BY-SA.</p>
        </section>
      ) : null}
      <Videos id={e.id} nom={e.nom} latin={e.latin} />
      <dl className="mt-5 space-y-3">
        <Bloc mot="repartition" texte={vie?.ou ?? e.ou}>{e.pays?.length || ilesDe(e.ou).length ? <div className="mt-2"><CarteMonde pays={e.pays ?? []} ou={e.ou} /><p className="mt-1 text-xs">Pays en or, petites îles en point doré : d'après la Mammal Diversity Database.</p></div> : null}</Bloc>
        <Rubrique mot="regime">
          <div className="font-display text-2xl">{regime ? (regimeEstime ? `Sans doute ${regime.nom.toLowerCase()}` : regime.nom) : "Mal connu."}</div>
          {regimeEstime ? <NoteEstimation est={regimeEstime} /> : null}
          {regime ? <div className="mt-1"><Texte>{regime.explique}</Texte></div> : null}
          {vie?.mange ?? e.mange ? <div className="mt-2"><Mot id="alimentation" /> : <Texte>{(vie?.mange ?? e.mange)!}</Texte></div> : null}
        </Rubrique>
        <BlocValeur mot="milieu" v={valeur("milieu", e.milieu)} />
        <BlocValeur mot="portee" v={valeur("portee", vie?.bebes ?? e.portee)} />
        <BlocValeur mot="gestation" v={valeur("gestation", vie?.gestation ?? e.gestation)} />
        {grande ? (<><Bloc mot="male" texte={grande.male} /><Bloc mot="femelle" texte={grande.femelle} /><Bloc mot="dimorphisme" texte={grande.difference} /></>) : <BlocValeur mot="masse" v={valeur("masse", e.masse)}>{comparerPoids(e.masse ?? est.masse?.t) ? <p className="mt-1 text-sm font-extrabold text-[#8d4e1f]">{comparerPoids(e.masse ?? est.masse?.t)}</p> : null}</BlocValeur>}
        <BlocValeur mot="longevite" v={valeur("longevite", grande?.vie ?? e.longevite)} />
        <Bloc mot="statut" texte={e.statut ?? "Non évalué."} />
        <Rubrique mot="cri">
          {CRIS.has(e.id) ? (<><audio controls preload="none" src={`s/${e.id}.mp3`} className="mt-2 w-full" /><p className="mt-1 text-xs">{credit(CREDITS[e.id])}</p>{VERIFIES.has(e.id) ? <p className="mt-1 text-xs font-extrabold">Cri vérifié : enregistrement d'archive scientifique.</p> : <p className="mt-1 text-xs font-extrabold text-[#8d4e1f]">Pas encore vérifié : on entend peut-être d'autres animaux derrière.</p>}</>) : <p className="font-display text-3xl">NC <span className="font-sans text-base font-extrabold">non connu</span></p>}
        </Rubrique>
        <Rubrique mot="gps" titre={<span className="font-extrabold">Suivi GPS</span>}>
          <p className="font-extrabold">{etude ? "Une étude GPS publique existe" : "Pas de suivi GPS enregistré"}</p>
          {etude ? <a href={`#/suivi/${e.id}`} className="bouton-bois mt-2 inline-block rounded-full px-4 py-2 font-extrabold">Voir les déplacements</a> : <p className="text-sm">Aucune étude publique n'est notée pour cet animal.</p>}
        </Rubrique>
      </dl>
      <p className="mx-auto mt-4 max-w-sm text-center text-sm texte-doux">Classement : Mammal Diversity Database. Les chiffres sont des mesures publiées. « Estimé » veut dire calculé d’après les espèces cousines, avec l’écart entre elles en pourcentage. « Mal connu » : ni mesure, ni estimation fiable.</p>
    </main>
  );
}

/** Un pictogramme par rubrique, pour repérer l'information d'un coup d'œil. */
const PICTOS: Record<string, { icone: IconType; couleur: string }> = {
  repartition: { icone: LuMapPin, couleur: "#2f7d6d" },
  regime: { icone: LuUtensils, couleur: "#b5562a" },
  milieu: { icone: LuTreePine, couleur: "#3f7f2f" },
  portee: { icone: LuBaby, couleur: "#c2457a" },
  gestation: { icone: LuHourglass, couleur: "#7a4fd0" },
  masse: { icone: LuScale, couleur: "#8d4e1f" },
  male: { icone: LuScale, couleur: "#2f5fa8" },
  femelle: { icone: LuScale, couleur: "#c2457a" },
  dimorphisme: { icone: LuUsers, couleur: "#7a4fd0" },
  longevite: { icone: LuHeartPulse, couleur: "#c23a3a" },
  statut: { icone: LuShieldCheck, couleur: "#2f7d6d" },
  cri: { icone: LuEar, couleur: "#b5562a" },
  gps: { icone: LuSatellite, couleur: "#2f5fa8" },
};

function Picto({ mot }: { mot: string }) {
  const p = PICTOS[mot];
  if (!p) return null;
  const Icone = p.icone;
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.18)]" style={{ background: p.couleur }} aria-hidden="true">
      <Icone className="size-6" />
    </span>
  );
}

/** Une rubrique de fiche : le pictogramme à gauche, le vrai mot, puis le texte. */
function Rubrique({ mot, titre, children }: { mot: string; titre?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-3xl bg-card px-3 py-3">
      <Picto mot={mot} />
      <div className="min-w-0 flex-1">
        <dt className="text-sm">{titre ?? <Mot id={mot} />}</dt>
        <dd className="mt-0.5 leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

function BlocValeur({ mot, v, children }: { mot: string; v: { texte: string; note?: Estimation }; children?: React.ReactNode }) {
  return (
    <Rubrique mot={mot}>
      <Texte>{v.texte}</Texte>
      {v.note ? <NoteEstimation est={v.note} /> : null}
      {children}
    </Rubrique>
  );
}

function Bloc({ mot, texte, children }: { mot: string; texte: string; children?: React.ReactNode }) {
  return (
    <Rubrique mot={mot}>
      <Texte>{texte}</Texte>
      {children}
    </Rubrique>
  );
}

function Inconnue() {
  return <main className="mx-auto max-w-xl px-4 py-10 text-center"><p className="titre-or text-3xl">Cette page n'existe pas.</p><a href="#/mammiferes" className="mt-4 inline-block rounded-2xl bg-card px-5 py-3 font-extrabold">Retour</a></main>;
}

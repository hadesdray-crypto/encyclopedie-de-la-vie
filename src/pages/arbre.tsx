import { useState } from "react";
import { LuChevronRight, LuCircleHelp, LuFlaskConical, LuScale, LuSearch, LuSparkles } from "react-icons/lu";
import { ETAPES, IMAGES_EVO, SAVOIR, cheminVers, parentDe, type Etape, type Savoir } from "@/data/arbre";
import { Entete } from "@/components/entete";
import { Vignette } from "@/components/icone";
import { Texte } from "@/components/mot";
import { Ecouter } from "@/components/voix";

const TAILLE: Record<Etape["poids"], string> = { 1: "w-[19%]", 2: "w-[22%]", 3: "w-[25%]" };

export function ArbrePage({ id }: { id?: string }) {
  const etape = ETAPES[id ?? "terre"];
  if (!etape) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <p className="titre-or text-3xl">Cette branche n'existe pas.</p>
        <a href="#/arbre" className="mt-4 inline-block rounded-2xl bg-card px-5 py-3 font-extrabold">Revenir au début</a>
      </main>
    );
  }
  const chemin = cheminVers(etape.id);
  const enfants = etape.suite.map((e) => ETAPES[e]);
  const parent = parentDe(etape.id);

  return (
    <main className="fade-up mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />

      <a href={`#/evolution?ici=e:${etape.id}`} className="bouton-bois mt-3 flex items-center justify-center gap-2 rounded-2xl py-2.5 font-extrabold"><LuSearch className="size-4" aria-hidden="true" /> Voir tout l'arbre et chercher un animal</a>

      <ol className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-extrabold" aria-label="Le chemin depuis la Terre">
        {chemin.map((pas, i) => (
          <li key={pas} className="flex items-center gap-1">
            {i > 0 ? <LuChevronRight className="size-3 text-[#e8c98a]" aria-hidden="true" /> : null}
            {pas === etape.id ? (
              <span className="rounded-full bg-[#3a2158] px-2 py-1 text-[#f3d48a]">{ETAPES[pas].nom}</span>
            ) : (
              <a href={`#/arbre/${pas}`} className="rounded-full px-2 py-1 text-[#e7d7be] underline decoration-dotted underline-offset-2">
                {ETAPES[pas].nom}
              </a>
            )}
          </li>
        ))}
      </ol>

      <div className="relative mx-auto mt-2 aspect-square w-full max-w-[26rem]">
        {enfants.length > 0 ? (
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
            {enfants.map((enfant, i) => {
              const a = angle(enfants.length, i);
              return (
                <line
                  key={enfant.id}
                  x1="50"
                  y1="50"
                  x2={50 + Math.cos(a) * 37}
                  y2={50 + Math.sin(a) * 37}
                  stroke="#e8c98a"
                  strokeOpacity=".45"
                  strokeWidth={enfant.poids * 0.7}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        ) : null}
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${enfants.length ? "w-[34%]" : "w-[52%]"}`}>
          <div className="medaillon glow aspect-square overflow-hidden">
            <Vignette image={etape.image} icone={etape.icone} />
          </div>
        </div>
        {enfants.map((enfant, i) => {
          const a = angle(enfants.length, i);
          const bas = Math.sin(a) > -0.3;
          return (
            <a
              key={enfant.id}
              href={`#/arbre/${enfant.id}`}
              className={`orbit bob-x absolute ${TAILLE[enfant.poids]}`}
              style={{ left: `${50 + Math.cos(a) * 37}%`, top: `${50 + Math.sin(a) * 37}%`, animationDelay: `${i * 0.15}s` }}
            >
              <span className="medaillon block aspect-square overflow-hidden">
                <Vignette image={enfant.image} icone={enfant.icone} />
              </span>
              <span
                className={`absolute left-1/2 w-28 -translate-x-1/2 text-center text-[13px] font-extrabold leading-tight text-[#f6edd8] drop-shadow ${bas ? "top-full mt-1" : "bottom-full mb-1"}`}
              >
                {enfant.nom}
              </span>
            </a>
          );
        })}
      </div>

      {IMAGES_EVO[etape.id] ? (
        <p className="mt-3 text-center text-[11px] texte-doux">
          <span className="mr-1 rounded-full bg-[#3a2266] px-2 py-0.5 font-extrabold text-[#f3d48a]">
            {IMAGES_EVO[etape.id].sorte === "photo" ? "Vraie photo" : IMAGES_EVO[etape.id].sorte === "fossile" ? "Vrai fossile" : IMAGES_EVO[etape.id].sorte === "reconstitution" ? "Reconstitution d'après les fossiles" : "Modèle scientifique"}
          </span>
          {IMAGES_EVO[etape.id].auteur} · {IMAGES_EVO[etape.id].licence}
        </p>
      ) : null}
      <h1 className="titre-or mt-4 text-center text-4xl leading-none text-balance">{etape.nom}</h1>
      {etape.quand ? <p className="mt-2 text-center font-extrabold text-[#f0d090]">{etape.quand}</p> : null}
      <div className="mt-3 flex justify-center">
        <Badge savoir={etape.savoir} />
      </div>
      <div className="mt-3 flex justify-center">
        <Ecouter gros texte={aLire(etape)} />
      </div>

      <section className="mt-4 rounded-3xl bg-card px-4 py-4 text-lg leading-relaxed">
        <Texte>{etape.texte}</Texte>
        {etape.especes ? <p className="mt-2 text-base font-extrabold text-[#8d4e1f]">{etape.especes}</p> : null}
      </section>

      {etape.anecdote ? (
        <section className="carte-nuit mt-3 rounded-3xl px-4 py-4">
          <p className="flex items-center gap-2 font-display text-xl text-[#f3d48a]">
            <LuSparkles className="size-5" aria-hidden="true" />
            Le savais-tu ?
          </p>
          <p className="mt-1 text-base leading-relaxed">
            <Texte>{etape.anecdote}</Texte>
          </p>
        </section>
      ) : null}

      <CommentOnSait etape={etape} />

      {etape.reserve ? (
        <p className="mt-3 rounded-3xl border border-dashed border-[#e8c98a]/60 px-4 py-3 text-center text-base">{etape.reserve}</p>
      ) : null}

      {etape.catalogue ? (
        <a href={`#${etape.catalogue.vers}`} className="bois mt-4 block rounded-2xl px-4 py-4 text-center font-display text-2xl">
          {etape.catalogue.label}
        </a>
      ) : null}

      {enfants.length === 0 ? (
        <div className="mt-4 text-center">
          <p className="text-base texte-doux">Cette branche s'arrête ici pour l'instant.</p>
          {parent ? (
            <a href={`#/arbre/${parent}`} className="mt-2 inline-block rounded-2xl bg-card px-5 py-3 font-extrabold">
              Revenir à « {ETAPES[parent].nom} »
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-center text-base texte-doux">Touche une branche autour du cercle pour continuer.</p>
      )}

    </main>
  );
}

function angle(n: number, i: number) {
  if (n === 1) return Math.PI / 2;
  if (n === 2) return i === 0 ? Math.PI * 0.8 : Math.PI * 0.2;
  return -Math.PI / 2 + (i / n) * Math.PI * 2;
}

const ICONE_SAVOIR: Record<Savoir, typeof LuScale> = { preuve: LuFlaskConical, scenario: LuCircleHelp, debat: LuScale };
const COULEUR_SAVOIR: Record<Savoir, string> = {
  preuve: "bg-[#d9f0c8] text-[#1f4a1a]",
  scenario: "bg-[#f3e2c2] text-[#5a3a12]",
  debat: "bg-[#e6d6f6] text-[#3f1f66]",
};

export function Badge({ savoir }: { savoir: Savoir }) {
  const Icone = ICONE_SAVOIR[savoir];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${COULEUR_SAVOIR[savoir]}`}>
      <Icone className="size-4" aria-hidden="true" />
      {SAVOIR[savoir].titre}
    </span>
  );
}

function CommentOnSait({ etape }: { etape: Etape }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="mt-3 rounded-3xl bg-card px-4 py-3">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="flex min-h-11 w-full items-center gap-2 text-left font-display text-xl" aria-expanded={ouvert}>
        <LuSearch className="size-5" aria-hidden="true" />
        Comment on le sait ?
      </button>
      {ouvert ? (
        <div className="pb-1 text-base leading-relaxed">
          <p className="text-sm font-extrabold text-[#8d4e1f]">{SAVOIR[etape.savoir].phrase}</p>
          <p className="mt-2">
            <Texte>{etape.comment}</Texte>
          </p>
        </div>
      ) : null}
    </section>
  );
}

function aLire(e: Etape) {
  return [e.nom, e.quand ?? "", e.texte, e.especes ?? "", e.anecdote ? `Le savais-tu ? ${e.anecdote}` : "", `${SAVOIR[e.savoir].titre}. ${e.comment}`]
    .filter(Boolean)
    .join(" ");
}

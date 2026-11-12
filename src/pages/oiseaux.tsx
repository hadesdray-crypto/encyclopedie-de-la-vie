// Les oiseaux : photos (Wikimedia Commons), cris (GBIF) et texte (Wikipédia), avec l'auteur et la licence de chaque fichier.
// Les données arrivent par le script scripts/donnees/oiseaux.py ; ce qui manque est écrit « Non connu ».
import { useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";
import donnees from "@/data/oiseaux.json";
import { Entete, Titre } from "@/components/entete";
import { voyagesDe } from "@/pages/voyageurs";

type Photo = { src: string; sexe: "male" | "femelle" | null; auteur: string; licence: string; page: string };
type Cri = { src: string; sorte: "chant" | "cri"; auteur: string; licence: string; page: string };
type Oiseau = { id: string; latin: string; nom: string; intro: string; wiki?: string; photos: Photo[]; cris: Cri[] };
const OISEAUX = (donnees as { oiseaux: Oiseau[] }).oiseaux;
const sansAccent = (t: string) => t.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
const SEXE = { male: "Le mâle", femelle: "La femelle" } as const;

export function OiseauxPage({ id }: { id?: string }) {
  const fiche = id ? OISEAUX.find((o) => o.id === id) : undefined;
  if (id) return fiche ? <Fiche o={fiche} /> : <Absent />;
  return <Liste />;
}

function Absent() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/oiseaux" />
      <Titre>Oiseau introuvable</Titre>
    </main>
  );
}

function Liste() {
  const [q, setQ] = useState("");
  const vus = useMemo(() => OISEAUX.filter((o) => !q || sansAccent(`${o.nom} ${o.latin}`).includes(sansAccent(q))), [q]);
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-4">
      <Entete siVide="/animaux" />
      <Titre sous="Photos, cris et voyages. Chaque photo et chaque cri porte le nom de son auteur.">Les oiseaux</Titre>
      <label className="relative mx-auto mt-4 block max-w-sm">
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#8d4e1f]" aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un oiseau" aria-label="Chercher un oiseau" className="min-h-12 w-full rounded-full bg-card pl-10 pr-4 text-[#2a1c14]" />
      </label>
      {OISEAUX.length === 0 ? (
        <section className="carte-nuit mt-5 rounded-3xl px-4 py-4 text-center">
          <p className="font-display text-2xl text-[#f3d48a]">Les oiseaux arrivent</p>
          <p className="mt-2">Les fiches se remplissent avec de vraies photos et de vrais cris. Elles apparaîtront à la prochaine mise à jour.</p>
          <a href="#/migrations" className="bouton-bois mt-4 inline-block rounded-full px-5 py-2.5 font-extrabold">Voir les migrations</a>
        </section>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3">
          {vus.map((o) => (
            <li key={o.id}>
              <a href={`#/oiseaux/${o.id}`} className="block rounded-3xl bg-card p-2 text-[#2a1c14]">
                {o.photos[0] ? <img src={o.photos[0].src} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" /> : <span className="block aspect-[4/3] rounded-2xl bg-[#e9dcc8]" />}
                <span className="mt-1 block font-display text-lg leading-tight">{o.nom}</span>
                <span className="block text-xs italic">{o.latin}</span>
                {o.cris.length ? <span className="block text-xs font-black text-[#8d4e1f]">{o.cris.length} cri{o.cris.length > 1 ? "s" : ""}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mx-auto mt-5 max-w-sm text-center text-[11px] texte-doux">Photos : Wikimedia Commons. Cris : GBIF (Xeno-canto, iNaturalist). Seulement des licences libres.</p>
    </main>
  );
}

export const oiseauParId = (id: string) => OISEAUX.find((o) => o.id === id);
export const oiseauParLatin = (latin: string) => OISEAUX.find((o) => o.latin === latin);
export function Fiche({ o, integre = false }: { o: Oiseau; integre?: boolean }) {
  const voyages = voyagesDe("", o.latin);
  const Racine = integre ? "div" : "main";
  return (
    <Racine className={integre ? "pt-2" : "mx-auto max-w-xl px-4 pb-8 pt-4"}>
      {integre ? null : <Entete siVide="/oiseaux" />}
      <Titre sous={o.latin}>{o.nom}</Titre>
      {o.photos.map((p) => (
        <figure key={p.src} className="mt-4">
          <img src={p.src} alt={o.nom} className="mx-auto aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_10px_22px_rgba(0,0,0,.45)]" />
          <figcaption className="mt-1 text-center text-[11px] texte-doux">{p.sexe ? `${SEXE[p.sexe]} · ` : ""}<a href={p.page} target="_blank" rel="noreferrer">{p.auteur} · {p.licence}</a></figcaption>
        </figure>
      ))}
      <section className="carte-nuit mt-4 rounded-3xl px-4 py-4">
        <h2 className="font-display text-2xl text-[#f3d48a]">Son cri</h2>
        {o.cris.length ? (
          o.cris.map((c, k) => (
            <div key={c.src} className="mt-3">
              <p className="text-sm font-extrabold">{k === 0 && c.sorte === "chant" ? "Son chant (le cri d'amour)" : "Un cri connu"}</p>
              <div className="lecteur-cri mt-1 rounded-full p-1.5"><audio controls preload="none" src={c.src} className="w-full" /></div>
              <p className="mt-1 text-xs"><a href={c.page} target="_blank" rel="noreferrer">{c.auteur} · {c.licence}</a></p>
            </div>
          ))
        ) : (
          <p className="mt-2 font-display text-3xl">NC <span className="font-sans text-base font-extrabold">non connu</span></p>
        )}
      </section>
      <section className="carte-nuit mt-4 rounded-3xl px-4 py-4">
        <h2 className="font-display text-2xl text-[#f3d48a]">À savoir</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed">{o.intro || "Non connu"}</p>
        {o.wiki ? <p className="mt-2 text-xs"><a href={o.wiki} target="_blank" rel="noreferrer">Source : Wikipédia en français</a></p> : null}
      </section>
      {voyages.length && !integre ? (
        <a href={`#/aventure?voyages=1&suivre=${encodeURIComponent(o.latin)}`} className="bouton-bois mt-4 block rounded-full px-5 py-3 text-center font-extrabold">Voir son vrai voyage ({voyages.length} suivi{voyages.length > 1 ? "s" : ""} par GPS)</a>
      ) : null}
    </Racine>
  );
}

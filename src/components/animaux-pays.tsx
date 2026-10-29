// Les animaux d'un pays, rangés pour une enfant : d'abord les stars (girafe, lion…),
// puis des sections bien visibles : sur la terre, dans les arbres, dans l'eau, dans les airs, les petites bêtes.
// Dans chaque section, le plus connu d'abord. Une recherche trouve « girafe » même si l'espèce s'appelle « Girafe du Nord ».
import { useMemo, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { Portrait, aUnePhoto } from "@/components/portrait";
import type { Espece } from "@/data/catalogue";

const sansAccent = (t: string) => t.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");

const FAMILLES_EAU = new Set([
  "Balaenidae", "Balaenopteridae", "Cetotheriidae", "Delphinidae", "Monodontidae", "Phocoenidae", "Iniidae", "Pontoporiidae",
  "Lipotidae", "Kogiidae", "Physeteridae", "Platanistidae", "Ziphiidae", "Eschrichtiidae", "Phocidae", "Otariidae", "Odobenidae",
  "Dugongidae", "Trichechidae",
]);
const ORDRES_PETITS = new Set(["Rodentia", "Lagomorpha", "Eulipotyphla", "Scandentia", "Dermoptera", "Macroscelidea", "Afrosoricida"]);

export type Milieu = "terre" | "arbres" | "eau" | "airs" | "petits";

export const SECTIONS: { id: Milieu; titre: string; emoji: string; phrase: string; couleur: string }[] = [
  { id: "terre", titre: "Sur la terre", emoji: "🦁", phrase: "Ils marchent, courent et galopent.", couleur: "from-[#8a5a2b] to-[#5b3a1c]" },
  { id: "arbres", titre: "Dans les arbres", emoji: "🐒", phrase: "Ils grimpent et sautent de branche en branche.", couleur: "from-[#3f7a3a] to-[#22501f]" },
  { id: "eau", titre: "Dans l'eau", emoji: "🐬", phrase: "Baleines, dauphins, phoques et lamantins.", couleur: "from-[#1f6fa8] to-[#123f6b]" },
  { id: "airs", titre: "Dans les airs", emoji: "🦇", phrase: "Les chauves-souris : les seuls mammifères qui volent vraiment.", couleur: "from-[#6a4ab0] to-[#3d2775]" },
  { id: "petits", titre: "Les petites bêtes", emoji: "🐭", phrase: "Souris, écureuils, lapins, hérissons et musaraignes.", couleur: "from-[#b0703a] to-[#7a4520]" },
];

export function milieuDe(e: Espece): Milieu {
  if (FAMILLES_EAU.has(e.famille) || e.latin === "Enhydra lutris" || e.milieu === "Surtout dans la mer.") return "eau";
  if (e.ordre === "Chiroptera" || e.milieu === "Surtout en vol.") return "airs";
  if (ORDRES_PETITS.has(e.ordre)) return "petits";
  if (e.ordre === "Primates" || e.milieu === "Surtout dans les arbres.") return "arbres";
  return "terre";
}

const PAR_PAGE = 8;

/** `animaux` est déjà rangé du plus connu au moins connu. */
export function AnimauxDuPays({ animaux, nomPays }: { animaux: Espece[]; nomPays: string }) {
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState<Record<string, number>>({});
  const t = sansAccent(q.trim());

  const trouves = useMemo(
    () => (t.length < 2 ? [] : animaux.filter((e) => sansAccent(`${e.nom} ${e.latin} ${e.nomAnglais ?? ""}`).includes(t))),
    [animaux, t],
  );
  const stars = useMemo(() => animaux.filter((e) => !e.domestique && e.latin !== "Homo sapiens" && aUnePhoto(e.id)).slice(0, 10), [animaux]);
  const parSection = useMemo(() => {
    const m = new Map<Milieu, Espece[]>();
    for (const e of animaux) {
      const s = milieuDe(e);
      if (!m.has(s)) m.set(s, []);
      m.get(s)!.push(e);
    }
    return m;
  }, [animaux]);

  return (
    <div>
      <label className="mt-3 flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 ring-1 ring-white/20 focus-within:ring-[#f3d48a]">
        <LuSearch className="size-4 shrink-0 text-[#f3d48a]" aria-hidden="true" />
        <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder={`Chercher un animal en ${nomPays}…`} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white placeholder:text-white/50 focus:outline-none" />
        {q ? <button type="button" aria-label="Effacer" onClick={() => setQ("")} className="grid size-7 place-items-center rounded-full bg-white/10"><LuX className="size-4" /></button> : null}
      </label>

      {t.length >= 2 ? (
        trouves.length ? (
          <Grille liste={trouves.slice(0, 40)} />
        ) : (
          <p className="mt-4 text-center text-sm texte-doux">Pas de « {q.trim()} » ici. Essaie un autre nom, ou un autre pays sur le globe.</p>
        )
      ) : (
        <>
          {stars.length ? (
            <div className="mt-4">
              <p className="font-display text-lg text-[#f3d48a]">⭐ Les stars du pays</p>
              <ul className="-mx-1 mt-2 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
                {stars.map((e, i) => (
                  <li key={e.id} className="w-28 shrink-0 snap-start">
                    <a href={`#/mammiferes/e-${e.id}`} className="block overflow-hidden rounded-2xl bg-[#2a1650] ring-2 ring-[#f3d48a]/70 transition-transform active:scale-95">
                      <span className="relative block aspect-[3/4] [&_img]:size-full [&_img]:object-cover">
                        <Portrait id={e.id} />
                        {i < 3 ? <span className="absolute left-1.5 top-1.5 rounded-full bg-[#f3d48a] px-1.5 text-[11px] font-black text-[#2a1650]">{["🥇", "🥈", "🥉"][i]}</span> : null}
                      </span>
                      <span className="block px-1.5 py-1.5 text-center text-xs font-extrabold leading-tight text-white">{e.nom}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {SECTIONS.filter((s) => parSection.get(s.id)?.length).map((s) => {
            const liste = parSection.get(s.id)!;
            const n = ouvert[s.id] ?? PAR_PAGE;
            return (
              <div key={s.id} className="mt-4">
                <div className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${s.couleur} px-3 py-2 ring-1 ring-white/15`}>
                  <span className="text-3xl leading-none" aria-hidden="true">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight text-white">{s.titre} <span className="text-sm font-bold text-[#f3d48a]">· {liste.length}</span></p>
                    <p className="text-[11px] leading-snug text-white/80">{s.phrase}</p>
                  </div>
                </div>
                <Grille liste={liste.slice(0, n)} />
                {n < liste.length ? (
                  <button type="button" onClick={() => setOuvert((o) => ({ ...o, [s.id]: n + 24 }))} className="bouton-bois mt-2 w-full rounded-2xl py-2.5 text-sm font-extrabold">
                    Voir les {liste.length - n} autres
                  </button>
                ) : n > PAR_PAGE ? (
                  <button type="button" onClick={() => setOuvert((o) => ({ ...o, [s.id]: PAR_PAGE }))} className="mt-2 w-full rounded-2xl bg-white/5 py-2 text-xs font-extrabold texte-doux">Replier</button>
                ) : null}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function Grille({ liste }: { liste: Espece[] }) {
  return (
    <ul className="mt-2 grid grid-cols-4 gap-x-1.5 gap-y-2.5">
      {liste.map((e) => (
        <li key={e.id} className="text-center">
          <a href={`#/mammiferes/e-${e.id}`} className="block transition-transform active:scale-95">
            <span className="medaillon-or mx-auto block aspect-square w-[92%] overflow-hidden [&_img]:size-full [&_img]:object-cover"><Portrait id={e.id} /></span>
            <span className="mt-1 block text-[11px] font-extrabold leading-tight">{e.nom}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

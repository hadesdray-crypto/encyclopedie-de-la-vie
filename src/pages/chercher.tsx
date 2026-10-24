import { useEffect, useMemo, useRef, useState } from "react";
import { LuCat, LuDog, LuGlobe, LuMap, LuSearch, LuShieldAlert, LuTrees, LuX } from "react-icons/lu";
import { GROUPES } from "@/data/catalogue";
import { REGIMES } from "@/data/fiches-vie";
import monde from "@/data/monde.json";
import { Entete } from "@/components/entete";
import { Portrait } from "@/components/portrait";
import { CONTINENTS, PAYS, aDesFiltres, chercherTout, type Filtres, type Resultat } from "@/lib/recherche";

/*
 * Chercher un animal : on écrit, et les animaux apparaissent tout de suite.
 * On peut aussi choisir une catégorie, ou toucher un pays sur la carte.
 * Les chiens et les chats (toutes les races) sont dedans, comme les autres animaux.
 */

const CONTOURS = (monde as { pays: Record<string, string> }).pays;
const PAR_PAGE = 30;

// Le cadre de chaque continent sur la carte (x = longitude + 180, y = 90 - latitude).
const CADRES: Record<string, [number, number, number, number]> = {
  Afrique: [158, 50, 236, 128],
  Europe: [152, 16, 226, 58],
  Asie: [205, 10, 330, 102],
  "Amérique du Nord": [10, 6, 132, 84],
  "Amérique du Sud": [92, 76, 150, 147],
  Océanie: [290, 88, 360, 140],
};

function vueDe(continent?: string) {
  if (!continent || !CADRES[continent]) return "0 12 360 150";
  const [x0, y0, x1, y1] = CADRES[continent];
  const w = x1 - x0;
  const h = Math.max(y1 - y0, w * 0.6);
  return `${x0} ${(y0 + y1) / 2 - h / 2} ${w} ${h}`;
}

const SORTES: { id: NonNullable<Filtres["sorte"]>; nom: string; icone: typeof LuDog }[] = [
  { id: "sauvages", nom: "Animaux sauvages", icone: LuTrees },
  { id: "chiens", nom: "Chiens", icone: LuDog },
  { id: "chats", nom: "Chats", icone: LuCat },
  { id: "menaces", nom: "Menacés", icone: LuShieldAlert },
];

export function ChercherPage({ params }: { params: URLSearchParams }) {
  const [texte, setTexte] = useState(params.get("q") ?? "");
  const [f, setF] = useState<Filtres>({});
  const [carte, setCarte] = useState(false);
  const [n, setN] = useState(PAR_PAGE);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Le clavier s'ouvre tout de suite, sauf quand on arrive pour la carte.
    if (!params.get("carte")) champ.current?.focus();
    else setCarte(true);
  }, []);
  useEffect(() => setN(PAR_PAGE), [texte, f]);
  // Quand on choisit un pays sur la carte, on descend jusqu'aux animaux trouvés.
  const liste = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (f.pays) liste.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [f.pays]);

  const actif = texte.trim().length > 0 || aDesFiltres(f);
  const resultats = useMemo(() => (actif ? chercherTout(texte, f) : []), [texte, f, actif]);
  const changer = (x: Partial<Filtres>) => setF((avant) => ({ ...avant, ...x }));

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <h1 className="titre-or mt-3 text-center text-4xl">Chercher un animal</h1>

      <label className="sticky top-2 z-20 mt-3 flex items-center gap-2 rounded-full border-2 border-[#e8c98a] bg-card px-4 py-2.5 text-[#2a1c14] shadow-[0_8px_20px_rgba(0,0,0,.4)]">
        <LuSearch className="size-6 shrink-0 text-[#8d4e1f]" aria-hidden="true" />
        <input
          ref={champ}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écris un nom : lion, caniche, chat…"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none placeholder:font-normal placeholder:text-[#8a7462]"
        />
        {texte ? (
          <button type="button" onClick={() => { setTexte(""); champ.current?.focus(); }} aria-label="Effacer" className="grid size-8 place-items-center rounded-full bg-[#e7d3b0]">
            <LuX className="size-4" />
          </button>
        ) : null}
      </label>

      {/* Quel genre d'animal */}
      <div className="mt-3 flex flex-wrap gap-2">
        {SORTES.map(({ id, nom, icone: Icone }) => (
          <Puce key={id} actif={f.sorte === id} onClick={() => changer({ sorte: f.sorte === id ? undefined : id })}>
            <Icone className="size-4" aria-hidden="true" /> {nom}
          </Puce>
        ))}
        <Puce actif={carte || !!f.pays || !!f.continent} onClick={() => setCarte((c) => !c)}>
          <LuMap className="size-4" aria-hidden="true" /> Sur la carte
        </Puce>
      </div>

      {/* Catégories : grands groupes et régime */}
      <details className="mt-2 rounded-2xl bg-[#2a1844]/70 px-3 py-2">
        <summary className="cursor-pointer font-extrabold text-[#f0d090]">Plus de catégories</summary>
        <p className="mt-2 text-xs font-extrabold text-[#e7d7ff]">Le groupe</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {GROUPES.map((g) => (
            <Puce key={g.id} petite actif={f.groupe === g.id} onClick={() => changer({ groupe: f.groupe === g.id ? undefined : g.id })}>{g.nom}</Puce>
          ))}
        </div>
        <p className="mt-2 text-xs font-extrabold text-[#e7d7ff]">Ce qu'il mange</p>
        <div className="mt-1 flex flex-wrap gap-1.5 pb-1">
          {Object.entries(REGIMES).map(([id, r]) => (
            <Puce key={id} petite actif={f.regime === id} onClick={() => changer({ regime: f.regime === id ? undefined : id })}>{r.nom}</Puce>
          ))}
        </div>
      </details>

      {carte ? <CarteChoix f={f} changer={changer} /> : null}

      {/* Ce qui est choisi, et le nombre d'animaux trouvés */}
      <div ref={liste} className="scroll-mt-24" />
      {actif ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="font-extrabold text-[#f3d48a]">
            {resultats.length ? `${resultats.length} résultat${resultats.length > 1 ? "s" : ""}` : "Rien trouvé"}
          </p>
          {aDesFiltres(f) ? (
            <button type="button" onClick={() => setF({})} className="rounded-full bg-[#3a2266] px-3 py-1 text-xs font-extrabold text-[#e7d7ff]">
              Tout effacer
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm texte-doux">
          Écris le début d'un nom : les animaux apparaissent tout de suite. Même avec une petite faute, on les trouve !
        </p>
      )}

      {actif && !resultats.length ? (
        <p className="mt-2 rounded-2xl bg-[#fff8ea] px-3 py-2 text-sm font-bold text-[#4a2a8a]">
          Essaie un autre nom, ou enlève une catégorie.
        </p>
      ) : null}

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {resultats.slice(0, n).map((r) => (
          <li key={`${r.sorte}-${r.id}`}>
            <Carte r={r} />
          </li>
        ))}
      </ul>
      {resultats.length > n ? (
        <button type="button" onClick={() => setN(n + PAR_PAGE)} className="bouton-bois mx-auto mt-4 block rounded-full px-6 py-3 font-extrabold">
          Voir la suite ({resultats.length - n})
        </button>
      ) : null}
    </main>
  );
}

function Puce({ actif, onClick, children, petite = false }: { actif: boolean; onClick: () => void; children: React.ReactNode; petite?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-extrabold ${petite ? "px-2.5 py-1 text-xs" : "min-h-10 px-3.5 text-sm"} ${actif ? "bg-[#f3d48a] text-[#2a1c14]" : "bg-card text-[#2a1c14]"}`}
    >
      {children}
    </button>
  );
}

function Carte({ r }: { r: Resultat }) {
  const etiquette = r.sorte === "ordre" ? "Grand groupe" : r.sorte === "famille" ? "Famille" : null;
  return (
    <a href={`#${r.vers}`} className="flex h-full items-center gap-2 rounded-2xl bg-card px-2 py-2 text-[#2a1c14]">
      <span className="block size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#d9b56a]">
        {r.sorte === "espece" ? (
          <Portrait id={r.id} />
        ) : r.photo ? (
          <img src={r.photo} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-[#3a2266] text-[#f3d48a]">
            {r.sorte === "chien" ? <LuDog className="size-6" /> : r.sorte === "chat" ? <LuCat className="size-6" /> : <LuGlobe className="size-6" />}
          </span>
        )}
      </span>
      <span className="min-w-0">
        {etiquette ? <span className="block text-[10px] font-black uppercase tracking-wide text-[#8d4e1f]">{etiquette}</span> : null}
        <span className="block text-[14px] font-extrabold leading-tight">{r.nom}</span>
        <span className="block truncate text-[11px] leading-tight text-[#6d5648]">{r.sous}</span>
      </span>
    </a>
  );
}

/** La carte : on touche un continent pour zoomer, puis un pays. */
function CarteChoix({ f, changer }: { f: Filtres; changer: (x: Partial<Filtres>) => void }) {
  const vue = vueDe(f.continent);
  return (
    <section className="carte-nuit mt-3 rounded-3xl px-3 py-3">
      <p className="text-sm font-extrabold text-[#f0d090]">Touche un continent, puis un pays.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CONTINENTS.map((c) => (
          <Puce key={c} petite actif={f.continent === c} onClick={() => changer({ continent: f.continent === c ? undefined : c, pays: undefined })}>{c}</Puce>
        ))}
      </div>
      <svg viewBox={vue} className="mt-2 w-full rounded-2xl bg-[#14214a] transition-all" role="img" aria-label="Carte du monde : touche un pays">
        {Object.entries(CONTOURS).map(([code, d]) => {
          const choisi = f.pays === code;
          const dansContinent = !f.continent || PAYS[code]?.c === f.continent;
          return (
            <path
              key={code}
              d={d}
              onClick={() => {
                const c = PAYS[code]?.c;
                changer({ pays: choisi ? undefined : code, continent: c && (CONTINENTS as readonly string[]).includes(c) ? c : f.continent });
              }}
              fill={choisi ? "#f3c35a" : dansContinent ? "#5b6fa8" : "#2c3866"}
              stroke="#0f1838"
              strokeWidth=".3"
              className="cursor-pointer"
            >
              <title>{PAYS[code]?.n ?? code}</title>
            </path>
          );
        })}
      </svg>
      {f.pays ? (
        <p className="mt-2 text-center font-display text-xl text-[#f3d48a]">
          {PAYS[f.pays]?.n ?? f.pays}
          <button type="button" onClick={() => changer({ pays: undefined })} className="ml-2 align-middle text-xs font-extrabold text-[#e7d7ff] underline">
            enlever
          </button>
        </p>
      ) : f.continent ? (
        <p className="mt-2 text-center text-sm">Continent : {f.continent}. Touche un pays pour choisir.</p>
      ) : null}
      <p className="mt-1 text-[11px] texte-doux">Pays où vit l'animal : Mammal Diversity Database. Pour les chiens et les chats : leur pays d'origine.</p>
    </section>
  );
}

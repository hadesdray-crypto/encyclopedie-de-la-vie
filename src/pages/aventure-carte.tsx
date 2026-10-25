// L'Aventure : d'abord le globe. Deux onglets :
// « Où vivent-ils ? » : on touche un pays (ou on le cherche) et on voit tous les animaux qui y vivent ;
// « Les voyages » : les vrais trajets GPS des animaux suivis par des scientifiques.
import { useEffect, useMemo, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { Entete, Titre } from "@/components/entete";
import { Globe, cadrerPays } from "@/components/globe";
import { Portrait, aUnePhoto } from "@/components/portrait";
import { ESPECES, FAMILLES, GROUPES, groupeDeOrdre, type Espece } from "@/data/catalogue";
import { NOMS_PAYS } from "@/data/pays-noms";
import { plumeDit } from "@/lib/plume";
import { VoyageursPage } from "@/pages/voyageurs";

const sansAccent = (t: string) => t.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");

// Pour chaque pays : les espèces qui y vivent (répartition de la Mammal Diversity Database).
let INDEX: Map<string, Espece[]> | null = null;
function especesDuPays(code: string) {
  if (!INDEX) {
    INDEX = new Map();
    for (const e of ESPECES) for (const c of e.pays ?? []) {
      if (!INDEX.has(c)) INDEX.set(c, []);
      INDEX.get(c)!.push(e);
    }
    // D'abord les animaux sauvages qui ont un nom français et une photo ; les animaux domestiques à la fin.
    for (const l of INDEX.values()) l.sort((a, b) => Number(!!a.domestique) - Number(!!b.domestique) || Number(b.langue === "fr") - Number(a.langue === "fr") || Number(aUnePhoto(b.id)) - Number(aUnePhoto(a.id)) || a.nom.localeCompare(b.nom, "fr"));
  }
  return INDEX.get(code) ?? [];
}

export function AventureCartePage({ params }: { params: URLSearchParams }) {
  const [onglet, setOnglet] = useState<"pays" | "voyages">(params.get("voyages") ? "voyages" : "pays");
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre sous={onglet === "pays" ? "Touche un pays pour voir les animaux qui y vivent." : "De vrais trajets, suivis par GPS par des scientifiques."}>Aventure</Titre>
      <div role="tablist" className="mx-auto mt-3 grid w-full max-w-sm grid-cols-2 gap-1 rounded-full bg-[#2a1844] p-1 ring-1 ring-[#e8c98a]/40">
        {([["pays", "Où vivent-ils ?"], ["voyages", "Les voyages"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={onglet === id} onClick={() => setOnglet(id)} className={`min-h-10 rounded-full text-sm font-extrabold ${onglet === id ? "bg-[#f3d48a] text-[#2a1650]" : "text-[#f3d48a]"}`}>
            {label}
          </button>
        ))}
      </div>
      {onglet === "pays" ? <OuViventIls /> : <div className="mt-2"><VoyageursPage integre /></div>}
    </main>
  );
}

function OuViventIls() {
  const [pays, setPays] = useState<string | null>(null);
  const [vers, setVers] = useState<{ lon: number; lat: number; zoom: number; n: number } | null>(null);
  const [q, setQ] = useState("");
  const [cherche, setCherche] = useState(false);
  const [groupe, setGroupe] = useState<string | null>(null);
  const [montre, setMontre] = useState(30);

  useEffect(() => {
    const t = window.setTimeout(() => plumeDit("Touche un pays sur le globe : je te montre tous les animaux qui y vivent !", 5000), 1000);
    return () => window.clearTimeout(t);
  }, []);

  const choisir = (code: string | null, centrer = false) => {
    setPays(code);
    setGroupe(null);
    setMontre(30);
    setCherche(false);
    setQ("");
    if (code && centrer) {
      const c = cadrerPays(code);
      if (c) setVers((v) => ({ ...c, n: (v?.n ?? 0) + 1 }));
    }
  };

  const resultats = useMemo(() => {
    const t = sansAccent(q.trim());
    if (t.length < 2) return [];
    return Object.entries(NOMS_PAYS).filter(([, n]) => sansAccent(n).includes(t)).sort((a, b) => Number(sansAccent(b[1]).startsWith(t)) - Number(sansAccent(a[1]).startsWith(t))).slice(0, 8);
  }, [q]);

  const tous = pays ? especesDuPays(pays) : [];
  const groupesIci = GROUPES.filter((g) => tous.some((e) => g.ordres.includes(e.ordre)));
  const liste = groupe ? tous.filter((e) => groupeDeOrdre(e.ordre)?.id === groupe) : tous;

  return (
    <section>
      {/* Chercher un pays */}
      <div className="relative mt-3">
        {cherche ? (
          <label className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5">
            <LuSearch className="size-5 text-[#6d5648]" aria-hidden="true" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un pays…" className="w-full bg-transparent outline-none placeholder:text-[#8a7462]" />
            <button type="button" aria-label="Fermer la recherche" onClick={() => { setCherche(false); setQ(""); }}><LuX className="size-5 text-[#6d5648]" /></button>
          </label>
        ) : (
          <button type="button" onClick={() => setCherche(true)} className="ml-auto flex min-h-10 items-center gap-2 rounded-full bg-[#2a1844] px-4 text-sm font-extrabold text-[#f3d48a] ring-1 ring-[#e8c98a]/50">
            <LuSearch className="size-4" aria-hidden="true" /> Chercher un pays
          </button>
        )}
        {cherche && resultats.length ? (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 rounded-2xl bg-card p-1 shadow-xl">
            {resultats.map(([code, nom]) => (
              <li key={code}>
                <button type="button" onClick={() => choisir(code, true)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-extrabold text-[#2a1c14]">
                  {nom} <span className="text-xs font-bold text-[#8d4e1f]">{especesDuPays(code).length} espèces</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-2 overflow-hidden rounded-3xl border-2 border-[#e8c98a]/60 bg-[#0b1230] shadow-[0_10px_22px_rgba(0,0,0,.45)]">
        <Globe traces={[]} choisi={null} vers={vers} onChoisir={() => {}} pays={pays} onPays={(c) => choisir(c, true)} />
      </div>

      {pays ? (
        <section className="carte-nuit mt-4 rounded-3xl px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-2xl leading-tight text-[#f3d48a]">{NOMS_PAYS[pays] ?? pays}</p>
              <p className="text-sm font-bold">{tous.length ? `${tous.length} espèces de mammifères y vivent.` : "Pas de mammifère noté pour ce pays."}</p>
            </div>
            <button type="button" aria-label="Fermer" onClick={() => choisir(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10"><LuX className="size-5" /></button>
          </div>
          {groupesIci.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => { setGroupe(null); setMontre(30); }} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${groupe === null ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>Tous</button>
              {groupesIci.map((g) => (
                <button key={g.id} type="button" onClick={() => { setGroupe(g.id); setMontre(30); }} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${groupe === g.id ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10"}`}>{g.nom}</button>
              ))}
            </div>
          ) : null}
          <ul className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3">
            {liste.slice(0, montre).map((e) => (
              <li key={e.id} className="text-center">
                <a href={`#/mammiferes/e-${e.id}`} className="block">
                  <span className="medaillon-or mx-auto block aspect-square w-[86%] overflow-hidden [&_img]:size-full [&_img]:object-cover"><Portrait id={e.id} /></span>
                  <span className="mt-1 block text-[12px] font-extrabold leading-tight">{e.nom}</span>
                  <span className="block text-[10px] leading-tight texte-doux">{FAMILLES[e.famille]?.nom}</span>
                </a>
              </li>
            ))}
          </ul>
          {montre < liste.length ? (
            <button type="button" onClick={() => setMontre((n) => n + 30)} className="bouton-bois mt-4 w-full rounded-2xl py-3 font-extrabold">Voir la suite ({liste.length - montre} encore)</button>
          ) : null}
          <p className="mt-3 text-[11px] texte-doux">Répartition : Mammal Diversity Database. Les petites îles ne sont pas sur le globe : on les trouve sur la fiche de chaque animal.</p>
        </section>
      ) : (
        <p className="mt-3 text-center text-sm texte-doux">Fais tourner le globe avec ton doigt, zoome avec deux doigts, et touche un pays.</p>
      )}
    </section>
  );
}

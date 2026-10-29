// L'Aventure : d'abord le globe. Deux onglets :
// « Où vivent-ils ? » : on touche un pays (ou on le cherche) et on voit tous les animaux qui y vivent ;
// « Les voyages » : les vrais trajets GPS des animaux suivis par des scientifiques.
import { useEffect, useMemo, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { RecherchePlein } from "@/components/recherche-plein";
import { CadreGlobe } from "@/components/cadre-globe";
import { Entete } from "@/components/entete";
import { Globe, cadrerListe, cadrerPays } from "@/components/globe";
import { Portrait, aUnePhoto } from "@/components/portrait";
import { ESPECES, type Espece } from "@/data/catalogue";
import { NOMS_PAYS } from "@/data/pays-noms";
import { plumeDit } from "@/lib/plume";
import { connu } from "@/lib/connu";
import { recitPays } from "@/lib/pays-infos";
import { definirEcran } from "@/lib/plume";
import { Ecouter } from "@/components/voix";
import { AnimauxDuPays } from "@/components/animaux-pays";
import { VoyageursPage, voyagesDe } from "@/pages/voyageurs";

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
    // Du plus connu au moins connu (visites Wikipédia) ; les animaux domestiques, présents partout, à la fin.
    for (const l of INDEX.values()) l.sort((a, b) => Number(!!a.domestique) - Number(!!b.domestique) || connu(b.id) - connu(a.id) || Number(b.langue === "fr") - Number(a.langue === "fr") || Number(aUnePhoto(b.id)) - Number(aUnePhoto(a.id)) || a.nom.localeCompare(b.nom, "fr"));
  }
  return INDEX.get(code) ?? [];
}

// Les animaux sauvages les plus connus (visites Wikipédia), pour commencer à explorer.
const CELEBRES = ESPECES.filter((e) => !e.domestique && e.pays?.length && e.langue === "fr" && aUnePhoto(e.id))
  .sort((a, b) => connu(b.id) - connu(a.id))
  .slice(0, 16);

export function AventureCartePage({ params }: { params: URLSearchParams }) {
  // « suivre » : on arrive depuis la fiche d'un animal pour voir son voyage.
  const latinSuivi = params.get("suivre");
  const [onglet, setOnglet] = useState<"pays" | "voyages">(params.get("voyages") || latinSuivi ? "voyages" : "pays");
  const [suivre, setSuivre] = useState<number | null>(() => (latinSuivi ? voyagesDe("", latinSuivi)[0]?.i ?? null : null));
  return (
    <main className="mx-auto max-w-xl pt-4">
      <div className="px-4"><Entete siVide="/" /></div>
      <h1 className="sr-only">La carte du monde</h1>
      <div role="tablist" className="mx-auto mt-2 grid w-[calc(100%-2rem)] max-w-sm grid-cols-2 gap-1 rounded-full bg-[#2a1844] p-1 ring-1 ring-[#e8c98a]/40">
        {([["pays", "Où vivent-ils ?"], ["voyages", "Les voyages"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={onglet === id} onClick={() => { setOnglet(id); setSuivre(null); }} className={`min-h-10 rounded-full text-sm font-extrabold transition-colors ${onglet === id ? "bg-[#f3d48a] text-[#2a1650]" : "text-[#f3d48a]"}`}>
            {label}
          </button>
        ))}
      </div>
      {onglet === "pays" ? <OuViventIls onVoyage={(i) => { setSuivre(i); setOnglet("voyages"); window.scrollTo({ top: 0 }); }} /> : <div className="mt-2"><VoyageursPage integre aMontrer={suivre} /></div>}
    </main>
  );
}

function OuViventIls({ onVoyage }: { onVoyage: (i: number) => void }) {
  const [pays, setPays] = useState<string | null>(null);
  const [vers, setVers] = useState<{ lon: number; lat: number; zoom: number; n: number } | null>(null);
  const [q, setQ] = useState("");
  const [cherche, setCherche] = useState(false);
  const [animal, setAnimal] = useState<Espece | null>(null);
  const [mode, setMode] = useState<"pays" | "animal">("pays");
  // La fenêtre se met toute seule en bandeau quand une fiche s'affiche ; on peut la changer à la main.
  const [force, setForce] = useState<boolean | null>(null);
  const petit = force ?? !!(pays || animal);
  useEffect(() => setForce(null), [pays, animal]);

  useEffect(() => {
    const t = window.setTimeout(() => plumeDit("Touche un pays sur le globe : je te montre tous les animaux qui y vivent !", 5000), 1000);
    return () => window.clearTimeout(t);
  }, []);

  const choisirAnimal = (e: Espece) => {
    setAnimal(e);
    setPays(null);
    setCherche(false);
    setQ("");
    const c = cadrerListe(e.pays ?? []);
    if (c) setVers((v) => ({ ...c, n: (v?.n ?? 0) + 1 }));
  };

  const choisir = (code: string | null, centrer = false) => {
    setAnimal(null);
    setPays(code);
    setCherche(false);
    setQ("");
    if (code && centrer) {
      const c = cadrerPays(code);
      if (c) setVers((v) => ({ ...c, n: (v?.n ?? 0) + 1 }));
    }
  };

  const animaux = useMemo(() => {
    const t = sansAccent(q.trim());
    if (mode !== "animal" || t.length < 2) return [];
    return ESPECES.filter((e) => e.pays?.length && sansAccent(`${e.nom} ${e.latin}`).includes(t))
      .sort((a, b) => Number(sansAccent(b.nom) === t) - Number(sansAccent(a.nom) === t) || Number(sansAccent(b.nom).startsWith(t)) - Number(sansAccent(a.nom).startsWith(t)) || connu(b.id) - connu(a.id) || Number(b.langue === "fr") - Number(a.langue === "fr") || a.nom.length - b.nom.length)
      .slice(0, 8);
  }, [q, mode]);

  const resultats = useMemo(() => {
    const t = sansAccent(q.trim());
    if (mode !== "pays" || t.length < 2) return [];
    return Object.entries(NOMS_PAYS).filter(([, n]) => sansAccent(n).includes(t)).sort((a, b) => Number(sansAccent(b[1]).startsWith(t)) - Number(sansAccent(a[1]).startsWith(t))).slice(0, 8);
  }, [q, mode]);

  const tous = pays ? especesDuPays(pays) : [];
  const recit = useMemo(() => (pays ? recitPays(pays, especesDuPays(pays)) : []), [pays]);
  // Plume peut toujours raconter ce qui est à l'écran : le pays ouvert, ou l'animal choisi.
  useEffect(() => {
    if (pays) {
      definirEcran({ id: `pays-${pays}`, titre: NOMS_PAYS[pays] ?? pays, etapes: recit });
      plumeDit("Touche « Écouter » : je te raconte ce pays !", 4000);
    } else if (animal) {
      const n = animal.pays?.length ?? 0;
      definirEcran({ id: `animal-${animal.id}`, titre: animal.nom, etapes: [`${animal.nom} vit dans ${n} pays : ils sont en or sur le globe.`, voyagesDe(animal.id, animal.latin).length ? "Des scientifiques l'ont suivi par GPS : touche « Voir son voyage GPS » pour voir son vrai trajet." : "Touche « Voir sa fiche » pour tout savoir sur lui.", "Touche un pays doré pour voir les autres animaux qui y vivent."] });
    } else definirEcran(null);
  }, [pays, animal?.id]);
  useEffect(() => () => definirEcran(null), []);

  const fermerRecherche = () => { setCherche(false); setQ(""); };
  const ligneAnimal = (e: Espece) => (
    <li key={e.id}>
      <button type="button" onClick={() => choisirAnimal(e)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left active:bg-white/10">
        <span className="medaillon-or block size-12 shrink-0 overflow-hidden [&_img]:size-full [&_img]:object-cover"><Portrait id={e.id} /></span>
        <span className="min-w-0 flex-1"><span className="block font-extrabold leading-tight text-white">{e.nom}</span><span className="block text-xs italic texte-doux">{e.latin} · {e.pays!.length} pays</span></span>
      </button>
    </li>
  );

  return (
    <section className="mt-2">
      {cherche ? (
        <RecherchePlein q={q} setQ={setQ} placeholder={mode === "pays" ? "Un pays…" : "Un animal…"} onFermer={fermerRecherche} vide={<p className="mt-6 text-center text-sm texte-doux">Rien trouvé. Essaie un autre nom.</p>}>
          {mode === "animal" && animaux.length ? <ul className="space-y-1">{animaux.map(ligneAnimal)}</ul> : mode === "pays" && resultats.length ? (
            <ul className="space-y-1">
              {resultats.map(([code, nom]) => (
                <li key={code}>
                  <button type="button" onClick={() => choisir(code, true)} className="flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-left font-extrabold text-white active:bg-white/10">
                    {nom} <span className="text-xs font-bold text-[#f3d48a]">{especesDuPays(code).length} espèces</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </RecherchePlein>
      ) : null}

      {/* Le globe dans sa fenêtre de laiton : en grand, ou en bandeau quand une fiche s'affiche. */}
      <CadreGlobe
        petit={petit}
        onBascule={() => setForce(!petit)}
        dessus={
          <div className="absolute bottom-2 left-2 flex gap-2">
            <button type="button" onClick={() => { setMode("pays"); setCherche(true); }} className="flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-sm font-extrabold text-white ring-1 ring-white/25 backdrop-blur-md">
              <LuSearch className="size-4" aria-hidden="true" /> Un pays
            </button>
            <button type="button" onClick={() => { setMode("animal"); setCherche(true); }} className="flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-sm font-extrabold text-white ring-1 ring-white/25 backdrop-blur-md">
              <LuSearch className="size-4" aria-hidden="true" /> Un animal
            </button>
          </div>
        }
      >
        <Globe traces={[]} choisi={null} vers={vers} onChoisir={() => {}} pays={pays} onPays={(c) => choisir(c, true)} surligne={animal?.pays ?? []} hauteur="h-full" />
      </CadreGlobe>

      {/* La fiche glisse par-dessus le globe quand on la fait défiler. */}
      <div className="relative z-10 px-3">
      {animal ? (
        <section className="carte-nuit apparait mt-1 rounded-[1.75rem] px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="medaillon-or block size-16 shrink-0 overflow-hidden [&_img]:size-full [&_img]:object-cover"><Portrait id={animal.id} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-tight text-[#f3d48a]">{animal.nom}</p>
              <p className="text-sm italic texte-doux">{animal.latin}</p>
              <p className="mt-1 text-sm font-bold">Il vit dans {animal.pays!.length} pays (en or sur le globe).</p>
            </div>
            <button type="button" aria-label="Fermer" onClick={() => setAnimal(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10"><LuX className="size-5" /></button>
          </div>
          <p className="mt-2 text-sm">{animal.pays!.map((c) => NOMS_PAYS[c] ?? c).sort((a, b) => a.localeCompare(b, "fr")).join(", ")}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(() => {
              const vs = voyagesDe(animal.id, animal.latin);
              return vs.length ? (
                <button type="button" onClick={() => onVoyage(vs[0].i)} className="rounded-full bg-[#f3d48a] px-4 py-2 font-extrabold text-[#2a1650]">
                  🧭 Voir son voyage GPS{vs.length > 1 ? ` (${vs.length})` : ""}
                </button>
              ) : null;
            })()}
            <a href={`#/mammiferes/e-${animal.id}`} className="bouton-bois inline-block rounded-full px-4 py-2 font-extrabold">Voir sa fiche</a>
          </div>
          <p className="mt-2 text-[11px] texte-doux">Touche un pays doré pour voir les autres animaux qui y vivent.</p>
        </section>
      ) : pays ? (
        <section className="carte-nuit apparait mt-1 rounded-[1.75rem] px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-2xl leading-tight text-[#f3d48a]">{NOMS_PAYS[pays] ?? pays}</p>
              <p className="text-sm font-bold">{tous.length ? `${tous.length} espèces de mammifères y vivent. Les stars d'abord !` : "Pas de mammifère noté pour ce pays."}</p>
            </div>
            <button type="button" aria-label="Fermer" onClick={() => choisir(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10"><LuX className="size-5" /></button>
          </div>
          {recit.length ? (
            <details className="mt-2 rounded-2xl bg-white/5 px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-extrabold text-[#f3d48a]">
                <span>🦉 Plume te raconte ce pays</span>
                <span className="text-xs texte-doux">Lire +</span>
              </summary>
              <div className="mt-1.5 space-y-1 text-[13px] leading-snug">{recit.map((p) => <p key={p}>{p}</p>)}</div>
              <p className="mt-1 text-[10px] texte-doux">Climat : d'après la latitude du pays. Animaux : Mammal Diversity Database. Les plus connus : visites Wikipédia.</p>
            </details>
          ) : null}
          {recit.length ? <div className="mt-2"><Ecouter texte={recit.join(" ")} /></div> : null}
          <AnimauxDuPays key={pays} animaux={tous} nomPays={NOMS_PAYS[pays] ?? "ce pays"} />
          <p className="mt-3 text-[11px] texte-doux">Répartition : Mammal Diversity Database. Les petites îles ne sont pas sur le globe : on les trouve sur la fiche de chaque animal.</p>
        </section>
      ) : (
        <section className="carte-nuit apparait mt-1 rounded-[1.75rem] px-3 py-3">
          <p className="px-1 font-display text-lg text-[#f3d48a]">Où vivent-ils ? Essaie avec…</p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {CELEBRES.map((e) => (
              <li key={e.id} className="w-[4.6rem] shrink-0 text-center">
                <button type="button" onClick={() => choisirAnimal(e)} className="block w-full active:scale-95 transition-transform">
                  <span className="medaillon-or mx-auto block size-16 overflow-hidden [&_img]:size-full [&_img]:object-cover"><Portrait id={e.id} /></span>
                  <span className="mt-1 block text-[11px] font-extrabold leading-tight">{e.nom}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-1 text-xs texte-doux">Ou touche un pays sur le globe pour voir tous ses animaux.</p>
        </section>
      )}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronRight, LuSearch, LuX } from "react-icons/lu";
import { Entete, Titre } from "@/components/entete";
import { Vignette } from "@/components/icone";
import { Portrait } from "@/components/portrait";
import { chercherArbre, cheminDe, dateEnClair, enfants, heureTerre, noeudEtape, type Noeud } from "@/lib/evolution";

const ETIQUETTE = { etape: "Étape", ordre: "Ordre", famille: "Famille", espece: "Espèce" } as const;

/** Le grand arbre de l'évolution : on cherche un animal, et l'arbre s'ouvre jusqu'à lui. */
export function EvolutionPage({ params }: { id?: string; params: URLSearchParams }) {
  const ici = params.get("ici");
  const racine = useMemo(() => noeudEtape("terre"), []);
  const [ouverts, setOuverts] = useState<Set<string>>(() => {
    const debut = new Set<string>([racine.cle]);
    if (ici) for (const n of cheminDe(ici)) debut.add(n.cle);
    else for (const id of ["luca", "animaux"]) debut.add(`e:${id}`);
    if (!ici) for (const n of cheminDe("e:animaux")) debut.add(n.cle);
    return debut;
  });
  const [texte, setTexte] = useState("");
  const [cible, setCible] = useState<string | null>(ici);
  const resultats = useMemo(() => chercherArbre(texte), [texte]);
  const cibleRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => cibleRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, [cible]);

  function montrer(cle: string) {
    setOuverts((o) => {
      const n = new Set(o);
      for (const p of cheminDe(cle)) n.add(p.cle);
      return n;
    });
    setCible(cle);
    setTexte("");
  }
  function basculer(cle: string) {
    setOuverts((o) => {
      const n = new Set(o);
      if (n.has(cle)) n.delete(cle);
      else n.add(cle);
      return n;
    });
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre sous="Cherche un animal : l'arbre s'ouvre jusqu'à lui.">L'arbre de l'évolution</Titre>
      <label className="relative mt-3 block">
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#6b5444]" aria-hidden="true" />
        <input type="search" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Tardigrade, lion, baleine, mammifères…" className="w-full rounded-2xl bg-card py-3 pl-10 pr-10 text-base text-[#2a1c14]" aria-label="Chercher dans l'arbre" />
        {texte ? <button type="button" onClick={() => setTexte("")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full" aria-label="Effacer"><LuX className="size-4 text-[#6b5444]" /></button> : null}
      </label>

      {texte.trim().length >= 2 ? (
        <ul className="mt-3 space-y-2" aria-label="Résultats">
          {resultats.length === 0 ? <li className="rounded-2xl bg-card px-4 py-3 text-center">Rien trouvé. Essaie un autre mot.</li> : null}
          {resultats.map((n) => (
            <li key={n.cle}>
              <button type="button" onClick={() => montrer(n.cle)} className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-2 text-left">
                <Pastille n={n} />
                <span className="min-w-0"><span className="block font-extrabold leading-tight">{n.nom}</span><span className="block text-xs">{ETIQUETTE[n.sorte]}{n.sous && n.sorte === "espece" ? ` · ${n.sous}` : ""}</span></span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="mt-2 text-center text-xs texte-doux">Touche une flèche pour ouvrir une branche. Touche un nom pour voir sa page.</p>
          <ul className="mt-3 overflow-x-hidden"><Branche n={racine} niveau={0} ouverts={ouverts} basculer={basculer} cible={cible} cibleRef={cibleRef} /></ul>
        </>
      )}
    </main>
  );
}

function Pastille({ n }: { n: Noeud }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-[#e8c98a]/60">
      {n.sorte === "etape" ? <Vignette image={n.image} icone={n.icone} /> : n.sorte === "espece" ? <Portrait id={n.id} /> : <span className="grid size-full place-items-center bg-[#4a2d78] text-xs font-black text-[#f3d48a]">{n.sorte === "ordre" ? "O" : "F"}</span>}
    </span>
  );
}

function Branche({ n, niveau, ouverts, basculer, cible, cibleRef }: { n: Noeud; niveau: number; ouverts: Set<string>; basculer: (c: string) => void; cible: string | null; cibleRef: React.MutableRefObject<HTMLLIElement | null> }) {
  const ouvert = ouverts.has(n.cle);
  const [montre, setMontre] = useState(30);
  const enf = useMemo(() => (ouvert ? enfants(n) : []), [ouvert, n]);
  const aDesEnfants = useMemo(() => n.sorte !== "espece" && (ouvert ? enf.length > 0 : enfants(n).length > 0), [n, ouvert, enf]);
  const estCible = cible === n.cle;
  // Une branche qui n'a qu'une seule suite ne décale pas la ligne : l'arbre reste lisible sur un téléphone.
  const plat = enf.length === 1 && enf[0].sorte === "etape";
  useEffect(() => {
    const i = cible ? enf.findIndex((c) => c.cle === cible || cheminDe(cible).some((p) => p.cle === c.cle)) : -1;
    if (i >= montre) setMontre(i + 10);
  }, [cible, enf, montre]);
  // Pour ne pas faire un escalier trop large sur un téléphone, l'indentation s'arrête vite.
  const retrait = 0;
  return (
    <li ref={estCible ? cibleRef : undefined} className="relative">
      <div className={`flex items-center gap-2 rounded-2xl py-1.5 pr-2 ${estCible ? "bg-[#ff7ab6]/25 ring-2 ring-[#ff7ab6]" : ""}`} style={{ paddingLeft: retrait * 10 }}>
        {aDesEnfants ? (
          <button type="button" onClick={() => basculer(n.cle)} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2a1844]" aria-expanded={ouvert} aria-label={`${ouvert ? "Fermer" : "Ouvrir"} ${n.nom}`}>
            <LuChevronRight className={`size-5 transition-transform ${ouvert ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
        ) : <span className="size-9 shrink-0" />}
        <a href={`#${n.vers}`} className="flex min-w-0 flex-1 items-center gap-2">
          <Pastille n={n} />
          <span className="min-w-0">
            <span className="block text-[15px] font-extrabold leading-tight">{n.nom}</span>
            <span className="block text-[11px] text-[#e7d7be]">
              {ETIQUETTE[n.sorte]}
              {n.ma !== undefined ? ` · ${dateEnClair(n.ma)} (${heureTerre(n.ma)})` : ""}
            </span>
          </span>
        </a>
      </div>
      {ouvert && enf.length ? (
        <ul className={plat ? "" : "border-l-2 border-[#e8c98a]/30"} style={plat ? undefined : { marginLeft: niveau < 3 ? 16 : 4 }}>
          {enf.slice(0, montre).map((c) => <Branche key={c.cle} n={c} niveau={plat ? niveau : niveau + 1} ouverts={ouverts} basculer={basculer} cible={cible} cibleRef={cibleRef} />)}
          {enf.length > montre ? <li><button type="button" onClick={() => setMontre((m) => m + 40)} className="my-1 ml-10 rounded-full bg-[#2a1844] px-3 py-1.5 text-xs font-extrabold">Voir la suite ({enf.length - montre} encore)</button></li> : null}
        </ul>
      ) : null}
    </li>
  );
}

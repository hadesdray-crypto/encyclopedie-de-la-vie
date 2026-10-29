// « Choisis la voix de Plume » : simple pour une enfant de 8 ans (même système que dans Footdex).
// 1. Le caractère de Plume. 2. Toucher une carte pour écouter. 3. Plus aigu ou plus grave. 4. « C'est elle ! ».
import { useEffect, useState } from "react";
import { PRESENCES } from "@/lib/plume";
import { dire } from "@/lib/parole";
import { catalogueVoix, cleDe, essayerProchaine, garderVoix, useVoixChoisie, type OptionVoix } from "@/lib/choix-voix";

const HAUTEUR_DE_BASE: Record<string, number> = { discrete: 0.97, presente: 1.1, etudiante: 1.02, passionnee: 1.2 };
const PHRASE: Record<string, string> = {
  discrete: "Bonjour Leonie. C'est moi, Plume, tout doucement.",
  presente: "Coucou Leonie ! C'est moi, Plume, avec cette voix-là !",
  etudiante: "D'après ce que savent les scientifiques, cette voix me va bien.",
  passionnee: "Leonie, Leonie ! Écoute ma nouvelle voix, c'est génial !",
};

export function ChoixVoixPlume() {
  const caracteres = PRESENCES.filter((p) => p.id !== "repos");
  const [qui, setQui] = useState<string>(caracteres[1]?.id ?? "presente");
  const mienne = useVoixChoisie(qui);
  const [liste, setListe] = useState<OptionVoix[] | null>(null);
  const [sel, setSel] = useState("");
  const [hauteur, setHauteur] = useState(1);
  const [garde, setGarde] = useState(false);

  useEffect(() => {
    void catalogueVoix().then(setListe);
    const t = window.setTimeout(() => void catalogueVoix().then(setListe), 1200);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    setSel(cleDe(mienne));
    setHauteur(mienne?.hauteur ?? HAUTEUR_DE_BASE[qui] ?? 1);
    setGarde(false);
  }, [qui]);

  const actuelle = liste?.find((o) => o.cle === sel);
  const ecouter = (o: OptionVoix | undefined, h = hauteur, texte = PHRASE[qui] ?? PHRASE.presente) => {
    essayerProchaine({ moteur: o?.choix.moteur ?? "auto", index: o?.choix.index ?? -1, nom: o?.choix.nom ?? "", hauteur: h });
    dire(texte);
  };

  return (
    <div className="py-2.5">
      <p className="font-extrabold leading-tight">Choisis la voix de Plume</p>
      <p className="text-xs leading-snug">Touche une voix pour l'écouter, puis appuie sur « C'est elle ! ». Les ⭐⭐⭐ sont les plus jolies.</p>

      <p className="mt-3 text-sm font-extrabold">1 · Pour quel caractère ?</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Caractère de Plume">
        {caracteres.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={qui === p.id} onClick={() => setQui(p.id)}
            className={`min-h-11 rounded-2xl px-2 text-sm font-extrabold ${qui === p.id ? "bouton-bois" : "bg-[#f3e2c2]"}`}>
            {p.nom}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm font-extrabold">2 · Touche une voix pour l'écouter</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {(liste ?? []).map((o) => (
          <button key={o.cle} type="button" aria-pressed={sel === o.cle} onClick={() => { setSel(o.cle); setGarde(false); ecouter(o); }}
            className={`grid min-h-24 justify-items-center gap-0.5 rounded-2xl px-2 py-2 text-center ${sel === o.cle ? "bg-[#cfe9c8] ring-4 ring-[#5cc28a]" : "bg-[#f3e2c2]"}`}>
            <span className="text-base" aria-label={`${o.etoiles} étoiles`}>{"⭐".repeat(o.etoiles)}</span>
            <span className="font-display text-xl leading-none">{o.titre}</span>
            <span className="text-xs font-extrabold">{o.etoiles === 3 ? "Super fluide" : "Bien"}</span>
            <span className="text-[11px] opacity-70">{o.note}</span>
          </button>
        ))}
        {liste === null ? <p className="col-span-2 text-sm">Je cherche les voix du téléphone…</p> : null}
        {liste && !liste.length ? <p className="col-span-2 text-sm">Pas d'autre voix sur ce téléphone : tu peux quand même la rendre plus aiguë ou plus grave.</p> : null}
      </div>

      <p className="mt-3 text-sm font-extrabold">3 · Plus aiguë ou plus grave ?</p>
      <div className="mt-1 flex items-center gap-3 text-3xl">
        <span aria-hidden="true">🐭</span>
        <input type="range" min={0.6} max={1.6} step={0.05} value={2.2 - hauteur} aria-label="Aiguë ou grave" className="h-9 flex-1 accent-[#8d4e1f]"
          onChange={(e) => { setHauteur(2.2 - Number(e.target.value)); setGarde(false); }}
          onPointerUp={() => ecouter(actuelle)} onKeyUp={() => ecouter(actuelle)} />
        <span aria-hidden="true">🐻</span>
      </div>

      <button type="button" className="bouton-bois mt-3 w-full rounded-2xl py-3 font-display text-xl"
        onClick={() => {
          garderVoix(qui, { moteur: actuelle?.choix.moteur ?? "auto", index: actuelle?.choix.index ?? -1, nom: actuelle?.choix.nom ?? "", hauteur });
          setGarde(true);
          ecouter(actuelle, hauteur, "Super ! Je garde cette voix !");
        }}>
        {garde ? "✅ Gardée !" : "C'est elle !"}
      </button>
    </div>
  );
}

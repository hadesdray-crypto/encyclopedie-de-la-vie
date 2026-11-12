// « Choisis la voix » à deux molettes : une pour les voix sans connexion, une pour les voix avec connexion.
// On fait tourner une molette : dès qu'une voix s'arrête sous le repère, elle parle. Sur le côté, une case par molette :
// on peut garder une seule des deux, ou les deux (avec Internet, c'est la voix avec connexion qui parle, sinon l'autre).
// Plus bas : grave ou aiguë, lente ou rapide, « Écouter », et « Valider » qui garde la voix pour ce personnage.
import { useEffect, useRef, useState } from "react";
import { dire } from "@/lib/parole";
import { catalogueVoix, essayerProchaine, garderVoix, voixBrute, type BaseVoix, type OptionVoix } from "@/lib/choix-voix";

const HAUTEUR_DE_BASE: Record<string, number> = { discrete: 0.97, presente: 1.1, etudiante: 1.02, passionnee: 1.2 };
const VITESSE_DE_BASE: Record<string, number> = { discrete: 0.93, presente: 1, etudiante: 0.95, passionnee: 1.07 };
const PHRASE: Record<string, string> = {
  discrete: "Bonjour princesse Léonie. C'est moi, Plume, tout doucement.",
  presente: "Coucou princesse Léonie ! C'est moi, Plume, avec cette voix-là !",
  etudiante: "D'après ce que savent les scientifiques, cette voix me va bien.",
  passionnee: "Princesse Léonie, princesse Léonie ! Écoute ma nouvelle voix, c'est génial !",
};
const LIGNE = 56; // hauteur d'une ligne de la molette, en pixels

const base = (o: OptionVoix | undefined): BaseVoix | null => (o ? { moteur: o.choix.moteur, index: o.choix.index, nom: o.choix.nom } : null);

/** Une molette : on la fait défiler, la voix sous le repère est choisie et parle. */
function Molette(props: { titre: string; sous: string; liste: OptionVoix[]; cle: string; actif: boolean; onActif: (v: boolean) => void; onChoix: (o: OptionVoix, parler: boolean) => void }) {
  const { liste, cle } = props;
  const zone = useRef<HTMLDivElement>(null);
  const minuteur = useRef(0);
  const silence = useRef(true); // pas de parole pendant qu'on place la molette nous-mêmes
  const derniere = useRef(cle);
  const indexDe = (c: string) => Math.max(0, liste.findIndex((o) => o.cle === c));

  // Place la molette sur la voix choisie.
  useEffect(() => {
    const el = zone.current;
    if (!el || !liste.length) return;
    silence.current = true;
    el.scrollTop = indexDe(cle) * LIGNE;
    derniere.current = liste[indexDe(cle)].cle;
    const t = window.setTimeout(() => { silence.current = false; }, 250);
    return () => window.clearTimeout(t);
  }, [liste, cle]);

  function surDefile() {
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => {
      const el = zone.current;
      if (!el || !liste.length) return;
      const i = Math.max(0, Math.min(liste.length - 1, Math.round(el.scrollTop / LIGNE)));
      if (liste[i].cle === derniere.current) return;
      derniere.current = liste[i].cle;
      props.onChoix(liste[i], !silence.current);
    }, 220);
  }

  return (
    <div className={`min-w-0 flex-1 rounded-2xl p-2 ${props.actif ? "bg-[#f3e2c2]" : "bg-[#e6ddd0] opacity-70"}`}>
      <label className="flex min-h-11 items-center gap-2 text-sm font-extrabold leading-tight">
        <input type="checkbox" checked={props.actif} onChange={(e) => props.onActif(e.target.checked)} className="size-6 shrink-0 accent-[#8d4e1f]" />
        <span>{props.titre}<span className="block text-[11px] font-bold opacity-80">{props.sous}</span></span>
      </label>
      {liste.length ? (
        <div className="relative mt-1">
          <div ref={zone} onScroll={surDefile} role="listbox" aria-label={props.titre} tabIndex={0}
            className="h-[168px] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl bg-[#2a1c14]/90 py-[56px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {liste.map((o, k) => (
              <button key={o.cle} type="button" role="option" aria-selected={o.cle === cle}
                onClick={() => zone.current?.scrollTo({ top: k * LIGNE, behavior: "smooth" })}
                style={{ height: LIGNE }} className={`flex w-full snap-center flex-col items-center justify-center px-1 text-center ${o.cle === cle ? "text-[#ffe9a8]" : "text-white/55"}`}>
                <span className="font-display text-xl leading-none">{o.titre}</span>
                {o.libelle ? <span className="max-w-full truncate text-[10px]">{o.libelle}</span> : null}
              </button>
            ))}
          </div>
          {/* Le repère doré au milieu */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 top-[56px] h-[56px] rounded-xl ring-2 ring-[#f3d48a] shadow-[0_0_14px_rgba(243,212,138,.6)]" />
        </div>
      ) : (
        <p className="mt-1 rounded-xl bg-white/50 px-2 py-4 text-center text-xs">Aucune voix de ce type sur ce téléphone.</p>
      )}
    </div>
  );
}

/** `qui` : le caractère dont on règle la voix. `nom` : le nom du personnage (un personnage bonus parle en son nom). */
export function ChoixVoixPlume({ qui, nom = "Plume" }: { qui: string; nom?: string }) {
  const [liste, setListe] = useState<OptionVoix[] | null>(null);
  const [cleLocal, setCleLocal] = useState("");
  const [cleReseau, setCleReseau] = useState("");
  const [useLocal, setUseLocal] = useState(true);
  const [useReseau, setUseReseau] = useState(true);
  const [hauteur, setHauteur] = useState(1);
  const [vitesse, setVitesse] = useState(1);
  const [garde, setGarde] = useState(false);
  const phrase = (PHRASE[qui] ?? PHRASE.presente).replace(/\bPlume\b/g, nom);

  useEffect(() => {
    void catalogueVoix().then(setListe);
    const t = window.setTimeout(() => void catalogueVoix().then(setListe), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const locales = (liste ?? []).filter((o) => !o.reseau);
  const reseaux = (liste ?? []).filter((o) => o.reseau);
  const cleDeBase = (b: BaseVoix | null | undefined, l: OptionVoix[]) => l.find((o) => b && o.choix.moteur === b.moteur && o.choix.index === b.index && o.choix.nom === b.nom)?.cle ?? l[0]?.cle ?? "";

  // Les réglages déjà gardés (ou ceux du caractère) : à chaque changement de caractère ou quand les voix arrivent.
  useEffect(() => {
    if (liste === null) return;
    const v = voixBrute(qui);
    const nouveau = !!v && (v.local !== undefined || v.reseau !== undefined);
    const ancien = v && !nouveau ? { moteur: v.moteur, index: v.index, nom: v.nom } : null;
    const ancienReseau = !!ancien && reseaux.some((o) => o.choix.moteur === ancien.moteur && o.choix.index === ancien.index && o.choix.nom === ancien.nom);
    setCleLocal(cleDeBase(nouveau ? v!.local : ancienReseau ? null : ancien, locales));
    setCleReseau(cleDeBase(nouveau ? v!.reseau : ancienReseau ? ancien : null, reseaux));
    setUseLocal(nouveau ? v!.useLocal !== false : true);
    setUseReseau(nouveau ? v!.useReseau !== false : true);
    setHauteur(v?.hauteur ?? HAUTEUR_DE_BASE[qui] ?? 1);
    setVitesse(v?.vitesse ?? VITESSE_DE_BASE[qui] ?? 1);
    setGarde(false);
  }, [qui, liste]);

  const optLocal = locales.find((o) => o.cle === cleLocal);
  const optReseau = reseaux.find((o) => o.cle === cleReseau);
  const enLigne = typeof navigator === "undefined" || navigator.onLine !== false;
  // La voix qui parle maintenant : celle avec connexion s'il y a Internet (et si la case est cochée), sinon l'autre.
  const parlante = enLigne ? (useReseau && optReseau ? optReseau : useLocal ? optLocal : undefined) : useLocal && optLocal ? optLocal : undefined;

  const ecouter = (o: OptionVoix | undefined, h = hauteur, v = vitesse, texte = phrase) => {
    essayerProchaine({ moteur: o?.choix.moteur ?? "auto", index: o?.choix.index ?? -1, nom: o?.choix.nom ?? "", hauteur: h, vitesse: v });
    dire(texte);
  };

  return (
    <div className="mt-4 rounded-3xl bg-card px-4 py-4 text-[#2a1c14]">
      <p className="font-extrabold leading-tight">Fais tourner une molette : la voix parle quand elle s'arrête sur son nom</p>
      <p className="text-xs leading-snug">Coche la molette que tu veux garder, ou les deux : avec Internet, la voix avec connexion (souvent plus belle) parle, sinon c'est l'autre.</p>
      <div className="mt-3 flex gap-2">
        <Molette titre="Sans connexion" sous="Marche toujours" liste={locales} cle={cleLocal} actif={useLocal} onActif={(v) => { setUseLocal(v); setGarde(false); }}
          onChoix={(o, parler) => { setCleLocal(o.cle); setGarde(false); if (parler) ecouter(o); }} />
        <Molette titre="Avec connexion" sous="Il faut Internet" liste={reseaux} cle={cleReseau} actif={useReseau} onActif={(v) => { setUseReseau(v); setGarde(false); }}
          onChoix={(o, parler) => { setCleReseau(o.cle); setGarde(false); if (parler) ecouter(o); }} />
      </div>
      {liste === null ? <p className="mt-2 text-sm">Je cherche les voix du téléphone…</p> : null}
      {liste && !liste.length ? <p className="mt-2 text-sm">Pas d'autre voix sur ce téléphone : tu peux quand même changer la hauteur et la vitesse.</p> : null}

      <div className="mt-4 space-y-3">
        <label className="block text-sm font-extrabold">
          <span className="flex justify-between"><span>Grave</span><span>Aiguë</span></span>
          <input type="range" min={0.5} max={1.8} step={0.05} value={hauteur} aria-label="Voix grave ou aiguë" className="h-9 w-full accent-[#8d4e1f]"
            onChange={(e) => { setHauteur(Number(e.target.value)); setGarde(false); }} onPointerUp={() => ecouter(parlante)} onKeyUp={() => ecouter(parlante)} />
        </label>
        <label className="block text-sm font-extrabold">
          <span className="flex justify-between"><span>Lente</span><span>Rapide</span></span>
          <input type="range" min={0.5} max={1.6} step={0.05} value={vitesse} aria-label="Voix lente ou rapide" className="h-9 w-full accent-[#8d4e1f]"
            onChange={(e) => { setVitesse(Number(e.target.value)); setGarde(false); }} onPointerUp={() => ecouter(parlante)} onKeyUp={() => ecouter(parlante)} />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="min-h-14 rounded-2xl bg-[#f3e2c2] font-display text-xl ring-2 ring-[#8d4e1f]/40" onClick={() => ecouter(parlante)}>Écouter</button>
        <button type="button" className="bouton-bois min-h-14 rounded-2xl font-display text-xl"
          onClick={() => {
            garderVoix(qui, { ...(base(parlante) ?? { moteur: "auto", index: -1, nom: "" }), hauteur, vitesse, local: base(optLocal), reseau: base(optReseau), useLocal, useReseau });
            setGarde(true);
            ecouter(parlante, hauteur, vitesse, "Super ! Je garde cette voix !");
          }}>
          {garde ? "Voix gardée" : "Valider"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs">{useLocal || useReseau ? (useLocal && useReseau ? "Les deux molettes sont gardées : avec Internet, la voix avec connexion parle." : useReseau ? "Seulement la voix avec connexion." : "Seulement la voix sans connexion.") : "Coche au moins une molette."}</p>
    </div>
  );
}

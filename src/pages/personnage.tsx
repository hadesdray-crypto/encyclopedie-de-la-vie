// La page d'un personnage : en haut, qui il est et un gros bouton « Choisir » ;
// en dessous, quelques grosses tuiles (sa voix, sa tenue, ses paroles…) qui ouvrent chacune un petit écran.
// Tout ce qu'on change est gardé tout de suite : il n'y a pas de bouton « Enregistrer ».
//   #/personnage?id=presente                              un personnage de Plume
//   #/personnage?id=b123                                  un personnage bonus
//   #/personnage?id=b123&s=voix                           un sous-menu (voix, tenue, caractere, paroles, nom, comportement)
//   #/personnage?id=b123&s=paroles&k=toucher&m=coucou     paroles : la catégorie, puis le moment
import { useEffect, useState, type ReactNode } from "react";
import { LuTrash2 } from "react-icons/lu";
import { Entete } from "@/components/entete";
import { Cabine } from "@/components/cabine";
import { PlumeDessin, type AnimPlume } from "@/components/plume-dessin";
import { ChoixVoixPlume } from "@/components/choix-voix";
import { DEFAUTS, Versions } from "@/components/paroles";
import { CartePage, Ligne, TitreSous, Tuile, type Interrupteur } from "@/components/reglages-ui";
import { voixPossible } from "@/components/voix";
import { CATEGORIES, CATEGORIE_PAGES, MAX_VERSIONS, choisirCompagnon, cleVoix, garderCompagnons, garderVoix, lireCompagnons, useCompagnon, useCompagnons, type Compagnon } from "@/lib/compagnons";
import { CARACTERES, NUM, choisirBonus, choisirPlume, estPresence, majBonus } from "@/lib/personnages";
import {
  PRESENCES, choisirPlumeBouge, choisirPlumeExplique, choisirPresence, choisirReactions, definirEcran, plumeBouge, plumeDit, plumeExpliqueSeule, plumeFete, reactionsActives, usePlume,
} from "@/lib/plume";

const ANIMS: AnimPlume[] = ["coucou", "parle", "bravo", "jeu", "peur", "etourdie", "fachee", "bataille"];

const COMPORTEMENTS: Interrupteur[] = [
  { id: "explique", titre: "Explique chaque nouvelle page", explication: "La première fois que tu ouvres une page, il vient t'expliquer. Sinon, il attend que tu le touches.", lire: plumeExpliqueSeule, choisir: choisirPlumeExplique },
  { id: "reactions", titre: "Te félicite pendant les jeux", explication: "Une petite bulle à côté de lui quand tu gagnes ou quand tu te trompes.", lire: reactionsActives, choisir: choisirReactions },
  { id: "bouge", titre: "Fait coucou", explication: "De temps en temps, il agite son aile pour te dire bonjour.", lire: plumeBouge, choisir: choisirPlumeBouge },
];

const PUCE_BONUS = "Personnage bonus";

export function PersonnagePage({ params }: { params: URLSearchParams }) {
  const id = params.get("id") ?? "";
  const bonus = useCompagnons().find((c) => c.id === id) ?? null;
  const plume = estPresence(id) ? id : null;
  if (!bonus && !plume) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-4">
        <Entete siVide="/options" />
        <p className="carte-nuit mt-6 rounded-3xl px-4 py-5 text-center">Ce personnage n'existe plus. <a href="#/options" className="font-extrabold underline">Voir les personnages</a></p>
      </main>
    );
  }
  const s = params.get("s");
  if (!s) return <Fiche id={id} bonus={bonus} />;
  if (s === "voix") return <SousVoix id={id} bonus={bonus} />;
  if (s === "comportement") return <SousComportement id={id} bonus={bonus} />;
  if (!bonus) return <Fiche id={id} bonus={null} />;
  if (s === "tenue") return <SousTenue c={bonus} />;
  if (s === "caractere") return <SousCaractere c={bonus} />;
  if (s === "nom") return <SousNom c={bonus} />;
  if (s === "paroles") return <SousParoles c={bonus} categorie={params.get("k")} moment={params.get("m")} />;
  return <Fiche id={id} bonus={bonus} />;
}

// ------------------------------------------------------------ ce qu'on affiche sur le personnage
function infos(id: string, bonus: Compagnon | null) {
  if (bonus) {
    const car = CARACTERES.find((x) => x.id === bonus.caractere);
    return {
      titre: bonus.nom || "Mon compagnon",
      sous: [bonus.age ? `${bonus.age} ans` : "", bonus.createur ? `créé par ${bonus.createur}` : PUCE_BONUS, car?.court.toLowerCase() ?? ""].filter(Boolean).join(" · "),
      num: NUM[bonus.caractere] as 1 | 2 | 3 | 4,
      look: bonus.look,
      caractere: bonus.caractere,
    };
  }
  const car = CARACTERES.find((x) => x.id === id);
  const p = PRESENCES.find((x) => x.id === id);
  return {
    titre: car?.titre ?? "Plume se repose",
    sous: (p?.explique ?? "").replace(/^[^.]*\.\s*/, "") || p?.explique || "",
    num: (car?.num ?? 0) as 0 | 1 | 2 | 3 | 4,
    look: undefined,
    caractere: car?.id,
  };
}

function Avatar({ id, bonus, taille = "size-40", anime = true }: { id: string; bonus: Compagnon | null; taille?: string; anime?: boolean }) {
  const i = infos(id, bonus);
  const [anim, setAnim] = useState<AnimPlume>("coucou");
  useEffect(() => {
    if (!anime) return;
    let k = 0;
    const t = window.setInterval(() => setAnim(ANIMS[k++ % ANIMS.length]), 2200);
    return () => window.clearInterval(t);
  }, [anime]);
  return <PlumeDessin anim={anime ? anim : "rien"} caractere={i.num} look={i.look} lit={anime && anim === "parle"} className={taille} />;
}

/** Le petit bandeau des sous-menus : qui on règle, et quoi. */
function Bandeau({ id, bonus, titre, sous, icone }: { id: string; bonus: Compagnon | null; titre: string; sous?: string; icone: string }) {
  const i = infos(id, bonus);
  return (
    <>
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#2a1844] ring-1 ring-[#e8c98a]/50"><Avatar id={id} bonus={bonus} taille="size-14" anime={false} /></span>
        <p className="min-w-0 truncate font-display text-xl text-[#f3d48a]">{i.titre}</p>
      </div>
      <TitreSous icone={icone} sous={sous}>{titre}</TitreSous>
    </>
  );
}

function Page({ id, bonus, parent, children }: { id: string; bonus: Compagnon | null; parent?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-4">
      <Entete siVide={parent ?? `/personnage?id=${id}`} />
      {children}
    </main>
  );
}

// ------------------------------------------------------------ la fiche : qui il est, et les tuiles
function Fiche({ id, bonus }: { id: string; bonus: Compagnon | null }) {
  const { presence } = usePlume();
  const actifBonus = useCompagnon();
  const i = infos(id, bonus);
  const actif = bonus ? actifBonus?.id === bonus.id : !actifBonus && presence === id;
  const base = `#/personnage?id=${id}`;
  const prenom = bonus ? bonus.nom || "lui" : id === "repos" ? "Plume" : "Plume";

  function choisir() {
    if (bonus) choisirBonus(bonus);
    else choisirPlume(id as Parameters<typeof choisirPlume>[0]);
    plumeFete();
    window.setTimeout(() => plumeDit(bonus ? "Super, je reste avec toi !" : id === "repos" ? "D'accord, je me repose. Pour me rappeler, va dans les Options." : "Super, c'est moi !", 3000), 200);
  }

  useEffect(() => {
    definirEcran({ id: `personnage-${id}`, titre: i.titre, etapes: [
      "Voici un personnage. Touche le gros bouton pour le choisir : c'est lui qui t'accompagnera partout dans l'application.",
      "En dessous, les petits boutons ouvrent chacun un petit écran : sa voix, sa tenue, ses paroles…",
    ] });
    return () => definirEcran(null);
  }, [id]);

  return (
    <Page id={id} bonus={bonus} parent="/options">
      <div className="mt-4 text-center">
        <span className={`halo-jeu mx-auto grid size-44 place-items-center rounded-full bg-[#2a1844] ${id === "repos" ? "opacity-60" : ""}`}>
          <Avatar id={id} bonus={bonus} />
        </span>
        <h1 className="titre-or mt-4 text-3xl leading-tight text-balance">{i.titre}</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-snug texte-doux">{i.sous}</p>
      </div>

      {actif ? (
        <p className="mx-auto mt-4 flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[#5cc28a]/25 px-5 text-center font-extrabold text-[#b9ffd6] ring-1 ring-[#5cc28a]/60">✓ C'est ton personnage</p>
      ) : (
        <button type="button" onClick={choisir} className="bouton-jeu mx-auto mt-4 block w-full max-w-sm rounded-full py-3.5 font-display text-xl">Choisir {prenom === "lui" ? "ce personnage" : prenom}</button>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {id !== "repos" ? <Tuile href={`${base}&s=voix`} icone="🎙️" titre="Sa voix" /> : null}
        {bonus ? <Tuile href={`${base}&s=tenue`} icone="👗" titre="Sa tenue" /> : null}
        {bonus ? <Tuile href={`${base}&s=caractere`} icone="🎭" titre="Son caractère" /> : null}
        {bonus ? <Tuile href={`${base}&s=paroles`} icone="💬" titre="Ses paroles" /> : null}
        {bonus ? <Tuile href={`${base}&s=nom`} icone="✏️" titre="Son nom" /> : null}
        <Tuile href={`${base}&s=comportement`} icone="🧠" titre="Comportement" />
      </div>
    </Page>
  );
}

// ------------------------------------------------------------ les sous-menus
function SousVoix({ id, bonus }: { id: string; bonus: Compagnon | null }) {
  const qui = bonus ? bonus.caractere : id;
  return (
    <Page id={id} bonus={bonus}>
      <Bandeau id={id} bonus={bonus} titre="Sa voix" icone="🎙️" sous={bonus ? "La voix du téléphone qu'il utilise quand il n'a pas de voix enregistrée. Ses voix enregistrées sont dans « Ses paroles »." : "Touche une voix pour l'écouter, puis garde celle que tu préfères."} />
      {voixPossible() ? <ChoixVoixPlume qui={qui} nom={bonus ? bonus.nom || "ton personnage" : "Plume"} /> : <p className="carte-nuit mt-4 rounded-3xl px-4 py-4 text-center text-sm">La voix n'est pas disponible sur cet appareil.</p>}
    </Page>
  );
}

function SousComportement({ id, bonus }: { id: string; bonus: Compagnon | null }) {
  return (
    <Page id={id} bonus={bonus}>
      <Bandeau id={id} bonus={bonus} titre="Comportement" icone="🧠" sous="Comment il t'accompagne. Ces réglages sont les mêmes pour tous les personnages." />
      <CartePage>
        {COMPORTEMENTS.map((r) => <Ligne key={r.id} r={r} />)}
      </CartePage>
    </Page>
  );
}

function SousTenue({ c }: { c: Compagnon }) {
  // La surprise de la cabine n'a lieu que la première fois.
  const [nouveau] = useState(() => !localStorage.getItem(`leonie-cabine-${c.id}`));
  useEffect(() => {
    try { localStorage.setItem(`leonie-cabine-${c.id}`, "oui"); } catch { /* rien */ }
    definirEcran({ id: "personnage-tenue", titre: "La tenue", etapes: ["Bienvenue dans la cabine d'essayage ! Ton personnage arrive en peignoir et entre dans la cabine.", "En bas, choisis un rayon : le haut, le bas, la tête, les lunettes, les pieds, la main, ou son corps (sa couleur et son épaisseur).", "Touche un vêtement pour le lui donner, puis une couleur si tu veux. La cabine bouge : il se change derrière les volets !", "Quand tu as fini, touche « Ouvrir la cabine » pour voir la surprise. Ensuite, tu peux zoomer sur sa tête ou voir tout son corps."] });
    return () => definirEcran(null);
  }, []);
  return (
    <Page id={c.id} bonus={c}>
      <div className="mt-3">
        <Cabine look={c.look} setLook={(look) => majBonus(c.id, (x) => ({ ...x, look }))} caractere={NUM[c.caractere]} nouveau={nouveau} nom={c.nom} createur={c.createur} />
      </div>
    </Page>
  );
}

function SousCaractere({ c }: { c: Compagnon }) {
  const actif = useCompagnon();
  return (
    <Page id={c.id} bonus={c}>
      <Bandeau id={c.id} bonus={c} titre="Son caractère" icone="🎭" sous="Il décide combien il parle et bouge, comme pour Plume." />
      <div className="mt-4 space-y-2">
        {CARACTERES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={c.caractere === p.id}
            onClick={() => {
              majBonus(c.id, (x) => ({ ...x, caractere: p.id }));
              if (actif?.id === c.id) choisirPresence(p.id);
            }}
            className={`flex w-full items-center gap-3 rounded-[1.4rem] px-3 py-2.5 text-left ${c.caractere === p.id ? "bg-gradient-to-b from-[#fff0b8] to-[#f3c35a] text-[#2a1650]" : "verre-jeu text-white"}`}
          >
            <PlumeDessin caractere={p.num} look={c.look} className="size-16 shrink-0" />
            <span>
              <span className="block font-display text-xl leading-tight">{p.court}</span>
              <span className="block text-xs leading-snug opacity-80">{PRESENCES.find((x) => x.id === p.id)?.explique.replace(/^[^.]*\.\s*/, "")}</span>
            </span>
          </button>
        ))}
      </div>
    </Page>
  );
}

function SousNom({ c }: { c: Compagnon }) {
  const [sur, setSur] = useState(false);
  function supprimer() {
    garderCompagnons(lireCompagnons().filter((x) => x.id !== c.id));
    choisirCompagnon(null);
    [...CATEGORIES, CATEGORIE_PAGES].flatMap((k) => k.moments).forEach((m) => {
      garderVoix(`${c.id}:${m.id}`, null).catch(() => {});
      for (let i = 0; i < MAX_VERSIONS; i++) garderVoix(cleVoix(c.id, m.id, i), null).catch(() => {});
    });
    window.location.hash = "#/options";
  }
  const champ = (label: string, valeur: string, max: number, exemple: string, change: (v: string) => void, numerique = false) => (
    <label className="block">
      <span className="px-1 text-xs font-black text-[#f3d48a]">{label}</span>
      <input value={valeur} maxLength={max} inputMode={numerique ? "numeric" : undefined} onChange={(e) => change(e.target.value)} placeholder={exemple} className="mt-0.5 w-full rounded-full bg-white/10 px-4 py-2.5 text-lg font-extrabold text-white outline-none placeholder:text-white/35" />
    </label>
  );
  return (
    <Page id={c.id} bonus={c}>
      <Bandeau id={c.id} bonus={c} titre="Son nom" icone="✏️" />
      <section className="verre-jeu mt-4 space-y-3 rounded-[1.6rem] px-4 py-4">
        {champ("Son nom", c.nom, 16, "Pompon", (v) => majBonus(c.id, (x) => ({ ...x, nom: v })))}
        <div className="grid grid-cols-2 gap-2">
          {champ("Son âge", c.age, 4, "7", (v) => majBonus(c.id, (x) => ({ ...x, age: v.replace(/[^\d]/g, "") })), true)}
          {champ("Créé par", c.createur, 16, "Papa", (v) => majBonus(c.id, (x) => ({ ...x, createur: v })))}
        </div>
      </section>
      <div className="mt-8 text-center">
        {sur ? (
          <div className="carte-nuit rounded-3xl px-4 py-4">
            <p className="font-extrabold">Supprimer {c.nom || "ce personnage"} pour toujours ?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setSur(false)} className="verre-jeu rounded-full py-3 font-extrabold">Non, je le garde</button>
              <button type="button" onClick={supprimer} className="rounded-full bg-[#e2453c] py-3 font-extrabold text-white">Oui, supprimer</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setSur(true)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-[#ff9b9b]"><LuTrash2 className="size-4" /> Supprimer ce personnage</button>
        )}
      </div>
    </Page>
  );
}

// ------------------------------------------------------------ les paroles : catégories, puis moments, puis l'éditeur
const nbRemplies = (c: Compagnon, ids: string[]) => ids.filter((m) => (c.paroles[m as keyof Compagnon["paroles"]] ?? []).some((v) => v.texte.trim() || v.voix)).length;

function SousParoles({ c, categorie, moment }: { c: Compagnon; categorie: string | null; moment: string | null }) {
  const toutes = [...CATEGORIES, CATEGORIE_PAGES];
  const k = toutes.find((x) => x.id === categorie) ?? null;
  const m = k?.moments.find((x) => x.id === moment) ?? null;
  const base = `#/personnage?id=${c.id}&s=paroles`;

  useEffect(() => {
    definirEcran({ id: "personnage-paroles", titre: "Les paroles", etapes: ["Ici, ses paroles. Elles sont rangées par moments : quand on le touche, les réponses, les jeux, les mouvements, et chaque page.", "Écris sa phrase et touche « Enregistrer ma voix » : c'est ta voix qu'on entendra, et ta phrase qui s'affichera dans sa bulle.", "Tu peux faire jusqu'à 5 versions pour un même moment, avec « Une autre version » : il en choisit une au hasard, pour ne pas toujours dire la même chose.", "Si tu ne changes rien, il dit ce que je dirais avec son caractère."] });
    return () => definirEcran(null);
  }, []);

  // 3. Un moment : on écrit et on enregistre
  if (k && m) {
    return (
      <Page id={c.id} bonus={c} parent={`/personnage?id=${c.id}&s=paroles&k=${k.id}`}>
        <Bandeau id={c.id} bonus={c} titre={m.nom} icone="💬" sous={m.quand} />
        <section className="verre-jeu mt-4 rounded-[1.6rem] px-3 py-3">
          <Versions c={c} setC={(nc) => majBonus(c.id, () => nc)} e={m.id} defaut={DEFAUTS[m.id as keyof typeof DEFAUTS] ?? m.quand} />
        </section>
      </Page>
    );
  }

  // 2. Les moments d'une catégorie
  if (k) {
    return (
      <Page id={c.id} bonus={c} parent={`/personnage?id=${c.id}&s=paroles`}>
        <Bandeau id={c.id} bonus={c} titre={k.nom} icone="💬" sous={k.explique} />
        <ul className="mt-4 space-y-2">
          {k.moments.map((x) => {
            const fait = nbRemplies(c, [x.id]) > 0;
            return (
              <li key={x.id}>
                <a href={`${base}&k=${k.id}&m=${encodeURIComponent(x.id)}`} className="verre-jeu flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2.5 active:scale-[.98]">
                  <span className="min-w-0 flex-1 font-extrabold leading-tight">{x.nom}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${fait ? "bg-[#5cc28a] text-[#0f3320]" : "bg-white/10 texte-doux"}`}>{fait ? "✓ à lui" : "comme Plume"}</span>
                  <span aria-hidden="true" className="text-[#f3d48a]">›</span>
                </a>
              </li>
            );
          })}
        </ul>
      </Page>
    );
  }

  // 1. Les catégories
  return (
    <Page id={c.id} bonus={c}>
      <Bandeau id={c.id} bonus={c} titre="Ses paroles" icone="💬" sous="Choisis un moment, puis écris et enregistre ce qu'il dit. Sinon, il dit ce que dirait Plume." />
      <ul className="mt-4 space-y-2.5">
        {toutes.map((x) => {
          const n = nbRemplies(c, x.moments.map((y) => y.id));
          return (
            <li key={x.id}>
              <a href={`${base}&k=${x.id}`} className="verre-jeu flex min-h-16 items-center gap-3 rounded-[1.4rem] px-4 py-3 active:scale-[.98]">
                <span className="min-w-0 flex-1 font-display text-xl leading-tight text-[#f3d48a]">{x.nom}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${n ? "bg-[#5cc28a] text-[#0f3320]" : "bg-white/10 texte-doux"}`}>{n}/{x.moments.length}</span>
                <span aria-hidden="true" className="text-xl text-[#f3d48a]">›</span>
              </a>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

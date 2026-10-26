// L'atelier des personnages bonus : on crée (jusqu'à 4) des compagnons qui font tout comme Plume,
// avec leur nom, leur âge, qui les a créés, leur look, leur caractère, et leurs propres paroles enregistrées.
import { useEffect, useRef, useState } from "react";
import { LuMic, LuPlay, LuSquare, LuTrash2 } from "react-icons/lu";
import { Entete, Titre } from "@/components/entete";
import { Cabine } from "@/components/cabine";
import { definirEcran } from "@/lib/plume";
import { PlumeDessin, type AnimPlume, type Caractere } from "@/components/plume-dessin";
import { COULEURS_CORPS, EPAISSEURS, type Look } from "@/components/garde-robe";
import { BAS, CHAPEAUX2, CHAUSSURES, HAUTS, LUNETTES, OBJETS, TEINTES, type Piece, type Tenue } from "@/components/vestiaire";
import { CATEGORIES, CATEGORIE_PAGES, MAX_BONUS, MAX_VERSIONS, choisirCompagnon, cleVoix, garderCompagnons, garderVoix, jouerSon, erreurVoix, lireCompagnons, lireVoix, lireVoixVersion, nouveauCompagnon, type Compagnon, type Expression, type Variante } from "@/lib/compagnons";
import { PRESENCES, choisirPresence } from "@/lib/plume";
import { REACTIONS } from "@/data/guide";
import { aller as naviguer } from "@/lib/routeur";

// Les rayons du vestiaire : chaque morceau se choisit à part (et certains changent de couleur).
const RAYONS: { cle: keyof Omit<Tenue, "couleurs">; titre: string; liste: Piece[]; couleur?: keyof Tenue["couleurs"]; cadre: string }[] = [
  { cle: "haut", titre: "Le haut", liste: HAUTS, couleur: "haut", cadre: "25 95 150 110" },
  { cle: "bas", titre: "Le bas", liste: BAS, couleur: "bas", cadre: "25 130 150 90" },
  { cle: "chapeau", titre: "Sur la tête", liste: CHAPEAUX2, couleur: "chapeau", cadre: "20 -40 160 130" },
  { cle: "lunettes", titre: "Les lunettes", liste: LUNETTES, cadre: "28 45 144 90" },
  { cle: "chaussures", titre: "Les chaussures", liste: CHAUSSURES, couleur: "chaussures", cadre: "60 165 100 60" },
  { cle: "objet", titre: "Dans la main", liste: OBJETS, couleur: "objet", cadre: "130 50 110 130" },
];

const NUM: Record<string, Caractere> = { discrete: 1, presente: 2, etudiante: 3, passionnee: 4 };
const ANIMS: AnimPlume[] = ["coucou", "parle", "bravo", "jeu", "peur", "etourdie", "fachee", "bataille"];

// Ce que dirait le personnage si on ne change rien (pour montrer l'exemple dans chaque case).
const DEFAUTS: Partial<Record<Expression, string>> = {
  coucou: "(un petit coucou de la main)",
  menu: "(il ouvre son menu sans parler)",
  bonne: REACTIONS.bonne[0],
  mauvaise: REACTIONS.mauvaise[0],
  paquet: REACTIONS.paquet[0],
  debut: "Merci à la princesse Leonie : grâce à elle, on peut jouer à ce jeu ! Et merci au Concepteur.",
  tour: "À moi de jouer !",
  trouve: "Trouvé !",
  rate: "Oh non, je me suis trompé !",
  fache: "Hé ! Je préfère quand on me pose doucement.",
  secoue: "Ouh là ! Tout bouge !",
  peur: "J'ai un peu peur de cet animal…",
};

export function AtelierPage({ params }: { params: URLSearchParams }) {
  const id = params.get("id");
  const [c, setC] = useState<Compagnon>(() => lireCompagnons().find((x) => x.id === id) ?? nouveauCompagnon());
  const [anim, setAnim] = useState<AnimPlume>("coucou");
  const [onglet, setOnglet] = useState<"look" | "caractere" | "interactions">("look");
  const existe = lireCompagnons().some((x) => x.id === c.id);
  const plein = !existe && lireCompagnons().length >= MAX_BONUS;

  // Plume explique toujours où on est dans l'atelier.
  useEffect(() => {
    const etapes = onglet === "look"
      ? ["Bienvenue dans la cabine d'essayage ! Ton personnage arrive en peignoir et entre dans la cabine.", "En bas, choisis un rayon : le haut, le bas, la tête, les lunettes, les pieds, la main, ou son corps (sa couleur et son épaisseur).", "Touche un vêtement pour le lui donner, puis une couleur si tu veux. La cabine bouge : il se change derrière les volets !", "Quand tu as fini, touche « Ouvrir la cabine » pour voir la surprise. Ensuite, tu peux zoomer sur sa tête ou voir tout son corps."]
      : onglet === "caractere"
        ? ["Choisis son caractère, comme pour moi : discret, présent, étudiant ou passionné.", "Le caractère décide s'il parle souvent ou pas, et quels gestes il fait."]
        : ["Ici, ses paroles. Elles sont rangées par moments : quand on le touche, les réponses, les jeux, les mouvements, et chaque page.", "Écris sa phrase et touche « Enregistrer ma voix » : c'est ta voix qu'on entendra, et ta phrase qui s'affichera dans sa bulle.", "Tu peux faire jusqu'à 5 versions pour un même moment, avec « Une autre version » : il en choisit une au hasard, pour ne pas toujours dire la même chose.", "Si tu ne changes rien, il dit ce que je dirais avec son caractère."];
    definirEcran({ id: `atelier-${onglet}`, titre: "L'atelier des personnages", etapes });
    return () => definirEcran(null);
  }, [onglet]);

  // L'aperçu bouge tout seul : il montre ses gestes un par un.
  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => setAnim(ANIMS[i++ % ANIMS.length]), 1800);
    return () => window.clearInterval(t);
  }, []);

  const look = (l: Partial<Look>) => setC((x) => ({ ...x, look: { ...x.look, ...l } }));
  function enregistrer(choisir = false) {
    const l = lireCompagnons();
    const nom = c.nom.trim() || "Mon compagnon";
    const pret = { ...c, nom };
    garderCompagnons(existe ? l.map((x) => (x.id === c.id ? pret : x)) : [...l, pret]);
    if (choisir) {
      choisirCompagnon(pret.id);
      choisirPresence(pret.caractere);
    }
    naviguer("/options");
  }
  function supprimer() {
    garderCompagnons(lireCompagnons().filter((x) => x.id !== c.id));
    choisirCompagnon(null);
    [...CATEGORIES, CATEGORIE_PAGES].flatMap((k) => k.moments).forEach((m) => {
      garderVoix(`${c.id}:${m.id}`, null).catch(() => {});
      for (let i = 0; i < MAX_VERSIONS; i++) garderVoix(cleVoix(c.id, m.id, i), null).catch(() => {});
    });
    naviguer("/options");
  }

  if (plein) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-4">
        <Entete siVide="/options" />
        <Titre sous={`Tu as déjà ${MAX_BONUS} personnages bonus.`}>L'atelier</Titre>
        <p className="carte-nuit mt-4 rounded-3xl px-4 py-4">Pour en créer un nouveau, modifie ou supprime d'abord un de tes personnages bonus (dans Réglages, « Le caractère de Plume »).</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-4 pb-10">
      <Entete siVide="/options" />
      <Titre sous="Un personnage bonus qui fait tout comme Plume, avec son nom, son look et ses paroles.">L'atelier des personnages</Titre>

      {/* L'aperçu, toujours visible en haut */}
      <div className={`${onglet === "look" ? "hidden" : ""} sticky top-0 z-10 -mx-4 bg-gradient-to-b from-[#170c30] via-[#170c30]/95 to-transparent px-4 pb-4 pt-2`}>
        <div className="mx-auto flex max-w-sm items-center gap-3">
          <span className="halo-jeu grid size-28 shrink-0 place-items-center rounded-full bg-[#2a1844]">
            <PlumeDessin anim={anim} caractere={NUM[c.caractere]} look={c.look} lit={anim === "parle"} className="size-24" />
          </span>
          <div className="min-w-0">
            <p className="titre-jeu truncate font-display text-3xl">{c.nom.trim() || "Ton personnage"}</p>
            <p className="text-sm texte-doux">{c.age.trim() ? `${c.age.trim()} ans` : "Âge : à choisir"}{c.createur.trim() ? ` · créé par ${c.createur.trim()}` : ""}</p>
            <p className="text-xs texte-doux">{PRESENCES.find((p) => p.id === c.caractere)?.nom}</p>
          </div>
        </div>
      </div>

      <section className="verre-jeu mt-1 space-y-2 rounded-[1.6rem] px-4 py-4">
        <Champ label="Son nom" valeur={c.nom} max={16} onChange={(v) => setC({ ...c, nom: v })} exemple="Pompon" />
        <div className="grid grid-cols-2 gap-2">
          <Champ label="Son âge" valeur={c.age} max={4} onChange={(v) => setC({ ...c, age: v.replace(/[^\d]/g, "") })} exemple="7" numerique />
          <Champ label="Créé par" valeur={c.createur} max={16} onChange={(v) => setC({ ...c, createur: v })} exemple="Papa" />
        </div>
      </section>

      <div role="tablist" className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-[#2a1844] p-1 ring-1 ring-[#e8c98a]/40">
        {([["look", "👗 Sa tenue"], ["caractere", "💜 Son caractère"], ["interactions", "🎙️ Ses paroles"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={onglet === k} onClick={() => setOnglet(k)} className={`min-h-10 rounded-full text-sm font-extrabold ${onglet === k ? "bg-[#f3d48a] text-[#2a1650]" : "text-[#f3d48a]"}`}>{l}</button>
        ))}
      </div>

      {onglet === "look" ? (
        <div className="mt-3">
          <Cabine look={c.look} setLook={(l) => setC((x) => ({ ...x, look: l }))} caractere={NUM[c.caractere]} nouveau={!existe} nom={c.nom} createur={c.createur} />
        </div>
      ) : onglet === "caractere" ? (
        <div className="mt-3 space-y-2">
          <p className="px-1 text-sm texte-doux">Le caractère décide combien il parle et bouge, comme pour Plume. Il garde ses mains, ses chaussures et ses yeux de ce caractère.</p>
          {PRESENCES.filter((p) => p.id !== "repos").map((p) => (
            <button key={p.id} type="button" aria-pressed={c.caractere === p.id} onClick={() => setC({ ...c, caractere: p.id as Compagnon["caractere"] })} className={`flex w-full items-center gap-3 rounded-[1.4rem] px-3 py-2.5 text-left ${c.caractere === p.id ? "bg-gradient-to-b from-[#fff0b8] to-[#f3c35a] text-[#2a1650]" : "verre-jeu text-white"}`}>
              <PlumeDessin caractere={NUM[p.id]} look={c.look} className="size-14 shrink-0" />
              <span><span className="block font-extrabold">{p.nom}</span><span className="block text-xs opacity-80">{p.explique.replace(/^[^.]*\.\s*/, "")}</span></span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <p className="px-1 text-sm texte-doux">Pour chaque moment, ton personnage dit ce que dirait Plume avec son caractère. Tu peux écrire ses phrases et les enregistrer avec ta voix, jusqu'à 5 versions par moment : il en choisit une au hasard, et sa bulle montre toujours ce qu'il dit.</p>
          {[...CATEGORIES, CATEGORIE_PAGES].map((k) => (
            <details key={k.id} open={k.id === "toucher"} className="verre-jeu rounded-[1.6rem] px-3 py-3">
              <summary className="cursor-pointer list-none">
                <p className="flex items-center justify-between font-display text-xl text-[#f3d48a]"><span>{k.nom}</span><span className="text-sm">{k.moments.length} ▾</span></p>
                <p className="text-xs texte-doux">{k.explique}</p>
              </summary>
              <ul className="mt-2 space-y-3">
                {k.moments.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-white/5 px-3 py-2.5">
                    <p className="font-extrabold">{m.nom}</p>
                    <p className="text-xs texte-doux">{m.quand}</p>
                    <Versions c={c} setC={setC} e={m.id} defaut={(DEFAUTS[m.id as keyof typeof DEFAUTS] ?? m.quand)} />
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-2">
        <button type="button" onClick={() => enregistrer(true)} className="bouton-jeu w-full rounded-full py-3.5 font-display text-xl">Enregistrer et le choisir ➜</button>
        <button type="button" onClick={() => enregistrer(false)} className="verre-jeu w-full rounded-full py-3 font-extrabold text-white">Enregistrer sans le choisir</button>
        {existe ? <button type="button" onClick={supprimer} className="w-full rounded-full py-3 font-extrabold text-[#ff9b9b]">Supprimer ce personnage</button> : null}
      </div>
    </main>
  );
}

function Champ({ label, valeur, onChange, max, exemple, numerique = false }: { label: string; valeur: string; onChange: (v: string) => void; max: number; exemple: string; numerique?: boolean }) {
  return (
    <label className="block">
      <span className="px-1 text-xs font-black text-[#f3d48a]">{label}</span>
      <input value={valeur} maxLength={max} inputMode={numerique ? "numeric" : undefined} onChange={(e) => onChange(e.target.value)} placeholder={exemple} className="mt-0.5 w-full rounded-full bg-white/10 px-4 py-2.5 text-lg font-extrabold text-white outline-none placeholder:text-white/35" />
    </label>
  );
}

function Rangee({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-1 text-sm font-black text-[#f3d48a]">{titre}</p>
      <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 pt-1">{children}</div>
    </div>
  );
}

function Pastille({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={actif} onClick={onClick} className={`w-[5.2rem] shrink-0 rounded-2xl px-1 py-1.5 text-center font-extrabold leading-tight ${actif ? "bg-gradient-to-b from-[#fff0b8] to-[#f3c35a] text-[#2a1650] shadow-[0_0_16px_rgba(243,195,90,.5)]" : "verre-jeu text-white"}`}>
      {children}
    </button>
  );
}

/** Enregistrer une phrase avec le micro (10 secondes au plus), l'écouter, ou l'effacer. */
/**
 * Les versions d'un moment : jusqu'à 5 (un texte + sa voix). Le personnage en choisit une au hasard,
 * et la bulle montre toujours le texte de la version qu'on entend.
 */
function Versions({ c, setC, e, defaut }: { c: Compagnon; setC: (c: Compagnon) => void; e: Expression; defaut: string }) {
  const liste: Variante[] = c.paroles[e]?.length ? c.paroles[e]! : [{ texte: "" }];
  const changer = (l: Variante[]) => setC({ ...c, paroles: { ...c.paroles, [e]: l } });
  async function enlever(i: number) {
    // On décale les enregistrements des versions suivantes, pour que chaque voix reste avec son texte.
    for (let j = i; j < liste.length - 1; j++) await garderVoix(cleVoix(c.id, e, j), await lireVoixVersion(c.id, e, j + 1));
    await garderVoix(cleVoix(c.id, e, liste.length - 1), null);
    if (i === 0) await garderVoix(`${c.id}:${e}`, null);
    const l = liste.filter((_, k) => k !== i);
    changer(l.length ? l : [{ texte: "" }]);
  }
  const remplies = liste.filter((v) => v.texte.trim() || v.voix).length;
  return (
    <div className="mt-1.5 space-y-2">
      {liste.map((v, i) => (
        <div key={i} className="rounded-xl bg-white/5 px-2 py-2">
          <div className="flex items-center gap-1.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f3d48a] text-xs font-black text-[#2a1650]">{i + 1}</span>
            <input value={v.texte} maxLength={120} onChange={(ev) => changer(liste.map((x, k) => (k === i ? { ...x, texte: ev.target.value } : x)))} placeholder={i === 0 ? `Sinon : « ${defaut.slice(0, 60)}${defaut.length > 60 ? "…" : ""} »` : "Une autre façon de le dire…"} className="min-w-0 flex-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-white/45" />
            {liste.length > 1 || v.texte || v.voix ? <button type="button" aria-label={`Enlever la version ${i + 1}`} onClick={() => enlever(i)} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/80"><LuTrash2 className="size-4" /></button> : null}
          </div>
          <Enregistreur cle={cleVoix(c.id, e, i)} ancienne={i === 0 ? `${c.id}:${e}` : undefined} onSon={(oui) => changer(liste.map((x, k) => (k === i ? { ...x, voix: oui } : x)))} />
          {v.voix && !v.texte.trim() ? <p className="mt-1 text-[11px] text-[#ffd9a0]">Écris aussi ce qu'il dit dans cet enregistrement : c'est ce qui s'affichera dans sa bulle.</p> : null}
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        {liste.length < MAX_VERSIONS ? <button type="button" onClick={() => changer([...liste, { texte: "" }])} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-[#f3d48a] ring-1 ring-white/20">＋ Une autre version ({liste.length}/{MAX_VERSIONS})</button> : <span />}
        {remplies > 1 ? <span className="text-[11px] font-bold texte-doux">🎲 Au hasard parmi {remplies} versions</span> : null}
      </div>
    </div>
  );
}

function Enregistreur({ cle, ancienne, onSon }: { cle: string; ancienne?: string; onSon?: (oui: boolean) => void }) {
  const [son, setSon] = useState<Blob | null>(null);
  const [etat, setEtat] = useState<"" | "enregistre" | "erreur">("");
  const rec = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    lireVoix(cle).then(async (b) => setSon(b ?? (ancienne ? await lireVoix(ancienne) : null)));
  }, [cle]);
  async function demarrer() {
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Le format que ce téléphone sait enregistrer ET relire (webm/opus d'abord, puis mp4, puis ogg).
      const format = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported?.(t));
      const r = format ? new MediaRecorder(flux, { mimeType: format }) : new MediaRecorder(flux);
      const morceaux: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      r.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        const b = new Blob(morceaux, { type: r.mimeType || "audio/webm" });
        await garderVoix(cle, b);
        setSon(b);
        setEtat("");
        onSon?.(true);
      };
      rec.current = r;
      r.start();
      setEtat("enregistre");
      window.setTimeout(() => r.state === "recording" && r.stop(), 10000);
    } catch {
      setEtat("erreur");
    }
  }
  const [souci, setSouci] = useState("");
  async function ecouter() {
    if (!son) return;
    setSouci("");
    const ok = await jouerSon(son);
    if (!ok) setSouci(`${erreurVoix || "inconnue"} · enregistrement de ${(son.size / 1024).toFixed(0)} Ko, type « ${son.type || "?"} »`);
    else if (son.size < 1500) setSouci("L'enregistrement est presque vide : le micro n'a rien entendu. Réessaie en parlant tout de suite après avoir touché le bouton.");
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {etat === "enregistre" ? (
        <button type="button" onClick={() => rec.current?.stop()} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#e2453c] px-3 text-sm font-extrabold text-white animate-pulse"><LuSquare className="size-4" /> J'ai fini</button>
      ) : (
        <button type="button" onClick={demarrer} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 px-3 text-sm font-extrabold text-white ring-1 ring-white/25"><LuMic className="size-4" /> {son ? "Réenregistrer" : "Enregistrer ma voix"}</button>
      )}
      {son ? (
        <>
          <button type="button" onClick={ecouter} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#5fe07a]/20 px-3 text-sm font-extrabold text-[#b9ffc4]"><LuPlay className="size-4" /> Écouter</button>
          <button type="button" aria-label="Effacer l'enregistrement" onClick={() => { garderVoix(cle, null); if (ancienne) garderVoix(ancienne, null); setSon(null); onSon?.(false); }} className="grid size-9 place-items-center rounded-full bg-white/10 text-white/80"><LuTrash2 className="size-4" /></button>
        </>
      ) : null}
      {souci ? <p className="w-full text-xs text-[#ffb3b3]">Je n'arrive pas à jouer cette voix. Raison : {souci}. Dis-le à ton papa, ça m'aidera à réparer.</p> : null}
      {etat === "erreur" ? <p className="w-full text-xs text-[#ffb3b3]">Le micro n'est pas disponible. Sur le téléphone, il faut accepter l'accès au micro (il faut la nouvelle version de l'application, installée depuis le lien).</p> : null}
    </div>
  );
}

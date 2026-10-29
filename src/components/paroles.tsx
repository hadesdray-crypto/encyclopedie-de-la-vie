// Les paroles d'un personnage bonus : pour chaque moment, jusqu'à 5 versions (un texte + sa voix enregistrée).
// Le personnage en choisit une au hasard, et sa bulle montre toujours le texte qu'on entend.
import { useEffect, useRef, useState } from "react";
import { LuMic, LuPlay, LuSquare, LuTrash2 } from "react-icons/lu";
import { MAX_VERSIONS, cleVoix, garderVoix, jouerSon, erreurVoix, lireVoix, lireVoixVersion, type Compagnon, type Expression, type Variante } from "@/lib/compagnons";
import { REACTIONS } from "@/data/guide";

// Ce que dirait le personnage si on ne change rien (pour montrer l'exemple dans chaque case).
export const DEFAUTS: Partial<Record<Expression, string>> = {
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

export function Versions({ c, setC, e, defaut }: { c: Compagnon; setC: (c: Compagnon) => void; e: Expression; defaut: string }) {
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
          <button type="button" onClick={() => { setSouci(""); window.setTimeout(async () => { const ok = await jouerSon(son); setSouci(ok ? "" : `${erreurVoix || "inconnue"} (essai sans toucher, comme dans l'application)`); }, 700); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-extrabold text-white/85">Test comme dans l'appli</button>
          <button type="button" aria-label="Effacer l'enregistrement" onClick={() => { garderVoix(cle, null); if (ancienne) garderVoix(ancienne, null); setSon(null); onSon?.(false); }} className="grid size-9 place-items-center rounded-full bg-white/10 text-white/80"><LuTrash2 className="size-4" /></button>
        </>
      ) : null}
      {souci ? <p className="w-full text-xs text-[#ffb3b3]">Je n'arrive pas à jouer cette voix. Raison : {souci}. Dis-le à ton papa, ça m'aidera à réparer.</p> : null}
      {etat === "erreur" ? <p className="w-full text-xs text-[#ffb3b3]">Le micro n'est pas disponible. Sur le téléphone, il faut accepter l'accès au micro (il faut la nouvelle version de l'application, installée depuis le lien).</p> : null}
    </div>
  );
}
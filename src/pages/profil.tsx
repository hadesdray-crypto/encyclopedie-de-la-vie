import { effacerSignalements, photosSignalees } from "@/components/photo-entiere";
import { LIMITES, choisirLimiteEcran, limiteEcran, useTempsEcran } from "@/lib/temps-ecran";
import { useState } from "react";
import { ESPECES, FAMILLES, ORDRES, PAR_ID } from "@/data/catalogue";
import { AVATARS, avatar, choisirAvatar } from "@/lib/reglages";
import { fichesLues, paquetsDisponibles, paquetsIllimites } from "@/lib/recompenses";
import { lireScore, lireVues } from "@/lib/carnet";
import { EST_APK, VERSION_APK, useMajApk, verifierApk, lancerMajApk, telechargerApk } from "@/lib/maj-apk";
import { VERSION_APP, accepterMiseAJour, relancerHorsLigne, useHorsLigne, verifierMiseAJour } from "@/lib/hors-ligne";
import { permettreInternet, useInternet } from "@/lib/internet";
import { Portrait } from "@/components/portrait";

export function ProfilPage() {
  const vues = lireVues();
  const score = lireScore();
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <ChoixAvatar />
      <h1 className="titre-or mt-4 text-center text-4xl">Princesse Leonie</h1>
      <p className="mt-2 text-center">Ton carnet. Il reste sur cet appareil.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <a href="#/cartes" className="rounded-3xl bg-card px-4 py-4"><p className="font-display text-3xl">{vues.length}</p><p>fiches et cartes vues</p></a>
        <a href="#/jouer" className="rounded-3xl bg-card px-4 py-4"><p className="font-display text-3xl">{score.points} / {score.parties}</p><p>bonnes réponses</p></a>
        <a href="#/mammiferes" className="rounded-3xl bg-card px-4 py-4"><p className="font-display text-3xl">{fichesLues().length}</p><p>fiches lues</p></a>
        <a href="#/cartes" className="rounded-3xl bg-card px-4 py-4"><p className="font-display text-3xl">{paquetsIllimites() ? "∞" : paquetsDisponibles()}</p><p>paquets à ouvrir</p></a>
      </div>
      <Medailles vues={vues} />
      {vues.length ? (
        <>
          <h2 className="titre-or mt-6 text-center text-2xl">Déjà vus</h2>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {vues.slice(-24).reverse().map((id) => {
              const e = PAR_ID.get(id);
              return e ? <li key={id}><a href={`#/mammiferes/e-${id}`} className="block text-center"><span className="medaillon mx-auto block size-14 overflow-hidden"><Portrait id={id} /></span><span className="mt-1 block text-[11px] font-extrabold leading-tight">{e.nom}</span></a></li> : null;
            })}
          </ul>
        </>
      ) : null}
      <a href="#/options" className="bouton-bois mt-6 flex items-center justify-center gap-2 rounded-3xl px-4 py-3 font-display text-xl">
        Options et réglages
      </a>
      <a href="#/sources" className="mt-4 block text-center font-extrabold underline">Sources et crédits</a>
    </main>
  );
}

export function Application() {
  const hl = useHorsLigne();
  return (
    <>
        {EST_APK ? <VersionApk /> : (
        <section className="carte-nuit mt-6 rounded-3xl px-4 py-4">
          <p className="font-display text-xl text-[#f3d48a]">Sans Internet</p>
          {hl.possible ? (
            <>
                <p className="mt-1 text-sm">Photos et cris enregistrés sur l'appareil : {hl.prets} sur {hl.total}.</p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#0f0a20]"><div className="h-full bg-[#f3d48a]" style={{ width: `${hl.total ? (hl.prets / hl.total) * 100 : 0}%` }} /></div>
                {hl.prets < hl.total && !hl.enCours ? <button type="button" onClick={relancerHorsLigne} className="bouton-bois mt-3 rounded-full px-4 py-2 font-extrabold">Finir d'enregistrer</button> : null}
            </>
          ) : (
            <p className="mt-1 text-sm">L'application s'enregistre sur l'appareil quand on l'ouvre depuis son adresse Internet.</p>
          )}
          <div className="mt-4 border-t border-[#e8c98a]/30 pt-3 text-sm">
            <p>Version du {VERSION_APP.split(" ")[0].split("-").reverse().join("/")} à {VERSION_APP.split(" ")[1]}</p>
            {hl.majDisponible ? (
                <button type="button" onClick={accepterMiseAJour} className="bouton-bois mt-2 rounded-full px-4 py-2 font-extrabold">Installer la mise à jour</button>
            ) : hl.possible ? (
                <>
                  <button type="button" onClick={verifierMiseAJour} className="mt-2 rounded-full bg-card px-4 py-2 font-extrabold text-[#2a1c14]">Chercher une mise à jour</button>
                  <p className="mt-1 text-xs">
                    {hl.verification === "en-cours" ? "Recherche…" : hl.verification === "a-jour" ? "C'est la dernière version." : hl.verification === "hors-ligne" ? "Pas de connexion : on regardera plus tard." : ""}
                  </p>
                </>
            ) : null}
          </div>
        </section>
        )}
    </>
  );
}

export function CoinParents() {
  const { permis } = useInternet();
  const [reponse, setReponse] = useState("");
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="mt-4 rounded-3xl bg-card px-4 py-4">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="w-full text-left font-display text-xl">Coin des parents</button>
      {ouvert ? (
        <div className="mt-2 text-sm">
          <p className="mb-3 font-extrabold">Les paquets de cartes : un paquet de 5, 10 ou 15 cartes chaque jour, et d'autres à gagner en lisant des fiches et en jouant.</p>
          <TempsParJour />
          <PhotosSignalees />
          <p>Certaines options ont besoin d'une connexion : les trajets GPS (Movebank), les vidéos des animaux et des frères Kratt. Elles sont éteintes. Rien ne se télécharge tout seul.</p>
          {permis ? (
            <button type="button" onClick={() => permettreInternet(false)} className="bouton-bois mt-3 rounded-full px-4 py-2 font-extrabold">Éteindre les options Internet</button>
          ) : (
            <div className="mt-3">
              <label className="block font-extrabold">Pour un adulte : combien font 13 × 7 ?</label>
              <input inputMode="numeric" value={reponse} onChange={(e) => setReponse(e.target.value)} className="mt-1 w-28 rounded-xl border border-[#a07a45] bg-white px-3 py-2" />
              <button type="button" disabled={reponse.trim() !== "91"} onClick={() => permettreInternet(true)} className="bouton-bois ml-2 rounded-full px-4 py-2 font-extrabold disabled:opacity-40">Allumer</button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

/** Le temps d'écran par jour : Plume prévient 10 minutes avant, puis propose d'aller dehors. */
function TempsParJour() {
  const [limite, setLimite] = useState(limiteEcran);
  const e = useTempsEcran();
  return (
    <div className="mb-4">
      <p className="font-extrabold">Temps d'écran par jour</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Temps d'écran par jour">
        {LIMITES.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={limite === m} onClick={() => { choisirLimiteEcran(m); setLimite(m); }} className={`min-h-9 rounded-full px-3 font-extrabold ${limite === m ? "bg-[#8d4e1f] text-white" : "bg-white/60"}`}>
            {m ? `${m} min` : "Sans limite"}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs opacity-80">
        Aujourd'hui : {e.minutes} min dans l'application. Repère des directives canadiennes : au plus 2 heures d'écran de loisir par jour, en comptant tous les écrans.
      </p>
    </div>
  );
}

/** Les photos que Leonie a signalées (« ce n'est pas le bon animal ») : la liste à envoyer pour les remplacer. */
function PhotosSignalees() {
  const [liste, setListe] = useState(photosSignalees);
  const [copie, setCopie] = useState(false);
  if (!liste.length) return null;
  const texte = liste.map((s) => `${s.nom} (${s.id}) : ${s.photo}`).join("\n");
  return (
    <div className="mb-4">
      <p className="font-extrabold">Photos signalées : {liste.length}</p>
      <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-white/60 p-2 text-[11px]">{texte}</pre>
      <div className="mt-1.5 flex gap-2">
        <button type="button" onClick={() => { navigator.clipboard?.writeText(texte).then(() => setCopie(true)).catch(() => {}); }} className="bouton-bois rounded-full px-3 py-1.5 text-sm font-extrabold">{copie ? "Copié !" : "Copier la liste"}</button>
        <button type="button" onClick={() => { effacerSignalements(); setListe([]); }} className="rounded-full px-3 py-1.5 text-sm font-extrabold underline">Effacer</button>
      </div>
    </div>
  );
}

function ChoixAvatar() {
  const [actuel, setActuel] = useState(avatar);
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="text-center">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="medaillon-or mx-auto block size-24 overflow-hidden" aria-label="Changer d'image">
        <img src={actuel} alt="" className="size-full object-cover" />
      </button>
      {ouvert ? (
        <div className="mx-auto mt-3 grid max-w-xs grid-cols-4 gap-2">
          {AVATARS.map((a) => (
            <button key={a} type="button" onClick={() => { choisirAvatar(a); setActuel(a); setOuvert(false); }} className={`medaillon block aspect-square overflow-hidden ${a === actuel ? "ring-4 ring-[#f3d48a]" : ""}`}>
              <img src={a} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs texte-doux">Touche l'image pour la changer.</p>
      )}
    </div>
  );
}

const PALIERS = [10, 25, 50, 100, 250, 500, 1000, 2000];

function Medailles({ vues }: { vues: string[] }) {
  const vu = new Set(vues);
  const ordres = ORDRES.filter((o) => ESPECES.some((e) => e.ordre === o.id && vu.has(e.id)));
  const completes = Object.entries(FAMILLES).filter(([code]) => {
    const vivantes = ESPECES.filter((e) => e.famille === code && !e.disparue);
    return vivantes.length > 0 && vivantes.every((e) => vu.has(e.id));
  });
  return (
    <section className="mt-6">
      <h2 className="titre-or text-center text-2xl">Médailles</h2>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {PALIERS.map((p) => (
          <li key={p} className={`grid size-16 place-items-center rounded-full text-center text-xs font-extrabold leading-tight ${vues.length >= p ? "medaillon-or bg-[radial-gradient(circle,#fff1b8,#d6a531)] text-[#2a1c14]" : "border-2 border-dashed border-[#e8c98a]/40 text-[#e8c98a]/50"}`}>
            {p}<br />cartes
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center font-extrabold">Exploratrice des ordres : {ordres.length} / {ORDRES.length}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {ORDRES.map((o) => (
          <a key={o.id} href={`#/mammiferes/o-${o.id}`} className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${ordres.includes(o) ? "bg-[#f3d48a] text-[#2a1c14]" : "bg-[#2a1844] text-[#e7d7be]/60"}`}>{o.nom}</a>
        ))}
      </div>
      <p className="mt-4 text-center font-extrabold">Familles complètes : {completes.length}</p>
      {completes.length ? <p className="text-center text-sm">{completes.map(([, f]) => f.nom).join(", ")}</p> : <p className="text-center text-sm texte-doux">Trouve toutes les espèces d'une famille pour gagner sa médaille. Les Ornithorynques n'en ont qu'une !</p>}
    </section>
  );
}

function VersionApk() {
  const m = useMajApk();
  return (
    <section className="carte-nuit mt-6 rounded-3xl px-4 py-4 text-sm">
      <p className="font-display text-xl text-[#f3d48a]">Application</p>
      <p className="mt-1">Tout est dans l'application : elle marche sans Internet.</p>
      <p className="mt-2">Version 1.{VERSION_APK}</p>
      {m.nouvelle ? (
        <button type="button" onClick={lancerMajApk} className="bouton-bois mt-2 rounded-full px-4 py-2 font-extrabold">Mettre à jour (version 1.{m.nouvelle})</button>
      ) : (
        <>
          <button type="button" onClick={verifierApk} className="mt-2 rounded-full bg-card px-4 py-2 font-extrabold text-[#2a1c14]">Chercher une mise à jour</button>
          <p className="mt-1 text-xs">
            {m.verification === "en-cours" ? "Recherche…" : m.verification === "a-jour" ? "C'est la dernière version." : m.verification === "hors-ligne" ? "Pas de connexion : on regardera plus tard." : m.verification === "erreur" ? "Impossible de vérifier pour l'instant." : ""}
          </p>
          {m.verification === "erreur" || m.verification === "hors-ligne" ? (
            <button type="button" onClick={telechargerApk} className="mt-2 rounded-full bg-[#f3d48a] px-4 py-2 font-extrabold text-[#2a1c14]">
              Installer la dernière version complète
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

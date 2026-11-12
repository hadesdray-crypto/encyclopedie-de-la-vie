// Mode développeur (dans le Coin des parents, après le code) : tout tester sans attendre.
// - faire comme s'il était tel jour à telle heure (les jours, défis, paquets du jour et l'histoire de Plume suivent) ;
// - lancer à la main les animations et les interactions de Plume, du braconnier, de l'histoire et des cartes.
import { useState } from "react";
import { REACTIONS } from "@/data/guide";
import { decalageMs, definirDecalage, faireCommeSi, heureTestActive, maintenant } from "@/lib/horloge";
import { avancerUnJour, recommencerHistoire } from "@/lib/histoire";
import { coucouPlume, ouvrirPlume, plumeAPeur, plumeDit, plumeFete, plumeGeste, plumeReagit, revivrePremiereFois } from "@/lib/plume";
import { gagnerPaquet } from "@/lib/recompenses";
import { verifierCodeDev } from "@/lib/code-parents";

const CLE_DEV = "leonie-mode-dev";
const dev = () => { try { return localStorage.getItem(CLE_DEV) === "1"; } catch { return false; } };
const pad = (n: number) => String(n).padStart(2, "0");

function Bouton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="min-h-11 rounded-2xl bg-white/10 px-2 py-2 text-xs font-extrabold active:bg-white/20">{children}</button>;
}

export function ModeDeveloppeur() {
  const [actif, setActif] = useState(dev);
  const [codeDev, setCodeDev] = useState("");
  const [erreurDev, setErreurDev] = useState(false);
  const m = maintenant();
  const [date, setDate] = useState(`${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(m.getDate())}`);
  const [heure, setHeure] = useState(`${pad(m.getHours())}:${pad(m.getMinutes())}`);
  const [, maj] = useState(0);
  const [dernier, setDernier] = useState("");
  const note = (t: string) => setDernier(`${pad(new Date().getHours())}:${pad(new Date().getMinutes())} · ${t}`);
  const lancer = (nom: string, f: () => void) => () => { f(); note(nom); };

  return (
    <div className="mt-4 rounded-2xl bg-[#1a0f33] px-3 py-3 text-white">
      <div className="flex min-h-11 items-center justify-between gap-2 font-extrabold">
        <span>Mode développeur</span>
        {actif ? <button type="button" onClick={() => { try { localStorage.setItem(CLE_DEV, "0"); } catch { /* rien */ } setActif(false); }} className="rounded-full bg-white/15 px-3 py-1.5 text-xs">Éteindre</button> : null}
      </div>
      {!actif ? (
        <div className="mt-1">
          <p className="text-xs opacity-80">Code à 6 chiffres pour l'allumer.</p>
          <div className="mt-2 flex items-center gap-2">
            <input inputMode="numeric" type="password" autoComplete="off" maxLength={6} value={codeDev} onChange={(e) => { setCodeDev(e.target.value.replace(/\D/g, "").slice(0, 6)); setErreurDev(false); }} aria-label="Code développeur" className="w-32 rounded-xl bg-white px-3 py-2 text-center tracking-[0.4em] text-[#2a1c14]" />
            <button type="button" disabled={codeDev.length !== 6} onClick={async () => { if (await verifierCodeDev(codeDev)) { try { localStorage.setItem(CLE_DEV, "1"); } catch { /* rien */ } setActif(true); setCodeDev(""); } else { setErreurDev(true); setCodeDev(""); } }} className="rounded-full bg-[#f3d48a] px-4 py-2 font-extrabold text-[#2a1650] disabled:opacity-50">Allumer</button>
          </div>
          {erreurDev ? <p className="mt-1 text-xs font-extrabold">Mauvais code.</p> : null}
        </div>
      ) : null}
      {actif ? (
        <div className="mt-2 space-y-4 text-sm">
          <section>
            <p className="font-extrabold">Faire comme si on était…</p>
            <p className="text-xs opacity-80">Maintenant pour l'appli : {maintenant().toLocaleString("fr-FR")}{heureTestActive() ? " (heure de test)" : " (heure réelle)"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Jour" className="rounded-xl bg-white px-2 py-2 text-[#2a1c14]" />
              <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} aria-label="Heure" className="rounded-xl bg-white px-2 py-2 text-[#2a1c14]" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Bouton onClick={lancer("heure de test", () => { faireCommeSi(date, heure); maj((n) => n + 1); })}>Appliquer</Bouton>
              <Bouton onClick={lancer("+1 jour", () => { definirDecalage(decalageMs() + 86400000); const d = maintenant(); setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); maj((n) => n + 1); })}>+ 1 jour</Bouton>
              <Bouton onClick={lancer("heure réelle", () => { definirDecalage(0); const d = new Date(); setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); setHeure(`${pad(d.getHours())}:${pad(d.getMinutes())}`); maj((n) => n + 1); })}>Heure réelle</Bouton>
            </div>
            <p className="mt-1 text-xs opacity-80">Après avoir changé l'heure, ferme et rouvre l'appli pour que tout la prenne en compte (défi du jour, paquet du jour, jour de l'histoire).</p>
          </section>

          <section>
            <p className="font-extrabold">Plume</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <Bouton onClick={lancer("fête", plumeFete)}>Fête</Bouton>
              <Bouton onClick={lancer("peur", () => plumeAPeur("Hou ! Tu m'as fait peur !"))}>Peur</Bouton>
              <Bouton onClick={lancer("coucou", coucouPlume)}>Coucou</Bouton>
              {(["coucou", "triste", "joie"] as const).map((g) => <Bouton key={g} onClick={lancer(`geste ${g}`, () => plumeGeste(g))}>Geste : {g}</Bouton>)}
              <Bouton onClick={lancer("elle parle", () => plumeDit("Je parle pour tester. Tu m'entends bien ?", 4000))}>Elle parle</Bouton>
              <Bouton onClick={lancer("menu", () => ouvrirPlume(true, "page"))}>Son menu</Bouton>
              <Bouton onClick={lancer("présentation", () => ouvrirPlume(true, "presentation"))}>Présentation</Bouton>
              <Bouton onClick={lancer("présentation refaite", revivrePremiereFois)}>Revivre le début</Bouton>
            </div>
            <p className="mt-2 text-xs font-extrabold">Réactions</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(Object.keys(REACTIONS) as (keyof typeof REACTIONS)[]).map((r) => <Bouton key={r} onClick={lancer(`réaction ${r}`, () => plumeReagit(r))}>{r}</Bouton>)}
            </div>
          </section>

          <section>
            <p className="font-extrabold">Braconnier (sur l'accueil)</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {([["filet", "Le filet"], ["fusil", "Le fusil"], ["course", "La course"]] as const).map(([id, nom]) => (
                <Bouton key={id} onClick={lancer(`braconnier ${id}`, () => { window.location.hash = "#/"; window.setTimeout(() => window.dispatchEvent(new CustomEvent("leonie-braconnier", { detail: { scenario: id } })), 600); })}>{nom}</Bouton>
              ))}
            </div>
          </section>

          <section>
            <p className="font-extrabold">Histoire de Plume, cartes</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Bouton onClick={lancer("jour suivant de l'histoire", avancerUnJour)}>Avancer l'histoire d'un jour</Bouton>
              <Bouton onClick={lancer("histoire recommencée", recommencerHistoire)}>Recommencer l'histoire</Bouton>
              <Bouton onClick={lancer("paquet gagné", () => gagnerPaquet("test"))}>Gagner un paquet</Bouton>
              <Bouton onClick={lancer("nid", () => { window.location.hash = "#/nid"; })}>Aller au nid</Bouton>
            </div>
          </section>
          {dernier ? <p className="rounded-xl bg-black/30 px-2 py-1 text-xs">Dernier test : {dernier}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

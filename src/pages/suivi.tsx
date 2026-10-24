import { useState } from "react";
import { PAR_ID } from "@/data/catalogue";
import suivi from "@/data/suivi-gps.json";
import monde from "@/data/monde.json";
import { useInternet } from "@/lib/internet";
import { Entete, Titre } from "@/components/entete";

type Etude = { etude: number; nom: string; capteur: string };
type Trace = { individu: string; points: [number, number][] };
const ETUDES = suivi as Record<string, Etude[]>;
const PAYS = (monde as { pays: Record<string, string> }).pays;
const CLE = "leonie-traces-";

function lireGarde(etude: number): Trace[] | null {
  try { return JSON.parse(localStorage.getItem(CLE + etude) || "null"); } catch { return null; }
}

export function SuiviPage({ id }: { id?: string }) {
  if (!id) {
    const ids = Object.keys(ETUDES).map((latin) => [...PAR_ID.values()].find((e) => e.latin === latin)).filter(Boolean);
    return (
      <main className="mx-auto max-w-xl px-4 pt-4">
        <Entete />
        <Titre sous="Des scientifiques posent des colliers GPS sur certains animaux pour suivre leurs voyages.">Suivi GPS</Titre>
        <ul className="mt-5 space-y-2">{ids.map((e) => <li key={e!.id}><a href={`#/suivi/${e!.id}`} className="block rounded-3xl bg-card px-4 py-3 font-extrabold">{e!.nom}</a></li>)}</ul>
      </main>
    );
  }
  const e = PAR_ID.get(id);
  const etude = e ? ETUDES[e.latin]?.[0] : undefined;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide={`/mammiferes/e-${id}`} />
      <Titre sous={etude ? `Étude publique : ${etude.nom}` : "Aucune étude publique n'est notée."}>{e ? e.nom : "Animal inconnu"}</Titre>
      {etude ? <Trajets etude={etude} /> : null}
    </main>
  );
}

function Trajets({ etude }: { etude: Etude }) {
  const { permis, connecte } = useInternet();
  const [traces, setTraces] = useState<Trace[] | null>(() => lireGarde(etude.etude));
  const [etat, setEtat] = useState("");

  async function charger() {
    setEtat("Chargement…");
    try {
      const url = `https://www.movebank.org/movebank/service/public/json?study_id=${etude.etude}&sensor_type=${etude.capteur}&max_events_per_individual=40`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      const texte = await r.text();
      const brut = JSON.parse(texte) as { individuals?: { individual_local_identifier?: string; locations?: { location_lat: number; location_long: number }[] }[] };
      const t: Trace[] = (brut.individuals ?? []).slice(0, 6).map((i) => ({
        individu: i.individual_local_identifier || "Animal",
        points: (i.locations ?? []).filter((p) => Number.isFinite(p.location_lat)).map((p) => [p.location_lat, p.location_long] as [number, number]),
      })).filter((t) => t.points.length > 1);
      const json = JSON.stringify(t);
      try { localStorage.setItem(CLE + etude.etude, json); } catch { /* plein */ }
      setTraces(t);
      setEtat(`Téléchargé : ${Math.max(1, Math.round(texte.length / 1024))} Ko. Gardé sur l'appareil (${Math.max(1, Math.round(json.length / 1024))} Ko).`);
    } catch {
      setEtat("Movebank n'a pas répondu, ou ne permet pas ce téléchargement depuis le navigateur. Rien n'a été inventé.");
    }
  }

  return (
    <section className="mt-5 space-y-3">
      {traces?.length ? <Dessin traces={traces} /> : <p className="rounded-3xl bg-card px-4 py-3">Pas encore de trajet enregistré sur l'appareil.</p>}
      <div className="carte-nuit rounded-3xl px-4 py-4 text-sm">
        <p className="font-extrabold text-[#f3d48a]">A besoin d'une connexion</p>
        <p className="mt-1">On charge seulement quelques points par animal (40 au plus, pour 6 animaux) : en général quelques dizaines de Ko. Une étude complète peut peser des centaines de Mo : elle n'est jamais téléchargée.</p>
        {!permis ? <p className="mt-2">Un adulte peut allumer cette option dans Profil, « Coin des parents ».</p> : !connecte ? <p className="mt-2">L'appareil n'a pas de connexion en ce moment.</p> : (
          <button type="button" onClick={charger} className="bouton-bois mt-3 rounded-full px-4 py-2 font-extrabold">Charger quelques points</button>
        )}
        {etat ? <p className="mt-2">{etat}</p> : null}
      </div>
    </section>
  );
}

const COULEURS = ["#f3c35a", "#7fd6ff", "#f3a0e0", "#9be08a", "#ff9f6e", "#c9a8ff"];

function Dessin({ traces }: { traces: Trace[] }) {
  const pts = traces.flatMap((t) => t.points);
  const xs = pts.map((p) => p[1] + 180);
  const ys = pts.map((p) => 90 - p[0]);
  const marge = 2;
  const x0 = Math.min(...xs) - marge, x1 = Math.max(...xs) + marge, y0 = Math.min(...ys) - marge, y1 = Math.max(...ys) + marge;
  const cote = Math.max(x1 - x0, y1 - y0);
  return (
    <svg viewBox={`${x0} ${y0} ${cote} ${cote}`} className="w-full rounded-3xl bg-[#14214a]">
      {Object.entries(PAYS).map(([c, d]) => <path key={c} d={d} fill="#3b4a7a" stroke="#0f1838" strokeWidth={cote / 400} />)}
      {traces.map((t, i) => (
        <polyline key={t.individu} points={t.points.map((p) => `${p[1] + 180},${90 - p[0]}`).join(" ")} fill="none" stroke={COULEURS[i % 6]} strokeWidth={cote / 150} />
      ))}
    </svg>
  );
}

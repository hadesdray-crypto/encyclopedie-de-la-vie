import { useState } from "react";
import { LuCheck, LuChevronRight, LuWifi } from "react-icons/lu";
import { PAR_ID } from "@/data/catalogue";
import monde from "@/data/monde.json";
import trajets from "@/data/trajets.json";
import { useInternet } from "@/lib/internet";
import { appeler, moduleDisponible } from "@/lib/natif";
import { Entete, Titre } from "@/components/entete";
import { Portrait } from "@/components/portrait";
import CarteAventure, { etudeDe, garderTraces, lireTraces, voyageurs, COULEURS, type Etude, type Trace } from "@/components/carte-aventure";

const PAYS = (monde as { pays: Record<string, string> }).pays;

/** La page Aventure : la carte du monde des animaux voyageurs, et les trajets enregistrés. */
export function AventurePage() {
  const liste = voyageurs();
  const enregistres = liste.filter((v) => v.traces?.length).length;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre sous="Des scientifiques posent parfois un collier GPS à un animal, pour suivre ses voyages.">Aventure</Titre>
      <a href="#/voyageurs" className="relative mt-4 block overflow-hidden rounded-[1.4rem] border-2 border-[#e8c98a] bg-[#0b1230] px-4 py-4 shadow-[0_10px_22px_rgba(0,0,0,.45)]">
        <span className="block font-display text-2xl text-[#f3d48a]">Les grands voyageurs</span>
        <span className="mt-1 block text-sm font-bold text-[#dbe6ff]">Baleines, oiseaux, caribous, loups… leurs vrais trajets sur la carte du monde.</span>
        <span className="mt-2 flex gap-1.5">{["#4fb6ff", "#5fe07a", "#f3c35a", "#ff5a5a"].map((c) => <span key={c} className="h-1.5 w-8 rounded-full" style={{ background: c }} />)}</span>
      </a>
      <div className="relative mt-4">
        <CarteAventure />
      </div>
      <p className="mt-2 text-center text-xs texte-doux">En couleur : les pays où vit chaque animal. Les traits : les trajets enregistrés sur l'appareil.</p>
      <p className="mt-4 text-center font-extrabold text-[#f3d48a]">
        {enregistres ? `${enregistres} trajet${enregistres > 1 ? "s" : ""} enregistré${enregistres > 1 ? "s" : ""} sur ${liste.length}` : "Aucun trajet enregistré pour l'instant"}
      </p>
      <ul className="mt-3 space-y-2">
        {liste.map((v) => (
          <li key={v.espece.id}>
            <a href={`#/suivi/${v.espece.id}`} className="flex items-center gap-3 rounded-3xl bg-card px-3 py-2.5">
              <span className="medaillon block size-14 shrink-0 overflow-hidden" style={{ boxShadow: `0 0 0 3px ${v.couleur}` }}>
                <Portrait id={v.espece.id} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold leading-tight">{v.espece.nom}</span>
                <span className="block text-xs leading-tight">Étude : {v.etude.nom}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold">
                  {v.traces?.length ? (
                    <>
                      <LuCheck className="size-3.5" aria-hidden="true" /> Trajet enregistré ({v.traces.length} animal{v.traces.length > 1 ? "aux" : ""})
                    </>
                  ) : (
                    <>
                      <LuWifi className="size-3.5" aria-hidden="true" /> Pas encore de trajet
                    </>
                  )}
                </span>
              </span>
              <LuChevronRight className="size-6 shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-3xl carte-nuit px-4 py-3 text-sm">
        Pour charger un trajet, il faut Internet et l'accord d'une grande personne (dans Options, « Pour les grandes personnes »). Une fois chargé, il reste sur l'appareil, même sans Internet.
      </p>
    </main>
  );
}

export function SuiviPage({ id }: { id?: string }) {
  if (!id) return <AventurePage />;
  const e = PAR_ID.get(id);
  const etude = e ? etudeDe(e) : undefined;
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/aventure" />
      <Titre sous={etude ? `Étude publique : ${etude.nom}` : "Aucune étude publique n'est notée."}>{e ? e.nom : "Animal inconnu"}</Titre>
      {e ? <a href={`#/mammiferes/e-${id}`} className="mx-auto mt-2 block w-max rounded-full bg-card px-4 py-1.5 text-sm font-extrabold">Voir sa fiche</a> : null}
      {etude ? <Trajets etude={etude} /> : null}
    </main>
  );
}

function Trajets({ etude }: { etude: Etude }) {
  const { permis } = useInternet();
  const [traces, setTraces] = useState<Trace[] | null>(() => lireTraces(etude.etude) ?? ((trajets as Record<string, Trace[]>)[String(etude.etude)]?.length ? (trajets as Record<string, Trace[]>)[String(etude.etude)] : null));
  const [etat, setEtat] = useState("");

  async function charger() {
    setEtat("Chargement…");
    try {
      const url = `https://www.movebank.org/movebank/service/public/json?study_id=${etude.etude}&sensor_type=${etude.capteur}&max_events_per_individual=40`;
      // Dans l'application : on passe par le téléphone (pas de blocage du navigateur). Sinon : fetch.
      let texte: string;
      if (moduleDisponible("CapacitorHttp")) {
        const r = await appeler<{ status: number; data: unknown }>("CapacitorHttp", "request", { url, method: "GET", responseType: "text", connectTimeout: 20000, readTimeout: 30000 });
        if (r.status >= 400) throw new Error(String(r.status));
        texte = typeof r.data === "string" ? r.data : JSON.stringify(r.data);
      } else {
        const r = await fetch(url);
        if (!r.ok) throw new Error(String(r.status));
        texte = await r.text();
      }
      const brut = JSON.parse(texte) as { individuals?: { individual_local_identifier?: string; locations?: { location_lat: number; location_long: number }[] }[] };
      const t: Trace[] = (brut.individuals ?? []).slice(0, 6).map((i) => ({
        individu: i.individual_local_identifier || "Animal",
        points: (i.locations ?? []).filter((p) => Number.isFinite(p.location_lat)).map((p) => [p.location_lat, p.location_long] as [number, number]),
      })).filter((t) => t.points.length > 1);
      const taille = garderTraces(etude.etude, t);
      setTraces(t);
      setEtat(`Téléchargé : ${Math.max(1, Math.round(texte.length / 1024))} Ko. Gardé sur l'appareil (${Math.max(1, Math.round(taille / 1024))} Ko).`);
    } catch {
      setEtat("Movebank n'a pas répondu (pas de connexion, ou l'étude demande une autorisation). Rien n'a été inventé : réessaie plus tard.");
    }
  }

  return (
    <section className="mt-5 space-y-3">
      {traces?.length ? <Dessin traces={traces} /> : <p className="rounded-3xl bg-card px-4 py-3">Pas encore de trajet enregistré sur l'appareil.</p>}
      <div className="carte-nuit rounded-3xl px-4 py-4 text-sm">
        <p className="font-extrabold text-[#f3d48a]">A besoin d'une connexion</p>
        <p className="mt-1">On charge seulement quelques points par animal (40 au plus, pour 6 animaux) : en général quelques dizaines de Ko. Une étude complète peut peser des centaines de Mo : elle n'est jamais téléchargée.</p>
        {!permis ? <p className="mt-2">Un adulte peut allumer cette option dans Options, « Pour les grandes personnes ».</p> : (
          <button type="button" onClick={charger} className="bouton-bois mt-3 rounded-full px-4 py-2 font-extrabold">Charger quelques points</button>
        )}
        {etat ? <p className="mt-2">{etat}</p> : null}
      </div>
    </section>
  );
}


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

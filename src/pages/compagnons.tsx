import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuBaby, LuBookOpen, LuBriefcase, LuChevronDown, LuChevronRight, LuDog, LuCat, LuEye, LuHeart, LuHeartPulse,
  LuHourglass, LuMapPin, LuRuler, LuScale, LuSearch, LuSparkles, LuStar, LuUsers,
} from "react-icons/lu";
import donnees from "@/data/chiens.json";
import { Entete, Titre } from "@/components/entete";
import { Ecouter } from "@/components/voix";
import { PlumeDessin } from "@/components/plume-dessin";
import { plumeDit, plumePeutProposer } from "@/lib/plume";

/*
 * Le carnet de Plume : les races de chiens et de chats.
 * Plume adore les chiens (comme Leonie) : c'est elle qui « signe » ce carnet.
 * Tout vient de vraies sources : Wikipédia en français, Wikidata, Wikimedia Commons.
 * Ce qui n'est pas connu est écrit « Non connu ».
 */

type Photo = { fichier: string; src: string; auteur: string; licence: string; page: string };
export type Race = {
  id: string; nom: string; wiki: string; origine?: string; taille?: string; poids?: string; silhouette?: string;
  poil?: string; robe?: string; tete?: string; yeux?: string; oreilles?: string; queue?: string; caractere?: string;
  intro?: string; histoire?: string; utilisation?: string; vie?: string; vie_texte?: string; portee?: string;
  groupe?: string; fci?: string; photos: Photo[];
};
type Quantite = [string, string][];
type Donnees = { groupes: Record<string, string>; chiens: Race[]; chats: Race[]; especes?: Record<string, Record<string, Quantite>> };

const D = donnees as unknown as Donnees;
export const CHIENS = D.chiens;
export const CHATS = D.chats;

type Sorte = "chien" | "chat";
const LISTE: Record<Sorte, Race[]> = { chien: CHIENS, chat: CHATS };

// Les préférés de Plume : un petit tampon sur leur fiche. (C'est son goût à elle.)
const PREFERES = new Set(["golden-retriever", "beagle", "bouvier-bernois", "caniche", "berger-australien", "sacre-de-birmanie", "maine-coon"]);

// Le petit mot de Plume sur chaque groupe de la FCI.
const MOT_GROUPE: Record<string, string> = {
  "1": "Ils aident les humains à garder et à conduire les troupeaux.",
  "2": "Des chiens de garde, de grands chiens de montagne et les bouviers suisses.",
  "3": "Autrefois, ils chassaient les animaux qui vivent dans des terriers, comme le renard.",
  "4": "De toutes petites pattes : parfaites pour entrer dans les terriers.",
  "5": "Souvent une queue enroulée sur le dos. Certains tirent des traîneaux.",
  "6": "Ils suivent les animaux à l'odeur, en aboyant.",
  "7": "Quand ils sentent un gibier, ils s'immobilisent pour le montrer.",
  "8": "Ils rapportent le gibier, et beaucoup adorent l'eau.",
  "9": "Ils vivent surtout avec nous, pour nous tenir compagnie.",
  "10": "Les plus rapides des chiens : ils chassent en regardant.",
};

const GROUPES_CHATS = ["Poil court", "Poil mi-long", "Poil long", "Sans poil", "Autres"];
function groupeChat(r: Race) {
  const p = (r.poil ?? "").toLowerCase();
  if (/sans poil|\bnu\b|glabre/.test(p)) return "Sans poil";
  const positions = [["Poil mi-long", p.indexOf("mi-long")], ["Poil court", p.indexOf("court")], ["Poil long", p.indexOf("long")]] as const;
  if (positions[0][1] >= 0) return "Poil mi-long";
  const trouves = positions.slice(1).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]);
  return trouves[0]?.[0] ?? "Autres";
}

// ---- Ce qui est vrai pour tous les chiens, ou tous les chats (Wikidata) ----
const UNITES: Record<string, [string, string]> = { Q573: ["jour", "jours"], Q577: ["an", "ans"], Q23387: ["semaine", "semaines"], Q5151: ["mois", "mois"] };
function quantite(q?: Quantite, sansUnite = "") {
  if (!q?.length) return undefined;
  const parUnite = new Map<string, number[]>();
  for (const [v, u] of q) parUnite.set(u, [...(parUnite.get(u) ?? []), Number(v)]);
  const [u, vals] = [...parUnite.entries()][0];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const mot = UNITES[u]?.[max > 1 ? 1 : 0] ?? sansUnite;
  const f = (x: number) => String(Math.round(x * 10) / 10).replace(".", ",");
  return min === max ? `environ ${f(min)} ${mot}`.trim() : `de ${f(min)} à ${f(max)} ${mot}`.trim();
}
function espece(sorte: Sorte) {
  const e = D.especes?.[sorte] ?? {};
  return { gestation: quantite(e.P3063), vie: quantite(e.P2250), portee: quantite(e.P7725, "petits") };
}

// ------------------------------------------------------------------ pages

export function CompagnonsPage({ id }: { id?: string }) {
  if (!id) return <Accueil />;
  const [sorte, race] = id.split("/") as [string, string | undefined];
  const s: Sorte | null = sorte === "chiens" || sorte === "chien" ? "chien" : sorte === "chats" || sorte === "chat" ? "chat" : null;
  if (!s) return <Accueil />;
  if (race) return <Fiche sorte={s} race={LISTE[s].find((r) => r.id === race)} />;
  return <Liste sorte={s} />;
}

function SignaturePlume({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-3xl bg-[#fff8ea] px-3 py-3 text-[#2a1c14]">
      <PlumeDessin className="size-14 shrink-0" />
      <div className="min-w-0 text-[0.98rem] leading-snug">{children}</div>
    </div>
  );
}

function Accueil() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre>Le carnet de Plume</Titre>
      <SignaturePlume>
        <p className="font-display text-lg text-[#6a3fc0]">Mon carnet des chiens et des chats</p>
        <p className="mt-1">J'aime tous les animaux. Mais les chiens, ce sont mes préférés… comme toi, Leonie. Alors j'ai rassemblé toutes les races que j'ai pu trouver, avec les chats aussi.</p>
        <p className="mt-1 text-sm italic text-[#6a3fc0]">— Plume</p>
      </SignaturePlume>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <a href="#/compagnons/chiens" className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(160deg,#f0b860,#b5562a)] px-4 py-4 text-white shadow-[0_10px_22px_rgba(0,0,0,.45)]">
          <LuDog className="size-10" aria-hidden="true" />
          <span className="mt-2 block font-display text-2xl">Les chiens</span>
          <span className="block text-sm font-extrabold text-white/90">{CHIENS.length} races</span>
        </a>
        <a href="#/compagnons/chats" className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(160deg,#9fc0f0,#4a5fb0)] px-4 py-4 text-white shadow-[0_10px_22px_rgba(0,0,0,.45)]">
          <LuCat className="size-10" aria-hidden="true" />
          <span className="mt-2 block font-display text-2xl">Les chats</span>
          <span className="block text-sm font-extrabold text-white/90">{CHATS.length} races</span>
        </a>
      </div>
      <p className="mx-auto mt-5 max-w-sm text-center text-xs texte-doux">
        Les textes et les chiffres viennent de Wikipédia en français et de Wikidata. Les photos viennent de Wikimedia Commons, avec le nom de leurs auteurs.
      </p>
    </main>
  );
}

function Vignette({ r }: { r: Race }) {
  const p = r.photos[0];
  return p ? (
    <img src={p.src} alt="" loading="lazy" className="size-full object-cover" />
  ) : (
    <span className="grid size-full place-items-center bg-[#3a2266] text-[#f3d48a]">
      <LuSparkles className="size-1/2" aria-hidden="true" />
    </span>
  );
}

function Liste({ sorte }: { sorte: Sorte }) {
  const [q, setQ] = useState("");
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const races = LISTE[sorte];
  const groupes = useMemo(() => {
    const m = new Map<string, Race[]>();
    if (sorte === "chien") {
      for (const g of Object.keys(D.groupes)) m.set(g, []);
      m.set("autres", []);
      for (const r of races) m.get(r.groupe && m.has(r.groupe) ? r.groupe : "autres")!.push(r);
    } else {
      for (const g of GROUPES_CHATS) m.set(g, []);
      for (const r of races) m.get(groupeChat(r))!.push(r);
    }
    return [...m.entries()].filter(([, l]) => l.length);
  }, [sorte]);
  const cherche = q.trim().toLowerCase();
  const trouves = cherche ? races.filter((r) => r.nom.toLowerCase().includes(cherche)) : [];
  const nomGroupe = (g: string) => (sorte === "chien" ? (g === "autres" ? "Autres races" : `Groupe ${g} · ${D.groupes[g]}`) : g);

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/compagnons" />
      <Titre sous={sorte === "chien" ? `${races.length} races, rangées comme le fait la Fédération cynologique internationale.` : `${races.length} races, rangées selon leur poil.`}>
        {sorte === "chien" ? "Les chiens" : "Les chats"}
      </Titre>
      <label className="mt-4 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-[#2a1c14]">
        <LuSearch className="size-5 shrink-0" aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={sorte === "chien" ? "Chercher un chien…" : "Chercher un chat…"} className="min-w-0 flex-1 bg-transparent py-1 outline-none" />
      </label>
      {cherche ? (
        <Grille races={trouves} sorte={sorte} vide="Aucune race ne porte ce nom." />
      ) : (
        <div className="mt-4 space-y-3">
          {groupes.map(([g, liste]) => {
            const ouvert = ouverts.has(g);
            return (
              <section key={g} className="carte-nuit rounded-3xl">
                <button
                  type="button"
                  aria-expanded={ouvert}
                  onClick={() => setOuverts((o) => { const n = new Set(o); if (n.has(g)) n.delete(g); else n.add(g); return n; })}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <span className="flex -space-x-3">
                    {liste.filter((r) => r.photos.length).slice(0, 3).map((r) => (
                      <span key={r.id} className="medaillon block size-11 overflow-hidden ring-2 ring-[#24123f]"><Vignette r={r} /></span>
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg leading-tight text-[#f3d48a]">{nomGroupe(g)}</span>
                    <span className="block text-xs">{liste.length} race{liste.length > 1 ? "s" : ""}</span>
                  </span>
                  {ouvert ? <LuChevronDown className="size-6 shrink-0" /> : <LuChevronRight className="size-6 shrink-0" />}
                </button>
                {ouvert ? (
                  <div className="px-3 pb-3">
                    {sorte === "chien" && MOT_GROUPE[g] ? (
                      <p className="mb-2 flex items-start gap-2 rounded-2xl bg-[#fff8ea] px-3 py-2 text-sm font-bold text-[#4a2a8a]">
                        <PlumeDessin className="size-7 shrink-0" />
                        {MOT_GROUPE[g]}
                      </p>
                    ) : null}
                    <Grille races={liste} sorte={sorte} />
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Grille({ races, sorte, vide }: { races: Race[]; sorte: Sorte; vide?: string }) {
  if (!races.length) return <p className="mt-4 text-center">{vide}</p>;
  return (
    <ul className="mt-2 grid grid-cols-3 gap-2">
      {races.map((r) => (
        <li key={r.id}>
          <a href={`#/compagnons/${sorte}/${r.id}`} className="relative block rounded-2xl bg-card px-1 pb-2 pt-1.5 text-center text-[#2a1c14]">
            <span className="mx-auto block aspect-square w-[86%] overflow-hidden rounded-full ring-2 ring-[#d9b56a]"><Vignette r={r} /></span>
            <span className="mt-1 block text-[12px] font-extrabold leading-tight">{r.nom}</span>
            {PREFERES.has(r.id) ? <LuHeart className="absolute right-1.5 top-1.5 size-4 fill-[#e2453c] text-[#e2453c]" aria-label="Préféré de Plume" /> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ fiche

const NC = "Non connu";

function Fiche({ sorte, race: r }: { sorte: Sorte; race?: Race }) {
  // Plume murmure quand c'est un de ses préférés.
  useEffect(() => {
    if (!r || !PREFERES.has(r.id)) return;
    const t = window.setTimeout(() => plumePeutProposer() && plumeDit("Celui-là… c'est un de mes préférés.", 3500), 1200);
    return () => window.clearTimeout(t);
  }, [r?.id]);
  if (!r) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-4">
        <Entete siVide={`/compagnons/${sorte}s`} />
        <p className="titre-or mt-10 text-center text-3xl">Cette race n'est pas dans le carnet.</p>
      </main>
    );
  }
  const tous = espece(sorte);
  const tousLes = sorte === "chien" ? "Comme tous les chiens" : "Comme tous les chats";
  const vie = r.vie ?? r.vie_texte;
  const allure = [r.silhouette && `Silhouette : ${r.silhouette}.`, r.tete && `Tête : ${r.tete}.`, r.yeux && `Yeux : ${r.yeux}.`, r.oreilles && `Oreilles : ${r.oreilles}.`, r.queue && `Queue : ${r.queue}.`].filter(Boolean).join(" ");
  const aLire = [
    r.nom,
    r.intro,
    `Origine. ${r.origine ?? NC}.`,
    sorte === "chien" ? `Groupe. ${r.groupe ? D.groupes[r.groupe] : NC}.` : "",
    `Taille. ${r.taille ?? NC}.`,
    `Poids. ${r.poids ?? NC}.`,
    `Espérance de vie. ${vie ?? (tous.vie ? `${tousLes} : ${tous.vie}` : NC)}.`,
    `Caractère. ${r.caractere ?? NC}.`,
  ].filter(Boolean).join(" ");

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide={`/compagnons/${sorte}s`} />
      <div className="relative mx-auto mt-4 w-max">
        <span className="medaillon-or block size-40 overflow-hidden"><Vignette r={r} /></span>
        {PREFERES.has(r.id) ? (
          <span className="absolute -right-6 bottom-1 rotate-[-8deg] rounded-full border-2 border-[#e2453c] bg-[#fff8ea] px-2 py-0.5 text-[11px] font-black uppercase text-[#e2453c]">Préféré de Plume</span>
        ) : null}
      </div>
      <Titre>{r.nom}</Titre>
      <p className="mt-1 text-center text-sm font-extrabold text-[#f0d090]">
        {sorte === "chien" ? "Race de chien" : "Race de chat"}
        {r.origine ? ` · ${r.origine}` : ""}
      </p>
      {sorte === "chien" && r.groupe ? (
        <p className="mt-1 text-center text-xs">
          <a href="#/compagnons/chiens" className="underline">Groupe {r.groupe} de la FCI</a>
          {r.fci ? ` · standard n° ${r.fci}` : ""}
        </p>
      ) : null}
      <div className="mt-3 flex justify-center"><Ecouter gros texte={aLire} /></div>
      {r.photos[0] ? <p className="mt-1 text-center text-[10px] texte-doux">Photo : {r.photos[0].auteur} · {r.photos[0].licence}</p> : null}

      {r.photos[1] ? (
        <figure className="mt-4">
          <img src={r.photos[1].src} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_8px_18px_rgba(0,0,0,.4)]" />
          <figcaption className="mt-1 text-[10px] leading-tight texte-doux">{r.photos[1].auteur} · {r.photos[1].licence} · Wikimedia Commons</figcaption>
        </figure>
      ) : null}

      {r.intro ? (
        <section className="carte-nuit mt-4 rounded-3xl px-4 py-3">
          <p className="font-display text-lg text-[#f3d48a]">Ce qu'en dit Wikipédia</p>
          <p className="mt-1 leading-relaxed">{r.intro}</p>
        </section>
      ) : null}

      <dl className="mt-5 space-y-3">
        <Rubrique icone={LuMapPin} couleur="#2f7d6d" titre="Pays d'origine">{r.origine ?? NC}</Rubrique>
        {sorte === "chien" ? (
          <Rubrique icone={LuUsers} couleur="#7a4fd0" titre="Groupe (FCI)">
            {r.groupe ? (
              <>
                <span className="font-extrabold">{D.groupes[r.groupe]}</span>
                {MOT_GROUPE[r.groupe] ? <span className="mt-1 block text-sm">{MOT_GROUPE[r.groupe]}</span> : null}
              </>
            ) : "Pas classé par la FCI"}
          </Rubrique>
        ) : null}
        <Rubrique icone={LuRuler} couleur="#2f5fa8" titre="Taille">{r.taille ?? NC}</Rubrique>
        <Rubrique icone={LuScale} couleur="#8d4e1f" titre="Poids">{r.poids ?? NC}</Rubrique>
        <Rubrique icone={LuHeartPulse} couleur="#c23a3a" titre="Espérance de vie">
          {vie ?? (tous.vie ? <TousLes texte={tousLes} valeur={tous.vie} /> : NC)}
        </Rubrique>
        <Rubrique icone={LuBaby} couleur="#c2457a" titre="Petits par portée">
          {r.portee ?? (tous.portee ? <TousLes texte={tousLes} valeur={tous.portee} /> : NC)}
        </Rubrique>
        <Rubrique icone={LuHourglass} couleur="#7a4fd0" titre="Gestation">
          {tous.gestation ? <TousLes texte={tousLes} valeur={tous.gestation} /> : NC}
        </Rubrique>
        <Rubrique icone={LuSparkles} couleur="#b5562a" titre="Poil et couleurs">
          {r.poil || r.robe ? (
            <>
              {r.poil ? <span className="block">Poil : {r.poil}</span> : null}
              {r.robe ? <span className="block">Robe : {r.robe}</span> : null}
            </>
          ) : NC}
        </Rubrique>
        <Rubrique icone={LuEye} couleur="#2f7d6d" titre="Allure">{allure || NC}</Rubrique>
        <Rubrique icone={LuStar} couleur="#d6a531" titre="Caractère">{r.caractere ?? NC}</Rubrique>
        {r.utilisation ? <Rubrique icone={LuBriefcase} couleur="#3f7f2f" titre="À quoi il sert">{r.utilisation}</Rubrique> : null}
        {r.histoire ? <Rubrique icone={LuBookOpen} couleur="#8d4e1f" titre="Son histoire">{r.histoire}</Rubrique> : null}
      </dl>

      <SignaturePlume>
        <p className="text-sm">Fiche rangée par Plume dans son carnet, d'après l'article « {r.wiki} » de Wikipédia en français (licence CC BY-SA) et Wikidata.</p>
      </SignaturePlume>
    </main>
  );
}

function TousLes({ texte, valeur }: { texte: string; valeur: string }) {
  return (
    <>
      <span className="block text-xs font-extrabold text-[#7a5a8a]">{texte}</span>
      {valeur}
    </>
  );
}

function Rubrique({ icone: Icone, couleur, titre, children }: { icone: IconType; couleur: string; titre: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-3xl bg-card px-3 py-3 text-[#2a1c14]">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.18)]" style={{ background: couleur }} aria-hidden="true">
        <Icone className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-sm">{titre}</dt>
        <dd className="mt-0.5 leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

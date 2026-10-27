import { useEffect, useMemo, useRef, useState } from "react";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { GROUPES } from "@/data/catalogue";
import { lireVues, voirAnimal } from "@/lib/carnet";
import { ALBUMS, ouvrirPaquet, type Tirage } from "@/lib/paquets";
import { activerSons, sons, sonsActifs } from "@/lib/sons";
import { definirEcran, ouvrirPlume, plumeDit, plumeReagit } from "@/lib/plume";
import { plumeParticularites, plumeRarete } from "@/lib/plume-animal";
import { explicationPour } from "@/data/guide";
import { REGLES, paquetDuJour, paquetsDisponibles, paquetsIllimites, prendrePaquetDuJour, utiliserPaquet } from "@/lib/recompenses";
import { Entete } from "@/components/entete";
import { Portrait } from "@/components/portrait";
import { Carte3D, niveauDe } from "@/components/carte-animal";
import { CarteCollection, DOS, DosCarte, LegendeCartes, visiteCarte, type Dos } from "@/components/carte-collection";
import { PaquetCartes } from "@/components/paquet-cartes";
import { Classeur } from "@/components/classeur";

type Etape = "pret" | "dechire" | "revele" | "fini";

const EMOJI: Record<string, string> = { carnivores: "🦁", primates: "🐒", rongeurs: "🐭", chauves: "🦇", sabots: "🦌", elephants: "🐘", carapaces: "🦔", marsupiaux: "🦘", oeufs: "🥚", petits: "🐹" };

function ordre(cartes: Tirage[]) {
  // Comme dans les paquets de cartes de sport : la meilleure carte arrive en dernier.
  return [...cartes].sort((a, b) => {
    if (a.chance !== b.chance) return a.chance ? 1 : -1;
    const sa = a.special ? 1 : 0;
    const sb = b.special ? 1 : 0;
    return niveauDe(a.rarete).rang + sa - (niveauDe(b.rarete).rang + sb);
  });
}

export function CartesPage() {
  const groupes = useMemo(() => GROUPES.filter((g) => g.id !== "autres"), []);
  const [famille, setFamille] = useState("toutes");
  const [etape, setEtape] = useState<Etape>("pret");
  const [cartes, setCartes] = useState<Tirage[]>([]);
  const [index, setIndex] = useState(0);
  const [face, setFace] = useState(false);
  const [deja, setDeja] = useState<Set<string>>(() => new Set(lireVues()));
  const [album, setAlbum] = useState<string | null>(null);
  const [montre, setMontre] = useState(24);
  const [son, setSon] = useState(sonsActifs);
  const minuteurs = useRef<number[]>([]);
  const [dos, setDos] = useState<Dos>(() => {
    try { return (localStorage.getItem("leonie-dos-cartes") as Dos) || "arbre"; } catch { return "arbre"; }
  });
  function choisirDos(d: Dos) {
    setDos(d);
    try { localStorage.setItem("leonie-dos-cartes", d); } catch { /* rien */ }
  }

  function plus_tard(f: () => void, ms: number) {
    minuteurs.current.push(window.setTimeout(f, ms));
  }

  const [reserve, setReserve] = useState(paquetsDisponibles);
  const [duJour, setDuJour] = useState(paquetDuJour);
  const [taille, setTaille] = useState<number | null>(null);
  const [etaitJour, setEtaitJour] = useState(false);
  const [rangMax, setRangMax] = useState(0);
  const [lueur, setLueur] = useState("#a77bff"); // la couleur de la meilleure carte du paquet (comme dans les jeux de foot)
  const illimite = false;
  void paquetsIllimites;
  void plumeReagit;

  function ouvrir() {
    if (etape !== "pret") return;
    // D'abord le paquet du jour (5, 10 ou 15 cartes, au hasard), puis les paquets gagnés (10 cartes).
    let n = prendrePaquetDuJour();
    if (n) setDuJour(false);
    else if (utiliserPaquet()) n = 10;
    else return;
    setTaille(n);
    setEtaitJour(duJour);
    setReserve(paquetsDisponibles());
    const avant = new Set(lireVues());
    setDeja(avant);
    const paquet = ouvrirPaquet(famille, avant, n);
    const meilleur = Math.max(...paquet.cartes.map((c) => (c.chance ? 2 : niveauDe(c.rarete).rang)));
    setRangMax(meilleur);
    setLueur(["#d9a273", "#e8edf6", "#f3c35a", "#a77bff", "#ff7ab6"][meilleur] ?? "#a77bff");
    setCartes(ordre(paquet.cartes));
    setIndex(0);
    setFace(false);
    setEtape("dechire");
    plus_tard(() => sons.brillant(), 450);
    plus_tard(() => setEtape("revele"), 1700);
  }

  function toucherCarte() {
    const carte = cartes[index];
    if (!carte) return;
    if (!face) {
      setFace(true);
      sons.retourner();
      voirAnimal(carte.espece.id);
      if (carte.chance || niveauDe(carte.rarete).rang >= 2 || carte.special) plus_tard(() => sons.eclater(), 250);
      if (carte.chance) plus_tard(() => sons.fanfare(), 350);
      else if (niveauDe(carte.rarete).rang >= 2 || carte.special) plus_tard(() => sons.brillant(), 350);
      // Plume dit tout de suite pourquoi la carte est spéciale (avec les vraies données).
      if (carte.chance || carte.special || niveauDe(carte.rarete).rang >= 2) plus_tard(() => plumeDit(plumeRarete(carte.espece, carte.special, carte.chance)[0], 5000), 600);
      return;
    }
    if (index + 1 >= cartes.length) {
      setEtape("fini");
      return;
    }
    setIndex(index + 1);
    setFace(false);
    sons.clic();
  }

  function toutRetourner() {
    for (const c of cartes) voirAnimal(c.espece.id);
    setEtape("fini");
  }

  function recommencer() {
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current = [];
    setEtape("pret");
    setCartes([]);
  }

  // Quand on touche Plume : elle parle de la carte qu'on regarde (pourquoi elle est rare, ses particularités).
  const carteVue = etape === "revele" && face ? cartes[index] : null;
  useEffect(() => {
    if (carteVue) {
      const { espece, rarete, special, chance } = carteVue;
      const visite = visiteCarte(espece, rarete, special, chance);
      const rare = plumeRarete(espece, special, chance);
      const plus = plumeParticularites(espece).filter((t) => !/pèse|bébé|record|menacé|danger|protéger|disparu|nature/.test(t));
      definirEcran({
        id: `carte-${espece.id}`,
        titre: espece.nom,
        etapes: [...rare, "Maintenant, je t'explique tout ce qu'il y a sur la carte. Regarde ce qui s'allume !", ...visite.etapes, ...plus, "Ici, c'est sa carte à collectionner. L'animal en vrai, avec toutes ses photos et tout ce qu'on sait sur lui, est sur sa fiche : touche « Voir sa fiche ».", "Tu peux faire tourner la carte en glissant le doigt. Touche la carte pour voir la suivante."],
        zones: [...rare.map(() => "rarete"), null, ...visite.zones, ...plus.map(() => null), "photo", null],
      });
    } else definirEcran(null);
  }, [carteVue]);
  useEffect(() => () => definirEcran(null), []);

  const couleurDe = (c: Tirage) => (c.chance ? "#ffd24a" : niveauDe(c.rarete).cadre);
  const carte = cartes[index];
  const brille = carte && face && (carte.chance || niveauDe(carte.rarete).rang >= 2 || carte.special);
  const nombre = lireVues().length;

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <div className="mt-4 flex items-center justify-center gap-3">
        <h1 className="titre-or text-4xl">Cartes</h1>
        <button
          type="button"
          onClick={() => {
            activerSons(!son);
            setSon(!son);
          }}
          className="grid size-11 place-items-center rounded-full bg-card"
          aria-label={son ? "Couper les sons" : "Remettre les sons"}
        >
          {son ? <LuVolume2 className="size-5" /> : <LuVolumeX className="size-5" />}
        </button>
      </div>
      <p className="mt-1 text-center">{nombre} carte{nombre > 1 ? "s" : ""} dans ta collection.</p>

      {etape === "pret" ? <div className="mt-4"><Classeur /></div> : null}

      {etape === "pret" ? (
        <>
          <p className="mt-6 text-center font-display text-2xl text-[#f3d48a]">
            {duJour ? "🎁 Le paquet du jour t'attend !" : `${reserve} paquet${reserve > 1 ? "s" : ""} à ouvrir`}
          </p>
          {duJour ? <p className="text-center text-sm texte-doux">5, 10 ou 15 cartes : surprise ! {reserve ? `Et encore ${reserve} paquet${reserve > 1 ? "s" : ""} gagné${reserve > 1 ? "s" : ""} en explorant.` : ""}</p> : null}
          {!(duJour || reserve > 0) ? (
            <div className="carte-nuit mx-auto mt-3 max-w-sm rounded-3xl px-4 py-4 text-center">
              <p className="font-extrabold">Pour gagner un nouveau paquet :</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>lis {REGLES.fichesParPaquet} fiches d'animaux que tu n'as jamais ouvertes,</li>
                <li>ou donne {REGLES.bonnesParPaquet} bonnes réponses aux défis,</li>
                <li>ou réussis un jeu de mémoire.</li>
              </ul>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href="#/mammiferes" className="bouton-bois rounded-2xl py-3 font-extrabold">Lire des fiches</a>
                <a href="#/jouer" className="bouton-parchemin rounded-2xl py-3 font-extrabold">Jouer</a>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {(etape === "pret" && (duJour || reserve > 0)) || etape === "dechire" ? (
        <div className={`scene-paquet mx-auto mt-4 w-full max-w-sm px-6 pb-4 pt-8 ${etape === "dechire" && rangMax >= 3 ? "secoue" : ""}`} style={{ ["--lueur" as string]: lueur }}>
          {etape === "dechire" ? <span className="rayons-tournent pointer-events-none absolute left-1/2 top-[40%] size-[130%] -translate-x-1/2 -translate-y-1/2" style={{ ["--c" as string]: lueur }} aria-hidden="true" /> : null}
          {etape === "dechire" ? <span className="pointer-events-none absolute left-1/2 top-[20%]" style={{ ["--c" as string]: lueur }} aria-hidden="true"><span className="onde" /><span className="onde" style={{ animationDelay: "160ms" }} /></span> : null}
          {etape === "dechire" && rangMax >= 3 ? <span className="flash-ecran pointer-events-none fixed inset-0 z-50 bg-white" aria-hidden="true" /> : null}
          {etape === "dechire" ? <span className="lueur-ouvre pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 38%, ${lueur}, transparent 62%)` }} /> : null}
          <div className="relative"><PaquetCartes duJour={etape === "dechire" ? etaitJour : duJour} taille={taille} ouvert={etape === "dechire"} onDechire={ouvrir} lueur={lueur} /></div>
          <p className="relative mt-3 text-center font-display text-xl text-[#f3d48a] [text-shadow:0_2px_8px_#000]">{etape === "dechire" ? `${taille} cartes !` : "Glisse le doigt ou touche le paquet pour le déchirer !"}</p>
        </div>
      ) : null}

      {etape === "pret" ? (
        <div className="mt-4">
          <p className="mt-4 text-sm font-extrabold text-[#f0d090]">Choisis ton paquet</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choisis ton paquet">
            {[{ id: "toutes", nom: "Tous les animaux", emoji: "🌍" }, ...groupes.map((g) => ({ id: `g:${g.id}`, nom: g.nom, emoji: EMOJI[g.id] ?? "🐾" }))].map((c) => (
              <button key={c.id} type="button" onClick={() => setFamille(c.id)} aria-pressed={famille === c.id} className={`rounded-full px-3 py-2 text-sm font-extrabold ${famille === c.id ? "bg-[#f3d48a] text-[#2a1c14] ring-2 ring-white" : "bg-[#2a1844] text-[#e7d7be]"}`}>
                <span aria-hidden="true">{c.emoji} </span>{c.nom}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {etape === "revele" && carte ? (
        <section className="mt-6 text-center">
          <p className="font-extrabold text-[#f0d090]">Carte {index + 1} sur {cartes.length}</p>
          <div className={`relative mx-auto mt-4 w-60 ${face && (carte.chance || niveauDe(carte.rarete).rang >= 3) ? "secoue" : ""}`} style={{ ["--lueur" as string]: lueur }}>
            {/* la pile : les cartes qui attendent derrière, à plat */}
            {index + 2 < cartes.length ? <span className="absolute inset-0 translate-x-3 translate-y-3 rounded-[1.1rem] bg-[#e8c98a]/50" aria-hidden="true" /> : null}
            {index + 1 < cartes.length ? <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[1.1rem] bg-[#e8c98a]/80" aria-hidden="true" /> : null}
            {face && brille ? <span className="absolute -inset-3 rounded-[1.6rem] opacity-60" style={{ background: couleurDe(carte) }} aria-hidden="true" /> : null}
            <Carte3D key={index} className="carte-sort" tourne={face}>
              <button type="button" onClick={toucherCarte} className={`retournable relative block aspect-[63/88] w-full ${face ? "retourne" : ""}`} aria-label={face ? `${carte.espece.nom} : carte suivante` : "Retourner la carte"}>
                <span className="retournable-interieur block">
                  <span className="face block"><DosCarte modele={dos} /></span>
                  <span className="face face-recto block"><CarteCollection espece={carte.espece} rarete={carte.rarete} special={carte.special} chance={carte.chance} /></span>
                </span>
              </button>
            </Carte3D>
            {face ? <EffetsSpeciaux key={`fx${index}`} carte={carte} /> : null}
          </div>
          {face && carte.chance ? <p className="titre-or mt-5 text-3xl">Wah, la chance !</p> : face ? <p className="mt-4 font-display text-2xl text-[#f3d48a]">{carte.espece.nom}</p> : null}
          {face && !deja.has(carte.espece.id) ? <p className="mt-3 inline-block rounded-full bg-[#f3d48a] px-3 py-1 text-sm font-extrabold text-[#2a1c14]">Nouvelle carte !</p> : null}
          {face ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => ouvrirPlume(true, "page")} className="bouton-parchemin rounded-full px-4 py-2 font-extrabold">🦉 Plume m'explique la carte</button>
              <a href={`#/mammiferes/e-${carte.espece.id}`} className="bouton-bois rounded-full px-4 py-2 font-extrabold">🐾 Voir sa fiche</a>
            </div>
          ) : null}
          <p className="mt-3 text-sm texte-doux">{face ? "Touche la carte pour la suivante. Glisse le doigt pour la faire tourner." : "Touche la carte pour la retourner."}</p>
          <button type="button" onClick={toutRetourner} className="mt-4 rounded-full bg-card px-4 py-2 text-sm font-extrabold">Tout retourner</button>
        </section>
      ) : null}

      {etape === "fini" ? (
        <section className="mt-5">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cartes.map((c) => (
              <li key={c.espece.id} className="arrivee relative">
                <a href={`#/mammiferes/e-${c.espece.id}`} className="block aspect-[63/88]">
                  <CarteCollection espece={c.espece} rarete={c.rarete} special={c.special} chance={c.chance} />
                </a>
                {!deja.has(c.espece.id) ? <span className="absolute -right-1 -top-2 rounded-full bg-[#f3d48a] px-2 py-0.5 text-[11px] font-extrabold text-[#2a1c14]">Nouvelle</span> : null}
              </li>
            ))}
          </ul>
          <div className="au-dessus-barre mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={recommencer} className="bouton-bois rounded-2xl py-4 font-display text-xl">Un autre paquet</button>
            <a href="#/jouer?jeu=memoire" className="bouton-parchemin rounded-2xl py-4 text-center font-display text-xl">Jeu de mémoire</a>
          </div>
        </section>
      ) : null}

      {etape === "pret" ? (
        <>
          <h2 className="titre-or mt-10 text-center text-3xl">Comment lire une carte</h2>
          <p className="mx-auto mt-1 max-w-sm text-center text-sm">Trois cartes qui expliquent tous les dessins. Fais-les glisser.</p>
          <div className="legendes -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            <LegendeCartes />
          </div>

          <h2 className="titre-or mt-10 text-center text-3xl">Le dos de tes cartes</h2>
          <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Le dos de tes cartes">
            {DOS.map((d) => (
              <button key={d.id} type="button" onClick={() => choisirDos(d.id)} aria-pressed={dos === d.id} className={`rounded-xl p-1 ${dos === d.id ? "bg-[#f3d48a] ring-2 ring-white" : "bg-[#2a1844]"}`}>
                <DosCarte modele={d.id} />
                <span className={`mt-1 block text-[11px] font-extrabold leading-tight ${dos === d.id ? "text-[#2a1c14]" : "text-[#e7d7be]"}`}>{d.nom}</span>
              </button>
            ))}
          </div>

          <h2 className="titre-or mt-10 text-center text-3xl">Les albums</h2>
          <p className="mx-auto mt-1 max-w-sm text-center text-sm">Toutes les espèces, rangées par rareté. Le nom ouvre la fiche.</p>
          <ul className="mt-3 space-y-2">
            {ALBUMS.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => { setAlbum(album === a.id ? null : a.id); setMontre(24); }} className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-left">
                  <span className="font-extrabold">{a.titre}</span>
                  <span className="text-sm">{a.especes.filter((e) => deja.has(e.id)).length} / {a.especes.length}</span>
                </button>
                {album === a.id ? (
                  <div className="mt-2">
                    <p className="px-1 text-sm">{a.explique}</p>
                    <ul className="mt-2 grid grid-cols-2 gap-2">
                      {a.especes.slice(0, montre).map((e) => (
                        <li key={e.id}>
                          <a href={`#/mammiferes/e-${e.id}`} className={`flex items-center gap-2 rounded-2xl p-2 ${deja.has(e.id) ? "bg-card" : "bg-[#2a1844] text-[#e7d7be]"}`}>
                            <span className={`medaillon block size-12 shrink-0 overflow-hidden ${deja.has(e.id) ? "" : "opacity-40 grayscale"}`}><Portrait id={e.id} /></span>
                            <span className="text-sm font-extrabold leading-tight">{e.nom}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    {montre < a.especes.length ? (
                      <button type="button" onClick={() => setMontre((n) => n + 24)} className="bouton-bois mt-3 w-full rounded-2xl py-3 font-extrabold">Voir la suite ({a.especes.length - montre} encore)</button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}

function Paquet({ ouvert = false, duJour = false, taille = null }: { ouvert?: boolean; duJour?: boolean; taille?: number | null }) {
  return (
    <span className="paquet relative block aspect-[5/7] w-full overflow-hidden rounded-3xl">
      <span className={`absolute inset-x-0 top-0 h-[16%] border-b-2 border-dashed border-[#e8c98a] bg-[#2a1650] ${ouvert ? "rabat-part" : ""}`} />
      <img src="theme/lune.webp" alt="" className="absolute left-1/2 top-[28%] size-24 -translate-x-1/2 rounded-full shadow-[0_0_25px_rgba(160,110,255,.9)]" />
      <span className="titre-or absolute inset-x-0 bottom-[17%] text-center text-2xl">{duJour ? "Paquet du jour" : "Paquet"}</span>
      <span className="absolute inset-x-0 bottom-[8%] text-center text-sm font-extrabold text-[#f6edd8]">{taille ? `${taille} cartes` : duJour ? "5, 10 ou 15 cartes ?" : "10 cartes… ou 11 ?"}</span>
    </span>
  );
}

const ASTRES = ["#ffd24a", "#ff7ab6", "#7fe0d2", "#a77bff", "#ffffff"];

/** Les effets spéciaux d'une carte qui n'est pas ordinaire : ondes, étoiles qui jaillissent, rayons, flash. */
function EffetsSpeciaux({ carte }: { carte: Tirage }) {
  const rang = carte.chance ? 4 : niveauDe(carte.rarete).rang;
  const couleur = carte.chance ? "#ffd24a" : niveauDe(carte.rarete).cadre;
  const fort = rang >= 3;
  const nb = carte.special && rang < 2 ? 10 : rang >= 4 ? 28 : rang === 3 ? 18 : rang === 2 ? 10 : 0;
  const astres = useMemo(() => Array.from({ length: nb }, (_, i) => {
    const a = (i / Math.max(nb, 1)) * Math.PI * 2 + Math.random() * 0.4;
    const d = 110 + Math.random() * 110;
    return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d), c: ASTRES[i % ASTRES.length], t: Math.round(Math.random() * 150) };
  }), [nb]);
  if (rang < 2 && !carte.special && !carte.chance) return null;
  const ondes = rang >= 4 ? 3 : fort ? 2 : 1;
  return (
    <>
      {fort ? <span className="rayons-tournent pointer-events-none absolute -inset-20 -z-10" style={{ ["--c" as string]: couleur }} aria-hidden="true" /> : null}
      <span className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ ["--c" as string]: couleur }}>
        {Array.from({ length: ondes }, (_, i) => <span key={i} className="onde" style={{ animationDelay: `${i * 140}ms` }} />)}
        {astres.map((a, i) => <i key={i} className="astre" style={{ ["--dx" as string]: `${a.dx}px`, ["--dy" as string]: `${a.dy}px`, ["--c" as string]: a.c, animationDelay: `${a.t}ms` }} />)}
      </span>
      {rang >= 4 ? <span className="flash-ecran pointer-events-none fixed inset-0 z-50 bg-white" aria-hidden="true" /> : null}
    </>
  );
}

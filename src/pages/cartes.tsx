import { useMemo, useRef, useState } from "react";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { FAMILLES } from "@/data/catalogue";
import { lireVues, voirAnimal } from "@/lib/carnet";
import { ALBUMS, ouvrirPaquet, type Tirage } from "@/lib/paquets";
import { activerSons, sons, sonsActifs } from "@/lib/sons";
import { plumeReagit } from "@/lib/plume";
import { REGLES, paquetDuJour, paquetsDisponibles, paquetsIllimites, prendrePaquetDuJour, utiliserPaquet } from "@/lib/recompenses";
import { Entete } from "@/components/entete";
import { Portrait } from "@/components/portrait";
import { Carte3D, CarteRecto, CarteVerso, niveauDe } from "@/components/carte-animal";

type Etape = "pret" | "tremble" | "dechire" | "revele" | "fini";

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
  const familles = useMemo(
    () => Object.entries(FAMILLES).map(([id, f]) => ({ id, nom: f.nom })).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [],
  );
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

  function plus_tard(f: () => void, ms: number) {
    minuteurs.current.push(window.setTimeout(f, ms));
  }

  const [reserve, setReserve] = useState(paquetsDisponibles);
  const [duJour, setDuJour] = useState(paquetDuJour);
  const [taille, setTaille] = useState<number | null>(null);
  const [lueur, setLueur] = useState("#a77bff"); // la couleur de la meilleure carte du paquet (comme dans les jeux de foot)
  const illimite = false;
  void paquetsIllimites;

  function ouvrir() {
    if (etape !== "pret") return;
    // D'abord le paquet du jour (5, 10 ou 15 cartes, au hasard), puis les paquets gagnés (10 cartes).
    let n = prendrePaquetDuJour();
    if (n) setDuJour(false);
    else if (utiliserPaquet()) n = 10;
    else return;
    setTaille(n);
    setReserve(paquetsDisponibles());
    const avant = new Set(lireVues());
    setDeja(avant);
    const paquet = ouvrirPaquet(famille, avant, n);
    const meilleur = Math.max(...paquet.cartes.map((c) => (c.chance ? 2 : niveauDe(c.rarete).rang)));
    setLueur(["#d9a273", "#e8edf6", "#f3c35a", "#a77bff", "#ff7ab6"][meilleur] ?? "#a77bff");
    setCartes(ordre(paquet.cartes));
    setIndex(0);
    setFace(false);
    setEtape("tremble");
    sons.trembler();
    plus_tard(() => sons.trembler(), 450);
    plus_tard(() => sons.brillant(), 900);
    plus_tard(() => {
      setEtape("dechire");
      sons.dechirer();
    }, 1300);
    plus_tard(() => setEtape("revele"), 2200);
  }

  function toucherCarte() {
    const carte = cartes[index];
    if (!carte) return;
    if (!face) {
      setFace(true);
      sons.retourner();
      voirAnimal(carte.espece.id);
      if (carte.chance) {
        plus_tard(() => sons.fanfare(), 350);
        plus_tard(() => plumeReagit("chance"), 500);
      } else if (niveauDe(carte.rarete).rang >= 2 || carte.special) {
        plus_tard(() => sons.brillant(), 350);
        if (niveauDe(carte.rarete).rang >= 3) plus_tard(() => plumeReagit("rare"), 500);
      }
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

      {etape === "pret" ? (
        <>
          <label className="mt-4 block text-sm font-extrabold text-[#f0d090]">
            Choisis ton paquet
            <select value={famille} onChange={(e) => setFamille(e.target.value)} className="mt-1 w-full rounded-2xl bg-card px-3 py-3 text-base text-[#2a1c14]">
              <option value="toutes">Toutes les familles</option>
              {familles.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-center font-display text-2xl text-[#f3d48a]">
            {duJour ? "🎁 Le paquet du jour t'attend !" : `${reserve} paquet${reserve > 1 ? "s" : ""} à ouvrir`}
          </p>
          {duJour ? <p className="text-center text-sm texte-doux">5, 10 ou 15 cartes : surprise ! {reserve ? `Et encore ${reserve} paquet${reserve > 1 ? "s" : ""} gagné${reserve > 1 ? "s" : ""} en explorant.` : ""}</p> : null}
          {duJour || reserve > 0 ? (
            <button type="button" onClick={ouvrir} className="scene-paquet mx-auto mt-3 block w-full max-w-sm" aria-label="Ouvrir le paquet">
              <span className="faisceaux" />
              <span className="lueur-sol" />
              <span className="paquet-3d absolute left-1/2 top-8 block w-48 -ml-24"><Paquet duJour={duJour} /></span>
              <span className="absolute inset-x-0 bottom-4 block text-center font-display text-xl text-[#f3d48a] [text-shadow:0_2px_6px_#000]">Touche le paquet pour l'ouvrir</span>
            </button>
          ) : (
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
          )}
        </>
      ) : null}

      {etape === "tremble" || etape === "dechire" ? (
        <div className="scene-paquet charge mx-auto mt-6 w-full max-w-sm" style={{ ["--lueur" as string]: lueur }}>
          <span className="faisceaux" />
          <span className="lueur-sol" />
          <div className={`absolute left-1/2 top-8 w-48 -ml-24 ${etape === "tremble" ? "paquet-charge" : ""}`}>
            <Paquet ouvert={etape === "dechire"} duJour={false} taille={taille} />
          </div>
          {etape === "dechire" ? <span className="eclat pointer-events-none absolute left-1/2 top-1/3 -ml-24 -mt-24 size-48 rounded-full" style={{ background: `radial-gradient(circle, #fff, ${lueur} 40%, transparent 70%)` }} /> : null}
          {etape === "dechire" ? <span className="flash-blanc pointer-events-none absolute inset-0 bg-white" /> : null}
          {taille ? <p className="absolute inset-x-0 bottom-4 text-center font-display text-2xl text-white [text-shadow:0_2px_8px_#000]">{taille} cartes !</p> : null}
        </div>
      ) : null}

      {etape === "revele" && carte ? (
        <section className="mt-6 text-center">
          <p className="font-extrabold text-[#f0d090]">Carte {index + 1} sur {cartes.length}</p>
          <div className="relative mx-auto mt-4 w-60" style={{ ["--lueur" as string]: lueur }}>
            {brille ? <span className="rayons pointer-events-none absolute -inset-16" /> : null}
            {face ? <span className="pointer-events-none absolute -inset-6 rounded-full opacity-70 blur-2xl" style={{ background: `radial-gradient(circle, ${["#d9a273", "#e8edf6", "#f3c35a", "#a77bff", "#ff7ab6"][carte.chance ? 2 : niveauDe(carte.rarete).rang]}, transparent 70%)` }} /> : null}
            <Carte3D key={index} className="carte-sort">
              <button type="button" onClick={toucherCarte} className={`retournable relative block aspect-[5/7] w-full ${face ? "retourne" : ""}`}>
                <span className="retournable-interieur block">
                  <span className="face block"><CarteVerso /></span>
                  <span className="face face-recto block"><CarteRecto espece={carte.espece} rarete={carte.rarete} special={carte.special} chance={carte.chance} /></span>
                </span>
              </button>
            </Carte3D>
          </div>
          {face && carte.chance ? <p className="titre-or mt-5 text-3xl">Wah, la chance !</p> : null}
          {face && !deja.has(carte.espece.id) ? <p className="mt-3 inline-block rounded-full bg-[#f3d48a] px-3 py-1 text-sm font-extrabold text-[#2a1c14]">Nouvelle carte !</p> : null}
          <p className="mt-3 text-sm texte-doux">{face ? "Touche la carte pour la suivante." : "Touche la carte pour la retourner."}</p>
          <button type="button" onClick={toutRetourner} className="mt-4 rounded-full bg-card px-4 py-2 text-sm font-extrabold">Tout retourner</button>
        </section>
      ) : null}

      {etape === "fini" ? (
        <section className="mt-5">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cartes.map((c) => (
              <li key={c.espece.id} className="arrivee relative">
                <a href={`#/mammiferes/e-${c.espece.id}`} className="block aspect-[5/7]">
                  <CarteRecto espece={c.espece} rarete={c.rarete} special={c.special} chance={c.chance} />
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

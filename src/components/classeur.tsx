// Le classeur à cartes de Leonie : un vrai classeur, fermé, avec son nom sur la couverture.
// On le touche : il s'ouvre. Les cartes sont rangées dans des pochettes en plastique transparent, 9 par page.
// On tourne les pages (flèches ou en glissant le doigt). On sort une carte pour la regarder en grand, puis on la remet.
import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { PAR_ID } from "@/data/catalogue";
import { lireVues } from "@/lib/carnet";
import { marquer, type Tirage } from "@/lib/paquets";
import { definirEcran, ouvrirPlume } from "@/lib/plume";
import { plumeParticularites, plumeRarete } from "@/lib/plume-animal";
import { sons } from "@/lib/sons";
import { Carte3D } from "@/components/carte-animal";
import { PlumeDessin } from "@/components/plume-dessin";
import { CarteCollection, visiteCarte } from "@/components/carte-collection";

const PAR_PAGE = 9;

export function Classeur() {
  const cartes = useMemo<Tirage[]>(() => lireVues().map((id) => PAR_ID.get(id)).filter((e): e is NonNullable<typeof e> => !!e).map((e) => marquer(e, false)), []);
  const pages = Math.max(1, Math.ceil(cartes.length / PAR_PAGE));
  const [ouvert, setOuvert] = useState(false);
  const [page, setPage] = useState(0);
  const [sens, setSens] = useState<"avant" | "arriere" | null>(null);
  const [sortie, setSortie] = useState<Tirage | null>(null);
  const [rentre, setRentre] = useState(false);
  const depart = useRef<number | null>(null);

  function ouvrir() {
    sons.retourner();
    setOuvert(true);
  }
  function tourner(d: 1 | -1) {
    const n = page + d;
    if (n < 0 || n >= pages) return;
    sons.clic();
    setSens(d > 0 ? "avant" : "arriere");
    setPage(n);
  }
  function remettre() {
    setRentre(true);
    sons.clic();
    window.setTimeout(() => { setSortie(null); setRentre(false); }, 380);
  }

  // Plume explique la carte sortie (zone par zone), sinon le classeur.
  useEffect(() => {
    if (sortie) {
      const { espece, rarete, special } = sortie;
      const v = visiteCarte(espece, rarete, special, false);
      const rare = plumeRarete(espece, special, false);
      const plus = plumeParticularites(espece).filter((t) => !/pèse|bébé|record|menacé|danger|protéger|disparu|nature/.test(t));
      definirEcran({ id: `carte-${espece.id}`, titre: espece.nom, etapes: [...rare, "Je t'explique tout ce qu'il y a sur la carte. Regarde ce qui s'allume !", ...v.etapes, ...plus, "Pour la ranger, touche « Remettre dans le classeur »."], zones: [...rare.map(() => "rarete"), null, ...v.zones, ...plus.map(() => null), null] });
    } else if (ouvert) {
      definirEcran({ id: "classeur", titre: "Ton classeur", etapes: [`Voici ton classeur : ${cartes.length} carte${cartes.length > 1 ? "s" : ""}, rangées 9 par page dans des pochettes.`, "Glisse le doigt ou touche les flèches pour tourner les pages.", "Touche une carte pour la sortir de sa pochette et la regarder en grand. Ensuite, tu peux la remettre.", "Plus bas, tu peux ouvrir tes paquets : les nouvelles cartes viennent se ranger ici."] });
    } else definirEcran(null);
  }, [sortie, ouvert, cartes.length]);
  useEffect(() => () => definirEcran(null), []);

  if (!ouvert) {
    return (
      <button type="button" onClick={ouvrir} className="classeur-ferme relative mx-auto block w-[78%] max-w-[18rem]" aria-label={`Ouvrir ton classeur : ${cartes.length} cartes`}>
        <span className="classeur-dos absolute inset-y-0 left-0" aria-hidden="true" />
        <span className="classeur-couv relative flex flex-col items-center justify-center">
          <span className="classeur-coutures absolute" aria-hidden="true" />
          {["hg", "hd", "bg", "bd"].map((c) => <span key={c} className={`classeur-coin classeur-coin-${c} absolute`} aria-hidden="true" />)}
          <span className="classeur-blason grid place-items-center" aria-hidden="true"><PlumeDessin className="size-[82%]" /></span>
          <span className="classeur-titre font-display">Leonie</span>
          <span className="classeur-sous">Ma collection de cartes</span>
          <span className="classeur-compte">{cartes.length} carte{cartes.length > 1 ? "s" : ""}</span>
        </span>
        <span className="classeur-sangle absolute" aria-hidden="true"><span className="classeur-bouton" /></span>
        <span className="mt-3 block text-center text-sm font-extrabold text-[#f3d48a]">Touche le classeur pour l'ouvrir</span>
      </button>
    );
  }

  const visibles = cartes.slice(page * PAR_PAGE, page * PAR_PAGE + PAR_PAGE);
  return (
    <section className="classeur-ouvert-zone mx-auto max-w-md">
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={() => { setOuvert(false); sons.clic(); }} className="rounded-full bg-[#2a1844] px-3 py-1.5 text-sm font-extrabold text-[#e7d7be]">Fermer le classeur</button>
        <span className="text-sm font-extrabold text-[#f3d48a]">Page {page + 1} / {pages}</span>
      </div>
      <div
        className="classeur-ouvert relative mt-2"
        onPointerDown={(e) => { depart.current = e.clientX; }}
        onPointerUp={(e) => { if (depart.current !== null) { const dx = e.clientX - depart.current; if (dx < -50) tourner(1); else if (dx > 50) tourner(-1); } depart.current = null; }}
      >
        <span className="classeur-anneaux absolute inset-y-0 left-0" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} />)}</span>
        <div key={page} className={`classeur-page relative grid grid-cols-3 ${sens ? `page-${sens}` : ""}`}>
          {Array.from({ length: PAR_PAGE }, (_, i) => {
            const c = visibles[i];
            return (
              <span key={i} className="pochette relative block">
                {c ? (
                  <button type="button" onClick={() => { sons.retourner(); setSortie(c); }} className={`block w-full ${sortie?.espece.id === c.espece.id ? "opacity-0" : ""}`} aria-label={`Sortir la carte ${c.espece.nom}`}>
                    <CarteCollection espece={c.espece} rarete={c.rarete} special={c.special} />
                  </button>
                ) : <span className="pochette-vide block" />}
                <span className="pochette-plastique pointer-events-none absolute inset-0" aria-hidden="true" />
              </span>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between">
        <button type="button" onClick={() => tourner(-1)} disabled={page === 0} className="grid size-11 place-items-center rounded-full bg-card disabled:opacity-30" aria-label="Page précédente"><LuChevronLeft className="size-6" /></button>
        <button type="button" onClick={() => tourner(1)} disabled={page >= pages - 1} className="grid size-11 place-items-center rounded-full bg-card disabled:opacity-30" aria-label="Page suivante"><LuChevronRight className="size-6" /></button>
      </div>

      {sortie ? (
        <div className="carte-sortie-fond fixed inset-0 z-40 flex flex-col items-center justify-center px-6" role="dialog" aria-label={`La carte ${sortie.espece.nom}`}>
          <button type="button" onClick={remettre} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-card" aria-label="Remettre la carte"><LuX className="size-5" /></button>
          <div className={`w-[72%] max-w-[17rem] ${rentre ? "carte-rentre" : "carte-sort-pochette"}`}>
            <Carte3D tourne><CarteCollection espece={sortie.espece} rarete={sortie.rarete} special={sortie.special} /></Carte3D>
          </div>
          <p className="mt-3 text-center text-sm texte-doux">Glisse le doigt pour la faire tourner.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => ouvrirPlume(true, "page")} className="bouton-parchemin rounded-full px-4 py-2 font-extrabold">🦉 Plume m'explique</button>
            <a href={`#/mammiferes/e-${sortie.espece.id}`} className="bouton-bois rounded-full px-4 py-2 font-extrabold">🐾 Sa fiche</a>
            <button type="button" onClick={remettre} className="rounded-full bg-[#f3d48a] px-4 py-2 font-extrabold text-[#2a1c14]">Remettre dans le classeur</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

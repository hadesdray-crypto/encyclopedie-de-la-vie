import { useEffect, useMemo, useState } from "react";
import { Entete } from "@/components/entete";
import { FAMILLES, PAR_ID, type Espece } from "@/data/catalogue";
import { lireVues, voirAnimal } from "@/lib/carnet";
import { ouvrirPaquet, ALBUMS, type Tirage } from "@/lib/paquets";
import { Portrait } from "@/components/portrait";

export function CartesPage() {
  const familles = useMemo(
    () => Object.entries(FAMILLES).map(([id, famille]) => ({ id, nom: famille.nom })).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [],
  );
  const [famille, setFamille] = useState("toutes");
  const [vues, setVues] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [cartes, setCartes] = useState<Tirage[]>([]);
  const [chance, setChance] = useState(false);
  const [album, setAlbum] = useState<string | null>(null);
  const [montre, setMontre] = useState(24);
  useEffect(() => {
    setVues(lireVues());
  }, []);
  const gardees = vues
    .map((id) => PAR_ID.get(id))
    .filter((espece): espece is Espece => Boolean(espece))
    .slice(-12)
    .reverse();

  function ouvrir() {
    const paquet = ouvrirPaquet(famille, new Set(vues));
    for (const carte of paquet.cartes) voirAnimal(carte.espece.id);
    setCartes(paquet.cartes);
    setChance(paquet.chance);
    setOuvert(true);
    setVues(lireVues());
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <h1 className="titre-or mt-5 text-center text-4xl">Cartes</h1>
      <p className="mt-2 text-center text-base">
        {vues.length} cartes gardées. Un paquet en a 10. Parfois, au hasard, une 11e arrive. Ce n'est pas tous les six paquets.
      </p>
      <label className="mt-4 block text-sm font-extrabold text-[#f0d090]">
        Paquet
        <select value={famille} onChange={(event) => { setFamille(event.target.value); setOuvert(false); }} className="mt-1 w-full rounded-2xl bg-card px-3 py-3 text-base">
          <option value="toutes">Toutes les familles</option>
          {familles.map((item) => (
            <option key={item.id} value={item.id}>{item.nom}</option>
          ))}
        </select>
      </label>

      {!ouvert ? (
        <button type="button" onClick={ouvrir} className="mx-auto mt-5 block w-44">
          <span className="relative block h-60 rounded-3xl border-4 border-[#e8c98a] bg-[radial-gradient(circle_at_30%_20%,#4a2d78,#140c28_70%)] shadow-[0_16px_40px_rgba(0,0,0,.45)]">
            <span className="absolute inset-3 rounded-2xl border border-[#e8c98a]/50" />
            <span className="absolute left-1/2 top-10 -translate-x-1/2 font-display text-2xl text-[#f3d48a]">Paquet</span>
            <span className="absolute bottom-8 left-0 right-0 text-center text-sm font-extrabold text-[#f6edd8]">10 cartes</span>
          </span>
          <span className="mt-3 block rounded-2xl bouton-bois py-3 font-display text-2xl">Ouvrir</span>
        </button>
      ) : (
        <>
          {chance ? <p className="mt-4 text-center font-display text-3xl text-[#f3d48a]">Wah, la chance !</p> : null}
          <p className="mt-2 text-center text-sm">{cartes.length} cartes dans ce paquet.</p>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {cartes.map((carte) => (
              <li key={carte.espece.id}>
                <a href={`#/mammiferes/e-${carte.espece.id}`} className={`flex h-full flex-col rounded-2xl bg-card p-2 text-center ${carte.chance ? "ring-4 ring-[#e8c98a]" : "ring-1 ring-[#e8c98a]/40"}`}>
                  <span className="medaillon mx-auto block size-24 overflow-hidden">
                    <Portrait id={carte.espece.id} />
                  </span>
                  <span className="mt-2 text-sm font-extrabold leading-tight">{carte.espece.nom}</span>
                  {carte.rarete ? <span className="mt-1 text-xs font-extrabold text-[#8d4e1f]">{carte.rarete}</span> : null}
                  {carte.special ? <span className="text-xs font-extrabold text-[#6a3d86]">{carte.special}</span> : null}
                  {carte.chance ? <span className="mt-1 text-xs font-extrabold text-[#8d4e1f]">Wah, la chance !</span> : null}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setOuvert(false)} className="mt-4 w-full rounded-2xl bouton-bois py-4 font-display text-2xl">
            Un autre paquet
          </button>
        </>
      )}

      {gardees.length > 0 ? (
        <>
          <h2 className="mt-6 text-center font-display text-2xl">Déjà gardées</h2>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {gardees.map((espece) => (
              <li key={espece.id}>
                <a href={`#/mammiferes/e-${espece.id}`} className="block rounded-2xl bg-card p-2 text-center">
                  <span className="medaillon mx-auto block size-16 overflow-hidden">
                    <Portrait id={espece.id} />
                  </span>
                  <span className="mt-1 block text-xs font-extrabold leading-tight">{espece.nom}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="mt-8 text-center font-display text-3xl">Catégories</h2>
      <p className="mx-auto mt-1 max-w-sm text-center text-sm">Toutes les espèces de la catégorie. Le nom ouvre la fiche.</p>
      <ul className="mt-3 space-y-2">
        {ALBUMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                setAlbum(album === item.id ? null : item.id);
                setMontre(24);
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-left"
            >
              <span className="font-extrabold">{item.titre}</span>
              <span className="text-sm">{item.especes.length}</span>
            </button>
          </li>
        ))}
      </ul>
      {ALBUMS.filter((item) => item.id === album).map((item) => (
        <section key={item.id} className="mt-3">
          <p className="text-sm">{item.explique}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {item.especes.slice(0, montre).map((espece) => (
              <li key={espece.id}>
                <a href={`#/mammiferes/e-${espece.id}`} className="flex items-center gap-2 rounded-2xl bg-card p-2">
                  <span className="medaillon block size-12 shrink-0 overflow-hidden">
                    <Portrait id={espece.id} />
                  </span>
                  <span className="text-sm font-extrabold leading-tight">{espece.nom}</span>
                </a>
              </li>
            ))}
          </ul>
          {montre < item.especes.length ? (
            <button type="button" onClick={() => setMontre((n) => n + 24)} className="au-dessus-barre mt-3 w-full rounded-2xl bouton-bois py-3 font-extrabold shadow-lg">
              Voir la suite ({item.especes.length - montre} encore)
            </button>
          ) : null}
        </section>
      ))}
    </main>
  );
}

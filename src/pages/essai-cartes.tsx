// Page d'essai (non reliée au menu) : pour voir les nouvelles cartes avant de les mettre dans l'application.
import { ESPECES } from "@/data/catalogue";
import { aUnePhoto } from "@/components/portrait";
import { rareteDe } from "@/lib/paquets";
import { niveauDe } from "@/components/carte-animal";
import { CarteCollection, DOS, DosCarte } from "@/components/carte-collection";

const choisir = (rang: number, sauf: string[] = []) => ESPECES.find((e) => e.langue === "fr" && aUnePhoto(e.id) && e.masse && e.milieu && niveauDe(rareteDe(e)).rang === rang && !sauf.includes(e.id) && (rang > 0 || e.latin === "Vulpes vulpes"))!;
export function EssaiCartesPage({ params }: { params: URLSearchParams }) {
  const vue = params.get("vue") ?? "recto";
  if (vue === "dos") return (
    <main className="grid grid-cols-2 gap-4 p-4">{DOS.map((d) => <div key={d.id}><div className="w-full"><DosCarte modele={d.id} /></div><p className="mt-1 text-center font-extrabold">{d.nom}</p></div>)}</main>
  );
  const elephant = ESPECES.find((e) => e.latin === "Loxodonta africana")!;
  const cartes = [
    { e: choisir(0), r: rareteDe(choisir(0)) },
    { e: choisir(1), r: rareteDe(choisir(1)) },
    { e: choisir(2), r: rareteDe(choisir(2)) },
    { e: choisir(3), r: rareteDe(choisir(3)) },
    { e: choisir(4), r: rareteDe(choisir(4)) },
    { e: elephant, r: rareteDe(elephant), s: "Le plus fort", c: params.get("chance") === "1" },
  ];
  return (
    <main className="grid grid-cols-2 gap-3 p-3">{cartes.map(({ e, r, s, c }) => <div key={e.id} className="w-full"><CarteCollection espece={e} rarete={r} special={s} chance={c} /></div>)}</main>
  );
}

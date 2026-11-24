// Le grand catalogue des animaux : une porte par grand groupe.
// Pour l'instant, seuls les mammifères ont toutes leurs fiches ; les autres groupes arrivent plus tard
// (on peut déjà les découvrir dans l'arbre de la vie).
import { Entete, Titre } from "@/components/entete";
import { ChoixAffichage, Tuiles, useAffichage, type Tuile } from "@/components/tuiles";
import { LuChevronDown } from "react-icons/lu";
import { ESPECES, estMammifere } from "@/data/catalogue";
import { Portrait } from "@/components/portrait";
import { IMAGES_EVO } from "@/data/arbre";

const GROUPES: { id: string; titre: string; sous: string; vers?: string }[] = [
  { id: "mammiferes", titre: "Mammifères", sous: "Ils ont des poils et boivent le lait de leur mère.", vers: "/mammiferes" },
  { id: "oiseaux", titre: "Oiseaux", sous: "Des plumes, un bec, et ils pondent des œufs.", vers: "/oiseaux" },
  { id: "domestiques", titre: "Animaux domestiques", sous: "Chiens, chats, troupeaux et transhumances.", vers: "/domestiques" },
  { id: "migrations", titre: "Les migrations", sous: "Dans les airs, sur terre et dans la mer.", vers: "/migrations" },
  { id: "reptiles", titre: "Reptiles", sous: "Lézards, serpents, tortues, crocodiles." },
  { id: "amphibiens", titre: "Amphibiens", sous: "Grenouilles, crapauds, salamandres." },
  { id: "nageoires-rayonnees", titre: "Poissons", sous: "La plupart des poissons, des sardines aux poissons-clowns." },
  { id: "requins", titre: "Requins et raies", sous: "Un squelette en cartilage, pas en os." },
  { id: "insectes", titre: "Insectes", sous: "Six pattes et un corps en trois parties." },
  { id: "araignees", titre: "Araignées et scorpions", sous: "Huit pattes : ce ne sont pas des insectes." },
  { id: "crustaces", titre: "Crustacés", sous: "Crabes, crevettes, homards." },
  { id: "mollusques", titre: "Mollusques", sous: "Escargots, pieuvres, moules." },
  { id: "meduses", titre: "Méduses et coraux", sous: "Des animaux sans os ni cerveau." },
  { id: "echinodermes", titre: "Étoiles de mer et oursins", sous: "Souvent cinq bras, ou cinq parties." },
];

// Les mammifères, sans le tardigrade (qui n'en est pas un), et combien ont disparu.
const MAMMIFERES = ESPECES.filter(estMammifere);
const DISPARUES = MAMMIFERES.filter((e) => e.disparue).length;
const MOUTON = ESPECES.find((e) => e.latin === "Ovis aries");

// Une image déjà dans l'appli pour les deux tuiles qui n'en avaient pas : un mouton (domestiques) et la grue cendrée (migrations).
const IMAGES_TUILES: Record<string, React.ReactNode> = {
  domestiques: MOUTON ? <Portrait id={MOUTON.id} couvrir /> : null,
  migrations: <img src="oiseaux/p/grus-grus-0.webp" alt="" loading="lazy" className="object-top" />,
};

export function AnimauxPage({ id }: { id?: string }) {
  const [aff, choisir] = useAffichage("leonie-animaux-affichage");
  if (id) return <Bientot id={id} />;
  const toutes: Tuile[] = GROUPES.map((g) => ({
    vers: g.vers ?? `/animaux/${g.id}`,
    titre: g.titre,
    sous: g.sous,
    image: IMAGES_TUILES[g.id] ?? (IMAGES_EVO[g.id] ? <img src={IMAGES_EVO[g.id].src} alt="" loading="lazy" /> : <span />),
    badge: g.id === "mammiferes" ? `${MAMMIFERES.length.toLocaleString("fr-FR")} espèces, dont ${DISPARUES} disparues` : undefined,
    eteinte: !g.vers,
  }));
  const tuiles = toutes.filter((t) => !t.eteinte);
  const bientot = toutes.filter((t) => t.eteinte);
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/" />
      <Titre sous="Choisis un groupe d'animaux.">Les animaux</Titre>
      <ChoixAffichage aff={aff} choisir={choisir} />
      <Tuiles items={tuiles} aff={aff} grande />
      <details className="volet-fiche carte-nuit mt-5 rounded-3xl px-3 py-1">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 font-display text-xl text-[#f3d48a]">
          <span className="flex-1">Bientôt dans l'encyclopédie</span>
          <span className="text-xs font-black text-[#e7d7ff]">{bientot.length} groupes</span>
          <LuChevronDown className="volet-fleche size-6 shrink-0 transition-transform" aria-hidden="true" />
        </summary>
        <div className="pb-3">
          <p className="mt-1 text-sm">Ces groupes arrivent plus tard, avec de vraies données. Tu peux déjà les découvrir dans l'arbre de la vie.</p>
          <Tuiles items={bientot} aff={aff} />
        </div>
      </details>
      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] texte-doux">Images : Wikimedia Commons, licences libres (les auteurs sont cités dans l'arbre de la vie).</p>
    </main>
  );
}

function Bientot({ id }: { id: string }) {
  const g = GROUPES.find((x) => x.id === id);
  const img = IMAGES_EVO[id];
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/animaux" />
      <Titre sous={g?.sous}>{g?.titre ?? "Bientôt"}</Titre>
      {img ? (
        <figure className="mt-4">
          <img src={img.src} alt="" className="mx-auto aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_10px_22px_rgba(0,0,0,.45)]" />
          <figcaption className="mt-1 text-center text-[11px] texte-doux">{img.auteur} · {img.licence}</figcaption>
        </figure>
      ) : null}
      <section className="carte-nuit mt-4 rounded-3xl px-4 py-4 text-center">
        <p className="font-display text-2xl text-[#f3d48a]">Pas encore de fiches</p>
        <p className="mt-2">Pour l'instant, il n'y a pas encore de fiches pour ce groupe. Elles arriveront plus tard, avec de vraies données.</p>
        <a href={`#/arbre/${id}`} className="bouton-bois mt-4 inline-block rounded-full px-5 py-2.5 font-extrabold">Le découvrir dans l'arbre de la vie</a>
      </section>
    </main>
  );
}

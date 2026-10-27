import { Entete, Titre } from "@/components/entete";

const SOURCES = [
  ["Mammal Diversity Database (MDD)", "Classement des 6 904 mammifères, répartition par pays, statut. Licence CC BY."],
  ["COMBINE et EltonTraits", "Masses, gestations, portées, longévités, alimentation et habitat principal publiés."],
  ["PHYLACINE 1.2 (Faurby et al., 2018)", "Les habitats en plus : eau douce, mer, terre ferme. Seulement les données publiées (« Reported »)."],
  ["Wikipédia et Wikimedia Commons", "Photos des espèces. Les crédits de chaque photo restent à ajouter."],
  ["Natural Earth", "Contours des pays de la carte. Domaine public."],
  ["Commission internationale de stratigraphie (charte 2026)", "Âges des grandes périodes."],
  ["Moody et al. 2024, Nature Ecology & Evolution", "Âge proposé pour LUCA (environ 4,2 milliards d'années, discuté)."],
  ["Liste rouge de l'UICN, World Spider Catalog, Reptile Database, AmphibiaWeb, AviList", "Nombres d'espèces. L'application écrit des chiffres prudents (« plus de… »)."],
  ["Movebank", "Études GPS publiques (lion de Tsavo, kinkajou). Les trajets ne sont chargés qu'avec l'accord d'un adulte."],
  ["Polices Nunito et Fraunces", "Licence SIL Open Font License."],
];

export function SourcesPage() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre sous="D'où viennent les informations. On n'invente rien : si une mesure n'est pas publiée, la fiche dit « Mal connu ».">Sources</Titre>
      <ul className="mt-6 space-y-3">
        {SOURCES.map(([nom, texte]) => (
          <li key={nom} className="rounded-3xl bg-card px-4 py-3"><p className="font-extrabold">{nom}</p><p className="text-sm">{texte}</p></li>
        ))}
      </ul>
    </main>
  );
}

// La fiche complète d'un animal (photo, cri, tous les chiffres), affichée directement sous la carte :
// quand on touche un chemin sur le globe, on voit tout de suite sa fiche, sans quitter la carte.
import { Suspense, lazy } from "react";

const FicheMammifere = lazy(() => import("@/pages/mammiferes").then((m) => ({ default: ({ id }: { id: string }) => <m.Fiche id={id} integre /> })));
const FicheOiseau = lazy(() => import("@/pages/oiseaux").then((m) => ({
  default: ({ id, latin }: { id?: string; latin?: string }) => {
    const o = (id ? m.oiseauParId(id) : undefined) ?? (latin ? m.oiseauParLatin(latin) : undefined);
    return o ? <m.Fiche o={o} integre /> : <p className="py-3 text-center text-sm">Sa fiche complète n'est pas encore dans l'application. Elle sera ajoutée : on ne met que des informations vérifiées.</p>;
  },
})));

/** Une espèce : un identifiant de mammifère (ex. « 1006134 »), ou un identifiant d'oiseau (ex. « grus-grus »), ou le nom latin. */
export function FicheAnimal({ id, latin }: { id?: string | null; latin?: string | null }) {
  const mammifere = id && /^\d+$/.test(id) ? id : null;
  if (!mammifere && !id && !latin) return null;
  return (
    <section className="mt-4 border-t-2 border-[#e8c98a]/40 pt-3" aria-label="Sa fiche complète">
      <h2 className="text-center font-display text-xl text-[#f3d48a]">Sa fiche complète</h2>
      <Suspense fallback={<p className="py-6 text-center text-sm">Un instant…</p>}>
        {mammifere ? <FicheMammifere id={mammifere} /> : <FicheOiseau id={id ?? undefined} latin={latin ?? undefined} />}
      </Suspense>
    </section>
  );
}

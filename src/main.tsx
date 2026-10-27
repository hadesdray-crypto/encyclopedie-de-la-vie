import { DexCadre } from "@/components/dex";
import { TempsEcran } from "@/components/temps-ecran";
import { demarrerTempsEcran } from "@/lib/temps-ecran";
import { StrictMode, Suspense, lazy, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { Barre, ouvertureDepuisBarre } from "@/components/barre";
import { lireInterface } from "@/lib/interface";
import { Cadeau } from "@/components/cadeau";
import { MiseAJour } from "@/components/mise-a-jour";
import { Plume } from "@/components/guide";
import { DefsTissus } from "@/components/vestiaire";
import { appliquerGrosTexte } from "@/lib/reglages";
import { useChemin } from "@/lib/routeur";
import { demarrerHorsLigne } from "@/lib/hors-ligne";
import { demarrerMajApk } from "@/lib/maj-apk";
import { demarrerFleche } from "@/lib/fleche";
import { demarrerClavier } from "@/lib/clavier";
import { demarrerLectureLongue } from "@/lib/lecture-longue";
import { Accueil } from "@/pages/accueil";
import { ArbrePage } from "@/pages/arbre";
import { EssaiCartesPage } from "@/pages/essai-cartes";
import { EssaiBarrePage } from "@/pages/essai-barre";
import { FrisePage } from "@/pages/frise";
import { LexiquePage } from "@/pages/lexique";
import { SourcesPage } from "@/pages/sources";

// Les pages qui utilisent le grand catalogue des mammifères se chargent à la demande.
const Mammiferes = lazy(() => import("@/pages/mammiferes").then((m) => ({ default: m.MammiferesPage })));
const Fossiles = lazy(() => import("@/pages/fossiles").then((m) => ({ default: m.FossilesPage })));
const Kratt = lazy(() => import("@/pages/kratt").then((m) => ({ default: m.KrattPage })));
const Animaux = lazy(() => import("@/pages/animaux").then((m) => ({ default: m.AnimauxPage })));
const Voyageurs = lazy(() => import("@/pages/aventure-carte").then((m) => ({ default: m.AventureCartePage })));
const Jouer = lazy(() => import("@/pages/jouer").then((m) => ({ default: m.JouerPage })));
const Evolution = lazy(() => import("@/pages/evolution").then((m) => ({ default: m.EvolutionPage })));
const Cartes = lazy(() => import("@/pages/cartes").then((m) => ({ default: m.CartesPage })));
const Profil = lazy(() => import("@/pages/profil").then((m) => ({ default: m.ProfilPage })));
// L'ancienne liste des animaux suivis est remplacée par « Les voyages » (dans Aventure).
function VersVoyages() {
  location.replace("#/voyageurs?voyages=1");
  return null;
}
const Compagnons = lazy(() => import("@/pages/compagnons").then((m) => ({ default: m.CompagnonsPage })));
const Chercher = lazy(() => import("@/pages/chercher").then((m) => ({ default: m.ChercherPage })));
const Atelier = lazy(() => import("@/pages/atelier").then((m) => ({ default: m.AtelierPage })));
const Options = lazy(() => import("@/pages/options").then((m) => ({ default: m.OptionsPage })));

type Page = ComponentType<{ id?: string; params: URLSearchParams }>;

const ROUTES: [string, Page][] = [
  ["/arbre", ArbrePage],
  ["/frise", FrisePage],
  ["/evolution", Evolution],
  ["/mammiferes", Mammiferes],
  ["/fossiles", Fossiles],
  ["/lexique", LexiquePage],
  ["/jouer", Jouer],
  ["/cartes", Cartes],
  ["/essai-cartes", EssaiCartesPage],
  ["/essai-barre", EssaiBarrePage],
  ["/profil", Profil],
  ["/suivi", VersVoyages],
  ["/aventure", VersVoyages],
  ["/options", Options],
  ["/atelier", Atelier],
  ["/chercher", Chercher],
  ["/compagnons", Compagnons],
  ["/sources", SourcesPage],
  ["/kratt", Kratt],
  ["/animaux", Animaux],
  ["/voyageurs", Voyageurs],
];

function Introuvable() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      <p className="titre-or text-3xl">Cette page n'existe pas.</p>
      <a href="#/" className="mt-6 inline-block rounded-2xl bg-card px-5 py-3 font-extrabold">
        Retour à l'accueil
      </a>
    </main>
  );
}

function Chargement() {
  return <p className="py-16 text-center font-display text-2xl text-[#f0d090]">Un instant…</p>;
}

function App() {
  const { chemin, params } = useChemin();
  let contenu = <Introuvable />;
  if (chemin === "/" || chemin === "") contenu = <Accueil />;
  for (const [base, Composant] of ROUTES) {
    if (chemin === base || chemin.startsWith(`${base}/`)) {
      const id = chemin.length > base.length ? chemin.slice(base.length + 1) : undefined;
      contenu = <Composant key={chemin + "?" + params.toString()} id={id} params={params} />;
      break;
    }
  }
  return (
    <>
      <div key={chemin} className={ouvertureDepuisBarre() && lireInterface().ouverture !== "aucune" ? `ouverture-${lireInterface().ouverture}` : undefined}><Suspense fallback={<Chargement />}>{contenu}</Suspense></div>
      {ouvertureDepuisBarre() && lireInterface().ouverture === "centre" ? <span key={`a${chemin}`} className="anneau-ouverture pointer-events-none fixed left-1/2 top-[45%] z-20" aria-hidden="true" /> : null}
      <Barre chemin={chemin} />
      <Cadeau />
      <MiseAJour />
      <DefsTissus />
      <Plume chemin={chemin} params={params} />
      <TempsEcran />
      <DexCadre chemin={chemin} />
    </>
  );
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

appliquerGrosTexte();
demarrerHorsLigne();
demarrerMajApk();
demarrerTempsEcran();
demarrerFleche();
demarrerClavier();
demarrerLectureLongue();

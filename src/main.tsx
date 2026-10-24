import { StrictMode, Suspense, lazy, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { Barre } from "@/components/barre";
import { Cadeau } from "@/components/cadeau";
import { MiseAJour } from "@/components/mise-a-jour";
import { appliquerGrosTexte } from "@/lib/reglages";
import { useChemin } from "@/lib/routeur";
import { demarrerHorsLigne } from "@/lib/hors-ligne";
import { demarrerMajApk } from "@/lib/maj-apk";
import { Accueil } from "@/pages/accueil";
import { ArbrePage } from "@/pages/arbre";
import { FrisePage } from "@/pages/frise";
import { LexiquePage } from "@/pages/lexique";
import { SourcesPage } from "@/pages/sources";

// Les pages qui utilisent le grand catalogue des mammifères se chargent à la demande.
const Mammiferes = lazy(() => import("@/pages/mammiferes").then((m) => ({ default: m.MammiferesPage })));
const Fossiles = lazy(() => import("@/pages/fossiles").then((m) => ({ default: m.FossilesPage })));
const Jouer = lazy(() => import("@/pages/jouer").then((m) => ({ default: m.JouerPage })));
const Cartes = lazy(() => import("@/pages/cartes").then((m) => ({ default: m.CartesPage })));
const Profil = lazy(() => import("@/pages/profil").then((m) => ({ default: m.ProfilPage })));
const Suivi = lazy(() => import("@/pages/suivi").then((m) => ({ default: m.SuiviPage })));

type Page = ComponentType<{ id?: string; params: URLSearchParams }>;

const ROUTES: [string, Page][] = [
  ["/arbre", ArbrePage],
  ["/frise", FrisePage],
  ["/mammiferes", Mammiferes],
  ["/fossiles", Fossiles],
  ["/lexique", LexiquePage],
  ["/jouer", Jouer],
  ["/cartes", Cartes],
  ["/profil", Profil],
  ["/suivi", Suivi],
  ["/sources", SourcesPage],
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
      <Suspense fallback={<Chargement />}>{contenu}</Suspense>
      <Barre chemin={chemin} />
      <Cadeau />
      <MiseAJour />
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

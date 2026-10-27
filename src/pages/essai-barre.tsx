// Page d'essai (non reliée) : propositions pour la barre du bas, le porte-cartes et les pastilles.
import { IconeAccueil, IconeArbre, IconeCarte, IconeCartes, IconeJouer, PastillePaquet, PastillePiece, PorteCartes } from "@/components/icones-salles";

const SALLES = [
  { nom: "Accueil", I: IconeAccueil },
  { nom: "Arbre", I: IconeArbre },
  { nom: "Carte", I: IconeCarte },
  { nom: "Cartes", I: IconeCartes },
  { nom: "Jouer", I: IconeJouer },
];

function Barre({ style, actif = 1, pastille }: { style: 1 | 2 | 3; actif?: number; pastille: "piece" | "paquet" }) {
  return (
    <ul className={`essai-barre essai-barre-${style} grid grid-cols-5 items-end`}>
      {SALLES.map(({ nom, I }, i) => (
        <li key={nom} className={`flex flex-col items-center ${i === actif ? "actif" : ""}`}>
          <span className="essai-icone relative block">
            <I />
            {nom === "Cartes" ? <span className="absolute -right-2 -top-2">{pastille === "piece" ? <PastillePiece n={4} /> : <PastillePaquet n={4} />}</span> : null}
          </span>
          <span className="essai-nom">{nom}</span>
        </li>
      ))}
    </ul>
  );
}

export function EssaiBarrePage() {
  return (
    <main className="space-y-6 px-3 py-4">
      <p className="titre-or text-center text-2xl">A · Médailles dorées</p>
      <Barre style={1} pastille="piece" />
      <p className="titre-or text-center text-2xl">B · Grandes médailles, nom en étiquette</p>
      <Barre style={2} actif={3} pastille="paquet" />
      <p className="titre-or text-center text-2xl">C · Socles en laiton</p>
      <Barre style={3} actif={2} pastille="piece" />
      <p className="titre-or text-center text-2xl">Le porte-cartes (page Cartes)</p>
      <div className="mx-auto w-48"><PorteCartes /></div>
    </main>
  );
}

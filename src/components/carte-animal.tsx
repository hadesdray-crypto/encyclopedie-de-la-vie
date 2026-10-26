import { LuMapPin, LuPawPrint, LuRuler, LuScale, LuStar, LuUtensils } from "react-icons/lu";
import { AUTRES_PAR_ID } from "@/data/autres";
import { FAMILLES, type Espece } from "@/data/catalogue";
import { REGIMES } from "@/data/fiches-vie";
import estimations from "@/data/estimations.json";
import { Portrait } from "@/components/portrait";

const EST = estimations as Record<string, Record<string, { t: string }>>;

/**
 * Les niveaux de rareté, du plus courant au plus rare.
 * Les couleurs sont à plat (pas de reflet) : une couleur de fond, une couleur de cadre, une couleur de texte.
 */
export const NIVEAUX: Record<string, { rang: number; nom: string; etoiles: number; fond: string; cadre: string; encre: string }> = {
  "Répandu": { rang: 0, nom: "Commune", etoiles: 1, fond: "#d7f0c8", cadre: "#4f9d3b", encre: "#1f4a1a" },
  "Pas très répandu": { rang: 1, nom: "Jolie", etoiles: 2, fond: "#cfe8ff", cadre: "#3b82d6", encre: "#123a6b" },
  "Assez peu répandu": { rang: 2, nom: "Rare", etoiles: 3, fond: "#ffe7a8", cadre: "#d9a21b", encre: "#5a3a05" },
  "Peu répandu": { rang: 3, nom: "Super rare", etoiles: 4, fond: "#e6d8ff", cadre: "#7a4fd0", encre: "#2f1670" },
  "Très peu répandu": { rang: 4, nom: "Légendaire", etoiles: 5, fond: "#ffd6e8", cadre: "#e0407f", encre: "#6b0f35" },
};

export function niveauDe(rarete: string | null) {
  return NIVEAUX[rarete ?? "Répandu"] ?? NIVEAUX["Répandu"];
}

/** « Océanie : Australie » devient « Océanie » : court, pour tenir sur la carte. */
function ouCourt(e: Espece) {
  const t = e.ou.split(":")[0].split(". ")[0].trim().replace(/\.$/, "");
  return t.length > 26 ? `${t.slice(0, 24).trim()}…` : t || "?";
}

function masseCourte(e: Espece) {
  const autre = AUTRES_PAR_ID.get(e.id);
  if (autre?.taille) return { etiquette: "Il mesure", valeur: autre.taille, regle: true };
  const m = e.masse ?? EST[e.id]?.masse?.t;
  return { etiquette: "Il pèse", valeur: m ? `${e.masse ? "" : "≈ "}${m.replace(/^environ /, "")}` : "?", regle: false };
}

function regimeCourt(e: Espece) {
  const r = e.regime ?? EST[e.id]?.regime?.t;
  const nom = r ? REGIMES[r as keyof typeof REGIMES]?.nom : undefined;
  return nom ? `${e.regime ? "" : "≈ "}${nom}` : "?";
}

/** Recto d'une carte à jouer, à plat : cadre de couleur, photo, trois infos et les étoiles de rareté. */
export function CarteRecto({ espece, rarete, special, chance }: { espece: Espece; rarete: string | null; special?: string | null; chance?: boolean }) {
  const n = niveauDe(rarete);
  const mesure = masseCourte(espece);
  const lignes = [
    { Icone: LuMapPin, etiquette: "Il vit", valeur: ouCourt(espece) },
    { Icone: LuUtensils, etiquette: "Il mange", valeur: regimeCourt(espece) },
    { Icone: mesure.regle ? LuRuler : LuScale, etiquette: mesure.etiquette, valeur: mesure.valeur },
  ];
  return (
    <span className="carte-plate relative block size-full" style={{ ["--fond" as string]: n.fond, ["--cadre" as string]: n.cadre, ["--encre" as string]: n.encre }}>
      <span className={`carte-plate-interieur flex size-full flex-col ${chance ? "carte-plate-chance" : ""}`}>
        <span className="carte-plate-titre block truncate text-center font-display">{espece.nom}</span>
        <span className="carte-plate-photo relative block overflow-hidden">
          <Portrait id={espece.id} />
          {chance ? <span className="carte-plate-badge absolute right-[3%] top-[4%]">Chance !</span> : special ? <span className="carte-plate-badge absolute right-[3%] top-[4%]">{special}</span> : null}
        </span>
        <span className="carte-plate-rang flex items-center justify-center gap-[2cqw]">
          <span className="font-black">{n.nom}</span>
          <span className="flex" aria-label={`${n.etoiles} étoiles`}>
            {Array.from({ length: 5 }, (_, i) => <LuStar key={i} className={`carte-plate-etoile ${i < n.etoiles ? "plein" : ""}`} aria-hidden="true" />)}
          </span>
        </span>
        <span className="carte-plate-lignes flex flex-col">
          {lignes.map(({ Icone, etiquette, valeur }) => (
            <span key={etiquette} className="carte-plate-ligne flex items-center">
              <Icone className="carte-plate-icone shrink-0" aria-hidden="true" />
              <span className="carte-plate-etiquette shrink-0">{etiquette}</span>
              <span className="min-w-0 flex-1 truncate text-right font-extrabold">{valeur}</span>
            </span>
          ))}
        </span>
        <span className="carte-plate-pied block truncate text-center">{FAMILLES[espece.famille]?.nom}</span>
      </span>
    </span>
  );
}

/** Verso commun : le dos de toutes les cartes, à plat, avec une patte. */
export function CarteVerso() {
  return (
    <span className="carte-dos grid size-full place-items-center">
      <span className="carte-dos-rond grid place-items-center">
        <LuPawPrint className="size-1/2" aria-hidden="true" />
      </span>
    </span>
  );
}

// Petit routeur par « # » : l'adresse ressemble à .../#/mammiferes/e-1006020.
// Il marche partout, même ouvert depuis un dossier ou depuis GitHub Pages.
//
// Il garde aussi le chemin suivi dans l'application (accueil → mammifères → famille → fiche…),
// pour que « Retour » (le bouton en haut, ou la flèche du téléphone) revienne pas à pas.
import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

function cheminActuel() {
  const brut = window.location.hash.replace(/^#/, "") || "/";
  const [chemin, requete = ""] = brut.split("?");
  return { chemin: decodeURI(chemin), params: new URLSearchParams(requete) };
}

// ---- Le chemin suivi ----
// Chaque page visitée reçoit un numéro (dans history.state). Ainsi, on sait toujours
// où l'on est dans le chemin, même quand on revient en arrière avec le téléphone.
const CLE_CHEMIN = "leonie-chemin";
let pile: string[] = [];
let position = 0;
let remplacement = false;

function adresse() {
  return window.location.hash.replace(/^#/, "") || "/";
}

function garder() {
  try {
    sessionStorage.setItem(CLE_CHEMIN, JSON.stringify(pile));
  } catch {
    /* rien */
  }
}

function numeroDansHistorique(): number | undefined {
  const n = (window.history.state as { leonie?: number } | null)?.leonie;
  return typeof n === "number" ? n : undefined;
}

function noter() {
  const ici = adresse();
  const n = numeroDansHistorique();
  if (remplacement) {
    // La page actuelle a été remplacée par sa page parente : même place dans le chemin.
    remplacement = false;
    pile = [...pile.slice(0, position), ici];
    try {
      window.history.replaceState({ ...(window.history.state ?? {}), leonie: position }, "");
    } catch {
      /* rien */
    }
  } else if (n !== undefined && pile[n] === ici) {
    position = n; // on est revenu (ou reparti) sur une page déjà dans le chemin
  } else {
    position = pile.length ? position + 1 : 0;
    pile = [...pile.slice(0, position), ici];
    try {
      window.history.replaceState({ ...(window.history.state ?? {}), leonie: position }, "");
    } catch {
      /* rien */
    }
  }
  garder();
}

(function demarrer() {
  try {
    pile = JSON.parse(sessionStorage.getItem(CLE_CHEMIN) || "[]");
  } catch {
    pile = [];
  }
  const n = numeroDansHistorique();
  if (n !== undefined && pile[n] === adresse()) position = n;
  else {
    pile = [];
    noter();
  }
  window.addEventListener("hashchange", noter);
})();

/** Est-ce qu'il y a une page avant, dans le chemin de Leonie ? */
export function peutRevenir() {
  return position > 0;
}

// Une page peut dire quelle est sa page parente (par exemple la fiche → sa famille).
let parentDeclare: { ici: string; vers: string } | null = null;
export function declarerParent(vers: string) {
  parentDeclare = { ici: adresse(), vers };
}

/** La page parente, quand on arrive directement sur une page (sans chemin). */
function parent(chemin: string) {
  if (parentDeclare && parentDeclare.ici === chemin) return parentDeclare.vers;
  const [c] = chemin.split("?");
  if (c === "/" || c === "") return null;
  if (c.startsWith("/mammiferes/e-") || c.startsWith("/mammiferes/f-") || c.startsWith("/mammiferes/o-")) return "/mammiferes";
  if (c.startsWith("/suivi")) return "/aventure";
  const morceaux = c.split("/").filter(Boolean);
  return morceaux.length > 1 ? `/${morceaux.slice(0, -1).join("/")}` : "/";
}

/** Revenir d'un pas. Renvoie false si on est déjà à l'accueil sans chemin derrière. */
export function revenir(siVide?: string) {
  if (position > 0) {
    window.history.back();
    return true;
  }
  const vers = siVide ?? parent(adresse());
  if (!vers || vers === adresse()) return false;
  // Arrivée directe sur une page : on remplace par la page parente.
  remplacement = true;
  window.location.replace(`#${vers}`);
  return true;
}

/** Ancien nom, gardé pour les pages qui l'utilisent. */
export function retour(siVide?: string) {
  revenir(siVide);
}

export function useChemin() {
  const [etat, setEtat] = useState(cheminActuel);
  useEffect(() => {
    const suivre = () => {
      setEtat(cheminActuel());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", suivre);
    return () => window.removeEventListener("hashchange", suivre);
  }, []);
  return etat;
}

export function aller(vers: string) {
  window.location.hash = vers;
}

type LienProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { vers: string; children: ReactNode };

export function Lien({ vers, children, ...reste }: LienProps) {
  return (
    <a href={`#${vers}`} {...reste}>
      {children}
    </a>
  );
}

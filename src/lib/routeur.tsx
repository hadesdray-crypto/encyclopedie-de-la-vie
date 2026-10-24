// Petit routeur par « # » : l'adresse ressemble à .../#/mammiferes/e-1006020.
// Il marche partout, même ouvert depuis un dossier ou depuis GitHub Pages.
import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

function cheminActuel() {
  const brut = window.location.hash.replace(/^#/, "") || "/";
  const [chemin, requete = ""] = brut.split("?");
  return { chemin: decodeURI(chemin), params: new URLSearchParams(requete) };
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

export function retour(siVide: string) {
  if (window.history.length > 1) window.history.back();
  else aller(siVide);
}

type LienProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { vers: string; children: ReactNode };

export function Lien({ vers, children, ...reste }: LienProps) {
  return (
    <a href={`#${vers}`} {...reste}>
      {children}
    </a>
  );
}

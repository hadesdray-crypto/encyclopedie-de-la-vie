// Appuyer longtemps sur un texte : Plume le lit à voix haute.
// Le texte lu s'éclaire en violet. Ça marche sur toutes les pages.
import { voixPossible } from "@/components/voix";
import { dire } from "@/lib/parole";

const CLE = "leonie-lecture-longue";
export function lectureLongue() {
  try {
    return localStorage.getItem(CLE) !== "non";
  } catch {
    return true;
  }
}
export function choisirLectureLongue(oui: boolean) {
  try {
    localStorage.setItem(CLE, oui ? "oui" : "non");
  } catch {
    /* rien */
  }
}

const BLOCS = "p,li,h1,h2,h3,h4,dd,dt,label,figcaption,blockquote,button,a";

export function demarrerLectureLongue() {
  let minuteur = 0;
  let depart: { x: number; y: number } | null = null;
  let avale = false;
  let eclaire: HTMLElement | null = null;

  const annuler = () => {
    window.clearTimeout(minuteur);
    depart = null;
  };

  document.addEventListener("pointerdown", (e) => {
    avale = false;
    if (!lectureLongue() || !voixPossible()) return;
    const cible = e.target as HTMLElement;
    // Pas sur Plume elle-même (elle a son propre appui long), ni dans les champs à écrire.
    if (cible.closest('[aria-label^="Plume"], input, textarea, audio, [role="dialog"]')) return;
    const bloc = cible.closest(BLOCS) as HTMLElement | null;
    if (!bloc || !bloc.closest("main")) return;
    const texte = (bloc.innerText || "").replace(/\s+/g, " ").trim();
    if (texte.length < 2) return;
    depart = { x: e.clientX, y: e.clientY };
    minuteur = window.setTimeout(() => {
      depart = null;
      avale = true;
      eclaire?.classList.remove("texte-lu");
      eclaire = bloc;
      bloc.classList.add("texte-lu");
      window.setTimeout(() => bloc.classList.remove("texte-lu"), Math.min(12000, 1500 + texte.length * 60));
      navigator.vibrate?.(10);
      dire(texte);
    }, 650);
  });
  document.addEventListener("pointermove", (e) => {
    if (depart && Math.hypot(e.clientX - depart.x, e.clientY - depart.y) > 10) annuler();
  });
  document.addEventListener("pointerup", annuler);
  document.addEventListener("pointercancel", annuler);
  document.addEventListener("scroll", annuler, { passive: true });
  // Après un appui long, le « clic » qui suit ne doit pas ouvrir le lien ou le bouton.
  document.addEventListener(
    "click",
    (e) => {
      if (avale) {
        avale = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  document.addEventListener("contextmenu", (e) => {
    if ((e.target as HTMLElement).closest("main")) e.preventDefault();
  });
}

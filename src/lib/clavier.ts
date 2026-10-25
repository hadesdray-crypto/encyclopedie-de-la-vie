// Quand le clavier du téléphone s'ouvre pour écrire : la barre du bas et Plume se cachent,
// et le champ remonte en haut de l'écran pour que les réponses restent bien visibles (pas cachées par le clavier).
const ECRIT = (el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement =>
  (el instanceof HTMLInputElement && !["checkbox", "radio", "range", "button", "submit"].includes(el.type)) || el instanceof HTMLTextAreaElement;

export function demarrerClavier() {
  let t = 0;
  document.addEventListener("focusin", (e) => {
    if (!ECRIT(e.target)) return;
    window.clearTimeout(t);
    document.body.dataset.clavier = "1";
    const champ = e.target;
    // Seulement pour les recherches (pas pour les calculs des tables, qui restent à leur place).
    if (champ.inputMode === "numeric" || champ.closest("[data-sans-remonter]")) return;
    window.setTimeout(() => champ.scrollIntoView({ block: "start", behavior: "smooth" }), 320);
  });
  document.addEventListener("focusout", (e) => {
    if (!ECRIT(e.target)) return;
    t = window.setTimeout(() => { if (!ECRIT(document.activeElement)) delete document.body.dataset.clavier; }, 150);
  });
}

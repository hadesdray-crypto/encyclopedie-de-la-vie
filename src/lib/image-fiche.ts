// Toucher la photo d'un animal ouvre sa fiche, partout dans l'application,
// sauf si la photo sert déjà de bouton ou de lien (menu, carte, jeu), ou si on est déjà sur sa fiche.
export function demarrerImagesFiches() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    const cible = e.target as Element | null;
    const photo = cible?.closest?.("[data-animal]") as HTMLElement | null;
    if (!photo) return;
    // Pages où la photo est une réponse, une carte à jouer ou un réglage : on ne change rien.
    if (/^#\/(jouer|aventure|cartes|essai|profil|options|nid|personnage|atelier|kratt|suivi)/.test(location.hash)) return;
    if (photo.closest("a, button, [role=button], [role=dialog], input, label, summary, [data-sans-fiche], [draggable=true]")) return;
    const id = photo.getAttribute("data-animal");
    if (!id) return;
    const but = `#/mammiferes/e-${id}`;
    if (location.hash === but) return;
    location.hash = but;
  });
}

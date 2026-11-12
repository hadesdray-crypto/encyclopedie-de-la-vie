// La zone de la barre du téléphone (heure, réseau, batterie) : une bande pleine, de la largeur de l'écran,
// posée au-dessus de tout. Un toucher dessus ne fait rien dans l'appli ni dans les jeux. Le reste de l'écran reste en grand.
export function BarreHaut() {
  if (!document.documentElement.dataset.natif) return null;
  const avaler = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return <div className="barre-haut" aria-hidden="true" onPointerDown={avaler} onClick={avaler} onTouchStart={avaler} />;
}

/** Dans l'application (ou installée sur l'écran d'accueil), l'appli passe sous la barre du téléphone : on réserve cette zone. */
export function demarrerBarreHaut() {
  const pont = (window as unknown as { Capacitor?: unknown }).Capacitor;
  const installee = window.matchMedia?.("(display-mode: standalone)").matches || window.matchMedia?.("(display-mode: fullscreen)").matches;
  if (pont || installee) document.documentElement.dataset.natif = "1";
}

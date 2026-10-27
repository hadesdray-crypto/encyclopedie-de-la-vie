// Ce que les grandes personnes règlent pour la famille, gardé seulement sur ce téléphone :
// la photo de la fin de l'histoire de la vie, et l'adresse du Concepteur pour la boîte à idées.
const CLE_PHOTO = "leonie-photo-fin";
const CLE_ADRESSE = "leonie-adresse-concepteur";

export function photoFin(): string | null {
  try { return localStorage.getItem(CLE_PHOTO); } catch { return null; }
}
export function effacerPhotoFin() {
  try { localStorage.removeItem(CLE_PHOTO); } catch { /* rien */ }
}
/** La photo choisie est réduite (600 px au plus) pour rester légère, puis gardée sur le téléphone. */
export function choisirPhotoFin(fichier: File): Promise<string> {
  return new Promise((ok, ko) => {
    const img = new Image();
    const url = URL.createObjectURL(fichier);
    img.onload = () => {
      const k = Math.min(1, 600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const donnees = c.toDataURL("image/jpeg", 0.82);
      try {
        localStorage.setItem(CLE_PHOTO, donnees);
        ok(donnees);
      } catch (e) {
        ko(e);
      }
    };
    img.onerror = () => ko(new Error("image illisible"));
    img.src = url;
  });
}

export function adresseConcepteur() {
  try { return localStorage.getItem(CLE_ADRESSE) ?? ""; } catch { return ""; }
}
export function choisirAdresseConcepteur(a: string) {
  try { localStorage.setItem(CLE_ADRESSE, a.trim()); } catch { /* rien */ }
}

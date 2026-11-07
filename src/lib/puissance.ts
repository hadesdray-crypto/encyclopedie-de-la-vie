// La puissance de l'appareil : les fonctions gourmandes (relief, vue « avec ses yeux ») préviennent si l'appareil est modeste.
export function appareilModeste(): boolean {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.deviceMemory !== undefined && n.deviceMemory <= 3) || (n.hardwareConcurrency !== undefined && n.hardwareConcurrency <= 4);
}
export const AVERTISSEMENT_PUISSANCE = "Attention : cet appareil est plutôt modeste. Cette vue demande beaucoup de ressources : elle peut ramer ou ralentir la tablette.";

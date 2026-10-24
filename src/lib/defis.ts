// Le défi du jour : les jours réussis, gardés sur l'appareil.
export const CLE_DEFIS = "leonie-defis";

export function aujourdhui(decalage = 0) {
  const d = new Date();
  d.setDate(d.getDate() - decalage);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function lireDefis(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CLE_DEFIS) || "{}");
  } catch {
    return {};
  }
}

/** Nombre de jours réussis d'affilée. Si le défi d'aujourd'hui n'est pas fait, la série d'hier compte toujours. */
export function serie(defis: Record<string, number> = lireDefis()) {
  let n = 0;
  let i = defis[aujourdhui()] !== undefined ? 0 : 1;
  while (defis[aujourdhui(i)] !== undefined) {
    n++;
    i++;
  }
  return n;
}

export function defiFait() {
  return lireDefis()[aujourdhui()] !== undefined;
}

export function noterDefi(total: number) {
  const d = { ...lireDefis(), [aujourdhui()]: total };
  try {
    localStorage.setItem(CLE_DEFIS, JSON.stringify(d));
  } catch {
    /* rien */
  }
  window.dispatchEvent(new Event("leonie-defi"));
  return d;
}

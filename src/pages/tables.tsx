// Les tables de multiplication de 1 à 9 : quand Leonie les a toutes remplies sans erreur,
// elle gagne le Plumedex.
import { useState } from "react";
import { dexGagne, gagnerDex } from "@/lib/dex";
import { plumeFete } from "@/lib/plume";
import { sons } from "@/lib/sons";

const CLE = "leonie-tables";
const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const FOIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TOTAL = TABLES.length * FOIS.length;

function lire(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLE) || "[]"));
  } catch {
    return new Set();
  }
}
function ecrire(s: Set<string>) {
  try {
    localStorage.setItem(CLE, JSON.stringify([...s]));
  } catch {
    /* rien */
  }
}

export function TablesMultiplication() {
  const [faits, setFaits] = useState(lire);
  const [table, setTable] = useState(() => TABLES.find((t) => FOIS.some((f) => !lire().has(`${t}x${f}`))) ?? 1);
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const [gagne, setGagne] = useState(dexGagne);

  const repondre = (t: number, f: number, v: string) => {
    const cle = `${t}x${f}`;
    setSaisies((s) => ({ ...s, [cle]: v }));
    if (v.trim() !== String(t * f) || faits.has(cle)) return;
    const n = new Set(faits).add(cle);
    setFaits(n);
    ecrire(n);
    sons.brillant();
    if (FOIS.every((x) => n.has(`${t}x${x}`))) plumeFete();
    if (n.size === TOTAL && !dexGagne()) {
      gagnerDex();
      setGagne(true);
    }
  };
  const tableFinie = (t: number) => FOIS.every((f) => faits.has(`${t}x${f}`));

  return (
    <section className="mt-4">
      <div className="rounded-3xl bg-card px-4 py-3 text-[#2a1c14]">
        <p className="font-extrabold">Remplis toutes les tables de 1 à 9 : tu gagnes le Plumedex !</p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8d9bf]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#f3d48a,#d6a531)]" style={{ width: `${(faits.size / TOTAL) * 100}%` }} />
        </div>
        <p className="mt-1 text-sm font-bold">{faits.size} sur {TOTAL}</p>
      </div>
      {gagne ? <p className="mt-3 rounded-3xl bg-[linear-gradient(160deg,#f3d48a,#d6a531)] px-4 py-3 text-center font-display text-xl text-[#2a1650]">Bravo Leonie ! Tu as gagné le Plumedex !</p> : null}
      <div className="mt-4 grid grid-cols-9 gap-1" role="tablist" aria-label="Choisir une table">
        {TABLES.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={table === t} onClick={() => setTable(t)} className={`relative grid aspect-square place-items-center rounded-xl font-display text-xl ${table === t ? "bg-[#f3d48a] text-[#2a1650]" : "bg-[#2a1844] text-[#f3d48a]"}`}>
            {t}
            {tableFinie(t) ? <span className="absolute -right-1 -top-1 text-xs">⭐</span> : null}
          </button>
        ))}
      </div>
      <p className="titre-or mt-4 text-center text-2xl">La table de {table}</p>
      <ul className="mt-2 space-y-2">
        {FOIS.map((f) => {
          const cle = `${table}x${f}`;
          const ok = faits.has(cle);
          const v = ok ? String(table * f) : saisies[cle] ?? "";
          const faux = !ok && v !== "" && v.length >= String(table * f).length && v !== String(table * f);
          return (
            <li key={cle} className={`flex items-center justify-center gap-3 rounded-2xl px-4 py-2 font-display text-2xl ${ok ? "bg-[#2f7d6d] text-white" : "bg-card text-[#2a1c14]"}`}>
              <span className="w-28 text-right">{table} × {f} =</span>
              <input inputMode="numeric" aria-label={`${table} fois ${f}`} value={v} readOnly={ok} onChange={(e) => repondre(table, f, e.target.value.replace(/\D/g, "").slice(0, 3))} className={`w-20 rounded-xl border-2 px-2 py-1 text-center ${ok ? "border-transparent bg-white/20" : faux ? "border-[#e2453c] bg-white" : "border-[#a07a45] bg-white"}`} />
              <span className="w-6">{ok ? "✓" : faux ? "✗" : ""}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

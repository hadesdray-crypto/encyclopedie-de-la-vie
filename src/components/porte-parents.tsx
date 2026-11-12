// La porte du Coin des parents : un code à 4 chiffres. La première fois, l'adulte choisit son code.
// « Code oublié » : une question de grande personne (une multiplication trop grande pour les tables de Léonie).
import { useState, type ReactNode } from "react";
import { codeDefini, coinOuvert, definirCode, effacerCode, fermerCoin, verifierCode } from "@/lib/code-parents";

export function PorteParents({ children, titre = "Coin des parents" }: { children: ReactNode; titre?: string }) {
  const [ouvert, setOuvert] = useState(coinOuvert);
  const [premier, setPremier] = useState("");
  const [code, setCode] = useState("");
  const [oubli, setOubli] = useState(false);
  const [reponse, setReponse] = useState("");
  const [msg, setMsg] = useState("");
  const aCode = codeDefini();

  if (ouvert) {
    return (
      <div>
        {children}
        <button type="button" onClick={() => { fermerCoin(); setOuvert(false); setCode(""); setPremier(""); }} className="bouton-bois mt-4 w-full rounded-2xl py-3 font-display text-lg">Fermer le coin des parents</button>
      </div>
    );
  }

  const propre = (v: string) => v.replace(/\D/g, "").slice(0, 4);
  async function valider() {
    setMsg("");
    if (!aCode) {
      if (code.length !== 4) return setMsg("Choisis 4 chiffres.");
      if (!premier) { setPremier(code); setCode(""); return setMsg("Écris-le encore une fois pour être sûr."); }
      if (premier !== code) { setPremier(""); setCode(""); return setMsg("Ce n'est pas le même. On recommence."); }
      await definirCode(code); setOuvert(true); return;
    }
    if (await verifierCode(code)) { setOuvert(true); return; }
    setCode(""); setMsg("Ce n'est pas le bon code.");
  }

  return (
    <div className="rounded-2xl bg-white/5 px-3 py-4 text-center" role="group" aria-label={`${titre} : code`}>
      <p className="font-extrabold">{titre}</p>
      <p className="mt-1 text-sm">{aCode ? "Écris le code à 4 chiffres." : premier ? "Écris le même code une deuxième fois." : "Pour les grandes personnes : choisis un code à 4 chiffres. Tu le garderas pour ouvrir ce coin."}</p>
      <input inputMode="numeric" type="password" autoComplete="off" maxLength={4} value={code} onChange={(e) => setCode(propre(e.target.value))} onKeyDown={(e) => e.key === "Enter" && void valider()}
        aria-label="Code à 4 chiffres" className="mx-auto mt-3 block w-40 rounded-xl border border-[#a07a45] bg-white px-3 py-3 text-center text-2xl tracking-[0.6em] text-[#2a1c14]" />
      <button type="button" onClick={() => void valider()} disabled={code.length !== 4} className="bouton-bois mt-3 min-h-12 rounded-full px-6 font-extrabold disabled:opacity-50">{aCode ? "Ouvrir" : premier ? "Confirmer" : "Choisir ce code"}</button>
      {msg ? <p className="mt-2 text-sm font-extrabold">{msg}</p> : null}
      {aCode ? (
        <div className="mt-3 text-xs">
          <button type="button" onClick={() => setOubli((o) => !o)} className="underline">Code oublié ?</button>
          {oubli ? (
            <div className="mt-2">
              <p>Pour un adulte : combien font 17 × 23 ? Le code sera effacé et tu en choisiras un nouveau.</p>
              <input inputMode="numeric" value={reponse} onChange={(e) => setReponse(e.target.value)} aria-label="Réponse" className="mt-1 w-24 rounded-xl border border-[#a07a45] bg-white px-2 py-1 text-[#2a1c14]" />
              <button type="button" disabled={reponse.trim() !== "391"} onClick={() => { effacerCode(); fermerCoin(); setOuvert(false); setOubli(false); setReponse(""); setMsg("Code effacé : choisis-en un nouveau."); }} className="bouton-bois ml-2 rounded-full px-3 py-1 font-extrabold disabled:opacity-50">Effacer</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

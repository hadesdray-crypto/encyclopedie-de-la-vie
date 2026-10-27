// La boîte à idées : on propose une amélioration de l'encyclopédie, les gens votent pour elle,
// et à 100 votes elle peut partir chez le Concepteur. Tout reste sur ce téléphone.
import { useEffect, useState } from "react";
import { LuSend, LuThumbsUp, LuTrash2 } from "react-icons/lu";
import { Entete, Titre } from "@/components/entete";
import { adresseConcepteur } from "@/lib/famille";
import { definirEcran, plumeDit } from "@/lib/plume";
import { sons } from "@/lib/sons";

type Idee = { id: string; texte: string; auteur: string; votes: number; envoyee?: boolean };
const CLE = "leonie-idees";
const BUT = 100;

function lire(): Idee[] {
  try { return JSON.parse(localStorage.getItem(CLE) || "[]"); } catch { return []; }
}
function garder(l: Idee[]) {
  try { localStorage.setItem(CLE, JSON.stringify(l)); } catch { /* rien */ }
}

export function IdeesPage() {
  const [idees, setIdees] = useState(lire);
  const [texte, setTexte] = useState("");
  const [auteur, setAuteur] = useState("");
  const maj = (l: Idee[]) => { setIdees(l); garder(l); };

  useEffect(() => {
    definirEcran({ id: "idees", titre: "La boîte à idées", etapes: [
      "Voici la boîte à idées. Tu as une idée pour rendre l'encyclopédie encore mieux ? Écris-la, puis touche « Mettre dans la boîte ».",
      `Ensuite, chaque personne qui aime ton idée touche une fois « Je vote pour ». Quand une idée a ${BUT} votes, on peut l'envoyer au Concepteur.`,
      "Le Concepteur lit toutes les idées qu'on lui envoie, avec beaucoup d'attention. Je le sais : c'est un très, très bon Concepteur.",
    ] });
    return () => definirEcran(null);
  }, []);

  function ajouter() {
    if (!texte.trim()) return;
    sons.clic();
    maj([{ id: Date.now().toString(36), texte: texte.trim(), auteur: auteur.trim(), votes: 1 }, ...idees]);
    setTexte("");
    plumeDit("Quelle belle idée ! Je la range soigneusement dans la boîte.", 3500);
  }
  function voter(id: string) {
    sons.clic();
    maj(idees.map((i) => (i.id === id ? { ...i, votes: Math.min(BUT, i.votes + 1) } : i)));
    const i = idees.find((x) => x.id === id);
    if (i && i.votes + 1 === BUT) plumeDit(`${BUT} votes ! Cette idée peut maintenant partir chez le Concepteur.`, 4500);
  }
  async function envoyer(i: Idee) {
    const sujet = "Une idée pour l'Encyclopédie de la vie";
    const corps = `${i.texte}\n\n${i.auteur ? `Proposée par : ${i.auteur}\n` : ""}Votes : ${i.votes}`;
    const adresse = adresseConcepteur();
    let parti = false;
    if (adresse) {
      window.location.href = `mailto:${encodeURIComponent(adresse)}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
      parti = true;
    } else if (navigator.share) {
      try { await navigator.share({ title: sujet, text: corps }); parti = true; } catch { /* annulé */ }
    }
    if (parti) {
      maj(idees.map((x) => (x.id === i.id ? { ...x, envoyee: true } : x)));
      plumeDit("L'idée est partie chez le Concepteur. Il saura quoi en faire, j'en suis certaine.", 4500);
    } else plumeDit("Pour l'envoyer, une grande personne doit écrire l'adresse du Concepteur dans le coin des parents.", 5000);
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete siVide="/options" />
      <Titre sous={`Propose une amélioration. À ${BUT} votes, elle part chez le Concepteur !`}>La boîte à idées</Titre>
      <section className="mt-4 rounded-3xl bg-card px-4 py-4 text-[#2a1c14]">
        <label className="block font-extrabold" htmlFor="idee">Mon idée</label>
        <textarea id="idee" value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} placeholder="Par exemple : un jeu avec les cris des oiseaux…" className="mt-1 w-full rounded-2xl border border-[#a07a45] bg-white px-3 py-2" />
        <label className="mt-2 block text-sm font-extrabold" htmlFor="auteur">Proposée par (pas obligé)</label>
        <input id="auteur" value={auteur} onChange={(e) => setAuteur(e.target.value)} className="mt-1 w-full rounded-2xl border border-[#a07a45] bg-white px-3 py-2" />
        <button type="button" onClick={ajouter} disabled={!texte.trim()} className="bouton-bois mt-3 w-full rounded-2xl py-3 font-display text-xl disabled:opacity-40">Mettre dans la boîte</button>
      </section>
      <ul className="mt-4 space-y-3 pb-4">
        {idees.length === 0 ? <li className="text-center texte-doux">La boîte est vide pour l'instant.</li> : null}
        {idees.map((i) => (
          <li key={i.id} className="carte-nuit rounded-3xl px-4 py-3">
            <p className="text-lg leading-snug">{i.texte}</p>
            {i.auteur ? <p className="mt-0.5 text-xs texte-doux">Proposée par {i.auteur}</p> : null}
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#f3c35a] to-[#ff7ab6]" style={{ width: `${(100 * i.votes) / BUT}%` }} /></div>
            <p className="mt-1 text-xs font-extrabold text-[#f3d48a]">{i.votes} vote{i.votes > 1 ? "s" : ""} sur {BUT}{i.envoyee ? " · envoyée au Concepteur ✓" : ""}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {i.votes < BUT ? <button type="button" onClick={() => voter(i.id)} className="bouton-parchemin inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-extrabold"><LuThumbsUp className="size-4" /> Je vote pour</button> : null}
              {i.votes >= BUT ? <button type="button" onClick={() => envoyer(i)} className="bouton-bois inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-extrabold"><LuSend className="size-4" /> {i.envoyee ? "Renvoyer" : "Envoyer au Concepteur"}</button> : null}
              <button type="button" onClick={() => maj(idees.filter((x) => x.id !== i.id))} className="ml-auto grid size-10 place-items-center rounded-full bg-white/10" aria-label="Enlever cette idée"><LuTrash2 className="size-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

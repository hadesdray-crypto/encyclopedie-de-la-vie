import { LEXIQUE } from "@/data/lexique";
import { Entete, Titre } from "@/components/entete";
import { Ecouter } from "@/components/voix";

export function LexiquePage() {
  const mots = [...LEXIQUE].sort((a, b) => a.mot.localeCompare(b.mot, "fr"));
  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <Entete />
      <Titre sous="Les vrais mots. Dans les textes, un mot en pointillés s'explique quand on le touche. Ici, ils sont tous.">Le lexique</Titre>
      <ul className="mt-6 space-y-3">
        {mots.map((m) => (
          <li key={m.id} id={m.id} className="rounded-3xl bg-card px-4 py-3">
            <p className="font-display text-2xl">{m.mot}</p>
            <p className="mt-1 leading-relaxed">{m.definition}</p>
            <div className="mt-2"><Ecouter texte={`${m.mot}. ${m.definition}`} /></div>
          </li>
        ))}
      </ul>
    </main>
  );
}

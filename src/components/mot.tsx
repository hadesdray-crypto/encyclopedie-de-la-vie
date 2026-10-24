import { useState, type ReactNode } from "react";
import { decouper, motDuLexique } from "@/data/lexique";
import { Ecouter } from "@/components/voix";

export function Mot({ id, children }: { id: string; children?: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const mot = motDuLexique(id);
  if (!mot) return null;
  return (
    <span className="inline">
      <button
        type="button"
        onClick={() => setOuvert((etat) => !etat)}
        className="font-extrabold text-rose-deep underline decoration-dotted underline-offset-4"
      >
        {children ?? mot.mot}
      </button>
      {ouvert ? (
        <span className="mt-2 block rounded-2xl bg-cream-deep px-3 py-2 text-sm font-normal leading-relaxed text-ink not-italic">
          {mot.definition}
          <span className="mt-2 block">
            <Ecouter texte={`${mot.mot}. ${mot.definition}`} />
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function Texte({ children }: { children: string }) {
  return (
    <>
      {decouper(children).map((morceau, index) =>
        morceau.id ? (
          <Mot key={`${morceau.id}-${index}`} id={morceau.id}>
            {morceau.texte}
          </Mot>
        ) : (
          <span key={index}>{morceau.texte}</span>
        ),
      )}
    </>
  );
}
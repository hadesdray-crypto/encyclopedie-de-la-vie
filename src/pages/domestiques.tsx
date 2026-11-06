// Les animaux domestiques : chiens et chats (le carnet de Plume), les transhumances et l'éducation.
import { Entete, Titre } from "@/components/entete";

const SECTIONS = [
  { vers: "/compagnons", titre: "Chiens et chats", sous: "Toutes les races, avec photos et caractère." },
  { vers: "/domestiques/transhumances", titre: "Les transhumances", sous: "Quand les troupeaux montent en montagne." },
  { vers: "/domestiques/education", titre: "Les méthodes éducatives", sous: "Comment bien éduquer un chien ou un chat." },
];

export function DomestiquesPage({ id }: { id?: string }) {
  if (id === "transhumances") return <Transhumances />;
  if (id === "education") return <Education />;
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-4">
      <Entete siVide="/animaux" />
      <Titre sous="Les animaux qui vivent avec nous ou avec les bergers.">Animaux domestiques</Titre>
      <ul className="mt-5 space-y-3">
        {SECTIONS.map((s) => (
          <li key={s.vers}>
            <a href={`#${s.vers}`} className="block rounded-3xl bg-card px-4 py-4 text-[#2a1c14]">
              <span className="block font-display text-2xl leading-tight">{s.titre}</span>
              <span className="block text-sm leading-snug">{s.sous}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="carte-nuit mt-4 rounded-3xl px-4 py-4">
      <h2 className="font-display text-2xl text-[#f3d48a]">{titre}</h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

function Transhumances() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-4">
      <Entete siVide="/domestiques" />
      <Titre sous="Les troupeaux changent de pâturage selon les saisons.">Les transhumances</Titre>
      <Bloc titre="C'est quoi ?">
        <p>La transhumance, c'est le voyage saisonnier d'un troupeau (moutons, vaches, chèvres) qui quitte la plaine ou la vallée pour monter manger l'herbe fraîche de la montagne. On dit « monter en estive » en été, puis « descendre » à l'automne, avant la neige.</p>
        <p>Le mot vient du latin : « trans » (au-delà) et « humus » (la terre).</p>
      </Bloc>
      <Bloc titre="Qui accompagne le troupeau ?">
        <p>Le berger, qui connaît les chemins. Des chiens de conduite, qui rassemblent les bêtes. Et parfois des chiens de protection, comme le patou (la montagne des Pyrénées), qui restent avec les brebis pour les défendre.</p>
      </Bloc>
      <Bloc titre="Pourquoi on le fait ?">
        <p>L'herbe de montagne repousse en été, quand celle de la plaine est sèche. Le troupeau mange, et les prairies d'altitude restent ouvertes.</p>
      </Bloc>
      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] texte-doux">Texte écrit d'après Wikipédia en français (articles « Transhumance » et « Estive »). Il sera complété avec des trajets réels vérifiés.</p>
    </main>
  );
}

function Education() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-4">
      <Entete siVide="/domestiques" />
      <Titre sous="Éduquer, c'est apprendre ensemble, avec patience.">Les méthodes éducatives</Titre>
      <Bloc titre="Récompenser ce qui est bien">
        <p>Les spécialistes du comportement recommandent le renforcement positif : quand le chien ou le chat fait ce qu'on veut, on le récompense tout de suite (une friandise, une caresse, un jeu). Il comprend vite ce qui fait plaisir.</p>
      </Bloc>
      <Bloc titre="Des séances courtes">
        <p>Quelques minutes, plusieurs fois par jour, valent mieux qu'une longue séance. On finit toujours sur une réussite.</p>
      </Bloc>
      <Bloc titre="Toujours les mêmes mots">
        <p>Tout le monde dans la maison utilise le même mot pour la même chose. Sinon, l'animal ne sait plus ce qu'on lui demande.</p>
      </Bloc>
      <Bloc titre="Rencontrer le monde, doucement">
        <p>Les chiots et les chatons découvrent peu à peu les bruits, les gens et les autres animaux. C'est la socialisation : elle les rend plus calmes et plus confiants.</p>
      </Bloc>
      <p className="mx-auto mt-4 max-w-sm text-center text-[11px] texte-doux">Principes généraux de l'éducation positive. En cas de difficulté, demande conseil à un vétérinaire ou à un éducateur.</p>
    </main>
  );
}

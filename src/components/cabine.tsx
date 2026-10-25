// La cabine d'essayage : le personnage entre en peignoir blanc, les volets ondulés se ferment,
// on choisit ses vêtements à côté… et « boum », la cabine s'ouvre sur sa nouvelle tenue !
// Après 5 surprises, on peut choisir de voir chaque changement tout de suite (les volets clignent une seconde).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlumeDessin, type AnimPlume, type Caractere } from "@/components/plume-dessin";
import { COULEURS_CORPS, EPAISSEURS, type Look } from "@/components/garde-robe";
import { BAS, CHAPEAUX2, CHAUSSURES, Bas, Chapeau2, Chaussure, HAUTS, Haut, LUNETTES, Lunettes2, OBJETS, Objet, TEINTES, type Piece, type Tenue } from "@/components/vestiaire";
import { plumeDit, plumePropose } from "@/lib/plume";
import { sons } from "@/lib/sons";

type Cle = keyof Omit<Tenue, "couleurs">;
const RAYONS: { cle: Cle | "corps"; titre: string; icone: string; liste?: Piece[]; couleur?: keyof Tenue["couleurs"]; cadre?: string; dessin?: (t: Tenue) => ReactNode }[] = [
  { cle: "corps", titre: "Corps", icone: "🦉" },
  { cle: "haut", titre: "Haut", icone: "👕", liste: HAUTS, couleur: "haut", cadre: "30 108 140 98", dessin: (t) => <Haut t={t} /> },
  { cle: "bas", titre: "Bas", icone: "👖", liste: BAS, couleur: "bas", cadre: "30 148 140 66", dessin: (t) => <Bas t={t} /> },
  { cle: "chapeau", titre: "Tête", icone: "🎩", liste: CHAPEAUX2, couleur: "chapeau", cadre: "20 -40 160 108", dessin: (t) => <Chapeau2 t={t} /> },
  { cle: "lunettes", titre: "Lunettes", icone: "👓", liste: LUNETTES, cadre: "26 52 148 80", dessin: (t) => <Lunettes2 t={t} /> },
  { cle: "chaussures", titre: "Pieds", icone: "👟", liste: CHAUSSURES, couleur: "chaussures", cadre: "96 176 56 44", dessin: (t) => <Chaussure t={t} /> },
  { cle: "objet", titre: "Main", icone: "🎸", liste: OBJETS, couleur: "objet", cadre: "148 58 90 124", dessin: (t) => <Objet t={t} /> },
];

const CLE_SURPRISES = "leonie-cabine-surprises";
const CLE_DIRECT = "leonie-cabine-direct";
const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* rien */ } };

/** Le peignoir blanc de l'arrivée. */
const PEIGNOIR = (l: Look): Look => ({ ...l, haut: "peignoir", bas: "aucun", chapeau: "aucun", lunettes: "aucune", chaussures: "aucune", objet: "aucun", couleurs: {} });

export function Cabine({ look, setLook, caractere, nouveau }: { look: Look; setLook: (l: Look) => void; caractere: Caractere; nouveau: boolean }) {
  const direct = lire(CLE_DIRECT) === "oui";
  const [rayon, setRayon] = useState<(typeof RAYONS)[number]["cle"]>("haut");
  // Les étapes : il arrive, il entre, la cabine se ferme ; on choisit ; on ouvre.
  const [etape, setEtape] = useState<"arrive" | "ferme" | "ouvert">(direct && !nouveau ? "ouvert" : "arrive");
  const [vu, setVu] = useState<Look>(() => (direct && !nouveau ? look : PEIGNOIR(look))); // ce qu'on voit dans la cabine
  const [clin, setClin] = useState(false); // les volets clignent (mode direct)
  const [tremble, setTremble] = useState(0);
  const [vole, setVole] = useState<{ cle: Cle; id: string; n: number } | null>(null);
  const [zoom, setZoom] = useState<"corps" | "tete">("corps");
  const [anim, setAnim] = useState<AnimPlume>("rien");
  const n = useRef(0);

  // L'arrivée : il marche jusqu'à la cabine, entre, et les volets se ferment.
  useEffect(() => {
    if (etape !== "arrive") return;
    plumeDit("Regarde : il arrive en peignoir ! Il entre dans la cabine… À toi de choisir ses vêtements !", 5000);
    const t = window.setTimeout(() => { setEtape("ferme"); sons.retourner(); }, 2300);
    return () => window.clearTimeout(t);
  }, []);

  function choisir(cle: Cle, id: string) {
    const nouveauLook = { ...look, [cle]: id } as Look;
    setLook(nouveauLook);
    if (etape === "ouvert") {
      // On voit tout de suite : les volets se ferment une seconde, on se change derrière, et ça s'ouvre.
      setClin(true);
      sons.retourner();
      window.setTimeout(() => setVu(nouveauLook), 380);
      window.setTimeout(() => { setClin(false); setAnim("bravo"); window.setTimeout(() => setAnim("rien"), 1200); }, 760);
    } else {
      // Surprise : on ne voit rien, mais la cabine bouge et le vêtement s'envole dedans.
      setTremble((x) => x + 1);
      setVole({ cle, id, n: ++n.current });
    }
  }
  function couleur(c: keyof Tenue["couleurs"], v: string | undefined) {
    const l = { ...look, couleurs: { ...look.couleurs, [c]: v } };
    setLook(l);
    if (etape === "ouvert") setVu(l);
    else setTremble((x) => x + 1);
  }
  function corps(l: Partial<Look>) {
    const nl = { ...look, ...l };
    setLook(nl);
    setVu((v) => ({ ...v, ...l }));
  }
  function ouvrir() {
    setVu(look);
    setEtape("ouvert");
    sons.victoire();
    setAnim("bravo");
    window.setTimeout(() => setAnim("rien"), 1800);
    const fois = Number(lire(CLE_SURPRISES) || 0) + 1;
    ecrire(CLE_SURPRISES, String(fois));
    if (fois === 5 && !direct) {
      window.setTimeout(() => plumePropose({ texte: "C'était marrant, ces surprises ! Tu veux maintenant voir chaque vêtement tout de suite, en essayant ?", oui: "Oui, tout de suite", action: () => ecrire(CLE_DIRECT, "oui") }), 2200);
    } else plumeDit("Taaadaaa ! Quelle belle tenue !", 3000);
  }

  const r = RAYONS.find((x) => x.cle === rayon)!;
  const ferme = etape === "ferme" || clin;
  return (
    <div>
      {/* La scène : la salle d'essayage, la cabine, et le personnage */}
      <div className="scene-cabine relative mx-auto h-[19rem] max-w-sm overflow-hidden rounded-[1.8rem]">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[repeating-linear-gradient(90deg,#6a3f1a_0_38px,#7a4a22_38px_76px)] opacity-90" />
        <div className={`cabine absolute bottom-6 left-1/2 h-[15.5rem] w-[12.5rem] -translate-x-1/2 transition-transform duration-700 ${etape === "ouvert" && zoom === "tete" ? "scale-[1.9]" : etape === "ouvert" ? "scale-110" : ""}`} style={{ transformOrigin: zoom === "tete" && etape === "ouvert" ? "50% 60%" : "50% 100%" }}>
          <div className="cabine-fond absolute inset-0 rounded-t-[2.2rem]" />
          {/* Le personnage : dehors à l'arrivée, puis dedans */}
          <div className={`absolute bottom-2 left-1/2 size-40 -translate-x-1/2 ${etape === "arrive" ? "perso-arrive" : ""} ${tremble ? "" : ""}`}>
            <PlumeDessin anim={etape === "arrive" ? "parle" : anim} caractere={caractere} look={vu} className="size-full drop-shadow-[0_8px_10px_rgba(0,0,0,.45)]" />
          </div>
          {/* Les deux volets ondulés */}
          <div key={`t${tremble}`} className={`absolute inset-0 ${tremble && ferme ? "cabine-tremble" : ""}`}>
            <div className={`volet volet-g ${ferme ? "volet-ferme" : ""}`} />
            <div className={`volet volet-d ${ferme ? "volet-ferme" : ""}`} />
          </div>
          {vole ? <span key={`v${vole.n}`} className="vetement-vole pointer-events-none absolute left-1/2 top-1/3 text-4xl">{RAYONS.find((x) => x.cle === vole.cle)?.icone}</span> : null}
          <div className="cabine-fronton absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-display text-sm text-[#3a2008]">Cabine d'essayage</div>
        </div>
        {etape === "ouvert" ? (
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button type="button" onClick={() => setZoom("tete")} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${zoom === "tete" ? "bg-[#f3d48a] text-[#2a1650]" : "bg-black/40 text-white"}`}>🔍 La tête</button>
            <button type="button" onClick={() => setZoom("corps")} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${zoom === "corps" ? "bg-[#f3d48a] text-[#2a1650]" : "bg-black/40 text-white"}`}>Tout le corps</button>
          </div>
        ) : null}
        {etape === "ouvert" && !clin ? <Confettis /> : null}
      </div>

      {etape === "ferme" ? (
        <button type="button" onClick={ouvrir} className="bouton-jeu mx-auto mt-3 block w-full max-w-sm rounded-full py-3.5 font-display text-xl">🎉 Ouvrir la cabine !</button>
      ) : etape === "ouvert" && !direct ? (
        <button type="button" onClick={() => { setEtape("ferme"); sons.retourner(); }} className="verre-jeu mx-auto mt-3 block w-full max-w-sm rounded-full py-2.5 text-sm font-extrabold text-white">Refermer pour une nouvelle surprise</button>
      ) : null}

      {/* Les rayons du vestiaire */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {RAYONS.map((x) => (
          <button key={x.cle} type="button" onClick={() => setRayon(x.cle)} className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm font-extrabold ${rayon === x.cle ? "bg-[#f3d48a] text-[#2a1650]" : "verre-jeu text-white"}`}>
            <span aria-hidden="true">{x.icone}</span> {x.titre}
          </button>
        ))}
      </div>
      <div className="verre-jeu mt-2 rounded-[1.6rem] px-3 py-3">
        {r.cle === "corps" ? (
          <>
            <p className="text-xs font-black text-[#f3d48a]">Sa couleur</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COULEURS_CORPS.map((k) => <button key={k.id} type="button" aria-label={k.nom} onClick={() => corps({ couleur: k.id })} className={`size-10 rounded-full ${look.couleur === k.id ? "ring-4 ring-[#f3d48a]" : "ring-2 ring-white/20"}`} style={{ background: `radial-gradient(circle at 35% 30%, ${k.clair}, ${k.fonce})` }} />)}
            </div>
            <p className="mt-3 text-xs font-black text-[#f3d48a]">Son épaisseur</p>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {EPAISSEURS.map((e) => (
                <button key={e.id} type="button" onClick={() => corps({ epaisseur: e.id })} className={`rounded-2xl py-1.5 text-[11px] font-extrabold ${look.epaisseur === e.id ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/8 text-white"}`}>
                  <svg viewBox="0 0 200 200" className="mx-auto size-11"><ellipse cx="100" cy="112" rx={e.rx} ry="74" fill="#c9a4ff" /></svg>{e.nom}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {(["filles", "garcons", "tous"] as const).map((pour) => {
              const pieces = r.liste!.filter((x) => x.pour === pour);
              return pieces.length ? (
                <div key={pour} className="mb-2">
                  <p className="text-[11px] font-black texte-doux">{pour === "filles" ? "Plutôt pour les filles" : pour === "garcons" ? "Plutôt pour les garçons" : "Pour tout le monde"}</p>
                  <div className="mt-1 grid grid-cols-4 gap-1.5">
                    {pieces.map((p) => {
                      const actif = look[r.cle as Cle] === p.id;
                      const vide = p.id === "aucun" || p.id === "aucune";
                      return (
                        <button key={p.id} type="button" onClick={() => choisir(r.cle as Cle, p.id)} className={`rounded-2xl px-1 pb-1.5 pt-1 text-center text-[10.5px] font-extrabold leading-tight ${actif ? "bg-gradient-to-b from-[#fff0b8] to-[#f3c35a] text-[#2a1650] shadow-[0_0_14px_rgba(243,195,90,.5)]" : "bg-white/8 text-white"}`}>
                          {vide ? <span className="mx-auto grid size-12 place-items-center text-2xl opacity-70">✕</span> : (
                            <svg viewBox={r.cadre} className="mx-auto size-12" aria-hidden="true">{r.dessin!({ ...look, [r.cle]: p.id } as Tenue)}</svg>
                          )}
                          {p.nom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })}
            {r.couleur ? (
              <div className="mt-1">
                <p className="text-[11px] font-black texte-doux">La couleur</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => couleur(r.couleur!, undefined)} className={`h-9 rounded-full px-3 text-xs font-extrabold ${!look.couleurs[r.couleur] ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10 text-white"}`}>D'origine</button>
                  {TEINTES.map((t) => <button key={t.id} type="button" aria-label={t.nom} onClick={() => couleur(r.couleur!, t.id)} className={`size-9 rounded-full ${look.couleurs[r.couleur!] === t.id ? "ring-4 ring-[#f3d48a]" : "ring-2 ring-white/20"}`} style={{ background: t.c }} />)}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
      <label className="mt-3 flex items-center justify-center gap-2 text-xs texte-doux">
        <input type="checkbox" defaultChecked={direct} onChange={(e) => ecrire(CLE_DIRECT, e.target.checked ? "oui" : "non")} className="size-4 accent-[#f3c35a]" />
        Voir chaque vêtement tout de suite (sans la surprise)
      </label>
    </div>
  );
}

const CONF = Array.from({ length: 16 }, (_, i) => ({ x: ((i * 41) % 90) + 5, d: (i % 5) * 0.05, c: ["#f3c35a", "#ff7ab6", "#5fe07a", "#4fb6ff", "#c9a4ff"][i % 5] }));
function Confettis() {
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true">{CONF.map((k, i) => <span key={i} className="confetti-tombe" style={{ left: `${k.x}%`, background: k.c, animationDelay: `${k.d}s` }} />)}</div>;
}

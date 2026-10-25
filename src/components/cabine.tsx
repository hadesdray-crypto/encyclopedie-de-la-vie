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
const RAYONS: { cle: Cle | "corps"; titre: string; icone: string; liste?: Piece[]; couleur?: keyof Tenue["couleurs"]; cadre?: string; vue?: string; dessin?: (t: Tenue) => ReactNode }[] = [
  { cle: "haut", titre: "Torse", icone: "👚", liste: HAUTS, couleur: "haut", vue: "20 92 160 128", cadre: "22 96 156 116", dessin: (t) => <><Mannequin /><Haut t={t} /></> },
  { cle: "bas", titre: "Bas", icone: "👖", liste: BAS, couleur: "bas", vue: "24 124 152 100", cadre: "26 128 148 90", dessin: (t) => <><Mannequin /><Bas t={t} /></> },
  { cle: "chapeau", titre: "Tête", icone: "🎩", liste: CHAPEAUX2, couleur: "chapeau", vue: "10 -40 180 150", cadre: "20 -40 160 108", dessin: (t) => <Chapeau2 t={t} /> },
  { cle: "lunettes", titre: "Lunettes", icone: "👓", liste: LUNETTES, vue: "20 40 160 110", cadre: "26 52 148 80", dessin: (t) => <Lunettes2 t={t} /> },
  { cle: "chaussures", titre: "Pieds", icone: "👟", liste: CHAUSSURES, couleur: "chaussures", vue: "50 160 100 66", cadre: "100 178 50 40", dessin: (t) => <Chaussure t={t} /> },
  { cle: "objet", titre: "Main", icone: "🎸", liste: OBJETS, couleur: "objet", vue: "110 50 130 140", cadre: "150 64 80 106", dessin: (t) => <Objet t={t} /> },
  { cle: "corps", titre: "Corps", icone: "🦉" },
];

const CLE_SURPRISES = "leonie-cabine-surprises";
const CLE_DIRECT = "leonie-cabine-direct";
const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* rien */ } };

/** Le peignoir blanc de l'arrivée. */
const PEIGNOIR = (l: Look): Look => ({ ...l, haut: "peignoir", bas: "aucun", chapeau: "aucun", lunettes: "aucune", chaussures: "aucune", objet: "aucun", couleurs: {} });

// Les tenues toutes faites : un toucher habille tout, puis on change ce qu'on veut.
const TOUTES_FAITES: { nom: string; icone: string; t: Omit<Tenue, "couleurs"> }[] = [
  { nom: "Docteur", icone: "🩺", t: { haut: "medecin", bas: "pantalon", chapeau: "aucun", lunettes: "rondes", chaussures: "baskets", objet: "piqure" } },
  { nom: "Danseuse", icone: "🩰", t: { haut: "danseuse", bas: "tutu", chapeau: "diademe", lunettes: "aucune", chaussures: "pointes", objet: "baguette" } },
  { nom: "Pompier", icone: "🚒", t: { haut: "pompier", bas: "pantalon", chapeau: "pompier", lunettes: "aucune", chaussures: "bottespompier", objet: "pelle" } },
  { nom: "Footballeur", icone: "⚽", t: { haut: "foot", bas: "shortfoot", chapeau: "casquette", lunettes: "aucune", chaussures: "crampons", objet: "ballon" } },
  { nom: "Princesse", icone: "👑", t: { haut: "princesse", bas: "longue", chapeau: "diademe", lunettes: "coeurs", chaussures: "ballerines", objet: "baguette" } },
  { nom: "Pirate", icone: "🏴‍☠️", t: { haut: "chemise", bas: "pantalon", chapeau: "pirate", lunettes: "aucune", chaussures: "bottescowboy", objet: "epee" } },
  { nom: "Jardinier", icone: "🌻", t: { haut: "tshirt", bas: "salopette", chapeau: "paille", lunettes: "soleil", chaussures: "pluie", objet: "rateau" } },
  { nom: "Chevalier", icone: "🛡️", t: { haut: "chevalier", bas: "pantalon", chapeau: "chevalier", lunettes: "aucune", chaussures: "bottescowboy", objet: "epee" } },
  { nom: "Rockeur", icone: "🎸", t: { haut: "sweat", bas: "jean", chapeau: "aucun", lunettes: "soleil", chaussures: "baskets", objet: "guitare" } },
  { nom: "Cuisinier", icone: "👨‍🍳", t: { haut: "cuisine", bas: "pantalon", chapeau: "toque", lunettes: "aucune", chaussures: "vernis", objet: "livre" } },
];
// Le personnage réagit à ce qu'on lui donne.
const REACTION: Record<Cle, AnimPlume> = { haut: "bravo", bas: "bravo", chapeau: "coucou", lunettes: "parle", chaussures: "jeu", objet: "coucou" };
const auHasard = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export function Cabine({ look, setLook, caractere, nouveau, nom = "", createur = "" }: { look: Look; setLook: (l: Look) => void; caractere: Caractere; nouveau: boolean; nom?: string; createur?: string }) {
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
  const [flash, setFlash] = useState(0); // la photo souvenir
  const [photo, setPhoto] = useState(false);
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
      window.setTimeout(() => { setClin(false); setAnim(REACTION[cle]); sons.clic(); window.setTimeout(() => setAnim("rien"), 1400); }, 760);
    } else {
      // Surprise : on ne voit rien, mais la cabine bouge et le vêtement s'envole dedans.
      setTremble((x) => x + 1);
      setVole({ cle, id, n: ++n.current });
      sons.trembler();
    }
  }
  /** Habiller d'un coup : une tenue toute faite, ou une tenue au hasard (le dé). */
  function habiller(t: Omit<Tenue, "couleurs">, couleurs: Tenue["couleurs"] = {}) {
    const l = { ...look, ...t, couleurs } as Look;
    setLook(l);
    if (etape === "ouvert") {
      setClin(true);
      sons.retourner();
      window.setTimeout(() => setVu(l), 380);
      window.setTimeout(() => { setClin(false); setAnim("bravo"); sons.brillant(); window.setTimeout(() => setAnim("rien"), 1600); }, 820);
    } else {
      setTremble((x) => x + 1);
      setVole({ cle: "haut", id: t.haut, n: ++n.current });
      sons.trembler();
    }
  }
  function de() {
    const tir = (l: Piece[]) => auHasard(l.filter((x) => x.id !== "aucun" && x.id !== "aucune")).id;
    const coul = () => (Math.random() < 0.5 ? auHasard(TEINTES).id : undefined);
    habiller(
      { haut: tir(HAUTS.filter((x) => x.id !== "peignoir")), bas: Math.random() < 0.8 ? tir(BAS) : "aucun", chapeau: tir(CHAPEAUX2), lunettes: Math.random() < 0.5 ? tir(LUNETTES) : "aucune", chaussures: tir(CHAUSSURES), objet: tir(OBJETS) },
      { haut: coul(), bas: coul(), chapeau: coul(), chaussures: coul(), objet: coul() },
    );
    plumeDit("🎲 Une tenue au hasard !", 2000);
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
    // Roulement de tambour… puis les volets s'ouvrent, et clic : la photo souvenir !
    sons.trembler();
    window.setTimeout(() => sons.trembler(), 250);
    window.setTimeout(reveler, 600);
  }
  function reveler() {
    setVu(look);
    setEtape("ouvert");
    window.setTimeout(() => { setFlash((x) => x + 1); setPhoto(true); sons.clic(); }, 1300);
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
      {/* La scène : la salle d'essayage (papier peint, portant à vêtements, miroir lumineux), la cabine et le personnage */}
      <div className="scene-cabine relative mx-auto h-[21rem] max-w-md overflow-hidden rounded-[1.8rem]">
        <Decor />
        <div className={`cabine absolute bottom-7 left-1/2 h-[16rem] w-[12rem] -translate-x-1/2 transition-transform duration-700 ${etape === "ouvert" && zoom === "tete" ? "scale-[1.9]" : etape === "ouvert" ? "scale-105" : ""}`} style={{ transformOrigin: zoom === "tete" && etape === "ouvert" ? "50% 60%" : "50% 100%" }}>
          {/* Le cadre en bois, la lampe étoile et l'enseigne */}
          <div className="cabine-cadre absolute -inset-x-3 -bottom-1 -top-3 rounded-t-[2.8rem]" />
          <div className="cabine-fond absolute inset-0 overflow-hidden rounded-t-[2.2rem]">
            <div className={`absolute inset-x-0 top-0 h-full transition-opacity duration-500 ${etape === "ouvert" && !clin ? "opacity-100" : "opacity-0"} bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,245,200,.95),transparent_70%)]`} />
          </div>
          {/* Le personnage : il arrive de la gauche, puis il est dans la cabine */}
          <div className={`absolute bottom-1 left-1/2 size-[10.5rem] -translate-x-1/2 ${etape === "arrive" ? "perso-arrive" : ""}`}>
            <PlumeDessin anim={etape === "arrive" ? "parle" : anim} caractere={caractere} look={vu} className="size-full drop-shadow-[0_10px_10px_rgba(0,0,0,.4)]" />
          </div>
          {/* Les deux volets ondulés : chacun s'ouvre de son côté ; la barre dorée au milieu quand ils sont fermés */}
          <div key={`t${tremble}`} className={`absolute inset-0 ${tremble && ferme ? "cabine-tremble" : ""}`}>
            <div className={`volet volet-g ${ferme ? "volet-ferme" : ""}`}><span className="poignee poignee-g" /></div>
            <div className={`volet volet-d ${ferme ? "volet-ferme" : ""}`}><span className="poignee poignee-d" /></div>
            <div className={`barre-milieu ${ferme ? "opacity-100" : "opacity-0"}`} />
          </div>
          {vole ? <span key={`v${vole.n}`} className="vetement-vole pointer-events-none absolute left-1/2 top-1/3 text-4xl">{RAYONS.find((x) => x.cle === vole.cle)?.icone}</span> : null}
          <div className="cabine-lampe absolute -top-9 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full text-xl">⭐</div>
          <div className="cabine-fronton absolute -top-2 left-1/2 -translate-x-1/2 rounded-xl px-4 py-1 font-display text-[13px] text-[#3a2008]">Cabine d'essayage</div>
        </div>
        {etape === "ouvert" ? (
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button type="button" onClick={() => setZoom("tete")} className={`rounded-full px-3 py-1.5 text-xs font-extrabold shadow ${zoom === "tete" ? "bg-[#f3d48a] text-[#2a1650]" : "bg-black/45 text-white backdrop-blur"}`}>🔍 La tête</button>
            <button type="button" onClick={() => setZoom("corps")} className={`rounded-full px-3 py-1.5 text-xs font-extrabold shadow ${zoom === "corps" ? "bg-[#f3d48a] text-[#2a1650]" : "bg-black/45 text-white backdrop-blur"}`}>🧍 Tout le corps</button>
          </div>
        ) : null}
        {etape === "ouvert" && !clin ? <Confettis /> : null}
        {flash ? <div key={`f${flash}`} className="flash-photo pointer-events-none absolute inset-0 bg-white" /> : null}
        {etape === "ferme" ? <p className="absolute inset-x-0 top-2 text-center text-xs font-extrabold text-white/85 [text-shadow:0_1px_3px_#000]">Il se change… Choisis ses vêtements en dessous !</p> : null}
      </div>

      {etape === "ferme" ? (
        <button type="button" onClick={ouvrir} className="bouton-jeu mx-auto mt-3 block w-full max-w-sm rounded-full py-3.5 font-display text-xl">🎉 Ouvrir la cabine !</button>
      ) : etape === "ouvert" && !direct ? (
        <button type="button" onClick={() => { setEtape("ferme"); sons.retourner(); }} className="verre-jeu mx-auto mt-3 block w-full max-w-sm rounded-full py-2.5 text-sm font-extrabold text-white">Refermer pour une nouvelle surprise</button>
      ) : null}

      {/* La photo souvenir, après la surprise */}
      {photo && etape === "ouvert" ? (
        <div className="polaroid apparait mx-auto mt-3 w-52 rotate-[-3deg] rounded-md bg-white p-2 pb-3 text-center text-[#2a1c14] shadow-[0_10px_20px_rgba(0,0,0,.5)]">
          <div className="grid h-40 place-items-center rounded bg-[radial-gradient(circle_at_50%_35%,#fff6d6,#f0d8a8)]"><PlumeDessin caractere={caractere} look={vu} className="size-36" /></div>
          <p className="mt-1.5 font-display text-lg leading-tight">{nom.trim() || "Mon personnage"}</p>
          <p className="text-[11px] font-bold opacity-70">{createur.trim() ? `créé par ${createur.trim()}` : "personnage bonus"} · {new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      ) : null}

      {/* Le dé et les tenues toutes faites */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={de} className="flex w-[4.6rem] shrink-0 flex-col items-center rounded-2xl bg-gradient-to-b from-[#8a5cf0] to-[#5a2fc0] py-2 text-[11px] font-extrabold text-white shadow-[0_0_16px_rgba(160,110,255,.5)]">
          <span className="de-anim text-3xl">🎲</span>Au hasard
        </button>
        {TOUTES_FAITES.map((f) => (
          <button key={f.nom} type="button" onClick={() => habiller(f.t)} className="tuile-vetement flex w-[4.6rem] shrink-0 flex-col items-center rounded-2xl py-1.5 text-[11px] font-extrabold">
            <PlumeDessin caractere={caractere} look={{ ...look, ...f.t, couleurs: {} } as Look} className="size-12" />
            {f.icone} {f.nom}
          </button>
        ))}
      </div>

      {/* Les rayons du vestiaire : une étagère en bois avec une icône par rayon */}
      <div className="etagere mt-4 grid grid-cols-7 gap-0.5 rounded-[1.4rem] px-1.5 py-2">
        {RAYONS.map((x) => (
          <button key={x.cle} type="button" onClick={() => setRayon(x.cle)} aria-pressed={rayon === x.cle} className={`flex flex-col items-center rounded-2xl py-1.5 text-[10.5px] font-extrabold transition-all ${rayon === x.cle ? "bg-gradient-to-b from-[#fff0b8] to-[#f3c35a] text-[#2a1650] shadow-[0_0_14px_rgba(243,195,90,.6)] -translate-y-0.5" : "text-[#fff3d6]"}`}>
            <span className="text-2xl leading-none drop-shadow" aria-hidden="true">{x.icone}</span>
            {x.titre}
          </button>
        ))}
      </div>
      <div className="mt-2 rounded-[1.6rem] bg-[#1d1336]/80 px-3 py-3 ring-1 ring-white/12">
        <p className="mb-2 font-display text-xl text-[#f3d48a]">{r.icone} {r.cle === "haut" ? "Le torse : chemise, robe, pull, maillot…" : r.cle === "bas" ? "Le bas : jupe, pantalon, short, tutu…" : r.cle === "chapeau" ? "Sur la tête" : r.cle === "lunettes" ? "Les lunettes" : r.cle === "chaussures" ? "Les chaussures" : r.cle === "objet" ? "Dans la main" : "Son corps"}</p>
        {r.cle === "corps" ? (
          <>
            <p className="text-sm font-black text-[#f3d48a]">Sa couleur</p>
            <div className="mt-2 grid grid-cols-5 gap-2.5">
              {COULEURS_CORPS.map((k) => (
                <button key={k.id} type="button" aria-label={k.nom} onClick={() => corps({ couleur: k.id })} className="flex flex-col items-center gap-1 text-[10px] font-bold text-white/80">
                  <span className={`size-11 rounded-full transition-transform ${look.couleur === k.id ? "scale-110 ring-4 ring-[#f3d48a]" : "ring-2 ring-white/20"}`} style={{ background: `radial-gradient(circle at 35% 30%, ${k.clair}, ${k.fonce})` }} />
                  {k.nom}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm font-black text-[#f3d48a]">Son épaisseur</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {EPAISSEURS.map((e) => (
                <button key={e.id} type="button" onClick={() => corps({ epaisseur: e.id })} className={`tuile-vetement rounded-2xl pb-1.5 pt-2 text-[11px] font-extrabold ${look.epaisseur === e.id ? "tuile-choisie" : ""}`}>
                  <PlumeDessin caractere={caractere} look={{ ...vu, epaisseur: e.id }} className="mx-auto size-14" />{e.nom}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {(["filles", "garcons", "tous"] as const).map((pour) => {
              const pieces = r.liste!.filter((x) => x.pour === pour);
              return pieces.length ? (
                <div key={pour} className="mb-3">
                  <p className="flex items-center gap-1.5 text-xs font-black text-[#f3d48a]">{pour === "filles" ? "🌸 Plutôt pour les filles" : pour === "garcons" ? "⚽ Plutôt pour les garçons" : "⭐ Pour tout le monde"}</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {pieces.map((p) => {
                      const actif = look[r.cle as Cle] === p.id;
                      const vide = p.id === "aucun" || p.id === "aucune";
                      return (
                        <button key={p.id} type="button" onClick={() => choisir(r.cle as Cle, p.id)} className={`tuile-vetement relative rounded-2xl px-1 pb-2 pt-1.5 text-center text-[11px] font-extrabold leading-tight ${actif ? "tuile-choisie" : ""}`}>
                          {actif ? <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[#3fbf5f] text-[11px] text-white">✓</span> : null}
                          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.22),transparent_70%)]">
                            {vide ? <span className="text-2xl opacity-60">✕</span> : <PlumeDessin caractere={caractere} look={{ ...look, [r.cle]: p.id } as Look} cadre={r.vue} className="size-[3.9rem] drop-shadow-[0_3px_4px_rgba(0,0,0,.35)]" />}
                          </span>
                          <span className="mt-1 block">{p.nom}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })}
            {r.couleur ? (
              <div className="mt-1 rounded-2xl bg-white/5 px-2.5 py-2.5">
                <p className="text-xs font-black text-[#f3d48a]">🎨 La couleur</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => couleur(r.couleur!, undefined)} className={`h-9 rounded-full px-3 text-xs font-extrabold ${!look.couleurs[r.couleur] ? "bg-[#f3d48a] text-[#2a1650]" : "bg-white/10 text-white"}`}>D'origine</button>
                  {TEINTES.map((t) => <button key={t.id} type="button" aria-label={t.nom} onClick={() => couleur(r.couleur!, t.id)} className={`goutte size-9 ${look.couleurs[r.couleur!] === t.id ? "ring-4 ring-[#f3d48a] scale-110" : "ring-2 ring-white/25"}`} style={{ background: `radial-gradient(circle at 35% 30%, #fff8, transparent 45%), ${t.c}` }} />)}
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

/** Un petit mannequin tout simple derrière les vêtements, pour voir comment ils se portent. */
function Mannequin() {
  return <g opacity=".22"><ellipse cx="100" cy="112" rx="70" ry="74" fill="#fff" /><ellipse cx="100" cy="140" rx="42" ry="42" fill="#fff" /></g>;
}

/** Le décor de la salle : papier peint, portant à vêtements à gauche, miroir à ampoules à droite, parquet et tapis. */
function Decor() {
  return (
    <svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <pattern id="papier-cabine" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#4a2d7a" /><path d="M14 4 l4 10 l-4 10 l-4 -10 Z" fill="#5a3a90" /><circle cx="0" cy="0" r="2" fill="#6a4aa8" /><circle cx="28" cy="28" r="2" fill="#6a4aa8" /></pattern>
        <linearGradient id="parquet-cabine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a5a2e" /><stop offset="1" stopColor="#5a3416" /></linearGradient>
      </defs>
      <rect width="400" height="340" fill="url(#papier-cabine)" />
      <rect y="232" width="400" height="22" fill="#3a2260" />
      <rect y="250" width="400" height="90" fill="url(#parquet-cabine)" />
      {[0, 50, 100, 150, 200, 250, 300, 350].map((x) => <path key={x} d={`M${x} 250 L${x - 30 + (x - 200) * 0.25} 340`} stroke="#4a2a10" strokeWidth="2" opacity=".5" />)}
      <ellipse cx="200" cy="318" rx="130" ry="18" fill="#c94f90" opacity=".55" />
      <ellipse cx="200" cy="318" rx="112" ry="13" fill="none" stroke="#f3d48a" strokeWidth="2" strokeDasharray="4 6" opacity=".7" />
      {/* Le portant à vêtements */}
      <g transform="translate(18 120)">
        <path d="M0 0 L70 0 M6 0 L6 150 M64 0 L64 150 M-4 150 L16 150 M54 150 L74 150" stroke="#c8cbd8" strokeWidth="4" strokeLinecap="round" />
        {[["#e2453c", 10], ["#3f7fd0", 26], ["#f3c35a", 42], ["#4fb05a", 56]].map(([c, x]) => (
          <g key={String(x)} transform={`translate(${x} 0)`}><path d="M0 0 q0 -6 4 -6" stroke="#c8cbd8" strokeWidth="2" fill="none" /><path d="M-8 6 L4 2 L16 6 L14 50 L-6 50 Z" fill={String(c)} stroke="#2a1650" strokeWidth="1.5" strokeLinejoin="round" /></g>
        ))}
      </g>
      {/* Le miroir à ampoules */}
      <g transform="translate(318 96)">
        <rect x="0" y="0" width="64" height="120" rx="30" fill="#f3d48a" stroke="#b8862e" strokeWidth="3" />
        <rect x="8" y="8" width="48" height="104" rx="24" fill="#9fd8ff" opacity=".55" />
        <path d="M18 24 L30 14 M18 40 L40 22" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} className="ampoule" style={{ animationDelay: `${i * 0.3}s` }} cx={i % 2 ? 66 : -2} cy={14 + i * 22} r="5" fill="#fff6b0" />)}
        <path d="M24 120 L20 152 M40 120 L44 152" stroke="#b8862e" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* Une plante */}
      <g transform="translate(300 214)"><path d="M0 0 L24 0 L20 36 L4 36 Z" fill="#c2402a" /><path d="M12 0 Q0 -24 -8 -30 M12 0 Q12 -30 14 -40 M12 0 Q24 -22 34 -28" stroke="#4fb05a" strokeWidth="5" fill="none" strokeLinecap="round" /></g>
    </svg>
  );
}

const CONF = Array.from({ length: 16 }, (_, i) => ({ x: ((i * 41) % 90) + 5, d: (i % 5) * 0.05, c: ["#f3c35a", "#ff7ab6", "#5fe07a", "#4fb6ff", "#c9a4ff"][i % 5] }));
function Confettis() {
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true">{CONF.map((k, i) => <span key={i} className="confetti-tombe" style={{ left: `${k.x}%`, background: k.c, animationDelay: `${k.d}s` }} />)}</div>;
}

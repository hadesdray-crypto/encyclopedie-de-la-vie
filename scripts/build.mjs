// Construit l'application dans dist/ : JavaScript (esbuild), CSS (Tailwind),
// copie de public/, et liste des fichiers pour le mode hors ligne (sw.js).
// Usage : node scripts/build.mjs           -> construction
//         node scripts/build.mjs --serve   -> serveur local sur http://localhost:8080
import { build, context } from "esbuild";
import { compile } from "tailwindcss";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RACINE, "dist");
const SERVE = process.argv.includes("--serve");
const ARTIFACT = process.argv.includes("--artifact");
// --apk : tout est déjà dans l'application Android, pas besoin du service worker.
const APK = process.argv.includes("--apk");
// Deux éditions : « leonie » (tout ce qui a été trouvé, usage privé en famille) et « commerce » (seulement ce qui peut se vendre).
const COMMERCE = (process.env.EDITION || (process.argv.find((a) => a.startsWith("--edition=")) ?? "").slice(10)) === "commerce";
const require = createRequire(import.meta.url);
const LIBRE = /^(cc0|public domain|pd\b|cc[ -]by(?![ -]n[cd])(?!.*\b(nc|nd)\b))/i;
const luJson = (f) => JSON.parse(readFileSync(join(RACINE, "src/data", f), "utf8"));
const licenceDe = (v) => (typeof v === "string" ? v : v?.licence ?? "");
const libre = (v) => LIBRE.test(licenceDe(v).trim()) && !/\b(nc|nd)\b/i.test(licenceDe(v));
function ensembles() {
  // Les crédits retrouvés ensuite (credits-photos-ajouts.json) comptent aussi : le crédit d'origine garde la priorité.
  const photos = new Set(Object.entries({ ...luJson("credits-photos-ajouts.json"), ...luJson("credits-photos.json") }).filter(([, v]) => libre(v)).map(([id]) => id));
  const cris = new Set(Object.entries(luJson("credits-cris.json")).filter(([, v]) => libre(v)).map(([id]) => id));
  return { photos, cris };
}
/** Édition commerce : on retire les fichiers dont la licence interdit la vente (ou dont l'auteur n'est pas connu). */
function filtrerCommerce() {
  const { photos, cris } = ensembles();
  const retirer = (dossier, garde) => {
    for (const f of fichiers(join(DIST, dossier))) {
      const id = f.split(sep).pop().replace(/\.[^.]+$/, "");
      if (!garde(id, f)) rmSync(f);
    }
  };
  retirer("m", (id) => id === "absent" || photos.has(id));
  // Les images citées directement dans l'arbre de la vie et retirées : on met l'image « absent » à leur place (pas de lien cassé).
  for (const [, id] of readFileSync(join(RACINE, "src/data/arbre.ts"), "utf8").matchAll(/m\/(\d+)\.webp/g)) {
    if (!photos.has(id)) cpSync(join(DIST, "m/absent.webp"), join(DIST, `m/${id}.webp`));
  }
  retirer("s", (id) => cris.has(id));
  const oiseaux = luJson("oiseaux.json").oiseaux;
  const gardes = new Set(oiseaux.flatMap((o) => [...o.photos, ...o.cris].filter((x) => x.commercial !== false).map((x) => x.src.split("/").pop())));
  retirer("oiseaux", (id, f) => gardes.has(f.split(sep).pop()));
  console.log(`Édition commerce : ${photos.size} photos et ${cris.size} cris de mammifères libres de droits conservés.`);
}
// Édition commerce : l'appli ne parle plus de Léonie. L'enfant devient « le petit chercheur » (le nom du module existant).
const REMPLACEMENTS = [
  ["L'encyclopédie de la vie de la princesse", "L'encyclopédie de la vie"],
  ["Princesse<br />Léonie", "Petit<br />chercheur"],
  ["de la petite princesse Léonie", "du petit chercheur"],
  ["à la petite princesse Léonie", "au petit chercheur"],
  ["de la princesse Léonie", "du petit chercheur"], ["de la princesse Leonie", "du petit chercheur"],
  ["à la princesse Léonie", "au petit chercheur"], ["à la princesse Leonie", "au petit chercheur"],
  ["la petite princesse Léonie", "le petit chercheur"], ["la petite Leonie", "le petit chercheur"],
  ["la princesse Léonie", "le petit chercheur"], ["la princesse Leonie", "le petit chercheur"],
  ["au service de la princesse", "au service du petit chercheur"], ["me direz-vous, princesse,", "me direz-vous, petit chercheur,"], ["Merci, princesse !", "Merci, petit chercheur !"],
  ["princesse Léonie", "petit chercheur"], ["Princesse Léonie", "Petit chercheur"], ["princesse Leonie", "petit chercheur"],
  ["grâce à elle, on peut jouer", "grâce à lui, on peut jouer"], ["chouette de Leonie", "chouette de l'enfant"], ["comme Leonie", "comme toi"], ["Leonie", "l'enfant"], ["Léonie", "l'enfant"],
];
const pluginNeutre = {
  name: "neutre",
  setup(b) {
    if (!COMMERCE) return;
    b.onLoad({ filter: /src[\\/].*\.tsx?$/ }, (a) => {
      let t = readFileSync(a.path, "utf8");
      if (!/L[ée]onie|princesse de la vie/i.test(t)) return null;
      for (const [x, y] of REMPLACEMENTS) t = t.split(x).join(y);
      return { contents: t, loader: a.path.endsWith("x") ? "tsx" : "ts", resolveDir: dirname(a.path) };
    });
  },
};
const pluginEdition = {
  name: "edition",
  setup(b) {
    if (!COMMERCE) return;
    const { photos, cris } = ensembles();
    b.onLoad({ filter: /src[\\/]data[\\/](photos|cris)\.json$/ }, (a) => {
      const liste = JSON.parse(readFileSync(a.path, "utf8"));
      const ok = /photos\.json$/.test(a.path) ? photos : cris;
      return { contents: JSON.stringify(liste.filter((id) => ok.has(String(id)))), loader: "json" };
    });
    b.onLoad({ filter: /src[\\/]data[\\/]oiseaux\.json$/ }, (a) => {
      const d = JSON.parse(readFileSync(a.path, "utf8"));
      d.oiseaux = d.oiseaux.map((o) => ({ ...o, photos: o.photos.filter((x) => x.commercial !== false), cris: o.cris.filter((x) => x.commercial !== false) }));
      return { contents: JSON.stringify(d), loader: "json" };
    });
  },
};

function fichiers(dossier) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

async function construireCss() {
  const source = readFileSync(join(RACINE, "src/styles.css"), "utf8");
  const compilateur = await compile(source, {
    base: join(RACINE, "src"),
    async loadStylesheet(id, base) {
      const chemin = id === "tailwindcss" ? require.resolve("tailwindcss/index.css") : id.startsWith("tailwindcss/") ? require.resolve(id) : join(base, id);
      return { path: chemin, base: dirname(chemin), content: readFileSync(chemin, "utf8") };
    },
  });
  const candidats = new Set();
  for (const fichier of fichiers(join(RACINE, "src"))) {
    if (!/\.(tsx?|jsx?)$/.test(fichier)) continue;
    for (const mot of readFileSync(fichier, "utf8").split(/[\s"'`{}<>]+/)) {
      if (mot && mot.length < 120) candidats.add(mot);
    }
  }
  return compilateur.build([...candidats]);
}

const OPTIONS = {
  entryPoints: [join(RACINE, "src/main.tsx")],
  bundle: true,
  // Un seul fichier classique : marche aussi en ouvrant index.html par double-clic.
  format: "iife",
  splitting: false,
  outdir: join(DIST, "assets"),
  entryNames: "[name]-[hash]",
  chunkNames: "[name]-[hash]",
  jsx: "automatic",
  loader: { ".json": "json" },
  plugins: [pluginEdition, pluginNeutre],
  alias: { "@": join(RACINE, "src") },
  target: ["es2020", "safari15"],
  minify: !SERVE,
  sourcemap: SERVE,
  metafile: true,
  logLevel: "warning",
  define: { "process.env.NODE_ENV": SERVE ? '"development"' : '"production"', __HORS_LIGNE__: SERVE || ARTIFACT || APK ? "false" : "true", __PAQUETS__: ARTIFACT ? "true" : "false", __APK__: APK ? "true" : "false", __EDITION__: JSON.stringify(COMMERCE ? "commerce" : "leonie"), __APK_VERSION__: JSON.stringify(Number(process.env.APK_VERSION || 0)), __VERSION_APP__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")) },
};

function ecrirePage(js, css) {
  const html = readFileSync(join(RACINE, "index.html"), "utf8")
    .replace("<!--CSS-->", `<link rel="stylesheet" href="${css}" />`)
    .replace("<!--JS-->", `<script defer src="${js}"></script>`);
  writeFileSync(join(DIST, "index.html"), html);
}

function ecrireServiceWorker() {
  const tous = fichiers(DIST)
    .map((f) => relative(DIST, f).split(sep).join("/"))
    .filter((f) => f !== "sw.js" && f !== "nouveautes.json" && !f.endsWith(".map"));
  const lourds = tous.filter((f) => /^(m|g|fiches|s|chiens)\//.test(f));
  const coquille = tous.filter((f) => !lourds.includes(f));
  const empreinte = createHash("sha256");
  for (const f of tous.sort()) {
    empreinte.update(f);
    empreinte.update(String(statSync(join(DIST, f)).size));
  }
  const version = empreinte.digest("hex").slice(0, 12);
  const modele = readFileSync(join(RACINE, "src/sw-modele.js"), "utf8");
  writeFileSync(
    join(DIST, "sw.js"),
    modele
      .replace("__VERSION__", version)
      .replace("__COQUILLE__", JSON.stringify(["./", ...coquille]))
      .replace("__LOURDS__", JSON.stringify(lourds)),
  );
  return { version, coquille: coquille.length, lourds: lourds.length };
}

async function toutConstruire() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, "assets"), { recursive: true });
  cpSync(join(RACINE, "public"), DIST, { recursive: true });
  if (COMMERCE) filtrerCommerce();
  const resultat = await build(OPTIONS);
  const sortie = Object.entries(resultat.metafile.outputs).find(([, info]) => info.entryPoint);
  const js = relative(DIST, sortie[0]).split(sep).join("/");
  const css = await construireCss();
  const nomCss = `assets/app-${createHash("sha256").update(css).digest("hex").slice(0, 8)}.css`;
  writeFileSync(join(DIST, nomCss), css);
  ecrirePage(js, nomCss);
  const sw = ecrireServiceWorker();
  console.log(`Construit : ${js}, ${nomCss}, hors ligne v${sw.version} (${sw.coquille} fichiers de base, ${sw.lourds} photos et sons)`);
}

async function construireArtifact() {
  // Version pour un lien en ligne : une page sans en-tête HTML, et les photos en paquets par famille.
  const SORTIE = join(RACINE, "dist-lien");
  rmSync(SORTIE, { recursive: true, force: true });
  mkdirSync(join(SORTIE, "assets"), { recursive: true });
  for (const d of ["art", "theme", "fiches", "fonts", "s"]) cpSync(join(RACINE, "public", d), join(SORTIE, d), { recursive: true });
  mkdirSync(join(SORTIE, "m"));
  cpSync(join(RACINE, "public/m/absent.webp"), join(SORTIE, "m/absent.webp"));
  const resultat = await build({ ...OPTIONS, outdir: join(SORTIE, "assets"), entryNames: "app" });
  const css = await construireCss();
  writeFileSync(join(SORTIE, "assets/app.css"), css);
  writeFileSync(
    join(SORTIE, "page.html"),
    `<title>Encyclopédie de la vie</title>\n<meta name="theme-color" content="#140a1e">\n<style>:root{color-scheme:dark}html,body{background:#0b0820}</style>\n<link rel="stylesheet" href="assets/app.css">\n<div id="app"></div>\n<script defer src="assets/app.js"></script>\n`,
  );
  const catalogue = JSON.parse(readFileSync(join(RACINE, "src/data/mammiferes.json"), "utf8"));
  const photos = new Set(JSON.parse(readFileSync(join(RACINE, "src/data/photos.json"), "utf8")));
  const parFamille = {};
  for (const e of catalogue.especes) {
    if (!photos.has(e.id)) continue;
    const f = join(RACINE, "public/m", `${e.id}.webp`);
    if (!existsSync(f)) continue;
    (parFamille[e.famille] ??= {})[e.id] = `data:image/webp;base64,${readFileSync(f).toString("base64")}`;
  }
  mkdirSync(join(SORTIE, "paquets"));
  for (const [famille, contenu] of Object.entries(parFamille)) writeFileSync(join(SORTIE, "paquets", `${famille}.json`), JSON.stringify(contenu));
  console.log("Version lien :", Object.keys(parFamille).length, "paquets de photos", resultat.errors.length, "erreur");
}

if (ARTIFACT) {
  await construireArtifact();
} else if (!SERVE) {
  await toutConstruire();
} else {
  await toutConstruire();
  const ctx = await context({
    ...OPTIONS,
    entryNames: "[name]",
    plugins: [
      {
        name: "recharge",
        setup(b) {
          b.onEnd(async () => {
            const css = await construireCss();
            writeFileSync(join(DIST, "assets/app.css"), css);
            ecrirePage("assets/main.js", "assets/app.css");
          });
        },
      },
    ],
  });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: DIST, port: 8080, host: "0.0.0.0" });
  console.log(`Serveur : http://localhost:${port}`);
}

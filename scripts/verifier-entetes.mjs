// Contrôles C05 et C06 (PRD 4.2 et 6.3) : interdiction d'indexation hors de
// tsr66.fr et en-têtes de sécurité, vérifiés sur de vraies réponses HTTP.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verifier-entetes.mjs
//       site compilé, servi en local par next start (CI). Ne prouve pas ce que
//       sert Netlify : ses fichiers /_next/static reçoivent netlify.toml.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verifier-entetes.mjs <adresse>
//       site en ligne (adresse Netlify, rendue publique le temps du contrôle).
//
// Le drapeau masque l'avertissement de Node sur next.config.ts (fichier
// TypeScript lu directement par Node 24). Code de sortie 1 au moindre écart.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";

const DELAI_REQUETE = 10_000;
// Indexation interdite : une directive exactement « noindex » ou « none » (qui
// vaut « noindex, nofollow »), casse indifférente, sans nom de robot devant
// (« max-image-preview:none » ou « unbot: noindex » n'interdisent rien à tous).
const interditAuxMoteurs = (valeur) =>
  valeur
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .some((d) => d === "noindex" || d === "none");
// Directives de la politique de contenu (CSP) admises : toute autre est refusée.
const DIRECTIVES_CONNUES = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "media-src",
  "object-src",
  "base-uri",
  "form-action",
  "frame-ancestors",
  "upgrade-insecure-requests",
];
const erreurs = [];

function verifier(condition, message) {
  if (!condition) erreurs.push(message);
}

// 1. La règle d'indexation de next.config.ts : seul tsr66.fr en production.
// next.config.ts lit CONTEXT et URL à son chargement : chaque cas le recharge
// sous une adresse distincte (« ?cas= »), sinon Node renverrait la copie en cache.
async function entetesDeLaConfiguration(env, cas) {
  const avant = { CONTEXT: process.env.CONTEXT, URL: process.env.URL };
  Object.assign(process.env, env);
  try {
    const config = (await import(`../next.config.ts?cas=${cas}`)).default;
    const regles = await config.headers();
    // Une seule règle, pour tout le site : une règle ajoutée sur un sous-chemin
    // pourrait remplacer un en-tête sans que les 3 chemins testés le voient.
    verifier(
      regles.length === 1 && regles[0].source === "/:path*",
      `C06 : next.config.ts doit avoir une seule règle d'en-têtes, pour « /:path* »`
    );
    return new Map(
      regles[0].headers.map(({ key, value }) => [key.toLowerCase(), value])
    );
  } finally {
    for (const [cle, valeur] of Object.entries(avant)) {
      if (valeur === undefined) delete process.env[cle];
      else process.env[cle] = valeur;
    }
  }
}

const casIndexation = [
  { env: { CONTEXT: "production", URL: "https://tsr66.fr" }, indexable: true },
  {
    env: { CONTEXT: "production", URL: "https://tsr66.netlify.app" },
    indexable: false,
  },
  {
    env: { CONTEXT: "deploy-preview", URL: "https://tsr66.fr" },
    indexable: false,
  },
  {
    env: { CONTEXT: "branch-deploy", URL: "https://tsr66.fr" },
    indexable: false,
  },
  { env: { CONTEXT: "", URL: "" }, indexable: false },
];
for (const [i, { env, indexable }] of casIndexation.entries()) {
  const entetes = await entetesDeLaConfiguration(env, i);
  const interdit = interditAuxMoteurs(entetes.get("x-robots-tag") ?? "");
  verifier(
    interdit !== indexable,
    `C05 : CONTEXT=${env.CONTEXT || "(vide)"} URL=${env.URL || "(vide)"} → ${
      interdit ? "interdit" : "indexable"
    }, attendu ${indexable ? "indexable" : "interdit"}`
  );
}

// Fichiers servis directement par Netlify : netlify.toml doit donner exactement
// les mêmes en-têtes que next.config.ts hors tsr66.fr, et la compilation de
// production doit commencer par la garde de mise en ligne (C04). Lecture
// stricte, en liste blanche : seuls ces blocs, dans cet ordre, avec ces clés,
// écrits simplement (« clé = "valeur" »), et chaque valeur comparée à celle
// attendue. Toute autre ligne (bloc en plus, « [[ headers ]] », commentaire en
// fin de ligne, clé à points, texte sur plusieurs lignes, en-tête en double
// quelle que soit sa casse) est un écart.
const BLOCS_NETLIFY = [
  ["[build]", ["command", "publish"]],
  ["[context.production]", ["command"]],
  ["[build.environment]", ["NEXT_TELEMETRY_DISABLED", "NPM_VERSION"]],
  ["[[plugins]]", ["package"]],
  ["[[headers]]", ["for"]],
  ["[headers.values]", null], // null : les en-têtes, comparés à next.config.ts
];
const netlifyToml = readFileSync(
  new URL("../netlify.toml", import.meta.url),
  "utf8"
);
const blocsLus = [];
for (const brute of netlifyToml.split("\n")) {
  const ligne = brute.trim();
  if (!ligne || ligne.startsWith("#")) continue;
  if (ligne.startsWith("[")) {
    blocsLus.push({ titre: ligne, valeurs: new Map() });
    continue;
  }
  const [, cle, valeur] = /^([A-Za-z][\w-]*) = "([^"\\]*)"$/.exec(ligne) ?? [];
  const courant = blocsLus.at(-1);
  const dejaLue = [...(courant?.valeurs.keys() ?? [])].some(
    (k) => k.toLowerCase() === cle?.toLowerCase()
  );
  if (!cle || !courant || dejaLue) {
    verifier(false, `netlify.toml : ligne refusée : ${ligne}`);
  } else {
    courant.valeurs.set(cle, valeur);
  }
}
verifier(
  JSON.stringify(blocsLus.map((b) => b.titre)) ===
    JSON.stringify(BLOCS_NETLIFY.map(([titre]) => titre)),
  `netlify.toml : blocs attendus ${BLOCS_NETLIFY.map(([t]) => t).join(" ")}, lus ${blocsLus.map((b) => b.titre).join(" ") || "aucun"}`
);
const bloc = (titre) =>
  blocsLus.find((b) => b.titre === titre)?.valeurs ?? new Map();
for (const [titre, cles] of BLOCS_NETLIFY) {
  if (!cles) continue;
  const lues = [...bloc(titre).keys()];
  verifier(
    JSON.stringify([...lues].sort()) === JSON.stringify([...cles].sort()),
    `netlify.toml ${titre} : clés attendues ${cles.join(", ")}, lues ${lues.join(", ") || "aucune"}`
  );
}
const compilation = bloc("[build]").get("command") ?? "";
verifier(
  compilation === "npm ci && ./node_modules/.bin/next build" &&
    bloc("[build]").get("publish") === ".next",
  `netlify.toml [build] : compilation ou dossier publié inattendus (${compilation})`
);
const npmDuProjet = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
).packageManager;
verifier(
  bloc("[[plugins]]").get("package") === "@netlify/plugin-nextjs" &&
    bloc("[build.environment]").get("NEXT_TELEMETRY_DISABLED") === "1" &&
    `npm@${bloc("[build.environment]").get("NPM_VERSION")}` === npmDuProjet,
  "netlify.toml : module Netlify, télémétrie coupée ou version de npm inattendus"
);
// Commande exacte : « garde && x; compilation » ou « garde && false || … »
// compileraient malgré le refus de la garde.
verifier(
  bloc("[context.production]").get("command") ===
    `node scripts/garde-production.mjs && ${compilation}`,
  "C04 : la compilation de production doit être exactement « node scripts/garde-production.mjs && » suivi de la compilation"
);
verifier(
  bloc("[[headers]]").get("for") === "/*",
  `C06 : la règle [[headers]] de netlify.toml doit porter sur « /* »`
);
const entetesNetlify = new Map(
  [...bloc("[headers.values]")].map(([cle, valeur]) => [
    cle.toLowerCase(),
    valeur,
  ])
);
const entetesPages = await entetesDeLaConfiguration(
  { CONTEXT: "", URL: "" },
  "netlify"
);
for (const cle of new Set([...entetesPages.keys(), ...entetesNetlify.keys()])) {
  verifier(
    entetesPages.get(cle) === entetesNetlify.get(cle),
    `C06 : ${cle} différent entre next.config.ts et netlify.toml`
  );
}
// Autres fichiers de réglage Netlify dans le dépôt, qui échapperaient à cette
// lecture. Les réglages faits dans l'interface Netlify ne sont pas vus ici.
const autresReglages = [
  "netlify.yml",
  "netlify.yaml",
  "netlify.json",
  "_headers",
  "_redirects",
  "public/_headers",
  "public/_redirects",
  "netlify",
].filter((nom) => existsSync(new URL(`../${nom}`, import.meta.url)));
verifier(
  !autresReglages.length,
  `C04/C06 : réglages Netlify hors de netlify.toml : ${autresReglages.join(", ")}`
);

// 2. Les en-têtes réellement envoyés par le serveur.
function verifierReponse(chemin, reponse) {
  const entete = (nom) => reponse.headers.get(nom) ?? "";
  const verifierEgal = (nom, attendu) =>
    verifier(
      entete(nom) === attendu,
      `C06 ${chemin} : ${nom} = ${entete(nom) || "absent"}`
    );

  // Noms en minuscules (le navigateur ignore la casse). Une directive en double
  // est refusée (le navigateur applique la première, la lecture garderait la
  // dernière), comme toute directive hors de la liste : « script-src-elem »,
  // par exemple, passerait outre « script-src ».
  const liste = entete("content-security-policy")
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .filter(([nom]) => nom)
    .map(([nom, ...valeurs]) => [nom.toLowerCase(), valeurs]);
  const directives = new Map(liste);
  const inconnues = liste
    .map(([nom]) => nom)
    .filter(
      (nom, i, noms) =>
        !DIRECTIVES_CONNUES.includes(nom) || noms.indexOf(nom) !== i
    );
  verifier(
    !inconnues.length,
    `C06 ${chemin} : CSP, directive inconnue ou en double : ${inconnues.join(", ")}`
  );
  const attendues = {
    "default-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  for (const [nom, valeurs] of Object.entries(attendues)) {
    verifier(
      JSON.stringify(directives.get(nom)) === JSON.stringify(valeurs),
      `C06 ${chemin} : CSP ${nom} = ${directives.get(nom)?.join(" ") ?? "absent"}`
    );
  }
  // Seul le code de TSR66 : aucune autre origine, pas de « eval » en production.
  for (const nom of [
    "script-src",
    "style-src",
    "img-src",
    "font-src",
    "connect-src",
    "media-src",
  ]) {
    const valeurs = directives.get(nom) ?? [];
    const autorisees = [
      "'self'",
      "'unsafe-inline'",
      ...(nom === "img-src" ? ["blob:", "data:"] : []),
    ];
    verifier(
      valeurs.length > 0 && valeurs.every((v) => autorisees.includes(v)),
      `C06 ${chemin} : CSP ${nom} = ${valeurs.join(" ") || "absent"}`
    );
  }
  verifier(
    directives.has("upgrade-insecure-requests"),
    `C06 ${chemin} : CSP upgrade-insecure-requests absent`
  );
  verifierEgal("x-frame-options", "DENY");
  verifierEgal("x-content-type-options", "nosniff");
  verifierEgal("referrer-policy", "strict-origin-when-cross-origin");
  verifierEgal("cross-origin-opener-policy", "same-origin");
  // Une seule valeur HSTS (deux en-têtes fusionnés donneraient une virgule).
  const hsts = entete("strict-transport-security");
  const dureeHsts = /^max-age=(\d+)/.exec(hsts)?.[1];
  verifier(
    !hsts.includes(",") && Number(dureeHsts) >= 31536000,
    `C06 ${chemin} : strict-transport-security = ${hsts || "absent"}`
  );
  // Valeur exacte, écrite ici (comparer à next.config.ts ne prouverait rien :
  // l'en-tête en vient) ; « camera=() » suivi de « camera=* » l'annulerait.
  verifierEgal(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"
  );
  verifier(
    !entete("x-powered-by"),
    `C06 ${chemin} : x-powered-by présent (${entete("x-powered-by")})`
  );
  // Hors tsr66.fr, chaque réponse interdit l'indexation ; sur tsr66.fr, aucune
  // ne l'interdit (C60, mise en ligne).
  const noindex = interditAuxMoteurs(entete("x-robots-tag"));
  verifier(
    noindex !== siteOfficiel,
    `C05 ${chemin} : x-robots-tag = ${entete("x-robots-tag") || "absent"}`
  );
}

function portLibre() {
  return new Promise((resolve, reject) => {
    const essai = createServer()
      .once("error", reject)
      .listen(0, "127.0.0.1", () => {
        const { port } = essai.address();
        essai.close(() => resolve(port));
      });
  });
}

const adresse = process.argv[2];
const port = adresse ? null : await portLibre();
const base = (adresse ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
// Nom de domaine exact : « https://tsr66.fr.autre-site.com » n'est pas tsr66.fr.
const { protocol, hostname } = new URL(base);
const siteOfficiel = protocol === "https:" && hostname === "tsr66.fr";
const lire = (chemin) =>
  fetch(`${base}${chemin}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(DELAI_REQUETE),
  });
let serveur;

async function demarrerServeurLocal() {
  serveur = spawn(
    "./node_modules/.bin/next",
    ["start", "-p", String(port), "-H", "127.0.0.1"],
    {
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    }
  );
  let sortie = "";
  serveur.stderr.on("data", (d) => (sortie += d));
  const arret = new Promise((_, reject) =>
    serveur.once("exit", (code) =>
      reject(new Error(`next start arrêté (code ${code}) : ${sortie.trim()}`))
    )
  );
  const pret = (async () => {
    for (let essai = 0; essai < 60; essai++) {
      try {
        await lire("/");
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw new Error("le serveur local ne répond pas");
  })();
  await Promise.race([pret, arret]);
}

try {
  if (!adresse) await demarrerServeurLocal();
  const accueil = await lire("/");
  verifier(accueil.status === 200, `/ : statut ${accueil.status}`);
  const html = await accueil.text();
  verifierReponse("/", accueil);

  const introuvable = await lire("/page-inexistante-c06");
  verifier(
    introuvable.status === 404,
    `/page-inexistante-c06 : statut ${introuvable.status}`
  );
  verifierReponse("page introuvable", introuvable);

  const script = /src="(\/_next\/static\/[^"]+\.js)"/.exec(html)?.[1];
  verifier(script, "aucun fichier /_next/static trouvé dans l'accueil");
  if (script) {
    const fichier = await lire(script);
    verifier(fichier.status === 200, `${script} : statut ${fichier.status}`);
    verifierReponse("fichier /_next/static", fichier);
  }
} catch (e) {
  erreurs.push(`contrôle impossible : ${e.message}`);
} finally {
  serveur?.kill();
}

if (erreurs.length) {
  console.error(`✗ ${erreurs.length} écart(s) :\n- ${erreurs.join("\n- ")}`);
  process.exit(1);
}
console.log(
  `✓ C05 et C06 conformes (${base}) : ${casIndexation.length} cas d'indexation, netlify.toml identique, garde de mise en ligne présente (C04), 3 réponses vérifiées${
    adresse
      ? ""
      : " (serveur local : les fichiers servis par Netlify se vérifient avec son adresse)"
  }`
);

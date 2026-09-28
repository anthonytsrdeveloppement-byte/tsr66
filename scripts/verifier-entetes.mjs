// Contrôles C05 et C06 (PRD 4.2 et 6.3) : interdiction d'indexation hors de
// tsr66.fr et en-têtes de sécurité, vérifiés sur de vraies réponses HTTP.
//
//   node scripts/verifier-entetes.mjs             site compilé, servi en local
//   node scripts/verifier-entetes.mjs <adresse>   site en ligne (aperçu Netlify)
//
// Code de sortie 1 au moindre écart.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const PORT = 3999;
const erreurs = [];

function verifier(condition, message) {
  if (!condition) erreurs.push(message);
}

// 1. La règle d'indexation de next.config.ts : seul tsr66.fr en production.
async function entetesDeLaConfiguration(env, cas) {
  const avant = { CONTEXT: process.env.CONTEXT, URL: process.env.URL };
  Object.assign(process.env, env);
  try {
    const config = (await import(`../next.config.ts?cas=${cas}`)).default;
    const [regle] = await config.headers();
    return new Map(regle.headers.map((h) => [h.key.toLowerCase(), h.value]));
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
  const interdit = /noindex/.test(entetes.get("x-robots-tag") ?? "");
  verifier(
    interdit !== indexable,
    `C05 : CONTEXT=${env.CONTEXT || "(vide)"} URL=${env.URL || "(vide)"} → ${
      interdit ? "interdit" : "indexable"
    }, attendu ${indexable ? "indexable" : "interdit"}`
  );
}

// Fichiers servis directement par Netlify : netlify.toml doit donner exactement
// les mêmes en-têtes que next.config.ts hors tsr66.fr.
const blocNetlify =
  readFileSync(new URL("../netlify.toml", import.meta.url), "utf8")
    .split(/^\s*\[headers\.values\]\s*$/m)[1]
    ?.split(/^\s*\[/m)[0] ?? "";
const entetesNetlify = new Map(
  [...blocNetlify.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"(.*)"\s*$/gm)].map(
    ([, cle, valeur]) => [cle.toLowerCase(), valeur]
  )
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

// 2. Les en-têtes réellement envoyés par le serveur.
function verifierReponse(chemin, reponse) {
  const h = (nom) => reponse.headers.get(nom) ?? "";
  const csp = h("content-security-policy");
  const directives = new Map(
    csp
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter(([nom]) => nom)
      .map(([nom, ...valeurs]) => [nom, valeurs])
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
  verifier(
    h("x-frame-options") === "DENY",
    `C06 ${chemin} : X-Frame-Options = ${h("x-frame-options") || "absent"}`
  );
  const hsts = /max-age=(\d+)/.exec(h("strict-transport-security"));
  verifier(
    hsts && Number(hsts[1]) >= 31536000,
    `C06 ${chemin} : Strict-Transport-Security = ${h("strict-transport-security") || "absent"}`
  );
  verifier(
    h("x-content-type-options") === "nosniff",
    `C06 ${chemin} : X-Content-Type-Options = ${h("x-content-type-options") || "absent"}`
  );
  verifier(
    h("referrer-policy") === "strict-origin-when-cross-origin",
    `C06 ${chemin} : Referrer-Policy = ${h("referrer-policy") || "absent"}`
  );
  verifier(
    h("permissions-policy").includes("camera=()"),
    `C06 ${chemin} : Permissions-Policy = ${h("permissions-policy") || "absent"}`
  );
  verifier(
    h("cross-origin-opener-policy") === "same-origin",
    `C06 ${chemin} : Cross-Origin-Opener-Policy = ${h("cross-origin-opener-policy") || "absent"}`
  );
  verifier(
    !h("x-powered-by"),
    `C06 ${chemin} : X-Powered-By présent (${h("x-powered-by")})`
  );
  // Hors tsr66.fr, chaque réponse interdit l'indexation.
  if (!siteOfficiel) {
    verifier(
      /noindex/.test(h("x-robots-tag")),
      `C05 ${chemin} : X-Robots-Tag = ${h("x-robots-tag") || "absent"}`
    );
  }
}

const adresse = process.argv[2];
const base = (adresse ?? `http://127.0.0.1:${PORT}`).replace(/\/$/, "");
// Nom de domaine exact : « https://tsr66.fr.autre-site.com » n'est pas tsr66.fr.
const { protocol, hostname } = new URL(base);
const siteOfficiel = protocol === "https:" && hostname === "tsr66.fr";
let serveur;

async function attendreServeur() {
  for (let essai = 0; essai < 60; essai++) {
    try {
      await fetch(base);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("le serveur local ne répond pas");
}

try {
  if (!adresse) {
    serveur = spawn(
      "./node_modules/.bin/next",
      ["start", "-p", String(PORT), "-H", "127.0.0.1"],
      { stdio: "ignore", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } }
    );
    await attendreServeur();
  }
  const accueil = await fetch(`${base}/`, { redirect: "manual" });
  verifier(accueil.status === 200, `/ : statut ${accueil.status}`);
  const html = await accueil.text();
  verifierReponse("/", accueil);

  const introuvable = await fetch(`${base}/page-inexistante-c06`, {
    redirect: "manual",
  });
  verifier(
    introuvable.status === 404,
    `/page-inexistante-c06 : statut ${introuvable.status}`
  );
  verifierReponse("page introuvable", introuvable);

  const script = /src="(\/_next\/static\/[^"]+\.js)"/.exec(html)?.[1];
  verifier(script, "aucun fichier /_next/static trouvé dans l'accueil");
  if (script) {
    const fichier = await fetch(`${base}${script}`, { redirect: "manual" });
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
  `✓ C05 et C06 conformes (${base}) : ${casIndexation.length} cas d'indexation, netlify.toml identique, 3 réponses vérifiées`
);

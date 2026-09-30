// Tests des contrôles C04 (garde présente dans netlify.toml), C05 (interdiction
// d'indexer) et C06 (en-têtes de sécurité) : scripts/verifier-entetes.mjs.
// Un faux site local renvoie des en-têtes piégés ; netlify.toml et
// next.config.ts sont piégés dans des copies jetables du dépôt.

import { test } from "node:test";
import { createServer } from "node:http";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  RACINE,
  accepte,
  copieDuDepot,
  ecrire,
  lancer,
  lire,
  refuse,
  remplacer,
} from "./outils.mjs";

// En-têtes des pages hors tsr66.fr, lus dans next.config.ts : ceux d'un site
// conforme.
delete process.env.CONTEXT;
delete process.env.URL;
const configuration = (
  await import(pathToFileURL(join(RACINE, "next.config.ts")).href)
).default;
const ENTETES_CONFORMES = (await configuration.headers())[0].headers.map(
  ({ key, value }) => [key, value]
);
const CSP = ENTETES_CONFORMES.find(
  ([cle]) => cle === "Content-Security-Policy"
)[1];
const SCRIPT = "/_next/static/chunks/page.js";

// Faux site : accueil, fichier /_next/static et page introuvable. Chaque
// réponse reçoit les en-têtes conformes, transformés par `pieges` (liste de
// paires [nom, valeur], doublons possibles).
async function fauxSite(t, pieges = {}) {
  const serveur = createServer((requete, reponse) => {
    const [genre, statut, corps] =
      requete.url === "/"
        ? [
            "accueil",
            pieges.statutAccueil ?? 200,
            pieges.html ?? `<script src="${SCRIPT}"></script>`,
          ]
        : requete.url === SCRIPT
          ? ["fichier", 200, "console.log(1)"]
          : ["introuvable", 404, "introuvable"];
    const transformer = pieges[genre] ?? pieges.partout ?? ((e) => e);
    reponse.writeHead(
      statut,
      transformer(ENTETES_CONFORMES.map((e) => [...e])).flat()
    );
    reponse.end(corps);
  });
  await new Promise((resolve) => serveur.listen(0, "127.0.0.1", resolve));
  t.after(() => serveur.close());
  return `http://127.0.0.1:${serveur.address().port}`;
}

function verifierEntetes(adresse, racine = RACINE) {
  return lancer(
    process.execPath,
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      join(racine, "scripts/verifier-entetes.mjs"),
      adresse,
    ],
    { cwd: racine, env: { CONTEXT: undefined, URL: undefined } }
  );
}

// Transformations d'en-têtes.
const remplacerEntete = (nom, valeur) => (entetes) =>
  entetes.map(([cle, v]) => [cle, cle === nom ? valeur : v]);
const retirerEntete = (nom) => (entetes) =>
  entetes.filter(([cle]) => cle !== nom);
const ajouterEntete = (nom, valeur) => (entetes) => [...entetes, [nom, valeur]];

test("site conforme : accepté", async (t) => {
  accepte(await verifierEntetes(await fauxSite(t)));
});

test("« none » (vaut « noindex, nofollow »), en majuscules : accepté", async (t) => {
  accepte(
    await verifierEntetes(
      await fauxSite(t, { partout: remplacerEntete("X-Robots-Tag", "NONE") })
    )
  );
});

// 1. En-têtes réellement envoyés (C05, C06).
for (const [nom, piege, attendu] of [
  [
    "CSP : directive « script-src-elem » qui passerait outre script-src",
    remplacerEntete(
      "Content-Security-Policy",
      `${CSP}; script-src-elem https://pirate.example`
    ),
    "directive inconnue ou en double : script-src-elem",
  ],
  [
    "CSP : directive en double",
    remplacerEntete(
      "Content-Security-Policy",
      `${CSP}; script-src https://pirate.example`
    ),
    "directive inconnue ou en double : script-src",
  ],
  [
    "CSP : « SCRIPT-SRC » placé avant",
    remplacerEntete(
      "Content-Security-Policy",
      `SCRIPT-SRC https://pirate.example; ${CSP}`
    ),
    "directive inconnue ou en double : script-src",
  ],
  [
    "CSP : script d'un autre site",
    remplacerEntete(
      "Content-Security-Policy",
      CSP.replace("script-src 'self'", "script-src 'self' https://cdn.example")
    ),
    "CSP script-src",
  ],
  [
    "CSP : « eval » autorisé",
    remplacerEntete(
      "Content-Security-Policy",
      CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'")
    ),
    "CSP script-src",
  ],
  [
    "CSP : images de n'importe quel site",
    remplacerEntete(
      "Content-Security-Policy",
      CSP.replace("img-src 'self'", "img-src 'self' https:")
    ),
    "CSP img-src",
  ],
  [
    "CSP : intégration dans une autre page",
    remplacerEntete(
      "Content-Security-Policy",
      CSP.replace("frame-ancestors 'none'", "frame-ancestors 'self'")
    ),
    "CSP frame-ancestors",
  ],
  [
    "CSP : sans passage forcé en HTTPS",
    remplacerEntete(
      "Content-Security-Policy",
      CSP.replace("; upgrade-insecure-requests", "")
    ),
    "upgrade-insecure-requests absent",
  ],
  [
    "CSP absente",
    retirerEntete("Content-Security-Policy"),
    "CSP default-src = absent",
  ],
  [
    "CSP en deux en-têtes",
    ajouterEntete(
      "Content-Security-Policy",
      "script-src https://pirate.example"
    ),
    "directive inconnue ou en double",
  ],
  [
    "intégration permise (X-Frame-Options)",
    remplacerEntete("X-Frame-Options", "SAMEORIGIN"),
    "x-frame-options = SAMEORIGIN",
  ],
  [
    "HTTPS retenu un jour seulement",
    remplacerEntete("Strict-Transport-Security", "max-age=86400"),
    "strict-transport-security = max-age=86400",
  ],
  [
    "HSTS en double",
    ajouterEntete("Strict-Transport-Security", "max-age=0"),
    "strict-transport-security",
  ],
  [
    "nosniff absent",
    retirerEntete("X-Content-Type-Options"),
    "x-content-type-options = absent",
  ],
  [
    "Permissions-Policy annulée par un ajout",
    remplacerEntete(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), camera=*"
    ),
    "permissions-policy",
  ],
  [
    "Cross-Origin-Opener-Policy absent",
    retirerEntete("Cross-Origin-Opener-Policy"),
    "cross-origin-opener-policy = absent",
  ],
  [
    "technologie annoncée (X-Powered-By)",
    ajouterEntete("X-Powered-By", "Next.js"),
    "x-powered-by présent",
  ],
  [
    "indexation permise hors tsr66.fr",
    retirerEntete("X-Robots-Tag"),
    "C05 / : x-robots-tag = absent",
  ],
  [
    "« max-image-preview:none » n'interdit pas l'indexation",
    remplacerEntete("X-Robots-Tag", "max-image-preview:none"),
    "C05 / : x-robots-tag",
  ],
  [
    "« unbot: noindex » ne vise qu'un robot",
    remplacerEntete("X-Robots-Tag", "unbot: noindex"),
    "C05 / : x-robots-tag",
  ],
]) {
  test(`refus : ${nom}`, async (t) => {
    refuse(
      await verifierEntetes(await fauxSite(t, { partout: piege })),
      attendu
    );
  });
}

test("refus : en-tête manquant sur la page introuvable seulement", async (t) => {
  refuse(
    await verifierEntetes(
      await fauxSite(t, { introuvable: retirerEntete("X-Frame-Options") })
    ),
    "C06 page introuvable : x-frame-options = absent"
  );
});

test("refus : en-tête manquant sur les fichiers /_next/static seulement", async (t) => {
  refuse(
    await verifierEntetes(
      await fauxSite(t, { fichier: retirerEntete("X-Robots-Tag") })
    ),
    "C05 fichier /_next/static : x-robots-tag = absent"
  );
});

test("refus : accueil en erreur", async (t) => {
  refuse(
    await verifierEntetes(await fauxSite(t, { statutAccueil: 500 })),
    "/ : statut 500"
  );
});

test("refus : aucun fichier /_next/static à vérifier", async (t) => {
  refuse(
    await verifierEntetes(await fauxSite(t, { html: "<p>vide</p>" })),
    "aucun fichier /_next/static trouvé"
  );
});

// 2. netlify.toml lu en liste blanche stricte (C04, C06).
test("copie du dépôt non piégée : acceptée", async (t) => {
  const copie = await copieDuDepot(t, { avecGit: false });
  accepte(await verifierEntetes(await fauxSite(t), copie));
});

const TOML = "netlify.toml";
const COMPILATION = "npm ci && ./node_modules/.bin/next build";
const GARDE = `command = "node scripts/garde-production.mjs && ${COMPILATION}"`;
for (const [nom, avant, apres, attendu] of [
  [
    "bloc en plus",
    "[[plugins]]",
    '[[redirects]]\n  from = "/a"\n  to = "/b"\n[[plugins]]',
    "blocs attendus",
  ],
  [
    "« [[ headers ]] » écrit avec des espaces",
    "[[headers]]",
    "[[ headers ]]",
    "blocs attendus",
  ],
  [
    "commentaire en fin de ligne",
    'for = "/*"',
    'for = "/*" # tout',
    "ligne refusée",
  ],
  [
    "clé à points",
    'X-Frame-Options = "DENY"',
    'X-Frame-Options = "DENY"\n    values.X-Frame-Options = "SAMEORIGIN"',
    "ligne refusée",
  ],
  [
    "texte sur plusieurs lignes",
    'X-Frame-Options = "DENY"',
    'X-Frame-Options = """\nDENY"""',
    "ligne refusée",
  ],
  [
    "valeur entre apostrophes",
    'X-Frame-Options = "DENY"',
    "X-Frame-Options = 'DENY'",
    "ligne refusée",
  ],
  [
    "en-tête en double par la casse",
    'X-Frame-Options = "DENY"',
    'X-Frame-Options = "DENY"\n    x-frame-options = "SAMEORIGIN"',
    "ligne refusée",
  ],
  [
    "nom de clé entre guillemets",
    GARDE,
    GARDE.replace("command", '"command"'),
    "ligne refusée",
  ],
  [
    "garde contournée par « && true; »",
    GARDE,
    `command = "node scripts/garde-production.mjs && true; ${COMPILATION}"`,
    "C04 : la compilation de production",
  ],
  [
    "garde contournée par « || »",
    GARDE,
    `command = "node scripts/garde-production.mjs || ${COMPILATION}"`,
    "C04 : la compilation de production",
  ],
  [
    "garde retirée",
    GARDE,
    `command = "${COMPILATION}"`,
    "C04 : la compilation de production",
  ],
  [
    "bloc de production retiré",
    `[context.production]\n  ${GARDE}\n`,
    "",
    "blocs attendus",
  ],
  [
    "second bloc de production",
    "[build.environment]",
    `[context.production]\n  command = "${COMPILATION}"\n[build.environment]`,
    "blocs attendus",
  ],
  [
    "télémétrie de Next.js rallumée",
    'NEXT_TELEMETRY_DISABLED = "1"',
    'NEXT_TELEMETRY_DISABLED = "0"',
    "télémétrie coupée",
  ],
  [
    "autre module Netlify",
    'package = "@netlify/plugin-nextjs"',
    'package = "netlify-plugin-pirate"',
    "module Netlify",
  ],
  [
    "autre version de npm",
    'NPM_VERSION = "11.19.0"',
    'NPM_VERSION = "10.0.0"',
    "version de npm",
  ],
  [
    "compilation modifiée",
    `command = "${COMPILATION}"\n  publish`,
    `command = "npm install && ./node_modules/.bin/next build"\n  publish`,
    "compilation ou dossier publié",
  ],
  [
    "autre dossier publié",
    'publish = ".next"',
    'publish = "out"',
    "compilation ou dossier publié",
  ],
  [
    "clé en plus",
    'publish = ".next"',
    'publish = ".next"\n  base = "site"',
    "clés attendues",
  ],
  [
    "règle limitée à un sous-dossier",
    'for = "/*"',
    'for = "/_next/*"',
    "doit porter sur « /* »",
  ],
  [
    "valeur différente de next.config.ts",
    'X-Frame-Options = "DENY"',
    'X-Frame-Options = "SAMEORIGIN"',
    "x-frame-options différent",
  ],
  [
    "en-tête absent de netlify.toml",
    '    X-Robots-Tag = "noindex, nofollow"\n',
    "",
    "x-robots-tag différent",
  ],
]) {
  test(`refus netlify.toml : ${nom}`, async (t) => {
    const copie = await copieDuDepot(t, { avecGit: false });
    remplacer(copie, TOML, avant, apres);
    refuse(await verifierEntetes(await fauxSite(t), copie), attendu);
  });
}

for (const fichier of [
  "netlify.yml",
  "netlify.json",
  "_headers",
  "_redirects",
  "public/_headers",
  "public/_redirects",
  "netlify/edge-functions/entetes.js",
]) {
  test(`refus : réglage Netlify hors de netlify.toml (${fichier})`, async (t) => {
    const copie = await copieDuDepot(t, { avecGit: false });
    ecrire(copie, fichier, "/*\n  X-Frame-Options: SAMEORIGIN\n");
    refuse(
      await verifierEntetes(await fauxSite(t), copie),
      "réglages Netlify hors de netlify.toml"
    );
  });
}

// 3. Règle d'indexation et d'en-têtes de next.config.ts (C05, C06).
test("refus : seconde règle d'en-têtes sur un sous-chemin", async (t) => {
  const copie = await copieDuDepot(t, { avecGit: false });
  remplacer(
    copie,
    "next.config.ts",
    '[{ source: "/:path*", headers: entetes }]',
    '[{ source: "/:path*", headers: entetes }, { source: "/espace", headers: [] }]'
  );
  refuse(
    await verifierEntetes(await fauxSite(t), copie),
    "une seule règle d'en-têtes"
  );
});

for (const [nom, condition, attendu] of [
  ["indexable partout", "true", "CONTEXT=(vide) URL=(vide) → indexable"],
  [
    "indexable sur l'adresse de travail Netlify",
    'process.env.CONTEXT === "production"',
    "CONTEXT=production URL=https://tsr66.netlify.app → indexable",
  ],
  [
    "indexable dans les aperçus",
    'process.env.URL === "https://tsr66.fr"',
    "CONTEXT=deploy-preview URL=https://tsr66.fr → indexable",
  ],
  [
    "jamais indexable, même sur tsr66.fr",
    "false",
    "CONTEXT=production URL=https://tsr66.fr → interdit",
  ],
]) {
  test(`refus : règle d'indexation fausse (${nom})`, async (t) => {
    const copie = await copieDuDepot(t, { avecGit: false });
    const texte = lire(copie, "next.config.ts");
    const regle = /const indexable =[^;]+;/.exec(texte)?.[0];
    remplacer(
      copie,
      "next.config.ts",
      regle,
      `const indexable = ${condition};`
    );
    refuse(await verifierEntetes(await fauxSite(t), copie), attendu);
  });
}

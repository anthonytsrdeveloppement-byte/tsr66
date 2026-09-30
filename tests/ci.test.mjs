// Tests des contrôles écrits dans la CI (.github/workflows/ci.yml) : le code
// de chaque étape est extrait du fichier et rejoué avec les mêmes options de
// bash que GitHub (--noprofile --norc -eo pipefail), mais sur cet ordinateur :
// outils du système, gitleaks du PATH (version non vérifiée ici), variables
// d'étape posées par le test (BASE_REF=main). Dépôts jetables piégés.
// Contrôles couverts : C09 (crochets présents), C01 (secrets de l'historique et
// des fichiers publiés), même version de npm pour Netlify et le projet, et
// l'étape qui lance ces tests (aucun test lu = échec).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONFIGURATIONS_INOPERANTES,
  PARALLELE,
  RACINE,
  VERROU,
  VERSION_NPM,
  accepte,
  CONFIGURATION_QUI_ECARTE,
  secretEcarte,
  copieDuDepot,
  depotDeTest,
  dossierJetable,
  ecrire,
  fauxGitleaks,
  fauxJeton,
  fichierSecret,
  git,
  lancer,
  refuse,
  remplacer,
  valider,
  verrouAvecSecret,
} from "./outils.mjs";

// Code d'une étape « run: | » de ci.yml, sans sa marge.
function etape(nom) {
  const lignes = readFileSync(
    join(RACINE, ".github/workflows/ci.yml"),
    "utf8"
  ).split("\n");
  const debut = lignes.findIndex((l) => l.trim() === `- name: ${nom}`);
  assert.ok(debut >= 0, `étape introuvable dans ci.yml : ${nom}`);
  const suivante = lignes.findIndex(
    (l, i) => i > debut && /^\s*- (name|uses):/.test(l)
  );
  const run = lignes.findIndex((l, i) => i > debut && /^\s*run: \|$/.test(l));
  assert.ok(
    run > debut && (suivante < 0 || run < suivante),
    `étape sans bloc « run: | » : ${nom}`
  );
  const retrait = lignes[run].search(/\S/);
  const bloc = [];
  for (const ligne of lignes.slice(run + 1)) {
    if (ligne.trim() && ligne.search(/\S/) <= retrait) break;
    bloc.push(ligne);
  }
  const marge = Math.min(
    ...bloc.filter((l) => l.trim()).map((l) => l.search(/\S/))
  );
  const code = bloc.map((l) => l.slice(marge)).join("\n");
  assert.ok(
    code.trim() && !code.includes("${{"),
    `étape vide ou non rejouable : ${nom}`
  );
  return code;
}

// Rejoue des étapes dans l'ordre, arrêt à la première en échec ; GITHUB_PATH
// et le bloc env: des étapes ne sont pas appliqués. `preparer` reçoit le
// dossier temporaire du travail avant la première étape.
async function rejouer(t, dossier, noms, env = {}, preparer) {
  const runner = dossierJetable(t);
  writeFileSync(join(runner, "github_path"), "");
  await preparer?.(runner);
  let resultat;
  for (const nom of noms) {
    writeFileSync(join(runner, "etape.sh"), etape(nom));
    resultat = await lancer(
      "bash",
      ["--noprofile", "--norc", "-eo", "pipefail", join(runner, "etape.sh")],
      {
        cwd: dossier,
        env: {
          RUNNER_TEMP: runner,
          GITHUB_PATH: join(runner, "github_path"),
          BASE_REF: "main",
          // Posé par le lanceur de tests : un « node --test » rejoué depuis ce
          // test sauterait sinon tous ses fichiers.
          NODE_TEST_CONTEXT: undefined,
          ...env,
        },
      }
    );
    if (resultat.code !== 0) break;
  }
  return resultat;
}

describe("crochets présents et exécutables (C09)", PARALLELE, () => {
  const CROCHETS = "Crochets git présents et exécutables";
  const rejouerAbime = async (t, abimer) => {
    const copie = await copieDuDepot(t);
    await abimer(copie);
    return rejouer(t, copie, [CROCHETS]);
  };

  test("crochets du dépôt : acceptés", async (t) => {
    accepte(await rejouerAbime(t, () => {}));
  });

  for (const [nom, abimer, attendu] of [
    [
      "pre-push non exécutable",
      (c) => git(c, "update-index", "--chmod=-x", ".githooks/pre-push"),
      "Crochets non exécutables : .githooks/pre-push",
    ],
    [
      "pre-commit supprimé",
      (c) => git(c, "rm", "-q", "-f", ".githooks/pre-commit"),
      "Crochet absent ou sans les contrôles communs : pre-commit",
    ],
    [
      "pre-commit sans les contrôles communs",
      (c) =>
        remplacer(
          c,
          ".githooks/pre-commit",
          '. "$(dirname "$0")/_commun.sh"',
          "true"
        ),
      "Crochet absent ou sans les contrôles communs : pre-commit",
    ],
    [
      "pre-push qui n'appelle plus un scan",
      (c) =>
        remplacer(
          c,
          ".githooks/pre-push",
          "  scanner_diff ",
          "  # scanner_diff "
        ),
      "pre-push n'appelle plus scanner_diff",
    ],
    [
      "pre-merge-commit qui n'appelle plus pre-commit",
      (c) =>
        remplacer(
          c,
          ".githooks/pre-merge-commit",
          'exec "$(dirname "$0")/pre-commit"',
          "exit 0"
        ),
      "pre-merge-commit ou _commun.sh absent",
    ],
    [
      "_commun.sh supprimé",
      (c) => git(c, "rm", "-q", "-f", ".githooks/_commun.sh"),
      "pre-merge-commit ou _commun.sh absent",
    ],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      refuse(await rejouerAbime(t, abimer), attendu);
    });
  }
});

const HISTORIQUE = [
  "Tout l'historique, sans exception ajoutée par la demande de fusion",
  "Tout l'historique sans exclusion par nom de fichier",
];
const [PAR_FICHIER, SANS_EXCLUSION] = HISTORIQUE;
const ETAPES = { A: PAR_FICHIER, B: SANS_EXCLUSION };

// Rejoue une seule étape du scan de l'historique : chacune doit attraper ses
// pièges sans compter sur l'autre. La seconde lit la configuration écrite par
// la première : elle est posée ici, telle que la première l'aurait écrite.
function rejouerSeule(t, travail, etape) {
  return rejouer(t, travail, [ETAPES[etape]], {}, async (runner) => {
    if (etape === "A") return;
    const configuration = await git(
      travail,
      "show",
      "refs/remotes/origin/main:.gitleaks.toml"
    );
    ecrire(runner, "gitleaks/config.toml", `${configuration}\n`);
  });
}
const FUITE = /leaks found: [1-9]/;

// Dépôt dont la branche main (sur « origin ») porte la configuration de
// référence ; la demande de fusion est la branche « demande ».
async function demande(t, options) {
  const depot = await depotDeTest(t, options);
  await git(depot.travail, "switch", "-q", "-c", "demande");
  return depot;
}

describe("secrets de tout l'historique (C01)", PARALLELE, () => {
  test("historique propre : accepté", async (t) => {
    const { travail } = await demande(t);
    await valider(travail, { "src/app/exemple.ts": "export const x = 1;\n" });
    accepte(await rejouer(t, travail, HISTORIQUE));
  });

  // Chaque piège est ajouté puis retiré : seul l'historique le contient. Chaque
  // étape citée (A : scan par fichier, B : scan sans exclusion par nom) doit
  // l'attraper seule ; gitleaks ignore par défaut certains noms de fichiers,
  // que seule B lit, et B laisse skills-lock.json à A.
  for (const [nom, etapes, preparer] of [
    [
      "secret dans le code",
      "AB",
      (w) => valider(w, { "src/app/cle.ts": fichierSecret() }),
    ],
    [
      "secret dans un fichier de verrouillage (ignoré par défaut)",
      "B",
      (w) => valider(w, { "yarn.lock": `cle "${fauxJeton()}"\n` }),
    ],
    [
      "secret dans un SVG (ignoré par défaut)",
      "B",
      (w) =>
        valider(w, {
          "public/logo.svg": `<svg><!-- ${fauxJeton()} --></svg>\n`,
        }),
    ],
    [
      "secret dans un SVG au nom en majuscules",
      "B",
      (w) =>
        valider(w, {
          "public/LOGO.SVG": `<svg><!-- ${fauxJeton()} --></svg>\n`,
        }),
    ],
    [
      "secret dans un fichier nommé bootstrap*.js (ignoré par défaut)",
      "B",
      (w) =>
        valider(w, {
          "public/bootstrap-analytics.js": `var cle = "${fauxJeton()}";\n`,
        }),
    ],
    [
      "secret dans un vrai fichier binaire (octet nul)",
      "B",
      (w) =>
        valider(w, { "public/donnees.bin": `\0\0binaire ${fauxJeton()}\n` }),
    ],
    [
      "secret caché par un .gitattributes « binaire »",
      "AB",
      (w) =>
        valider(w, {
          ".gitattributes": "* binary\n",
          "src/app/cle.ts": fichierSecret(),
        }),
    ],
    [
      "secret dans skills-lock.json (hors empreintes)",
      "A",
      (w) => valider(w, { [VERROU]: verrouAvecSecret(w) }),
    ],
    [
      "secret ajouté en résolvant une fusion",
      "AB",
      async (w) => {
        await valider(w, { "a.txt": "a\n" });
        await git(w, "switch", "-q", "-c", "b", "main");
        await valider(w, { "b.txt": "b\n" });
        await git(w, "switch", "-q", "demande");
        await git(w, "merge", "-q", "--no-ff", "--no-commit", "b");
        await valider(w, { "src/app/cle.ts": fichierSecret() }, "Fusion");
      },
    ],
  ]) {
    for (const etape of etapes) {
      test(`refus (étape ${etape} seule) : ${nom}, ajouté puis retiré`, async (t) => {
        const { travail } = await demande(t);
        const avant = await git(travail, "rev-parse", "HEAD");
        await preparer(travail);
        // Le piège est retiré : chaque fichier touché revient à son état d'avant.
        const touches = await git(
          travail,
          "diff",
          "--name-only",
          avant,
          "HEAD"
        );
        for (const fichier of touches.split("\n").filter(Boolean)) {
          const existait = await lancer(
            "git",
            ["cat-file", "-e", `${avant}:${fichier}`],
            { cwd: travail }
          );
          if (existait.code === 0)
            await git(travail, "checkout", avant, "--", fichier);
          else rmSync(join(travail, fichier));
        }
        await valider(travail, {}, "Retrait du piège");
        refuse(await rejouerSeule(t, travail, etape), FUITE);
      });
    }
  }

  test("refus : exception ajoutée par la demande à sa propre configuration", async (t) => {
    const { travail } = await demande(t);
    await valider(travail, {
      ".gitleaks.toml": CONFIGURATION_QUI_ECARTE,
      "src/app/cle.ts": secretEcarte(),
    });
    refuse(await rejouer(t, travail, HISTORIQUE), FUITE);
  });

  test("refus : une étiquette « origin/main » ne remplace pas la configuration de main", async (t) => {
    const { travail } = await demande(t);
    await valider(travail, {
      ".gitleaks.toml": CONFIGURATION_QUI_ECARTE,
    });
    await git(travail, "tag", "origin/main");
    await valider(travail, { "src/app/cle.ts": secretEcarte() });
    refuse(await rejouer(t, travail, HISTORIQUE), FUITE);
  });

  test("refus : fichier .gitleaksignore dans la demande", async (t) => {
    const { travail } = await demande(t);
    await valider(travail, { "src/.gitleaksignore": "empreinte\n" });
    refuse(
      await rejouer(t, travail, HISTORIQUE),
      "Fichier .gitleaksignore interdit"
    );
  });

  for (const [nom, configuration, attendu] of [
    ...CONFIGURATIONS_INOPERANTES.map(([n, c]) => [
      `inopérante (${n})`,
      c,
      "Configuration gitleaks inopérante",
    ]),
    ["illisible", "[extend\n", "gitleaks en erreur"],
  ]) {
    test(`refus : configuration de main ${nom}`, async (t) => {
      const { travail } = await demande(t, {
        configurationDeMain: configuration,
      });
      refuse(await rejouer(t, travail, HISTORIQUE), attendu);
    });
  }

  // gitleaks rend 0 quand git échoue en dessous.
  for (const [nom, reponse] of [
    ["aucun commit scanné", "0 commits scanned"],
    ["erreur de git sous gitleaks", "ERR git error\n5 commits scanned"],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      const { racine, travail } = await demande(t);
      const bin = await fauxGitleaks(racine, reponse);
      refuse(
        await rejouer(t, travail, HISTORIQUE, {
          PATH: `${bin}:${process.env.PATH}`,
        }),
        "Scan de l'historique incomplet"
      );
    });
  }
});

describe("secrets des fichiers publiés (C01)", PARALLELE, () => {
  const PUBLIES = "Aucun secret dans les fichiers publiés (C01)";
  const site = (t, fichiers) => {
    const dossier = dossierJetable(t);
    mkdirSync(join(dossier, ".next/static"), { recursive: true });
    mkdirSync(join(dossier, ".next/server/app"), { recursive: true });
    for (const [fichier, contenu] of Object.entries(fichiers))
      ecrire(dossier, fichier, contenu);
    return dossier;
  };

  test("fichiers publiés propres : acceptés", async (t) => {
    accepte(
      await rejouer(
        t,
        site(t, { ".next/static/chunks/a.js": "console.log(1);\n" }),
        [PUBLIES]
      )
    );
  });

  for (const fichier of [
    ".next/static/chunks/a.js",
    ".next/server/app/index.html",
    "public/logo.svg",
  ]) {
    test(`refus : secret dans ${fichier}`, async (t) => {
      const dossier = site(t, {
        ".next/static/chunks/b.js": "console.log(1);\n",
        [fichier]: `<!-- ${fauxJeton()} -->\n`,
      });
      refuse(await rejouer(t, dossier, [PUBLIES]), FUITE);
    });
  }

  test("refus : aucun fichier publié à lire", async (t) => {
    refuse(
      await rejouer(t, site(t, {}), [PUBLIES]),
      "Aucun fichier publié trouvé à scanner"
    );
  });
});

describe("étape qui lance les tests des contrôles", PARALLELE, () => {
  const TESTS = "Tests des contrôles";
  const avecTests = (t, fichiers) => {
    const dossier = dossierJetable(t);
    for (const [fichier, contenu] of Object.entries(fichiers))
      ecrire(dossier, `tests/${fichier}`, contenu);
    return dossier;
  };
  const REUSSI = 'import { test } from "node:test";\ntest("vrai", () => {});\n';

  test("tests réussis : acceptée", async (t) => {
    accepte(await rejouer(t, avecTests(t, { "a.test.mjs": REUSSI }), [TESTS]));
  });

  for (const [nom, fichiers, attendu] of [
    ["aucun test trouvé (dossier renommé ou vidé)", {}, "aucun test lu"],
    [
      "un test sauté",
      { "a.test.mjs": `${REUSSI}test.skip("sauté", () => {});\n` },
      "aucun test lu, ou des tests sautés",
    ],
    [
      "un test laissé « à faire »",
      { "a.test.mjs": `${REUSSI}test.todo("à faire");\n` },
      "aucun test lu, ou des tests sautés",
    ],
    [
      "un test en échec",
      {
        "a.test.mjs":
          'import { test } from "node:test";\ntest("faux", () => { throw new Error("x"); });\n',
      },
      "ℹ fail 1",
    ],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      refuse(await rejouer(t, avecTests(t, fichiers), [TESTS]), attendu);
    });
  }
});

test("refus : version de npm différente entre Netlify et le projet", async (t) => {
  const copie = await copieDuDepot(t, { avecGit: false });
  remplacer(
    copie,
    "netlify.toml",
    `NPM_VERSION = "${VERSION_NPM}"`,
    'NPM_VERSION = "0.0.1"'
  );
  refuse(
    await rejouer(t, copie, ["Même version de npm pour Netlify et le projet"]),
    `package.json (npm@${VERSION_NPM}) et netlify.toml (npm@0.0.1) diffèrent`
  );
});

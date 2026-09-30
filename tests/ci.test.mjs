// Tests des contrôles écrits dans la CI (.github/workflows/ci.yml) : le code
// de chaque étape est extrait du fichier et rejoué, comme sur les serveurs de
// GitHub (bash -eo pipefail), sur des dépôts jetables piégés. C01 (secrets de
// l'historique et des fichiers publiés), C09 (crochets présents).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import {
  RACINE,
  accepte,
  copieDuDepot,
  copierFichiersSuivis,
  dossierJetable,
  ecrire,
  fauxJeton,
  git,
  lancer,
  lire,
  refuse,
  remplacer,
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

// Rejoue des étapes dans l'ordre, comme un travail de la CI : arrêt à la
// première en échec.
async function rejouer(t, dossier, noms, env = {}) {
  const runner = dossierJetable(t);
  writeFileSync(join(runner, "github_path"), "");
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
          ...env,
        },
      }
    );
    if (resultat.code !== 0) break;
  }
  return resultat;
}

const parallele = { concurrency: Math.max(2, availableParallelism() - 1) };

describe("crochets présents et exécutables (C09)", parallele, () => {
  const CROCHETS = "Crochets git présents et exécutables";
  const avec = async (t, abimer) => {
    const copie = await copieDuDepot(t);
    await abimer(copie);
    return rejouer(t, copie, [CROCHETS]);
  };

  test("crochets du dépôt : acceptés", async (t) => {
    accepte(await avec(t, () => {}));
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
      refuse(await avec(t, abimer), attendu);
    });
  }
});

// Dépôt jetable avec un « origin » : sa branche main porte la configuration
// gitleaks de référence ; la demande de fusion est la branche « demande ».
async function depot(t, { configurationDeMain } = {}) {
  const racine = dossierJetable(t);
  const travail = join(racine, "travail");
  mkdirSync(travail);
  await copierFichiersSuivis(travail);
  await git(travail, "init", "-q", "-b", "main");
  await git(travail, "config", "user.name", "Test TSR66");
  await git(travail, "config", "user.email", "test@example.invalid");
  await git(travail, "config", "commit.gpgsign", "false");
  if (configurationDeMain)
    ecrire(travail, ".gitleaks.toml", configurationDeMain);
  await valider(travail, {}, "Base");
  await git(racine, "init", "-q", "--bare", "-b", "main", "origine.git");
  await git(travail, "remote", "add", "origin", join(racine, "origine.git"));
  await git(travail, "push", "-q", "origin", "main");
  await git(travail, "switch", "-q", "-c", "demande");
  return { racine, travail };
}

async function valider(travail, fichiers, message = "Préparation") {
  for (const [fichier, contenu] of Object.entries(fichiers))
    ecrire(travail, fichier, contenu);
  await git(travail, "add", "-A");
  await git(travail, "commit", "-q", "--allow-empty", "-m", message);
}

const HISTORIQUE = [
  "Tout l'historique, sans exception ajoutée par la demande de fusion",
  "Tout l'historique sans exclusion par nom de fichier",
];
const FUITE = /leaks found: [1-9]/;
// Configuration du projet, règle des jetons GitHub désactivée : l'exception des
// empreintes reste en place, seul le témoin peut voir qu'elle est inopérante.
const SANS_REGLE_GITHUB = readFileSync(
  join(RACINE, ".gitleaks.toml"),
  "utf8"
).replace(
  "useDefault = true",
  'useDefault = true\ndisabledRules = ["github-pat"]'
);
assert.ok(
  SANS_REGLE_GITHUB.includes("disabledRules"),
  ".gitleaks.toml : « useDefault = true » introuvable"
);
const fichierSecret = () => `export const cle = "${fauxJeton()}";\n`;

describe("secrets de tout l'historique (C01)", parallele, () => {
  test("historique propre : accepté", async (t) => {
    const { travail } = await depot(t);
    await valider(travail, { "src/app/exemple.ts": "export const x = 1;\n" });
    accepte(await rejouer(t, travail, HISTORIQUE));
  });

  for (const [nom, fichiers] of [
    ["secret dans le code", () => ({ "src/app/cle.ts": fichierSecret() })],
    [
      "secret dans un fichier de verrouillage (ignoré par défaut)",
      () => ({ "yarn.lock": `cle "${fauxJeton()}"\n` }),
    ],
    [
      "secret dans un SVG (ignoré par défaut)",
      () => ({ "public/logo.svg": `<svg><!-- ${fauxJeton()} --></svg>\n` }),
    ],
    [
      "secret caché par un .gitattributes « binaire »",
      () => ({
        ".gitattributes": "* binary\n",
        "src/app/cle.ts": fichierSecret(),
      }),
    ],
    [
      "secret dans skills-lock.json (hors empreintes)",
      () => ({
        ".claude/skills/skills-lock.json": `{ "note": "${fauxJeton()}" }\n`,
      }),
    ],
  ]) {
    test(`refus : ${nom}, ajouté puis retiré`, async (t) => {
      const { travail } = await depot(t);
      const piege = fichiers();
      await valider(travail, piege);
      for (const fichier of Object.keys(piege)) {
        await git(travail, "checkout", "main", "--", fichier).catch(() =>
          git(travail, "rm", "-q", fichier)
        );
      }
      await valider(travail, {});
      refuse(await rejouer(t, travail, HISTORIQUE), FUITE);
    });
  }

  test("refus : exception ajoutée par la demande à sa propre configuration", async (t) => {
    const { travail } = await depot(t);
    await valider(travail, {
      ".gitleaks.toml": `${lire(travail, ".gitleaks.toml")}\n[[allowlists]]\nregexes = ['''ghp_''']\n`,
      "src/app/cle.ts": fichierSecret(),
    });
    refuse(await rejouer(t, travail, HISTORIQUE), FUITE);
  });

  test("refus : fichier .gitleaksignore dans la demande", async (t) => {
    const { travail } = await depot(t);
    await valider(travail, { "src/.gitleaksignore": "empreinte\n" });
    refuse(
      await rejouer(t, travail, HISTORIQUE),
      "Fichier .gitleaksignore interdit"
    );
  });

  for (const [nom, configuration, attendu] of [
    [
      "rendue inopérante (règle des jetons GitHub désactivée)",
      SANS_REGLE_GITHUB,
      "Configuration gitleaks inopérante",
    ],
    ["illisible", "[extend\n", "gitleaks en erreur"],
  ]) {
    test(`refus : configuration de main ${nom}`, async (t) => {
      const { travail } = await depot(t, {
        configurationDeMain: configuration,
      });
      refuse(await rejouer(t, travail, HISTORIQUE), attendu);
    });
  }

  // gitleaks rend 0 quand git échoue en dessous : un faux gitleaks rejoue ces
  // réponses pour le scan de l'historique, le vrai fait le reste.
  for (const [nom, reponse] of [
    ["aucun commit scanné", "0 commits scanned"],
    ["erreur de git sous gitleaks", "ERR git error\n5 commits scanned"],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      const { racine, travail } = await depot(t);
      const vrai = (
        await lancer("sh", ["-c", "command -v gitleaks"])
      ).standard.trim();
      ecrire(
        racine,
        "bin/gitleaks",
        `#!/bin/sh\nif [ "$1" = git ]; then printf '%s\\n' "${reponse}"; exit 0; fi\nexec "${vrai}" "$@"\n`
      );
      chmodSync(join(racine, "bin/gitleaks"), 0o755);
      refuse(
        await rejouer(t, travail, HISTORIQUE, {
          PATH: `${join(racine, "bin")}:${process.env.PATH}`,
        }),
        "Scan de l'historique incomplet"
      );
    });
  }
});

describe("secrets des fichiers publiés (C01)", parallele, () => {
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

test("refus : version de npm différente entre Netlify et le projet", async (t) => {
  const copie = await copieDuDepot(t, { avecGit: false });
  remplacer(
    copie,
    "netlify.toml",
    'NPM_VERSION = "11.19.0"',
    'NPM_VERSION = "10.0.0"'
  );
  refuse(
    await rejouer(t, copie, ["Même version de npm pour Netlify et le projet"]),
    "package.json (npm@11.19.0) et netlify.toml (npm@10.0.0) diffèrent"
  );
});

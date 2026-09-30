// Tests des crochets git (C01, D6) : .githooks/pre-commit, pre-merge-commit et
// pre-push, installés dans des dépôts jetables (copie du projet et faux
// « origin »). Les commits piégés sont préparés avant l'installation des
// crochets, comme un commit fait par cherry-pick, rebase ou sur une autre
// machine ; puis le crochet doit refuser.
// Les crochets testés sont ceux du dépôt, ou ceux du dossier TSR66_CROCHETS
// (version proposée avant que Nicolas ne l'installe).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join } from "node:path";
import {
  RACINE,
  accepte,
  copierFichiersSuivis,
  dossierJetable,
  ecrire,
  fauxJeton,
  git,
  lancer,
  lierDependances,
  lire,
  refuse,
  remplacer,
} from "./outils.mjs";

const CROCHETS = process.env.TSR66_CROCHETS ?? join(RACINE, ".githooks");
const VERROU = ".claude/skills/skills-lock.json";
const SECRET = "Secret détecté";
// Node du projet en premier : le crochet exige la version de .nvmrc.
const ENV_CROCHETS = {
  PATH: `${dirname(process.execPath)}:${process.env.PATH}`,
};

// Dépôt jetable : copie du projet, premier commit, envoyé à un faux « origin »
// (sa configuration gitleaks sert de référence aux crochets).
async function depot(t, { origine = true } = {}) {
  const racine = dossierJetable(t);
  const travail = join(racine, "travail");
  mkdirSync(travail);
  await copierFichiersSuivis(travail);
  lierDependances(travail);
  await git(travail, "init", "-q", "-b", "main");
  await git(travail, "config", "user.name", "Test TSR66");
  await git(travail, "config", "user.email", "test@example.invalid");
  await git(travail, "config", "commit.gpgsign", "false");
  await valider(travail, {}, "Base");
  if (origine) {
    await git(racine, "init", "-q", "--bare", "-b", "main", "origine.git");
    await git(travail, "remote", "add", "origin", join(racine, "origine.git"));
    await git(travail, "push", "-q", "origin", "main");
  }
  return { racine, travail };
}

// Commit fait sans crochet (préparation) : fichiers écrits (null = supprimé).
async function valider(travail, fichiers, message = "Préparation") {
  for (const [fichier, contenu] of Object.entries(fichiers)) {
    if (contenu === null) rmSync(join(travail, fichier));
    else ecrire(travail, fichier, contenu);
  }
  await git(travail, "add", "-A");
  await git(travail, "commit", "-q", "--allow-empty", "-m", message);
  return git(travail, "rev-parse", "HEAD");
}

function installerCrochets(travail) {
  for (const nom of [
    "_commun.sh",
    "pre-commit",
    "pre-merge-commit",
    "pre-push",
  ]) {
    const cible = join(travail, ".git/hooks", nom);
    copyFileSync(join(CROCHETS, nom), cible);
    chmodSync(cible, 0o755);
  }
}

// Commit soumis au crochet ; le commit n'existe que s'il est accepté.
async function commitAvecCrochet(travail, fichiers, env = {}) {
  for (const [fichier, contenu] of Object.entries(fichiers)) {
    ecrire(travail, fichier, contenu);
  }
  await git(travail, "add", "-A");
  const avant = await git(travail, "rev-parse", "HEAD");
  const resultat = await lancer("git", ["commit", "-m", "Essai"], {
    cwd: travail,
    env: { ...ENV_CROCHETS, ...env },
  });
  const apres = await git(travail, "rev-parse", "HEAD");
  assert.equal(
    apres !== avant,
    resultat.code === 0,
    "commit créé malgré le refus, ou refusé sans le dire"
  );
  return resultat;
}

function envoyer(travail, ...args) {
  return lancer("git", ["push", ...args], { cwd: travail, env: ENV_CROCHETS });
}

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
const parallele = { concurrency: Math.max(2, availableParallelism() - 1) };

describe("contrôle avant commit (pre-commit)", parallele, () => {
  test("commit normal : accepté (secrets, mise en forme, qualité, types)", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    accepte(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": "export const x = 1;\n",
      })
    );
  });

  test("mise en forme corrigée automatiquement", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    accepte(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": "export const  x=1\n",
      })
    );
    assert.equal(
      await git(travail, "show", "HEAD:src/app/exemple.ts"),
      "export const x = 1;"
    );
  });

  test("refus : code incorrect (ESLint)", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts":
          "export function f() {\n  const inutile = 1;\n}\n",
      }),
      "no-unused-vars"
    );
  });

  test("refus : erreur de type", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": 'export const n: number = "texte";\n',
      }),
      "TS2322"
    );
  });

  for (const [nom, fichier, contenu] of [
    ["secret dans le code", "src/app/cle.ts", fichierSecret],
    [
      "secret dans un SVG (ignoré par défaut par gitleaks)",
      "public/logo.svg",
      () => `<svg><!-- ${fauxJeton()} --></svg>\n`,
    ],
    [
      "secret dans un fichier de verrouillage (ignoré par défaut)",
      "yarn.lock",
      () => `cle "${fauxJeton()}"\n`,
    ],
    [
      "secret dans un fichier nommé bootstrap*.js (ignoré par défaut)",
      "public/bootstrap-analytics.js",
      () => `var cle = "${fauxJeton()}";\n`,
    ],
    [
      "secret marqué « gitleaks:allow »",
      "src/app/cle.ts",
      () => `export const cle = "${fauxJeton()}"; // gitleaks:allow\n`,
    ],
    ["secret dans skills-lock.json (hors empreintes)", VERROU, null],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      const { travail } = await depot(t);
      installerCrochets(travail);
      if (fichier === VERROU) {
        remplacer(
          travail,
          VERROU,
          '"skills": {',
          `"note": "${fauxJeton()}",\n  "skills": {`
        );
        refuse(await commitAvecCrochet(travail, {}), SECRET);
      } else {
        refuse(
          await commitAvecCrochet(travail, { [fichier]: contenu() }),
          SECRET
        );
      }
    });
  }

  test("refus : secret caché par un .gitattributes « binaire » du commit", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, {
        ".gitattributes": "* binary\n",
        "src/app/cle.ts": fichierSecret(),
      }),
      SECRET
    );
  });

  test("refus : secret caché par un réglage git local (.git/info/attributes)", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    ecrire(travail, ".git/info/attributes", "*.ts -diff\n");
    refuse(
      await commitAvecCrochet(travail, { "src/app/cle.ts": fichierSecret() }),
      SECRET
    );
  });

  test("refus : exception ajoutée à la configuration gitleaks locale", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    const config = `${lire(travail, ".gitleaks.toml")}\n[[allowlists]]\nregexes = ['''ghp_''']\n`;
    refuse(
      await commitAvecCrochet(travail, {
        ".gitleaks.toml": config,
        "src/app/cle.ts": fichierSecret(),
      }),
      SECRET
    );
  });

  test("refus : configuration gitleaks passée par variable d'environnement", async (t) => {
    const { racine, travail } = await depot(t);
    installerCrochets(travail);
    writeFileSync(
      join(racine, "tout.toml"),
      "[allowlist]\nregexes = ['''.*''']\n"
    );
    refuse(
      await commitAvecCrochet(
        travail,
        { "src/app/cle.ts": fichierSecret() },
        { GITLEAKS_CONFIG: join(racine, "tout.toml") }
      ),
      SECRET
    );
  });

  test("refus : fichier .gitleaksignore (exceptions) à la racine", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    // Présent sur le disque seulement, jamais dans le commit.
    ecrire(travail, ".git/info/exclude", ".gitleaksignore\n");
    ecrire(travail, ".gitleaksignore", "empreinte\n");
    refuse(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": "export const x = 1;\n",
      }),
      "Fichier .gitleaksignore interdit"
    );
  });

  test("refus : fichier .gitleaksignore dans un sous-dossier, dans le commit", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, {
        "src/.gitleaksignore": "empreinte\n",
      }),
      "Fichier .gitleaksignore interdit"
    );
  });

  test("refus : aucune configuration de référence (pas d'origin)", async (t) => {
    const { travail } = await depot(t, { origine: false });
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": "export const x = 1;\n",
      }),
      "Configuration gitleaks de référence introuvable"
    );
  });

  for (const [nom, config, attendu] of [
    [
      "rendue inopérante (règle des jetons GitHub désactivée)",
      SANS_REGLE_GITHUB,
      "Configuration gitleaks inopérante",
    ],
    ["illisible", "[extend\n", "gitleaks en erreur"],
  ]) {
    test(`refus : configuration de référence ${nom}`, async (t) => {
      const { travail } = await depot(t);
      await valider(travail, { ".gitleaks.toml": config });
      await git(travail, "push", "-q", "origin", "main");
      installerCrochets(travail);
      refuse(
        await commitAvecCrochet(travail, {
          "src/app/exemple.ts": "export const x = 1;\n",
        }),
        attendu
      );
    });
  }

  test("refus : skills-lock.json contenant un octet nul", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    writeFileSync(join(travail, VERROU), "\0", { flag: "a" });
    refuse(await commitAvecCrochet(travail, {}), "contient un octet nul");
  });

  test("refus : skills-lock.json déclaré binaire (.git/info/attributes)", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    ecrire(travail, ".git/info/attributes", `${VERROU} binary\n`);
    refuse(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": "export const x = 1;\n",
      }),
      "déclaré binaire ou filtré"
    );
  });

  test("refus : skills-lock.json filtré par core.attributesFile", async (t) => {
    const { racine, travail } = await depot(t);
    installerCrochets(travail);
    writeFileSync(join(racine, "attributs"), `${VERROU} -diff\n`);
    await git(
      travail,
      "config",
      "core.attributesFile",
      join(racine, "attributs")
    );
    refuse(
      await commitAvecCrochet(travail, {
        "src/app/exemple.ts": "export const x = 1;\n",
      }),
      "déclaré binaire ou filtré"
    );
  });

  test("refus : autre version de gitleaks", async (t) => {
    const { racine, travail } = await depot(t);
    installerCrochets(travail);
    const bin = join(racine, "bin");
    ecrire(racine, "bin/gitleaks", "#!/bin/sh\necho 8.0.0\n");
    chmodSync(join(bin, "gitleaks"), 0o755);
    refuse(
      await commitAvecCrochet(
        travail,
        { "src/app/exemple.ts": "export const x = 1;\n" },
        { PATH: `${bin}:${ENV_CROCHETS.PATH}` }
      ),
      "gitleaks 8.30.1 requis, trouvé 8.0.0"
    );
  });
});

describe("contrôle avant fusion locale (pre-merge-commit)", parallele, () => {
  test("refus : fusion sans conflit qui apporte un secret", async (t) => {
    const { travail } = await depot(t);
    await git(travail, "switch", "-q", "-c", "fonction");
    await valider(travail, { "src/app/cle.ts": fichierSecret() });
    await git(travail, "switch", "-q", "main");
    await valider(travail, { "src/app/autre.ts": "export const y = 2;\n" });
    installerCrochets(travail);
    const avant = await git(travail, "rev-parse", "HEAD");
    refuse(
      await lancer("git", ["merge", "--no-ff", "--no-edit", "fonction"], {
        cwd: travail,
        env: ENV_CROCHETS,
      }),
      SECRET
    );
    assert.equal(
      await git(travail, "rev-parse", "HEAD"),
      avant,
      "fusion créée malgré le refus"
    );
  });
});

describe("contrôle avant envoi (pre-push)", parallele, () => {
  test("nouvelle branche sans secret : acceptée", async (t) => {
    const { travail } = await depot(t);
    await git(travail, "switch", "-q", "-c", "propre");
    await valider(travail, { "src/app/exemple.ts": "export const x = 1;\n" });
    installerCrochets(travail);
    accepte(await envoyer(travail, "origin", "propre"));
  });

  for (const [nom, preparer] of [
    ["suppression d'un fichier", { "src/app/page.tsx": null }],
    ["commit vide", {}],
    ["empreinte légitime changée dans skills-lock.json", "empreinte"],
    ["renommage", "renommage"],
    ["droits d'exécution", "droits"],
  ]) {
    test(`envoi normal accepté : ${nom}`, async (t) => {
      const { travail } = await depot(t);
      if (preparer === "empreinte") {
        const texte = lire(travail, VERROU);
        const ancienne = /"[a-f0-9]{64}"/.exec(texte)[0];
        await valider(travail, {
          [VERROU]: texte.replace(ancienne, `"${"c".repeat(64)}"`),
        });
      } else if (preparer === "renommage") {
        await git(travail, "mv", "src/app/page.tsx", "src/app/accueil.tsx");
        await valider(travail, {});
      } else if (preparer === "droits") {
        chmodSync(join(travail, "README.md"), 0o755);
        await valider(travail, {});
      } else {
        await valider(travail, preparer);
      }
      installerCrochets(travail);
      accepte(await envoyer(travail, "origin", "main"));
    });
  }

  test("suppression d'une branche distante : acceptée", async (t) => {
    const { travail } = await depot(t);
    await git(travail, "push", "-q", "origin", "main:ancienne");
    installerCrochets(travail);
    accepte(await envoyer(travail, "origin", "--delete", "ancienne"));
  });

  for (const [nom, branche] of [
    ["sur la branche existante", "main"],
    ["sur une nouvelle branche", "nouvelle"],
  ]) {
    test(`refus : secret ajouté puis retiré ${nom}`, async (t) => {
      const { racine, travail } = await depot(t);
      if (branche !== "main") await git(travail, "switch", "-q", "-c", branche);
      await valider(travail, { "src/app/cle.ts": fichierSecret() });
      await valider(travail, { "src/app/cle.ts": null });
      installerCrochets(travail);
      const distant = await git(
        join(racine, "origine.git"),
        "rev-parse",
        "main"
      );
      refuse(await envoyer(travail, "origin", branche), SECRET);
      assert.equal(
        await git(join(racine, "origine.git"), "rev-parse", "main"),
        distant,
        "envoi fait malgré le refus"
      );
    });
  }

  for (const [nom, fichiers] of [
    [
      "secret dans un SVG",
      { "public/logo.svg": () => `<svg><!-- ${fauxJeton()} --></svg>\n` },
    ],
    [
      "secret dans un fichier de verrouillage",
      { "yarn.lock": () => `cle "${fauxJeton()}"\n` },
    ],
    [
      "secret caché par un .gitattributes « -diff »",
      { ".gitattributes": () => "* -diff\n", "src/app/cle.ts": fichierSecret },
    ],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      const { travail } = await depot(t);
      await valider(
        travail,
        Object.fromEntries(
          Object.entries(fichiers).map(([f, contenu]) => [f, contenu()])
        )
      );
      installerCrochets(travail);
      refuse(await envoyer(travail, "origin", "main"), SECRET);
    });
  }

  test("refus : secret caché par un réglage git local (.git/info/attributes)", async (t) => {
    const { travail } = await depot(t);
    await valider(travail, { "src/app/cle.ts": fichierSecret() });
    ecrire(travail, ".git/info/attributes", "* binary\n");
    installerCrochets(travail);
    refuse(await envoyer(travail, "origin", "main"), SECRET);
  });

  test("refus : secret dans skills-lock.json (hors empreintes)", async (t) => {
    const { travail } = await depot(t);
    const texte = lire(travail, VERROU).replace(
      '"skills": {',
      `"note": "${fauxJeton()}",\n  "skills": {`
    );
    await valider(travail, { [VERROU]: texte });
    installerCrochets(travail);
    refuse(await envoyer(travail, "origin", "main"), SECRET);
  });

  test("refus : secret ajouté en résolvant une fusion", async (t) => {
    const { travail } = await depot(t);
    await git(travail, "switch", "-q", "-c", "a");
    await valider(travail, { "a.txt": "a\n" });
    await git(travail, "switch", "-q", "-c", "b", "main");
    await valider(travail, { "b.txt": "b\n" });
    await git(travail, "switch", "-q", "a");
    await git(travail, "merge", "-q", "--no-ff", "--no-commit", "b");
    await valider(travail, { "src/app/cle.ts": fichierSecret() }, "Fusion");
    installerCrochets(travail);
    refuse(await envoyer(travail, "origin", "a"), SECRET);
  });

  test("dépôt désigné par un chemin avec une espace : envoi propre accepté", async (t) => {
    const { racine, travail } = await depot(t);
    await git(
      racine,
      "init",
      "-q",
      "--bare",
      "-b",
      "main",
      "dépôt avec espace.git"
    );
    installerCrochets(travail);
    accepte(
      await envoyer(travail, join(racine, "dépôt avec espace.git"), "main")
    );
  });

  test("refus : dépôt désigné par un chemin avec une espace, secret dans l'historique", async (t) => {
    const { racine, travail } = await depot(t);
    await git(
      racine,
      "init",
      "-q",
      "--bare",
      "-b",
      "main",
      "dépôt avec espace.git"
    );
    await valider(travail, { "src/app/cle.ts": fichierSecret() });
    await valider(travail, { "src/app/cle.ts": null });
    installerCrochets(travail);
    refuse(
      await envoyer(travail, join(racine, "dépôt avec espace.git"), "main"),
      SECRET
    );
  });

  test("refus : version distante inconnue sur cet ordinateur", async (t) => {
    const { racine, travail } = await depot(t);
    // Une autre copie fait avancer origin ; celle-ci ne l'a pas récupéré.
    await git(racine, "clone", "-q", "origine.git", "autre");
    const autre = join(racine, "autre");
    await git(autre, "config", "user.name", "Test TSR66");
    await git(autre, "config", "user.email", "test@example.invalid");
    await valider(autre, { "autre.txt": "x\n" });
    await git(autre, "push", "-q", "origin", "main");
    await valider(travail, { "src/app/exemple.ts": "export const x = 1;\n" });
    installerCrochets(travail);
    refuse(
      await envoyer(travail, "--force", "origin", "main"),
      "Version distante inconnue"
    );
  });
});

// Tests des crochets git (C01, D6) : .githooks/pre-commit, pre-merge-commit et
// pre-push, installés dans des dépôts jetables (copie du projet et faux
// « origin »). Pour pre-push et pre-merge-commit, les commits piégés sont
// préparés avant l'installation des crochets (comme un commit fait par
// cherry-pick, rebase ou sur une autre machine), puis l'envoi ou la fusion doit
// être refusé. Pour pre-commit, le commit piégé est soumis directement au
// crochet.
// Les crochets testés sont ceux de .githooks/, ou ceux du dossier
// TSR66_CROCHETS (version proposée avant que Nicolas ne l'installe : il doit
// contenir les 4 fichiers ; les tests C09 de ci.test.mjs vérifient toujours
// .githooks/).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CONFIGURATIONS_INOPERANTES,
  PARALLELE,
  RACINE,
  VERROU,
  VERSION_GITLEAKS,
  accepte,
  CONFIGURATION_QUI_ECARTE,
  secretEcarte,
  configurerGit,
  depotDeTest,
  ecrire,
  fauxGitleaks,
  fauxJeton,
  fichierSecret,
  git,
  lancer,
  lire,
  refuse,
  valider,
  verrouAvecSecret,
} from "./outils.mjs";

const CROCHETS = process.env.TSR66_CROCHETS ?? join(RACINE, ".githooks");
if (process.env.TSR66_CROCHETS) {
  console.log(`Crochets testés : ${CROCHETS} (et non .githooks/)`);
}
const SECRET = "Secret détecté";
const PROPRE = { "src/app/exemple.ts": "export const x = 1;\n" };
// Node qui lance les tests en premier dans le PATH : le crochet exige la
// version de .nvmrc (lancer les tests avec elle, sinon le crochet passe par nvm).
const PATH_CROCHETS = `${dirname(process.execPath)}:${process.env.PATH}`;

// Dépôt de test avec les dépendances du projet (le crochet les exige).
const depot = (t, options = {}) =>
  depotDeTest(t, { dependances: true, ...options });

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

// Commit soumis au crochet ; le commit n'existe que s'il est accepté. Par
// défaut, tout le disque est ajouté au commit.
async function commitAvecCrochet(
  travail,
  fichiers,
  { env = {}, toutAjouter = true } = {}
) {
  for (const [fichier, contenu] of Object.entries(fichiers)) {
    ecrire(travail, fichier, contenu);
  }
  if (toutAjouter) await git(travail, "add", "-A");
  const avant = await git(travail, "rev-parse", "HEAD");
  const resultat = await lancer("git", ["commit", "-m", "Essai"], {
    cwd: travail,
    env: { PATH: PATH_CROCHETS, ...env },
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
  return lancer("git", ["push", ...args], {
    cwd: travail,
    env: { PATH: PATH_CROCHETS },
  });
}

describe("contrôle avant commit (pre-commit)", PARALLELE, () => {
  test("commit normal : accepté (secrets, mise en forme, qualité, types)", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    accepte(await commitAvecCrochet(travail, PROPRE));
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

  test("refus : erreur de type corrigée sur le disque mais pas dans le commit", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    ecrire(
      travail,
      "src/app/exemple.ts",
      'export const n: number = "texte";\n'
    );
    await git(travail, "add", "src/app/exemple.ts");
    // Correction laissée hors du commit : les types sont vérifiés sur le commit.
    refuse(
      await commitAvecCrochet(
        travail,
        { "src/app/exemple.ts": "export const n: number = 1;\n" },
        { toutAjouter: false }
      ),
      "TS2322"
    );
  });

  test("refus : dépendances absentes", async (t) => {
    const { travail } = await depot(t, { dependances: false });
    installerCrochets(travail);
    refuse(await commitAvecCrochet(travail, PROPRE), "Dépendances absentes");
  });

  for (const [nom, fichier, contenu] of [
    ["secret dans le code", "src/app/cle.ts", fichierSecret],
    [
      "secret dans un SVG (ignoré par défaut par gitleaks)",
      "public/logo.svg",
      () => `<svg><!-- ${fauxJeton()} --></svg>\n`,
    ],
    [
      "secret dans un SVG au nom en majuscules",
      "public/LOGO.SVG",
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
  ]) {
    test(`refus : ${nom}`, async (t) => {
      const { travail } = await depot(t);
      installerCrochets(travail);
      refuse(
        await commitAvecCrochet(travail, { [fichier]: contenu() }),
        SECRET
      );
    });
  }

  test("refus : secret dans skills-lock.json (hors empreintes)", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, { [VERROU]: verrouAvecSecret(travail) }),
      SECRET
    );
  });

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

  test("refus : exception ajoutée à la configuration gitleaks, dans le même commit", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, {
        ".gitleaks.toml": CONFIGURATION_QUI_ECARTE,
        "src/app/cle.ts": secretEcarte(),
      }),
      SECRET
    );
  });

  test("refus : exception ajoutée par un commit précédent, pas encore envoyé", async (t) => {
    const { travail } = await depot(t);
    await valider(travail, {
      ".gitleaks.toml": CONFIGURATION_QUI_ECARTE,
    });
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, { "src/app/cle.ts": secretEcarte() }),
      SECRET
    );
  });

  test("refus : une étiquette « origin/main » ne remplace pas la configuration de référence", async (t) => {
    const { travail } = await depot(t);
    await git(travail, "switch", "-q", "-c", "piege");
    await valider(travail, {
      ".gitleaks.toml": CONFIGURATION_QUI_ECARTE,
    });
    await git(travail, "tag", "origin/main");
    await git(travail, "switch", "-q", "main");
    installerCrochets(travail);
    refuse(
      await commitAvecCrochet(travail, { "src/app/cle.ts": secretEcarte() }),
      SECRET
    );
  });

  test("refus : fichier .gitleaksignore (exceptions) sur le disque", async (t) => {
    const { travail } = await depot(t);
    installerCrochets(travail);
    // Présent sur le disque seulement, jamais dans le commit.
    ecrire(travail, ".git/info/exclude", ".gitleaksignore\n");
    ecrire(travail, ".gitleaksignore", "empreinte\n");
    refuse(
      await commitAvecCrochet(travail, PROPRE),
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
      await commitAvecCrochet(travail, PROPRE),
      "Configuration gitleaks de référence introuvable"
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
    test(`refus : configuration de référence ${nom}`, async (t) => {
      const { travail } = await depot(t, {
        configurationDeMain: configuration,
      });
      installerCrochets(travail);
      refuse(await commitAvecCrochet(travail, PROPRE), attendu);
    });
  }

  test("refus : gitleaks en erreur sous git (ligne « ERR », code 0)", async (t) => {
    const { racine, travail } = await depot(t);
    installerCrochets(travail);
    const bin = await fauxGitleaks(racine, "ERR fatal: bad revision");
    refuse(
      await commitAvecCrochet(travail, PROPRE, {
        env: { PATH: `${bin}:${PATH_CROCHETS}` },
      }),
      "gitleaks en erreur (code 0)"
    );
  });

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
      await commitAvecCrochet(travail, PROPRE),
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
      await commitAvecCrochet(travail, PROPRE),
      "déclaré binaire ou filtré"
    );
  });

  test("refus : autre version de gitleaks", async (t) => {
    const { racine, travail } = await depot(t);
    installerCrochets(travail);
    ecrire(racine, "bin/gitleaks", "#!/bin/sh\necho 0.0.1\n");
    chmodSync(join(racine, "bin/gitleaks"), 0o755);
    refuse(
      await commitAvecCrochet(travail, PROPRE, {
        env: { PATH: `${join(racine, "bin")}:${PATH_CROCHETS}` },
      }),
      `gitleaks ${VERSION_GITLEAKS} requis, trouvé 0.0.1`
    );
  });
});

describe("contrôle avant fusion locale (pre-merge-commit)", PARALLELE, () => {
  // Branche « fonction » (fichiers donnés) et main qui a avancé : la fusion
  // crée un commit de fusion, soumis au crochet.
  async function fusion(t, fichiers) {
    const { travail } = await depot(t);
    await git(travail, "switch", "-q", "-c", "fonction");
    await valider(travail, fichiers);
    await git(travail, "switch", "-q", "main");
    await valider(travail, { "src/app/autre.ts": "export const y = 2;\n" });
    installerCrochets(travail);
    const avant = await git(travail, "rev-parse", "HEAD");
    const resultat = await lancer(
      "git",
      ["merge", "--no-ff", "--no-edit", "fonction"],
      {
        cwd: travail,
        env: { PATH: PATH_CROCHETS },
      }
    );
    assert.equal(
      (await git(travail, "rev-parse", "HEAD")) !== avant,
      resultat.code === 0,
      "fusion créée malgré le refus, ou refusée sans le dire"
    );
    return resultat;
  }

  test("fusion sans secret : acceptée", async (t) => {
    accepte(await fusion(t, PROPRE));
  });

  test("refus : fusion sans conflit qui apporte un secret", async (t) => {
    refuse(await fusion(t, { "src/app/cle.ts": fichierSecret() }), SECRET);
  });
});

describe("contrôle avant envoi (pre-push)", PARALLELE, () => {
  test("nouvelle branche sans secret : acceptée", async (t) => {
    const { travail } = await depot(t);
    await git(travail, "switch", "-q", "-c", "propre");
    await valider(travail, PROPRE);
    installerCrochets(travail);
    accepte(await envoyer(travail, "origin", "propre"));
  });

  for (const [nom, preparer] of [
    [
      "suppression d'un fichier",
      (w) => valider(w, { "src/app/page.tsx": null }),
    ],
    ["commit vide", (w) => valider(w)],
    [
      "empreinte légitime changée dans skills-lock.json",
      (w) => {
        const texte = lire(w, VERROU);
        const ancienne = /"[a-f0-9]{64}"/.exec(texte)[0];
        return valider(w, {
          [VERROU]: texte.replace(ancienne, `"${"c".repeat(64)}"`),
        });
      },
    ],
    [
      "renommage",
      async (w) => {
        await git(w, "mv", "src/app/page.tsx", "src/app/accueil.tsx");
        return valider(w);
      },
    ],
    [
      "droits d'exécution",
      (w) => {
        chmodSync(join(w, "README.md"), 0o755);
        return valider(w);
      },
    ],
  ]) {
    test(`envoi normal accepté : ${nom}`, async (t) => {
      const { travail } = await depot(t);
      await preparer(travail);
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
      () => ({ "public/logo.svg": `<svg><!-- ${fauxJeton()} --></svg>\n` }),
    ],
    [
      "secret dans un SVG au nom en majuscules",
      () => ({ "public/LOGO.SVG": `<svg><!-- ${fauxJeton()} --></svg>\n` }),
    ],
    [
      "secret dans un fichier de verrouillage",
      () => ({ "yarn.lock": `cle "${fauxJeton()}"\n` }),
    ],
    [
      "secret dans un fichier nommé bootstrap*.js",
      () => ({
        "public/bootstrap-analytics.js": `var cle = "${fauxJeton()}";\n`,
      }),
    ],
    [
      "secret caché par un .gitattributes « -diff »",
      () => ({
        ".gitattributes": "* -diff\n",
        "src/app/cle.ts": fichierSecret(),
      }),
    ],
  ]) {
    test(`refus : ${nom}`, async (t) => {
      const { travail } = await depot(t);
      await valider(travail, fichiers());
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
    await valider(travail, { [VERROU]: verrouAvecSecret(travail) });
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

  test("refus : secret déjà connu d'un autre dépôt distant, pas de celui visé", async (t) => {
    const { racine, travail } = await depot(t);
    await git(racine, "init", "-q", "--bare", "-b", "main", "autre.git");
    await git(travail, "remote", "add", "autre", join(racine, "autre.git"));
    await git(travail, "switch", "-q", "-c", "fuite");
    await valider(travail, { "src/app/cle.ts": fichierSecret() });
    await valider(travail, { "src/app/cle.ts": null });
    await git(travail, "push", "-q", "autre", "fuite");
    installerCrochets(travail);
    refuse(await envoyer(travail, "origin", "fuite"), SECRET);
  });

  test("refus : gitleaks en erreur sous git (ligne « ERR », code 0)", async (t) => {
    const { racine, travail } = await depot(t);
    await valider(travail, PROPRE);
    installerCrochets(travail);
    const bin = await fauxGitleaks(racine, "ERR fatal: bad revision");
    const resultat = await lancer("git", ["push", "origin", "main"], {
      cwd: travail,
      env: { PATH: `${bin}:${PATH_CROCHETS}` },
    });
    refuse(resultat, "gitleaks en erreur (code 0)");
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
    await configurerGit(autre);
    await valider(autre, { "autre.txt": "x\n" });
    await git(autre, "push", "-q", "origin", "main");
    await valider(travail, PROPRE);
    installerCrochets(travail);
    refuse(
      await envoyer(travail, "--force", "origin", "main"),
      "Version distante inconnue"
    );
  });
});

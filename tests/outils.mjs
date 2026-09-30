// Outils communs aux tests des contrôles (node:test, sans dépendance) : copies
// jetables du dépôt, dépôts git de test, lancement des contrôles, faux secrets
// créés à la volée. La plupart des tests placent un piège dans une copie
// jetable (ou derrière un faux service), lancent le vrai contrôle et vérifient
// qu'il refuse avec le bon message ; les cas normaux doivent passer.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RACINE = fileURLToPath(new URL("..", import.meta.url)).replace(
  /\/$/,
  ""
);
export const VERROU = ".claude/skills/skills-lock.json";
// Versions lues dans le dépôt : une mise à jour ne casse pas les tests.
export const VERSION_GITLEAKS = /^GITLEAKS_VERSION="([\d.]+)"$/m.exec(
  readFileSync(join(RACINE, ".githooks/_commun.sh"), "utf8")
)[1];
export const VERSION_NPM = JSON.parse(
  readFileSync(join(RACINE, "package.json"), "utf8")
).packageManager.replace("npm@", "");

// Tests lourds (dépôts git, crochets) : en parallèle, jamais sans fin.
export const PARALLELE = {
  concurrency: Math.max(2, availableParallelism() - 1),
  timeout: 180_000,
};

// Variables qui feraient agir git sur un autre dépôt que la copie jetable, et
// réglages git de l'ordinateur (identité, signature, attributs, dossier des
// crochets) écartés : seuls comptent ceux du dépôt de test.
const VARIABLES_GIT_RETIREES = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"];
const GIT_ISOLE = { GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };

// Dossier temporaire, supprimé à la fin du test.
export function dossierJetable(t) {
  const dossier = realpathSync(mkdtempSync(join(tmpdir(), "tsr66-test-")));
  t.after(() => rmSync(dossier, { recursive: true, force: true }));
  return dossier;
}

// Environnement d'une commande : une variable à undefined est retirée.
function environnementDe(env) {
  const environnement = { ...process.env, ...GIT_ISOLE, ...env };
  for (const cle of VARIABLES_GIT_RETIREES) delete environnement[cle];
  for (const [cle, valeur] of Object.entries(env)) {
    if (valeur === undefined) delete environnement[cle];
  }
  return environnement;
}

// Lance une commande sans bloquer (un faux serveur peut tourner dans le test),
// jamais un shell : ses arguments ne sont jamais interprétés comme des
// commandes. Renvoie le code de sortie, la sortie standard seule et toute la
// sortie (erreurs comprises). Aucune entrée : la commande lit une entrée vide.
export function lancer(commande, args, { cwd = RACINE, env = {} } = {}) {
  return resultatDe(
    spawn(commande, args, {
      cwd,
      env: environnementDe(env),
      stdio: ["ignore", "pipe", "pipe"],
    })
  );
}

// Exécute un script bash avec les options de GitHub Actions (--noprofile
// --norc -eo pipefail). Arguments fixes : le chemin du script passe par une
// variable d'environnement, jamais par la ligne de commande.
export function lancerScriptBash(script, { cwd, env = {} }) {
  return resultatDe(
    spawn(
      "bash",
      ["--noprofile", "--norc", "-eo", "pipefail", "-c", '. "$TSR66_SCRIPT"'],
      {
        cwd,
        env: environnementDe({ ...env, TSR66_SCRIPT: script }),
        stdio: ["ignore", "pipe", "pipe"],
      }
    )
  );
}

function resultatDe(processus) {
  return new Promise((resolve, reject) => {
    let standard = "";
    let sortie = "";
    processus.stdout.on("data", (d) => {
      standard += d;
      sortie += d;
    });
    processus.stderr.on("data", (d) => (sortie += d));
    processus.once("error", reject);
    processus.once("close", (code) => resolve({ code, standard, sortie }));
  });
}

// Commande git qui doit réussir (préparation d'un test, jamais le contrôle).
export async function git(cwd, ...args) {
  const resultat = await lancer("git", args, { cwd });
  assert.equal(resultat.code, 0, `git ${args.join(" ")} :\n${resultat.sortie}`);
  return resultat.standard.trim();
}

// Copie des fichiers suivis par git, tels qu'ils sont sur le disque
// (modifications non validées comprises, fichiers supprimés du disque ignorés) ;
// client/ est écarté même s'il était suivi par erreur. En CI, cela équivaut au
// commit testé.
export async function copierFichiersSuivis(destination) {
  const { standard } = await lancer("git", ["ls-files", "-z"]);
  const chemins = standard.split("\0").filter(Boolean);
  assert.ok(chemins.length > 0, "aucun fichier suivi trouvé");
  for (const chemin of chemins) {
    const source = join(RACINE, chemin);
    if (chemin.startsWith("client/") || !existsSync(source)) continue;
    const cible = join(destination, chemin);
    mkdirSync(dirname(cible), { recursive: true });
    copyFileSync(source, cible);
    chmodSync(cible, statSync(source).mode);
  }
}

// Copie jetable du dépôt ; avec index git (sans commit) si demandé.
export async function copieDuDepot(t, { avecGit = true } = {}) {
  const copie = dossierJetable(t);
  await copierFichiersSuivis(copie);
  if (avecGit) {
    await git(copie, "init", "-q", "-b", "main");
    await git(copie, "add", "-A");
  }
  return copie;
}

// Identité de test, sans signature : réglages locaux du dépôt de test.
export async function configurerGit(depot) {
  await git(depot, "config", "user.name", "Test TSR66");
  await git(depot, "config", "user.email", "test@example.invalid");
  await git(depot, "config", "commit.gpgsign", "false");
}

// Commit de préparation (fichiers écrits ; null = supprimé). Fait avant
// l'installation des crochets, il passe sans eux.
export async function valider(depot, fichiers = {}, message = "Préparation") {
  for (const [fichier, contenu] of Object.entries(fichiers)) {
    if (contenu === null) rmSync(join(depot, fichier));
    else ecrire(depot, fichier, contenu);
  }
  await git(depot, "add", "-A");
  await git(depot, "commit", "-q", "--allow-empty", "-m", message);
  return git(depot, "rev-parse", "HEAD");
}

// Dépôt git de test : copie du projet, premier commit, envoyé à un faux
// « origin » dont la branche main porte la configuration gitleaks de
// référence (remplaçable par `configurationDeMain`).
export async function depotDeTest(
  t,
  { origine = true, dependances = false, configurationDeMain } = {}
) {
  const racine = dossierJetable(t);
  const travail = join(racine, "travail");
  mkdirSync(travail);
  await copierFichiersSuivis(travail);
  if (dependances) lierDependances(travail);
  if (configurationDeMain)
    ecrire(travail, ".gitleaks.toml", configurationDeMain);
  await git(travail, "init", "-q", "-b", "main");
  await configurerGit(travail);
  await valider(travail, {}, "Base");
  if (origine) {
    await git(racine, "init", "-q", "--bare", "-b", "main", "origine.git");
    await git(travail, "remote", "add", "origin", join(racine, "origine.git"));
    await git(travail, "push", "-q", "origin", "main");
  }
  return { racine, travail };
}

// Dépendances du dépôt réel, partagées par lien (jamais modifiées).
export function lierDependances(copie) {
  symlinkSync(join(RACINE, "node_modules"), join(copie, "node_modules"));
}

export function lire(copie, fichier) {
  return readFileSync(join(copie, fichier), "utf8");
}

export function ecrire(copie, fichier, contenu) {
  mkdirSync(dirname(join(copie, fichier)), { recursive: true });
  writeFileSync(join(copie, fichier), contenu);
}

// Remplace un passage d'un fichier. Le passage doit exister : une modification
// sans effet donnerait un test vert à tort.
export function remplacer(
  copie,
  fichier,
  avant,
  apres,
  { partout = false } = {}
) {
  const texte = lire(copie, fichier);
  assert.ok(
    texte.includes(avant),
    `${fichier} : passage introuvable « ${avant} »`
  );
  ecrire(
    copie,
    fichier,
    partout ? texte.split(avant).join(apres) : texte.replace(avant, () => apres)
  );
}

// Faux jeton GitHub, différent à chaque appel, jamais écrit dans le dépôt :
// seules les copies jetables le reçoivent.
export function fauxJeton() {
  const lettres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const corps = Array.from({ length: 36 }, () => lettres[randomInt(62)]);
  return `ghp_${corps.join("")}`;
}
export const fichierSecret = () => `export const cle = "${fauxJeton()}";\n`;
// skills-lock.json avec un faux jeton hors des empreintes (l'exception de
// .gitleaks.toml ne couvre que les empreintes).
export const verrouAvecSecret = (depot) =>
  lire(depot, VERROU).replace(
    '"skills": {',
    () => `"note": "${fauxJeton()}",\n  "skills": {`
  );

// Configurations gitleaks affaiblies, tirées de celle du projet (l'exception
// des empreintes reste) : ces dépôts ne contiennent aucun secret, seul le
// témoin peut donc voir l'écart.
const CONFIGURATION = readFileSync(join(RACINE, ".gitleaks.toml"), "utf8");
function affaiblir(ajout) {
  assert.ok(
    CONFIGURATION.includes("useDefault = true\n"),
    ".gitleaks.toml : « useDefault = true » introuvable"
  );
  return CONFIGURATION.replace(
    "useDefault = true\n",
    () => `useDefault = true\n${ajout}`
  );
}
export const CONFIGURATIONS_INOPERANTES = [
  [
    "règle des jetons GitHub désactivée",
    affaiblir('disabledRules = ["github-pat"]\n'),
  ],
  [
    "exception qui écarte toute ligne contenant « = »",
    `${CONFIGURATION}\n[[allowlists]]\nregexTarget = "line"\nregexes = ['''=''']\n`,
  ],
];
// Configuration qui passe les témoins mais écarte toute ligne contenant
// « motDePasseEcarte », et secret écrit sur une telle ligne. Une exception par
// ligne est respectée par les deux scans (par fichier et par l'entrée standard) ;
// une exception par nom de fichier ne l'est pas par le second, qui rattraperait
// le secret et rendrait le test vert pour une mauvaise raison.
export const CONFIGURATION_QUI_ECARTE = `${CONFIGURATION}\n[[allowlists]]\nregexTarget = "line"\nregexes = ['''motDePasseEcarte''']\n`;
export const secretEcarte = () =>
  `export const motDePasseEcarte = "${fauxJeton()}";\n`;

// Faux gitleaks : rejoue `reponse` pour « gitleaks git » (code 0, comme quand
// git échoue en dessous), le vrai gitleaks fait le reste.
export async function fauxGitleaks(dossier, reponse) {
  const vrai = (process.env.PATH ?? "")
    .split(":")
    .map((dossierDuPath) => join(dossierDuPath, "gitleaks"))
    .find((chemin) => existsSync(chemin));
  assert.ok(vrai, "gitleaks introuvable sur cet ordinateur");
  ecrire(
    dossier,
    "bin/gitleaks",
    `#!/bin/sh\nif [ "$1" = git ]; then printf '%s\\n' "${reponse}"; exit 0; fi\nexec "${vrai}" "$@"\n`
  );
  chmodSync(join(dossier, "bin/gitleaks"), 0o755);
  return join(dossier, "bin");
}

// Le contrôle refuse, avec le message attendu (texte ou expression).
export function refuse(resultat, attendu) {
  assert.notEqual(resultat.code, 0, `accepté à tort :\n${resultat.sortie}`);
  if (typeof attendu === "string") {
    assert.ok(
      resultat.sortie.includes(attendu),
      `refusé, mais sans « ${attendu} » :\n${resultat.sortie}`
    );
  } else {
    assert.match(resultat.sortie, attendu);
  }
}

// Le contrôle accepte un cas normal.
export function accepte(resultat) {
  assert.equal(resultat.code, 0, `refusé à tort :\n${resultat.sortie}`);
}

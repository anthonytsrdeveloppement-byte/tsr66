// Outils communs aux tests des contrôles (node:test, sans dépendance) : copies
// jetables du dépôt, lancement des contrôles, faux secrets créés à la volée.
// Chaque test place un piège dans une copie jetable, lance le vrai contrôle et
// vérifie qu'il refuse avec le bon message ; les cas normaux doivent passer.

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
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RACINE = fileURLToPath(new URL("..", import.meta.url)).replace(
  /\/$/,
  ""
);

// Variables qui feraient agir git sur un autre dépôt que la copie jetable.
const VARIABLES_GIT = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"];

// Dossier temporaire, supprimé à la fin du test.
export function dossierJetable(t) {
  const dossier = realpathSync(mkdtempSync(join(tmpdir(), "tsr66-test-")));
  t.after(() => rmSync(dossier, { recursive: true, force: true }));
  return dossier;
}

// Lance une commande sans bloquer (un faux serveur peut tourner dans le test).
// Une variable d'environnement à undefined est retirée. Renvoie le code de
// sortie, la sortie standard seule et toute la sortie (erreurs comprises).
// Aucune entrée : la commande lit une entrée vide.
export function lancer(commande, args, { cwd = RACINE, env = {} } = {}) {
  const environnement = { ...process.env, ...env };
  for (const cle of VARIABLES_GIT) delete environnement[cle];
  for (const [cle, valeur] of Object.entries(env)) {
    if (valeur === undefined) delete environnement[cle];
  }
  return new Promise((resolve, reject) => {
    const processus = spawn(commande, args, {
      cwd,
      env: environnement,
      stdio: ["ignore", "pipe", "pipe"],
    });
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

// Copie des fichiers suivis par git, dans leur état actuel, sans client/
// (jamais versionné) : ce que voient les serveurs de la CI.
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

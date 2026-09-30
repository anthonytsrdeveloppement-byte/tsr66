// Tests de la garde de mise en ligne (scripts/garde-production.mjs, C04) :
// seul un commit de l'historique de main est compilé en production ; au
// moindre doute, refus.

import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { RACINE, accepte, lancer, refuse } from "./outils.mjs";

const GARDE = join(RACINE, "scripts/garde-production.mjs");
const FAUX_GITHUB = pathToFileURL(join(RACINE, "tests/faux-github.mjs")).href;
const MAIN = "a1".repeat(20);
const ANCIEN = "b2".repeat(20);

const refMain = (
  objet = { type: "commit", sha: MAIN },
  ref = "refs/heads/main"
) => ({
  "/git/ref/heads/main": { corps: { ref, object: objet } },
});
const comparaison = (status) => ({
  [`/compare/${MAIN}...${ANCIEN}`]: { corps: { status } },
});

function garde(env, scenario) {
  return lancer(process.execPath, ["--import", FAUX_GITHUB, GARDE], {
    env: {
      CONTEXT: "production",
      BRANCH: "production",
      COMMIT_REF: MAIN,
      FAUX_GITHUB: JSON.stringify(scenario),
      ...env,
    },
  });
}

test("dernier commit de main : mise en ligne autorisée", async () => {
  accepte(await garde({}, { reponses: refMain() }));
});

test("commit plus ancien de main (relance de la version en ligne) : autorisé", async () => {
  accepte(
    await garde(
      { COMMIT_REF: ANCIEN },
      { reponses: { ...refMain(), ...comparaison("behind") } }
    )
  );
});

for (const [nom, env, attendu] of [
  [
    "aperçu d'une demande de fusion",
    { CONTEXT: "deploy-preview" },
    "contexte « deploy-preview »",
  ],
  ["contexte absent", { CONTEXT: undefined }, "contexte « (vide) »"],
  [
    "branche main compilée en production",
    { BRANCH: "main" },
    "branche « main »",
  ],
  ["branche absente", { BRANCH: undefined }, "branche « (vide) »"],
  ["commit abrégé", { COMMIT_REF: MAIN.slice(0, 7) }, "illisible"],
  ["commit en majuscules", { COMMIT_REF: MAIN.toUpperCase() }, "illisible"],
  [
    "commit suivi d'un retour à la ligne",
    { COMMIT_REF: `${MAIN}\n` },
    "illisible",
  ],
  ["nom de branche à la place du commit", { COMMIT_REF: "HEAD" }, "illisible"],
  ["commit absent", { COMMIT_REF: undefined }, "commit « (vide) »"],
]) {
  test(`refus : ${nom}`, async () => {
    refuse(await garde(env, { reponses: refMain() }), attendu);
  });
}

for (const statut of ["ahead", "diverged"]) {
  test(`refus : commit hors de l'historique de main (« ${statut} »)`, async () => {
    refuse(
      await garde(
        { COMMIT_REF: ANCIEN },
        { reponses: { ...refMain(), ...comparaison(statut) } }
      ),
      `n'est pas dans l'historique de main (« ${statut} »)`
    );
  });
}

test("refus : comparaison sans statut", async () => {
  refuse(
    await garde(
      { COMMIT_REF: ANCIEN },
      {
        reponses: {
          ...refMain(),
          [`/compare/${MAIN}...${ANCIEN}`]: { corps: {} },
        },
      }
    ),
    "réponse illisible"
  );
});

for (const [nom, reponses] of [
  [
    "une étiquette « main » à la place de la branche",
    refMain(undefined, "refs/tags/main"),
  ],
  [
    "la branche main pointe vers autre chose qu'un commit",
    refMain({ type: "tag", sha: MAIN }),
  ],
  ["identifiant de main illisible", refMain({ type: "commit", sha: "main" })],
]) {
  test(`refus : ${nom}`, async () => {
    refuse(
      await garde({}, { reponses }),
      "réponse de GitHub illisible (branche main)"
    );
  });
}

test("refus : GitHub injoignable", async () => {
  refuse(await garde({}, { injoignable: true }), "GitHub injoignable");
});

test("refus : branche main introuvable (404)", async () => {
  refuse(await garde({}, { reponses: {} }), "réponse de GitHub 404");
});

test("refus : limite d'appels anonymes atteinte", async () => {
  refuse(
    await garde(
      {},
      {
        reponses: {
          "/git/ref/heads/main": {
            status: 403,
            entetes: { "x-ratelimit-remaining": "0" },
          },
        },
      }
    ),
    "limite d'appels anonymes atteinte"
  );
});

test("refus : réponse de GitHub illisible", async () => {
  refuse(
    await garde(
      {},
      { reponses: { "/git/ref/heads/main": { texte: "<html>" } } }
    ),
    "réponse de GitHub illisible"
  );
});

test("refus : commit inconnu de GitHub (comparaison introuvable)", async () => {
  refuse(
    await garde({ COMMIT_REF: ANCIEN }, { reponses: refMain() }),
    "réponse de GitHub 404"
  );
});

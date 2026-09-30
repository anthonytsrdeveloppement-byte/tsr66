// Garde de la mise en ligne (PRD 6.1, fiche F5, contrôle C04) : lancé par
// Netlify avant chaque compilation de production (netlify.toml).
//
//   node scripts/garde-production.mjs
//
// Seul un commit de l'historique de la branche main (fusions validées par la
// CI et par le « oui » de Nicolas) peut être mis en ligne : normalement le
// dernier, jusqu'où la procédure avance la branche production ; un plus ancien
// reste accepté pour relancer la compilation de la version en ligne après que
// main a avancé. La protection GitHub de production accepterait aussi un
// commit de demande de fusion non fusionnée dont la CI est verte : la
// compilation échoue alors, rien n'est publié (documentation Netlify « How
// credits work », 2026-09-29 : une compilation en échec ne consomme aucun
// crédit). Au moindre doute (réponse illisible, GitHub injoignable ou limite
// d'appels atteinte), refus.
//
// Limite : Netlify lit ce fichier dans le commit qu'il compile. Un commit qui
// réécrirait cette garde y échapperait (la CI ne vérifie que la ligne de
// commande de netlify.toml, pas le contenu de ce fichier). Seuls peuvent le
// faire ceux qui écrivent sur la branche production, protégée, ou qui ont accès
// au compte Netlify ; ils peuvent de toute façon publier : c'est le risque
// résiduel consigné au contrôle C04. La garde protège contre l'erreur, pas
// contre un auteur malveillant.

const DEPOT = "anthonytsrdeveloppement-byte/tsr66";
const API = `https://api.github.com/repos/${DEPOT}`;
const DELAI_REQUETE = 10_000;

function refuser(message) {
  console.error(`✗ Mise en ligne refusée : ${message}`);
  process.exit(1);
}

// Lecture d'une réponse de l'API GitHub (dépôt public : aucune clé nécessaire).
async function lireGithub(chemin) {
  let reponse;
  try {
    reponse = await fetch(`${API}${chemin}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(DELAI_REQUETE),
    });
  } catch (erreur) {
    refuser(`GitHub injoignable (${erreur.message}) : relancer plus tard`);
  }
  if (!reponse.ok) {
    const limite = reponse.headers.get("x-ratelimit-remaining") === "0";
    refuser(
      `réponse de GitHub ${reponse.status}${
        limite
          ? " (limite d'appels anonymes atteinte : relancer plus tard)"
          : ""
      }`
    );
  }
  try {
    return await reponse.json();
  } catch (erreur) {
    refuser(`réponse de GitHub illisible (${erreur.message})`);
  }
}

// Variables fournies par Netlify à la compilation.
const { CONTEXT, BRANCH, COMMIT_REF } = process.env;
const SHA = /^[0-9a-f]{40}$/;

if (CONTEXT !== "production") {
  refuser(
    `contexte « ${CONTEXT || "(vide)"} », ce script ne sert qu'en production`
  );
}
if (BRANCH !== "production") {
  refuser(
    `branche « ${BRANCH || "(vide)"} », seule la branche production est mise en ligne`
  );
}
if (!SHA.test(COMMIT_REF ?? "")) {
  refuser(`commit « ${COMMIT_REF || "(vide)"} » illisible`);
}

// 1. Dernier commit de la branche main, lu par son nom complet
// (refs/heads/main) : une étiquette nommée « main » ne peut pas s'y substituer.
const ref = await lireGithub("/git/ref/heads/main");
const dernierDeMain =
  ref?.ref === "refs/heads/main" && ref?.object?.type === "commit"
    ? ref.object.sha
    : undefined;
if (!SHA.test(dernierDeMain ?? "")) {
  refuser("réponse de GitHub illisible (branche main)");
}

// 2. Le commit compilé est ce dernier commit, ou un commit de son historique
// (« identical » ou « behind » : comparaison entre deux identifiants exacts).
if (COMMIT_REF !== dernierDeMain) {
  const comparaison = await lireGithub(
    `/compare/${dernierDeMain}...${COMMIT_REF}`
  );
  if (!["identical", "behind"].includes(comparaison?.status)) {
    refuser(
      `le commit ${COMMIT_REF.slice(0, 7)} n'est pas dans l'historique de main (« ${
        comparaison?.status ?? "réponse illisible"
      } ») : avancer la branche production jusqu'au dernier commit de main (${dernierDeMain.slice(0, 7)}), puis relancer`
    );
  }
}
console.log(
  `✓ Commit ${COMMIT_REF.slice(0, 7)} dans l'historique de main (dernier : ${dernierDeMain.slice(0, 7)}) : mise en ligne autorisée`
);

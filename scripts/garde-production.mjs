// Garde de la mise en ligne (PRD 6.1, fiche F5, contrôle C04) : lancé par
// Netlify avant chaque compilation de production (netlify.toml).
//
//   node scripts/garde-production.mjs
//
// Seul un commit déjà fusionné dans main, donc validé par la CI et par le
// « oui » de Nicolas, peut être mis en ligne. La protection GitHub de la
// branche production accepterait aussi un commit de demande de fusion non
// fusionnée dont la CI est verte : la compilation échoue alors, rien n'est
// publié (une compilation en échec ne consomme aucun crédit Netlify).
// Au moindre doute (réponse illisible, GitHub injoignable), refus.

const DEPOT = "anthonytsrdeveloppement-byte/tsr66";
const DELAI_REQUETE = 10_000;

function refuser(message) {
  console.error(`✗ Mise en ligne refusée : ${message}`);
  process.exit(1);
}

// Variables fournies par Netlify à la compilation.
const { CONTEXT, BRANCH, COMMIT_REF } = process.env;

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
if (!/^[0-9a-f]{40}$/.test(COMMIT_REF ?? "")) {
  refuser(`commit « ${COMMIT_REF || "(vide)"} » illisible`);
}

// « identical » ou « behind » : le commit est dans l'historique de main.
// Dépôt public : aucune clé n'est nécessaire.
let reponse;
try {
  reponse = await fetch(
    `https://api.github.com/repos/${DEPOT}/compare/main...${COMMIT_REF}`,
    {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(DELAI_REQUETE),
    }
  );
} catch (erreur) {
  refuser(`GitHub injoignable (${erreur.message})`);
}
if (!reponse.ok) {
  refuser(`réponse de GitHub ${reponse.status}`);
}
const { status } = await reponse.json();
if (status !== "identical" && status !== "behind") {
  refuser(
    `le commit ${COMMIT_REF.slice(0, 7)} n'est pas dans main (« ${status} »)`
  );
}
console.log(
  `✓ Commit ${COMMIT_REF.slice(0, 7)} présent dans main : mise en ligne autorisée`
);

// Lancé par .githooks/pre-commit sur les seuls fichiers du commit, avec la
// même couverture que la CI (prettier --check . et eslint sur tout le dépôt).
// Les types sont vérifiés à part, par le crochet, sur tout le commit.
const config = {
  "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}": [
    "prettier --write",
    "eslint --max-warnings=0 --no-warn-ignored",
  ],
  "*.{json,css,scss,yml,yaml,html,mdx}": "prettier --write",
};

export default config;

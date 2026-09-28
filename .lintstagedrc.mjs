// Lancé par .githooks/pre-commit sur les seuls fichiers du commit.
// Les types sont vérifiés à part, par le crochet, sur tout le commit.
const config = {
  "*.{js,mjs,cjs,ts,tsx}": [
    "prettier --write",
    "eslint --max-warnings=0 --no-warn-ignored",
  ],
  "*.{json,css}": "prettier --write",
};

export default config;

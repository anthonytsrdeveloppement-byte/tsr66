# Fonctions communes aux crochets git de TSR66 (chargé par pre-commit et
# pre-push, jamais exécuté seul). Variable attendue : ACTION (« commit »…).

# Même version que la CI (.github/workflows/ci.yml, GITLEAKS_VERSION) : les
# changer ensemble.
GITLEAKS_VERSION="8.30.1"
# Arbre vide de git : aucun .gitattributes ne peut déclarer un fichier
# « binaire » pour le cacher au scan des secrets.
ARBRE_VIDE="4b825dc642cb6eb9a060e54bf8d69288fbee4904"

refuser() {
  echo "✖ $1 : $ACTION refusé." >&2
  exit 1
}

# gitleaks présent, à la bonne version, sans exception possible depuis
# l'ordinateur (variables d'environnement, fichiers .gitleaksignore).
verifier_gitleaks() {
  command -v gitleaks >/dev/null 2>&1 || refuser "gitleaks introuvable"
  [ "$(gitleaks version)" = "$GITLEAKS_VERSION" ] \
    || refuser "gitleaks $GITLEAKS_VERSION requis, trouvé $(gitleaks version)"
  unset GITLEAKS_CONFIG GITLEAKS_CONFIG_TOML
  if [ -e .gitleaksignore ] || [ -n "$(git ls-files -- '*.gitleaksignore' '.gitleaksignore')" ]; then
    refuser "Fichier .gitleaksignore interdit (exceptions aux secrets)"
  fi
}

# Configuration de la version principale publiée, lue par son nom complet
# (refs/remotes/origin/main) : jamais une version locale, qu'un commit pourrait
# élargir. Absente (dépôt sans « origin », jamais récupéré) : refus. Vérifiée
# par un témoin : un faux jeton GitHub créé à l'instant, jamais écrit ni
# affiché, doit être détecté (code 42) ; 0 = configuration inopérante, autre =
# gitleaks en erreur (configuration illisible), qui ne doit pas passer pour une
# détection. Le jeton est donné seul, sans « token = » : seule la règle des
# jetons GitHub le reconnaît (une règle générique le détecterait même si
# celle-ci était désactivée, tests/crochets.test.mjs).
# Limite : le témoin prouve que la règle des jetons GitHub est active, pas que
# les autres le sont ni que les exceptions sont étroites (revues à la fusion).
preparer_config() {
  git show refs/remotes/origin/main:.gitleaks.toml >"$1/config.toml" 2>/dev/null \
    || refuser "Configuration gitleaks de référence introuvable (git fetch origin)"
  temoin="ghp_$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 36)"
  code=0
  printf '%s\n' "$temoin" \
    | gitleaks stdin --no-banner --exit-code 42 --config "$1/config.toml" \
      >/dev/null 2>"$1/temoin.log" \
    || code=$?
  [ "$code" -eq 0 ] \
    && refuser "Configuration gitleaks inopérante (le jeton témoin n'est pas détecté)"
  if [ "$code" -ne 42 ]; then
    cat "$1/temoin.log" >&2
    refuser "gitleaks en erreur (code $code) : configuration illisible ?"
  fi
}

# Scan de commits par gitleaks (options passées telles quelles), par fichier :
# garde l'exception étroite de skills-lock.json. Code 42 = secret, 0 = rien,
# autre = erreur (journal affiché, valeurs masquées). gitleaks rend 0 quand git
# échoue en dessous : une ligne « ERR » est un refus. Aucun nombre de commits
# scannés n'est exigé : gitleaks ne compte pas un commit sans contenu ajouté
# (suppression, renommage, droits, commit vide).
scanner_git() {
  dossier="$1"
  shift
  code=0
  GIT_ATTR_SOURCE="$ARBRE_VIDE" gitleaks git --redact --no-banner --ignore-gitleaks-allow \
    --exit-code 42 --config "$dossier/config.toml" --gitleaks-ignore-path "$dossier" \
    "$@" >"$dossier/scan.log" 2>&1 \
    || code=$?
  if [ "$code" -eq 42 ]; then
    cat "$dossier/scan.log" >&2
    refuser "Secret détecté. Retirer le secret du fichier (valeur jamais recopiée ailleurs)"
  fi
  if [ "$code" -ne 0 ] || grep -q 'ERR' "$dossier/scan.log"; then
    cat "$dossier/scan.log" >&2
    refuser "gitleaks en erreur (code $code)"
  fi
}

# Scan d'un diff par l'entrée standard : aucune exclusion par nom de fichier
# (gitleaks ignore par défaut SVG, images, lockfiles, bootstrap*.js…).
scanner_diff() {
  code=0
  gitleaks stdin --redact --no-banner --ignore-gitleaks-allow --exit-code 42 \
    --config "$2/config.toml" --gitleaks-ignore-path "$2" <"$1" \
    || code=$?
  [ "$code" -eq 0 ] && return 0
  [ "$code" -eq 42 ] \
    && refuser "Secret détecté. Retirer le secret du fichier (valeur jamais recopiée ailleurs)"
  refuser "gitleaks en erreur (code $code)"
}

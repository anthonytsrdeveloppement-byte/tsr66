# Fonctions communes aux crochets git de TSR66 (chargé par pre-commit et
# pre-push, jamais exécuté seul). Variable attendue : ACTION (« commit »…).

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

# Configuration de la version principale publiée (jamais une version locale),
# vérifiée par un témoin : un faux jeton créé à l'instant, jamais écrit ni
# affiché, doit être détecté. Sinon la configuration est inopérante.
preparer_config() {
  git show origin/main:.gitleaks.toml >"$1/config.toml" 2>/dev/null \
    || git show HEAD:.gitleaks.toml >"$1/config.toml" 2>/dev/null \
    || refuser "Aucune configuration gitleaks de référence"
  temoin="ghp_$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 36)"
  if printf 'token = "%s"\n' "$temoin" | gitleaks stdin --no-banner --config "$1/config.toml" >/dev/null 2>&1; then
    refuser "Configuration gitleaks inopérante (le jeton témoin n'est pas détecté)"
  fi
}

# Scan d'un diff par l'entrée standard : aucune exclusion par nom de fichier
# (gitleaks ignore par défaut SVG, images, lockfiles, bootstrap*.js…).
scanner_diff() {
  gitleaks stdin --redact --no-banner --ignore-gitleaks-allow \
    --config "$2/config.toml" --gitleaks-ignore-path "$2" <"$1" \
    || refuser "Secret détecté. Retirer le secret du fichier (valeur jamais recopiée ailleurs)"
}

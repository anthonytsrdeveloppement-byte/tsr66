# TSR66

Site vitrine de TSR66, entreprise de terrassement à Saint-Jean-Lasseille (Pyrénées-Orientales).

Tout part du cahier des charges : [`docs/PRD.md`](docs/PRD.md). La feuille de route est dans [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Après avoir récupéré le projet

```sh
nvm use                # Node 24.21.0, fixé par .nvmrc
npm ci                 # dépendances à l'identique, scripts d'installation bloqués (.npmrc)
npm run hooks:install  # active le contrôle avant commit (secrets, mise en forme, qualité, types)
```

Le contrôle avant commit (`.githooks/pre-commit`) demande [gitleaks](https://github.com/gitleaks/gitleaks) 8.30.1, figé avec `brew pin gitleaks` : une mise à jour se décide, elle ne se subit pas. Les exceptions de gitleaks (`.gitleaks.toml`) ne s'appliquent qu'une fois fusionnées dans la version principale.

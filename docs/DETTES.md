# Registre des dettes — TSR66

> Règles : PRD section 2.2. Seuls les problèmes 🟡 peuvent y figurer, **jamais une faille, un secret ou un problème RGPD** (🔴).
> Au maximum 10 dettes ouvertes. Échéance au plus tard à la fin du lot en cours. **Zéro dette pour la mise en production.**
> Relu au démarrage (D1), mis à jour en fin de session (F6).

## Dettes ouvertes : 4

| # | Date | Description | Raison du report | Impact | Échéance |
|---|---|---|---|---|---|
| 1 | 2026-09-30 | Tests des en-têtes (`tests/verifier-entetes.test.mjs`) : directives CSP `default-src`, `object-src`, `base-uri`, `form-action`, origine externe dans `connect-src`, `style-src`, `font-src`, `media-src`, directive vide, `Referrer-Policy` et HSTS absent non piégés | Remarques de relecture non critiques (PRD 2.2) ; ligne d'arrivée de la session fixée avec Nicolas | Un affaiblissement de ces branches du contrôle C06 ne serait pas vu par les tests (le contrôle lui-même fonctionne) | Fin du Lot 1 |
| 2 | 2026-09-30 | Tests des en-têtes : mode « serveur local » de `verifier-entetes.mjs` (serveur arrêté, port) et branche du site officiel (`tsr66.fr` exact, `noindex` présent sur tsr66.fr) jamais exercés | Idem | Idem pour C05 (la branche tsr66.fr sert au Lot 5) | Fin du Lot 1 |
| 3 | 2026-09-30 | Tests de l'alignement : variantes de mise en forme du registre (`` ` ``, `_`, `~`, `[`, `<`, `\`, minuscule, sans barre initiale) et cas où la mémoire de Claude est présente (termes obsolètes, faits, négations tolérées) | Idem | Idem pour C07 | Fin du Lot 1 |
| 4 | 2026-09-30 | Tests des crochets : mauvaise version de Node, gitleaks absent, fichier de configuration lint-staged intrus, envoi de plusieurs branches à la fois | Idem | Idem pour D4 et C01 | Fin du Lot 1 |

## Dettes remboursées

| # | Date d'ouverture | Description | Remboursée le | Comment |
|---|---|---|---|---|

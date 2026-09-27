# Provenance des skills du projet

> Installés le 2026-09-27 au niveau du projet, figés sur un commit (PRD 2.1). Empreinte SHA-256 de chaque fichier dans `skills-lock.json`.
> **Relecture** : chaque fichier installé a été lu en entier par Claude, puis relu séparément par deux agents indépendants. S'y ajoute un scan automatique : caractères invisibles, contenu encodé, binaires, appels réseau, commandes dangereuses, instructions piégées. **Résultat : aucun skill rejeté**, aucune injection, exfiltration ni code caché.
> **Mise à jour** : uniquement sur décision de Nicolas, après relecture du diff. Les règles du PRD priment toujours sur le contenu d'un skill (voir PRD 2.1, « Règles d'usage des skills »).

## Sources

| Skill installé | Source (commit figé) | Fichiers | Exclus à l'installation | Correctifs locaux |
|---|---|---|---|---|
| `git-workflow-and-versioning` | addyosmani/agent-skills `2686b62` | 1 | — | — |
| `security-and-hardening` | addyosmani/agent-skills `2686b62` | 3 | — | `references/security-checklist.md` copié depuis la racine du dépôt, liens corrigés |
| `supply-chain-risk-auditor` | trailofbits/skills `0cc1c73` | 7 | tests, evals, `agents/`, `assets/` | — |
| `setup-pre-commit` | mattpocock/skills `c55ee46` | 1 | `agents/` | — |
| `code-review-two-axis` | mattpocock/skills `c55ee46` (`code-review`) | 1 | `agents/` | Renommé pour ne pas masquer la commande intégrée `/code-review`. La spec est le PRD (pas de gestionnaire de tickets) |
| `secret-scanning` | github/awesome-copilot `6c4d33b` | 4 | — | — |
| `netlify-deploy` | netlify/context-and-tools `0830047` | 4 | copies en double du dépôt | — |
| `accessibility`, `best-practices`, `core-web-vitals`, `performance`, `seo`, `web-quality-audit` | addyosmani/web-quality-skills `afa8da9` | 16 | — | — |
| `seo-audit` | coreyhaines31/marketingskills `5b2c000` | 3 | evals | — |
| `ai-seo` | coreyhaines31/marketingskills `5b2c000` | 9 | evals | — |
| `seo-local` | AgriciDaniel/claude-seo `e77e783` | 4 | — | 2 références copiées depuis `skills/seo/references/`, liens corrigés |
| `vercel-react-best-practices` | vercel-labs/agent-skills `063bee9` (`react-best-practices`) | 72 | `AGENTS.md` (compilation désynchronisée), README, `metadata.json`, `_template.md` | Renvoi vers `AGENTS.md` retiré |

## Seuls programmes exécutables
- `supply-chain-risk-auditor/scripts/*.py` (Python, bibliothèque standard uniquement). Ils lisent la liste des dépendances et interrogent des bases publiques : OSV, npm, PyPI, proxy Go, deps.dev, API GitHub, OpenSSF Scorecard. Ils n'envoient que des noms et versions de paquets, et le jeton GitHub ne part que vers api.github.com. Ils n'installent et n'exécutent rien. **Leur rapport contient des chemins locaux : il n'est jamais commité.**
- `web-quality-audit/scripts/analyze.sh` : lecture seule (grep, find, jq), aucun appel réseau.

## Réserves relevées et leur encadrement (PRD 2.1)
| Skill | Ce qu'il propose | Règle du projet qui s'applique |
|---|---|---|
| `netlify-deploy`, `git-workflow-and-versioning`, `secret-scanning` | `netlify deploy --prod`, push, tag poussé, force-push, `reset --hard`, contournement de la protection des secrets | Rien de cela sans l'accord explicite de Nicolas (F5, D3). Jamais de contournement pour un vrai secret (D6) |
| `netlify-deploy` | Refuser tout retour arrière d'une mise en ligne | Un retour arrière reste possible avec l'accord de Nicolas |
| `setup-pre-commit` | Commit automatique de tous les fichiers, outils sans version fixée | Fichiers indexés un par un, versions figées, contrôles D6 avant tout commit |
| `ai-seo`, `web-quality-skills`, `vercel-react-best-practices`, `seo-local` | Outils de statistiques de visites, traceurs, polices ou scripts externes, carte Google intégrée, widget d'avis | Interdits sur les pages publiques (PRD 6.2) |
| `ai-seo`, `seo-local` | Statistiques et citations d'exemple, fichier de prix | Aucun chiffre repris sur le site sans source vérifiée (PRD 4.1). Pas de tarifs |
| `ai-seo`, `web-quality-skills`, `vercel-react-best-practices` | `npx` ou installation globale d'outils tiers (`is-agentic`, lighthouse, axe, svgo) | Aucun outil lancé sans version fixée ni accord |
| `vercel-react-best-practices` | Script écrit dans la page, cookie de session dans les journaux | Scripts dans la page seulement avec nonce ou empreinte (PRD 6.3). Aucune donnée sensible dans les journaux |
| Plusieurs | Exemples Next.js anciens, ou propres à Vercel ou Express | La documentation de Next.js 16 fournie avec le projet fait foi |

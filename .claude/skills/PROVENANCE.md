# Provenance des skills du projet

> Installés le 2026-09-27 au niveau du projet, figés sur un commit (PRD 2.1). Empreinte SHA-256 de chaque fichier dans `skills-lock.json`. Skills de design et d'animation ajoutés le 2026-09-30, sur décision de Nicolas, par la même procédure.
> **Relecture** : chaque fichier installé a été lu en entier par Claude, puis relu séparément par deux agents indépendants. S'y ajoute un scan automatique : caractères invisibles, contenu encodé, binaires, appels réseau, commandes dangereuses, instructions piégées. **Résultat : aucun skill rejeté pour contenu malveillant**, aucune injection, exfiltration ni code caché. Un skill candidat a été écarté en 2026-09-30 pour conflit avec la pile (voir plus bas).
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
| `frontend-design` | anthropics/claude-plugins-official `fbe07fb` (`plugins/frontend-design/skills/frontend-design`) | 1 | `LICENSE.txt` (cité par le skill, non copié) | — |
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-performance` | greensock/gsap-skills `aed9cfd` (skills officiels, MIT) | 6 | `gsap-utils`, `gsap-frameworks` (Vue, Svelte), exemples, configurations d'autres outils | — |
| `emil-design-eng`, `animate`, `find-animation-opportunities`, `review-animations` | emilkowalski/skills `d16ebe6` (MIT) | 6 | Swift, React Native, `improve-animations`, `pick-ui-library`, `ask-sonner`, `apple-design`, `animation-vocabulary` | — |

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

## Skills de design et d'animation (2026-09-30)
Relecture : lecture intégrale par Claude, puis par deux relecteurs indépendants (sécurité ; conflits avec les règles du projet). Scan automatique : aucun caractère invisible, octet nul ni caractère de contrôle. **Aucune injection, exfiltration ni contenu caché.** Seuls appels réseau : des liens de documentation (gsap.com, easing.dev, easings.co, emilkowal.ski). Le skill `frontend-design` est aussi fourni par le plugin du même nom au niveau de l'utilisateur ; la copie du projet est celle qui est figée.

**Écarté : `scroll-experience`** (vibeship-spawner-skills, `risk: unknown`). Pas de contenu malveillant, mais il recommande Framer Motion et Locomotive Scroll (pile retenue : GSAP + Lenis), part de `opacity: 0` sans JavaScript, ajoute `tabindex="0"` aux sections et renvoie vers des skills absents. Les skills GSAP officiels couvrent son apport.

| Skill | Ce qu'il propose | Règle du projet qui s'applique |
|---|---|---|
| `gsap-react`, `gsap-plugins`, `gsap-core` | `npm install gsap` et `@gsap/react` sans version, `ScrollSmoother`, état initial `from()` qui cache le contenu, chargement de GSAP « par script » | Dépendance en version exacte et avec l'accord de Nicolas ; import npm local, jamais de CDN ; Lenis et non ScrollSmoother ; texte lisible sans JavaScript (PRD 4.2) ; licence des plugins (SplitText) à vérifier avant usage |
| `gsap-scrolltrigger` | Épinglage, défilement horizontal piloté par le vertical ; `Max.max` (faute de frappe pour `Math.max`) dans un exemple | Seuils de 5.4 et accessibilité WCAG 2.2 AA ; ne pas recopier l'exemple tel quel |
| `emil-design-eng`, `animate`, `review-animations`, `find-animation-opportunities` | Exemples Motion / Framer Motion et Base UI ; `@starting-style` et `clip-path` qui cachent le contenu sans JavaScript ; renvois vers des skills absents (`pick-ui-library`, `improve-animations`, `animate-expo`) | Transposer en GSAP ou CSS ; Motion et Base UI non retenus (PRD 6.1) ; aucun contenu masqué par défaut ; ne jamais chercher ni installer un skill cité mais absent |
| Les quatre ci-dessus | « Initial Response » : répondre une phrase fixe quand le skill est invoqué sans question | Le démarrage (feu D1 à D7) n'est jamais intercepté ; ces phrases ne s'appliquent pas quand une tâche est donnée |
| `emil-design-eng`, `review-animations` | Format de revue imposé (tableau Avant / Après, verdict Block / Approve) | Utilisable pour les revues d'animation ; le rapport de session reste au format du modèle |
| `frontend-design` | Plan en deux passes avant de coder, « confirmer avec le client », captures d'écran | Nicolas est le client : le plan est présenté avant de coder ; aucune capture ni installation d'outil sans version fixée |

# Checklist de fin de session — F1 à F6

> Fiches validées par Nicolas (PRD 2.3). Modifiées seulement sur sa décision.
> Chaque fiche : **règle**, **contrôle**, **résultat attendu**, **si c'est rouge**, **preuve**. Chaque contrôle repose sur une commande réelle dont le résultat est montré.

**F1 — Tout est vert**
| Rubrique | Contenu |
|---|---|
| Règle | Le travail de la session ne compte que si tout est au vert |
| Contrôle | Suite de D7, plus ① accessibilité (tests automatiques) ② performance (Lighthouse, seuils minimum) ③ SEO : titres et descriptions uniques, un seul titre principal, données structurées valides, texte lisible sans JavaScript ④ RGPD : aucune page publique ne contacte un site tiers (seul le portail privé tsr66.fr/espace utilise la connexion Google et Sanity) ⑤ tous les contrôles actifs du registre `4-controles-du-site.md`, date de vérification mise à jour (`web-quality-skills`, `verification-before-completion`) |
| Résultat attendu | Tout au vert, seuils respectés |
| Si c'est rouge | La session n'est pas close : correction d'abord, cause trouvée avec `systematic-debugging` |
| Preuve | Résultat de chaque contrôle dans le rapport |

**F2 — Revue de code**
| Rubrique | Contenu |
|---|---|
| Règle | Tout le code de la session est relu par un relecteur indépendant qui ne reçoit que les modifications, les règles du projet et le PRD |
| Contrôle | ① `code-review` : conformité aux règles du projet et conformité au PRD, deux relecteurs en parallèle ② agents `pr-review-toolkit` (erreurs silencieuses, tests, types) ③ grille `vercel-react-best-practices` |
| Traitement | `receiving-code-review` : chaque retour est vérifié, puis corrigé, refusé avec une raison écrite ou mis en dette s'il est mineur. F1 est relancé après les corrections |
| Résultat attendu | Plus aucun retour bloquant, chaque retour a une issue |
| Si c'est rouge | Correction, puis nouvelle relecture |
| Preuve | Liste des retours et issue de chacun dans le rapport |

**F3 — Revue sécurité**
| Rubrique | Contenu |
|---|---|
| Règle | Toute modification est relue sous l'angle sécurité par un relecteur indépendant, puis vérifiée par des outils automatiques |
| Contrôle | ① relecteur sécurité indépendant (grilles `security-audit` volet web + Netlify, `security-and-hardening` OWASP) ② `/security-review` ③ `aikido:scan` des fichiers modifiés ④ Semgrep ⑤ `security-guidance` (automatique à chaque commit) ⑥ en fin de lot et avant la mise en production : `claude-security` |
| Résultat attendu | 0 faille |
| Si c'est rouge | Toujours bloquant, jamais mis en dette : correctif réel, puis nouveau contrôle |
| Preuve | Résultats de chaque contrôle dans le rapport |

**F4 — Secrets et dépendances avant l'envoi**
| Rubrique | Contenu |
|---|---|
| Règle | Rien n'est envoyé sur GitHub ni en production sans ce dernier contrôle sur l'état final |
| Contrôle | ① tous les contrôles de D6, plus un scan des fichiers produits pour le site ② chaque variable nécessaire en production est déclarée dans Netlify (`netlify-deploy`, noms vérifiés, jamais les valeurs) ③ `npm audit --omit=dev` à 0 (dépendances livrées aux visiteurs ; les alertes des seuls outils de développement sans correctif publié sont suivies dans la ROADMAP, décision de Nicolas du 2026-10-07), et chaque nouvelle dépendance passe par `supply-chain-risk-auditor` avec une justification écrite |
| Résultat attendu | 0 trouvaille, 0 vulnérabilité, chaque nouvelle dépendance justifiée |
| Si c'est rouge | Bloquant : rien n'est envoyé |
| Preuve | Résultats dans le rapport, noms des variables uniquement |

**F5 — Envoi sur GitHub et mise en ligne**
| Rubrique | Contenu |
|---|---|
| Règle | Rien n'entre dans la version principale sans CI GitHub au vert **et** accord de Nicolas. La mise en ligne (branche `production`, publiée par Netlify) n'a lieu qu'en fin de lot, avec le même accord (PRD 6.1) |
| Contrôle | ① commits propres (`git-workflow-and-versioning`) ② envoi de la branche et ouverture d'une demande de fusion ③ CI GitHub qui rejoue tous les contrôles ④ aperçu privé Netlify, lien transmis à Nicolas ⑤ fusion uniquement sur son « oui » ⑥ en fin de lot seulement : mise en ligne sur un second « oui », la branche `production` étant avancée (sans fusion ni réécriture) jusqu'à un commit de la version principale déjà validé par la CI |
| Résultat attendu | CI au vert, aperçu consultable, fusion validée |
| Si c'est rouge | CI en échec : correction sur la branche. Pas d'accord : rien n'est fusionné ni mis en ligne, la branche attend |
| Preuve | Liens de la demande de fusion et de l'aperçu, résultat de la CI dans le rapport |

**F6 — Mémoire de la session**
| Rubrique | Contenu |
|---|---|
| Règle | La session suivante doit pouvoir repartir uniquement à partir des documents |
| Contrôle | ① rapport `docs/checklist/sessions/AAAA-MM-JJ.md` : résumé D1, objectif D2, travail fait, résultat de chaque point de la checklist, décisions, retours de relecture et leur issue, prochaine étape ② une ligne ajoutée à `docs/checklist/historique.md` (feux, contrôles faits, points importants), roadmap mise à jour ③ registre des dettes mis à jour ④ aucune information sensible dans le rapport (dépôt public) ⑤ contrôle d'alignement des documents : tout changement est répercuté partout ⑥ `/archive` vers KIT-MEMOIRE |
| Résultat attendu | Rapport, historique, roadmap et dettes à jour, archive faite |
| Si c'est rouge | La session n'est pas close tant que ces documents ne sont pas à jour |
| Preuve | Le rapport lui-même et la confirmation de l'archive |

**Bilan de fin** : résultat de F1 à F6 affiché. La session n'est **close** que si les 6 sont au vert. Sinon, ce qui manque est indiqué.

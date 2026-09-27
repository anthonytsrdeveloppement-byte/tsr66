# Checklist de démarrage — D1 à D7

> Fiches validées par Nicolas (PRD 2.3). Modifiées seulement sur sa décision.
> Chaque fiche : **règle**, **contrôle**, **résultat attendu**, **si c'est rouge**, **preuve**. Chaque contrôle repose sur une commande réelle dont le résultat est montré.

**D1 — Reprendre le contexte**
| Rubrique | Contenu |
|---|---|
| Règle | Avant toute action, lire le PRD, la roadmap, l'historique et le dernier rapport de session (`docs/checklist/`) et le registre des dettes (`docs/DETTES.md`) |
| Contrôle | Contrôle d'alignement automatique des documents (carte 2.1), puis résumé en 5 lignes : où on en est, dernière session, points ouverts, prochaine étape, dettes ouvertes (nombre et échéances) |
| Résultat attendu | Résumé affiché, confirmé par Nicolas |
| Si c'est rouge | Document manquant ou contradiction entre PRD, roadmap et rapport : arrêt, on corrige le document d'abord |
| Preuve | Résumé recopié en tête du nouveau rapport de session |

**D2 — Fixer l'objectif de la session**
| Rubrique | Contenu |
|---|---|
| Règle | Une seule étape par session, tirée de la roadmap, formulée en une phrase avec un critère de fin clair |
| Contrôle | Claude annonce l'objectif, ce qui est hors session et « terminé quand… » |
| Résultat attendu | Nicolas valide explicitement avant tout travail |
| Si c'est rouge | Objectif flou ou mélangeant plusieurs étapes : on découpe. Choix difficile : `llm-council` |
| Preuve | Objectif, hors session et critère de fin écrits dans le rapport de session |

**D3 — Partir d'un code propre**
| Rubrique | Contenu |
|---|---|
| Règle | Version principale à jour avec GitHub, aucune modification en suspens, branche dédiée à la session (`session/AAAA-MM-JJ-objectif`) |
| Contrôle | Commandes git (récupération de l'état GitHub, état local, comparaison, création de la branche) selon `git-workflow-and-versioning` |
| Résultat attendu | « Rien en suspens, à jour avec GitHub », branche créée |
| Si c'est rouge | Modifications en suspens : présentées à Nicolas, décision ensemble, jamais de suppression sans son accord. Décalage avec GitHub : resynchronisation d'abord |
| Preuve | Résultat de la vérification et nom de la branche dans le rapport |

**D4 — Des outils identiques**
| Rubrique | Contenu |
|---|---|
| Règle | Version de Node fixée par le projet, dépendances réinstallées à l'identique du fichier de verrouillage, sans mise à jour silencieuse |
| Contrôle | Comparaison de la version de Node, réinstallation exacte (`npm ci`), aucun script d'installation non approuvé |
| Résultat attendu | Bonne version de Node, installation réussie, aucun nouveau script d'installation à approuver |
| Si c'est rouge | Mauvaise version de Node : bascule sur la bonne. Nouveau script d'installation : arrêt, présenté à Nicolas, autorisé seulement après relecture |
| Preuve | Versions et résultat de l'installation dans le rapport |

**D5 — Aucune faille connue au départ**
| Rubrique | Contenu |
|---|---|
| Règle | Zéro vulnérabilité et zéro alerte ouverte, tous niveaux confondus |
| Contrôle | ① `npm audit` ② alertes GitHub (Dependabot, CodeQL, secrets) ③ alertes Aikido (`aikido:issues`) et Semgrep ④ si les dépendances ont changé depuis la dernière session : `supply-chain-risk-auditor` |
| Résultat attendu | 0 partout |
| Si c'est rouge | La correction devient l'objectif de la session. Correctif réel uniquement (mise à jour, remplacement), jamais de faille « acceptée et documentée » |
| Preuve | Résultats des quatre contrôles dans le rapport |

**D6 — Les secrets**
| Rubrique | Contenu |
|---|---|
| Règle | Un secret ne vit que dans `.env.local` (ignoré par git) et dans les réglages sécurisés de Netlify. Jamais dans le code, l'historique git ni les pages publiées. Aucune variable `NEXT_PUBLIC_` (visible par le navigateur) n'est secrète |
| Contrôle | ① gitleaks sur tout l'historique et les fichiers en cours ② aucun fichier `.env` suivi par git ③ contrôle avant commit actif (`setup-pre-commit`) ④ blocage d'envoi GitHub activé (`secret-scanning`) ⑤ relecture des variables `NEXT_PUBLIC_` ⑥ scans secrets Aikido et Semgrep |
| Résultat attendu | 0 trouvaille, toutes les protections actives |
| Si c'est rouge | Arrêt immédiat, rien n'est envoyé. Secret considéré comme volé : changé chez le fournisseur, puis historique nettoyé. Incident noté dans le rapport, sans la valeur |
| Preuve | Résultats dans le rapport, jamais la valeur d'un secret |

**D7 — Le site fonctionne avant de commencer**
| Rubrique | Contenu |
|---|---|
| Règle | On ne construit jamais sur une base cassée |
| Contrôle | Suite complète : mise en forme, qualité du code, types, compilation, tests automatiques (méthode `verification-before-completion`) |
| Résultat attendu | Tout au vert |
| Si c'est rouge | La réparation devient l'objectif de la session, cause trouvée avant correction (`systematic-debugging`) |
| Preuve | Résultat de chaque vérification dans le rapport |

**Bilan du démarrage** : résultat de D1 à D7 affiché. **Feu vert** seulement si les 7 sont au vert. Sinon, **feu rouge** avec le point en cause et une proposition de correction.

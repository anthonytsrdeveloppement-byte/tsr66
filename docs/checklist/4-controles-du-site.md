# Registre des contrôles du site

> Chaque exigence du PRD devient un contrôle. Un contrôle est **activé** dès que la fonction qu'il vérifie existe. Il est ensuite rejoué **à chaque session (F1)** et, s'il est automatique, **par la CI GitHub à chaque envoi**. Un contrôle actif n'est jamais retiré sans décision de Nicolas.
> Tenu par Claude à partir du PRD : une exigence ajoutée au PRD entraîne un contrôle ajouté ici.
> **Type** : 🤖 automatique (test, CI) · 👁 vérification manuelle avec preuve. **État** : ⬜ à activer · ✅ actif et au vert · 🔴 en échec.
> À la demande : « contrôle le point C23 ».

## Lot 0 — Fondations et contrôle
| N° | Ce qu'on contrôle | PRD | Type | État | Dernière vérification |
|---|---|---|---|---|---|
| C01 | Aucun secret dans le code, l'historique git ni les fichiers produits pour le site | D6, F4 | 🤖 | ✅ | 2026-09-28 (rattrapage) : 3 barrières. ① Avant commit : gitleaks par fichier, plus tout le contenu du commit sans exclusion par nom de fichier. ② Avant envoi (`pre-push`) : chaque commit envoyé, y compris ceux faits par `cherry-pick` ou `rebase` et les résolutions de fusion. ③ CI : tout l'historique, fusions comprises, sans exclusion par nom. Configuration vérifiée par un jeton témoin. Testé : secrets cachés dans `bootstrap-analytics.js`, SVG, `yarn.lock`, fichier « binaire », fusion, `cherry-pick`, configuration vidée → tous refusés. 2026-09-28 (Netlify) : ④ CI, fichiers publiés (`.next/static`, pages HTML et données `.next/server/app`, `public/`) scannés sans exclusion par nom, échec si rien n'est lu ; faux jeton dans une page HTML détecté. Netlify ajoute son propre détecteur |
| C02 | `client/` et les fichiers `.env` ne sont jamais suivis par git | 2.1, D6 | 🤖 | ✅ | 2026-09-28 (clôture) : aucun fichier suivi |
| C03 | Dépendances : 0 vulnérabilité, versions exactes, scripts d'installation bloqués, signatures du registre vérifiées | D5, F4 | 🤖 | ✅ | 2026-09-28 (clôture, React 19.3.0) : `npm audit` 0, 351/351 signatures, audit chaîne d'approvisionnement 0 faille (11 directes, 392 indirectes) |
| C04 | Aucune fusion dans la version principale sans CI au vert | F5 | 🤖 | ✅ | 2026-09-28 : 5 contrôles obligatoires (Qualité, Secrets, Dépendances, Analyse CodeQL, CodeQL), même pour l'administrateur ; demande de fusion de test avec un contrôle en échec bloquée. Seules les actions publiées par GitHub, figées par empreinte, sont autorisées. Risque résiduel : une demande de fusion peut modifier sa propre CI, donc toute demande qui touche les fichiers de contrôle (`.github/`, `.githooks/`, `.gitleaks.toml`, `.npmrc`, `.claude/settings.json`, `package.json`, `.lintstagedrc.mjs`, `.prettierignore`, `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `netlify.toml`, `scripts/`) est signalée en clair à Nicolas. 2026-09-28 : nouvelle occurrence relevée par la revue sécurité, `next.config.ts` (code de la demande) s'exécute pendant la compilation avant les contrôles C01/C05/C06 du même travail ; parade possible : compiler et scanner dans deux travaux séparés (décision de Nicolas). Une relecture obligatoire (CODEOWNERS) est impossible : GitHub interdit d'approuver sa propre demande, et Nicolas est le seul relecteur |
| C05 | Aperçus privés et adresse de travail Netlify interdits aux moteurs de recherche | 4.2 | 🤖 | ✅ | 2026-09-28 : `scripts/verifier-entetes.mjs` en CI (5 cas d'indexation, pages et fichiers) ; sur `tsr66.netlify.app` (ouvert 2 min) : `noindex, nofollow` partout. Projet Netlify privé par défaut (401 aux visiteurs) |
| C06 | En-têtes de sécurité : seul le code de TSR66 s'exécute, le site ne peut pas être intégré dans une autre page, HTTPS forcé | 6.3 | 🤖 | ✅ | 2026-09-28 : pages (`next.config.ts`) et fichiers servis par Netlify (`netlify.toml`, valeurs identiques vérifiées) ; CI + contrôle réel sur `tsr66.netlify.app` : 0 écart, `http` → `https`. Réserve acceptée par Nicolas : `'unsafe-inline'` pour les scripts de page (pages préparées à l'avance, vitesse) ; tout script d'un autre site est bloqué. Contrôle réel sur Netlify à refaire en fin de lot |
| C07 | Documents alignés sur le PRD | 2.1 | 🤖 | ⬜ | — |
| C09 | Verrous en place : commandes dangereuses refusées par Claude Code, branche principale protégée, identité git masquée **y compris dans les commits de fusion de GitHub** (`git log origin/main --format='%ae%n%ce'` ne contient que des adresses `noreply`, sauf les 5 commits antérieurs au 2026-09-28), crochets actifs et exécutables, la CI restant le vrai rempart | 2.1 | 🤖 | ✅ | 2026-09-28 (rattrapage) : écart trouvé, l'adresse du compte figurait dans 5 commits de fusion. Corrigé pour la suite : réglage GitHub « adresse privée » (👤) et fusions avec l'adresse masquée ; historique laissé tel quel (déjà copié par GitHub). Crochets actifs, vérification de leur mode exécutable en CI. Risque résiduel : certaines écritures rares de commande échappent aux règles de Claude Code |
| C08 | Skills installés identiques à la version relue : empreintes conformes à `skills-lock.json` | 2.1 | 🤖 | ✅ | 2026-09-28 (clôture) : 125/125 fichiers conformes |

## Lot 1 — Design et animations
| N° | Ce qu'on contrôle | PRD | Type | État | Dernière vérification |
|---|---|---|---|---|---|
| C10 | Affichage en moins de 2,5 s sur mobile, aucun décalage de mise en page, réaction immédiate aux clics | 5.4 | 🤖 | ⬜ | — |
| C11 | Titre et bouton de devis visibles tout de suite, sans attendre les animations | 5.4 | 🤖 | ⬜ | — |
| C12 | Tout le texte est lisible sans JavaScript | 4.2, 5.4 | 🤖 | ⬜ | — |
| C13 | Si l'appareil demande moins d'animations, de simples fondus les remplacent | 5.4 | 🤖 | ⬜ | — |
| C14 | Sur mobile : effets allégés, vidéos lancées seulement quand elles sont visibles | 5.4 | 🤖 | ⬜ | — |
| C15 | Pages publiques : aucune ressource chargée depuis un autre site, aucun cookie, aucun traceur | 5.3, 6.2 | 🤖 | ⬜ | — |
| C16 | Accessibilité WCAG 2.2 AA : 0 défaut grave ou critique | 6.4 | 🤖 | ⬜ | — |
| C17 | Rouge TSR66 réservé aux boutons de conversion | 5.1 | 👁 | ⬜ | — |

## Lot 2 — Espace Anthony
| N° | Ce qu'on contrôle | PRD | Type | État | Dernière vérification |
|---|---|---|---|---|---|
| C20 | Sanity hébergé en Europe, sinon transfert couvert par les clauses contractuelles européennes | 6.2 | 👁 | ⬜ | — |
| C21 | `tsr66.fr/espace` invisible pour Google : interdit aux moteurs, absent du sitemap, aucun lien depuis le site public | 3.2 | 🤖 | ⬜ | — |
| C22 | Espace réservé aux adresses autorisées : une adresse non autorisée est refusée | 3.2, 6.3 | 👁 | ⬜ | — |
| C23 | Photos envoyées : données GPS supprimées, format et taille contrôlés | 6.2 | 🤖 | ⬜ | — |
| C24 | Sanity ne reçoit que des photos et des textes publics, jamais de donnée de prospect | 6.2 | 👁 | ⬜ | — |

## Lot 3 — Pages publiques, SEO et GEO
| N° | Ce qu'on contrôle | PRD | Type | État | Dernière vérification |
|---|---|---|---|---|---|
| C30 | Chaque page : titre et description uniques, un seul titre principal, URL courte en français | 4.2 | 🤖 | ⬜ | — |
| C31 | Données structurées valides : entreprise locale, services, fil d'Ariane, questions fréquentes, réalisations | 4.2 | 🤖 | ⬜ | — |
| C32 | Nom, adresse et téléphone identiques partout sur le site, et identiques à la fiche Google | 1.6, 4.3 | 🤖 | ⬜ | — |
| C33 | Jamais de plan d'accès ni de photo du domicile ; mention « intervient sur place, pas d'accueil au dépôt » | 1.6 | 👁 | ⬜ | — |
| C34 | Boutons « Appeler » et « Devis gratuit » toujours visibles (en-tête sur ordinateur, barre fixe sur mobile), même style et même texte partout | 3.1 | 🤖 | ⬜ | — |
| C35 | Chaque page service : bouton devis en haut, réalisations du service, questions fréquentes | 3.2, 4.3 | 👁 | ⬜ | — |
| C36 | Sitemap à jour automatiquement, sans l'Espace ni les pages non publiées | 3.2, 4.2 | 🤖 | ⬜ | — |
| C37 | Robots des IA autorisés, `llms.txt` présent et à jour | 4.1, 4.2 | 🤖 | ⬜ | — |
| C38 | Pages ville publiées seulement avec de vrais chantiers dans la commune | 4.3 | 👁 | ⬜ | — |
| C39 | Aucun fait inventé : tout fait non confirmé est marqué « à confirmer », et plus aucun « à confirmer » à la mise en ligne | 4.1 | 🤖 | ⬜ | — |
| C40 | Mentions légales (« Anthony Moreau EI – TSR66 », adresse, SIRET, TVA, directeur de la publication, hébergeur, médiateur s'il est fourni) et politique de confidentialité complètes | 6.4, 6.5 | 👁 | ⬜ | — |

## Lot 4 — Conversion et e-mails
| N° | Ce qu'on contrôle | PRD | Type | État | Dernière vérification |
|---|---|---|---|---|---|
| C50 | Devis : e-mail de confirmation au prospect et e-mail « nouvelle demande » à Anthony, bien reçus | 3.4, 3.5 | 🤖 | ⬜ | — |
| C51 | Bouton de rappel : texte juste selon l'heure de Paris, les horaires, les jours fériés et l'interrupteur « indisponible », jamais de promesse intenable | 3.4 | 🤖 | ⬜ | — |
| C52 | Rappel : échéance recalculée par le serveur, même heure à l'écran et dans l'e-mail d'Anthony | 3.4 | 🤖 | ⬜ | — |
| C53 | Sans JavaScript, le bouton affiche « Être rappelé rapidement » | 3.4 | 🤖 | ⬜ | — |
| C54 | Anti-spam invisible : champ piège, délai minimum, limite d'envois, vérification du téléphone, sans captcha | 6.3 | 🤖 | ⬜ | — |
| C55 | Le site ne garde aucune donnée personnelle : seul le compteur anonyme est stocké | 6.2 | 🤖 | ⬜ | — |
| C56 | Compteur anonyme : devis, rappels et clics sur « Appeler », côté serveur, sans cookie | 4.1, 6.2 | 🤖 | ⬜ | — |
| C57 | E-mails envoyés depuis `…@tsr66.fr`, « répondre à » vers le Gmail d'Anthony, modèles aux couleurs de TSR66 | 3.5, 4.1 | 👁 | ⬜ | — |
| C58 | Demande d'avis : envoyée à tous les clients, sans tri ni contrepartie, e-mail du client jamais enregistré | 3.5, 6.2 | 👁 | ⬜ | — |
| C59 | Clés Resend et Sanity uniquement dans les réglages de Netlify | 6.3 | 🤖 | ⬜ | — |

## Lot 5 — Mise en ligne
| N° | Ce qu'on contrôle | PRD | Type | État | Dernière vérification |
|---|---|---|---|---|---|
| C60 | Seul tsr66.fr est indexable | 4.2 | 🤖 | ⬜ | À traiter au branchement du domaine (relectures du 2026-09-28) : la règle de `next.config.ts` est calculée à la compilation, donc les adresses permanentes `<id>--tsr66.netlify.app` recevraient la même version sans `noindex` → condition sur l'adresse visitée ou redirection vers tsr66.fr ; `netlify.toml` met `noindex` sans condition sur les fichiers (photos exclues de Google Images) ; HSTS `includeSubDomains` à valider ; le script vérifie déjà l'absence de `noindex` sur tsr66.fr |
| C61 | Bing prévenu à chaque publication (IndexNow) | 3.2, 4.2 | 🤖 | ⬜ | — |
| C62 | Google Search Console et Bing Webmaster Tools reliés au site | 4.1 | 👁 | ⬜ | — |

# Roadmap — TSR66

> Déduite du PRD (`docs/PRD.md`), qui fait foi. Lue au démarrage (D1), mise à jour en fin de session (F6).
> Légende : ✅ fait · 🔄 en cours · ⬜ à faire · 👤 action de Nicolas ou du client
> Principe d'ordre : chaque lot n'utilise que ce que les lots précédents ont produit.

## Où on en est
- ✅ PRD complet et validé (2026-09-27)
- ✅ Arborescence, documents et roadmap alignés sur le PRD (2026-09-27)
- ✅ Dossier `docs/checklist/` : fiches, registre des contrôles du site, historique (2026-09-27)
- ✅ **Lot 0 clos** (#17 fusionnée le 2026-09-30, `production` reste à 4384cda : une mise en ligne par lot)
- ➡️ **Lot 1** : tests automatiques des contrôles faits et fusionnés (#18, #19) ; **maquette d'accueil validée par Nicolas le 2026-10-07** (v67, `client/maquettes/accueil-v16`) ; **prochaines étapes : les autres maquettes** (page service, page devis, réalisations, L'entreprise, Espace Anthony) ; 4 dettes 🟡 de tests à solder avant la fin du lot (`docs/DETTES.md`) ; achat de tsr66.fr toujours attendu (👤)
- 🟡 **Suivi des dépendances (décision de Nicolas du 2026-10-07)** : le contrôle bloquant de la CI porte sur ce qui est livré aux visiteurs (`npm audit --omit=dev`). `braces` 3.0.3, utilisé seulement par les outils de développement (chaîne `eslint-config-next`), n'a aucune version corrigée publiée : à revérifier à chaque session (`npm audit`) et à mettre à jour dès qu'un correctif sort, puis remettre le contrôle strict. `source-map-js` corrigé le 2026-10-07 (1.2.2)
- ✅ **Next.js 16.3.8 (2026-10-08)** : corrige 7 avis de sécurité de la 16.3.6 ; la 16.4.0 est écartée pour l'instant (publiée le 2026-10-06, changements incompatibles) ; à réévaluer avec les versions majeures en fin de lot
- ⬜ Avant la mise en ligne (Lot 5) : `netlify.toml` déclare `.next` comme dossier de publication ; vérifier ce que Netlify en publie (gitleaks y repère des identifiants fabriqués par Next.js à chaque compilation, non secrets)
- ⏸ Branche `session/2026-10-08-next-16-3-8` : 1 commit local (`e9ea568`) + documents de session, rien envoyé (F5 attend le « oui » de Nicolas et la CI)
## Lot 0 — Fondations et contrôle
**Objectif** : la checklist D1 à D7 et F1 à F6 fonctionne entièrement, sur un site encore vide.
**Actions 👤, à faire en premier, car tout en dépend :**
- 👤 **Achat de tsr66.fr au nom du client** (urgent, PRD 7.2). Il faut le domaine pour Resend (Lot 4) et pour la mise en ligne (Lot 5), et plus il existe tôt, mieux c'est pour Google.
- ✅ 👤 Adresse dédiée, puis comptes GitHub, Netlify, Resend et Sanity créés (2026-09-27, projet Sanity « tsr66 ») · sans double authentification, décision de Nicolas (PRD 7.1)
- ✅ 👤 Connexion de GitHub sur l'ordinateur (`gh auth login`, compte du projet) et installation des plugins `pr-review-toolkit` et `claude-security` (2026-09-27, au niveau du projet ; réinstallés au niveau « user » le 2026-09-29, seul moyen de les charger dans VS Code)

**Travail de Claude :**
- ✅ Installation des skills retenus : 17 dossiers, 125 fichiers lus en entier par Claude et par deux agents indépendants, aucun rejet, figés et vérifiés par empreintes (2026-09-27, PRD 2.1)
- ✅ Dépôt git public créé et protégé : détection et blocage des secrets, alertes de dépendances, branche principale protégée, verrous Claude Code (2026-09-27)
- ✅ Installation de Next.js 16.3.6 : squelette minimal, Node 24 fixé, versions exactes, scripts d'installation bloqués, télémétrie désactivée, 0 vulnérabilité (2026-09-27)
- ✅ Contrôle avant commit (D6) : secrets (gitleaks), mise en forme (Prettier), qualité du code (ESLint) et types, sur le contenu exact de chaque commit. Testé : faux secret (et 5 astuces de contournement), code incorrect et erreur de type refusés, mise en forme corrigée automatiquement (2026-09-27)
- ✅ 👤 Contrôle avant commit activé sur l'ordinateur par Nicolas (`npm run hooks:install`, 2026-09-28). Claude Code n'a pas le droit de toucher à ce réglage
- ✅ CI GitHub : qualité (mise en forme, code, types, compilation), secrets (tout l'historique, SVG et `package-lock.json` compris), dépendances (0 faille, signatures), CodeQL ; télémétrie Next.js désactivée ; les 5 contrôles sont obligatoires avant toute fusion, même pour l'administrateur ; blocage prouvé par une demande de fusion de test ; Dependabot chaque lundi, délai de 7 jours (2026-09-28)
- ✅ Réévaluation de fin de lot (2026-09-29) : TypeScript 6.0.3 adopté (pris en charge par la configuration ESLint de Next.js, tout au vert) ; TypeScript 7 et ESLint 10 toujours écartés. ESLint 9 n'est plus maintenu par ses auteurs : outil de contrôle, jamais envoyé sur le site, à remplacer dès que Next.js accepte ESLint 10
- ✅ Tri des 4 premières propositions de Dependabot : React 19.3.0 accepté (testé, audité) ; TypeScript 7, ESLint 10 et types de Node 26 refusés, avec une règle pour ne plus les reproposer (2026-09-28)
- ✅ Rattrapage des contrôles oubliés à la clôture (2026-09-28) : Semgrep, Aikido, relecteurs `pr-review-toolkit`, relecture sécurité avec les grilles du projet. Trous corrigés : secrets cachés derrière certains noms de fichiers, fusions, `cherry-pick`, configuration vidée, adresse e-mail dans les fusions. Délai de 7 jours imposé par npm ; signalement privé des failles activé
- ⬜ Avant les premiers secrets (Lot 4) : empêcher Claude Code de lire `.env.local` par une commande (bac à sable de Claude Code ou règle dédiée)
- ⬜ 👤 Avant les premiers secrets (Lot 4) : dans Netlify, aperçus des demandes venant d'un fork désactivés ou soumis à approbation, clés marquées « secret » et limitées à la production (revue sécurité du 2026-09-28)
- ✅ Tests automatiques des contrôles : fait au Lot 1 (voir ci-dessous)
- ✅ 👤 Liaison Netlify faite par Nicolas (projet `tsr66`, accès limité au dépôt `tsr66`, projet privé) ; `netlify.toml` (`npm ci`, Node 24.21.0, npm 11.19.0, télémétrie coupée, module Netlify figé en 5.16.0) ; aperçus et adresse de travail **non indexables** (`noindex` sur pages et fichiers), en-têtes de sécurité ; C05, C06 actifs ; secrets des fichiers publiés scannés en CI (2026-09-28)
- ✅ Contrôle d'alignement des documents automatisé, dans le dépôt (`scripts/verifier-alignement.mjs`) : utilisé en D1 et F6, et rejoué par la CI à chaque envoi avec les empreintes des skills ; testé sur des documents abîmés exprès (2026-09-28, PRD 2.1)
- ✅ Mise en ligne séparée des fusions (2026-09-29) : chaque mise en ligne coûte 15 crédits Netlify sur 300 par mois (60 déjà consommés par 4 fusions). Branche `production` créée et protégée sur GitHub (4 contrôles de la CI obligatoires, ni suppression ni envoi forcé, même pour l'administrateur), garde de compilation qui refuse tout commit absent de la version principale (`scripts/garde-production.mjs`, vérifiée par C04) ; 👤 Netlify ne publie plus que `production`, `main` garde ses aperçus gratuits
- ✅ Contrôles C01 à C09 du registre activés (`docs/checklist/4-controles-du-site.md`, 2026-09-28)
- ✅ Fin du Lot 0 (2026-09-29) : L1 à L5 au vert ; L3 et F2 ② faits avec les vrais plugins (`claude-security` : 0 faille ; `pr-review-toolkit` : contrôles durcis et testés) ; contrôle réel C05/C06 ; formules gratuites relevées
- ✅ Premier passage complet de la checklist, avec tous les contrôles C01 à C09 actifs : D1 à D7, F1 à F6, rapport et ligne d'historique (2026-09-28, session C07)

**En parallèle, côté client 👤** : horaires d'ouverture, premières photos et vidéos déposées dans `client/`.

## Lot 1 — Design et animations
**Objectif** : la direction visuelle est choisie et les 14 effets tournent sans ralentir le site.
**Utilise** : Next.js (Lot 0), le logo (captures suffisantes).
- ✅ Tests automatiques des contrôles (2026-09-30, #18) : 220 tests `node:test` sans dépendance (garde, en-têtes et `netlify.toml`, alignement, crochets, étapes de la CI), exigés par la CI (travail « Qualité ») ; faille du témoin gitleaks trouvée et corrigée ; 18 affaiblissements volontaires des contrôles pour vérifier les tests
- ⬜ 2 ou 3 maquettes avec le vrai logo TSR66 → 👤 choix de Nicolas (PRD 5.1)
  - ✅ **Accueil** : maquette animée v66 (`client/maquettes/accueil-v16`), validée par Nicolas le 2026-10-07 ; restent à confirmer avec le client : vrais chiffres, vraies photos et vidéos, communes, licences, identifiant de la fiche Google
  - 🔄 **Page service** (une maquette, modèle des 7 pages) : version 4 en relecture par Nicolas (`client/maquettes/service-v4`, textes développés pour le référencement ; la version 3 est conservée) ; pages Assainissement et Viabilisation / VRD montrées pour juger la variété (`service-assainissement`, `service-vrd`), textes encore courts ; premier écran clair, prestations, chantiers avant/après, « Pourquoi nous », autres services, questions, devis (la méthode reste sur l'accueil seulement : décision de Nicolas du 2026-10-09). Reste à valider, puis alignement du PRD 3.2 sur la maquette
  - ✅ **Référencement des textes** (2026-10-09) : recherche dans la documentation de Google et les règles du métier, règles écrites dans le PRD 4.1 et 4.3 ; page Terrassement développée (introduction, prestations, « Avant le premier coup de pelle », chantiers types, 9 questions) ; **accueil v71** : titre et description, titres de sections descriptifs, introduction dans le paragraphe de la zone ; la section des 7 services testée en v70 est retirée (trop chargée, décision de Nicolas) ; les 7 pages restent reliées par le menu. À faire : développer les textes des six autres services avec les mots d'Anthony, relire chaque fait réglementaire avant la mise en ligne
  - ✅ **Les sept pages service maquettées** (2026-10-10, version 5) : Terrassement (`service-v4`), Assainissement, Viabilisation / VRD, Travaux forestiers, Aménagement extérieur, Démolition, Enrochement / murs (`client/maquettes/service-*`), avec textes développés, bloc propre à chaque service, cas fréquents, questions et liens vers les sources officielles ; menu et tuiles reliés. Reste : validation par Nicolas du modèle, relecture des faits réglementaires avec le client, vrais chantiers et photos
  - ✅ **Pictogrammes des cartes « Pourquoi nous »** : **validés par Nicolas le 2026-10-09**, jeu « pleins et anguleux » (personne casquée, devis validé, repère de lieu, dessinés pour TSR66), appliqué aux trois pages service, écrit dans le PRD 5.1
  - ⬜ **Page devis** (`/devis`, même formulaire en 3 étapes que l'accueil, petite page)
  - ⬜ **Page Contact** (`/contact`, décidée par Nicolas le 2026-10-09 : une question sans devis ; formulaire simple, numéro, adresse complète, horaires, zone, rappel, lien vers le devis) avec **le logo en arrière-plan** (demande de Nicolas du 2026-10-09, confirmée)
  - ⬜ **Page réalisations**, puis **page L'entreprise**
  - ⬜ **Espace Anthony** (portail privé pour téléphone), maquette à part
  - Éléments communs déjà faits et à reprendre tels quels : en-tête avec le menu commun (v69), barre « Appeler / Devis gratuit » du bas, formulaire de devis centré avec logo, mode sans animations, règles de rédaction (PRD 4.1), images 16/9 sans zoom
- ⬜ Charte appliquée : clair dominant, sections noires, rouge réservé aux boutons
- ⬜ Les 14 effets sur une page de démonstration (PRD 5.3)
- ⬜ Seuils de performance respectés sur mobile (PRD 5.4)
- ⬜ Après les maquettes, avant la fin du lot : solder les 4 dettes 🟡 des tests (`docs/DETTES.md`)

### Décisions attendues de Nicolas (écarts entre le PRD et la maquette d'accueil validée, 2026-10-07)
- ✅ Menu commun à toutes les pages : **validé par Nicolas le 2026-10-09**, appliqué à la maquette d'accueil (v69) et à la page service, écrit dans le PRD 3.1 (pas de lien « Avis », choix de Nicolas). Le bouton d'en-tête dit « Appeler » avec le numéro (décision de Nicolas du 2026-10-09).
- 5.1 : le premier écran est un ciel bleu avec engin détouré (le PRD dit « sections noires : premier écran ») et le rouge sert aussi à des accents d'interface (mot sélectionnable, pastilles) ; adapter le PRD ou la maquette (contrôle C17).
- ✅ 3.1 et 3.4 : réglé le 2026-10-09 : le bouton d'en-tête dit « Appeler » + numéro, comme la barre mobile et la section finale (contrôle C34).
- 5.3 effet 1 et 5.4 : l'écran d'entrée de la maquette dure au moins 4 s, une fois par session ; le PRD dit moins d'une seconde et « le premier écran n'attend jamais les animations ».
- 5.4 : « réduire les animations » : la maquette coupe tout (page statique) au lieu de « simples fondus » ; le choix par l'onglet Accessibilité est conservé en plus (contrôle C13).
- Textes de la maquette à confirmer avec le client : « avec nos propres engins », « nous restons joignables », visite sur place avant devis, mots du grand défilant (noms abrégés « Forestier »…).

### Reprise en production de l'accueil (retours de relecture F2/F3 du 2026-10-07)
Corrigés dans la maquette v68 : menu mobile, boîte de dialogue du devis, pause du mot qui change, texte lisible sans JavaScript, textes lus par les lecteurs d'écran, cinq niveaux d'avis, lien d'évitement, typographie, vocabulaire. Reste à faire au moment de construire le vrai site :
- Hébergement local obligatoire : polices Plus Jakarta Sans et GSAP, ScrollTrigger, SplitText, Lenis installés en versions exactes (npm), plus aucun appel à Google Fonts ni jsDelivr (PRD 6.2, C15).
- Écran d'entrée : durée à décider par Nicolas (4 s dans la maquette, moins d'une seconde dans le PRD).
- Détourage du premier écran et de la pelleteuse précalculé en image (aujourd'hui calculé au chargement).
- Retirer le code de test (`#dbg`, `#sim`, `#probe`, `#ui`, `#layer`) et le bandeau « Maquette version N ».
- Boutons d'avis inactifs sans identifiant de fiche Google ; ouvrir les liens vers la vraie fiche.

## Lot 2 — Espace Anthony (bases)
**Objectif** : Anthony publie une réalisation depuis son téléphone.
**Utilise** : compte Sanity (Lot 0), charte (Lot 1).
- ⬜ Sanity : hébergement en Europe vérifié (PRD 6.2)
- ⬜ Portail `tsr66.fr/espace` aux couleurs de TSR66, connexion Google, adresses autorisées (PRD 3.2) ; vérifier que `Cross-Origin-Opener-Policy: same-origin` ne gêne pas la connexion Google, et un `noindex` propre à `/espace`
- ⬜ Réalisations et photos (GPS supprimé, format et taille contrôlés), horaires, interrupteur « indisponible »
- ⬜ Note Google et avis affichés, modifiables par le client : saisie de la note, du nombre d'avis, de la répartition par étoiles et des avis choisis, avec refus des valeurs incohérentes (PRD 3.6)

## Lot 3 — Pages publiques, SEO et GEO
**Objectif** : le site complet est consultable en aperçu privé.
**Utilise** : charte et effets (Lot 1), réalisations et horaires (Lot 2).
- ⬜ Accueil en landing page, 7 pages service, Réalisations, L'entreprise, Contact, Mentions légales, Confidentialité, Plan du site. Les pages Devis et Contact sont mises en place, et leurs formulaires arrivent au Lot 4. (PRD 3.2 et 3.3)
- ⬜ Section avis de l'accueil : étoiles et barres calculées à partir de la note saisie, boutons « Laisser un avis » et « Voir tous les avis sur Google », rien affiché s'il n'y a aucun avis (PRD 3.6) → 👤 identifiant de la fiche Google du client
- ⬜ Rédaction de tous les textes, faits non confirmés marqués « à confirmer » (PRD 4.1) → 👤 relecture
- ⬜ Données structurées, sitemap automatique (mis à jour à chaque publication depuis l'Espace), robots des IA autorisés, `llms.txt` (PRD 4.2)
- ⬜ Audit SEO et GEO du site entier : `seo-audit`, `ai-seo`, `seo-local` (PRD 4.2)

## Lot 4 — Conversion et e-mails
**Objectif** : les trois portes de conversion, le message de contact et la demande d'avis fonctionnent de bout en bout.
**Utilise** : domaine tsr66.fr (Lot 0), pages (Lot 3), horaires et indisponibilité (Lot 2).
- ⬜ tsr66.fr confirmé dans Resend (enregistrements DNS)
- ⬜ Formulaire de devis en 3 étapes, bouton « Rappel en moins de 30 min » (horaires, jours fériés, indisponibilité) (PRD 3.3 et 3.4)
- ⬜ Formulaire de la page Contact (nom, téléphone ou e-mail, message) et ses deux e-mails (PRD 3.2, 3.4 et 3.5)
- ⬜ Les 6 modèles d'e-mails aux couleurs de TSR66, dont la demande d'avis depuis l'Espace et les deux e-mails de la page Contact (PRD 3.5)
- ⬜ Protections anti-spam invisibles (devis, rappel, contact), compteur anonyme : devis, rappels, messages de contact, clics sur « Appeler » (PRD 6.3 et 4.1)
- ⬜ Fiche « Mon espace TSR66 » remise au client, toutes fonctions du portail en place (PRD 7.3)

## Lot 5 — Mise en ligne
**Objectif** : le site est en ligne sur tsr66.fr.
**Utilise** : tous les lots précédents.
- ⬜ tsr66.fr branché sur Netlify (branche `production`), seul domaine indexable, IndexNow actif (PRD 4.2) : voir les points notés au contrôle C60 (règle d'indexation selon l'adresse visitée, `noindex` des fichiers, HSTS `includeSubDomains`)
- ⬜ Google Search Console, Bing Webmaster Tools
- ⬜ Audit SEO et GEO final, scan approfondi `claude-security`, **zéro dette ouverte**, aucun contenu provisoire, textes validés
- ⬜ Mentions légales complètes (décennale et médiateur, s'ils sont fournis)
- ⬜ Consommation des formules gratuites vérifiée (PRD 6.1)
- ⬜ Plan d'action du référencement hors site remis (PRD 7.3)
- 👤 Décisions : statistiques de visites, et qui gère la fiche Google et les annuaires (PRD 4.4)

## À chaque fin de lot
- Mise en ligne (PRD 6.1, fiche F5 ⑥) : sur le « oui » de Nicolas, la branche `production` est avancée, sans fusion ni réécriture, jusqu'au dernier commit de la version principale validé par la CI ; la garde de compilation refuse tout autre commit
- Contrôle C05/C06 sur `tsr66.netlify.app` (mise en ligne) et `main--tsr66.netlify.app` (version principale), après la mise en ligne (projet ouvert 2 minutes avec l'accord de Nicolas)
- Réévaluer les versions majeures écartées dans `.github/dependabot.yml` (TypeScript, ESLint) : les adopter dès que la configuration de Next.js les prend en charge
- Checklist de fin de lot L1 à L7 (`docs/checklist/3-fin-de-lot.md`) : objectif démontré, contrôles du lot activés, scan `claude-security`, dettes échues, formules gratuites (PRD 6.1)

## Après la mise en ligne
- Guides « Conseils »
- Page Perpignan, dès qu'il y a de vrais chantiers sur place
- Suivi mensuel des indicateurs (PRD 1.5)

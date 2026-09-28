# Roadmap — TSR66

> Déduite du PRD (`docs/PRD.md`), qui fait foi. Lue au démarrage (D1), mise à jour en fin de session (F6).
> Légende : ✅ fait · 🔄 en cours · ⬜ à faire · 👤 action de Nicolas ou du client
> Principe d'ordre : chaque lot n'utilise que ce que les lots précédents ont produit.

## Où on en est
- ✅ PRD complet et validé (2026-09-27)
- ✅ Arborescence, documents et roadmap alignés sur le PRD (2026-09-27)
- ✅ Dossier `docs/checklist/` : fiches, registre des contrôles du site, historique (2026-09-27)
- ➡️ **En cours : Lot 0**, prochaine étape : la liaison Netlify

## Lot 0 — Fondations et contrôle
**Objectif** : la checklist D1 à D7 et F1 à F6 fonctionne entièrement, sur un site encore vide.
**Actions 👤, à faire en premier, car tout en dépend :**
- 👤 **Achat de tsr66.fr au nom du client** (urgent, PRD 7.2). Il faut le domaine pour Resend (Lot 4) et pour la mise en ligne (Lot 5), et plus il existe tôt, mieux c'est pour Google.
- ✅ 👤 Adresse dédiée, puis comptes GitHub, Netlify, Resend et Sanity créés (2026-09-27, projet Sanity « tsr66 ») · sans double authentification, décision de Nicolas (PRD 7.1)
- ✅ 👤 Connexion de GitHub sur l'ordinateur (`gh auth login`, compte du projet) et installation des plugins `pr-review-toolkit` et `claude-security` pour le projet (2026-09-27)

**Travail de Claude :**
- ✅ Installation des skills retenus : 17 dossiers, 125 fichiers lus en entier par Claude et par deux agents indépendants, aucun rejet, figés et vérifiés par empreintes (2026-09-27, PRD 2.1)
- ✅ Dépôt git public créé et protégé : détection et blocage des secrets, alertes de dépendances, branche principale protégée, verrous Claude Code (2026-09-27)
- ✅ Installation de Next.js 16.3.6 : squelette minimal, Node 24 fixé, versions exactes, scripts d'installation bloqués, télémétrie désactivée, 0 vulnérabilité (2026-09-27)
- ✅ Contrôle avant commit (D6) : secrets (gitleaks), mise en forme (Prettier), qualité du code (ESLint) et types, sur le contenu exact de chaque commit. Testé : faux secret (et 5 astuces de contournement), code incorrect et erreur de type refusés, mise en forme corrigée automatiquement (2026-09-27)
- ✅ 👤 Contrôle avant commit activé sur l'ordinateur par Nicolas (`npm run hooks:install`, 2026-09-28). Claude Code n'a pas le droit de toucher à ce réglage
- ✅ CI GitHub : qualité (mise en forme, code, types, compilation), secrets (tout l'historique, SVG et `package-lock.json` compris), dépendances (0 faille, signatures), CodeQL ; télémétrie Next.js désactivée ; les 5 contrôles sont obligatoires avant toute fusion, même pour l'administrateur ; blocage prouvé par une demande de fusion de test ; Dependabot chaque lundi, délai de 7 jours (2026-09-28)
- ✅ Tri des 4 premières propositions de Dependabot : React 19.3.0 accepté (testé, audité) ; TypeScript 7, ESLint 10 et types de Node 26 refusés, avec une règle pour ne plus les reproposer (2026-09-28)
- ✅ Rattrapage des contrôles oubliés à la clôture (2026-09-28) : Semgrep, Aikido, relecteurs `pr-review-toolkit`, relecture sécurité avec les grilles du projet. Trous corrigés : secrets cachés derrière certains noms de fichiers, fusions, `cherry-pick`, configuration vidée, adresse e-mail dans les fusions. Délai de 7 jours imposé par npm ; signalement privé des failles activé
- ⬜ Avant les premiers secrets (Lot 4) : empêcher Claude Code de lire `.env.local` par une commande (bac à sable de Claude Code ou règle dédiée)
- ⬜ Tests automatiques : à ajouter à la CI comme contrôle obligatoire dès le premier code qui en demande (Lot 1)
- ⬜ Liaison Netlify (`netlify-deploy`), aperçus privés **non indexables**, en-têtes de sécurité, Node 24 et télémétrie désactivée (PRD 4.2, 6.2 et 6.3)
- ⬜ Contrôle d'alignement des documents automatisé, utilisé en D1 et F6 (PRD 2.1)
- ⬜ Contrôles C01 à C07 du registre activés (C01, C02, C03, C08, C09 déjà actifs) (`docs/checklist/4-controles-du-site.md`)
- ⬜ Premier passage complet de la checklist, avec le premier rapport de session et la première ligne de l'historique

**En parallèle, côté client 👤** : horaires d'ouverture, premières photos et vidéos déposées dans `client/`.

## Lot 1 — Design et animations
**Objectif** : la direction visuelle est choisie et les 14 effets tournent sans ralentir le site.
**Utilise** : Next.js (Lot 0), le logo (captures suffisantes).
- ⬜ 2 ou 3 maquettes avec le vrai logo TSR66 → 👤 choix de Nicolas (PRD 5.1)
- ⬜ Charte appliquée : clair dominant, sections noires, rouge réservé aux boutons
- ⬜ Les 14 effets sur une page de démonstration (PRD 5.3)
- ⬜ Seuils de performance respectés sur mobile (PRD 5.4)

## Lot 2 — Espace Anthony (bases)
**Objectif** : Anthony publie une réalisation depuis son téléphone.
**Utilise** : compte Sanity (Lot 0), charte (Lot 1).
- ⬜ Sanity : hébergement en Europe vérifié (PRD 6.2)
- ⬜ Portail `tsr66.fr/espace` aux couleurs de TSR66, connexion Google, adresses autorisées (PRD 3.2)
- ⬜ Réalisations et photos (GPS supprimé, format et taille contrôlés), horaires, interrupteur « indisponible »

## Lot 3 — Pages publiques, SEO et GEO
**Objectif** : le site complet est consultable en aperçu privé.
**Utilise** : charte et effets (Lot 1), réalisations et horaires (Lot 2).
- ⬜ Accueil en landing page, 7 pages service, Réalisations, L'entreprise, Mentions légales, Confidentialité, Plan du site. La page Devis est mise en place, et son formulaire arrive au Lot 4. (PRD 3.2 et 3.3)
- ⬜ Rédaction de tous les textes, faits non confirmés marqués « à confirmer » (PRD 4.1) → 👤 relecture
- ⬜ Données structurées, sitemap automatique (mis à jour à chaque publication depuis l'Espace), robots des IA autorisés, `llms.txt` (PRD 4.2)
- ⬜ Audit SEO et GEO du site entier : `seo-audit`, `ai-seo`, `seo-local` (PRD 4.2)

## Lot 4 — Conversion et e-mails
**Objectif** : les trois portes de conversion et la demande d'avis fonctionnent de bout en bout.
**Utilise** : domaine tsr66.fr (Lot 0), pages (Lot 3), horaires et indisponibilité (Lot 2).
- ⬜ tsr66.fr confirmé dans Resend (enregistrements DNS)
- ⬜ Formulaire de devis en 3 étapes, bouton « Rappel en moins de 30 min » (horaires, jours fériés, indisponibilité) (PRD 3.3 et 3.4)
- ⬜ Les 4 modèles d'e-mails aux couleurs de TSR66, dont la demande d'avis depuis l'Espace (PRD 3.5)
- ⬜ Protections anti-spam invisibles, compteur anonyme : devis, rappels, clics sur « Appeler » (PRD 6.3 et 4.1)
- ⬜ Fiche « Mon espace TSR66 » remise au client, toutes fonctions du portail en place (PRD 7.3)

## Lot 5 — Mise en ligne
**Objectif** : le site est en ligne sur tsr66.fr.
**Utilise** : tous les lots précédents.
- ⬜ tsr66.fr branché sur Netlify, seul domaine indexable, IndexNow actif (PRD 4.2)
- ⬜ Google Search Console, Bing Webmaster Tools
- ⬜ Audit SEO et GEO final, scan approfondi `claude-security`, **zéro dette ouverte**, aucun contenu provisoire, textes validés
- ⬜ Mentions légales complètes (décennale et médiateur, s'ils sont fournis)
- ⬜ Consommation des formules gratuites vérifiée (PRD 6.1)
- ⬜ Plan d'action du référencement hors site remis (PRD 7.3)
- 👤 Décisions : statistiques de visites, et qui gère la fiche Google et les annuaires (PRD 4.4)

## À chaque fin de lot
- Réévaluer les versions majeures écartées dans `.github/dependabot.yml` (TypeScript, ESLint) : les adopter dès que la configuration de Next.js les prend en charge
- Checklist de fin de lot L1 à L7 (`docs/checklist/3-fin-de-lot.md`) : objectif démontré, contrôles du lot activés, scan `claude-security`, dettes échues, formules gratuites (PRD 6.1)

## Après la mise en ligne
- Guides « Conseils »
- Page Perpignan, dès qu'il y a de vrais chantiers sur place
- Suivi mensuel des indicateurs (PRD 1.5)

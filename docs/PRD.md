# PRD — Site vitrine TSR 66

> **Statut : complet et validé le 2026-09-27** (sections 1 à 7), construit ensemble section par section. Modifié depuis : 2.1 (skills, 2026-09-30), 3.6 (avis Google, 2026-10-06), 4.1 (règles de rédaction, 2026-10-07), 3.2, 3.3, 5.2 et 5.3 (alignées sur la maquette d'accueil validée par Nicolas le 2026-10-07), 3.1, 3.2, 3.4, 3.5, 4.1, 6.2 et 6.3 (page Contact et menu commun, décidés par Nicolas le 2026-10-09).
>
> **Consigne à chaque session :** après la lecture de ce PRD, exécuter la **checklist de démarrage (`docs/checklist/`, D1 à D7)** et afficher le feu vert ou rouge **avant toute action**. En fin de session, exécuter la **checklist de fin (F1 à F6)**. À tout moment : « contrôle la checklist » ou « contrôle le point N ».

## 1. L'entreprise et les objectifs du site
*Validée le 2026-09-27.*

### 1.1 L'entreprise
- **Nom commercial** : TSR66, un simple nom sans signification.
- **Statut** : entrepreneur individuel, Anthony Moreau. Créée le 22 janvier 2019.
- **Siège** : 11 rue des Macabeus, 66300 Saint-Jean-Lasseille (Pyrénées-Orientales).
- **SIRET** 847 691 672 00012 · **TVA** FR32847691672 · **NAF** 43.12A.
- **Contact** : 06 26 57 15 21 · adresse e-mail professionnelle du dirigeant, fournie par le client et non reproduite dans ce dépôt public (7.2).
- **Organisation** : artisan seul, interlocuteur unique qui réalise lui-même les travaux, avec des renforts ponctuels (sous-traitants, intérimaires) selon la taille du chantier.
- **Identité visuelle** : logo TSR66 existant, couleurs noir, rouge et blanc.

### 1.2 Les 7 services
1. Terrassement
2. Assainissement
3. Viabilisation / VRD
4. Travaux forestiers
5. Aménagement extérieur et paysager
6. Démolition
7. Enrochement / murs

**Hors périmètre** : la rénovation de bâtiment. Elle figure encore dans l'activité déclarée, mais le client ne veut plus en faire : il se consacre au terrassement.

### 1.3 Les cibles
- **Prioritaires** : les particuliers et les professionnels (constructeurs, maçons, architectes, promoteurs).
- **Secondaires** : les collectivités.

### 1.4 Objectif du site
**Convertir des prospects en demandes de devis et en appels.** Le référencement (SEO local et GEO) sert à attirer ces prospects, et chaque page doit mener au devis ou à l'appel.

### 1.5 Indicateurs de réussite à 12 mois
| Indicateur | Cible |
|---|---|
| Contacts (devis + appels) | ≥ 10 par mois |
| Carte Google, secteur Saint-Jean-Lasseille / Aspres | Top 3 |
| « terrassement Perpignan » | Top 10 |
| Recherches précises (service + commune) | Top 3 |
| Avis Google | ≥ 20, note ≥ 4,8 |
| Citations IA | ≥ 3 réponses sur 10 questions test |

### 1.6 Affichage de l'adresse (point fermé le 2026-09-27)
Le siège est le domicile du dirigeant, et la fiche Google est référencée à cette adresse.
- **Affichée en entier** (pied de page, contact, mentions légales, données structurées), **strictement identique à la fiche Google**. Les mentions légales l'exigent, et la cohérence avec la fiche Google conditionne le classement sur la carte.
- **Jamais de plan d'accès ni de photo du domicile.** Mention « intervient sur place, pas d'accueil au dépôt ».

## 2. Contrôle qualité et sécurité
*Validée le 2026-09-27.*

### 2.1 Décisions
- **Dépôt GitHub public** (`anthonytsrdeveloppement-byte/tsr66`, créé le 2026-09-27 ; commits signés par l'adresse masquée GitHub du compte, jamais une adresse personnelle) : il donne gratuitement le détecteur de secrets avec blocage d'envoi, l'analyse CodeQL complète, la protection de branche et une CI illimitée. Les secrets sont bloqués sur l'ordinateur avant chaque commit, puis par GitHub. `client/` n'est jamais versionné.
- **Mémoire du projet** : au démarrage, la source de vérité est constituée des documents du projet (PRD, roadmap, dernier rapport de session). En fin de session, deux écritures sont obligatoires : le rapport de session avec la mise à jour de la roadmap, et `/archive` vers KIT-MEMOIRE. Les rapports ne contiennent aucune information sensible, puisque le dépôt est public.
- **Carte des documents** (tous alignés sur ce PRD, qui fait foi) :

| Document | Rôle | Lu | Mis à jour |
|---|---|---|---|
| `docs/PRD.md` | Ce que le site doit être et comment on travaille | Chaque session (D1) | Seulement sur décision de Nicolas |
| `docs/ROADMAP.md` | Les lots dans l'ordre, et où on en est | D1 | F6 |
| `docs/DETTES.md` | Registre des dettes (2.2) | D1 | F6 |
| `docs/checklist/` | La checklist (2.3) : fiches, registre des contrôles du site, historique | Chaque session | F6 (historique, registre) |
| `docs/checklist/sessions/` | Un rapport par session, selon `MODELE_RAPPORT.md` | D1 (le dernier) | F6 |
| `docs/remis-au-client/` | Documents remis au client (7.3) | — | Au lot concerné |
| `CLAUDE.md` | Consigne de démarrage, qui renvoie au PRD | Chaque session | Seulement si le PRD change |
| `client/LISEZMOI.md` | Où le client dépose ses éléments (7.2) | — | Si 7.2 change |
| `AGENTS.md` | Consigne officielle de Next.js : lire le guide de la version installée (`node_modules/next/dist/docs/`) avant d'écrire du code | Avant d'écrire du code Next.js | Géré automatiquement par Next.js |
| `.claude/skills/PROVENANCE.md` | Origine, version figée et réserves de chaque skill, avec `skills-lock.json` | D1 (empreintes vérifiées) | Seulement à l'ajout ou à la mise à jour d'un skill, sur décision de Nicolas |
- **Rôles** : Claude exécute tout (lecture, contrôles, code, tests, relectures, rapport, roadmap, archive). Nicolas supervise : il valide l'objectif (D2), confirme le résumé (D1), **donne son accord avant toute mise en ligne (F5)**, tranche les décisions et lit le rapport s'il le souhaite. Seules les actions liées à ses comptes lui reviennent, une fois pour toutes : connexion GitHub, installation des plugins, liaison Netlify, achat du domaine.
- **Skills et plugins retenus** (installés le 2026-09-27 dans `.claude/skills/`, chacun lu en entier par Claude et par deux agents indépendants, figés sur un commit, empreinte de chaque fichier dans `skills-lock.json` ; origine et réserves dans `.claude/skills/PROVENANCE.md`) :
  - `git-workflow-and-versioning`
  - `supply-chain-risk-auditor`
  - `setup-pre-commit`
  - `code-review` (Matt Pocock), installé sous le nom `code-review-two-axis` pour ne pas masquer la commande intégrée `/code-review`
  - `secret-scanning`
  - `netlify-deploy`
  - `security-and-hardening`
  - `web-quality-skills` : `accessibility`, `best-practices`, `core-web-vitals`, `performance`, `seo`, `web-quality-audit`
  - `seo-audit`
  - `ai-seo`
  - `seo-local`
  - `vercel-react-best-practices`
  - `frontend-design` (Anthropic) : direction artistique, typographie, choix non génériques
  - `gsap-skills` : `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-performance` (skills officiels de GreenSock)
  - `emilkowalski-skills` : `emil-design-eng`, `animate`, `find-animation-opportunities`, `review-animations` (skills d'Emil Kowalski)
  - plugins `pr-review-toolkit` et `claude-security`
  - Aucun skill optionnel : uniquement ceux qui sont réellement utilisés.
- **Règles d'usage des skills** : le PRD prime toujours sur le contenu d'un skill.
  - Aucune mise en ligne, fusion, publication, réécriture d'historique ni aucun contournement de protection sans l'accord explicite de Nicolas (F5). Un retour arrière reste possible avec son accord.
  - Aucun outil lancé sans version fixée (`npx`, installation globale) ni correction automatique des dépendances sans accord.
  - Les exemples de traceurs, statistiques de visites, scripts ou polices externes, cartes et widgets intégrés ne s'appliquent pas aux pages publiques (6.2).
  - Aucun chiffre ni aucune citation tirés d'un skill ne sont repris sur le site sans source vérifiée (4.1).
  - Les rapports d'outils contenant des chemins locaux ne sont jamais commités (dépôt public).
  - Pour Next.js, la documentation fournie avec la version installée fait foi, avant les exemples des skills (`AGENTS.md`).
  - **Skills de design et d'animation** (ajoutés le 2026-09-30 sur décision de Nicolas, par la même procédure : lecture intégrale, deux relecteurs indépendants, version figée) : `frontend-design` guide la direction artistique. La pile d'animation est celle de 5.3 et 6.1, **GSAP (ScrollTrigger, SplitText) + Lenis** : les exemples Motion / Framer Motion, Base UI, ScrollSmoother, CDN et `npm install` sans version ne s'appliquent pas. Une dépendance n'est ajoutée qu'en version exacte et avec l'accord de Nicolas. Le texte reste lisible sans JavaScript : jamais de contenu caché par défaut en attendant une animation. `prefers-reduced-motion` respecté partout. Les skills qui imposent une phrase de réponse fixe ou renvoient vers un skill absent sont suivis seulement dans ce qu'ils apportent de contenu.
  - Ces règles sont doublées de **verrous techniques** : commandes dangereuses refusées par Claude Code (`.claude/settings.json`) ; branche principale protégée chez GitHub (demande de fusion obligatoire, ni envoi forcé ni suppression, même pour l'administrateur) ; branche `production`, la seule mise en ligne par Netlify : ni envoi forcé ni suppression, même pour l'administrateur, 4 contrôles de la CI exigés, et une garde de compilation qui refuse tout commit absent de la branche principale (`scripts/garde-production.mjs`) ; blocage par GitHub de tout envoi contenant un secret.

### 2.2 Blocages et registre des dettes
Pour ne pas être bloqué par des détails, chaque problème relève de l'une de deux catégories. En cas de doute, c'est Nicolas qui tranche.

| 🔴 Toujours bloquant (jamais mis en dette) | 🟡 Peut devenir une dette |
|---|---|
| Faille ou vulnérabilité, même mineure | Performance légèrement sous le seuil, hors mise en production |
| Secret exposé | Avertissement mineur de qualité du code |
| Site qui ne compile pas, test en échec | Amélioration de code souhaitée mais pas urgente |
| Donnée personnelle envoyée à un site tiers (RGPD) | Défaut d'accessibilité mineur |
| Défaut d'accessibilité grave ou critique | Optimisation d'image, finition visuelle |
| Texte invisible pour Google | Remarque de relecture non critique |

**Registre `docs/DETTES.md`** :
- Chaque dette y est notée avec sa date, sa description, la raison du report, son impact et son échéance (au plus tard la fin du lot en cours).
- Le registre est relu au démarrage (D1).
- Au maximum 10 dettes ouvertes : au-delà, la session suivante sert à rembourser.
- **Zéro dette pour la mise en production.**

**Service extérieur en panne** (GitHub, Aikido…) : ce n'est pas bloquant si tous les autres contrôles passent. La panne est notée dans le rapport et le contrôle est refait à la session suivante.

### 2.3 Checklist
La checklist a **son propre dossier, `docs/checklist/`**, qui s'enrichit à chaque session : on y retrouve chaque contrôle fait, quand, et avec quel résultat.

| Fichier | Contenu | Quand |
|---|---|---|
| `1-demarrage.md` | Fiches D1 à D7 | Début de chaque session |
| `2-fin-de-session.md` | Fiches F1 à F6 | Fin de chaque session |
| `3-fin-de-lot.md` | Contrôles L1 à L7 | Fin de chaque lot |
| `4-controles-du-site.md` | Registre : chaque exigence de ce PRD devient un contrôle, activé dès que la fonction existe, puis rejoué à chaque session (F1) | F1, CI |
| `historique.md` | Une ligne par session et par fin de lot : feux, contrôles faits, points importants | F6 |
| `sessions/` | Le rapport détaillé de chaque session, selon `MODELE_RAPPORT.md` | F6 |

Chaque point est une fiche : **règle**, **contrôle**, **résultat attendu**, **si c'est rouge**, **preuve**. Chaque contrôle repose sur une commande réelle dont le résultat est montré.
La checklist se déclenche de trois façons :
- **au démarrage**, automatiquement à la lecture du PRD, avec un feu vert ou rouge avant toute action ;
- **à la fin**, avant de clôturer la session ;
- **à la demande**, avec « contrôle la checklist » ou « contrôle le point N » (D3, F2, L5, C23…).

**Les points** :
- Démarrage : D1 Reprendre le contexte · D2 Fixer l'objectif de la session · D3 Partir d'un code propre · D4 Des outils identiques · D5 Aucune faille connue au départ · D6 Les secrets · D7 Le site fonctionne avant de commencer. **Feu vert** seulement si les 7 sont au vert.
- Fin de session : F1 Tout est vert · F2 Revue de code · F3 Revue sécurité · F4 Secrets et dépendances avant l'envoi · F5 Envoi sur GitHub et mise en ligne · F6 Mémoire de la session. Session **close** seulement si les 6 sont au vert.

Les fiches D, F et L ne changent que sur décision de Nicolas. Le registre des contrôles et l'historique sont tenus par Claude, à partir de ce PRD.

## 3. Les pages et les parcours de conversion
*Validée le 2026-09-27.*

### 3.1 Principe
Un site **premium, mais d'abord un site qui convertit**. Chaque page mène au devis ou à l'appel. Les boutons « Appeler » et « Devis gratuit » sont toujours visibles, dans l'en-tête sur ordinateur et dans une barre fixée en bas de l'écran sur mobile, avec le même style et le même texte partout.

**Menu** (décidé par Nicolas le 2026-10-09) : le même sur toutes les pages. Il contient **Services** (liste déroulante des 7 services, chacun avec sa phrase côté visiteur, « Je construis ma maison »…), **Réalisations**, **L'entreprise** et **Contact** ; à droite, « Appeler » avec le numéro et « Devis gratuit » (le mot « Urgence » est abandonné : il pouvait laisser croire à une disponibilité 24 h/24). Il ne contient aucun raccourci vers une section d'une page : sur l'accueil, les sections se parcourent en défilant. La page en cours est repérée dans la liste des services, et le menu téléphone reprend la même liste.

### 3.2 Plan du site
**Partie publique**
- **Accueil** : landing page, avec le récit animé d'un chantier au scroll.
- **7 pages service**, chacune avec sa propre URL (`/services/terrassement`, `/services/assainissement`…) et construite comme une mini-landing page : titre, bouton devis en haut, réalisations du service, questions fréquentes.
- **Réalisations** : alimentées par Anthony depuis son Espace.
- **L'entreprise** : Anthony Moreau, son parcours, ses engins.
- **Devis gratuit** : page `/devis` qui affiche directement le même formulaire en 3 étapes que l'accueil (3.3), avec les trois façons de joindre l'entreprise ; pour les visiteurs qui n'arrivent pas par l'accueil (annonce, SMS).
- **Contact** : page `/contact` pour les visiteurs qui ont une question sans vouloir de devis. Elle réunit un formulaire simple (nom, téléphone ou e-mail, message), le numéro de téléphone, l'adresse complète (1.6), les horaires, la zone d'intervention, le bouton de rappel et un lien vers la page Devis pour un chantier.
- **Conseils** : plus tard.
- **Pages ville**, discrètes et hors menu : une page Perpignan, publiée seulement avec de vrais chantiers sur place.
- En bas de page : Mentions légales · Confidentialité · Plan du site.

**Partie privée : l'Espace Anthony**, portail personnel aux couleurs de TSR66 à l'adresse **tsr66.fr/espace**. Il est invisible pour Google, sans lien depuis le site public, pensé pour le téléphone (icône sur l'écran d'accueil), et appuyé sur un outil de gestion éprouvé (Sanity, invisible pour Anthony). Aucune connexion n'est codée par nous. **Connexion avec son compte Google**, double authentification, adresses autorisées uniquement. Fonctions :
- ajouter, modifier et retirer des réalisations et des photos depuis le téléphone ;
- envoyer une demande d'avis Google ;
- **mettre à jour la note Google et les avis affichés sur le site**, avec des contrôles de cohérence (3.6) ;
- interrupteur « Je suis indisponible » ;
- modifier ses horaires.

Le sitemap se met à jour automatiquement à chaque publication, et Bing est prévenu par IndexNow.

### 3.3 L'accueil en landing page
- **Premier écran** : le titre (« Terrassement, assainissement et VRD à Saint-Jean-Lasseille et Perpignan »), l'accroche (« Un seul interlocuteur, du premier coup de pelle à la finition »), le bouton de rappel et le **formulaire de devis en 3 étapes** (la note et les avis Google, 3.6, figurent dans leur propre section) :
  1. quel projet ? (texte libre) ;
  2. où ? (la commune) ;
  3. nom, téléphone et e-mail.
- **Au scroll** : services (phrase « Je veux un devis gratuit pour… » dont le mot change, qui ouvre le devis déjà rempli), pelleteuse, méthode, repères chiffrés, vidéo de chantier, avis, bandeaux défilants, **carte animée du 66** (Saint-Jean-Lasseille au centre, rayon, « à 15 minutes de Perpignan »), FAQ, puis devis. Les réalisations et l'avant/après arrivent avec les vraies photos (Lot 3). Un onglet « Accessibilité » permet de couper les animations.

### 3.4 Les trois portes d'entrée de la conversion
| Porte | Ce que fait le prospect | Ce qui se passe |
|---|---|---|
| **Appeler** | Touche le numéro | Appel direct, clic compté anonymement |
| **Devis gratuit** | Remplit le formulaire en 3 étapes | E-mail de confirmation au prospect + e-mail « nouvelle demande » à Anthony |
| **Rappel en moins de 30 min** | Saisit son nom et son téléphone | Message à l'écran avec l'heure limite + e-mail d'alerte distinct à Anthony, numéro cliquable |

**Le message de contact** (page Contact, 3.2) est une quatrième voie, pour une simple question. Il n'entre pas dans les trois portes de conversion ci-dessus, mais suit les mêmes règles : e-mail de confirmation à l'expéditeur et e-mail « nouveau message » à Anthony (3.5), protections invisibles (6.3), aucune donnée gardée sur le site (6.2).

**Règles du bouton de rappel** :
- Le texte s'adapte à l'heure de Paris, aux horaires d'Anthony, aux jours fériés français et à l'interrupteur « indisponible » : « en moins de 30 min », « demain dès 8h », « lundi dès 8h »…
- L'échéance est recalculée par le serveur au moment de l'envoi. L'écran du prospect et l'e-mail d'Anthony affichent la même heure.
- Sans JavaScript, le bouton affiche un texte neutre : « Être rappelé rapidement ».
- Le bouton ne fait jamais de promesse intenable.

### 3.5 Les e-mails (Resend, modèles soignés aux couleurs de TSR66)
| E-mail | Destinataire |
|---|---|
| Confirmation de demande de devis | Prospect |
| Nouvelle demande de devis | Anthony |
| Alerte « à rappeler avant HH:MM » | Anthony |
| Confirmation de message de contact | Expéditeur |
| Nouveau message de contact | Anthony |
| Demande d'avis Google | Client, déclenchée depuis l'Espace Anthony |

Une demande d'avis est envoyée à **tous** les clients, sans tri préalable et sans contrepartie (règle Google).

### 3.6 La note et les avis Google affichés sur le site
*Décidé par Nicolas le 2026-10-06.*

**Principe** : la note et le nombre d'avis du site sont **ceux de la fiche Google Business Profile**, sans seuil minimum. Le client les met à jour lui-même depuis l'Espace Anthony. Le site affiche toujours le nombre d'avis à côté de la note (« 4,9 sur 5 · 12 avis »), pour que le visiteur juge la valeur de la note.

**Ce que le client saisit dans l'Espace Anthony**
- la **note Google** (de 1,0 à 5,0, une décimale) et le **nombre total d'avis**, tels qu'ils apparaissent sur sa fiche ;
- le **nombre d'avis par niveau d'étoiles** (5, 4, 3, 2 et 1 étoile) ;
- les **avis à afficher** : prénom et initiale du nom, commune, texte, nombre d'étoiles de l'avis (de 1 à 5) et date ;
- le **lien d'avis** de sa fiche Google (identifiant de la fiche, fourni par le client).

**Ce que le site calcule lui-même, pour qu'aucune valeur incohérente ne s'affiche**
- les **étoiles de la note** sont dessinées à partir du chiffre : 4,9 donne quatre étoiles pleines et une cinquième remplie à 90 % ;
- les **pourcentages des barres** viennent des nombres par niveau et font toujours 100 % ;
- les **étoiles de chaque avis** viennent du nombre saisi pour cet avis ;
- la date « données Google au JJ/MM/AAAA » est affichée sous la note.
- « Dernier avis il y a N jours » est calculé à partir de la date du dernier avis saisi, et affiché seulement s'il date de moins de 60 jours (au-delà, la date seule est donnée).

**Contrôles à l'enregistrement** : l'Espace refuse d'enregistrer, avec un message en français simple, si
- la note n'est pas comprise entre 1 et 5 ;
- le total des avis par niveau ne correspond pas au nombre total d'avis ;
- la note saisie s'écarte de plus de 0,1 de la moyenne calculée à partir des nombres par niveau ;
- le nombre d'avis affichés dépasse le nombre total d'avis ;
- un avis a un nombre d'étoiles hors de 1 à 5 ou un texte vide.

**Cas particulier : aucun avis.** Il n'y a alors aucune note à suivre : la section n'affiche que le bouton « Laisser un avis » (et jamais de note inventée).

**Boutons** : « Laisser un avis », qui ouvre la fenêtre de rédaction d'un avis sur la fiche Google, et « Voir tous les avis sur Google ». Ils restent absents ou inactifs tant que l'identifiant de la fiche n'est pas fourni.

**Règles de fond**
- Les avis affichés sont **de vrais avis de la fiche Google**, recopiés tels quels : TSR66 et Claude ne les écrivent ni ne les modifient. La source « Avis Google » est indiquée.
- Aucun avis, aucune note et aucun chiffre d'exemple n'est mis en ligne : ceux de la maquette sont des exemples signalés comme tels.
- Aucune mise à jour automatique depuis Google dans la première version (une récupération automatique de la note par l'interface de Google reste possible plus tard, à décider : coût, conditions de conservation, et aucune ressource extérieure sur les pages publiques, 6.2).

## 4. SEO local et GEO
*Validée le 2026-09-27.*

### 4.1 Décisions
- **Domaine : tsr66.fr.** Achat en attente de l'accord du client, idéalement au nom de l'entreprise. Protection par tsr66.com : à voir avec le client.
- **E-mails** : envoyés depuis `…@tsr66.fr` (domaine confirmé dans Resend). La réception, le « répondre à » et l'adresse affichée sont le Gmail d'Anthony (t.s.r.66moreau@gmail.com).
- **Robots des IA autorisés**, le GEO étant une priorité : ChatGPT, Perplexity, Claude, Google IA, Bing…
- **Rédaction** : Claude rédige tous les textes, avec une optimisation SEO/GEO subtile et un ton professionnel, sans répéter les mots-clés à outrance. Relecture et corrections ensuite. **Aucun fait inventé** : ce qui n'est pas confirmé est marqué « à confirmer ».
- **Mesure** : Google Search Console, Bing Webmaster Tools, statistiques de la fiche Google, compteur interne des conversions : demandes de devis, demandes de rappel, messages de contact et clics sur « Appeler », côté serveur, sans cookie ni donnée personnelle.
- **Règles de rédaction** (décidées avec Nicolas le 2026-10-07, après l'audit des textes de la maquette) :
  - **Voix** : l'entreprise parle toujours au pluriel (« nous », « notre », « nos », « TSR66 »), jamais en « on » ni à la troisième personne ; le visiteur est vouvoyé. Le prénom du dirigeant n'apparaît que dans la mention légale « Anthony Moreau EI – TSR66 ». Dans le menu des services, la situation est écrite à la première personne côté visiteur (« Je dois démolir ») : c'est voulu.
  - **Vocabulaire** : les sept services s'écrivent toujours « Terrassement », « Assainissement », « Viabilisation / VRD », « Travaux forestiers », « Aménagement extérieur », « Démolition » et « Enrochement / murs ». Le visiteur a un « projet », l'entreprise réalise des « chantiers » et des « travaux ». On écrit « devis gratuit », « être rappelé », « en moins de 30 min » (jamais « sous 30 min »), « professionnels » (jamais « pros »), « à 15 minutes de Perpignan ». Le sigle VRD est développé une fois par page (« voirie et réseaux divers »).
  - **Typographie française** : espace insécable avant « : ; ? ! % » et à l'intérieur des guillemets « », apostrophe typographique ’ partout, numéros de téléphone insécables (06 26 57 15 21), heures écrites « 9 h 30 ».
  - **Promesses prudentes** : pas de promesse absolue (« toujours », « aucune surprise », « aux normes », « tiennent dans le temps »). La conformité d'un assainissement individuel est un avis du SPANC ; le raccordement au réseau public relève des concessionnaires ; la constructibilité d'un terrain relève de l'urbanisme, pas de la viabilisation.
  - **Un texte d'exemple n'est jamais publié** : chiffres, avis, communes et crédits d'exemple sont remplacés ou retirés avant la mise en ligne.

### 4.2 Fondations techniques (mises en place par Claude)
- **Tout le texte est lisible sans JavaScript** : les animations ne cachent jamais rien à Google ni aux IA.
- **Chaque page a son titre et sa description uniques**, un seul titre principal et une URL courte en français.
- **Données structurées** : entreprise locale (nom, adresse et téléphone identiques partout, zone desservie, horaires), services, fil d'Ariane, questions fréquentes, réalisations.
- **Sitemap automatique**, avec Bing prévenu instantanément à chaque publication (IndexNow).
- **Fichier `llms.txt`** : une fiche de présentation de TSR66 destinée aux IA.
- **Site très rapide** : c'est un critère de classement direct.
- **Seul tsr66.fr est indexable** : les aperçus privés et l'adresse de travail Netlify sont interdits aux moteurs de recherche, pour éviter le contenu en double avant et après le lancement.
- **Audits SEO et GEO du site entier** avec `seo-audit`, `ai-seo` et `seo-local`, à la fin du lot des pages publiques et avant la mise en ligne.

### 4.3 Règles de contenu
- **Réponse d'abord** : chaque section commence par une réponse claire en une ou deux phrases, puis détaille.
- **Questions fréquentes réelles** sur chaque page service.
- **Réalisations = preuves** : lieu, type de travaux, photos avant/après.
- **Pages ville uniquement avec de vrais chantiers dans la commune**, jamais de pages copiées-collées.
- **Nom, adresse et téléphone strictement identiques** sur le site, la fiche Google et partout ailleurs.

### 4.4 Points ouverts
- Qui gère les actions hors site : fiche Google, Bing Places, Pages Jaunes, annuaires. La liste des actions et les textes à copier-coller seront fournis.
- Statistiques de visites : à trancher à la mise en ligne.
- Achat de tsr66.fr, et éventuellement tsr66.com, par le client.
- Avis en ligne : obligations d'information envers les consommateurs (origine des avis, date, traitement) à vérifier avant la mise en ligne.

## 5. Design et animations
*Validée le 2026-09-27.*

### 5.1 Identité
- **Charte existante** : logo TSR66 aux lettres massives et anguleuses, couleurs **noir, rouge et blanc**, illustration de pelleteuse de la carte de visite.
- **Base de départ** :
  - **fond clair dominant**, lisible sur un téléphone en plein soleil ;
  - **sections noires** aux moments forts : premier écran, méthode, chiffres ;
  - **rouge TSR66 réservé aux boutons de conversion**.
- **Choix final sur maquettes** : 2 ou 3 maquettes visuelles avec le vrai logo, regardées sur téléphone et sur ordinateur.
- **Logo** : fichier d'origine vectoriel à demander au client. À défaut, il est redessiné avec son accord.

### 5.2 Concept
L'accueil **raconte un chantier au fil du scroll** : premier écran avec photo d'engin, services, pelleteuse, méthode, repères, vidéo de chantier, avis, zone d'intervention, FAQ, puis devis (réalisations et avant/après avec les vraies photos). Les animations s'inspirent de moto-card.com (GSAP, ScrollTrigger, SplitText, Lenis), transposées à l'univers du terrassement.

### 5.3 Les 14 effets retenus
1. Écran d'entrée : logo révélé en moins d'une seconde, à la première visite seulement.
2. Vidéo de chantier dans une section dédiée (« Sur le terrain ») : une fenêtre qui s'ouvre jusqu'au plein écran au scroll, lue seulement quand elle est visible.
3. Grand mot qui fait défiler les 7 services derrière la pelle du premier écran.
4. Titres révélés ligne par ligne.
5. Parallaxe des photos de chantier.
6. Section épinglée « Comment se déroule votre chantier » : Votre demande → Visite et devis → Réalisation → Remise du chantier, une photo par étape, texte écrit au fil du scroll.
7. Repères chiffrés : trois chiffres à compteur sur photo en parallaxe (valeurs confirmées par le client, 7.2).
8. Carte animée du 66 autour de Saint-Jean-Lasseille.
9. Pelleteuse de la carte de visite animée en 2D : le bras plonge au fil du scroll.
10. Bandeaux défilants : services, communes.
11. Menu qui change de couleur selon la section.
12. FAQ qui s'ouvre en douceur.
13. Pied de page qui apparaît en cascade.
14. Défilement fluide de toute la page.

**Exclus** : la 3D réelle, et les scripts de suivi ou chargés depuis d'autres sites.

### 5.4 Règle absolue : ne jamais ralentir le site
- **Seuils contrôlés à chaque session (F1)** : affichage en moins de 2,5 s sur mobile, aucun décalage de mise en page, réaction immédiate aux clics. Une animation qui fait dépasser ces seuils est corrigée ou retirée.
- **Le premier écran n'attend jamais les animations** : titre et bouton de devis visibles tout de suite.
- **Sur mobile**, les effets sont allégés et les vidéos ne se lancent que lorsqu'elles sont visibles.
- **Si l'appareil demande de réduire les animations**, de simples fondus les remplacent.
- **Tout le texte reste lisible sans JavaScript**, pour Google et les IA.

## 6. Technique, RGPD et mentions légales
*Validée le 2026-09-27.*

### 6.1 Les briques du site
| Brique | Choix | Rôle |
|---|---|---|
| Site | **Next.js** (dernière version stable : 16.3.6 installée le 2026-09-27), pages générées à l'avance, **Node 24** (version stable longue durée) fixé par le projet | Rapidité maximale, SEO |
| Animations | **GSAP** (ScrollTrigger, SplitText) + **Lenis** | Les 14 effets de la section 5 |
| Hébergement | **Netlify** | Mise en ligne (branche `production`, voir ci-dessous), aperçus privés, variables secrètes |
| Espace Anthony | **Sanity** | Réalisations, photos, horaires, interrupteur « indisponible », demandes d'avis |
| E-mails | **Resend**, depuis `…@tsr66.fr` | Confirmations, alertes de rappel, demandes d'avis |
| Code | **GitHub**, dépôt public | Historique, contrôles automatiques |

**Coût visé : 0 €/mois** grâce aux formules gratuites de Netlify, Sanity et Resend (3 000 e-mails/mois, 100/jour), plus le domaine (≈ 10 à 15 €/an). **La consommation par rapport aux limites gratuites est vérifiée à chaque fin de lot**, et le dépassement d'une limite est signalé avant qu'il ne coûte. Chez Netlify, seule une mise en ligne consomme des crédits (15 sur 300 par mois ; plafond strict : au-delà, les sites sont mis en pause) ; les aperçus et la version principale sont gratuits (documentation Netlify « How credits work », relevé du compte le 2026-09-29). La mise en ligne n'a donc lieu qu'**une fois par lot**, avec l'accord de Nicolas (décision du 2026-09-29).

### 6.2 Données personnelles (RGPD)
- **Le site ne garde aucune donnée personnelle.**
  - Les demandes et les messages de contact partent par e-mail dans le Gmail d'Anthony.
  - Resend efface son historique au bout de 30 jours.
  - Seul un compteur anonyme est conservé : nombre de devis, de rappels, de messages de contact et de clics sur « Appeler ».
  - L'e-mail d'un client à qui on demande un avis est envoyé directement par le site et n'est jamais enregistré, ni sur le site ni dans Sanity.
- **Avis affichés** : seul le prénom et l'initiale du nom, la commune et le texte d'avis déjà publics sur Google sont enregistrés dans Sanity. Un avis retiré par son auteur ou par Google est retiré du site sur demande.
- **Durée de conservation annoncée** : 3 ans après le dernier contact (règle CNIL pour les prospects).
- **Télémétrie de Next.js désactivée** (statistiques d'usage envoyées par défaut à Vercel) : sur l'ordinateur, dans la CI et sur Netlify.
- **Aucun cookie, aucun traceur, aucune ressource chargée depuis un autre site sur les pages publiques**, donc aucune bannière cookies. Seul le portail privé d'Anthony utilise la connexion Google et Sanity.
- **Sanity ne reçoit que des photos de chantier et des textes publics**, jamais de données de prospects. Les photos sont servies depuis tsr66.fr. L'hébergement en Europe est choisi à l'installation si la formule gratuite le permet ; sinon, les clauses contractuelles européennes couvrent le transfert.
- **Contrats de traitement des données** : Netlify, Resend, Sanity.
- **Photos envoyées depuis l'Espace Anthony** : données GPS supprimées automatiquement, format et taille contrôlés. Pas de visage reconnaissable sans accord, pas de plaque d'immatriculation lisible.

### 6.3 Sécurité
- Checklist D1 à D7, F1 à F6, fin de lot et registre des contrôles du site (section 2.3, dossier `docs/checklist/`).
- **Formulaires** (devis, rappel et contact) : protections invisibles (champ piège, délai minimum, limite d'envois, vérification du téléphone), sans captcha.
- **En-têtes de sécurité** : le navigateur n'exécute que le code de TSR66, le site ne peut pas être intégré dans une autre page, et la connexion est toujours chiffrée (HTTPS).
- **Connexion à l'Espace Anthony** avec son compte Google et la double authentification, réservée aux adresses autorisées. En cas de perte, de vol ou de panne, Nicolas coupe ou réactive l'accès.
- **Clés secrètes** (Resend, Sanity) uniquement dans les réglages de Netlify.

### 6.4 Mentions légales et pages obligatoires
- **Mentions légales** :
  - « Anthony Moreau EI – TSR66 », la mention EI étant obligatoire ;
  - adresse, SIRET, TVA, directeur de la publication ;
  - hébergeur (Netlify) ;
  - médiateur de la consommation.
- **Politique de confidentialité** : données collectées, finalité, durée, droits, contact.
- **Assurance décennale** : assureur et zone couverte, affichés comme signal de confiance. Le client les transmettra au moment voulu.
- **Accessibilité** : objectif WCAG 2.2 niveau AA, vérifié à chaque session (F1).

### 6.5 Médiateur de la consommation
Obligation légale dès que l'entreprise travaille pour des particuliers. **Ce n'est pas bloquant pour le site** : la décision et la responsabilité de souscrire appartiennent au client. Le site affichera les coordonnées du médiateur dès qu'elles seront fournies.

## 7. Comptes et contenu à fournir par le client
*Validée le 2026-09-27.*

### 7.1 Comptes
| Compte | Propriétaire | Accès |
|---|---|---|
| Domaine **tsr66.fr** (et éventuellement tsr66.com) | **Le client** | Nicolas, gestionnaire |
| **GitHub, Netlify, Resend, Sanity** | Nouveaux comptes créés avec une adresse dédiée, définie avec le client | Nicolas garde l'accès |
| **Portail tsr66.fr/espace** | Anthony, avec son compte Google | Nicolas, avec son propre compte |

**Règles de sécurité des comptes** :
- double authentification **non retenue** sur GitHub, Netlify, Resend et Sanity (décision de Nicolas, 2026-09-27), sauf si un service l'impose ;
- mots de passe uniques, conservés en lieu sûr, jamais dans le projet ni dans les documents.

### 7.2 Contenu à fournir
| Élément | Pourquoi | Priorité |
|---|---|---|
| Accord pour l'achat de tsr66.fr (et avis sur tsr66.com) | Site, e-mails, référencement | 🔴 Urgent |
| Horaires d'ouverture | Pilotent le bouton « Rappel en moins de 30 min » | 🔴 Avant la mise en ligne |
| Photos de chantiers, dont des paires avant/après prises sous le même angle | Réalisations, animations, fiche Google | 🔴 Avant la mise en ligne |
| Vidéo de chantier (engin en action, drone si possible), 10 à 20 s, stable, format paysage | Premier écran de l'accueil | 🟠 Important |
| Logo en fichier d'origine (SVG, AI, EPS ou PDF) | Netteté sur tous les écrans. Sinon, il est redessiné avec son accord | 🟠 Important |
| Liste de ses engins | Pages service, page L'entreprise | 🟠 Important |
| Assurance décennale : assureur, numéro de contrat, zone couverte | Mentions et signal de confiance | 🟠 Au moment voulu |
| Médiateur de la consommation (s'il souscrit) | Obligation légale envers les particuliers | 🟡 Sa décision |
| Identifiant de sa fiche Google (pour le bouton « Laisser un avis »), puis sa note et ses avis | Section avis (3.6) | 🟠 Avant la mise en ligne |
| Chiffres clés (nombre de chantiers, m³ déplacés…) | Section « chiffres ». Un chiffre non confirmé n'est pas affiché | 🟡 Optionnel |
| Photo d'Anthony et quelques mots sur son parcours | Page L'entreprise | 🟡 Optionnel |
| Communes où il a déjà travaillé | Carte du 66, future page Perpignan | 🟡 Plus tard |
| Relecture des textes rédigés par Claude | Exactitude des informations | Au fil de l'eau |

### 7.3 Documents remis au client
- **Fiche « Mon espace TSR66 »** : se connecter, ajouter une réalisation, demander un avis, mettre à jour la note et les avis affichés, que faire en cas de problème, qui contacter.
- **Plan d'action du référencement hors site** : fiche Google, Bing Places, annuaires, avec les textes à copier-coller. Qui le met en œuvre reste à décider.

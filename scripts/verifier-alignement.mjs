// Contrôles C07 et C08 (PRD 2.1) : documents alignés sur le PRD, qui fait foi,
// et skills identiques à la version relue (empreintes de skills-lock.json).
// Lancé en D1 et F6 sur l'ordinateur, et par la CI à chaque envoi.
//
//   node scripts/verifier-alignement.mjs
//
// Ce qui n'existe que sur l'ordinateur (mémoire de Claude, dossier client/ non
// versionné) est annoncé comme non vérifié en CI, jamais compté vert. Sur
// l'ordinateur, son absence est un échec.
// Rien à lire ne donne jamais un contrôle vert : repère introuvable, liste vide
// ou fichier manquant sont des échecs lisibles.
// Affiche ✅/❌ par contrôle. Code de sortie 1 au moindre échec.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
// GITHUB_ACTIONS n'est défini que par GitHub : un CI=true posé ailleurs ne
// peut pas faire sauter les contrôles propres à l'ordinateur.
const EN_CI = process.env.GITHUB_ACTIONS === "true";
// Dossier de Claude Code pour ce projet : chemin absolu du dépôt, chaque
// caractère non alphanumérique remplacé par « - ».
const MEMOIRE = join(
  ".claude/projects",
  RACINE.replace(/[^A-Za-z0-9]/g, "-"),
  "memory/projet-tsr66.md"
);
const DOSSIER_CHECKLIST = "docs/checklist";
const HORS_DEPOT = ["client/LISEZMOI.md"]; // client/ n'est jamais versionné (PRD 2.1)

const resultats = [];
const nonVerifies = [];
function verifier(condition, message) {
  resultats.push([Boolean(condition), message]);
}
const suite = (liste) => (liste.length ? ` → ${liste.join(", ")}` : "");
const toutes = (texte, regex) => [...texte.matchAll(regex)];
const unAN = (lettre, n) =>
  Array.from({ length: n }, (_, i) => `${lettre}${i + 1}`);

// Un fichier manquant est un échec lisible, pas un arrêt du script.
function lire(chemin) {
  if (existsSync(join(RACINE, chemin))) {
    return readFileSync(join(RACINE, chemin), "utf8");
  }
  verifier(false, `${chemin} : introuvable`);
  return "";
}
// Portion de texte entre deux repères. Un repère renommé est un échec : sinon
// la portion serait vide et les contrôles qui la lisent passeraient à vide.
function entre(texte, debut, fin) {
  const i = texte.indexOf(debut);
  const j = i < 0 ? -1 : texte.indexOf(fin, i + debut.length);
  if (j < 0) {
    verifier(false, `repère introuvable : « ${i < 0 ? debut : fin} »`);
    return "";
  }
  return texte.slice(i, j);
}

const docs = {};
for (const chemin of [
  "docs/PRD.md",
  "docs/ROADMAP.md",
  "docs/DETTES.md",
  "CLAUDE.md",
  "client/LISEZMOI.md",
  `${DOSSIER_CHECKLIST}/LISEZMOI.md`,
  `${DOSSIER_CHECKLIST}/1-demarrage.md`,
  `${DOSSIER_CHECKLIST}/2-fin-de-session.md`,
  `${DOSSIER_CHECKLIST}/3-fin-de-lot.md`,
  `${DOSSIER_CHECKLIST}/4-controles-du-site.md`,
  `${DOSSIER_CHECKLIST}/historique.md`,
  `${DOSSIER_CHECKLIST}/sessions/MODELE_RAPPORT.md`,
]) {
  if (EN_CI && HORS_DEPOT.includes(chemin)) continue;
  docs[chemin] = lire(chemin);
}
if (EN_CI) {
  nonVerifies.push(
    `${HORS_DEPOT.join(", ")} : hors dépôt, vérifié sur l'ordinateur`
  );
}
const prd = docs["docs/PRD.md"];
const roadmap = docs["docs/ROADMAP.md"];
const checklist = Object.entries(docs)
  .filter(([chemin]) => chemin.startsWith(DOSSIER_CHECKLIST))
  .map(([, texte]) => texte)
  .join("");
let memoire = null;
if (existsSync(join(homedir(), MEMOIRE))) {
  memoire = readFileSync(join(homedir(), MEMOIRE), "utf8");
} else if (EN_CI) {
  nonVerifies.push(
    "mémoire de Claude : absente en CI (termes obsolètes et faits comparés au PRD, vérifiés sur l'ordinateur)"
  );
} else {
  verifier(false, `mémoire de Claude introuvable (~/${MEMOIRE})`);
}

// 1. Termes obsolètes (les négations explicites sont tolérées)
const OBSOLETES = {
  Astro: /\bAstro\b/,
  "Netlify Forms": /Netlify Forms/,
  "contact@": /contact@/,
  "/fin-session": /\/fin-session/,
  recall: /\brecall\b/,
  Plausible: /Plausible/,
  Matomo: /Matomo/,
};
const NEGATIONS = [
  /pas de contact@/g,
  /sans `recall`/g,
  /\*\*obsolète\*\* \(Astro[^)]*\)/g,
];
function obsoletes(texte) {
  const nettoye = NEGATIONS.reduce((t, regex) => t.replace(regex, ""), texte);
  return Object.keys(OBSOLETES).filter((terme) =>
    OBSOLETES[terme].test(nettoye)
  );
}
for (const [chemin, texte] of Object.entries(docs)) {
  const liste = obsoletes(texte);
  verifier(!liste.length, `${chemin} : aucun terme obsolète${suite(liste)}`);
}
if (memoire !== null) {
  const liste = obsoletes(memoire);
  verifier(
    !liste.length,
    `mémoire projet : aucun terme obsolète${suite(liste)}`
  );
}

// 2. Carte des documents : chaque document cité existe
const carte = toutes(
  entre(prd, "**Carte des documents**", "### 2.2"),
  /^\| `([^`]+)` \|/gm
).map(([, chemin]) => chemin);
verifier(carte.length > 0, `carte 2.1 : ${carte.length} documents listés`);
for (const chemin of carte) {
  if (EN_CI && HORS_DEPOT.includes(chemin)) continue;
  verifier(existsSync(join(RACINE, chemin)), `carte 2.1 : ${chemin} existe`);
}

// 3. Renvois de la roadmap vers le PRD
const sections = new Set(
  toutes(prd, /^#{2,3} (\d+(?:\.\d+)?)/gm).map(([, n]) => n)
);
const renvois = new Set([
  ...toutes(roadmap, /PRD (\d+(?:\.\d+)?)/g).map(([, n]) => n),
  ...toutes(roadmap, / et (\d+\.\d+)\)/g).map(([, n]) => n),
]);
const introuvables = [...renvois].filter((n) => !sections.has(n)).sort();
verifier(
  renvois.size > 0 && !introuvables.length,
  `ROADMAP : ${renvois.size} renvois au PRD valides${suite(introuvables)}`
);

// 4. Fiches de checklist (dossier docs/checklist/)
const titresFiches = new Map(
  toutes(
    docs[`${DOSSIER_CHECKLIST}/1-demarrage.md`] +
      docs[`${DOSSIER_CHECKLIST}/2-fin-de-session.md`],
    /\*\*([DF]\d+) — (.+?)\*\*/g
  ).map(([, fiche, titre]) => [fiche, titre])
);
const fiches = new Set(titresFiches.keys());
const attendues = [...unAN("D", 7), ...unAN("F", 6)];
verifier(
  fiches.size === attendues.length && attendues.every((f) => fiches.has(f)),
  `checklist : ${attendues.length} fiches D1–D7 / F1–F6 (${fiches.size})`
);
const section23 = entre(prd, "### 2.3", "## 3.");
verifier(
  [...titresFiches].every(([fiche, titre]) =>
    section23.includes(`${fiche} ${titre}`)
  ),
  "PRD 2.3 : titres des fiches identiques au dossier checklist"
);
verifier(
  !/\*\*[DF]\d+ — /.test(prd),
  "PRD : fiches non dupliquées (détail uniquement dans docs/checklist/)"
);
const pointsLot = new Set(
  toutes(docs[`${DOSSIER_CHECKLIST}/3-fin-de-lot.md`], /^\| (L\d+) — /gm).map(
    ([, l]) => l
  )
);
verifier(
  pointsLot.size === 7 && unAN("L", 7).every((l) => pointsLot.has(l)),
  `fin de lot : L1 à L7 (${pointsLot.size})`
);
const texteRegistre = docs[`${DOSSIER_CHECKLIST}/4-controles-du-site.md`];
const registre = toutes(
  texteRegistre,
  /^\| (C\d\d) \| .+? \| ([^|]+) \| (🤖|👁) \| (⬜|✅|🔴) \|/gmu
);
const numeros = registre.map(([, n]) => n);
// Toute ligne de contrôle doit être lue : une ligne mal formée (état ou type
// inconnu) échapperait sinon à tous les contrôles du registre.
const lignesRegistre = toutes(texteRegistre, /^\| (C\d\d) \|/gm).map(
  ([, n]) => n
);
const malFormees = lignesRegistre.filter((n) => !numeros.includes(n));
verifier(
  !malFormees.length,
  `registre : chaque ligne lue (numéro, PRD, type, état)${suite(malFormees)}`
);
// 45 contrôles aujourd'hui : moins de 40 signale un registre tronqué.
verifier(
  numeros.length === new Set(numeros).size && numeros.length >= 40,
  `registre : ${numeros.length} contrôles, numéros uniques`
);
const sansRenvoi = registre.flatMap(([, n, refs]) =>
  refs
    .trim()
    .split(/,\s*/)
    .filter((r) => !sections.has(r) && !fiches.has(r))
    .map(() => n)
);
verifier(
  !sansRenvoi.length,
  `registre : chaque contrôle renvoie à une section du PRD ou à une fiche${suite(sansRenvoi)}`
);
const modele = docs[`${DOSSIER_CHECKLIST}/sessions/MODELE_RAPPORT.md`];
verifier(
  [...pointsLot].every((l) => modele.includes(`| ${l} `)) &&
    modele.includes("4-controles-du-site.md"),
  "modèle de rapport : fin de lot et registre prévus"
);
const finDeSession = docs[`${DOSSIER_CHECKLIST}/2-fin-de-session.md`];
verifier(
  finDeSession.includes("historique.md") &&
    finDeSession.includes("4-controles-du-site.md"),
  "F1/F6 : registre rejoué et historique complété"
);
for (const chemin of [
  `${DOSSIER_CHECKLIST}/sessions/MODELE_RAPPORT.md`,
  "CLAUDE.md",
  "docs/ROADMAP.md",
  `${DOSSIER_CHECKLIST}/LISEZMOI.md`,
]) {
  const inconnues = toutes(docs[chemin], /\b([DF]\d+)\b/g)
    .map(([, f]) => f)
    .filter((f) => !fiches.has(f));
  verifier(
    !inconnues.length,
    `${chemin} : fiches citées existantes${suite([...new Set(inconnues)])}`
  );
}
const controlesAbsents = [
  ...new Set(toutes(roadmap + prd, /\b(C\d\d)\b/g).map(([, c]) => c)),
].filter((c) => !numeros.includes(c));
verifier(
  !controlesAbsents.length,
  `contrôles C cités dans le PRD et la roadmap : existants${suite(controlesAbsents)}`
);

// 5. Chaque skill retenu a un usage défini. Liste écrite ici exprès : un skill
// retiré du PRD par erreur est ainsi détecté.
const RETENUS = [
  "git-workflow-and-versioning",
  "supply-chain-risk-auditor",
  "setup-pre-commit",
  "code-review",
  "secret-scanning",
  "netlify-deploy",
  "security-and-hardening",
  "web-quality-skills",
  "seo-audit",
  "ai-seo",
  "seo-local",
  "vercel-react-best-practices",
  "pr-review-toolkit",
  "claude-security",
];
const listeSkills = entre(prd, "- **Skills et plugins retenus**", "### 2.2");
const horsListe = prd.replace(listeSkills, "") + checklist;
for (const skill of RETENUS) {
  verifier(
    listeSkills.includes(`\`${skill}\``) && horsListe.includes(skill),
    `skill ${skill} : retenu au PRD, usage défini hors de la liste`
  );
}

// 6. Logique d'ordre de la roadmap
const lots = toutes(roadmap, /^## Lot (\d+)/gm).map((m) => [m[1], m.index]);
function lotDe(texte) {
  const position = roadmap.indexOf(texte);
  if (position < 0) return null;
  return lots.filter(([, debut]) => debut <= position).at(-1)?.[0] ?? null;
}
verifier(
  lotDe("Achat de tsr66.fr") === "0",
  "achat du domaine au Lot 0 (avant Resend au Lot 4)"
);
verifier(
  lotDe("confirmé dans Resend") === "4",
  "Resend au Lot 4, après l'achat du domaine"
);
verifier(
  lotDe("sitemap automatique") === "3",
  "sitemap au Lot 3, avec les pages publiques"
);
verifier(lotDe("IndexNow") === "5", "IndexNow au Lot 5, sur le vrai domaine");
verifier(
  lotDe("Fiche « Mon espace TSR66 »") === "4",
  "fiche « Mon espace » au Lot 4, portail complet"
);
verifier(
  lotDe("Portail `tsr66.fr/espace`") === "2" &&
    lotDe("Rappel en moins de 30 min") === "4",
  "horaires (Lot 2) avant le bouton de rappel (Lot 4)"
);

// 7. Cohérences transverses du PRD
const occurrences = (texte, motif) => texte.split(motif).length - 1;
verifier(
  prd.includes("Seul tsr66.fr est indexable") &&
    roadmap.includes("non indexables"),
  "indexation : seul tsr66.fr (PRD 4.2 et roadmap)"
);
verifier(
  occurrences(prd, "clics sur « Appeler »") >= 2 &&
    prd.includes("clic compté anonymement"),
  "mesure des appels cohérente (1.5, 3.4, 4.1, 6.2)"
);
verifier(
  prd.includes("Coût visé : 0 €/mois") &&
    roadmap.includes("formules gratuites"),
  "coût et limites (PRD 6.1 et roadmap)"
);
verifier(
  checklist.includes("aucune page publique ne contacte") &&
    prd.includes("sur les pages publiques"),
  "« aucun site tiers » limité aux pages publiques"
);
verifier(
  prd.includes("Connexion avec son compte Google"),
  "portail : connexion Google (3.2)"
);
verifier(
  checklist.includes("Contrôle d'alignement automatique") &&
    checklist.includes("contrôle d'alignement des documents"),
  "alignement permanent (D1 et F6)"
);
verifier(
  ["docs/PRD.md", "docs/checklist/1-demarrage.md", "3-fin-de-lot.md"].every(
    (motif) => docs["CLAUDE.md"].includes(motif)
  ),
  "CLAUDE.md renvoie au PRD et au dossier checklist"
);
verifier(
  !Object.values(docs)
    .join("")
    .replaceAll("docs/checklist/sessions", "")
    .includes("docs/sessions"),
  "plus aucun renvoi à l'ancien dossier docs/sessions"
);
if (!EN_CI) {
  verifier(
    docs["client/LISEZMOI.md"].includes("section 7.2"),
    "client/LISEZMOI.md renvoie au PRD 7.2"
  );
}
const gitignore = lire(".gitignore");
verifier(
  gitignore.includes("/client/") && gitignore.includes(".env*"),
  ".gitignore : client/ et secrets ignorés"
);

// 8. Faits identiques partout
const FAITS = {
  téléphone: "06 26 57 15 21",
  "e-mail": "t.s.r.66moreau@gmail.com",
  SIRET: "847 691 672 00012",
  domaine: "tsr66.fr",
  adresse: "11 rue des Macabeus",
};
for (const [nom, fait] of Object.entries(FAITS)) {
  if (memoire === null) {
    verifier(prd.includes(fait), `fait « ${nom} » présent dans le PRD`);
  } else {
    verifier(
      prd.includes(fait) && memoire.includes(fait),
      `fait « ${nom} » identique PRD / mémoire`
    );
  }
}

// 9. Skills : fichiers installés identiques à la version relue (C08).
// Les skills déclarés sont exactement ceux du PRD 2.1 : vider le fichier
// d'empreintes et les dossiers ne donne pas un contrôle vert.
const SKILLS = join(RACINE, ".claude/skills");
const DOSSIERS_DU_PRD = new Set(
  listeSkills
    .split("\n")
    .filter((ligne) => /^ {2}- `/.test(ligne))
    .flatMap((ligne) => {
      const renomme = ligne.match(/installé sous le nom `([^`]+)`/);
      if (renomme) return [renomme[1]];
      if (ligne.includes("` : `")) {
        return toutes(ligne.split("` : ")[1], /`([^`]+)`/g).map(([, n]) => n);
      }
      return [ligne.match(/`([^`]+)`/)[1]];
    })
);
let verrou = {};
try {
  verrou = JSON.parse(lire(".claude/skills/skills-lock.json") || "{}").skills;
} catch {
  verifier(false, ".claude/skills/skills-lock.json : illisible");
}
if (typeof verrou !== "object" || verrou === null) verrou = {};
const declares = Object.keys(verrou);
// Noms simples uniquement : un nom avec « .. » ou « / » en tête ferait lire un
// fichier hors du dossier des skills.
const nomSur = (chemin) =>
  chemin
    .split("/")
    .every((partie) => /^[\w.-]+$/.test(partie) && !/^\.\.?$/.test(partie));
const empreinte = (chemin) =>
  createHash("sha256").update(readFileSync(chemin)).digest("hex");
const ecarts = [];
let nombre = 0;
for (const skill of declares) {
  const fichiers = verrou[skill]?.files ?? {};
  for (const [fichier, attendu] of Object.entries(fichiers)) {
    nombre += 1;
    const chemin = join(SKILLS, skill, fichier);
    if (!nomSur(`${skill}/${fichier}`)) {
      ecarts.push(`nom refusé : ${skill}/${fichier}`);
    } else if (!existsSync(chemin) || empreinte(chemin) !== attendu) {
      ecarts.push(`${skill}/${fichier}`);
    }
  }
}
// Parcours sans suivre les liens symboliques : un lien, ou tout ce qui n'est
// ni dossier ni fichier ordinaire, est un écart.
const installes = [];
function parcourir(dossier, relatif) {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = relatif ? `${relatif}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!relatif) installes.push(e.name);
      parcourir(join(dossier, e.name), chemin);
    } else if (!e.isFile()) {
      ecarts.push(`ni fichier ni dossier : ${chemin}`);
    } else if (!relatif) {
      if (!["skills-lock.json", "PROVENANCE.md"].includes(e.name)) {
        ecarts.push(`en trop : ${chemin}`);
      }
    } else {
      const [skill, ...reste] = chemin.split("/");
      const fichiers = Object.hasOwn(verrou, skill) ? verrou[skill].files : {};
      if (!Object.hasOwn(fichiers ?? {}, reste.join("/"))) {
        ecarts.push(`en trop : ${chemin}`);
      }
    }
  }
}
if (existsSync(SKILLS)) parcourir(SKILLS, "");
const nonDeclares = installes.filter((s) => !declares.includes(s)).sort();
const manquants = declares.filter((s) => !installes.includes(s)).sort();
const horsPrd = [
  ...declares
    .filter((s) => !DOSSIERS_DU_PRD.has(s))
    .map((s) => `${s} (absent du PRD)`),
  ...[...DOSSIERS_DU_PRD]
    .filter((s) => !declares.includes(s))
    .map((s) => `${s} (non déclaré)`),
].sort();
verifier(
  nombre > 0 &&
    !ecarts.length &&
    !nonDeclares.length &&
    !manquants.length &&
    !horsPrd.length,
  `skills : ${nombre} fichiers conformes aux empreintes, ${declares.length} skills du PRD 2.1` +
    (ecarts.length ? ` → écarts ${ecarts.slice(0, 5).join(", ")}` : "") +
    (nonDeclares.length ? ` → dossiers non déclarés ${nonDeclares}` : "") +
    (manquants.length ? ` → dossiers manquants ${manquants}` : "") +
    (horsPrd.length ? ` → écart avec le PRD ${horsPrd.join(", ")}` : "")
);

for (const [bon, message] of resultats) {
  console.log(`${bon ? "✅" : "❌"} ${message}`);
}
for (const message of nonVerifies) console.log(`⏭️  ${message}`);
const echecs = resultats.filter(([bon]) => !bon).length;
console.log(
  `\n${resultats.length - echecs}/${resultats.length} contrôles OK` +
    (nonVerifies.length ? ` · ${nonVerifies.length} non vérifiés ici` : "")
);
process.exit(echecs ? 1 : 0);

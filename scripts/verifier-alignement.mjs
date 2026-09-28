// Contrôles C07 et C08 (PRD 2.1) : documents alignés sur le PRD, qui fait foi,
// et skills identiques à la version relue (empreintes de skills-lock.json).
// Lancé en D1 et F6 sur l'ordinateur, et par la CI à chaque envoi.
//
//   node scripts/verifier-alignement.mjs
//
// La mémoire de Claude (hors dépôt) n'existe que sur l'ordinateur : en CI, les
// contrôles qui la lisent sont annoncés comme non vérifiés, jamais comptés verts.
// Sur l'ordinateur, une mémoire introuvable est un échec.
// Affiche ✅/❌ par contrôle. Code de sortie 1 au moindre échec.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const EN_CI = process.env.CI === "true";
// Dossier de Claude Code pour ce projet : chemin absolu du dépôt, chaque
// caractère non alphanumérique remplacé par « - ».
const MEMOIRE = join(
  homedir(),
  ".claude/projects",
  RACINE.replace(/[^A-Za-z0-9]/g, "-"),
  "memory/projet-tsr66.md"
);
const CK = "docs/checklist";

const lire = (chemin) => readFileSync(join(RACINE, chemin), "utf8");
const resultats = [];
const nonVerifies = [];
function verifier(condition, message) {
  resultats.push([Boolean(condition), message]);
}
const entre = (texte, debut, fin) =>
  texte.slice(texte.indexOf(debut), texte.indexOf(fin));
const toutes = (texte, regex) => [...texte.matchAll(regex)];

const docs = Object.fromEntries(
  [
    "docs/PRD.md",
    "docs/ROADMAP.md",
    "docs/DETTES.md",
    "CLAUDE.md",
    "client/LISEZMOI.md",
    `${CK}/LISEZMOI.md`,
    `${CK}/1-demarrage.md`,
    `${CK}/2-fin-de-session.md`,
    `${CK}/3-fin-de-lot.md`,
    `${CK}/4-controles-du-site.md`,
    `${CK}/historique.md`,
    `${CK}/sessions/MODELE_RAPPORT.md`,
  ].map((chemin) => {
    // Un document manquant est un échec lisible, pas un arrêt du script.
    if (existsSync(join(RACINE, chemin))) return [chemin, lire(chemin)];
    verifier(false, `${chemin} : introuvable`);
    return [chemin, ""];
  })
);
const prd = docs["docs/PRD.md"];
const roadmap = docs["docs/ROADMAP.md"];
const checklist = Object.entries(docs)
  .filter(([chemin]) => chemin.startsWith(CK))
  .map(([, texte]) => texte)
  .join("");
let memoire = null;
if (existsSync(MEMOIRE)) memoire = readFileSync(MEMOIRE, "utf8");
else if (EN_CI) nonVerifies.push("mémoire de Claude : absente en CI");
else verifier(false, `mémoire de Claude introuvable (${MEMOIRE})`);

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
const trouves = (liste) => (liste.length ? ` → ${liste.join(", ")}` : "");
for (const [chemin, texte] of Object.entries(docs)) {
  const liste = obsoletes(texte);
  verifier(!liste.length, `${chemin} : aucun terme obsolète${trouves(liste)}`);
}
if (memoire !== null) {
  const liste = obsoletes(memoire);
  verifier(
    !liste.length,
    `mémoire projet : aucun terme obsolète${trouves(liste)}`
  );
}

// 2. Carte des documents : chaque document cité existe
const carte = entre(prd, "**Carte des documents**", "### 2.2");
for (const [, chemin] of toutes(carte, /^\| `([^`]+)` \|/gm)) {
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
  !introuvables.length,
  `ROADMAP : ${renvois.size} renvois au PRD valides` +
    (introuvables.length ? ` → introuvables ${introuvables.join(", ")}` : "")
);

// 4. Fiches de checklist (dossier docs/checklist/)
const titresFiches = new Map(
  toutes(
    docs[`${CK}/1-demarrage.md`] + docs[`${CK}/2-fin-de-session.md`],
    /\*\*([DF]\d) — (.+?)\*\*/g
  ).map(([, fiche, titre]) => [fiche, titre])
);
const fiches = new Set(titresFiches.keys());
const attendues = [
  ...Array.from({ length: 7 }, (_, i) => `D${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `F${i + 1}`),
];
verifier(
  fiches.size === attendues.length && attendues.every((f) => fiches.has(f)),
  `checklist : 13 fiches D1–D7 / F1–F6 (${fiches.size})`
);
const section23 = entre(prd, "### 2.3", "## 3.");
verifier(
  [...titresFiches].every(([fiche, titre]) =>
    section23.includes(`${fiche} ${titre}`)
  ),
  "PRD 2.3 : titres des fiches identiques au dossier checklist"
);
verifier(
  !/\*\*[DF]\d — /.test(prd),
  "PRD : fiches non dupliquées (détail uniquement dans docs/checklist/)"
);
const pointsLot = new Set(
  toutes(docs[`${CK}/3-fin-de-lot.md`], /^\| (L\d) — /gm).map(([, l]) => l)
);
verifier(
  pointsLot.size === 7 &&
    Array.from({ length: 7 }, (_, i) => `L${i + 1}`).every((l) =>
      pointsLot.has(l)
    ),
  `fin de lot : L1 à L7 (${pointsLot.size})`
);
const registre = toutes(
  docs[`${CK}/4-controles-du-site.md`],
  /^\| (C\d\d) \| .+? \| ([^|]+) \| (🤖|👁) \| (⬜|✅|🔴) \|/gmu
);
const numeros = registre.map(([, n]) => n);
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
  "registre : chaque contrôle renvoie à une section du PRD ou à une fiche" +
    (sansRenvoi.length ? ` → ${sansRenvoi.join(", ")}` : "")
);
const modele = docs[`${CK}/sessions/MODELE_RAPPORT.md`];
verifier(
  [...pointsLot].every((l) => modele.includes(`| ${l} `)) &&
    modele.includes("4-controles-du-site.md"),
  "modèle de rapport : fin de lot et registre prévus"
);
const finDeSession = docs[`${CK}/2-fin-de-session.md`];
verifier(
  finDeSession.includes("historique.md") &&
    finDeSession.includes("4-controles-du-site.md"),
  "F1/F6 : registre rejoué et historique complété"
);
for (const chemin of [
  `${CK}/sessions/MODELE_RAPPORT.md`,
  "CLAUDE.md",
  "docs/ROADMAP.md",
  `${CK}/LISEZMOI.md`,
]) {
  const citees = toutes(docs[chemin], /\b([DF][1-7])\b/g).map(([, f]) => f);
  verifier(
    citees.every((f) => fiches.has(f)),
    `${chemin} : fiches citées existantes`
  );
}
const controlesAbsents = [
  ...new Set(toutes(roadmap + prd, /\b(C\d\d)\b/g).map(([, c]) => c)),
].filter((c) => !numeros.includes(c));
verifier(
  !controlesAbsents.length,
  "contrôles C cités dans le PRD et la roadmap : existants" +
    (controlesAbsents.length ? ` → ${controlesAbsents.join(", ")}` : "")
);

// 5. Chaque skill retenu a un usage défini
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
const horsListe =
  prd.replace(entre(prd, "- **Skills et plugins retenus**", "### 2.2"), "") +
  checklist;
for (const skill of RETENUS) {
  verifier(
    horsListe.includes(skill),
    `skill ${skill} : usage défini hors de la liste`
  );
}

// 6. Logique d'ordre de la roadmap
const lots = toutes(roadmap, /^## Lot (\d)/gm).map((m) => [m[1], m.index]);
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
verifier(
  docs["client/LISEZMOI.md"].includes("section 7.2"),
  "client/LISEZMOI.md renvoie au PRD 7.2"
);
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
// Tout fichier présent et non déclaré (y compris caché) est un écart.
const SKILLS = join(RACINE, ".claude/skills");
const verrou = JSON.parse(lire(".claude/skills/skills-lock.json")).skills;
const empreinte = (chemin) =>
  createHash("sha256").update(readFileSync(chemin)).digest("hex");
const ecarts = Object.entries(verrou).flatMap(([skill, { files }]) =>
  Object.entries(files)
    .filter(([fichier, attendu]) => {
      const chemin = join(SKILLS, skill, fichier);
      return !existsSync(chemin) || empreinte(chemin) !== attendu;
    })
    .map(([fichier]) => `${skill}/${fichier}`)
);
const entrees = readdirSync(SKILLS, { withFileTypes: true, recursive: true });
const installes = entrees
  .filter((e) => e.isDirectory() && e.parentPath === SKILLS)
  .map((e) => e.name);
for (const e of entrees.filter((e) => !e.isDirectory())) {
  const chemin = relative(SKILLS, join(e.parentPath, e.name));
  if (chemin === "skills-lock.json" || chemin === "PROVENANCE.md") continue;
  const [skill, ...reste] = chemin.split("/");
  if (!(reste.join("/") in (verrou[skill]?.files ?? {}))) {
    ecarts.push(`en trop : ${chemin}`);
  }
}
const declares = Object.keys(verrou);
const nonDeclares = installes.filter((s) => !declares.includes(s)).sort();
const manquants = declares.filter((s) => !installes.includes(s)).sort();
const nombre = Object.values(verrou).reduce(
  (total, { files }) => total + Object.keys(files).length,
  0
);
verifier(
  !ecarts.length && !nonDeclares.length && !manquants.length,
  `skills : ${nombre} fichiers conformes aux empreintes` +
    (ecarts.length ? ` → écarts ${ecarts.slice(0, 5).join(", ")}` : "") +
    (nonDeclares.length ? ` → dossiers non déclarés ${nonDeclares}` : "") +
    (manquants.length ? ` → dossiers manquants ${manquants}` : "")
);

for (const [bon, message] of resultats) {
  console.log(`${bon ? "✅" : "❌"} ${message}`);
}
for (const message of nonVerifies) console.log(`⏭️  ${message}`);
const echecs = resultats.filter(([bon]) => !bon).length;
console.log(
  `\n${resultats.length - echecs}/${resultats.length} contrôles OK` +
    (nonVerifies.length ? ` · ${nonVerifies.length} non vérifié ici` : "")
);
process.exit(echecs ? 1 : 0);

// Tests des contrôles C07 (documents alignés sur le PRD), C08 (skills
// identiques à la version relue) et C02 (client/ et .env jamais suivis) :
// scripts/verifier-alignement.mjs, lancé sur des copies jetables abîmées.
// Les copies sont vérifiées comme en CI (mémoire de Claude et client/ absents).

import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  accepte,
  copieDuDepot,
  dossierJetable,
  ecrire,
  git,
  lancer,
  lire,
  refuse,
  remplacer,
} from "./outils.mjs";

function verifierAlignement(copie, env = { GITHUB_ACTIONS: "true" }) {
  return lancer(
    process.execPath,
    [join(copie, "scripts/verifier-alignement.mjs")],
    { cwd: copie, env: { GITHUB_ACTIONS: undefined, CI: undefined, ...env } }
  );
}

const VERROU = ".claude/skills/skills-lock.json";
const modifierVerrou = (copie, modification) => {
  const verrou = JSON.parse(lire(copie, VERROU));
  modification(verrou.skills);
  ecrire(copie, VERROU, JSON.stringify(verrou, null, 2));
};
const empreinte = (texte) => createHash("sha256").update(texte).digest("hex");

test("copie non abîmée : acceptée (ce qui est hors dépôt annoncé non vérifié)", async (t) => {
  const resultat = await verifierAlignement(await copieDuDepot(t));
  accepte(resultat);
  assert.match(resultat.sortie, /⏭️ {2}client\/LISEZMOI\.md : hors dépôt/);
});

// 1. Documents (C07). [nom, fichier, avant, après, message attendu]
for (const [nom, fichier, avant, apres, attendu] of [
  [
    "terme obsolète dans la roadmap",
    "docs/ROADMAP.md",
    "## Lot 1",
    "Astro\n\n## Lot 1",
    "docs/ROADMAP.md : aucun terme obsolète → Astro",
  ],
  [
    "repère du PRD renommé (lecture à vide)",
    "docs/PRD.md",
    "**Carte des documents**",
    "**Carte**",
    "repère introuvable : « **Carte des documents** »",
  ],
  [
    "document de la carte introuvable",
    "docs/PRD.md",
    "| `docs/DETTES.md` |",
    "| `docs/INEXISTANT.md` |",
    "carte 2.1 : docs/INEXISTANT.md existe",
  ],
  [
    "renvoi de la roadmap vers une section absente du PRD",
    "docs/ROADMAP.md",
    "(PRD 5.1)",
    "(PRD 9.1)",
    /ROADMAP : \d+ renvois au PRD valides → 9\.1/,
  ],
  [
    "titre de fiche différent entre le PRD et la checklist",
    "docs/PRD.md",
    "D2 Fixer l'objectif de la session",
    "D2 Fixer l'objectif",
    "PRD 2.3 : titres des fiches identiques",
  ],
  [
    "fiche recopiée dans le PRD",
    "docs/PRD.md",
    "### 2.3 Checklist",
    "### 2.3 Checklist\n**D1 — Reprendre le contexte**",
    "PRD : fiches non dupliquées",
  ],
  [
    "fiche de démarrage renumérotée",
    "docs/checklist/1-demarrage.md",
    "**D7 — ",
    "**D8 — ",
    "checklist : 13 fiches D1–D7 / F1–F6",
  ],
  [
    "point de fin de lot manquant",
    "docs/checklist/3-fin-de-lot.md",
    "| L7 — ",
    "| L8 — ",
    "fin de lot : L1 à L7",
  ],
  [
    "ligne du registre mal formée (état inconnu)",
    "docs/checklist/4-controles-du-site.md",
    "| 5.1 | 👁 | ⬜ |",
    "| 5.1 | 👁 | 🟡 |",
    "registre : chaque ligne lue (numéro, PRD, type, état) → | C17",
  ],
  [
    "ligne du registre cachée par la mise en forme",
    "docs/checklist/4-controles-du-site.md",
    "| C62 |",
    "| **C62** |",
    "registre : chaque ligne lue (numéro, PRD, type, état) → | **C62**",
  ],
  [
    "numéro de contrôle en double",
    "docs/checklist/4-controles-du-site.md",
    "| C62 |",
    "| C61 |",
    /registre : \d+ contrôles, numéros uniques/,
  ],
  [
    "contrôle sans renvoi valide",
    "docs/checklist/4-controles-du-site.md",
    "| 5.1 | 👁 | ⬜ |",
    "| 9.9 | 👁 | ⬜ |",
    "registre : chaque contrôle renvoie à une section du PRD ou à une fiche → C17",
  ],
  [
    "contrôle cité dans la roadmap mais absent du registre",
    "docs/ROADMAP.md",
    "## Lot 1",
    "C99\n\n## Lot 1",
    "contrôles C cités dans le PRD et la roadmap : existants → C99",
  ],
  [
    "fiche citée inexistante",
    "CLAUDE.md",
    "(`docs/checklist/1-demarrage.md`, D1 à D7)",
    "(`docs/checklist/1-demarrage.md`, D1 à D9)",
    "CLAUDE.md : fiches citées existantes → D9",
  ],
  [
    "skill retiré du PRD",
    "docs/PRD.md",
    "  - `seo-local`\n",
    "",
    "skill seo-local : retenu au PRD",
  ],
  [
    "achat du domaine sorti du Lot 0",
    "docs/ROADMAP.md",
    "**Achat de tsr66.fr au nom du client**",
    "**Achat du domaine**",
    "achat du domaine au Lot 0",
  ],
  [
    "CLAUDE.md ne renvoie plus au PRD",
    "CLAUDE.md",
    "docs/PRD.md",
    "docs/CDC.md",
    "CLAUDE.md renvoie au PRD et au dossier checklist",
  ],
  [
    "renvoi à l'ancien dossier des rapports",
    "docs/ROADMAP.md",
    "## Lot 1",
    "docs/sessions/2026-09-27.md\n\n## Lot 1",
    "plus aucun renvoi à l'ancien dossier docs/sessions",
  ],
  [
    ".gitignore ne protège plus client/",
    ".gitignore",
    "/client/\n",
    "",
    ".gitignore : client/ et secrets ignorés",
  ],
  [
    "version de gitleaks différente dans le README",
    "README.md",
    "gitleaks) 8.30.1",
    "gitleaks) 8.31.0",
    "version de gitleaks identique (crochets, CI, README) : 8.30.1, 8.31.0",
  ],
  [
    "seconde version de gitleaks dans les crochets",
    ".githooks/_commun.sh",
    'GITLEAKS_VERSION="8.30.1"',
    'GITLEAKS_VERSION="8.30.1"\nGITLEAKS_VERSION="8.31.0"',
    "version de gitleaks identique (crochets, CI, README) : 8.30.1, 8.31.0",
  ],
  [
    "version de gitleaks introuvable dans la CI",
    ".github/workflows/ci.yml",
    'GITLEAKS_VERSION: "8.30.1"',
    'VERSION_GITLEAKS: "8.30.1"',
    "version de gitleaks identique (crochets, CI, README) : 8.30.1, ? (.github/workflows/ci.yml)",
  ],
]) {
  test(`refus : ${nom}`, async (t) => {
    const copie = await copieDuDepot(t);
    remplacer(copie, fichier, avant, apres);
    refuse(
      await verifierAlignement(copie),
      typeof attendu === "string"
        ? `❌ ${attendu}`
        : new RegExp(`❌ ${attendu.source}`)
    );
  });
}

test("refus : registre tronqué", async (t) => {
  const copie = await copieDuDepot(t);
  const registre = "docs/checklist/4-controles-du-site.md";
  const texte = lire(copie, registre);
  ecrire(copie, registre, texte.slice(0, texte.indexOf("## Lot 3")));
  refuse(
    await verifierAlignement(copie),
    /❌ registre : \d+ contrôles, numéros uniques/
  );
});

test("refus : fait du PRD modifié (téléphone)", async (t) => {
  const copie = await copieDuDepot(t);
  remplacer(copie, "docs/PRD.md", "06 26 57 15 21", "06 00 00 00 00", {
    partout: true,
  });
  refuse(
    await verifierAlignement(copie),
    "❌ fait « téléphone » présent dans le PRD"
  );
});

test("refus : document manquant", async (t) => {
  const copie = await copieDuDepot(t);
  unlinkSync(join(copie, "docs/DETTES.md"));
  refuse(await verifierAlignement(copie), "❌ docs/DETTES.md : introuvable");
});

// 2. client/ et .env jamais suivis (C02).
for (const fichier of [
  ".env.local",
  "src/.env.production",
  "client/photo.txt",
  "Client/photo.txt",
]) {
  test(`refus : ${fichier} suivi par git (ajouté de force)`, async (t) => {
    const copie = await copieDuDepot(t);
    ecrire(copie, fichier, "valeur\n");
    await git(copie, "add", "-f", fichier);
    refuse(
      await verifierAlignement(copie),
      `C02 : aucun fichier de client/ ni .env suivi par git → ${fichier}`
    );
  });
}

test("refus : git illisible (C02 jamais vert à vide)", async (t) => {
  const copie = await copieDuDepot(t, { avecGit: false });
  refuse(await verifierAlignement(copie), "→ git illisible");
});

// 3. Skills identiques à la version relue (C08).
const SKILL = ".claude/skills/seo";
for (const [nom, abimer, attendu] of [
  [
    "fichier de skill modifié",
    (c) =>
      writeFileSync(join(c, SKILL, "SKILL.md"), "\nrègle ajoutée", {
        flag: "a",
      }),
    "écarts seo/SKILL.md",
  ],
  [
    "fichier en trop dans un skill",
    (c) => ecrire(c, `${SKILL}/ajout.md`, "x"),
    "en trop : seo/ajout.md",
  ],
  [
    "fichier en trop à la racine des skills",
    (c) => ecrire(c, ".claude/skills/ajout.md", "x"),
    "en trop : ajout.md",
  ],
  [
    "fichier de skill remplacé par un lien",
    (c) => {
      unlinkSync(join(c, SKILL, "SKILL.md"));
      symlinkSync("/etc/hosts", join(c, SKILL, "SKILL.md"));
    },
    "ni fichier ni dossier : seo/SKILL.md",
  ],
  [
    "dossier de skill supprimé",
    (c) => rmSync(join(c, SKILL), { recursive: true }),
    "dossiers manquants seo",
  ],
  [
    "dossier de skill non déclaré",
    (c) => ecrire(c, ".claude/skills/pirate/SKILL.md", "x"),
    "dossiers non déclarés pirate",
  ],
  [
    "empreintes vidées",
    (c) => modifierVerrou(c, (s) => Object.keys(s).forEach((k) => delete s[k])),
    "skills : 0 fichiers comparés",
  ],
  [
    "nom qui sort du dossier des skills",
    (c) =>
      modifierVerrou(
        c,
        (s) => (s.seo.files["../../../etc/hosts"] = "0".repeat(64))
      ),
    "nom refusé : seo/../../../etc/hosts",
  ],
  [
    "skill vidé (dossier et empreintes)",
    (c) => {
      rmSync(join(c, SKILL), { recursive: true });
      mkdirSync(join(c, SKILL));
      modifierVerrou(c, (s) => (s.seo.files = {}));
    },
    "seo : SKILL.md non déclaré",
  ],
  [
    "skill ajouté sans passer par le PRD",
    (c) => {
      ecrire(c, ".claude/skills/pirate/SKILL.md", "x");
      modifierVerrou(
        c,
        (s) => (s.pirate = { files: { "SKILL.md": empreinte("x") } })
      );
    },
    "pirate (absent du PRD)",
  ],
  [
    "dossier des skills remplacé par un lien",
    (c) => {
      renameSync(join(c, ".claude/skills"), join(c, "skills-ailleurs"));
      symlinkSync(join(c, "skills-ailleurs"), join(c, ".claude/skills"));
    },
    ".claude ou .claude/skills : absent ou lien symbolique",
  ],
]) {
  test(`refus : ${nom}`, async (t) => {
    const copie = await copieDuDepot(t);
    abimer(copie);
    refuse(await verifierAlignement(copie), attendu);
  });
}

// 4. Sur l'ordinateur, ce qui est hors dépôt est exigé : un CI=true posé par un
// outil ne le fait pas sauter.
for (const [nom, env] of [
  ["sur l'ordinateur", {}],
  ["CI=true posé par un outil", { CI: "true" }],
]) {
  test(`refus : mémoire de Claude et client/ absents ${nom}`, async (t) => {
    const copie = await copieDuDepot(t);
    const resultat = await verifierAlignement(copie, {
      HOME: dossierJetable(t),
      ...env,
    });
    refuse(resultat, "❌ mémoire de Claude introuvable");
    refuse(resultat, "❌ client/LISEZMOI.md : introuvable");
  });
}

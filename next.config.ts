import type { NextConfig } from "next";

// Seul tsr66.fr, en production, peut être indexé (PRD 4.2, contrôle C05).
// Netlify fournit CONTEXT et URL à la compilation ; partout ailleurs (aperçus,
// adresse de travail Netlify, ordinateur), les moteurs de recherche sont refusés.
const indexable =
  process.env.CONTEXT === "production" &&
  process.env.URL === "https://tsr66.fr";

const dev = process.env.NODE_ENV === "development";

// Seul le code de TSR66 s'exécute (PRD 6.3, contrôle C06). Next.js écrit deux
// petits scripts dans chaque page préparée à l'avance : les scripts de la page
// sont acceptés, tout script d'un autre site est bloqué (décision de Nicolas,
// 2026-09-28 : site rapide plutôt que pages fabriquées à chaque visite).
const politiqueDeContenu = [
  "default-src 'self'",
  // En développement seulement, React a besoin de « eval » pour ses messages d'erreur.
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const entetes = [
  { key: "Content-Security-Policy", value: politiqueDeContenu },
  // Le site ne peut pas être intégré dans une autre page (anciens navigateurs).
  { key: "X-Frame-Options", value: "DENY" },
  // Connexion toujours chiffrée : le navigateur retient HTTPS pendant 2 ans.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(indexable ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

const nextConfig: NextConfig = {
  // Ne pas annoncer la technologie du site dans les en-têtes HTTP.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: entetes }];
  },
};

export default nextConfig;

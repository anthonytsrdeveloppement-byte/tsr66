import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TSR66 — Terrassement",
  description: "Site de TSR66 en cours de construction.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

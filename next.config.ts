import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne pas annoncer la technologie du site dans les en-têtes HTTP.
  poweredByHeader: false,
};

export default nextConfig;

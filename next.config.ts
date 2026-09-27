import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  typedRoutes: true,
  eslint: {
    // Lint runs as its own step (`npm run lint`); skipping it here keeps
    // container builds lean.
    ignoreDuringBuilds: true
  }
};

export default nextConfig;

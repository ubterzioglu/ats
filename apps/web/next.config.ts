import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  typedRoutes: true,
  eslint: {
    // Lint runs as its own step (`npm run lint`); skipping it here keeps
    // container builds lean.
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    // transformers.js probes for its Node-only accelerator packages; the
    // browser bundle must resolve them to nothing instead of failing.
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false
    };
    return config;
  }
};

export default nextConfig;

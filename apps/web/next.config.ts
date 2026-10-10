import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  typedRoutes: true,
  eslint: {
    // Lint runs as its own step (`npm run lint`); skipping it here keeps
    // container builds lean.
    ignoreDuringBuilds: true
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      },
      {
        // Googlebot fetches fonts and chunks to render pages. noindex keeps
        // them out of the index reports without blocking that fetch the way
        // a robots.txt disallow would.
        source: "/_next/static/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }]
      }
    ];
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

export default withNextIntl(nextConfig);

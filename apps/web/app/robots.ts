import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

const BASE_PRIVATE_PATHS = ["/r/", "/api/", "/auth/", "/login", "/applications", "/admin"];

function buildPrivatePaths(): string[] {
  const paths = [...BASE_PRIVATE_PATHS];
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    for (const p of BASE_PRIVATE_PATHS) {
      paths.push(p === "/" ? `/${locale}` : `/${locale}${p}`);
    }
  }
  return paths;
}

const PRIVATE_PATHS = buildPrivatePaths();

const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot"
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE_PATHS }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}

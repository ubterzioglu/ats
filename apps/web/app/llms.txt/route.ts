import { getTranslations } from "next-intl/server";

import { getFeatureContent } from "@/lib/features/content";
import { FEATURE_SLUGS, featurePath } from "@/lib/features";
import { PUBLIC_PATHS, SITE_URL } from "@/lib/seo";
import { SITE_ENTITY } from "@/lib/site-entity";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });
  const home = await getTranslations({ locale: "en", namespace: "home" });
  const common = await getTranslations({ locale: "en", namespace: "common" });

  const PAGE_LABELS: Readonly<Record<string, string>> = {
    "/about": "About",
    "/privacy": "Privacy Notice",
    "/kvkk": "KVKK Notice",
    "/data-request": "Data Request",
    "/blog": "Blog",
    "/features": "Features overview",
    "/faq": "Frequently asked questions",
    "/ai-faq": "Full feature reference (Turkish, English, German)",
    "/quick-test": "Quick test"
  };
  const featureSlugPaths = new Set<string>(FEATURE_SLUGS.map(featurePath));

  const pageLinks = [
    `- [Home](${SITE_URL}/)`,
    ...PUBLIC_PATHS.filter((p) => p !== "/" && !featureSlugPaths.has(p)).map(
      (path) => `- [${PAGE_LABELS[path] ?? path}](${SITE_URL}${path})`
    )
  ].join("\n");

  const features = getFeatureContent("en");
  const featureLinks = FEATURE_SLUGS.map(
    (slug) => `- [${features[slug].title}](${SITE_URL}${featurePath(slug)}): ${features[slug].summary}`
  ).join("\n");

  const body = `# ATS readability

> ${metadata("description")}

${home("privacyTag")}

## Pages
${pageLinks}

## Features
${featureLinks}

## How it works
${home("how.body")}

## Languages
- English: ${SITE_URL}/
- Turkce: ${SITE_URL}/tr
- Deutsch: ${SITE_URL}/de

## Limits
${common("disclaimer")}

## Contact
${SITE_ENTITY.contactEmail}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

import { getTranslations } from "next-intl/server";

import { PUBLIC_PATHS, SITE_URL } from "@/lib/seo";
import { SITE_ENTITY } from "@/lib/site-entity";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });
  const home = await getTranslations({ locale: "en", namespace: "home" });
  const common = await getTranslations({ locale: "en", namespace: "common" });
  const nav = await getTranslations({ locale: "en", namespace: "nav" });
  const faq = await getTranslations({ locale: "en", namespace: "faq" });

  const pageLinks = [
    `- [${nav("home")}](${SITE_URL}/)`,
    ...PUBLIC_PATHS.filter((p) => p !== "/").map((path) => {
      const key = path === "/analyze" ? "analyze" : path === "/builder" ? "builder" : path === "/about" ? "about" : path;
      return `- [${nav(key)}](${SITE_URL}${path})`;
    }),
    `- [${faq("title")}](${SITE_URL}/#faq)`,
    `- [Privacy Notice](${SITE_URL}/privacy)`,
    `- [KVKK Notice](${SITE_URL}/kvkk)`,
    `- [Data Request](${SITE_URL}/data-request)`
  ].join("\n");

  const body = `# ATS readability

> ${metadata("description")}

${home("privacyTag")}

## Pages
${pageLinks}

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

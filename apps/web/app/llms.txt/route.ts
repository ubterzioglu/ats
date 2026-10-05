import { getTranslations } from "next-intl/server";

import { PUBLIC_PATHS, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });
  const home = await getTranslations({ locale: "en", namespace: "home" });
  const common = await getTranslations({ locale: "en", namespace: "common" });
  const nav = await getTranslations({ locale: "en", namespace: "nav" });

  const pageLinks = PUBLIC_PATHS.filter((p) => p !== "/")
    .map((path) => {
      const key = path === "/analyze" ? "analyze" : path === "/builder" ? "builder" : "about";
      return `- [${nav(key)}](${SITE_URL}${path})`;
    })
    .join("\n");

  const body = `# ATS readability

> ${metadata("description")}

${home("privacyTag")}

## Pages
${pageLinks}

## Languages
- English: ${SITE_URL}/
- Turkce: ${SITE_URL}/tr
- Deutsch: ${SITE_URL}/de

## Limits
${common("disclaimer")}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

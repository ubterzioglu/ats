import { getTranslations } from "next-intl/server";

import { SITE_URL } from "@/lib/seo";
import { SITE_ENTITY } from "@/lib/site-entity";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });
  const common = await getTranslations({ locale: "en", namespace: "common" });

  const body = `# ${SITE_ENTITY.name}
> ${metadata("description")}

## Capabilities
- Score CV parseability out of 100
- Match keywords against a job ad
- Build and export a CV in JSON Resume format

## Limits
${common("disclaimer")}

## Pages
- Home: ${SITE_URL}/
- Analyze: ${SITE_URL}/analyze
- Builder: ${SITE_URL}/builder
- About: ${SITE_URL}/about
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

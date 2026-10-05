import { getTranslations } from "next-intl/server";

import { ORGANIZATION_ID, SITE_URL } from "@/lib/seo";
import { SITE_ENTITY } from "@/lib/site-entity";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });

  const body = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: SITE_ENTITY.name,
    url: SITE_URL,
    description: metadata("description"),
    provider: { "@id": ORGANIZATION_ID },
    areaServed: "Worldwide"
  };

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

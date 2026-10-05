import { getTranslations } from "next-intl/server";

import { SITE_URL } from "@/lib/seo";
import { SITE_ENTITY } from "@/lib/site-entity";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });

  const body = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_ENTITY.name,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    description: metadata("description"),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
  };

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

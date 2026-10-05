import { getTranslations } from "next-intl/server";

import { buildFaqJsonLd, FAQ_IDS } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const faqT = await getTranslations({ locale: "en", namespace: "faq" });

  const items = FAQ_IDS.map((id) => ({
    question: faqT(`items.${id}.q`),
    answer: faqT(`items.${id}.a`)
  }));

  return new Response(JSON.stringify(buildFaqJsonLd(items)), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

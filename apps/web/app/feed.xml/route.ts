import { getTranslations } from "next-intl/server";

import { BUILD_DATE, PUBLIC_PATHS, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

interface FeedEntry {
  readonly path: string;
  readonly titleKey: string;
  readonly summaryKey: string;
}

const ENTRIES: readonly FeedEntry[] = [
  { path: "/", titleKey: "openGraphTitle", summaryKey: "openGraphDescription" },
  { path: "/analyze", titleKey: "openGraphTitle", summaryKey: "description" },
  { path: "/builder", titleKey: "openGraphTitle", summaryKey: "description" },
  { path: "/about", titleKey: "openGraphTitle", summaryKey: "description" }
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(): Promise<Response> {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });
  const nav = await getTranslations({ locale: "en", namespace: "nav" });

  const timestamp = `${BUILD_DATE}T00:00:00Z`;

  const entries = ENTRIES.map((entry) => {
    const title = entry.path === "/"
      ? metadata(entry.titleKey)
      : nav(entry.path === "/analyze" ? "analyze" : entry.path === "/builder" ? "builder" : "about");
    const summary = metadata(entry.summaryKey);
    const url = `${SITE_URL}${entry.path === "/" ? "" : entry.path}`;
    return `<entry>
  <title>${escapeXml(title)}</title>
  <link href="${url}" />
  <id>${url}</id>
  <updated>${timestamp}</updated>
  <published>${timestamp}</published>
  <summary>${escapeXml(summary)}</summary>
</entry>`;
  }).join("\n");

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(metadata("openGraphTitle"))}</title>
  <link href="${SITE_URL}/feed.xml" rel="self" />
  <link href="${SITE_URL}/" />
  <id>${SITE_URL}/</id>
  <updated>${timestamp}</updated>
  <generator>ATS readability</generator>
${entries}
</feed>`;

  return new Response(feed, {
    headers: { "content-type": "application/atom+xml; charset=utf-8" }
  });
}

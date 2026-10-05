import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { BUILD_DATE, PUBLIC_PATHS, absoluteUrl, pageAlternates } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      lastModified: BUILD_DATE,
      alternates: { languages: pageAlternates(locale, path).languages }
    }))
  );
}

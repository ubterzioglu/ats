import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { BUILD_DATE, PUBLIC_PATHS, SITE_URL, absoluteUrl, pageAlternates } from "@/lib/seo";
import { listAllPublishedPosts } from "@/lib/blog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      lastModified: BUILD_DATE,
      alternates: { languages: pageAlternates(locale, path).languages }
    }))
  );

  const blogPosts = await listAllPublishedPosts();
  const slugLocales = new Map<string, Record<string, string>>();

  for (const post of blogPosts) {
    if (!slugLocales.has(post.slug)) {
      slugLocales.set(post.slug, {});
    }
    const entry = slugLocales.get(post.slug)!;
    if (post.locale === "en") {
      entry["en"] = `${SITE_URL}/blog/${post.slug}`;
    } else {
      entry[post.locale] = `${SITE_URL}/${post.locale}/blog/${post.slug}`;
    }
  }

  const blogPages = blogPosts.map((post) => {
    const langs = slugLocales.get(post.slug) ?? {};
    return {
      url: post.locale === "en"
        ? `${SITE_URL}/blog/${post.slug}`
        : `${SITE_URL}/${post.locale}/blog/${post.slug}`,
      lastModified: post.updated_at,
      alternates: {
        languages: {
          ...langs,
          "x-default": `${SITE_URL}/blog/${post.slug}`,
        }
      }
    };
  });

  return [...staticPages, ...blogPages];
}

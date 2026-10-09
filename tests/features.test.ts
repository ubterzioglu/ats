import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";
import { FEATURE_SLUGS, featurePath, isFeatureSlug, neighbours } from "@/lib/features";
import { getFeatureContent } from "@/lib/features/content";
import { PUBLIC_PATHS, buildAiFaqJsonLd, buildFeatureListJsonLd, buildFeaturePageJsonLd } from "@/lib/seo";

describe("feature content", () => {
  for (const locale of routing.locales) {
    it(`has a complete entry for every slug in ${locale}`, () => {
      const content = getFeatureContent(locale);
      for (const slug of FEATURE_SLUGS) {
        const entry = content[slug];
        expect(entry.title.trim(), `${locale}/${slug} title`).not.toBe("");
        expect(entry.summary.trim(), `${locale}/${slug} summary`).not.toBe("");
        expect(entry.points.length, `${locale}/${slug} points`).toBeGreaterThan(0);
        for (const point of entry.points) {
          expect(point.text.trim()).not.toBe("");
        }
      }
    });
  }

  it("keeps the same number of points in every language", () => {
    for (const slug of FEATURE_SLUGS) {
      const counts = routing.locales.map((l) => getFeatureContent(l)[slug].points.length);
      expect(new Set(counts).size, slug).toBe(1);
    }
  });
});

describe("feature slugs", () => {
  it("recognises its own slugs and nothing else", () => {
    expect(isFeatureSlug("linkedin")).toBe(true);
    expect(isFeatureSlug("nope")).toBe(false);
  });

  it("lists every feature page in the public paths", () => {
    for (const slug of FEATURE_SLUGS) {
      expect(PUBLIC_PATHS).toContain(featurePath(slug));
    }
    expect(PUBLIC_PATHS).toContain("/features");
    expect(PUBLIC_PATHS).toContain("/quick-test");
    expect(PUBLIC_PATHS).toContain("/faq");
  });

  it("links neighbours without wrapping", () => {
    const first = FEATURE_SLUGS[0];
    const last = FEATURE_SLUGS[FEATURE_SLUGS.length - 1];
    expect(first && neighbours(first).previous).toBeNull();
    expect(last && neighbours(last).next).toBeNull();
    expect(neighbours("parser-view")).toEqual({ previous: "scoring", next: "job-ad" });
  });
});

describe("feature structured data", () => {
  it("builds a WebPage and a three-level breadcrumb for a feature", () => {
    const [page, crumbs] = buildFeaturePageJsonLd("tr", "scoring", "Puanlama", "Özet", {
      home: "Ana sayfa",
      features: "Özellikler"
    });
    expect(page?.["@type"]).toBe("WebPage");
    expect(page?.inLanguage).toBe("tr");
    const items = crumbs?.itemListElement as readonly { readonly position: number }[];
    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  it("lists every feature in the collection ItemList", () => {
    const content = getFeatureContent("en");
    const list = buildFeatureListJsonLd(
      "en",
      "Features",
      "All features",
      FEATURE_SLUGS.map((slug) => ({ slug, title: content[slug].title }))
    );
    const entity = list.mainEntity as { readonly itemListElement: readonly unknown[] };
    expect(entity.itemListElement).toHaveLength(FEATURE_SLUGS.length);
  });

  it("describes the three language sections of /ai-faq", () => {
    const article = buildAiFaqJsonLd("en", "Title", "Description", [
      { lang: "tr", id: "tr", name: "Türkçe" },
      { lang: "en", id: "en", name: "English" }
    ]);
    expect(article["@type"]).toBe("TechArticle");
    expect(article.hasPart).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";
import { FEATURE_SLUGS, featurePath, isFeatureSlug, neighbours } from "@/lib/features";
import { getFeatureContent } from "@/lib/features/content";
import { PUBLIC_PATHS } from "@/lib/seo";

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

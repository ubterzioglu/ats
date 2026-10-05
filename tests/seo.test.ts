import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  buildHomeJsonLd,
  localizedPath,
  pageAlternates,
  PUBLIC_PATHS,
  SITE_URL
} from "@/lib/seo";

import { routing } from "@/i18n/routing";

describe("localizedPath", () => {
  it("returns bare path for the default locale", () => {
    expect(localizedPath("en", "/")).toBe("/");
  });

  it("returns locale-prefixed path for non-default locale root", () => {
    expect(localizedPath("tr", "/")).toBe("/tr");
  });

  it("returns locale-prefixed path for non-default locale subpage", () => {
    expect(localizedPath("de", "/analyze")).toBe("/de/analyze");
  });

  it("returns locale-prefixed builder for tr", () => {
    expect(localizedPath("tr", "/builder")).toBe("/tr/builder");
  });

  it("returns bare builder for en", () => {
    expect(localizedPath("en", "/builder")).toBe("/builder");
  });
});

describe("absoluteUrl", () => {
  it("has no double slash for en root", () => {
    const url = absoluteUrl("en", "/");
    expect(url).toBe(`${SITE_URL}/`);
    const afterProtocol = url.replace(/^https?:\/\//, "");
    expect(afterProtocol).not.toContain("//");
  });

  it("has no trailing slash for non-root paths", () => {
    expect(absoluteUrl("en", "/analyze")).toBe(`${SITE_URL}/analyze`);
    expect(absoluteUrl("tr", "/analyze")).toBe(`${SITE_URL}/tr/analyze`);
  });

  it("has no double slash for locale-prefixed paths", () => {
    const url = absoluteUrl("de", "/builder");
    const afterProtocol = url.replace(/^https?:\/\//, "");
    expect(afterProtocol).not.toContain("//");
  });
});

describe("pageAlternates", () => {
  it("returns canonical and all language keys for tr /analyze", () => {
    const result = pageAlternates("tr", "/analyze");
    expect(result.canonical).toBe(`${SITE_URL}/tr/analyze`);
    expect(Object.keys(result.languages).sort()).toEqual(
      ["de", "en", "tr", "x-default"].sort()
    );
  });

  it("x-default equals the en URL", () => {
    const result = pageAlternates("tr", "/analyze");
    expect(result.languages["x-default"]).toBe(result.languages["en"]);
    expect(result.languages["x-default"]).toBe(`${SITE_URL}/analyze`);
  });

  it("each language key points to the correct locale URL", () => {
    const result = pageAlternates("de", "/builder");
    expect(result.languages["en"]).toBe(`${SITE_URL}/builder`);
    expect(result.languages["tr"]).toBe(`${SITE_URL}/tr/builder`);
    expect(result.languages["de"]).toBe(`${SITE_URL}/de/builder`);
  });
});

describe("robots output", () => {
  it("is covered after robots.ts is wired in", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();
    const allDisallows = result.rules.flatMap(
      (r) => (typeof r.disallow === "string" ? [r.disallow] : r.disallow ?? [])
    );
    expect(allDisallows).toContain("/r/");
    expect(allDisallows).toContain("/tr/r/");
    expect(allDisallows).toContain("/de/r/");
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe("sitemap output", () => {
  it("has 9 entries with 4 language keys each and no private paths", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();
    expect(entries).toHaveLength(9);
    for (const entry of entries) {
      expect(Object.keys(entry.alternates!.languages!)).toHaveLength(4);
      expect(entry.url).not.toContain("/applications");
      expect(entry.url).not.toContain("/login");
      expect(entry.url).not.toContain("/r/");
    }
  });
});

describe("buildHomeJsonLd", () => {
  it("returns two nodes with the right types", () => {
    const nodes = buildHomeJsonLd("en", "ATS readability", "A description");
    expect(nodes).toHaveLength(2);
    expect(nodes[0]!["@type"]).toBe("WebSite");
    expect(nodes[1]!["@type"]).toBe("WebApplication");
  });

  it("contains no forbidden fields when serialized", () => {
    const nodes = buildHomeJsonLd("tr", "ATS readability", "A description");
    const serialized = JSON.stringify(nodes);
    expect(serialized).not.toContain("SearchAction");
    expect(serialized).not.toContain("sameAs");
    expect(serialized).not.toContain("logo");
    expect(serialized).not.toContain("YOUR_");
  });

  it("uses the correct locale URL and inLanguage", () => {
    const nodes = buildHomeJsonLd("de", "ATS readability", "Desc");
    expect(nodes[0]!.url).toBe(`${SITE_URL}/de`);
    expect(nodes[0]!.inLanguage).toBe("de");
  });
});

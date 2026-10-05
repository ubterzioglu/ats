import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  BUILD_DATE,
  buildFaqJsonLd,
  buildHomeJsonLd,
  buildOrganizationJsonLd,
  FAQ_IDS,
  localizedPath,
  ORGANIZATION_ID,
  pageAlternates,
  PUBLIC_PATHS,
  SITE_URL
} from "@/lib/seo";

import { routing } from "@/i18n/routing";

import { SITE_ENTITY } from "@/lib/site-entity";

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
  it("has 12 entries with lastModified, 4 language keys each and includes /about", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();
    expect(entries).toHaveLength(12);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/about`);
    expect(urls).toContain(`${SITE_URL}/tr/about`);
    expect(urls).toContain(`${SITE_URL}/de/about`);
    for (const entry of entries) {
      expect(Object.keys(entry.alternates!.languages!)).toHaveLength(4);
      expect(entry.url).not.toContain("/applications");
      expect(entry.url).not.toContain("/login");
      expect(entry.url).not.toContain("/r/");
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("buildOrganizationJsonLd", () => {
  it("has the correct @id, name, logo, contactPoint and sameAs", () => {
    const org = buildOrganizationJsonLd();
    expect(org["@id"]).toBe(ORGANIZATION_ID);
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe(SITE_ENTITY.name);
    expect(org.url).toBe(SITE_URL);
    const logo = org.logo as { readonly url: string };
    expect(logo.url).toMatch(new RegExp(`^${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const contact = org.contactPoint as { readonly email: string };
    expect(contact.email).toBe(SITE_ENTITY.contactEmail);
    expect(org.sameAs).toEqual(SITE_ENTITY.sameAs);
  });

  it("serialized output contains no placeholders", () => {
    const serialized = JSON.stringify(buildOrganizationJsonLd());
    expect(serialized).not.toContain("YOUR_");
    expect(serialized).not.toContain("FILL_ME");
    expect(serialized).not.toContain("example.com");
  });
});

describe("buildHomeJsonLd", () => {
  it("returns three nodes with the right types", () => {
    const nodes = buildHomeJsonLd("en", "ATS readability", "A description");
    expect(nodes).toHaveLength(3);
    expect(nodes[0]!["@type"]).toBe("Organization");
    expect(nodes[1]!["@type"]).toBe("WebSite");
    expect(nodes[2]!["@type"]).toBe("WebApplication");
  });

  it("both non-org nodes reference the organization as publisher", () => {
    const nodes = buildHomeJsonLd("en", "ATS readability", "A description");
    const website = nodes[1] as { readonly publisher: { readonly "@id": string } };
    const webApp = nodes[2] as { readonly publisher: { readonly "@id": string } };
    expect(website.publisher["@id"]).toBe(ORGANIZATION_ID);
    expect(webApp.publisher["@id"]).toBe(ORGANIZATION_ID);
  });

  it("uses the correct locale URL and inLanguage", () => {
    const nodes = buildHomeJsonLd("de", "ATS readability", "Desc");
    expect(nodes[1]!.url).toBe(`${SITE_URL}/de`);
    expect(nodes[1]!.inLanguage).toBe("de");
  });

  it("WebApplication node has dateModified matching BUILD_DATE format", () => {
    const nodes = buildHomeJsonLd("en", "ATS readability", "Desc");
    const webApp = nodes[2] as { readonly dateModified: string };
    expect(webApp.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(webApp.dateModified).toBe(BUILD_DATE);
  });
});

describe("buildFaqJsonLd", () => {
  it("returns a FAQPage with one Question per FAQ_ID", () => {
    const items = FAQ_IDS.map((id) => ({ question: `Q-${id}`, answer: `A-${id}` }));
    const node = buildFaqJsonLd(items) as {
      readonly mainEntity: readonly { readonly name: string; readonly acceptedAnswer: { readonly text: string } }[];
    };
    expect(node["@type"]).toBe("FAQPage");
    expect(node.mainEntity).toHaveLength(FAQ_IDS.length);
    for (const [i, id] of FAQ_IDS.entries()) {
      expect(node.mainEntity[i]!.name).toBe(`Q-${id}`);
      expect(node.mainEntity[i]!.acceptedAnswer.text).toBe(`A-${id}`);
    }
  });

  it("no question or answer is empty or contains placeholder text", () => {
    const items = FAQ_IDS.map((id) => ({ question: `Q-${id}`, answer: `A-${id}` }));
    const serialized = JSON.stringify(buildFaqJsonLd(items));
    expect(serialized).not.toContain("FILL_ME");
    expect(serialized).not.toContain("YOUR_");
  });
});

describe("FAQ message completeness", () => {
  it("all three locale files contain every faq.items.<id>.q and .a", async () => {
    const en = (await import("@/messages/en.json")).default;
    const tr = (await import("@/messages/tr.json")).default;
    const de = (await import("@/messages/de.json")).default;
    for (const locale of [en, tr, de]) {
      const faq = (locale as { faq: { items: Record<string, { q: string; a: string }> } }).faq;
      for (const id of FAQ_IDS) {
        expect(faq.items[id]?.q?.trim().length).toBeGreaterThan(0);
        expect(faq.items[id]?.a?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

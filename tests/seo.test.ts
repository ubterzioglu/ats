import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  BUILD_DATE,
  buildAboutPageJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildHomeJsonLd,
  buildOrganizationJsonLd,
  FAQ_IDS,
  localizedPath,
  ORGANIZATION_ID,
  pageAlternates,
  PUBLIC_PATHS,
  SITE_URL,
  WEBSITE_ID
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
  it("has 18 entries with lastModified, 4 language keys each and includes legal and blog pages", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    // Six public paths in three locales.
    expect(entries).toHaveLength(18);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/blog`);
    expect(urls).toContain(`${SITE_URL}/tr/blog`);
    expect(urls).toContain(`${SITE_URL}/de/blog`);
    expect(urls).toContain(`${SITE_URL}/about`);
    expect(urls).toContain(`${SITE_URL}/tr/about`);
    expect(urls).toContain(`${SITE_URL}/de/about`);
    expect(urls).toContain(`${SITE_URL}/privacy`);
    expect(urls).toContain(`${SITE_URL}/kvkk`);
    expect(urls).toContain(`${SITE_URL}/data-request`);
    for (const entry of entries) {
      expect(Object.keys(entry.alternates!.languages!)).toHaveLength(4);
      expect(entry.url).not.toContain("/analyze");
      expect(entry.url).not.toContain("/builder");
      expect(entry.url).not.toContain("/applications");
      expect(entry.url).not.toContain("/login");
      expect(entry.url).not.toContain("/r/");
      expect(entry.url).not.toContain("/admin");
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("buildOrganizationJsonLd", () => {
  it("has the correct @id, name, alternateName, logo, contactPoint, description and sameAs", () => {
    const org = buildOrganizationJsonLd("A test description");
    expect(org["@id"]).toBe(ORGANIZATION_ID);
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe(SITE_ENTITY.name);
    expect(org.alternateName).toEqual(["affa", "ats free for all"]);
    expect(org.url).toBe(SITE_URL);
    expect(org.description).toBe("A test description");
    const logo = org.logo as { readonly url: string };
    expect(logo.url).toMatch(new RegExp(`^${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const contact = org.contactPoint as { readonly email: string };
    expect(contact.email).toBe(SITE_ENTITY.contactEmail);
    expect(org.sameAs).toEqual(SITE_ENTITY.sameAs);
  });

  it("serialized output contains no placeholders", () => {
    const serialized = JSON.stringify(buildOrganizationJsonLd("A description"));
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

describe("SearchAction in buildHomeJsonLd", () => {
  it("WebSite node has potentialAction with SearchAction", () => {
    const nodes = buildHomeJsonLd("en", "ATS readability", "Desc");
    const website = nodes[1] as {
      readonly potentialAction: {
        readonly "@type": string;
        readonly target: string;
        readonly "query-input": string;
      };
    };
    expect(website.potentialAction["@type"]).toBe("SearchAction");
    expect(website.potentialAction.target).toContain("search_term_string");
    expect(website.potentialAction["query-input"]).toContain("search_term_string");
  });
});

describe("AI and feed route files exist", () => {
  it("all route modules can be imported", async () => {
    const summary = await import("@/app/ai/summary.json/route");
    expect(typeof summary.GET).toBe("function");
    const faq = await import("@/app/ai/faq.json/route");
    expect(typeof faq.GET).toBe("function");
    const service = await import("@/app/ai/service.json/route");
    expect(typeof service.GET).toBe("function");
    const feed = await import("@/app/feed.xml/route");
    expect(typeof feed.GET).toBe("function");
    const aiTxt = await import("@/app/.well-known/ai.txt/route");
    expect(typeof aiTxt.GET).toBe("function");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("returns a BreadcrumbList with 2 items in increasing position order", () => {
    const breadcrumb = buildBreadcrumbJsonLd("en", "/about", "About", "Home");
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    const items = breadcrumb.itemListElement as readonly { readonly position: number; readonly name: string }[];
    expect(items).toHaveLength(2);
    expect(items[0]!.position).toBe(1);
    expect(items[0]!.name).toBe("Home");
    expect(items[1]!.position).toBe(2);
    expect(items[1]!.name).toBe("About");
  });

  it("uses correct URLs for each item", () => {
    const breadcrumb = buildBreadcrumbJsonLd("tr", "/analyze", "Analiz", "Ana Sayfa");
    const items = breadcrumb.itemListElement as readonly { readonly item: string }[];
    expect(items[0]!.item).toBe(`${SITE_URL}/tr`);
    expect(items[1]!.item).toBe(`${SITE_URL}/tr/analyze`);
  });
});

describe("buildAboutPageJsonLd", () => {
  it("returns an AboutPage with correct references", () => {
    const aboutPage = buildAboutPageJsonLd("en", "About ATS readability", "Learn about us");
    expect(aboutPage["@type"]).toBe("AboutPage");
    expect(aboutPage.name).toBe("About ATS readability");
    expect(aboutPage.description).toBe("Learn about us");
    expect(aboutPage.url).toBe(`${SITE_URL}/about`);
    expect(aboutPage.inLanguage).toBe("en");
    const isPartOf = aboutPage.isPartOf as { readonly "@id": string };
    expect(isPartOf["@id"]).toBe(WEBSITE_ID);
    const about = aboutPage.about as { readonly "@id": string };
    expect(about["@id"]).toBe(ORGANIZATION_ID);
  });
});

describe("WebSite node has @id", () => {
  it("WebSite node has @id matching WEBSITE_ID", () => {
    const nodes = buildHomeJsonLd("en", "ATS readability", "Desc");
    const website = nodes[1] as { readonly "@id": string };
    expect(website["@id"]).toBe(WEBSITE_ID);
  });
});

describe("sameAs has no duplicates", () => {
  it("SITE_ENTITY.sameAs has unique entries", () => {
    const unique = new Set(SITE_ENTITY.sameAs);
    expect(unique.size).toBe(SITE_ENTITY.sameAs.length);
  });
});

describe("home.how section messages", () => {
  it("all three locales have home.how.title and home.how.body", async () => {
    const en = (await import("@/messages/en.json")).default;
    const tr = (await import("@/messages/tr.json")).default;
    const de = (await import("@/messages/de.json")).default;
    for (const locale of [en, tr, de]) {
      const how = (locale as { home: { how: { title: string; body: string } } }).home.how;
      expect(how.title.trim().length).toBeGreaterThan(0);
      expect(how.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("English body is between 90 and 160 words", async () => {
    const en = (await import("@/messages/en.json")).default;
    const body = (en as { home: { how: { body: string } } }).home.how.body;
    const wordCount = body.split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(90);
    expect(wordCount).toBeLessThanOrEqual(160);
  });
});

describe("notFound message keys", () => {
  it("all three locales have the required notFound keys", async () => {
    const en = (await import("@/messages/en.json")).default;
    const tr = (await import("@/messages/tr.json")).default;
    const de = (await import("@/messages/de.json")).default;
    for (const locale of [en, tr, de]) {
      const notFound = (locale as { notFound: { code: string; title: string; body: string; home: string; analyze: string } }).notFound;
      expect(notFound.code).toBe("404");
      expect(notFound.title.trim().length).toBeGreaterThan(0);
      expect(notFound.body.trim().length).toBeGreaterThan(0);
      expect(notFound.home.trim().length).toBeGreaterThan(0);
      expect(notFound.analyze.trim().length).toBeGreaterThan(0);
    }
  });
});

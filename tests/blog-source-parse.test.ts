import { describe, expect, it } from "vitest";

import { makeDescription, markCitations, parseArticleSource } from "@/lib/blog/source-parse";

const SOURCE = [
  "# **Title of the whole article",
  "",
  "## **1\\. Birinci Başlık (First Title)**",
  "",
  "### **Türkçe**",
  "",
  "Birinci paragraf kanıtlamaktadır1. İkinci cümle.",
  "İkinci paragraf başka bir satırda.",
  "",
  "### **Deutsch**",
  "",
  "Erster Absatz.",
  "Zweiter Absatz.",
  "",
  "### **English**",
  "",
  "First paragraph proves it1. Second sentence.",
  "Second paragraph on its own line.",
  "",
  "| Element | Result |",
  "| :---- | :---- |",
  "| **Bars** | Omitted |",
  "",
  "## **2\\. İkinci Başlık (Second Title)**",
  "",
  "### **Türkçe**",
  "",
  "Tr gövde.",
  "",
  "### **Deutsch**",
  "",
  "De Körper.",
  "",
  "### **English**",
  "",
  "En body.",
  "",
  "#### **Works cited**",
  "",
  "> 1. Something, [https\\://example.com](https://example.com)",
].join("\n");

describe("parseArticleSource", () => {
  const sections = parseArticleSource(SOURCE);

  it("parses every numbered section and ignores the works-cited list", () => {
    expect(sections.map((s) => s.number)).toEqual([1, 2]);
  });

  it("keeps the English body, which used to come back empty", () => {
    expect(sections[0]?.en.body).toContain("First paragraph proves it");
    expect(sections[1]?.en.body).toBe("En body.");
  });

  it("puts each source line in its own paragraph", () => {
    const tr = sections[0]?.tr.body.split("\n\n");
    expect(tr).toHaveLength(2);
    expect(tr?.[1]).toBe("İkinci paragraf başka bir satırda.");
  });

  it("attaches the English-only table to the English post alone", () => {
    expect(sections[0]?.en.body).toContain("| **Bars** | Omitted |");
    expect(sections[0]?.tr.body).not.toContain("|");
    expect(sections[0]?.de.body).not.toContain("|");
  });

  it("gives the German post a German title rather than the English one", () => {
    expect(sections[0]?.de.title).not.toBe(sections[0]?.en.title);
    expect(sections[0]?.tr.title).toBe("Birinci Başlık");
    expect(sections[0]?.en.title).toBe("First Title");
  });

  it("writes a short description that ends on a word boundary", () => {
    for (const locale of ["tr", "de", "en"] as const) {
      expect(sections[0]?.[locale].description.length).toBeLessThanOrEqual(200);
    }
    expect(sections[0]?.tr.description).toBe(
      "Birinci paragraf kanıtlamaktadır. İkinci cümle. İkinci paragraf başka bir satırda.",
    );
  });
});

describe("markCitations", () => {
  it("turns digits glued to a word into a citation marker", () => {
    expect(markCitations("kanıtlamaktadır1. Sonra")).toBe("kanıtlamaktadır[^1]. Sonra");
    expect(markCitations("wird4 und (Daten)25.")).toBe("wird[^4] und (Daten)[^25].");
  });

  it("leaves code points and spaced numbers alone", () => {
    expect(markCitations("the U+FB01 glyph and Windows 11 and UTF-8")).toBe(
      "the U+FB01 glyph and Windows 11 and UTF-8",
    );
  });
});

describe("makeDescription", () => {
  it("drops citation markers and inline markup", () => {
    expect(makeDescription("Das **ist** gut[^3]. Mehr.")).toBe("Das ist gut. Mehr.");
  });

  it("truncates long text at a word boundary with an ellipsis", () => {
    const long = Array.from({ length: 80 }, () => "wort").join(" ");
    const out = makeDescription(long);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });
});

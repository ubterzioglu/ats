import { describe, expect, it } from "vitest";

import { RESUME_TEMPLATES, templateById } from "@/lib/pdf/templates";
import { parseResume } from "@/lib/resume/schema";
import { analyzeCv } from "@/lib/scoring";

import {
  FULL_RESUME,
  LOOP_RESUME_DE,
  LOOP_RESUME_EN,
  LOOP_RESUME_TR
} from "./fixtures/resumes";
// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { renderAndExtractTemplate } from "./helpers/pdf-templates";

/**
 * E.4: the dense template renders the fixture resume - and, because E.7 is
 * next, it already runs the closed loop: every rendering goes back through
 * lib/extract and into the scoring engine, where the Parseability dimension
 * must give full marks. A template that looks clean but parses badly fails
 * here, not in a candidate's application.
 */

const TEMPLATE = "dense" as const;

const full = await renderAndExtractTemplate(parseResume(FULL_RESUME), TEMPLATE);
const en = await renderAndExtractTemplate(parseResume(LOOP_RESUME_EN), TEMPLATE);
const tr = await renderAndExtractTemplate(parseResume(LOOP_RESUME_TR), TEMPLATE);
const de = await renderAndExtractTemplate(parseResume(LOOP_RESUME_DE), TEMPLATE);
const empty = await renderAndExtractTemplate(parseResume({}), TEMPLATE);

function parseabilityOf(text: string) {
  const result = analyzeCv({ cvText: text });
  const dimension = result.dimensions.find((entry) => entry.id === "parseability");
  const parseFindings = result.findings
    .filter((finding) => finding.id.startsWith("parse."))
    .map((finding) => finding.id);
  return { result, dimension, parseFindings };
}

describe("dense template", () => {
  it("is registered", () => {
    expect(RESUME_TEMPLATES.map((template) => template.id)).toContain(TEMPLATE);
    expect(templateById(TEMPLATE).label).toBe("Dense");
  });

  it("renders the fixture resume as a real PDF", () => {
    expect(full.bytes.length).toBeGreaterThan(2000);
    const magic = String.fromCharCode(
      full.bytes[0] ?? 0,
      full.bytes[1] ?? 0,
      full.bytes[2] ?? 0,
      full.bytes[3] ?? 0
    );
    expect(magic).toBe("%PDF");
    expect(full.text).toContain("Umut Barış Terzioglu");
    expect(full.text).toContain("Adesso SE");
    expect(full.text).toContain("420 senaryoluk Playwright regresyon paketi geliştirdim");
    expect(full.text).toMatch(/EXPERIENCE/i);
    expect(full.text).toMatch(/EDUCATION/i);
  });

  it("renders an empty resume as an empty document", () => {
    expect(empty.text.trim()).toBe("");
  });
});

describe("the closed loop", () => {
  it.each([
    ["english", en],
    ["turkish", tr],
    ["german", de]
  ] as const)("%s fixture scores Parseability at full marks", (_name, rendered) => {
    const { dimension, parseFindings, result } = parseabilityOf(rendered.text);
    expect(parseFindings).toEqual([]);
    expect(dimension?.score).toBe(dimension?.max);
    expect(dimension?.max).toBe(25);
    expect(result.stats.words).toBeGreaterThan(260);
  });

  it("keeps the Turkish glyphs intact through render and extract", () => {
    for (const needle of ["İstiklal", "taşıdım", "düşürdüm", "Kadın Yazılımcı", "geliştirdim"]) {
      expect(tr.text).toContain(needle);
    }
    expect(tr.text).not.toContain("\uFFFD");
    expect(tr.text).not.toContain("\u0307");
  });

  it("keeps the German glyphs intact through render and extract", () => {
    for (const needle of [
      "Musterstraße",
      "für Versicherungsplattformen",
      "verfügbar",
      "Persönlich"
    ]) {
      expect(de.text).toContain(needle);
    }
    expect(de.text).not.toContain("\uFFFD");
  });
});

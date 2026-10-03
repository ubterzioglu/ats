import { describe, expect, it } from "vitest";

import { extractPdf } from "@/lib/extract/pdf";
import { RESUME_TEMPLATES, renderResumePdf, type TemplateId } from "@/lib/pdf/templates";
import { parseResume } from "@/lib/resume/schema";
import { analyzeCv } from "@/lib/scoring";
import type { Resume } from "@/types/resume";

import { FULL_RESUME, LOOP_RESUME_DE, LOOP_RESUME_EN, LOOP_RESUME_TR } from "../fixtures/resumes";
import { nodeFontSources } from "./pdf-fonts";

/**
 * Renders a resume through a template and reads the PDF back through
 * lib/extract - the closed loop E.7 will run in CI, already wired for the
 * template tests. The importing test file must load ./pdfjs-node first so
 * the headless pdfjs globals are in place.
 */

export interface TemplateRender {
  readonly bytes: Uint8Array;
  readonly text: string;
}

export async function renderAndExtractTemplate(
  resume: Resume,
  template: TemplateId
): Promise<TemplateRender> {
  const bytes = await renderResumePdf(resume, template, nodeFontSources());
  const extraction = await extractPdf(
    new File([bytes], `cv-${template}.pdf`, { type: "application/pdf" })
  );
  return { bytes, text: extraction.text };
}

function parseabilityOf(text: string) {
  const result = analyzeCv({ cvText: text });
  const dimension = result.dimensions.find((entry) => entry.id === "parseability");
  const parseFindings = result.findings
    .filter((finding) => finding.id.startsWith("parse."))
    .map((finding) => finding.id);
  return { result, dimension, parseFindings };
}

const TR_GLYPH_NEEDLES = ["İstiklal", "taşıdım", "düşürdüm", "Kadın Yazılımcı", "geliştirdim"];
const DE_GLYPH_NEEDLES = [
  "Musterstraße",
  "für Versicherungsplattformen",
  "verfügbar",
  "Persönlich"
];

/**
 * The acceptance every template shares, as one reusable suite: it is
 * registered, it renders the fixture resume, an empty resume stays empty,
 * the Turkish and German glyphs survive the round trip, and all three loop
 * fixtures score Parseability at full marks with no parse.* finding. This is
 * the E.7 contract, enforced per template from the day each one lands.
 */
export function templateConformance(template: TemplateId): void {
  describe(`${template} template conformance`, () => {
    it("is registered", () => {
      expect(RESUME_TEMPLATES.map((entry) => entry.id)).toContain(template);
    });

    it("renders the fixture resume as a real PDF", async () => {
      const full = await renderAndExtractTemplate(parseResume(FULL_RESUME), template);
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
      expect(full.text).toMatch(/experience/i);
      expect(full.text).toMatch(/education/i);
    });

    it("renders an empty resume as an empty document", async () => {
      const empty = await renderAndExtractTemplate(parseResume({}), template);
      expect(empty.text.trim()).toBe("");
    });

    it.each([
      ["english", LOOP_RESUME_EN],
      ["turkish", LOOP_RESUME_TR],
      ["german", LOOP_RESUME_DE]
    ] as const)("%s loop fixture scores Parseability at full marks", async (_name, fixture) => {
      const rendered = await renderAndExtractTemplate(parseResume(fixture), template);
      const { dimension, parseFindings, result } = parseabilityOf(rendered.text);
      expect(parseFindings).toEqual([]);
      expect(dimension?.score).toBe(dimension?.max);
      expect(dimension?.max).toBe(25);
      expect(result.stats.words).toBeGreaterThan(260);
    });

    it("keeps the Turkish glyphs intact through render and extract", async () => {
      const tr = await renderAndExtractTemplate(parseResume(LOOP_RESUME_TR), template);
      for (const needle of TR_GLYPH_NEEDLES) {
        expect(tr.text).toContain(needle);
      }
      expect(tr.text).not.toContain("\uFFFD");
      expect(tr.text).not.toContain("\u0307");
    });

    it("keeps the German glyphs intact through render and extract", async () => {
      const de = await renderAndExtractTemplate(parseResume(LOOP_RESUME_DE), template);
      for (const needle of DE_GLYPH_NEEDLES) {
        expect(de.text).toContain(needle);
      }
      expect(de.text).not.toContain("\uFFFD");
    });
  });
}

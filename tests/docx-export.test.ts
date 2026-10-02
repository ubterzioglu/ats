import { createRequire } from "node:module";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { renderResumeDocx, renderResumeDocxBlob } from "@/lib/resume/docx";
import { parseResume } from "@/lib/resume/schema";
import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { assessDocumentKind } from "@/lib/scoring/gate";
import { scoreParseability } from "@/lib/scoring/parseability";

import { FULL_RESUME, MINIMAL_RESUME, TURKISH_RESUME } from "./fixtures/resumes";

/**
 * E.8: the DOCX export. "Opens in Word and LibreOffice" is verified here the
 * only way a headless suite can: the bytes are a real OOXML package, and
 * mammoth - the same reader lib/extract uses for DOCX in the browser - takes
 * the document apart and every promised character comes back.
 *
 * lib/extract's extractDocx cannot run here for two reasons: the browser
 * mammoth build takes {arrayBuffer} while the node build takes {buffer}, and
 * vitest resolves the CJS package strangely from the root-level suite. So the
 * test loads mammoth through a node require rooted in apps/web - the same
 * engine, the option key its node entry expects. The layout discipline (one
 * column, no tables, real headings) is what keeps Word and parsers honest.
 */

interface MammothNode {
  extractRawText(options: { readonly buffer: Buffer }): Promise<{ readonly value: string }>;
}

const nodeRequire = createRequire(join(process.cwd(), "package.json"));

async function readDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = nodeRequire("mammoth") as MammothNode;
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value.trim();
}

const fullBytes = await renderResumeDocx(parseResume(FULL_RESUME));
const fullText = await readDocx(fullBytes);

describe("DOCX package", () => {
  it("writes a real OOXML zip", () => {
    expect(fullBytes.length).toBeGreaterThan(2000);
    expect(fullBytes[0]).toBe(0x50); // P
    expect(fullBytes[1]).toBe(0x4b); // K
  });

  it("is read back by the DOCX engine lib/extract uses", () => {
    expect(fullText.length).toBeGreaterThan(200);
  });
});

describe("DOCX content", () => {
  it("carries the identity and contact block", () => {
    for (const needle of [
      "Umut Barış Terzioglu",
      "Senior QA Automation Engineer",
      "umut@example.com",
      "+49 151 2345678",
      "Musterstraße 12",
      "10115 Berlin"
    ]) {
      expect(fullText).toContain(needle);
    }
  });

  it("renders the sections that have content", () => {
    for (const heading of [
      "Summary",
      "Experience",
      "Projects",
      "Education",
      "Skills",
      "Languages",
      "Awards",
      "Publications",
      "Volunteer",
      "Interests",
      "References"
    ]) {
      expect(fullText).toContain(heading);
    }
  });

  it("renders entries, dates and highlights", () => {
    expect(fullText).toContain("Adesso SE");
    expect(fullText).toContain("2021-01 - present");
    expect(fullText).toContain("2017-03 - 2020-12");
    expect(fullText).toContain("420 senaryoluk Playwright regresyon paketi geliştirdim");
    expect(fullText).toContain("İstanbul Teknik Üniversitesi");
    expect(fullText).toContain("Testautomatisierung");
    expect(fullText).toContain("Türkçe - Ana dil");
    expect(fullText).toContain("Für herausragende Arbeit an der Regressionssuite.");
  });

  it("survives the reader with clean glyphs", () => {
    expect(fullText).not.toContain("\uFFFD");
    const ids = scoreParseability(buildContext(fullText)).findings.map(
      (finding) => finding.id
    );
    expect(ids).not.toContain("parse.mojibake");
    expect(ids).not.toContain("parse.encoding");
  });

  it("feeds the scoring engine as a readable CV", () => {
    expect(assessDocumentKind(fullText).confident).toBe(true);
    const result = analyzeCv({ cvText: fullText });
    expect(result.total).toBeGreaterThan(0);
  });
});

describe("no invention", () => {
  it("renders an empty resume as an empty document", async () => {
    const bytes = await renderResumeDocx(parseResume(MINIMAL_RESUME));
    expect(await readDocx(bytes)).toBe("");
  });

  it("carries the Turkish resume's characters through", async () => {
    const bytes = await renderResumeDocx(parseResume(TURKISH_RESUME));
    const text = await readDocx(bytes);
    expect(text).toContain("Ayşe Yılmaz");
    expect(text).toContain("Ağustos 2021'de 180 Selenium testini taşıdım");
    expect(text).toContain("Şubat 2015'ten beri İstanbul'da ışık hızında");
    expect(text).toContain("2020-08 - present");
  });
});

describe("browser-facing API", () => {
  it("exposes the Blob form the download button uses", async () => {
    const blob = await renderResumeDocxBlob(parseResume(FULL_RESUME));
    expect(blob.size).toBeGreaterThan(2000);
  });
});

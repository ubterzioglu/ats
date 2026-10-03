import { describe, expect, it } from "vitest";

import { templateById } from "@/lib/pdf/templates";
import { parseResume } from "@/lib/resume/schema";

import { FULL_RESUME } from "./fixtures/resumes";
// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { renderAndExtractTemplate, templateConformance } from "./helpers/pdf-templates";

/**
 * E.6: the modern template - hierarchy from size, weight and spacing rather
 * than ornament. Same content tree, same closed-loop contract as every
 * template: rendered, re-extracted and graded at full Parseability marks in
 * all three languages.
 */

templateConformance("modern");

describe("modern specifics", () => {
  it("is labelled, uppercases headings and dots the contact line", async () => {
    expect(templateById("modern").label).toBe("Modern");
    const full = await renderAndExtractTemplate(parseResume(FULL_RESUME), "modern");
    expect(full.text).toContain("EXPERIENCE");
    expect(full.text).toContain("LANGUAGES");
    // Extraction collapses the double spaces around the dot; the separator
    // itself is what the assertion is about.
    expect(full.text).toContain("umut@example.com · +49 151 2345678");
  });

  it("keeps the dotted contact line out of the column detector", async () => {
    const full = await renderAndExtractTemplate(parseResume(FULL_RESUME), "modern");
    const contact = full.text
      .split("\n")
      .find((line) => line.includes("umut@example.com"));
    expect(contact).toBeDefined();
    expect(contact ?? "").not.toMatch(/\S {3,}\S/);
  });
});

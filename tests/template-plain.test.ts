import { describe, expect, it } from "vitest";

import { templateById } from "@/lib/pdf/templates";
import { parseResume } from "@/lib/resume/schema";

import { FULL_RESUME } from "./fixtures/resumes";
// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { renderAndExtractTemplate, templateConformance } from "./helpers/pdf-templates";

/**
 * E.5: the plain template - the quiet document, sentence-case headings and
 * air between entries. Same content tree as every template, same closed-loop
 * contract, different voice on the page.
 */

templateConformance("plain");

describe("plain specifics", () => {
  it("is labelled and keeps its headings in sentence case", async () => {
    expect(templateById("plain").label).toBe("Plain");
    const full = await renderAndExtractTemplate(parseResume(FULL_RESUME), "plain");
    expect(full.text).toContain("Experience");
    expect(full.text).not.toContain("EXPERIENCE");
  });
});

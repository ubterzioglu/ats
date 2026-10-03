import { describe, expect, it } from "vitest";

import { templateById } from "@/lib/pdf/templates";
import { parseResume } from "@/lib/resume/schema";

import { FULL_RESUME } from "./fixtures/resumes";
// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { renderAndExtractTemplate, templateConformance } from "./helpers/pdf-templates";

/**
 * E.4: the dense template renders the fixture resume, and the shared
 * conformance suite holds it to the closed loop - every rendering goes back
 * through lib/extract and must score Parseability at full marks in all three
 * languages. A template that looks clean but parses badly fails here, not in
 * a candidate's application.
 */

templateConformance("dense");

describe("dense specifics", () => {
  it("is labelled and uppercases its headings", async () => {
    expect(templateById("dense").label).toBe("Dense");
    const full = await renderAndExtractTemplate(parseResume(FULL_RESUME), "dense");
    expect(full.text).toContain("EXPERIENCE");
    expect(full.text).toContain("SKILLS");
  });
});

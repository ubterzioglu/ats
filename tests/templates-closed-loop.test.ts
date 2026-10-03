import { describe, expect, it } from "vitest";

import { RESUME_TEMPLATES } from "@/lib/pdf/templates";
import { parseResume } from "@/lib/resume/schema";
import { analyzeCv } from "@/lib/scoring";

import { LOOP_RESUME_DE, LOOP_RESUME_EN, LOOP_RESUME_TR } from "./fixtures/resumes";
// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { renderAndExtractTemplate } from "./helpers/pdf-templates";

/**
 * E.7, the CI regression: every template in the registry - including any
 * registered after this file was written - must render each loop fixture,
 * come back through our own parser, and score Parseability at full marks.
 * Nothing is listed by hand; the suite is derived from RESUME_TEMPLATES, so a
 * new template joins the gate by existing.
 *
 * When it fails, the failure names the template, the language and every
 * finding that took a point, because "24/25" alone does not tell the next
 * person which layout decision to undo.
 */

const LOOP_FIXTURES = [
  ["english", LOOP_RESUME_EN],
  ["turkish", LOOP_RESUME_TR],
  ["german", LOOP_RESUME_DE]
] as const;

describe.each(RESUME_TEMPLATES.map((template) => [template.id, template] as const))(
  "template %s",
  (id) => {
    it.each(LOOP_FIXTURES)("%s loop fixture scores Parseability at full marks", async (_language, fixture) => {
      const rendered = await renderAndExtractTemplate(parseResume(fixture), id);
      const result = analyzeCv({ cvText: rendered.text });
      const dimension = result.dimensions.find((entry) => entry.id === "parseability");
      const deductions = result.findings
        .filter((finding) => finding.dimension === "parseability")
        .map((finding) => `${finding.id} (-${finding.cost}): ${finding.title}`);

      expect(dimension, `no parseability dimension for ${id}/${_language}`).toBeDefined();
      expect(
        deductions,
        `${id}/${_language} dropped below full Parseability:\n${deductions.join("\n")}`
      ).toEqual([]);
      expect(dimension?.score).toBe(dimension?.max);
    });
  }
);

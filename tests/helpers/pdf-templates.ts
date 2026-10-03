import { extractPdf } from "@/lib/extract/pdf";
import { renderResumePdf, type TemplateId } from "@/lib/pdf/templates";
import type { Resume } from "@/types/resume";

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

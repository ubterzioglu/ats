import type { Resume } from "@/types/resume";

import type { PdfFontSources } from "../fonts";
import { registerPdfFonts } from "../fonts";
import { renderPdfBlob, renderPdfBytes } from "../render";
import { denseTemplate } from "./dense";
import { plainTemplate } from "./plain";
import type { ResumeTemplate, TemplateId } from "./types";

/**
 * The template registry and the two render entry points the UI wires its
 * download buttons to: renderResumePdfBlob(resume, templateId) in the
 * browser, renderResumePdf(resume, templateId, fontSources) for node-side
 * callers and tests. Font sources default to the public/fonts URLs.
 */

export type { ResumeTemplate, TemplateId } from "./types";

export const RESUME_TEMPLATES: readonly ResumeTemplate[] = [denseTemplate, plainTemplate];

export function templateById(id: TemplateId): ResumeTemplate {
  const template = RESUME_TEMPLATES.find((entry) => entry.id === id);
  if (template === undefined) {
    throw new Error(`Unknown resume template: ${id}`);
  }
  return template;
}

export async function renderResumePdf(
  resume: Resume,
  template: TemplateId = "dense",
  fontSources?: PdfFontSources
): Promise<Uint8Array> {
  registerPdfFonts(fontSources);
  return renderPdfBytes(templateById(template).document(resume));
}

export async function renderResumePdfBlob(
  resume: Resume,
  template: TemplateId = "dense",
  fontSources?: PdfFontSources
): Promise<Blob> {
  registerPdfFonts(fontSources);
  return renderPdfBlob(templateById(template).document(resume));
}

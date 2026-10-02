import type { Resume } from "@/types/resume";

import { safeParseResume, type ResumeIssue } from "./schema";

/**
 * JSON Resume import and export, held to one promise: the round trip is
 * lossless. A document that validates goes in and comes back out deep-equal -
 * unknown keys, empty strings, an "" endDate for an open role, all of it.
 * The importer never enriches and the exporter never reshapes; anything the
 * schema rejects comes back as issues with dotted paths, not as a partially
 * salvaged document.
 */

export type ResumeImportResult =
  | { readonly ok: true; readonly resume: Resume }
  | { readonly ok: false; readonly issues: readonly ResumeIssue[] };

/** Validates an already-parsed JSON value as a resume document. */
export function importJsonResume(json: unknown): ResumeImportResult {
  return safeParseResume(json);
}

/** Parses resume JSON text; a syntax error is reported like a schema error. */
export function importJsonResumeText(text: string): ResumeImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return {
      ok: false,
      issues: [{ path: "", message: "The file is not valid JSON." }]
    };
  }
  return importJsonResume(json);
}

/**
 * Produces the plain, JSON-safe object form of a resume. Values pass through
 * untouched - the clone exists so a later edit to the model cannot reach the
 * exported document, never to reshape it.
 */
export function exportJsonResume(resume: Resume): Record<string, unknown> {
  return JSON.parse(JSON.stringify(resume)) as Record<string, unknown>;
}

/** The download form: pretty-printed JSON text, stable two-space indent. */
export function exportJsonResumeText(resume: Resume): string {
  return JSON.stringify(exportJsonResume(resume), null, 2);
}

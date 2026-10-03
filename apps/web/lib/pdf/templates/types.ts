import type { ReactElement } from "react";

import type { Resume } from "@/types/resume";

/**
 * The template registry's contract. A template is a pure function from the
 * canonical resume to a react-pdf element - no I/O, no randomness, no
 * content decisions of its own (the content tree in content.ts owns those).
 */

export type TemplateId = "dense" | "plain" | "modern";

export interface ResumeTemplate {
  readonly id: TemplateId;
  /** Engine wording; the interface catalog translates through the id. */
  readonly label: string;
  document(resume: Resume): ReactElement;
}

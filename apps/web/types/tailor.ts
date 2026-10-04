import type { KeywordTerm } from "./analysis";

export type SuggestedSection = "skills" | "experience" | "summary";

export interface MissingTermCard {
  readonly id: string;
  readonly term: KeywordTerm;
  /** The full sentence or line from the job description quoting this term. */
  readonly evidence: string;
  /** A heuristic suggestion for where to put this term in the CV. */
  readonly suggestedSection: SuggestedSection;
}

import { AMBIGUOUS_TERMS, SKILL_TAXONOMY, variantsOf } from "@/lib/scoring/taxonomy";

/**
 * The safety net under every generated sentence: whatever a model returns may
 * only restate the source. Every number and every technology name in the
 * output must appear in the source too, or sit inside a [placeholder] the
 * user still has to fill. Anything else is a fabrication and must not be
 * shown. This module is pure and runs before anything reaches the UI.
 */

export interface GroundingIssue {
  readonly kind: "number" | "technology";
  readonly value: string;
}

export interface GroundingResult {
  readonly grounded: boolean;
  readonly issues: readonly GroundingIssue[];
}

/**
 * Skills that are ordinary English words. Without this, "the rest of the
 * team" would read as an invented technology.
 */
const PROSE_SKILLS: ReadonlySet<string> = new Set([
  "rest", "spring", "oracle", "excel", "safe", "dart", "ruby", "swift", "rust"
]);

const PLACEHOLDER_RX = /\[[^\]]*\]/g;
// Digits embedded in identifiers (k8s, i18n) are part of a name, not a claim.
const NUMBER_RX = /(?<![\p{L}\d])\d+(?:[.,]\d+)*/gu;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWord(haystack: string, needle: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(needle)}(?![\\p{L}\\p{N}])`, "iu").test(
    haystack
  );
}

/** Variants safe to look for in free text: no single letters, no prose words. */
function detectableVariants(skill: string): string[] {
  return variantsOf(skill).filter(
    (variant) => !AMBIGUOUS_TERMS.has(variant) && !PROSE_SKILLS.has(variant)
  );
}

export function isGrounded(
  source: string,
  output: string,
  knownSkills: readonly string[] = SKILL_TAXONOMY
): GroundingResult {
  // Placeholders are promises to the user, not claims - exempt them wholesale.
  const claim = output.replace(PLACEHOLDER_RX, " ");
  const issues: GroundingIssue[] = [];

  for (const number of claim.match(NUMBER_RX) ?? []) {
    if (!containsWord(source, number)) {
      issues.push({ kind: "number", value: number });
    }
  }

  for (const skill of knownSkills) {
    if (PROSE_SKILLS.has(skill)) continue;
    const variants = detectableVariants(skill);
    const inOutput = variants.some((variant) => containsWord(claim, variant));
    if (!inOutput) continue;
    const inSource = variants.some((variant) => containsWord(source, variant));
    if (!inSource) {
      issues.push({ kind: "technology", value: skill });
    }
  }

  return { grounded: issues.length === 0, issues };
}

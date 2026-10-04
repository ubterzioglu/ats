import { AMBIGUOUS_TERMS, SKILL_TAXONOMY, variantsOf } from "@/lib/scoring/taxonomy";

/**
 * The safety net under every generated sentence: whatever a model returns may
 * only restate the source. Every number and every technology name in the
 * output must appear in the source too, or sit inside a [placeholder] the
 * user still has to fill. Anything else is a fabrication and must not be
 * shown. This module is pure and runs before anything reaches the UI.
 */

export interface GroundingIssue {
  readonly kind: "number" | "technology" | "institution";
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

/**
 * Employers and schools are the other fabrication a generated sentence can
 * carry. Treating every capitalised word as a name flags ordinary prose, so
 * only two shapes count as a claim about an organisation: a name introduced
 * by an English preposition ("at Google") and a name carrying a legal or
 * institutional suffix ("Beispiel GmbH"). German and Turkish prepositions
 * are deliberately absent from the first shape - German capitalises every
 * noun, so "bei Projekten" would read as an employer. The suffix shape
 * carries those languages instead, which is how their organisations are
 * written anyway.
 */
const ORG_SUFFIXES =
  "GmbH|AG|KG|OHG|mbH|Inc|LLC|Ltd|PLC|Corp|BV|NV|SA|Holding|Group|University|College|Institute|Universität|Hochschule|Üniversitesi|Bank";
const NAME_WORD = String.raw`\p{Lu}[\p{L}\p{N}&'-]*`;
const NAME_RUN = String.raw`${NAME_WORD}(?:\s+(?:${NAME_WORD}|of|de|du|van|der|und|and|&))*`;

const ORG_AFTER_PREPOSITION_RX = new RegExp(
  String.raw`(?<![\p{L}\p{N}])(?:[Aa]t|[Ww]ith|[Ff]or)\s+(${NAME_RUN})`,
  "gu"
);
const ORG_BY_SUFFIX_RX = new RegExp(
  String.raw`(${NAME_RUN}\s+(?:${ORG_SUFFIXES}))(?![\p{L}\p{N}])`,
  "gu"
);

/** The organisation names a sentence claims, deduplicated, longest form kept. */
function organisationNames(claim: string): string[] {
  const found = new Set<string>();
  for (const rx of [ORG_BY_SUFFIX_RX, ORG_AFTER_PREPOSITION_RX]) {
    for (const match of claim.matchAll(rx)) {
      const name = match[1]?.trim();
      if (name === undefined || name.length === 0) continue;
      // A name the suffix pass already claimed is not reported twice by the
      // preposition pass, which would see only its head ("Beispiel").
      if ([...found].some((seen) => seen.includes(name))) continue;
      found.add(name);
    }
  }
  return [...found];
}

/** Variants safe to look for in free text: no single letters, no prose words. */
function detectableVariants(skill: string): string[] {
  return variantsOf(skill).filter(
    (variant) => !AMBIGUOUS_TERMS.has(variant) && !PROSE_SKILLS.has(variant)
  );
}

export interface GroundingOptions {
  /**
   * Extra text organisation names may be drawn from, and only them. A cover
   * letter has to name the employer, and that name lives in the vacancy, not
   * in the CV - but the numbers and the technologies in the letter are claims
   * about the candidate and must still come from the CV alone.
   */
  readonly namesAlsoFrom?: string;
}

export function isGrounded(
  source: string,
  output: string,
  knownSkills: readonly string[] = SKILL_TAXONOMY,
  options: GroundingOptions = {}
): GroundingResult {
  // Placeholders are promises to the user, not claims - exempt them wholesale.
  const claim = output.replace(PLACEHOLDER_RX, " ");
  const issues: GroundingIssue[] = [];

  for (const number of claim.match(NUMBER_RX) ?? []) {
    if (!containsWord(source, number)) {
      issues.push({ kind: "number", value: number });
    }
  }

  const nameSource = options.namesAlsoFrom ? `${source}\n${options.namesAlsoFrom}` : source;
  for (const name of organisationNames(claim)) {
    // A name the taxonomy already knows is a tool, not an employer; the
    // technology pass below owns it and words it better.
    if (knownSkills.some((skill) => skill.toLowerCase() === name.toLowerCase())) continue;
    if (!containsWord(nameSource, name)) {
      issues.push({ kind: "institution", value: name });
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

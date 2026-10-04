import { sectionRanges } from "@/lib/scoring/sections";
import type { DetectedSection } from "@/types/analysis";

/**
 * Putting a confirmed term into the CV the workbench actually scores. The
 * workbench holds raw text, not the builder's `Resume`, so `addSkillToResume`
 * cannot serve it; this is the same D.3 rule in the other shape. Both refuse
 * loudly rather than quietly, because a skill entering a CV without the
 * candidate saying they have it is the one failure this product may never
 * ship.
 */

/**
 * Scoring reads the document through `toLines`, which trims and drops blank
 * lines, so a `DetectedSection.line` counts compacted lines, not the raw ones
 * an edit has to address. This is the inverse: compacted index to raw index.
 */
function rawLineIndices(cvText: string): number[] {
  const raw: number[] = [];
  cvText.split("\n").forEach((line, index) => {
    if (line.trim().length > 0) raw.push(index);
  });
  return raw;
}

/** A term already in the CV needs no second mention. */
function alreadyPresent(cvText: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu").test(cvText);
}

/**
 * Appends `term` to the CV's skills section.
 *
 * Returns the CV unchanged when it already names the term, and `null` when
 * there is no skills section to append to - inventing a heading would be a
 * structural edit the user did not ask for with this gesture.
 *
 * @throws when `confirmed` is false. The gate is the point of the function.
 */
export function addTermToCvText(
  cvText: string,
  sections: readonly DetectedSection[],
  term: string,
  confirmed: boolean
): string | null {
  if (!confirmed) {
    throw new Error(
      "Integrity violation: A skill cannot be added to the CV without explicit user confirmation."
    );
  }

  const cleaned = term.trim();
  if (cleaned.length === 0) return cvText;
  if (alreadyPresent(cvText, cleaned)) return cvText;

  const raw = rawLineIndices(cvText);
  const range = sectionRanges(sections, raw.length).find((candidate) => candidate.id === "skills");
  if (range === undefined) return null;

  const lines = cvText.split("\n");
  // `start` is the heading itself; the body is what follows it.
  const body = raw.slice(range.start + 1, range.end);

  // Prefer extending the last list the section already has, so the term joins
  // the candidate's own formatting instead of starting a competing style.
  for (const index of [...body].reverse()) {
    const line = lines[index];
    if (line === undefined) continue;
    const separator = line.includes(",") ? ", " : line.includes("·") ? " · " : null;
    if (separator === null) break;
    const trailing = line.match(/[.;]$/)?.[0] ?? "";
    const core = trailing ? line.slice(0, -trailing.length) : line;
    lines[index] = `${core.trimEnd()}${separator}${cleaned}${trailing}`;
    return lines.join("\n");
  }

  // No list to join: a line of its own, directly under the heading.
  const heading = raw[range.start];
  if (heading === undefined) return null;
  lines.splice(heading + 1, 0, cleaned);
  return lines.join("\n");
}

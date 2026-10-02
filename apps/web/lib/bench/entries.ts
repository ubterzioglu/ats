import { extractPeriods } from "@/lib/scoring/experience";

/**
 * The experience entries as the parser separated them: which role, which
 * employer, which dates. The second question a candidate asks after their
 * details, and the one a score alone never answers.
 *
 * The ranges come from the engine's own extractPeriods rather than from a
 * second date parser here. Calling the engine is not duplicating it: a line the
 * engine cannot read is a line this table must not claim to have read, and the
 * only way to keep that true is to ask the same function.
 *
 * What is added is the split of the rest of the line into a title and an
 * employer, which the engine has no reason to do.
 */

export type EntryStatus = "read" | "unusable";

export interface ExperienceEntry {
  readonly line: number;
  readonly source: string;
  readonly title?: string;
  readonly organisation?: string;
  /** The range exactly as the document writes it. */
  readonly range?: string;
  readonly open: boolean;
  readonly status: EntryStatus;
}

/**
 * How a CV separates a role from an employer on one line: a run of spaces, a
 * tab, or one of the punctuation marks people reach for. A single space is not
 * on the list, because "Senior QA Engineer" would split at every word.
 */
const SEPARATOR = /\s{2,}|\t+|\s+[|·•–—]\s+|,\s+/;

/** The date range, as written, anywhere in the line. */
const RANGE =
  /((?:\p{L}+\.?\s+)?(?:19|20)?\d{2}(?:\s*[./-]\s*\d{2,4})?)\s*(?:[-–—]|bis|to|ile)\s*((?:\p{L}+\.?\s+)?(?:19|20)\d{2}(?:\s*[./-]\s*\d{2,4})?|\p{L}+)/iu;

function splitRemainder(remainder: string): {
  readonly title?: string;
  readonly organisation?: string;
} {
  const cleaned = remainder
    .replace(/^[\s|·•–—,;-]+/, "")
    .replace(/[\s|·•–—,;-]+$/, "")
    .trim();

  if (cleaned.length === 0) return {};

  const parts = cleaned.split(SEPARATOR).map((part) => part.trim()).filter(Boolean);
  const [title, organisation] = parts;

  if (!title) return {};
  return organisation ? { title, organisation } : { title };
}

function describe(line: string, lineIndex: number, status: EntryStatus, open: boolean): ExperienceEntry {
  const match = line.match(RANGE);
  const range = match?.[0]?.trim();
  const remainder = range ? line.replace(range, " ") : line;

  return {
    line: lineIndex,
    source: line.trim(),
    ...(range ? { range } : {}),
    ...splitRemainder(remainder),
    open,
    status
  };
}

export function readExperienceEntries(
  cvText: string,
  now = new Date()
): readonly ExperienceEntry[] {
  const lines = cvText.split("\n");
  const { periods, reversed } = extractPeriods(lines, now);

  // `Period` carries the line's text, not its index. Each source is matched to
  // the first line that still holds it, and consumed, so two identical lines do
  // not both resolve to the first one.
  const taken = new Set<number>();
  const indexOf = (source: string): number => {
    const index = lines.findIndex(
      (line, at) => !taken.has(at) && line.trim() === source
    );
    if (index >= 0) taken.add(index);
    return index;
  };

  const entries = [
    ...periods.map((period) => {
      const at = indexOf(period.source);
      return describe(period.source, at, "read", period.open);
    }),
    ...reversed.map((source) => {
      const at = indexOf(source);
      return describe(source, at, "unusable", false);
    })
  ];

  return entries.sort((a, b) => a.line - b.line);
}

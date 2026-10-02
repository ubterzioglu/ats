import type { FixDraft } from "@/lib/scoring/drafts";

/**
 * Maps a finding's evidence back to the line it came from, so a work item can
 * offer to edit that line rather than sending the user to hunt for it.
 *
 * Pure and browser-free: the work item is the only caller today, but the
 * mapping is the kind of thing that gets reached for again, and it is far
 * easier to test here than through a component.
 */

/** Trailing ellipses are display truncation in evidence, not document text. */
export function evidenceNeedle(evidence: string): string {
  return evidence.replace(/(\.\.\.|…)\s*$/u, "").trim();
}

/** The index of the first line containing this evidence, or -1. */
export function findEvidenceLine(cvText: string, evidence: string): number {
  const needle = evidenceNeedle(evidence);
  if (needle.length === 0) return -1;

  const lines = cvText.split("\n");
  const exact = lines.findIndex((line) => line.trim() === needle);
  if (exact >= 0) return exact;

  return lines.findIndex((line) => line.includes(needle));
}

export function lineAt(cvText: string, lineIndex: number): string | null {
  return cvText.split("\n")[lineIndex] ?? null;
}

/**
 * Swaps one line. Returns null when the index is out of range, so a stale
 * proposal fails loudly instead of appending itself to the end of the document.
 */
export function replaceLine(
  cvText: string,
  lineIndex: number,
  replacement: string
): string | null {
  const lines = cvText.split("\n");
  if (lines[lineIndex] === undefined) return null;
  lines[lineIndex] = replacement;
  return lines.join("\n");
}

export function draftForLine(
  drafts: readonly FixDraft[],
  lineIndex: number
): FixDraft | undefined {
  return drafts.find((draft) => draft.lineIndex === lineIndex);
}

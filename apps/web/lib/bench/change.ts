import type { AnalysisResult, DimensionId, Finding } from "@/types/analysis";

/**
 * What one applied fix did to the score, and which finding it closed.
 *
 * The product claims every lost point is explained. The same claim has to hold
 * when a point comes back: "+6" on its own is a number the user has to trust,
 * and "+6 · Contact, because the phone number is there now" is one they can
 * check. That difference is the whole of C.2.
 */

export interface DimensionDelta {
  readonly id: DimensionId;
  readonly label: string;
  readonly delta: number;
}

export interface ScoreChange {
  readonly total: number;
  readonly dimensions: readonly DimensionDelta[];
  /** Findings present before and gone after. */
  readonly closed: readonly Finding[];
  /** Findings the edit introduced. An edit can cost points as well as win them. */
  readonly opened: readonly Finding[];
  /**
   * True when the arithmetic adds up: the total moved by exactly what the
   * closed and opened findings are worth. False means a dimension hit its floor
   * or ceiling, and the UI must not claim the change is fully attributed.
   */
  readonly attributed: boolean;
}

function byId(findings: readonly Finding[]): Map<string, Finding> {
  return new Map(findings.map((finding) => [finding.id, finding]));
}

export function describeChange(
  before: AnalysisResult,
  after: AnalysisResult
): ScoreChange | null {
  const wasThere = byId(before.findings);
  const isThere = byId(after.findings);

  const closed = before.findings.filter((finding) => !isThere.has(finding.id));
  const opened = after.findings.filter((finding) => !wasThere.has(finding.id));

  const total = after.total - before.total;
  if (total === 0 && closed.length === 0 && opened.length === 0) return null;

  const previousScore = new Map(before.dimensions.map((entry) => [entry.id, entry.score]));
  const dimensions = after.dimensions
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      delta: entry.score - (previousScore.get(entry.id) ?? entry.score)
    }))
    .filter((entry) => entry.delta !== 0);

  const worth =
    closed.reduce((sum, finding) => sum + finding.cost, 0) -
    opened.reduce((sum, finding) => sum + finding.cost, 0);

  return { total, dimensions, closed, opened, attributed: worth === total };
}

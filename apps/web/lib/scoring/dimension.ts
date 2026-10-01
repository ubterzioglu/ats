import type { DimensionId, DimensionScore, Finding, Severity } from "@/types/analysis";

import { clamp } from "./text";

export interface DimensionOutcome {
  readonly dimension: DimensionScore;
  readonly findings: readonly Finding[];
}

export interface FindingDraft {
  readonly id: string;
  readonly severity: Severity;
  readonly title: string;
  readonly detail: string;
  readonly fix: string;
  readonly cost: number;
  readonly evidence?: readonly string[];
}

export function buildOutcome(
  id: DimensionId,
  label: string,
  max: number,
  drafts: readonly FindingDraft[],
  summarize: (score: number) => string
): DimensionOutcome {
  const spent = drafts.reduce((sum, draft) => sum + draft.cost, 0);
  const score = clamp(max - spent, 0, max);

  return {
    dimension: { id, label, score, max, summary: summarize(score) },
    findings: drafts.map((draft) => ({ ...draft, dimension: id }))
  };
}

import type { AnalysisResult, DimensionId, Finding, KeywordTerm } from "@/types/analysis";

export interface ScoreDelta {
  readonly dimension: DimensionId | "total";
  readonly label: string;
  readonly baseScore: number;
  readonly variantScore: number;
  readonly delta: number;
}

export interface VariantComparisonResult {
  readonly scoreDeltas: readonly ScoreDelta[];
  readonly findingsResolved: readonly Finding[];
  readonly findingsIntroduced: readonly Finding[];
  readonly keywordsGained: readonly KeywordTerm[];
  readonly keywordsLost: readonly KeywordTerm[];
}

export function compareVariants(base: AnalysisResult, variant: AnalysisResult): VariantComparisonResult {
  const scoreDeltas: ScoreDelta[] = [];
  
  // Total Score Delta
  scoreDeltas.push({
    dimension: "total",
    label: "Total Score",
    baseScore: base.total,
    variantScore: variant.total,
    delta: variant.total - base.total
  });

  // Dimension Score Deltas
  for (const baseDim of base.dimensions) {
    const variantDim = variant.dimensions.find(d => d.id === baseDim.id);
    if (!variantDim) continue;
    if (variantDim.score !== baseDim.score) {
      scoreDeltas.push({
        dimension: baseDim.id,
        label: baseDim.label,
        baseScore: baseDim.score,
        variantScore: variantDim.score,
        delta: variantDim.score - baseDim.score
      });
    }
  }

  // Findings
  const baseFindingIds = new Set(base.findings.map(f => f.id));
  const variantFindingIds = new Set(variant.findings.map(f => f.id));

  const findingsResolved = base.findings.filter(f => !variantFindingIds.has(f.id));
  const findingsIntroduced = variant.findings.filter(f => !baseFindingIds.has(f.id));

  // Keywords
  const baseMatched = new Set(base.keywords.matched.map(k => k.term));
  const variantMatched = new Set(variant.keywords.matched.map(k => k.term));

  const keywordsGained = variant.keywords.matched.filter(k => !baseMatched.has(k.term));
  const keywordsLost = base.keywords.matched.filter(k => !variantMatched.has(k.term));

  return {
    scoreDeltas,
    findingsResolved,
    findingsIntroduced,
    keywordsGained,
    keywordsLost
  };
}

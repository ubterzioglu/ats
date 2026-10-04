import type { JobAdRequirements, SuitabilityCheck } from "@/types/analysis";
import type { ScoreContext } from "./context";
import { scoreKeywords } from "./keywords";
import { evaluateSuitability } from "./suitability";
import { parseJobAd } from "./job-ad";

export interface AdComparisonResult {
  readonly ad: JobAdRequirements;
  readonly suitability: readonly SuitabilityCheck[];
  readonly keywordCoverage: number;
  /** A synthetic score from 0 to 100 representing how well the CV fits the ad. */
  readonly matchScore: number;
}

/**
 * Compares a single CV context against multiple job ads.
 * Executes entirely in-browser without sending CV text to a server.
 * Uses F.3 (Suitability Checklist) and F.1 (Keyword Coverage) to rank the ads.
 */
export function compareAds(
  context: ScoreContext,
  jobAds: readonly string[]
): AdComparisonResult[] {
  const results = jobAds.map(adText => {
    const keywordOutcome = scoreKeywords(context, adText);
    const ad = parseJobAd(adText, [...keywordOutcome.report.matched, ...keywordOutcome.report.missing]);
    const suitability = evaluateSuitability(context, ad, keywordOutcome.report);

    let suitabilityScore = 1; // Default to full marks if no hard requirements
    if (suitability.length > 0) {
      const passed = suitability.filter(s => s.status === "passed").length;
      const failed = suitability.filter(s => s.status === "failed").length;
      
      // If there are outright failures, heavily penalise the score
      if (failed > 0) {
        suitabilityScore = passed / (suitability.length + failed * 2);
      } else {
        suitabilityScore = passed / suitability.length;
      }
    }

    // Blend: 50% suitability checks, 50% keyword coverage
    const coverageScore = keywordOutcome.report.coverage;
    const matchScore = Math.round((suitabilityScore * 50) + (coverageScore * 50));

    return {
      ad,
      suitability,
      keywordCoverage: keywordOutcome.report.coverage,
      matchScore
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

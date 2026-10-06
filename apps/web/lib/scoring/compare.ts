import type { JobAdRequirements, SuitabilityCheck } from "@/types/analysis";
import type { ScoreContext } from "./context";
import { scoreKeywords } from "./keywords";
import { evaluateSuitability } from "./suitability";
import { parseJobAd } from "./job-ad";

export interface AdComparisonResult {
  /** Position of the ad in the input array; the results are re-ordered by rank. */
  readonly index: number;
  /** Null when the ad is too short to read requirements from (see parseJobAd). */
  readonly ad: JobAdRequirements | null;
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
  const results = jobAds.map((adText, index) => {
    const keywordOutcome = scoreKeywords(context, adText);
    const ad = parseJobAd(adText, [...keywordOutcome.report.matched, ...keywordOutcome.report.missing]);
    const suitability = ad ? evaluateSuitability(context, ad, keywordOutcome.report) : [];

    // An unreadable ad earns no suitability credit: nothing was verified, so it
    // ranks on keyword coverage alone instead of getting free full marks.
    let suitabilityScore = ad ? 1 : 0;
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
      index,
      ad,
      suitability,
      keywordCoverage: keywordOutcome.report.coverage,
      matchScore
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

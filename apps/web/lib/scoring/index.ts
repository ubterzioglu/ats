import type { AnalysisInput, AnalysisResult, Band, Finding, Severity } from "@/types/analysis";

import { buildContext } from "./context";
import { scoreContact } from "./contact";
import { scoreImpact } from "./impact";
import { scoreKeywords } from "./keywords";
import { scoreParseability } from "./parseability";
import { scoreStructure } from "./structure";
import { evaluateSuitability } from "./suitability";
import { clamp } from "./text";
import { parseJobAd } from "./job-ad";

export { buildContext } from "./context";
export { extractJobKeywords, countOccurrences } from "./keywords";
export { detectSections } from "./sections";
export { normalizeDocument } from "./text";

const SEVERITY_ORDER: Readonly<Record<Severity, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const BANDS: ReadonlyArray<readonly [number, Band, string]> = [
  [85, "excellent", "Parses cleanly and matches the target role"],
  [70, "good", "Gets through the filter with minor losses"],
  [55, "fair", "Survives parsing but loses relevance"],
  [0, "risky", "Likely to be dropped or misread"]
];

function bandFor(total: number): readonly [Band, string] {
  const entry = BANDS.find(([threshold]) => total >= threshold) ?? BANDS[BANDS.length - 1];
  if (!entry) return ["risky", "Likely to be dropped or misread"];
  return [entry[1], entry[2]];
}

function rankFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    if (b.cost !== a.cost) return b.cost - a.cost;
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });
}

/**
 * Runs every dimension over the document and returns a result in which each
 * lost point is attributable to a named finding.
 */
export function analyzeCv(input: AnalysisInput): AnalysisResult {
  const context = buildContext(input.cvText);
  const jobDescription = input.jobDescription ?? "";

  const parseability = scoreParseability(context);
  const contact = scoreContact(context, input.market);
  const structure = scoreStructure(context);
  const keywords = scoreKeywords(context, jobDescription);
  const impact = scoreImpact(context);

  const outcomes = [parseability, contact, structure, keywords, impact];
  const dimensions = outcomes.map((outcome) => outcome.dimension);
  const findings = rankFindings(outcomes.flatMap((outcome) => outcome.findings));
  const parsedJobAd = jobDescription ? parseJobAd(jobDescription, [...keywords.report.matched, ...keywords.report.missing]) : undefined;

  const total = clamp(
    dimensions.reduce((sum, dimension) => sum + dimension.score, 0),
    0,
    100
  );

  const [band, bandLabel] = bandFor(total);

  return {
    total,
    band,
    bandLabel,
    language: context.language,
    dimensions,
    findings,
    keywords: keywords.report,
    sections: context.sections,
    stats: context.stats,
    jobAd: parsedJobAd,
    suitability: parsedJobAd ? evaluateSuitability(context, parsedJobAd, keywords.report) : undefined,
    generatedAt: new Date().toISOString()
  };
}

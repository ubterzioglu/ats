import type { AnalysisResult } from "@/types/analysis";

const MAX_FINDINGS = 60;
const MAX_TERMS = 80;

/**
 * The payload arrives from the browser, so it is re-checked here before the
 * service-role client touches the database.
 */
export function isPlausibleResult(value: unknown): value is AnalysisResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<AnalysisResult>;

  if (typeof result.total !== "number" || result.total < 0 || result.total > 100) return false;
  if (typeof result.band !== "string" || result.band.length > 32) return false;
  if (typeof result.language !== "string" || result.language.length > 8) return false;
  if (!Array.isArray(result.dimensions) || result.dimensions.length > 12) return false;
  if (!Array.isArray(result.findings) || result.findings.length > MAX_FINDINGS) return false;
  if (typeof result.keywords !== "object" || result.keywords === null) return false;
  if (!Array.isArray(result.keywords.matched) || result.keywords.matched.length > MAX_TERMS) return false;
  if (!Array.isArray(result.keywords.missing) || result.keywords.missing.length > MAX_TERMS) return false;

  return true;
}

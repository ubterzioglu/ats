import type { AnalysisResult } from "@/types/analysis";

let currentResult: AnalysisResult | null = null;

export function setResult(result: AnalysisResult | null): void {
  currentResult = result;
}

export function getResult(): AnalysisResult | null {
  return currentResult;
}

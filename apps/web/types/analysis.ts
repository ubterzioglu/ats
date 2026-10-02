export type Severity = "critical" | "high" | "medium" | "low";

export type DimensionId =
  | "parseability"
  | "contact"
  | "structure"
  | "keywords"
  | "impact";

export type Band = "excellent" | "good" | "fair" | "risky";

export type DocumentLanguage = "en" | "de" | "tr";

export interface Finding {
  readonly id: string;
  readonly dimension: DimensionId;
  readonly severity: Severity;
  readonly title: string;
  readonly detail: string;
  readonly fix: string;
  readonly cost: number;
  readonly evidence?: readonly string[];
}

export interface DimensionScore {
  readonly id: DimensionId;
  readonly label: string;
  readonly score: number;
  readonly max: number;
  readonly summary: string;
}

export type KeywordTier = "required" | "preferred";

export interface KeywordTerm {
  readonly term: string;
  readonly weight: number;
  readonly hits: number;
  readonly tier?: KeywordTier;
  /** The variant that matched when the canonical spelling itself never appears. */
  readonly alias?: string;
}

export interface KeywordReport {
  readonly source: "job-description" | "baseline";
  readonly coverage: number;
  readonly matched: readonly KeywordTerm[];
  readonly missing: readonly KeywordTerm[];
  readonly overused: readonly KeywordTerm[];
}

export interface DetectedSection {
  readonly id: string;
  readonly label: string;
  readonly heading: string;
  readonly line: number;
}

export interface DocumentStats {
  readonly characters: number;
  readonly words: number;
  readonly lines: number;
  readonly bulletLines: number;
  readonly averageBulletWords: number;
  readonly estimatedPages: number;
  readonly years: readonly number[];
  /**
   * Total employment in months after concurrent roles are merged, which is how
   * a tenure filter reads the document rather than how the candidate counts.
   */
  readonly experienceMonths: number;
}

export interface AnalysisResult {
  readonly total: number;
  readonly band: Band;
  readonly bandLabel: string;
  readonly language: DocumentLanguage;
  readonly dimensions: readonly DimensionScore[];
  readonly findings: readonly Finding[];
  readonly keywords: KeywordReport;
  readonly sections: readonly DetectedSection[];
  readonly stats: DocumentStats;
  readonly generatedAt: string;
}

export interface AnalysisInput {
  readonly cvText: string;
  readonly jobDescription?: string;
}

export type Severity = "critical" | "high" | "medium" | "low";

export interface JobAdRedFlag {
  readonly id: "laundry-list" | "seniority-mismatch" | "vague-role";
  readonly description: string;
  readonly evidence?: string;
}

export interface ExperienceRequirement {
  readonly years: number;
  readonly source: string;
}

export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "principal";

export interface SeniorityRequirement {
  readonly level: SeniorityLevel;
  readonly source: string;
}

export interface LanguageRequirement {
  readonly language: string;
  readonly level: string;
  readonly source: string;
}

export type WorkMode = "on-site" | "hybrid" | "remote";

export interface LocationRequirement {
  readonly mode: WorkMode;
  readonly city?: string;
  readonly source: string;
}

export interface SalaryRequirement {
  readonly min: number;
  readonly max: number;
  readonly currency: string;
  readonly period: "yearly" | "monthly" | "hourly";
  readonly source: string;
}

export interface JobAdRequirements {
  readonly experience: ExperienceRequirement | null;
  readonly seniority: SeniorityRequirement | null;
  readonly languages: readonly LanguageRequirement[];
  readonly location: LocationRequirement | null;
  readonly salary: SalaryRequirement | null;
  readonly terms: {
    readonly required: readonly KeywordTerm[];
    readonly preferred: readonly KeywordTerm[];
  };
  readonly redFlags: readonly JobAdRedFlag[];
}

export type SuitabilityStatus = "passed" | "failed" | "unknown";

export interface SuitabilityCheck {
  readonly id: "experience" | "language" | "location" | "skills";
  readonly status: SuitabilityStatus;
  readonly title: string;
  readonly detail?: string;
}

export type DimensionId =
  | "parseability"
  | "contact"
  | "structure"
  | "keywords"
  | "impact";

export type Band = "excellent" | "good" | "fair" | "risky";

export type DocumentLanguage = "en" | "de" | "tr";

/**
 * The job market the CV is aimed at. Norms for photos, dates of birth and
 * military service differ by market, not by the language the document happens
 * to be written in, so the caller may state it explicitly; the engine falls
 * back to the document language.
 */
export type TargetMarket = DocumentLanguage;

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

/**
 * How literally a filter compares. Strict compares strings, normalized carries
 * a synonym table and a stemmer, semantic compares meaning. The same CV scores
 * differently against each.
 */
export type MatchMode = "strict" | "normalized" | "semantic";

/** Why a semantic match was accepted. Always a possibility, never a fact. */
export interface SemanticEvidence {
  readonly passage: string;
  readonly similarity: number;
}

export interface KeywordTerm {
  readonly term: string;
  readonly weight: number;
  readonly hits: number;
  readonly tier?: KeywordTier;
  /** The variant that matched when the canonical spelling itself never appears. */
  readonly alias?: string;
  /**
   * Set only in semantic mode, and only where `hits` is zero: the term is not
   * written in the CV, something close to it is. Present it as a possible
   * match, never as a confirmed skill.
   */
  readonly semantic?: SemanticEvidence;
}

export interface MatchOutcome {
  readonly mode: MatchMode;
  readonly coverage: number;
  readonly matched: readonly KeywordTerm[];
  readonly missing: readonly KeywordTerm[];
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

export interface Strength {
  readonly id: string;
  readonly dimension: string;
  readonly params: Readonly<Record<string, number | string | readonly string[]>>;
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
  readonly jobAd?: JobAdRequirements;
  readonly suitability?: readonly SuitabilityCheck[];
  readonly generatedAt: string;
  readonly engineVersion?: string;
  readonly strengths?: readonly Strength[];
  readonly experience?: {
    readonly months: number;
    readonly overlapping: boolean;
    readonly periodCount: number;
  };
}

export interface AnalysisInput {
  readonly cvText: string;
  readonly jobDescription?: string;
  readonly market?: TargetMarket;
  readonly extraction?: ExtractionMetadata;
}

export interface ExtractionFacts {
  readonly pages: number;
  readonly ocrPages: number;
}

/**
 * Metadata from the file extraction step, passed through to the scorer so it
 * can issue findings that depend on the file format (e.g. image-only pages,
 * hidden links). Absent when the CV was pasted as text rather than uploaded.
 */
export interface ExtractionMetadata {
  readonly source: "pdf" | "docx" | "text";
  readonly pages: number;
  readonly emptyPages: number;
  readonly links: readonly string[];
}

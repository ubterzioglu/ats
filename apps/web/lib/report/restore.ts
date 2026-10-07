import type {
  AnalysisResult,
  Band,
  DimensionId,
  DimensionScore,
  DocumentLanguage,
  Finding,
  KeywordReport,
  KeywordTerm,
  Severity,
  Strength
} from "@/types/analysis";

/**
 * Review focus 2. A shared report is a row written by whatever version of this
 * app was running the day it was created, and read by whatever version is
 * running when someone opens the link. Fields added since will be missing, and
 * `payload as AnalysisResult` is a lie the moment one is: the first `.map` over
 * an absent array takes the page down.
 *
 * So the row is treated as untrusted input and rebuilt. Anything unreadable is
 * dropped rather than guessed at - a shared report that shows four of its six
 * findings is worth more than one that shows an error.
 */

const DIMENSION_IDS: readonly DimensionId[] = [
  "parseability",
  "contact",
  "structure",
  "keywords",
  "impact"
];

const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low"];
const BANDS: readonly Band[] = ["excellent", "good", "fair", "risky"];
const LANGUAGES: readonly DocumentLanguage[] = ["en", "de", "tr"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function restoreFinding(value: unknown): Finding | null {
  if (!isRecord(value)) return null;

  const title = str(value.title);
  if (title.length === 0) return null;

  const evidence = array(value.evidence).filter((line): line is string => typeof line === "string");

  return {
    id: str(value.id, title),
    dimension: oneOf(value.dimension, DIMENSION_IDS, "parseability"),
    severity: oneOf(value.severity, SEVERITIES, "medium"),
    title,
    detail: str(value.detail),
    fix: str(value.fix),
    cost: Math.max(0, num(value.cost)),
    // Share links are written with evidence stripped, so this is normally
    // absent. Keeping the branch means a locally restored report still carries
    // its lines, and an empty array never reaches the UI as "has evidence".
    ...(evidence.length > 0 ? { evidence } : {})
  };
}

function restoreDimension(value: unknown): DimensionScore | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;

  const max = num(value.max);
  if (max <= 0) return null;

  return {
    id: oneOf(value.id, DIMENSION_IDS, "parseability"),
    label: str(value.label, value.id),
    score: Math.min(max, Math.max(0, num(value.score))),
    max,
    summary: str(value.summary)
  };
}

function restoreTerm(value: unknown): KeywordTerm | null {
  if (!isRecord(value)) return null;
  const term = str(value.term);
  if (term.length === 0) return null;

  const tier = value.tier === "required" || value.tier === "preferred" ? value.tier : undefined;
  const alias = typeof value.alias === "string" ? value.alias : undefined;

  return {
    term,
    weight: num(value.weight),
    hits: Math.max(0, num(value.hits)),
    ...(tier ? { tier } : {}),
    ...(alias ? { alias } : {})
  };
}

function restoreKeywords(value: unknown): KeywordReport {
  const record = isRecord(value) ? value : {};
  const terms = (input: unknown): readonly KeywordTerm[] =>
    array(input)
      .map(restoreTerm)
      .filter((term): term is KeywordTerm => term !== null);

  return {
    source: record.source === "job-description" ? "job-description" : "baseline",
    coverage: Math.min(1, Math.max(0, num(record.coverage))),
    matched: terms(record.matched),
    missing: terms(record.missing),
    overused: terms(record.overused)
  };
}

function restoreStrength(value: unknown): Strength | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  if (id.length === 0) return null;

  const params: Record<string, number | string | readonly string[]> = {};
  if (isRecord(value.params)) {
    for (const [key, val] of Object.entries(value.params)) {
      if (typeof val === "number" || typeof val === "string") {
        params[key] = val;
      } else if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
        params[key] = val as readonly string[];
      }
    }
  }

  return {
    id,
    dimension: str(value.dimension, "parseability"),
    params
  };
}

/** Returns null only when the row carries no usable score at all. */
export function restoreSharedReport(payload: unknown): AnalysisResult | null {
  if (!isRecord(payload)) return null;

  const total = num(payload.total, -1);
  if (total < 0 || total > 100) return null;

  const stats = isRecord(payload.stats) ? payload.stats : {};

  return {
    total,
    band: oneOf(payload.band, BANDS, "fair"),
    bandLabel: str(payload.bandLabel),
    language: oneOf(payload.language, LANGUAGES, "en"),
    dimensions: array(payload.dimensions)
      .map(restoreDimension)
      .filter((dimension): dimension is DimensionScore => dimension !== null),
    findings: array(payload.findings)
      .map(restoreFinding)
      .filter((finding): finding is Finding => finding !== null),
    keywords: restoreKeywords(payload.keywords),
    sections: [],
    stats: {
      characters: num(stats.characters),
      words: num(stats.words),
      lines: num(stats.lines),
      bulletLines: num(stats.bulletLines),
      averageBulletWords: num(stats.averageBulletWords),
      estimatedPages: num(stats.estimatedPages),
      years: array(stats.years).filter((year): year is number => typeof year === "number"),
      experienceMonths: num(stats.experienceMonths)
    },
    generatedAt: str(payload.generatedAt),
    ...(typeof payload.engineVersion === "string" ? { engineVersion: payload.engineVersion } : {}),
    strengths: array(payload.strengths)
      .map(restoreStrength)
      .filter((strength): strength is Strength => strength !== null),
    ...(isRecord(payload.experience)
      ? {
          experience: {
            months: num(payload.experience.months),
            overlapping: Boolean(payload.experience.overlapping),
            periodCount: num(payload.experience.periodCount)
          }
        }
      : {})
  };
}

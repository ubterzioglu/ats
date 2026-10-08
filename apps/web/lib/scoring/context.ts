import type { DetectedSection, DocumentLanguage, DocumentStats, ExtractionMetadata } from "@/types/analysis";

import { buildExperience, type ExperienceReport } from "./experience";
import { detectLanguage } from "./language";
import { detectSections } from "./sections";
import { caseFold, countWords, isBulletLine, normalizeDocument, round, stripBulletMarker, toLines, tokenize } from "./text";
import { trLowercase } from "./turkish";
import { WORDS_PER_PAGE } from "./config";

export interface ScoreContext {
  readonly raw: string;
  readonly lower: string;
  readonly lines: readonly string[];
  readonly tokens: readonly string[];
  readonly tokenSet: ReadonlySet<string>;
  readonly bullets: readonly string[];
  readonly sections: readonly DetectedSection[];
  readonly language: DocumentLanguage;
  readonly stats: DocumentStats;
  readonly experience: ExperienceReport;
  readonly ligatures: number;
  readonly zeroWidthCount: number;
  readonly extraction?: ExtractionMetadata;
}

export interface BuildContextOptions {
  readonly extraction?: ExtractionMetadata;
}

const LIGATURE_GLYPHS = /[\uFB00-\uFB06]/g;
const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\uFEFF]/g;

export function buildContext(cvText: string, options?: BuildContextOptions): ScoreContext {
  const ligatures = (cvText.match(LIGATURE_GLYPHS) ?? []).length;
  const zeroWidthCount = (cvText.match(ZERO_WIDTH_CHARS) ?? []).length;
  const raw = normalizeDocument(cvText);
  const lines = toLines(raw);
  const tokens = tokenize(raw);
  const bullets = lines.filter(isBulletLine).map(stripBulletMarker);
  const words = countWords(raw);

  const bulletWordCounts = bullets.map(countWords);
  const bulletWordTotal = bulletWordCounts.reduce((sum, count) => sum + count, 0);

  const years = (raw.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);
  const experience = buildExperience(lines);
  const language = detectLanguage(raw);

  const stats: DocumentStats = {
    characters: raw.length,
    words,
    lines: lines.length,
    bulletLines: bullets.length,
    averageBulletWords: bullets.length > 0 ? round(bulletWordTotal / bullets.length, 1) : 0,
    estimatedPages: Math.max(1, Math.round(words / WORDS_PER_PAGE)),
    years,
    experienceMonths: experience.months
  };

  return {
    raw,
    // Turkish lowercases by its own rules: "I" is the uppercase of "ı", not "i".
    lower: language === "tr" ? trLowercase(raw) : caseFold(raw),
    lines,
    tokens,
    tokenSet: new Set(tokens),
    bullets,
    sections: detectSections(lines),
    language,
    stats,
    experience,
    ligatures,
    zeroWidthCount,
    ...(options?.extraction ? { extraction: options.extraction } : {})
  };
}

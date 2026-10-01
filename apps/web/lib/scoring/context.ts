import type { DetectedSection, DocumentLanguage, DocumentStats } from "@/types/analysis";

import { buildExperience, type ExperienceReport } from "./experience";
import { detectLanguage } from "./language";
import { detectSections } from "./sections";
import { countWords, isBulletLine, normalizeDocument, round, stripBulletMarker, toLines, tokenize } from "./text";

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
}

const WORDS_PER_PAGE = 520;

export function buildContext(cvText: string): ScoreContext {
  const raw = normalizeDocument(cvText);
  const lines = toLines(raw);
  const tokens = tokenize(raw);
  const bullets = lines.filter(isBulletLine).map(stripBulletMarker);
  const words = countWords(raw);

  const bulletWordCounts = bullets.map(countWords);
  const bulletWordTotal = bulletWordCounts.reduce((sum, count) => sum + count, 0);

  const years = (raw.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);
  const experience = buildExperience(lines);

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
    lower: raw.toLowerCase(),
    lines,
    tokens,
    tokenSet: new Set(tokens),
    bullets,
    sections: detectSections(lines),
    language: detectLanguage(raw),
    stats,
    experience
  };
}

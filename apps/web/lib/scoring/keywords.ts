import type { KeywordReport, KeywordTerm } from "@/types/analysis";

import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { isJobNoise, isStopword } from "./stopwords";
import { MULTI_WORD_SKILLS, canonicalize, isKnownSkill, variantsOf } from "./taxonomy";
import { clamp, isBulletLine, normalizeDocument, round, tokenize } from "./text";

export const KEYWORDS_MAX = 25;

/** Coverage at which the dimension is considered fully satisfied. */
const COVERAGE_TARGET = 0.7;
const MAX_TERMS = 40;
const BASELINE_MAX = 20;
const BASELINE_TARGET_SKILLS = 16;
const STUFFING_THRESHOLD = 12;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termPattern(term: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(term)}(?![\\p{L}\\p{N}])`, "giu");
}

export function countOccurrences(haystack: string, term: string): number {
  let total = 0;
  for (const variant of variantsOf(term)) {
    const matches = haystack.match(termPattern(variant));
    if (matches) total += matches.length;
  }
  return total;
}

interface Candidate {
  readonly term: string;
  readonly frequency: number;
  readonly inRequirements: boolean;
}

function requirementTokens(lines: readonly string[]): ReadonlySet<string> {
  const bulletText = lines.filter(isBulletLine).join(" ");
  return new Set(tokenize(bulletText));
}

function weigh(candidate: Candidate): number {
  const base = Math.pow(candidate.frequency, 0.7);
  const skillBonus = isKnownSkill(candidate.term) ? 2.2 : 1;
  const requirementBonus = candidate.inRequirements ? 1.25 : 1;
  const phraseBonus = candidate.term.includes(" ") ? 1.15 : 1;
  return round(base * skillBonus * requirementBonus * phraseBonus, 3);
}

/**
 * Mines the job ad for the terms an ATS would index it by: known skills first,
 * then repeated domain words, with requirement bullets weighted higher.
 */
export function extractJobKeywords(jobDescription: string): KeywordTerm[] {
  const text = normalizeDocument(jobDescription);
  const lower = text.toLowerCase();
  const lines = text.split("\n").map((line) => line.trim());
  const requirements = requirementTokens(lines);

  const candidates = new Map<string, Candidate>();

  for (const phrase of MULTI_WORD_SKILLS) {
    const frequency = countOccurrences(lower, phrase);
    if (frequency === 0) continue;
    candidates.set(phrase, {
      term: phrase,
      frequency,
      inRequirements: phrase.split(" ").every((word) => requirements.has(word))
    });
  }

  const tokens = tokenize(lower);
  const frequencies = new Map<string, number>();

  for (const token of tokens) {
    const term = canonicalize(token);
    if (isStopword(term) || isJobNoise(term)) continue;
    if (/^\d+$/.test(term)) continue;
    if (term.length < 3 && !isKnownSkill(term)) continue;
    frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  }

  for (const [term, frequency] of frequencies) {
    if (!isKnownSkill(term) && frequency < 2) continue;
    if (candidates.has(term)) continue;
    candidates.set(term, { term, frequency, inRequirements: requirements.has(term) });
  }

  const phrases = [...candidates.keys()].filter((term) => term.includes(" "));
  for (const phrase of phrases) {
    for (const word of phrase.split(" ")) {
      const nested = candidates.get(word);
      if (nested && !isKnownSkill(word)) candidates.delete(word);
    }
  }

  return [...candidates.values()]
    .map((candidate) => ({ term: candidate.term, weight: weigh(candidate), hits: 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_TERMS);
}

function baselineTerms(context: ScoreContext): KeywordTerm[] {
  const found: KeywordTerm[] = [];

  for (const skill of MULTI_WORD_SKILLS) {
    const hits = countOccurrences(context.lower, skill);
    if (hits > 0) found.push({ term: skill, weight: 1, hits });
  }

  for (const token of context.tokenSet) {
    const term = canonicalize(token);
    if (!isKnownSkill(term) || term.includes(" ")) continue;
    if (found.some((entry) => entry.term === term)) continue;
    found.push({ term, weight: 1, hits: countOccurrences(context.lower, term) });
  }

  return found.sort((a, b) => b.hits - a.hits);
}

export interface KeywordOutcome extends DimensionOutcome {
  readonly report: KeywordReport;
}

function scoreWithoutJobAd(context: ScoreContext): KeywordOutcome {
  const drafts: FindingDraft[] = [];
  const matched = baselineTerms(context);
  const distinct = matched.length;
  const baselineScore = clamp(
    Math.round(BASELINE_MAX * Math.min(1, distinct / BASELINE_TARGET_SKILLS)),
    0,
    BASELINE_MAX
  );

  drafts.push({
    id: "keywords.no-job-description",
    severity: "medium",
    title: "Scored without a job ad",
    detail:
      "Keyword relevance is always relative to one vacancy. Without it only a generic skill inventory can be checked, so this dimension is capped at 20 of 25.",
    fix: "Paste the job ad and run the analysis again for a real match score.",
    cost: KEYWORDS_MAX - BASELINE_MAX
  });

  if (baselineScore < BASELINE_MAX) {
    drafts.push({
      id: "keywords.thin-skill-inventory",
      severity: distinct < 6 ? "high" : "medium",
      title: "Few recognisable skill terms",
      detail: `${distinct} known tools or methods appear in the text. Recruiter searches run on exactly these terms.`,
      fix: "Name concrete tools, frameworks and methods in the skills section and inside the role bullets.",
      cost: BASELINE_MAX - baselineScore
    });
  }

  const overused = matched.filter((term) => term.hits > STUFFING_THRESHOLD);

  return {
    ...buildOutcome("keywords", "Keyword match", KEYWORDS_MAX, drafts, (score) =>
      score >= 16
        ? "A solid inventory of recognisable skills, but not matched against a vacancy."
        : "Too few concrete skill terms to surface in a recruiter search."
    ),
    report: { source: "baseline", coverage: 0, matched, missing: [], overused }
  };
}

export function scoreKeywords(context: ScoreContext, jobDescription: string): KeywordOutcome {
  const jd = jobDescription.trim();
  if (jd.length < 120) return scoreWithoutJobAd(context);

  const drafts: FindingDraft[] = [];
  const terms = extractJobKeywords(jd);
  const scored = terms.map((term) => ({
    ...term,
    hits: countOccurrences(context.lower, term.term)
  }));

  const matched = scored.filter((term) => term.hits > 0);
  const missing = scored.filter((term) => term.hits === 0);
  const totalWeight = scored.reduce((sum, term) => sum + term.weight, 0);
  const matchedWeight = matched.reduce((sum, term) => sum + term.weight, 0);
  const coverage = totalWeight > 0 ? matchedWeight / totalWeight : 0;

  const rawScore = clamp(
    Math.round(KEYWORDS_MAX * Math.min(1, coverage / COVERAGE_TARGET)),
    0,
    KEYWORDS_MAX
  );

  if (rawScore < KEYWORDS_MAX) {
    const headline = missing.slice(0, 8).map((term) => term.term);
    drafts.push({
      id: "keywords.coverage",
      severity: coverage < 0.3 ? "critical" : coverage < 0.5 ? "high" : "medium",
      title: `${Math.round(coverage * 100)}% of the vacancy's key terms appear in the CV`,
      detail:
        headline.length > 0
          ? `The highest-weighted terms that are absent: ${headline.join(", ")}.`
          : "Coverage sits below what a keyword filter expects.",
      fix: "Work the missing terms into real sentences about what you actually did. Never paste a keyword list.",
      cost: KEYWORDS_MAX - rawScore,
      evidence: headline
    });
  }

  const overused = matched.filter((term) => term.hits > STUFFING_THRESHOLD);
  if (overused.length > 0) {
    drafts.push({
      id: "keywords.stuffing",
      severity: "medium",
      title: "Keyword stuffing detected",
      detail: `${overused
        .map((term) => `${term.term} appears ${term.hits} times`)
        .join(", ")}, far more than natural writing would.`,
      fix: "Keep two or three mentions in context and delete the rest. Recruiters and modern parsers both penalise padding.",
      cost: 2,
      evidence: overused.map((term) => term.term)
    });
  }

  return {
    ...buildOutcome("keywords", "Keyword match", KEYWORDS_MAX, drafts, (score) =>
      score >= 20
        ? "The CV speaks the vocabulary of this vacancy."
        : score >= 12
          ? "Partly aligned; several required terms are missing."
          : "The CV and the vacancy barely share vocabulary."
    ),
    report: {
      source: "job-description",
      coverage: round(coverage, 3),
      matched: [...matched].sort((a, b) => b.weight - a.weight),
      missing: [...missing].sort((a, b) => b.weight - a.weight),
      overused
    }
  };
}

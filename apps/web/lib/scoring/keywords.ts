import type { KeywordReport, KeywordTerm, KeywordTier } from "@/types/analysis";

import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { formatDuration } from "./experience";
import { extractExperienceRequirement } from "./job-ad";
import { lineSection, sectionRanges } from "./sections";
import { isJobNoise, isStopword } from "./stopwords";
import { MULTI_WORD_SKILLS, canonicalize, hasTechContext, isAmbiguousTerm, isKnownSkill, variantsOf } from "./taxonomy";
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

export interface VariantCount {
  readonly variant: string;
  readonly hits: number;
}

export function countOccurrencesByVariant(haystack: string, term: string): VariantCount[] {
  const totals = new Map<string, number>();
  for (const line of haystack.split("\n")) {
    for (const variant of variantsOf(term)) {
      if (isAmbiguousTerm(variant) && !hasTechContext(line)) continue;
      const matches = line.match(termPattern(variant));
      if (matches) totals.set(variant, (totals.get(variant) ?? 0) + matches.length);
    }
  }
  return variantsOf(term).map((variant) => ({ variant, hits: totals.get(variant) ?? 0 }));
}

export function countOccurrences(haystack: string, term: string): number {
  return countOccurrencesByVariant(haystack, term).reduce((sum, entry) => sum + entry.hits, 0);
}

interface Candidate {
  readonly term: string;
  readonly frequency: number;
  readonly tier?: KeywordTier;
}

/**
 * Heading vocabulary for the tier state machine, EN/DE/TR. Preferred headings
 * are tested first: "preferred qualifications" contains "qualifications".
 */
const PREFERRED_HEADINGS: readonly string[] = [
  "nice to have", "nice-to-have", "bonus", "preferred", "preference", "plus",
  "great if", "great to have", "ideally", "wünschenswert", "wuenschenswert",
  "von vorteil", "pluspunkt", "idealerweise", "tercihen", "tercih edilen",
  "tercih sebebi", "artı puan", "arti puan"
];

const REQUIRED_HEADINGS: readonly string[] = [
  "requirements", "requirement", "required", "must have", "must-have", "must haves",
  "qualifications", "what we're looking for", "what we are looking for",
  "what you'll need", "what you will need", "anforderungen", "dein profil",
  "ihr profil", "your profile", "aranan nitelikler", "beklenen nitelikler",
  "genel nitelikler", "gereksinimler", "nitelikler"
];

const RESPONSIBILITY_HEADINGS: readonly string[] = [
  "responsibilities", "responsibility", "what you'll do", "what you will do",
  "what you'll own", "what you will own", "your tasks", "your mission", "the role",
  "your role", "the opportunity", "deine aufgaben", "ihre aufgaben", "aufgaben",
  "sorumluluklar", "sorumluluk", "iş tanımı", "is tanimi"
];

const MAX_HEADING_CHARS = 60;

/** Classifies a heading-shaped line; null means "not a heading". */
function headingTier(line: string): KeywordTier | "none" | null {
  if (isBulletLine(line)) return null;
  const cleaned = line.replace(/[:：]+$/g, "").trim().toLowerCase();
  if (cleaned.length === 0 || cleaned.length > MAX_HEADING_CHARS) return null;
  if (PREFERRED_HEADINGS.some((heading) => cleaned.includes(heading))) return "preferred";
  if (REQUIRED_HEADINGS.some((heading) => cleaned.includes(heading))) return "required";
  if (RESPONSIBILITY_HEADINGS.some((heading) => cleaned.includes(heading))) return "none";
  return null;
}

/** Walks the ad once and remembers the tier in effect on each line. */
function tierPerLine(lines: readonly string[]): (KeywordTier | undefined)[] {
  const tiers: (KeywordTier | undefined)[] = [];
  let current: KeywordTier | undefined;
  for (const line of lines) {
    const heading = headingTier(line);
    if (heading === "none") current = undefined;
    else if (heading !== null) current = heading;
    tiers.push(current);
  }
  return tiers;
}

function mergeTier(a: KeywordTier | undefined, b: KeywordTier | undefined): KeywordTier | undefined {
  if (a === "required" || b === "required") return "required";
  return a ?? b;
}

const TIER_WEIGHT: Readonly<Record<KeywordTier, number>> = { required: 1.5, preferred: 0.8 };

function weigh(candidate: Candidate): number {
  const base = Math.pow(candidate.frequency, 0.7);
  const skillBonus = isKnownSkill(candidate.term) ? 2.2 : 1;
  const tierMultiplier = candidate.tier ? TIER_WEIGHT[candidate.tier] : 1;
  const phraseBonus = candidate.term.includes(" ") ? 1.15 : 1;
  return round(base * skillBonus * tierMultiplier * phraseBonus, 3);
}

const TIER_RANK: Readonly<Record<KeywordTier, number>> = { required: 0, preferred: 2 };

function tierRank(tier: KeywordTier | undefined): number {
  return tier ? TIER_RANK[tier] : 1;
}

/**
 * Mines the job ad for the terms an ATS would index it by: known skills first,
 * then repeated domain words, tiered by the heading they were listed under.
 */
export function extractJobKeywords(jobDescription: string): KeywordTerm[] {
  const text = normalizeDocument(jobDescription);
  const lines = text.split("\n").map((line) => line.trim());
  const lowerLines = lines.map((line) => line.toLowerCase());
  const tiers = tierPerLine(lines);

  const candidates = new Map<string, Candidate>();

  for (const phrase of MULTI_WORD_SKILLS) {
    let frequency = 0;
    let tier: KeywordTier | undefined;
    lowerLines.forEach((line, index) => {
      const hits = countOccurrences(line, phrase);
      if (hits === 0) return;
      frequency += hits;
      tier = mergeTier(tier, tiers[index]);
    });
    if (frequency === 0) continue;
    candidates.set(phrase, { term: phrase, frequency, tier });
  }

  const frequencies = new Map<string, number>();
  const tokenTiers = new Map<string, KeywordTier | undefined>();

  lowerLines.forEach((line, index) => {
    const contextual = hasTechContext(line);
    for (const token of tokenize(line)) {
      const term = canonicalize(token);
      if (isStopword(term) || isJobNoise(term)) continue;
      if (/^\d+$/.test(term)) continue;
      if (term.length < 3 && !isKnownSkill(term)) continue;
      if (isAmbiguousTerm(token) && !contextual) continue;
      frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
      tokenTiers.set(term, mergeTier(tokenTiers.get(term), tiers[index]));
    }
  });

  for (const [term, frequency] of frequencies) {
    if (!isKnownSkill(term) && frequency < 2) continue;
    if (candidates.has(term)) continue;
    candidates.set(term, { term, frequency, tier: tokenTiers.get(term) });
  }

  const phrases = [...candidates.keys()].filter((term) => term.includes(" "));
  for (const phrase of phrases) {
    for (const word of phrase.split(" ")) {
      const nested = candidates.get(word);
      if (nested && !isKnownSkill(word)) candidates.delete(word);
    }
  }

  return [...candidates.values()]
    .map((candidate) => ({
      term: candidate.term,
      weight: weigh(candidate),
      hits: 0,
      ...(candidate.tier ? { tier: candidate.tier } : {})
    }))
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || b.weight - a.weight)
    .slice(0, MAX_TERMS);
}

function baselineTerms(context: ScoreContext): KeywordTerm[] {
  const found: KeywordTerm[] = [];

  for (const skill of MULTI_WORD_SKILLS) {
    const hits = countOccurrences(context.lower, skill);
    if (hits > 0) found.push({ term: skill, weight: 1, hits });
  }

  for (const line of context.lines) {
    const contextual = hasTechContext(line);
    for (const token of tokenize(line.toLowerCase())) {
      const term = canonicalize(token);
      if (!isKnownSkill(term) || term.includes(" ")) continue;
      if (isAmbiguousTerm(token) && !contextual) continue;
      if (found.some((entry) => entry.term === term)) continue;
      found.push({ term, weight: 1, hits: countOccurrences(context.lower, term) });
    }
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

  const aliasOnly: string[] = [];
  for (const term of matched) {
    const counts = countOccurrencesByVariant(context.lower, term.term);
    const canonical = counts.find((entry) => entry.variant === term.term);
    const viaAlias = counts.find((entry) => entry.variant !== term.term && entry.hits > 0);
    if ((canonical?.hits ?? 0) === 0 && viaAlias) {
      aliasOnly.push(`${term.term} (found as "${viaAlias.variant}")`);
    }
  }
  if (aliasOnly.length > 0) {
    drafts.push({
      id: "keywords.acronym-pair",
      severity: "low",
      title: "Some terms match only through a variant spelling",
      detail: `${aliasOnly.length} vacancy term(s) match your CV only via an alias: ${aliasOnly
        .slice(0, 5)
        .join("; ")}. A filter without a synonym table matches literally and misses these.`,
      fix: 'Write both forms once where they appear naturally, e.g. "Kubernetes (k8s)".',
      cost: 1,
      evidence: aliasOnly.slice(0, 5)
    });
  }

  const ranges = sectionRanges(context.sections, context.lines.length);
  const hasSkillsSection = ranges.some((range) => range.id === "skills");
  if (hasSkillsSection) {
    const listedOnly: string[] = [];
    for (const term of matched) {
      let inSkills = 0;
      let elsewhere = 0;
      context.lines.forEach((line, index) => {
        const hits = countOccurrences(line.toLowerCase(), term.term);
        if (hits === 0) return;
        if (lineSection(ranges, index) === "skills") inSkills += hits;
        else elsewhere += hits;
      });
      if (inSkills > 0 && elsewhere === 0) listedOnly.push(term.term);
    }

    if (listedOnly.length > 0) {
      drafts.push({
        id: "keywords.listed-only",
        severity: "low",
        title: "Some matched terms exist only as list items",
        detail: `These terms appear in the skills list but in no sentence about actual work: ${listedOnly
          .slice(0, 6)
          .join(", ")}. A list item carries no evidence, and both parsers and recruiters weight a term used in context higher.`,
        fix: "Work the strongest of these into an experience bullet that shows where and how you used it.",
        cost: listedOnly.length >= 4 ? 2 : 1,
        evidence: listedOnly.slice(0, 6)
      });
    }
  }

  const requirement = extractExperienceRequirement(jd);
  if (requirement && context.experience.periods.length > 0) {
    const gapMonths = requirement.years * 12 - context.experience.months;
    if (gapMonths >= 6) {
      drafts.push({
        id: "keywords.experience-gap",
        severity: gapMonths >= 24 ? "high" : "medium",
        title: `The ad asks for ${requirement.years}+ years; the parsed dates add up to less`,
        detail: `The date ranges in the CV total ${formatDuration(
          context.experience.months,
          context.language
        )}. A tenure filter compares exactly these two numbers before a human reads anything.`,
        fix: "If the total understates your real experience, make the timeline complete: concurrent roles, trimmed older roles and unexplained gaps all read as less time.",
        cost: gapMonths >= 24 ? 3 : 2,
        evidence: [requirement.source]
      });
    }
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

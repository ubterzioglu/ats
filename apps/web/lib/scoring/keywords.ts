import type { DocumentLanguage, KeywordReport, KeywordTerm, KeywordTier } from "@/types/analysis";

import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { formatDuration } from "./experience";
import { extractExperienceRequirement } from "./job-ad";
import { detectLanguage } from "./language";
import { countOccurrences, matchTerms } from "./match";
import { lineSection, sectionRanges } from "./sections";
import { isJobNoise, isStopword, JOB_POSTING_NOISE } from "./stopwords";
import { MULTI_WORD_SKILLS, SYNONYMS, canonicalize, hasTechContext, isAmbiguousTerm, isKnownSkill } from "./taxonomy";
import { caseFold, clamp, isBulletLine, normalizeDocument, round, tokenize } from "./text";
import { matchKeyTurkish } from "./turkish";

// The counting primitives moved to `./match`, where the three modes share them.
// Re-exported because they are this module's long-standing public surface.
export { countOccurrences, countOccurrencesByVariant, type VariantCount } from "./match";

export const KEYWORDS_MAX = 25;

/** Coverage at which the dimension is considered fully satisfied. */
const COVERAGE_TARGET = 0.7;
const MAX_TERMS = 40;
const BASELINE_MAX = 20;
const BASELINE_TARGET_SKILLS = 16;
const STUFFING_THRESHOLD = 12;

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
  const cleaned = caseFold(line.replace(/[:：]+$/g, "").trim());
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
 * Common sentence-opening words that are prose, not products. A capitalised
 * word at the start of a bullet is a verb far more often than it is a brand.
 */
const PROSE_WORDS: ReadonlySet<string> = new Set(
  `build design own run lead manage create develop maintain improve join help support
   drive ensure deliver collaborate partner keep make use write review take bring
   present model extend deploy operate monitor provide define plan organize coordinate
   mentor learn grow become start launch ship scale automate hire train handle move
   apply contact send check explore love enjoy want need require expect offer include
   work strengthen deepen shape craft`
    .split(/\s+/)
    .filter(Boolean)
);

const PHRASE_RX = /[A-Z][\p{L}\d+#.&']*(?:\s+[A-Z][\p{L}\d+#.&']*){1,3}/gu;
const ACRONYM_RX = /\b[A-Z][A-Z0-9]{1,5}\b/g;
const PROPER_RX = /\b[A-Z][\p{Ll}]{2,}\b/gu;
const CAMEL_RX = /\b(?:[A-Z][\p{Ll}\d]+){2,}[\p{L}\d]*\b|\b[\p{Ll}][\p{Ll}\d]*[A-Z][\p{L}\d]*\b/gu;
const HYPHEN_RX = /\b[\p{Ll}][\p{Ll}\d]*(?:-[\p{Ll}][\p{Ll}\d]*){1,3}\b/gu;
const LOWERCASE_WORD_RX = /\b[\p{Ll}][\p{L}\d+#']*/gu;

/** Multi-word synonym aliases, mapped to their canonical taxonomy term. */
const PHRASE_ALIASES: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    for (const alias of aliases) {
      if (alias.includes(" ")) map.set(alias, canonical);
    }
  }
  return map;
})();

interface Discovery {
  readonly tier: KeywordTier | undefined;
  readonly minFrequency: number;
}

function isProseWord(word: string, language: DocumentLanguage): boolean {
  return PROSE_WORDS.has(word) || isStopword(word, language) || isJobNoise(word);
}

/**
 * The noise list is flat, but Turkish noise words arrive inflected:
 * "deneyimi" is "deneyim" wearing a suffix. The stems of every noise entry
 * are precomputed so the stem key of a Turkish token can be checked against
 * them.
 */
const TURKISH_NOISE_KEYS: ReadonlySet<string> = new Set(
  [...JOB_POSTING_NOISE].map((word) => matchKeyTurkish(word))
);

const BULLET_PREFIX_RX = /^([-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+/;

/** Counts line-opening capitalised words whose lowercase form exists elsewhere. */
function proseCapitalCounts(
  lines: readonly string[],
  lowercaseVocab: ReadonlySet<string>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const first = line.replace(BULLET_PREFIX_RX, "").match(/^[\p{L}][\p{L}\d+#']*/u)?.[0];
    if (!first) continue;
    if (!/\p{Lu}/u.test(first[0] ?? "")) continue;
    const lower = first.toLowerCase();
    if (!lowercaseVocab.has(lower)) continue;
    counts.set(lower, (counts.get(lower) ?? 0) + 1);
  }
  return counts;
}

function buildLowercaseVocab(lines: readonly string[]): Set<string> {
  const vocab = new Set<string>();
  for (const line of lines) {
    for (const word of line.match(LOWERCASE_WORD_RX) ?? []) {
      vocab.add(word.toLowerCase());
    }
  }
  return vocab;
}

/**
 * Finds the terms no taxonomy knows: capitalised phrases, acronyms, camelCase
 * product names and hyphenated compounds. A word capitalised only because it
 * opens a sentence - its lowercase form appears elsewhere in the ad - is prose
 * and gets dropped; "Snowflake" and "OpenTelemetry" stay.
 */
function discoverTerms(
  lines: readonly string[],
  lowerLines: readonly string[],
  tiers: readonly (KeywordTier | undefined)[],
  candidates: ReadonlyMap<string, Candidate>,
  lowercaseVocab: ReadonlySet<string>,
  language: DocumentLanguage
): Map<string, Discovery> {
  const lower = lowerLines.join("\n");
  const titleIndex = lines.findIndex((line) => line.length > 0);
  const discovered = new Map<string, Discovery>();

  const known = (term: string): boolean => candidates.has(term) || discovered.has(term);
  const offer = (raw: string, minFrequency: number, tier: KeywordTier | undefined): void => {
    const trimmed = raw.replace(/^[^\p{L}\d]+|[.,;:!?]+$/gu, "");
    if (trimmed.length < 2) return;
    const term = trimmed.includes(" ")
      ? PHRASE_ALIASES.get(trimmed.toLowerCase()) ?? trimmed.toLowerCase()
      : canonicalize(trimmed.toLowerCase());
    if (known(term)) return;
    discovered.set(term, { tier, minFrequency });
  };

  lines.forEach((line, index) => {
    if (index === titleIndex || line.length === 0) return;
    if (headingTier(line) !== null) return;

    const tier = tiers[index];
    const claimed: [number, number][] = [];

    PHRASE_RX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PHRASE_RX.exec(line)) !== null) {
      const span: [number, number] = [match.index, match.index + match[0].length];
      claimed.push(span);
      const words = match[0].split(/\s+/);
      const firstWord = (words[0] ?? "").toLowerCase();
      if (isProseWord(firstWord, language) || lowercaseVocab.has(firstWord)) continue;
      if (words.some((word) => isProseWord(word.toLowerCase(), language))) continue;
      offer(match[0], 2, tier);
    }

    CAMEL_RX.lastIndex = 0;
    while ((match = CAMEL_RX.exec(line)) !== null) {
      offer(match[0].toLowerCase(), 1, tier);
    }

    ACRONYM_RX.lastIndex = 0;
    while ((match = ACRONYM_RX.exec(line)) !== null) {
      const term = match[0].toLowerCase();
      if (isProseWord(term, language)) continue;
      offer(term, 2, tier);
    }

    const bulletEnd = line.match(/^([-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+/)?.[0].length ?? 0;
    PROPER_RX.lastIndex = 0;
    while ((match = PROPER_RX.exec(line)) !== null) {
      const at = match.index;
      const width = match[0].length;
      if (claimed.some(([start, end]) => at < end && at + width > start)) continue;
      const term = match[0].toLowerCase();
      if (isProseWord(term, language)) continue;
      const sentenceStart =
        at === 0 || at === bulletEnd || /[.!?]\s+$/.test(line.slice(0, at));
      if (sentenceStart && lowercaseVocab.has(term)) continue;
      offer(term, 2, tier);
    }

    HYPHEN_RX.lastIndex = 0;
    while ((match = HYPHEN_RX.exec(lowerLines[index] ?? "")) !== null) {
      const parts = match[0].split("-");
      if (parts.some((part) => isProseWord(part, language) || isAmbiguousTerm(part))) continue;
      offer(match[0], 2, tier);
    }
  });

  for (const [term, discovery] of discovered) {
    if (countOccurrences(lower, term) < discovery.minFrequency) discovered.delete(term);
  }

  return discovered;
}

/**
 * Mines the job ad for the terms an ATS would index it by: known skills first,
 * then repeated domain words, tiered by the heading they were listed under.
 */
export function extractJobKeywords(jobDescription: string): KeywordTerm[] {
  const text = normalizeDocument(jobDescription);
  const language = detectLanguage(text);
  const lines = text.split("\n").map((line) => line.trim());
  const lowerLines = lines.map((line) => caseFold(line));
  const tiers = tierPerLine(lines);
  const lowercaseVocab = buildLowercaseVocab(lines);

  const candidates = new Map<string, Candidate>();

  for (const phrase of MULTI_WORD_SKILLS) {
    let frequency = 0;
    let tier: KeywordTier | undefined;
    lowerLines.forEach((line, index) => {
      const hits = countOccurrences(line, phrase, language);
      if (hits === 0) return;
      frequency += hits;
      tier = mergeTier(tier, tiers[index]);
    });
    if (frequency === 0) continue;
    candidates.set(phrase, { term: phrase, frequency, tier });
  }

  // A Turkish ad repeats a domain word in different inflections
  // ("deneyim ... deneyimi ... deneyimine"), so frequencies are tallied on the
  // stem key while the shortest surface seen is kept for display and matching.
  const frequencies = new Map<string, number>();
  const tokenTiers = new Map<string, KeywordTier | undefined>();
  const surfaces = new Map<string, string>();

  lowerLines.forEach((line, index) => {
    const contextual = hasTechContext(line);
    for (const token of tokenize(line)) {
      const term = canonicalize(token);
      if (isStopword(term, language) || isJobNoise(term)) continue;
      if (/^\d+$/.test(term)) continue;
      const key = language === "tr" ? matchKeyTurkish(term) : term;
      if (
        language === "tr" &&
        key !== term &&
        (isStopword(key, language) || TURKISH_NOISE_KEYS.has(key))
      ) {
        continue;
      }
      if (key.length < 3 && !isKnownSkill(key)) continue;
      if (isAmbiguousTerm(token) && !contextual) continue;
      frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
      tokenTiers.set(key, mergeTier(tokenTiers.get(key), tiers[index]));
      const known = surfaces.get(key);
      if (known === undefined || term.length < known.length) surfaces.set(key, term);
    }
  });

  // A word capitalised only because it opens its line, whose lowercase form
  // appears elsewhere in the ad, is prose - that occurrence should not push
  // the word over the repeated-domain-word bar.
  for (const [term, count] of proseCapitalCounts(lines, lowercaseVocab)) {
    const key = language === "tr" ? matchKeyTurkish(term) : term;
    const existing = frequencies.get(key);
    if (existing === undefined) continue;
    if (existing - count <= 0) frequencies.delete(key);
    else frequencies.set(key, existing - count);
  }

  for (const [key, frequency] of frequencies) {
    if (frequency <= 0) continue;
    if (!isKnownSkill(key) && frequency < 2) continue;
    const surface = surfaces.get(key) ?? key;
    if (candidates.has(surface)) continue;
    candidates.set(surface, { term: surface, frequency, tier: tokenTiers.get(key) });
  }

  const discovered = discoverTerms(lines, lowerLines, tiers, candidates, lowercaseVocab, language);
  const lower = lowerLines.join("\n");
  for (const [term, discovery] of discovered) {
    candidates.set(term, {
      term,
      frequency: countOccurrences(lower, term, language),
      tier: discovery.tier
    });
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
    const hits = countOccurrences(context.lower, skill, context.language);
    if (hits > 0) found.push({ term: skill, weight: 1, hits });
  }

  for (const line of context.lines) {
    const contextual = hasTechContext(line);
    for (const token of tokenize(line)) {
      const term = canonicalize(token);
      if (!isKnownSkill(term) || term.includes(" ")) continue;
      if (isAmbiguousTerm(token) && !contextual) continue;
      if (found.some((entry) => entry.term === term)) continue;
      found.push({ term, weight: 1, hits: countOccurrences(context.lower, term, context.language) });
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

  // The score runs in normalized mode and only ever in normalized mode. Strict
  // and semantic are offered as a comparison beside it; a score that moved with
  // the mode would not be a score.
  const { coverage, matched, missing } = matchTerms(
    terms,
    context.lower,
    context.language,
    "normalized"
  );

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

  const aliasOnly = matched
    .filter((term) => term.alias !== undefined)
    .map((term) => `${term.term} (found as "${term.alias}")`);
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
        const hits = countOccurrences(caseFold(line), term.term, context.language);
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

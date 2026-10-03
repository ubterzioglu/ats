/**
 * One matching engine, three modes.
 *
 * A keyword filter is not one thing. The oldest ones compare strings and
 * nothing else; a modern one carries a synonym table and a stemmer; the newest
 * compare meaning. A CV scores differently against each, and a report that
 * names only one number hides which kind of system the candidate is facing. So
 * the same terms are run three ways and the difference is attributable to
 * named terms.
 *
 * Semantic similarity is computed outside this file - models live in `lib/ai`,
 * which may never feed `lib/scoring`. It arrives here as `SemanticHit[]`: plain
 * data, already measured, that this module only reads. The engine stays pure
 * and the same inputs always produce the same output.
 */

import type { DocumentLanguage, KeywordTerm, MatchMode, MatchOutcome } from "@/types/analysis";

import { germanVariants } from "./german";
import { hasTechContext, isAmbiguousTerm, variantsOf } from "./taxonomy";
import { tokenize } from "./text";
import { hasTurkishCharacters, matchKeyTurkish } from "./turkish";

/**
 * A similarity reading taken elsewhere: the CV passage that came closest to a
 * term the literal matcher could not find, and how close it came.
 */
export interface SemanticHit {
  readonly term: string;
  readonly passage: string;
  readonly similarity: number;
}

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

/** Counts tokens whose Turkish stem-and-fold key equals the term's. */
function countByTurkishKey(haystack: string, term: string): number {
  const key = matchKeyTurkish(term);
  if (key.length === 0) return 0;
  let hits = 0;
  for (const token of tokenize(haystack)) {
    if (matchKeyTurkish(token) === key) hits += 1;
  }
  return hits;
}

/**
 * Counts one spelling and no other: what a filter that compares strings does.
 * The ambiguity guard still applies, because "go" inside "go-live" is not the
 * language however literal the comparison is.
 */
export function countLiteral(haystack: string, term: string): number {
  let hits = 0;
  for (const line of haystack.split("\n")) {
    if (isAmbiguousTerm(term) && !hasTechContext(line)) continue;
    hits += line.match(termPattern(term))?.length ?? 0;
  }
  return hits;
}

/**
 * Literal variant counting, extended for Turkish and German. Turkish is
 * agglutinative: the ad says "geliştirme", the CV says "geliştirdim", and no
 * literal pattern pairs them, so Turkish tokens are matched on their stem key
 * as well. German compounds: the ad says "Testautomatisierung", the CV says
 * "Test-Automatisierung", so each term also carries its split and joined
 * surface forms. Stem hits top up the canonical variant.
 */
export function countOccurrencesByVariant(
  haystack: string,
  term: string,
  language?: DocumentLanguage
): VariantCount[] {
  const variants = [...new Set([...variantsOf(term), ...germanVariants(term)])];
  const totals = new Map<string, number>();
  for (const line of haystack.split("\n")) {
    for (const variant of variants) {
      if (isAmbiguousTerm(variant) && !hasTechContext(line)) continue;
      const matches = line.match(termPattern(variant));
      if (matches) totals.set(variant, (totals.get(variant) ?? 0) + matches.length);
    }
  }
  const counts = variants.map((variant) => ({
    variant,
    hits: totals.get(variant) ?? 0
  }));

  const turkish = language === "tr" || hasTurkishCharacters(term);
  if (turkish && !term.includes(" ")) {
    const stemHits = countByTurkishKey(haystack, term);
    const literalHits = counts.reduce((sum, entry) => sum + entry.hits, 0);
    const canonical = counts[0];
    if (canonical !== undefined && stemHits > literalHits) {
      counts[0] = { variant: canonical.variant, hits: canonical.hits + stemHits - literalHits };
    }
  }

  return counts;
}

export function countOccurrences(
  haystack: string,
  term: string,
  language?: DocumentLanguage
): number {
  return countOccurrencesByVariant(haystack, term, language).reduce(
    (sum, entry) => sum + entry.hits,
    0
  );
}

/**
 * The variant that carried a match when the canonical spelling never appears -
 * the acronym-only case a filter without a synonym table would miss. Strict
 * mode has no variants, so it has no aliases either.
 */
function aliasFor(counts: readonly VariantCount[], term: string): string | undefined {
  const canonical = counts.find((entry) => entry.variant === term);
  if ((canonical?.hits ?? 0) > 0) return undefined;
  return counts.find((entry) => entry.variant !== term && entry.hits > 0)?.variant;
}

function literalPass(
  term: KeywordTerm,
  haystack: string,
  language: DocumentLanguage | undefined,
  mode: MatchMode
): KeywordTerm {
  if (mode === "strict") {
    return { ...term, hits: countLiteral(haystack, term.term) };
  }

  const counts = countOccurrencesByVariant(haystack, term.term, language);
  const hits = counts.reduce((sum, entry) => sum + entry.hits, 0);
  const alias = hits > 0 ? aliasFor(counts, term.term) : undefined;
  return alias ? { ...term, hits, alias } : { ...term, hits };
}

/**
 * Runs the ad's terms against the CV in one of the three modes.
 *
 * `semanticHits` is read only in semantic mode, and only for terms the literal
 * pass left at zero: a term that is genuinely written in the CV is never
 * downgraded to a guess. A semantically accepted term keeps `hits` at zero and
 * carries its evidence instead, so no view can present it as a real mention.
 */
export function matchTerms(
  terms: readonly KeywordTerm[],
  haystack: string,
  language: DocumentLanguage | undefined,
  mode: MatchMode,
  semanticHits: readonly SemanticHit[] = []
): MatchOutcome {
  const hintFor = new Map(semanticHits.map((hit) => [hit.term, hit]));

  const scored = terms.map((term) => {
    const literal = literalPass(term, haystack, language, mode);
    if (mode !== "semantic" || literal.hits > 0) return literal;

    const hint = hintFor.get(term.term);
    if (!hint) return literal;

    return {
      ...literal,
      semantic: { passage: hint.passage, similarity: hint.similarity }
    };
  });

  const isMatch = (term: KeywordTerm): boolean => term.hits > 0 || term.semantic !== undefined;
  const totalWeight = scored.reduce((sum, term) => sum + term.weight, 0);
  const matchedWeight = scored.filter(isMatch).reduce((sum, term) => sum + term.weight, 0);

  return {
    mode,
    // Unrounded: the score divides by it before rounding, and rounding twice
    // moves a score by a point at the boundaries.
    coverage: totalWeight > 0 ? matchedWeight / totalWeight : 0,
    matched: scored.filter(isMatch),
    missing: scored.filter((term) => !isMatch(term))
  };
}

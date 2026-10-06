import type { DocumentLanguage } from "@/types/analysis";

import { detectLanguage } from "@/lib/scoring/language";

import type { HelpAnswer, HelpAnswerer, HelpEntry, HelpResolver } from "./types";
import { normalizeQuestion, removeStopwords, tokenise } from "./normalize";

const SCORE_THRESHOLD = 1;
const ANSWER_SEARCH_THRESHOLD = 0.5;
const SUGGEST_THRESHOLD = 0.5;

interface ScoredEntry {
  readonly entry: HelpEntry;
  readonly score: number;
}

/**
 * Scores one entry against the question tokens. Multi-word keywords are
 * matched as a phrase when all tokens appear consecutively in the question.
 */
function scoreEntry(entry: HelpEntry, questionTokens: readonly string[], language: DocumentLanguage): number {
  const keywords = entry.keywords[language] ?? entry.keywords.en;
  const normalisedKeywords = keywords.map((keyword) =>
    normalizeQuestion(keyword, language)
  );

  let score = 0;
  const questionText = questionTokens.join(" ");

  for (const keyword of normalisedKeywords) {
    const keywordTokens = tokenise(keyword);
    
    // Multi-word keyword: check for consecutive match
    if (keywordTokens.length > 1) {
      const phrase = keywordTokens.join(" ");
      if (questionText.includes(phrase)) {
        score += keywordTokens.length * 2;
      } else {
        // Partial match: count overlapping tokens
        for (const token of keywordTokens) {
          if (questionTokens.includes(token)) {
            score += 1;
          }
        }
      }
    } else {
      // Single-word keyword
      const token = keywordTokens[0];
      if (!token) continue;
      
      if (questionTokens.includes(token)) {
        score += 2;
      } else if (questionText.includes(token) && token.length >= 3) {
        score += 1;
      }
    }
  }
  return score;
}

/**
 * Searches the answer text for question tokens. Returns a low score for
 * partial matches, used as a fallback when keyword matching fails.
 */
function scoreAnswerText(
  entry: HelpEntry,
  questionTokens: readonly string[],
  resolve: HelpResolver
): number {
  const answerText = normalizeQuestion(resolve(entry.answerKey), "en");
  const answerTokens = removeStopwords(tokenise(answerText), "en");
  
  let matches = 0;
  for (const token of questionTokens) {
    if (token.length < 3) continue;
    if (answerTokens.includes(token)) {
      matches += 1;
    } else if (answerText.includes(token)) {
      matches += 0.5;
    }
  }
  
  return questionTokens.length > 0 ? matches / questionTokens.length : 0;
}

export function createKeywordAnswerer({
  entries,
  resolve,
  locale
}: {
  readonly entries: readonly HelpEntry[];
  readonly resolve: HelpResolver;
  readonly locale: DocumentLanguage;
}): HelpAnswerer {
  return {
    async answer(question: string, _signal?: AbortSignal): Promise<HelpAnswer> {
      const trimmed = question.trim();
      if (trimmed.length === 0) return { kind: "none" };

      const language = locale ?? detectLanguage(trimmed);
      const normalised = normalizeQuestion(trimmed, language);
      if (normalised.length === 0) return { kind: "none" };

      const tokens = removeStopwords(tokenise(normalised), language);
      if (tokens.length === 0) return { kind: "none" };

      // First pass: keyword matching
      const scored: ScoredEntry[] = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, tokens, language) }))
        .filter((item) => item.score >= SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const best = scored[0];
        if (best) {
          const text = resolve(best.entry.answerKey);
          return {
            kind: "text",
            text,
            ...(best.entry.href ? { href: best.entry.href } : {})
          };
        }
      }

      // Second pass: answer text search (low weight)
      const answerScored: ScoredEntry[] = entries
        .map((entry) => ({ entry, score: scoreAnswerText(entry, tokens, resolve) }))
        .filter((item) => item.score >= ANSWER_SEARCH_THRESHOLD)
        .sort((a, b) => b.score - a.score);

      if (answerScored.length > 0) {
        const best = answerScored[0];
        if (best) {
          const text = resolve(best.entry.answerKey);
          return {
            kind: "text",
            text,
            ...(best.entry.href ? { href: best.entry.href } : {})
          };
        }
      }

      // Suggest: did you mean?
      const nearMiss: ScoredEntry[] = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, tokens, language) }))
        .filter((item) => item.score >= SUGGEST_THRESHOLD && item.score < SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

      if (nearMiss.length > 0) {
        const best = nearMiss[0];
        if (best) {
          return {
            kind: "suggest",
            suggestion: resolve(best.entry.answerKey),
            entryId: best.entry.id
          };
        }
      }

      return { kind: "none" };
    }
  };
}

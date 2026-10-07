import type { DocumentLanguage } from "@/types/analysis";

import { detectLanguage } from "@/lib/scoring/language";
import { matchKeyTurkish } from "@/lib/scoring/turkish";
import { splitCompound } from "@/lib/scoring/german";

import type { HelpAnswer, HelpAnswerer, HelpEntry, HelpResolver } from "./types";
import { normalizeQuestion, removeStopwords, tokenise } from "./normalize";

const SCORE_THRESHOLD = 1;
const ANSWER_SEARCH_THRESHOLD = 0.5;
const SUGGEST_THRESHOLD = 0.5;

// BM25 parameters
const BM25_K1 = 1.5;
const BM25_B = 0.75;

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
 * Language-specific token matching: Turkish stemming and German compound splitting.
 * Returns true if the question token matches the keyword token in the given language.
 */
function tokensMatch(questionToken: string, keywordToken: string, language: DocumentLanguage): boolean {
  // Exact match
  if (questionToken === keywordToken) return true;
  
  // Turkish: compare stem keys
  if (language === "tr") {
    return matchKeyTurkish(questionToken) === matchKeyTurkish(keywordToken);
  }
  
  // German: check if compound splits match
  if (language === "de") {
    const questionSplit = splitCompound(questionToken);
    const keywordSplit = splitCompound(keywordToken);
    
    // If both split, check if they share components
    if (questionSplit && keywordSplit) {
      return questionSplit.some((q) => keywordSplit.includes(q));
    }
    
    // If one splits, check if the other contains any component
    if (questionSplit) {
      return questionSplit.includes(keywordToken);
    }
    if (keywordSplit) {
      return keywordSplit.includes(questionToken);
    }
  }
  
  return false;
}

/**
 * BM25 scoring: considers term frequency, inverse document frequency, and document length.
 */
function bm25Score(
  entry: HelpEntry,
  questionTokens: readonly string[],
  language: DocumentLanguage,
  allEntries: readonly HelpEntry[]
): number {
  const keywords = entry.keywords[language] ?? entry.keywords.en;
  const normalisedKeywords = keywords.map((keyword) =>
    normalizeQuestion(keyword, language)
  );
  const keywordTokens = normalisedKeywords.flatMap((kw) => tokenise(kw));
  
  // Document length (number of keyword tokens in this entry)
  const docLength = keywordTokens.length;
  
  // Average document length across all entries
  const avgDocLength = allEntries.reduce((sum, e) => {
    const kw = e.keywords[language] ?? e.keywords.en;
    return sum + kw.flatMap((k) => tokenise(normalizeQuestion(k, language))).length;
  }, 0) / allEntries.length;
  
  // Document frequency: how many entries contain each question token
  const df = new Map<string, number>();
  for (const token of questionTokens) {
    let count = 0;
    for (const e of allEntries) {
      const kw = e.keywords[language] ?? e.keywords.en;
      const tokens = kw.flatMap((k) => tokenise(normalizeQuestion(k, language)));
      if (tokens.some((t) => tokensMatch(token, t, language))) {
        count++;
      }
    }
    df.set(token, count);
  }
  
  // Term frequency in this entry
  const tf = new Map<string, number>();
  for (const token of questionTokens) {
    let count = 0;
    for (const kt of keywordTokens) {
      if (tokensMatch(token, kt, language)) {
        count++;
      }
    }
    tf.set(token, count);
  }
  
  // Calculate BM25 score
  const N = allEntries.length;
  let score = 0;
  
  for (const token of questionTokens) {
    const termFreq = tf.get(token) ?? 0;
    if (termFreq === 0) continue;
    
    const docFreq = df.get(token) ?? 0;
    // IDF with smoothing to avoid division by zero
    const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
    
    // BM25 term score
    const tfNorm = (termFreq * (BM25_K1 + 1)) / (termFreq + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength)));
    
    score += idf * tfNorm;
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

      // First pass: BM25 keyword matching with language-specific features
      const scored: ScoredEntry[] = entries
        .map((entry) => ({ entry, score: bm25Score(entry, tokens, language, entries) }))
        .filter((item) => item.score >= SCORE_THRESHOLD)
        .sort((a, b) => {
          // Primary: BM25 score (descending)
          if (b.score !== a.score) return b.score - a.score;
          // Tie-break: entry id (ascending) for deterministic ordering
          return a.entry.id.localeCompare(b.entry.id);
        });

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
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.entry.id.localeCompare(b.entry.id);
        });

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
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.entry.id.localeCompare(b.entry.id);
        });

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

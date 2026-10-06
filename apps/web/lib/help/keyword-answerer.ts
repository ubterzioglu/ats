import type { DocumentLanguage } from "@/types/analysis";

import { detectLanguage } from "@/lib/scoring/language";

import type { HelpAnswer, HelpAnswerer, HelpEntry, HelpResolver } from "./types";
import { normalizeQuestion, removeStopwords, tokenise } from "./normalize";

const SCORE_THRESHOLD = 1;

interface ScoredEntry {
  readonly entry: HelpEntry;
  readonly score: number;
}

function scoreEntry(entry: HelpEntry, questionTokens: readonly string[], language: DocumentLanguage): number {
  const keywords = entry.keywords[language] ?? entry.keywords.en;
  const normalisedKeywords = keywords.map((keyword) =>
    normalizeQuestion(keyword, language)
  );

  let score = 0;
  for (const token of questionTokens) {
    for (const keyword of normalisedKeywords) {
      if (keyword === token) {
        score += 2;
      } else if (keyword.includes(token) && token.length >= 3) {
        score += 1;
      }
    }
  }
  return score;
}

export function createKeywordAnswerer({
  entries,
  resolve
}: {
  readonly entries: readonly HelpEntry[];
  readonly resolve: HelpResolver;
}): HelpAnswerer {
  return {
    async answer(question: string, _signal?: AbortSignal): Promise<HelpAnswer> {
      const trimmed = question.trim();
      if (trimmed.length === 0) return { kind: "none" };

      const language = detectLanguage(trimmed);
      const normalised = normalizeQuestion(trimmed, language);
      if (normalised.length === 0) return { kind: "none" };

      const tokens = removeStopwords(tokenise(normalised), language);
      if (tokens.length === 0) return { kind: "none" };

      const scored: ScoredEntry[] = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, tokens, language) }))
        .filter((item) => item.score >= SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) return { kind: "none" };

      const best = scored[0];
      if (!best) return { kind: "none" };

      const text = resolve(best.entry.answerKey);
      return {
        kind: "text",
        text,
        ...(best.entry.href ? { href: best.entry.href } : {})
      };
    }
  };
}

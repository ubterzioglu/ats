import type { DocumentLanguage } from "@/types/analysis";

import { STOPWORDS_DE, STOPWORDS_EN, STOPWORDS_TR } from "./stopwords";
import { tokenize } from "./text";

const MARKERS: ReadonlyArray<readonly [DocumentLanguage, ReadonlySet<string>]> = [
  ["en", STOPWORDS_EN],
  ["de", STOPWORDS_DE],
  ["tr", STOPWORDS_TR]
];

/**
 * Stopword-frequency language detection. Good enough for picking the right
 * section and verb dictionaries, which is all the scorer needs it for.
 */
export function detectLanguage(text: string): DocumentLanguage {
  const tokens = tokenize(text).slice(0, 4000);
  if (tokens.length === 0) return "en";

  let best: DocumentLanguage = "en";
  let bestScore = -1;

  for (const [language, stopwords] of MARKERS) {
    let hits = 0;
    for (const token of tokens) {
      if (stopwords.has(token)) hits += 1;
    }
    const score = hits / tokens.length;
    if (score > bestScore) {
      bestScore = score;
      best = language;
    }
  }

  return best;
}

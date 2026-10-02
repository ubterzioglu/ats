import type { Embedder } from "./embeddings";

/**
 * Advisory partial matching: for a term the literal matcher reports missing,
 * find the CV passage that comes closest in embedding space. Hints never
 * touch scoring - lib/scoring never sees this module's output.
 *
 * multilingual-e5-small expects a task prefix: "query: " on the search side,
 * "passage: " on the document side. Vectors come back normalized, so cosine
 * similarity is a plain dot product.
 */

export interface PartialMatchHint {
  readonly term: string;
  readonly passage: string;
  readonly similarity: number;
}

export const PARTIAL_MATCH_THRESHOLD = 0.55;

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    sum += (a[index] ?? 0) * (b[index] ?? 0);
  }
  return sum;
}

/** Lines worth comparing: bullets and sentences with actual content in them. */
export function toPassages(cvText: string): string[] {
  return cvText
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+/, "").trim())
    .filter((line) => line.split(/\s+/).length >= 4 && line.split(/\s+/).length <= 60);
}

export async function findPartialMatches(
  embedder: Embedder,
  missingTerms: readonly string[],
  passages: readonly string[],
  threshold: number = PARTIAL_MATCH_THRESHOLD
): Promise<PartialMatchHint[]> {
  if (missingTerms.length === 0 || passages.length === 0) return [];

  const [termVectors, passageVectors] = await Promise.all([
    embedder.embed(missingTerms.map((term) => `query: find passages mentioning ${term}`)),
    embedder.embed(passages.map((passage) => `passage: ${passage}`))
  ]);

  const hints: PartialMatchHint[] = [];
  termVectors.forEach((vector, termIndex) => {
    const term = missingTerms[termIndex];
    if (!term) return;
    let bestIndex = -1;
    let best = threshold;
    passageVectors.forEach((passageVector, passageIndex) => {
      const similarity = cosineSimilarity(vector, passageVector);
      if (similarity > best) {
        best = similarity;
        bestIndex = passageIndex;
      }
    });
    const passage = bestIndex >= 0 ? passages[bestIndex] : undefined;
    if (passage !== undefined) {
      hints.push({ term, passage, similarity: Math.round(best * 100) / 100 });
    }
  });

  return hints;
}

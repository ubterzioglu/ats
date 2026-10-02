import { cosineSimilarity } from "./semantic-match";

import type { Embedder } from "./embeddings";

/**
 * Weak-coverage mapping: split the ad and the CV into chunks, embed both,
 * and list the ad chunks whose best cosine against any CV chunk stays below
 * the threshold. These are the parts of the vacancy the document never
 * addresses, even semantically. Advisory only - scores never see this.
 */

export const CV_CHUNK_WORDS = 200;
export const AD_CHUNK_WORDS = 100;
export const WEAK_THRESHOLD = 0.5;

export interface WeakAdChunk {
  readonly chunk: string;
  readonly best: number;
}

export interface CoverageMapReport {
  readonly adChunks: number;
  readonly threshold: number;
  readonly weak: readonly WeakAdChunk[];
}

/** Splits text into consecutive word chunks, keeping the words intact. */
export function chunkWords(text: string, size: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || size <= 0) return [];
  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += size) {
    chunks.push(words.slice(start, start + size).join(" "));
  }
  return chunks;
}

export async function buildCoverageMap(
  embedder: Embedder,
  cvText: string,
  adText: string
): Promise<CoverageMapReport> {
  const adChunks = chunkWords(adText, AD_CHUNK_WORDS);
  const cvChunks = chunkWords(cvText, CV_CHUNK_WORDS);
  if (adChunks.length === 0 || cvChunks.length === 0) {
    return { adChunks: adChunks.length, threshold: WEAK_THRESHOLD, weak: [] };
  }

  const [adVectors, cvVectors] = await Promise.all([
    embedder.embed(adChunks.map((chunk) => `query: ${chunk}`)),
    embedder.embed(cvChunks.map((chunk) => `passage: ${chunk}`))
  ]);

  const weak: WeakAdChunk[] = [];
  adVectors.forEach((adVector, index) => {
    const chunk = adChunks[index];
    if (chunk === undefined) return;
    const best = cvVectors.reduce(
      (highest, cvVector) => Math.max(highest, cosineSimilarity(adVector, cvVector)),
      0
    );
    if (best < WEAK_THRESHOLD) {
      weak.push({ chunk, best: Math.round(best * 100) / 100 });
    }
  });

  return { adChunks: adChunks.length, threshold: WEAK_THRESHOLD, weak };
}

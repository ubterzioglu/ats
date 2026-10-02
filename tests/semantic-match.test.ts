import { describe, expect, it } from "vitest";

import type { Embedder } from "@/lib/ai/embeddings";
import {
  cosineSimilarity,
  findPartialMatches,
  toPassages
} from "@/lib/ai/semantic-match";

/**
 * The model itself is browser-only, but the maths and the plumbing around it
 * are pure: cosine, passage selection and the best-match rule all run here
 * against a stub embedder.
 */

function stubEmbedder(): Embedder {
  return {
    async embed(texts: readonly string[]): Promise<number[][]> {
      return texts.map((text) => {
        const lower = text.toLowerCase();
        const vector = [
          lower.includes("postgres") ? 1 : 0,
          lower.includes("docker") ? 1 : 0
        ];
        const norm = Math.hypot(...vector) || 1;
        return vector.map((value) => value / norm);
      });
    },
    terminate() {}
  };
}

describe("cosineSimilarity", () => {
  it("is a dot product on normalized vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([0.6, 0.8], [0.6, 0.8])).toBeCloseTo(1);
  });

  it("is zero for mismatched or empty vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });
});

describe("toPassages", () => {
  it("strips bullet markers and drops lines too short to carry meaning", () => {
    const passages = toPassages(`Jane Doe
- Migrated the primary store to Postgres with zero downtime.
Skills
a@b.com
`);
    expect(passages).toEqual(["Migrated the primary store to Postgres with zero downtime."]);
  });
});

describe("findPartialMatches", () => {
  const passages = [
    "Migrated the primary store to Postgres with zero downtime.",
    "Automated the release pipeline and kept Docker images small."
  ];

  it("points a missing term at the closest passage", async () => {
    const hints = await findPartialMatches(stubEmbedder(), ["postgresql"], passages);
    expect(hints).toHaveLength(1);
    expect(hints[0]?.term).toBe("postgresql");
    expect(hints[0]?.passage).toContain("Postgres");
    expect(hints[0]?.similarity).toBeGreaterThanOrEqual(0.55);
  });

  it("stays silent when nothing crosses the threshold", async () => {
    const hints = await findPartialMatches(stubEmbedder(), ["kafka"], passages);
    expect(hints).toEqual([]);
  });

  it("returns nothing for empty inputs", async () => {
    expect(await findPartialMatches(stubEmbedder(), [], passages)).toEqual([]);
    expect(await findPartialMatches(stubEmbedder(), ["postgresql"], [])).toEqual([]);
  });
});

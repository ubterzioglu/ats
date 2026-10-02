import { describe, expect, it } from "vitest";

import { buildCoverageMap, chunkWords } from "@/lib/ai/coverage-map";
import type { Embedder } from "@/lib/ai/embeddings";

/**
 * The chunking and the matrix rule are pure; only the vectors come from the
 * browser model. The stub scores a chunk by whether it mentions postgres,
 * which is enough to prove the weak-chunk selection.
 */

function stubEmbedder(): Embedder {
  return {
    async embed(texts: readonly string[]): Promise<number[][]> {
      return texts.map((text) =>
        text.toLowerCase().includes("postgres") ? [1, 0] : [0, 1]
      );
    },
    terminate() {}
  };
}

describe("chunkWords", () => {
  it("splits into consecutive word chunks", () => {
    expect(chunkWords("a b c d e", 2)).toEqual(["a b", "c d", "e"]);
  });

  it("returns nothing for empty text", () => {
    expect(chunkWords("   \n ", 10)).toEqual([]);
  });
});

describe("buildCoverageMap", () => {
  const cv = `Migrated the primary store to Postgres with zero downtime and kept replicas warm.
The migration covered schema design, replication and the cutover weekend plan.`;

  it("lists ad chunks the CV never addresses", async () => {
    // Chunks are 100 words, so pad the Kafka half past the boundary to keep
    // the Postgres sentence in a chunk of its own.
    const filler = Array.from({ length: 90 }, (_, index) => `filler${index}`).join(" ");
    const ad = `Manage our Kafka event streams and the Flink jobs around them with care. ${filler} Maintain the Postgres cluster and the replica topology for the platform.`;
    const report = await buildCoverageMap(stubEmbedder(), cv, ad);
    expect(report.adChunks).toBe(2);
    expect(report.weak).toHaveLength(1);
    expect(report.weak[0]?.chunk).toContain("Kafka");
    expect(report.weak[0]?.best).toBeLessThan(report.threshold);
  });

  it("reports nothing weak when every chunk is covered", async () => {
    const ad = "Own the Postgres cluster and the Postgres replica topology.";
    const report = await buildCoverageMap(stubEmbedder(), cv, ad);
    expect(report.weak).toEqual([]);
  });

  it("handles an empty side gracefully", async () => {
    const report = await buildCoverageMap(stubEmbedder(), "", "Some ad text about postgres");
    expect(report.weak).toEqual([]);
  });
});

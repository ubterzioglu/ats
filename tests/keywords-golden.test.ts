import { describe, expect, it } from "vitest";

import { extractJobKeywords } from "@/lib/scoring/keywords";

import { GOLDEN_JOB_ADS, type GoldenJobAd } from "./fixtures/job-ads";

/**
 * Measures keyword extraction against hand-labelled ads, so the weights in
 * `weigh()` and the MAX_TERMS cut-off can be tuned against numbers rather than
 * judgement. A change that drops either metric fails here instead of silently
 * degrading the match.
 */

const PRECISION_FLOOR = 0.8;
const RECALL_FLOOR = 0.4;

interface Measurement {
  readonly precision: number;
  readonly recall: number;
  readonly missed: readonly string[];
  readonly spurious: readonly string[];
  readonly forbiddenHits: readonly string[];
}

export function measure(ad: GoldenJobAd): Measurement {
  const extracted = extractJobKeywords(ad.text).map((term) => term.term);
  const expected = new Set(ad.expected);
  const tolerated = new Set([...ad.expected, ...ad.acceptable]);

  const hits = extracted.filter((term) => expected.has(term));
  const precise = extracted.filter((term) => tolerated.has(term));
  const forbidden = new Set(ad.forbidden);

  return {
    precision: extracted.length > 0 ? precise.length / extracted.length : 0,
    recall: expected.size > 0 ? hits.length / expected.size : 1,
    missed: [...expected].filter((term) => !extracted.includes(term)),
    spurious: extracted.filter((term) => !tolerated.has(term)),
    forbiddenHits: extracted.filter((term) => forbidden.has(term))
  };
}

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

describe("extractJobKeywords against the golden set", () => {
  for (const ad of GOLDEN_JOB_ADS) {
    describe(ad.id, () => {
      const result = measure(ad);

      it(`extracts few enough stray terms (precision >= ${PRECISION_FLOOR})`, () => {
        expect(result.spurious.join(", ")).toBeTypeOf("string");
        expect(result.precision).toBeGreaterThanOrEqual(PRECISION_FLOOR);
      });

      it(`finds enough of the terms the ad is indexed by (recall >= ${RECALL_FLOOR})`, () => {
        expect(result.missed.join(", ")).toBeTypeOf("string");
        expect(result.recall).toBeGreaterThanOrEqual(RECALL_FLOOR);
      });

      it("never extracts a forbidden term", () => {
        expect(result.forbiddenHits).toEqual([]);
      });
    });
  }

  it("holds the aggregate across every ad", () => {
    const results = GOLDEN_JOB_ADS.map(measure);

    expect(mean(results.map((entry) => entry.precision))).toBeGreaterThanOrEqual(PRECISION_FLOOR);
    expect(mean(results.map((entry) => entry.recall))).toBeGreaterThanOrEqual(RECALL_FLOOR);
  });
});

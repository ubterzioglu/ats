import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";

/**
 * Review focus 3. The spine re-scores on every applied fix, so a document far
 * outside the expected size must not turn a keystroke into a freeze, and must
 * not throw.
 *
 * The timing assertion is a hang detector, not a benchmark. The whole suite
 * runs these files in parallel, so wall-clock here measures contention as much
 * as scoring: an earlier 3 s budget measured 2.5 s under full load and failed
 * intermittently. The budget is now set where only a pathological blowup - an
 * accidental quadratic over lines, a runaway regex - can reach it. The number
 * the run prints is the signal for ordinary slowdowns; this assertion only
 * stops the suite hanging forever.
 *
 * The 300 ms the spine promises is a claim about a mid-range laptop running one
 * analysis, and this test does not verify it.
 */

const HANG_BUDGET_MS = 30_000;

function realisticCv(): string {
  const roles = Array.from({ length: 6 }, (_, index) =>
    [
      `Senior Engineer    Company ${index}    201${index} - 201${index + 1}`,
      "- Led the migration of 240 manual cases to automated coverage",
      "- Responsible for the regression suite across four services",
      "- Cut release testing from three days to four hours",
      ""
    ].join("\n")
  );

  return [
    "Ayse Yilmaz",
    "ayse@example.com  +90 555 000 00 00  Istanbul",
    "",
    "EXPERIENCE",
    ...roles,
    "SKILLS",
    "Selenium, Java, REST Assured, CI/CD, Kubernetes, Postgres",
    "",
    "EDUCATION",
    "BSc Computer Engineering, 2019"
  ].join("\n");
}

function elapsed(work: () => void): number {
  const started = performance.now();
  work();
  return performance.now() - started;
}

describe("re-scoring under the spine", () => {
  it("scores a realistic CV without hanging", () => {
    const cvText = realisticCv();
    const ms = elapsed(() => analyzeCv({ cvText }));
    expect(ms).toBeLessThan(HANG_BUDGET_MS);
  });

  it("scores a 20-page CV without throwing or hanging", () => {
    // Roughly 20 pages at 45 lines a page.
    const cvText = Array.from({ length: 900 }, (_, index) =>
      index % 5 === 0
        ? `Senior Engineer    Company ${index}    2015 - 2016`
        : "- Responsible for a service nobody has heard of, with four engineers"
    ).join("\n");

    let total = -1;
    const ms = elapsed(() => {
      total = analyzeCv({ cvText }).total;
    });

    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
    expect(ms).toBeLessThan(HANG_BUDGET_MS);
  });

  it("survives a 15,000-word job ad", () => {
    const jobDescription = Array.from({ length: 15_000 }, (_, index) =>
      index % 11 === 0 ? "Kubernetes" : `requirement${index % 400}`
    ).join(" ");

    let total = -1;
    const ms = elapsed(() => {
      total = analyzeCv({ cvText: realisticCv(), jobDescription }).total;
    });

    expect(total).toBeGreaterThanOrEqual(0);
    expect(ms).toBeLessThan(HANG_BUDGET_MS);
  });

  it("survives a CV pasted as a single line", () => {
    const cvText = realisticCv().split("\n").join(" ");

    const result = analyzeCv({ cvText });
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("keeps every dimension inside its own range at every size", () => {
    for (const cvText of [realisticCv(), realisticCv().split("\n").join(" "), "x"]) {
      for (const dimension of analyzeCv({ cvText }).dimensions) {
        expect(dimension.score).toBeGreaterThanOrEqual(0);
        expect(dimension.score).toBeLessThanOrEqual(dimension.max);
      }
    }
  });
});

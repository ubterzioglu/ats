import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { restoreSharedReport } from "@/lib/report/restore";

import { STRONG_CV } from "./fixtures";

const WEAK_CV = `Jane Doe
Some random text without structure or content.
No sections, no bullets, no dates.
`;

const EMPTY_CV = "";

function ids(cv: string): string[] {
  return analyzeCv({ cvText: cv }).strengths?.map((s) => s.id) ?? [];
}

describe("strengths derivation", () => {
  it("derives multiple strengths from a strong CV", () => {
    const strengths = ids(STRONG_CV);
    expect(strengths.length).toBeGreaterThan(0);
  });

  it("derives no strengths from an empty document", () => {
    expect(ids(EMPTY_CV)).toEqual([]);
  });

  it("derives fewer strengths from a weak document", () => {
    const weakIds = ids(WEAK_CV);
    const strongIds = ids(STRONG_CV);
    expect(weakIds.length).toBeLessThan(strongIds.length);
  });

  it("does not change the score", () => {
    const withStrengths = analyzeCv({ cvText: STRONG_CV });
    const withoutStrengths = analyzeCv({ cvText: STRONG_CV });
    expect(withStrengths.total).toBe(withoutStrengths.total);
  });

  it("includes impact.quantified when bullets are quantified", () => {
    const cv = `Jane Doe

Experience

Engineer, Firma GmbH
- Cut runtime from 40 to 12 minutes
- Automated 120 tests
- Built API used by 3 teams
- Led migration of 5 services
`;
    expect(ids(cv)).toContain("impact.quantified");
  });

  it("includes experience.solid when months >= 24", () => {
    const cv = `Jane Doe

Experience

Engineer, Firma GmbH, 2020-01 to 2023-06
- Built things
- Did stuff
- Made impact
- Delivered results

Engineer, Other GmbH, 2018-01 to 2019-12
- More things
`;
    expect(ids(cv)).toContain("experience.solid");
  });
});

describe("strengths restore", () => {
  it("round-trips strengths through restore", () => {
    const result = analyzeCv({ cvText: STRONG_CV });
    const serialized = JSON.parse(JSON.stringify(result));
    const restored = restoreSharedReport(serialized);
    expect(restored).not.toBeNull();
    expect(restored!.strengths).toEqual(result.strengths);
  });

  it("defaults to empty array for old rows without strengths", () => {
    const oldRow = {
      total: 75,
      band: "good",
      bandLabel: "Good",
      language: "en",
      dimensions: [],
      findings: [],
      keywords: { source: "baseline", coverage: 0, matched: [], missing: [], overused: [] },
      stats: { characters: 0, words: 0, lines: 0, bulletLines: 0, averageBulletWords: 0, estimatedPages: 1, years: [], experienceMonths: 0 },
      generatedAt: "2024-01-01T00:00:00Z"
    };
    const restored = restoreSharedReport(oldRow);
    expect(restored).not.toBeNull();
    expect(restored!.strengths).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { compareVariants } from "../apps/web/lib/scoring/compare-variants";
import type { AnalysisResult, Finding, DimensionScore, KeywordTerm } from "../apps/web/types/analysis";

describe("D.6 Variant comparison", () => {
  const dummyFinding1: Finding = { id: "f1", dimension: "parseability", severity: "medium", title: "F1", detail: "", fix: "", cost: 5 };
  const dummyFinding2: Finding = { id: "f2", dimension: "keywords", severity: "high", title: "F2", detail: "", fix: "", cost: 10 };
  const dummyFinding3: Finding = { id: "f3", dimension: "structure", severity: "low", title: "F3", detail: "", fix: "", cost: 2 };

  const keyword1: KeywordTerm = { term: "react", weight: 1, hits: 2 };
  const keyword2: KeywordTerm = { term: "typescript", weight: 1, hits: 1 };
  const keyword3: KeywordTerm = { term: "node.js", weight: 1, hits: 1 };

  const baseResult: AnalysisResult = {
    total: 80,
    band: "good",
    bandLabel: "Good",
    language: "en",
    dimensions: [
      { id: "keywords", label: "Keywords", score: 10, max: 25, summary: "" },
      { id: "parseability", label: "Parseability", score: 20, max: 25, summary: "" }
    ],
    findings: [dummyFinding1, dummyFinding2],
    keywords: {
      source: "job-description",
      coverage: 0.5,
      matched: [keyword1],
      missing: [keyword2, keyword3],
      overused: []
    },
    sections: [],
    stats: { characters: 0, words: 0, lines: 0, bulletLines: 0, averageBulletWords: 0, estimatedPages: 1, years: [], experienceMonths: 0 },
    generatedAt: "2026-10-04"
  };

  const variantResult: AnalysisResult = {
    total: 95,
    band: "excellent",
    bandLabel: "Excellent",
    language: "en",
    dimensions: [
      { id: "keywords", label: "Keywords", score: 25, max: 25, summary: "" }, // Score went up
      { id: "parseability", label: "Parseability", score: 20, max: 25, summary: "" } // Unchanged
    ],
    findings: [dummyFinding1, dummyFinding3], // Resolved f2, Introduced f3
    keywords: {
      source: "job-description",
      coverage: 0.9,
      matched: [keyword1, keyword2], // Gained keyword2
      missing: [keyword3],
      overused: []
    },
    sections: [],
    stats: { characters: 0, words: 0, lines: 0, bulletLines: 0, averageBulletWords: 0, estimatedPages: 1, years: [], experienceMonths: 0 },
    generatedAt: "2026-10-04"
  };

  it("calculates score deltas, resolved/introduced findings, and gained/lost keywords", () => {
    const result = compareVariants(baseResult, variantResult);

    expect(result.scoreDeltas).toHaveLength(2); // total + keywords
    
    const totalDelta = result.scoreDeltas.find(d => d.dimension === "total");
    expect(totalDelta?.delta).toBe(15);
    expect(totalDelta?.baseScore).toBe(80);
    expect(totalDelta?.variantScore).toBe(95);

    const keywordsDelta = result.scoreDeltas.find(d => d.dimension === "keywords");
    expect(keywordsDelta?.delta).toBe(15);
    expect(keywordsDelta?.baseScore).toBe(10);
    expect(keywordsDelta?.variantScore).toBe(25);

    expect(result.findingsResolved).toHaveLength(1);
    expect(result.findingsResolved[0]?.id).toBe("f2");

    expect(result.findingsIntroduced).toHaveLength(1);
    expect(result.findingsIntroduced[0]?.id).toBe("f3");

    expect(result.keywordsGained).toHaveLength(1);
    expect(result.keywordsGained[0]?.term).toBe("typescript");

    expect(result.keywordsLost).toHaveLength(0);
  });

  it("handles a variant that loses score and keywords", () => {
    const worseResult: AnalysisResult = {
      ...baseResult,
      total: 70,
      dimensions: [
        { id: "keywords", label: "Keywords", score: 0, max: 25, summary: "" },
        { id: "parseability", label: "Parseability", score: 20, max: 25, summary: "" }
      ],
      keywords: {
        source: "job-description",
        coverage: 0,
        matched: [], // Lost keyword1
        missing: [keyword1, keyword2, keyword3],
        overused: []
      }
    };

    const result = compareVariants(baseResult, worseResult);

    const totalDelta = result.scoreDeltas.find(d => d.dimension === "total");
    expect(totalDelta?.delta).toBe(-10);

    const keywordsDelta = result.scoreDeltas.find(d => d.dimension === "keywords");
    expect(keywordsDelta?.delta).toBe(-10);

    expect(result.keywordsLost).toHaveLength(1);
    expect(result.keywordsLost[0]?.term).toBe("react");
    
    expect(result.keywordsGained).toHaveLength(0);
  });
});

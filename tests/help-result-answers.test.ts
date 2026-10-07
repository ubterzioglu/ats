import { describe, expect, it } from "vitest";

import { detectIntent, answerFromResult } from "@/lib/help/result-answers";
import { setResult, getResult } from "@/lib/help/result-holder";
import type { AnalysisResult } from "@/types/analysis";

describe("detectIntent", () => {
  it("detects why-score-low intent", () => {
    expect(detectIntent("Why is my score so low?")).toBe("why-score-low");
    expect(detectIntent("Why did my score drop?")).toBe("why-score-low");
    expect(detectIntent("Why did it go down?")).toBe("why-score-low");
  });

  it("detects fix-first intent", () => {
    expect(detectIntent("What should I fix first?")).toBe("fix-first");
    expect(detectIntent("How do I improve my score?")).toBe("fix-first");
    expect(detectIntent("Where should I start?")).toBe("fix-first");
  });

  it("detects missing-keywords intent", () => {
    expect(detectIntent("What keywords am I missing?")).toBe("missing-keywords");
    expect(detectIntent("Which keywords don't match the ad?")).toBe("missing-keywords");
  });

  it("detects what-is-good intent", () => {
    expect(detectIntent("What is good about my CV?")).toBe("what-is-good");
    expect(detectIntent("What are my strengths?")).toBe("what-is-good");
    expect(detectIntent("What works well?")).toBe("what-is-good");
  });

  it("returns null for unrelated questions", () => {
    expect(detectIntent("How do I upload a file?")).toBeNull();
    expect(detectIntent("Is my data stored?")).toBeNull();
  });
});

describe("answerFromResult", () => {
  const mockResult: AnalysisResult = {
    total: 65,
    band: "good",
    bandLabel: "Good",
    language: "en",
    dimensions: [
      { id: "parseability", label: "Parseability", score: 20, max: 25, summary: "Mostly readable" },
      { id: "keywords", label: "Keywords", score: 15, max: 25, summary: "Some matches" },
      { id: "structure", label: "Structure", score: 15, max: 20, summary: "Good sections" },
      { id: "impact", label: "Impact", score: 10, max: 20, summary: "Weak impact" },
      { id: "contact", label: "Contact", score: 5, max: 10, summary: "Missing phone" }
    ],
    findings: [
      { id: "impact.weak-verbs", dimension: "impact", severity: "medium", title: "Weak action verbs", detail: "Bullets start with weak verbs", fix: "Use stronger verbs", cost: 5, evidence: [] },
      { id: "contact.phone", dimension: "contact", severity: "high", title: "Missing phone number", detail: "No phone found", fix: "Add phone", cost: 3, evidence: [] },
      { id: "impact.no-numbers", dimension: "impact", severity: "high", title: "No metrics", detail: "No numbers in bullets", fix: "Add metrics", cost: 4, evidence: [] }
    ],
    keywords: {
      source: "job-description",
      coverage: 0.6,
      matched: [
        { term: "javascript", hits: 3, tier: "required" },
        { term: "react", hits: 2, tier: "required" },
        { term: "typescript", hits: 1, tier: "required" }
      ],
      missing: [
        { term: "node.js", hits: 0, tier: "required" },
        { term: "next.js", hits: 0, tier: "required" },
        { term: "graphql", hits: 0, tier: "nice-to-have" }
      ],
      overused: []
    },
    sections: [],
    stats: {
      characters: 1000,
      words: 200,
      lines: 50,
      bulletLines: 10,
      averageBulletWords: 8,
      estimatedPages: 1,
      years: [],
      experienceMonths: 24
    },
    generatedAt: "2026-01-01T00:00:00Z",
    strengths: [
      { id: "structure.core-sections", dimension: "structure", params: { count: 4 } },
      { id: "parse.clean", dimension: "parseability", params: { score: 20, max: 25 } }
    ]
  };

  it("answers why-score-low with top findings", () => {
    const answer = answerFromResult(mockResult, "why-score-low");
    expect(answer).not.toBeNull();
    expect(answer?.intent).toBe("why-score-low");
    expect(answer?.params.score).toBe(65);
    expect(answer?.params.totalMax).toBe(100);
    expect(answer?.params.totalLost).toBe(35);
    expect(Array.isArray(answer?.params.topFindings)).toBe(true);
    expect((answer?.params.topFindings as string[]).length).toBe(3);
  });

  it("answers fix-first with prioritized findings", () => {
    const answer = answerFromResult(mockResult, "fix-first");
    expect(answer).not.toBeNull();
    expect(answer?.intent).toBe("fix-first");
    expect(Array.isArray(answer?.params.items)).toBe(true);
    expect((answer?.params.items as string[]).length).toBe(3);
    expect((answer?.params.items as string[])[0]).toBe("Weak action verbs");
  });

  it("answers missing-keywords with missing terms", () => {
    const answer = answerFromResult(mockResult, "missing-keywords");
    expect(answer).not.toBeNull();
    expect(answer?.intent).toBe("missing-keywords");
    expect(answer?.params.matched).toBe(3);
    expect(answer?.params.total).toBe(6);
    expect(answer?.params.coverage).toBe(50);
    expect(Array.isArray(answer?.params.missing)).toBe(true);
    expect((answer?.params.missing as string[]).length).toBe(3);
  });

  it("answers what-is-good with strengths", () => {
    const answer = answerFromResult(mockResult, "what-is-good");
    expect(answer).not.toBeNull();
    expect(answer?.intent).toBe("what-is-good");
    expect(answer?.params.count).toBe(2);
    expect(Array.isArray(answer?.params.strengths)).toBe(true);
    expect((answer?.params.strengths as string[]).length).toBe(2);
  });

  it("returns noJobAd when no job description was provided", () => {
    const resultWithoutAd: AnalysisResult = {
      ...mockResult,
      keywords: {
        source: "baseline",
        coverage: 0,
        matched: [],
        missing: [],
        overused: []
      }
    };
    const answer = answerFromResult(resultWithoutAd, "missing-keywords");
    expect(answer?.text).toBe("help.result.noJobAd");
  });

  it("returns noStrengths when no strengths exist", () => {
    const resultWithoutStrengths: AnalysisResult = {
      ...mockResult,
      strengths: []
    };
    const answer = answerFromResult(resultWithoutStrengths, "what-is-good");
    expect(answer?.text).toBe("help.result.noStrengths");
  });
});

describe("result-holder", () => {
  it("stores and retrieves the result", () => {
    const mockResult: AnalysisResult = {
      total: 75,
      band: "good",
      bandLabel: "Good",
      language: "en",
      dimensions: [],
      findings: [],
      keywords: {
        source: "baseline",
        coverage: 0,
        matched: [],
        missing: [],
        overused: []
      },
      sections: [],
      stats: {
        characters: 0,
        words: 0,
        lines: 0,
        bulletLines: 0,
        averageBulletWords: 0,
        estimatedPages: 1,
        years: [],
        experienceMonths: 0
      },
      generatedAt: "2026-01-01T00:00:00Z"
    };

    setResult(mockResult);
    expect(getResult()).toBe(mockResult);

    setResult(null);
    expect(getResult()).toBeNull();
  });
});

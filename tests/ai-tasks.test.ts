import { describe, expect, it } from "vitest";

import { askAboutReport, serializeReport } from "@/lib/ai/tasks/ask";
import { generateAdQuestions, validateAdQuestionsPayload } from "@/lib/ai/tasks/interview";
import { suggestTailoring, validateTailorPayload } from "@/lib/ai/tasks/tailor";
import { analyzeCv } from "@/lib/scoring";

import { JOB_AD, STRONG_CV, WEAK_CV } from "./fixtures";
import { fakeProvider } from "./helpers/fake-provider";

/**
 * Both tasks run against stub providers here: the report chat must answer
 * from the serialized report alone, and the tailoring task must never let a
 * suggestion carry a fact the CV does not contain.
 */

describe("serializeReport", () => {
  it("carries scores, findings and term lists", () => {
    const result = analyzeCv({ cvText: WEAK_CV });
    const serialized = serializeReport(result);
    expect(serialized).toContain(`Total: ${result.total}/100`);
    expect(serialized).toContain("impact.generic-phrasing");
    expect(serialized).not.toContain("motivated and hard working");
  });
});

describe("askAboutReport", () => {
  it("returns the answer and retries once on a malformed one", async () => {
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD });
    const recovering = fakeProvider([{}, { answer: "Keywords cost points because coverage is partial." }]);
    const answer = await askAboutReport(recovering.provider, result, "Why did I lose points?");
    expect(answer).toContain("coverage");
    expect(recovering.calls()).toBe(2);

    const hopeless = fakeProvider([{ nope: true }]);
    await expect(askAboutReport(hopeless.provider, result, "Why?")).rejects.toThrow();
  });
});

describe("tailor suggestions", () => {
  const cv = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Automated the regression suite with Playwright across three products.
- Tracked defects in Jira through four release cycles.
`;

  it("validates the payload shape", () => {
    expect(validateTailorPayload({ suggestions: "no" })).toBeNull();
    expect(
      validateTailorPayload({ suggestions: [{ term: "playwright", evidence: "e", suggestion: "s" }] })
    ).toEqual([{ term: "playwright", evidence: "e", suggestion: "s" }]);
  });

  it("keeps a suggestion grounded in the CV", async () => {
    const stub = fakeProvider([
      {
        suggestions: [
          {
            term: "playwright",
            evidence: "Automated the regression suite with Playwright across three products.",
            suggestion: "Move the Playwright suite bullet to the top of the role and name the three products."
          }
        ]
      }
    ]);
    const suggestions = await suggestTailoring(stub.provider, cv, ["playwright", "jira"], ["kubernetes"]);
    expect(suggestions).toHaveLength(1);
  });

  it("drops a suggestion that smuggles in a missing skill", async () => {
    const stub = fakeProvider([
      {
        suggestions: [
          {
            term: "kubernetes",
            evidence: "Automated the regression suite with Playwright.",
            suggestion: "Add Kubernetes to the skills list and mention cluster deployments."
          }
        ]
      }
    ]);
    const suggestions = await suggestTailoring(stub.provider, cv, ["playwright"], ["kubernetes"]);
    expect(suggestions).toEqual([]);
  });

  it("returns nothing when the CV has no matched terms", async () => {
    const stub = fakeProvider([{ suggestions: [] }]);
    expect(await suggestTailoring(stub.provider, cv, [], ["kubernetes"])).toEqual([]);
    expect(stub.calls()).toBe(0);
  });
});

describe("generateAdQuestions", () => {
  it("validates the payload shape", () => {
    expect(validateAdQuestionsPayload({ questions: "no" })).toBeNull();
    expect(
      validateAdQuestionsPayload({
        questions: [{ text: "How?", citedTerm: "Kafka", category: "technical", topics: ["delivery"] }]
      })
    ).toEqual([{ text: "How?", citedTerm: "Kafka", category: "technical", topics: ["delivery"] }]);
  });

  it("filters out questions that cite unknown terms", async () => {
    const stub = fakeProvider([
      {
        questions: [
          { text: "Q1?", citedTerm: "Kafka", category: "technical", topics: [] },
          { text: "Q2?", citedTerm: "MadeUp", category: "technical", topics: [] }
        ]
      }
    ]);

    const terms = [
      { term: "Kafka", matched: true, count: 1, source: "ad", tier: "required" as const, hits: 1, weight: 1 },
      { term: "Docker", matched: false, count: 0, source: "ad", tier: "preferred" as const, hits: 0, weight: 1 }
    ];

    const questions = await generateAdQuestions(stub.provider, terms);
    expect(questions).toHaveLength(1);
    expect(questions[0]?.citedTerm).toBe("Kafka");
  });
});

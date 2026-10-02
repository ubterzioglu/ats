import { describe, expect, it } from "vitest";

import type { TextModel } from "@/lib/ai/providers/types";
import { explainFinding, validateExplanation } from "@/lib/ai/tasks/explain";
import type { Finding } from "@/types/analysis";

/**
 * The explain task sees the finding and nothing else - no CV, no ad. These
 * tests pin the context diet and the one-retry contract.
 */

function stubModel(responses: readonly unknown[]): { model: TextModel; calls: () => number } {
  let calls = 0;
  return {
    model: {
      id: "stub",
      label: "stub",
      async generateJson<T>(): Promise<T> {
        const response = responses[Math.min(calls, responses.length - 1)];
        calls += 1;
        return response as T;
      }
    },
    calls: () => calls
  };
}

const FINDING: Finding = {
  id: "keywords.coverage",
  dimension: "keywords",
  severity: "high",
  title: "38% of the vacancy's key terms appear in the CV",
  detail: "The highest-weighted terms that are absent: playwright, typescript.",
  fix: "Work the missing terms into real sentences.",
  cost: 15,
  evidence: ["playwright", "typescript"]
};

describe("validateExplanation", () => {
  it("accepts the schema shape", () => {
    expect(validateExplanation({ why: "a", nextStep: "b" })).toEqual({ why: "a", nextStep: "b" });
  });

  it("rejects junk and empties", () => {
    expect(validateExplanation(null)).toBeNull();
    expect(validateExplanation({ why: "a" })).toBeNull();
    expect(validateExplanation({ why: " ", nextStep: "b" })).toBeNull();
  });
});

describe("explainFinding", () => {
  it("returns the explanation and sends only the finding as context", async () => {
    let seen = "";
    const model: TextModel = {
      id: "spy",
      label: "spy",
      async generateJson<T>(_schema, messages): Promise<T> {
        seen = messages.map((message) => message.content).join("\n");
        return { why: "Filters rank by term overlap.", nextStep: "Add the two tools." } as T;
      }
    };
    const explanation = await explainFinding(model, FINDING);
    expect(explanation.why).toContain("Filters");
    expect(seen).toContain("keywords.coverage");
    expect(seen).toContain("playwright");
  });

  it("retries once on a malformed answer, then gives up loudly", async () => {
    const recovering = stubModel([{}, { why: "because", nextStep: "do this" }]);
    expect((await explainFinding(recovering.model, FINDING)).why).toBe("because");
    expect(recovering.calls()).toBe(2);

    const hopeless = stubModel([42]);
    await expect(explainFinding(hopeless.model, FINDING)).rejects.toThrow();
  });
});

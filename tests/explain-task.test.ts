import { describe, expect, it } from "vitest";

import { explainFinding, validateExplanation } from "@/lib/ai/tasks/explain";
import type { Finding } from "@/types/analysis";

import { fakeProvider } from "./helpers/fake-provider";

/**
 * The explain task sees the finding and nothing else - no CV, no ad. These
 * tests pin the context diet and the one-retry contract.
 */

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
    const fake = fakeProvider([
      { why: "Filters rank by term overlap.", nextStep: "Add the two tools." }
    ], "spy");
    const explanation = await explainFinding(fake.provider, FINDING);
    expect(explanation.why).toContain("Filters");

    const seen = (fake.seen[0] ?? []).map((message) => message.content).join("\n");
    expect(seen).toContain("keywords.coverage");
    expect(seen).toContain("playwright");
    expect(fake.calls()).toBe(1);
  });

  it("retries once on a malformed answer, then gives up loudly", async () => {
    const recovering = fakeProvider([{}, { why: "because", nextStep: "do this" }]);
    expect((await explainFinding(recovering.provider, FINDING)).why).toBe("because");
    expect(recovering.calls()).toBe(2);

    const hopeless = fakeProvider([42]);
    await expect(explainFinding(hopeless.provider, FINDING)).rejects.toThrow();
  });
});

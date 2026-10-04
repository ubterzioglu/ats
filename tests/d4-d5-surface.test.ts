import { describe, expect, it } from "vitest";

import { replaceLine } from "@/lib/bench/evidence";
import { isGrounded } from "@/lib/ai/grounding";
import { rewriteBullets, selectWeakBullets } from "@/lib/ai/tasks/rewrite";
import type { LLMProvider } from "@/lib/ai/providers/types";
import { draftFixes } from "@/lib/scoring/drafts";
import { draftForLine } from "@/lib/bench/evidence";

const CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Responsible for regression testing across multiple products.
- Worked on CI/CD pipeline improvements.
`;

describe("D.4 surface: grounding rejects invented content through the rewrite path", () => {
  it("rejects a rewrite that invents a number", () => {
    const source = "Responsible for regression testing across multiple products.";
    const rewritten = "Led regression testing across 12 products, cutting defects by 45%.";
    const result = isGrounded(source, rewritten, ["regression testing"]);
    expect(result.grounded).toBe(false);
  });

  it("rejects a rewrite that invents an organisation", () => {
    const source = "Worked on CI/CD pipeline improvements.";
    const rewritten = "Built CI/CD pipelines for Google and Microsoft using Jenkins.";
    const result = isGrounded(source, rewritten, ["CI/CD", "Jenkins"]);
    expect(result.grounded).toBe(false);
  });

  it("rejects a rewrite that invents a technology", () => {
    const source = "Responsible for regression testing across multiple products.";
    const rewritten = "Automated regression testing with Kubernetes and Terraform.";
    const result = isGrounded(source, rewritten, []);
    expect(result.grounded).toBe(false);
  });

  it("accepts a rewrite that restates existing facts", () => {
    const source = "Responsible for regression testing across multiple products.";
    const rewritten = "Ran regression tests across multiple products.";
    const result = isGrounded(source, rewritten, []);
    expect(result.grounded).toBe(true);
  });

  it("the rewrite pipeline drops ungrounded output before it reaches the screen", async () => {
    const bullets = selectWeakBullets(CV);
    expect(bullets.length).toBeGreaterThan(0);

    const fakeModel: LLMProvider = {
      id: "ollama",
      health: async () => true,
      chat: async () => "",
      structured: async () => ({
        rewrites: [
          {
            original: "responsible for regression testing across multiple products.",
            rewritten: "Led regression testing across 47 products, cutting defects by 92%."
          }
        ]
      })
    };

    const knownSkills = ["regression testing"];
    const pairs = await rewriteBullets(fakeModel, bullets, knownSkills);
    const invented = pairs.find((p) => p.rewritten.includes("47") || p.rewritten.includes("92%"));
    expect(invented).toBeUndefined();
  });

  it("the rule path fires before the model and cannot invent", () => {
    const drafts = draftFixes(CV);
    for (let i = 0; i < CV.split("\n").length; i++) {
      const rule = draftForLine(drafts, i);
      if (rule) {
        expect(rule.replacement).not.toMatch(/\d{2,}/);
      }
    }
  });
});

describe("D.5 surface: each change is independently acceptable", () => {
  it("applying one line edit leaves other lines untouched", () => {
    const text = "line 0\nline 1\nline 2\nline 3";
    const result = replaceLine(text, 1, "MODIFIED");
    expect(result).toBe("line 0\nMODIFIED\nline 2\nline 3");
  });

  it("discarding a draft leaves the original text intact", () => {
    const text = "original line";
    const draft = "drafted line";
    const applied = replaceLine(text, 0, draft);
    expect(applied).toBe("drafted line");
    expect(text).toBe("original line");
  });

  it("two independent edits on different lines compose correctly", () => {
    let text = "alpha\nbeta\ngamma\ndelta";
    text = replaceLine(text, 0, "ALPHA")!;
    text = replaceLine(text, 2, "GAMMA")!;
    expect(text).toBe("ALPHA\nbeta\nGAMMA\ndelta");
  });
});

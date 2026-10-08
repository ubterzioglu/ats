import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability, PARSEABILITY_MAX } from "@/lib/scoring/parseability";

import { STRONG_CV } from "./fixtures";

describe("parse.hidden-text check", () => {
  it("does not fire on normal clean document", () => {
    const context = buildContext(STRONG_CV);
    const outcome = scoreParseability(context);
    expect(outcome.findings.map((f) => f.id)).not.toContain("parse.hidden-text");
  });

  it("fires when extraction metadata reports hidden text blocks", () => {
    const context = buildContext(STRONG_CV, {
      extraction: {
        source: "pdf",
        pages: 2,
        emptyPages: 0,
        links: [],
        hiddenTextBlocks: 3
      }
    });
    const outcome = scoreParseability(context);
    const finding = outcome.findings.find((f) => f.id === "parse.hidden-text");
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("critical");
    expect(finding?.cost).toBe(5);
    expect(finding?.detail).toContain("3 hidden text blocks");
  });

  it("fires when input text contains many zero-width invisible characters", () => {
    // Inject 15 zero-width spaces (\u200B)
    const hiddenInjected = `${STRONG_CV}\nSkills: Java\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B`;
    const context = buildContext(hiddenInjected);
    const outcome = scoreParseability(context);
    const finding = outcome.findings.find((f) => f.id === "parse.hidden-text");
    expect(finding).toBeDefined();
    expect(finding?.cost).toBe(5);
  });

  it("maintains the scoring invariant when hidden text finding is issued", () => {
    const result = analyzeCv({
      cvText: STRONG_CV,
      extraction: {
        source: "pdf",
        pages: 1,
        emptyPages: 0,
        links: [],
        hiddenTextBlocks: 1
      }
    });

    const parseabilityDim = result.dimensions.find((d) => d.id === "parseability");
    const parseabilityFindings = result.findings.filter((f) => f.dimension === "parseability");
    const totalCost = parseabilityFindings.reduce((sum, f) => sum + f.cost, 0);

    expect(parseabilityDim?.score).toBe(Math.max(0, PARSEABILITY_MAX - totalCost));
    expect(result.findings.some((f) => f.id === "parse.hidden-text")).toBe(true);
  });
});

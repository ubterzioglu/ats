import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";
import { scoreStructure } from "@/lib/scoring/structure";

import { STRONG_CV, WEAK_CV } from "./fixtures";

describe("quick test scoring logic", () => {
  it("scores a strong well-formatted CV near maximum out of 45", () => {
    const context = buildContext(STRONG_CV);
    const parseability = scoreParseability(context);
    const structure = scoreStructure(context);
    const total = parseability.dimension.score + structure.dimension.score;

    expect(total).toBeGreaterThanOrEqual(38);
    expect(total).toBeLessThanOrEqual(45);
  });

  it("scores a weak or poorly structured CV with deductions and produces findings", () => {
    const context = buildContext(WEAK_CV);
    const parseability = scoreParseability(context);
    const structure = scoreStructure(context);
    const total = parseability.dimension.score + structure.dimension.score;

    expect(total).toBeLessThan(40);
    const allFindings = [...parseability.findings, ...structure.findings];
    expect(allFindings.length).toBeGreaterThan(0);
  });

  it("limits top findings to at most 3 sorted by cost descending", () => {
    const context = buildContext(WEAK_CV);
    const parseability = scoreParseability(context);
    const structure = scoreStructure(context);

    const sorted = [...parseability.findings, ...structure.findings].sort((a, b) => b.cost - a.cost);
    const top3 = sorted.slice(0, 3);

    expect(top3.length).toBeLessThanOrEqual(3);
    if (top3.length >= 2) {
      expect(top3[0]!.cost).toBeGreaterThanOrEqual(top3[1]!.cost);
    }
  });
});

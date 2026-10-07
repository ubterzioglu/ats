import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability, PARSEABILITY_MAX } from "@/lib/scoring/parseability";

import { STRONG_CV } from "./fixtures";

describe("parse.ligatures check", () => {
  it("does not fire on clean text without typographic ligatures", () => {
    const context = buildContext(STRONG_CV);
    const outcome = scoreParseability(context);
    expect(outcome.findings.map((f) => f.id)).not.toContain("parse.ligatures");
  });

  it("does not fire when ligatures count is 4 or fewer", () => {
    // 3 ligatures: ﬁ, ﬂ, ﬀ
    const text = `${STRONG_CV}\nProﬁle with ﬂexibility and eﬀort`;
    const context = buildContext(text);
    const outcome = scoreParseability(context);
    expect(outcome.findings.map((f) => f.id)).not.toContain("parse.ligatures");
  });

  it("fires parse.ligatures with cost 3 when there are more than 4 ligatures", () => {
    // 5 ligatures: ﬁ, ﬂ, ﬀ, ﬃ, ﬄ
    const text = `${STRONG_CV}\nProﬁle ﬂow eﬀort oﬃce aﬄuence`;
    const context = buildContext(text);
    const outcome = scoreParseability(context);

    const finding = outcome.findings.find((f) => f.id === "parse.ligatures");
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("medium");
    expect(finding?.cost).toBe(3);
    expect(finding?.detail).toContain("5 typographic ligature glyphs");
  });

  it("maintains the scoring invariant when ligatures finding is present", () => {
    const text = `${STRONG_CV}\nProﬁle ﬂow eﬀort oﬃce aﬄuence extra ﬁ`;
    const result = analyzeCv({ cvText: text });

    const parseabilityDim = result.dimensions.find((d) => d.id === "parseability");
    const parseabilityFindings = result.findings.filter((f) => f.dimension === "parseability");
    const totalCost = parseabilityFindings.reduce((sum, f) => sum + f.cost, 0);

    expect(parseabilityDim?.score).toBe(Math.max(0, PARSEABILITY_MAX - totalCost));
    expect(result.findings.some((f) => f.id === "parse.ligatures")).toBe(true);
  });
});

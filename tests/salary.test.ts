import { describe, expect, it } from "vitest";

import {
  BENCHMARK_SALARY_BANDS,
  getNegotiationTips,
  resolveSalaryBand
} from "@/lib/scoring/salary";

describe("salary benchmarks and negotiation guidance", () => {
  it("resolves German salary benchmark band by seniority", () => {
    const seniorDe = resolveSalaryBand("senior", "de");
    expect(seniorDe).not.toBeNull();
    expect(seniorDe?.range.currency).toBe("EUR");
    expect(seniorDe?.range.min).toBeGreaterThanOrEqual(75000);
    expect(seniorDe?.range.max).toBeLessThanOrEqual(120000);
  });

  it("resolves Turkish salary benchmark band by seniority", () => {
    const midTr = resolveSalaryBand("mid", "tr");
    expect(midTr).not.toBeNull();
    expect(midTr?.range.currency).toBe("TRY");
    expect(midTr?.range.period).toBe("monthly");
  });

  it("falls back to global benchmark when market is unspecified", () => {
    const lead = resolveSalaryBand("lead");
    expect(lead).not.toBeNull();
    expect(lead?.range.currency).toBe("USD");
  });

  it("returns null when seniority level is null", () => {
    expect(resolveSalaryBand(null)).toBeNull();
  });

  it("returns 5 negotiation tips for each supported language", () => {
    const enTips = getNegotiationTips("en");
    const deTips = getNegotiationTips("de");
    const trTips = getNegotiationTips("tr");

    expect(enTips).toHaveLength(5);
    expect(deTips).toHaveLength(5);
    expect(trTips).toHaveLength(5);

    expect(enTips[0]?.title).toBeTruthy();
    expect(deTips[0]?.title).toBeTruthy();
    expect(trTips[0]?.title).toBeTruthy();
  });
});

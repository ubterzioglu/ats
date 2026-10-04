import { describe, expect, it } from "vitest";

import { evaluateSuitability } from "../apps/web/lib/scoring/suitability";
import { buildContext } from "../apps/web/lib/scoring/context";
import { parseJobAd } from "../apps/web/lib/scoring/job-ad";
import type { KeywordReport } from "../apps/web/types/analysis";

describe("suitability checklist", () => {
  const context = buildContext(`
    Jane Doe
    Berlin, Germany
    
    Experience
    Senior Developer
    2018 - 2024
    
    Languages: Fluent German, native English.
    Skills: React, Node.js
  `);

  const emptyKeywords: KeywordReport = {
    source: "job-description",
    coverage: 0,
    matched: [],
    missing: [],
    overused: []
  };

  it("evaluates experience requirement", () => {
    const jobAd = parseJobAd("We need 5 years of experience", []);
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const expCheck = checks.find(c => c.id === "experience");
    expect(expCheck).toBeDefined();
    expect(expCheck?.status).toBe("passed");
  });

  it("fails experience if not enough years", () => {
    const jobAd = parseJobAd("We need 10 years of experience", []);
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const expCheck = checks.find(c => c.id === "experience");
    expect(expCheck?.status).toBe("failed");
  });

  it("evaluates location", () => {
    const jobAd = parseJobAd("Location: Berlin", []);
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const locCheck = checks.find(c => c.id === "location");
    expect(locCheck?.status).toBe("passed");
  });

  it("marks location as unknown if missing", () => {
    const jobAd = parseJobAd("Location: Munich", []);
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const locCheck = checks.find(c => c.id === "location");
    expect(locCheck?.status).toBe("unknown");
  });

  it("evaluates language requirements", () => {
    const jobAd = parseJobAd("Must speak fluent German", []);
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const langCheck = checks.find(c => c.id === "language");
    expect(langCheck?.status).toBe("passed");
  });

  it("evaluates required skills", () => {
    const jobAd = parseJobAd("Required: React, TypeScript", [
      { term: "React", weight: 1, hits: 1, tier: "required" },
      { term: "TypeScript", weight: 1, hits: 0, tier: "required" }
    ]);
    const report: KeywordReport = {
      ...emptyKeywords,
      matched: [{ term: "React", weight: 1, hits: 1, tier: "required" }],
      missing: [{ term: "TypeScript", weight: 1, hits: 0, tier: "required" }]
    };

    const checks = evaluateSuitability(context, jobAd, report);
    const skillCheck = checks.find(c => c.id === "skills");
    expect(skillCheck?.status).toBe("failed");
    expect(skillCheck?.detail).toContain("Missing 1");
  });
});

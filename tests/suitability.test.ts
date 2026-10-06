import { describe, expect, it } from "vitest";

import { evaluateSuitability } from "../apps/web/lib/scoring/suitability";
import { buildContext } from "../apps/web/lib/scoring/context";
import { parseJobAd } from "../apps/web/lib/scoring/job-ad";
import type { JobAdRequirements, KeywordReport } from "../apps/web/types/analysis";

// parseJobAd ignores ads under 120 characters, so fixtures carry a neutral
// paragraph that adds length without adding any requirement signal.
const FILLER =
  "You will work with a small product team on our customer platform, review pull requests, write tests and help plan each release with design and support colleagues.";

function readAd(core: string, terms: Parameters<typeof parseJobAd>[1] = []): JobAdRequirements {
  const parsed = parseJobAd(`${core}\n${FILLER}`, terms);
  if (!parsed) throw new Error("fixture ad was ignored as too short");
  return parsed;
}

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
    const jobAd = readAd("We need 5 years of experience");
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const expCheck = checks.find(c => c.id === "experience");
    expect(expCheck).toBeDefined();
    expect(expCheck?.status).toBe("passed");
  });

  it("fails experience if not enough years", () => {
    const jobAd = readAd("We need 10 years of experience");
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const expCheck = checks.find(c => c.id === "experience");
    expect(expCheck?.status).toBe("failed");
  });

  it("evaluates location", () => {
    const jobAd = readAd("Location: Berlin");
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const locCheck = checks.find(c => c.id === "location");
    expect(locCheck?.status).toBe("passed");
  });

  it("marks location as unknown if missing", () => {
    const jobAd = readAd("Location: Munich");
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const locCheck = checks.find(c => c.id === "location");
    expect(locCheck?.status).toBe("unknown");
  });

  it("evaluates language requirements", () => {
    const jobAd = readAd("Must speak fluent German");
    const checks = evaluateSuitability(context, jobAd, emptyKeywords);
    
    const langCheck = checks.find(c => c.id === "language");
    expect(langCheck?.status).toBe("passed");
  });

  it("evaluates required skills", () => {
    const jobAd = readAd("Required: React, TypeScript", [
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

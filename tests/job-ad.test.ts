import { describe, expect, it } from "vitest";

import {
  extractExperienceRequirement,
  extractLanguages,
  extractLocation,
  extractSeniority,
  extractSalary,
  parseJobAd
} from "../apps/web/lib/scoring/job-ad";

describe("job ad parsing", () => {
  it("extracts seniority from standard titles", () => {
    const lines = ["Senior Software Engineer", "We are looking for a senior dev"];
    const req = extractSeniority(lines);
    expect(req).toEqual({ level: "senior", source: "Senior Software Engineer" });
  });

  it("extracts language requirements", () => {
    const lines = ["Fluent English and good German", "You should have B2 German"];
    const reqs = extractLanguages(lines);
    expect(reqs).toHaveLength(2);
    expect(reqs[0]).toEqual({ language: "English", level: "Fluent", source: "Fluent English and good German" });
    expect(reqs[1]).toEqual({ language: "German", level: "B2", source: "You should have B2 German" });
  });

  it("extracts location and work mode", () => {
    const lines = ["Location: Berlin", "We offer a hybrid work environment"];
    const req = extractLocation(lines);
    expect(req).toMatchObject({ mode: "hybrid", city: "Berlin" });
  });

  it("extracts salary ranges", () => {
    const lines = ["Salary between €60k and €80k per year"];
    const req = extractSalary(lines);
    expect(req).toMatchObject({ min: 60000, max: 80000, currency: "EUR", period: "yearly" });
  });

  it("splits required and preferred terms in parseJobAd", () => {
    const result = parseJobAd("Senior Engineer", [
      { term: "React", weight: 1, hits: 0, tier: "required" },
      { term: "Vue", weight: 0.8, hits: 0, tier: "preferred" },
      { term: "Node", weight: 1.5, hits: 0, tier: undefined }
    ]);
    expect(result.terms.required.map(t => t.term)).toEqual(["React", "Node"]);
    expect(result.terms.preferred.map(t => t.term)).toEqual(["Vue"]);
    expect(result.seniority).toMatchObject({ level: "senior" });
  });
});

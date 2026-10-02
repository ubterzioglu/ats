import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { extractExperienceRequirement } from "@/lib/scoring/job-ad";

import { STRONG_CV } from "./fixtures";

/**
 * The ad states a minimum in plain digits - "5+ years", "mindestens 3 Jahre",
 * "en az 4 yıl". The parsed date ranges state the candidate's total. When the
 * two disagree by half a year or more, the filter rejects before any human
 * reads a bullet, so the report has to say so.
 */

describe("extractExperienceRequirement", () => {
  it("reads the English minimum", () => {
    expect(extractExperienceRequirement("- 5+ years of backend development")?.years).toBe(5);
  });

  it("reads the German minimum", () => {
    expect(extractExperienceRequirement("- Mindestens 3 Jahre Erfahrung")?.years).toBe(3);
  });

  it("reads the Turkish minimum", () => {
    expect(extractExperienceRequirement("- En az 4 yıl deneyim")?.years).toBe(4);
  });

  it("takes the highest stated minimum across the ad", () => {
    const ad = "- 2+ years with Kafka\n- 8+ years in platform engineering";
    expect(extractExperienceRequirement(ad)?.years).toBe(8);
  });

  it("returns null when no minimum is stated", () => {
    expect(extractExperienceRequirement("- Several years of experience with Playwright")).toBeNull();
  });
});

describe("keywords.experience-gap", () => {
  const demandingAd = `Senior Principal Engineer

We are looking for a senior principal engineer to own the core platform.

Requirements
- 25+ years of backend development
- Strong Java skills
- Experience with distributed systems and messaging

Your tasks
- Lead the architecture of the payments platform
- Mentor the engineering teams
`;

  const moderateAd = `Backend Engineer

We are looking for a backend engineer for the payments team.

Requirements
- 3+ years of backend development
- Strong Java skills
- Experience with SQL databases

Your tasks
- Build and operate services
- Take part in code reviews
`;

  it("fires when the parsed dates fall short of the stated minimum", () => {
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: demandingAd });
    expect(result.findings.map((finding) => finding.id)).toContain("keywords.experience-gap");
  });

  it("stays quiet when the parsed dates cover the minimum", () => {
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: moderateAd });
    expect(result.findings.map((finding) => finding.id)).not.toContain("keywords.experience-gap");
  });

  it("quotes the ad line as evidence", () => {
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: demandingAd });
    const finding = result.findings.find((entry) => entry.id === "keywords.experience-gap");
    expect(finding?.evidence?.join(" ")).toContain("25+ years");
  });

  it("stays quiet when the ad states no minimum", () => {
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: moderateAd.replace("3+ years", "several years") });
    expect(result.findings.map((finding) => finding.id)).not.toContain("keywords.experience-gap");
  });

  it("does not stack on top of unparseable dates", () => {
    const undated = STRONG_CV.replace(/\d{2}\/\d{4} - (present|\d{2}\/\d{4})/g, "some time ago");
    const result = analyzeCv({ cvText: undated, jobDescription: demandingAd });
    expect(result.findings.map((finding) => finding.id)).not.toContain("keywords.experience-gap");
  });
});

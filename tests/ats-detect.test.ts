import { describe, expect, it } from "vitest";

import { detectAts } from "@/lib/scoring/ats-detect";
import { atsAdviceFindings } from "@/lib/scoring/ats-advice";
import { analyzeCv } from "@/lib/scoring";

import { JOB_AD, STRONG_CV } from "./fixtures";

describe("detectAts", () => {
  it("detects Workday from standard job URLs", () => {
    const profile = detectAts("https://company.wd5.myworkdayjobs.com/en-US/careers/job/123");
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe("workday");
    expect(profile?.name).toBe("Workday");
    expect(profile?.formatAdvice).toContain("DOCX");
  });

  it("detects Greenhouse from board URL", () => {
    const profile = detectAts("https://boards.greenhouse.io/company/jobs/456");
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe("greenhouse");
    expect(profile?.name).toBe("Greenhouse");
  });

  it("detects Lever from job link", () => {
    const profile = detectAts("https://jobs.lever.co/company/abc-123");
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe("lever");
  });

  it("detects Ashby from application URL", () => {
    const profile = detectAts("https://jobs.ashby.io/company/xyz-789");
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe("ashby");
  });

  it("detects Oracle Taleo from domain", () => {
    const profile = detectAts("https://company.taleo.net/careersection/jobdetail.ftl");
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe("taleo");
  });

  it("detects iCIMS from posting link", () => {
    const profile = detectAts("https://careers-company.icims.com/jobs/1001/job");
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe("icims");
  });

  it("detects SmartRecruiters and Breezy HR", () => {
    expect(detectAts("https://jobs.smartrecruiters.com/Acme/743999")?.id).toBe("smartrecruiters");
    expect(detectAts("https://company.breezy.hr/p/123-role")?.id).toBe("breezy");
  });

  it("detects SAP SuccessFactors and Recruitee", () => {
    expect(detectAts("https://career10.successfactors.com/career?company=xyz")?.id).toBe("successfactors");
    expect(detectAts("https://company.recruitee.com/o/developer")?.id).toBe("recruitee");
  });

  it("returns null for generic company URL or empty string", () => {
    expect(detectAts("https://example.com/careers/apply")).toBeNull();
    expect(detectAts("")).toBeNull();
    expect(detectAts("   ")).toBeNull();
  });
});

describe("atsAdviceFindings", () => {
  it("returns empty findings when profile is null", () => {
    expect(atsAdviceFindings(null)).toEqual([]);
  });

  it("generates an informational finding with cost 0 for Workday", () => {
    const profile = detectAts("https://company.wd5.myworkdayjobs.com/job/1");
    const findings = atsAdviceFindings(profile);

    expect(findings).toHaveLength(1);
    const finding = findings[0]!;
    expect(finding.id).toBe("structure.target-ats-workday");
    expect(finding.cost).toBe(0);
    expect(finding.severity).toBe("low");
    expect(finding.title).toContain("Workday");
    expect(finding.detail).toContain(profile!.notes);
    expect(finding.fix).toBe(profile!.formatAdvice);
  });
});

describe("analyzeCv with target ATS integration", () => {
  it("detects target ATS from job description and includes advisory finding without altering score", () => {
    const jobWithWorkday = `${JOB_AD}\nApply at: https://company.wd5.myworkdayjobs.com/careers/job/101`;
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: jobWithWorkday });

    expect(result.jobAd?.targetAts?.id).toBe("workday");
    const atsFinding = result.findings.find((f) => f.id === "structure.target-ats-workday");
    expect(atsFinding).toBeDefined();
    expect(atsFinding?.cost).toBe(0);

    for (const dimension of result.dimensions) {
      const cost = result.findings
        .filter((finding) => finding.dimension === dimension.id)
        .reduce((sum, finding) => sum + finding.cost, 0);
      expect(dimension.score).toBe(Math.max(0, dimension.max - cost));
    }
  });
});

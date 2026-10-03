import { describe, expect, it } from "vitest";

import { compareResumeToProfile } from "@/lib/linkedin/compare";
import type { LinkedinProfile } from "@/types/linkedin";
import type { Resume } from "@/types/resume";

/**
 * I.2: every inconsistency cites both sources - the CV's own line and the
 * profile's own line - because "does not match" without the two quotes is an
 * accusation, not a finding. Dates compare as engine-normalised months and
 * terms compare through the engine matcher, so this report can never
 * contradict the score.
 */

function baseProfile(overrides: Partial<LinkedinProfile> = {}): LinkedinProfile {
  return {
    name: "Jane Doe",
    headline: "Senior QA Automation Engineer at Adesso SE",
    location: "Berlin, Germany",
    connections: "500+ connections",
    about: "",
    positions: [
      {
        title: "Senior QA Automation Engineer",
        company: "Adesso SE",
        employmentType: "Full-time",
        startDate: "2021-01",
        endDate: "",
        durationLabel: "2 yrs 9 mos",
        location: "Berlin, Germany",
        lines: ["- Built a Playwright suite covering 420 cases."],
        dateLine: "Jan 2021 - Present · 2 yrs 9 mos"
      },
      {
        title: "QA Engineer",
        company: "Beispiel GmbH",
        employmentType: "Full-time",
        startDate: "2017-03",
        endDate: "2020-12",
        durationLabel: "3 yrs 10 mos",
        location: "",
        lines: [],
        dateLine: "Mar 2017 - Dec 2020 · 3 yrs 10 mos"
      }
    ],
    education: [],
    skills: ["Playwright", "Selenium", "REST Assured", "Continuous Integration"],
    languages: [],
    certifications: [],
    interests: [],
    sectionsSeen: ["Experience", "Skills"],
    ...overrides
  };
}

function baseResume(overrides: Partial<Resume> = {}): Resume {
  return {
    basics: { name: "Jane Doe", label: "Senior QA Automation Engineer" },
    work: [
      {
        position: "Senior QA Automation Engineer",
        name: "Adesso SE",
        startDate: "2021-01",
        endDate: ""
      },
      {
        position: "QA Engineer",
        name: "Beispiel GmbH",
        startDate: "2017-03",
        endDate: "2020-12"
      }
    ],
    skills: [{ keywords: ["Playwright", "REST Assured", "CI/CD"] }],
    ...overrides
  };
}

describe("a consistent pair", () => {
  it("reports nothing", () => {
    const report = compareResumeToProfile(baseResume(), baseProfile());
    expect(report.inconsistencies).toEqual([]);
    expect(report.matchedRoles).toBe(2);
  });

  it("is deterministic", () => {
    const a = compareResumeToProfile(baseResume(), baseProfile());
    const b = compareResumeToProfile(baseResume(), baseProfile());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("date mismatches", () => {
  it("flags a start date beyond tolerance and quotes both sides", () => {
    const resume = baseResume({
      work: [
        { position: "Senior QA Automation Engineer", name: "Adesso SE", startDate: "2021-03", endDate: "" },
        { position: "QA Engineer", name: "Beispiel GmbH", startDate: "2017-03", endDate: "2020-12" }
      ]
    });
    const report = compareResumeToProfile(resume, baseProfile());
    const dates = report.inconsistencies.filter((entry) => entry.kind === "date-mismatch");
    expect(dates).toHaveLength(1);
    expect(dates[0]?.cvEvidence).toContain("2021-03 - present");
    expect(dates[0]?.profileEvidence).toContain("Jan 2021 - Present · 2 yrs 9 mos");
  });

  it("tolerates a one-month rounding difference", () => {
    const resume = baseResume({
      work: [
        { position: "Senior QA Automation Engineer", name: "Adesso SE", startDate: "2021-02", endDate: "" },
        { position: "QA Engineer", name: "Beispiel GmbH", startDate: "2017-03", endDate: "2020-12" }
      ]
    });
    const report = compareResumeToProfile(resume, baseProfile());
    expect(report.inconsistencies.filter((entry) => entry.kind === "date-mismatch")).toEqual([]);
  });

  it("flags one side open and the other closed", () => {
    const resume = baseResume({
      work: [
        { position: "Senior QA Automation Engineer", name: "Adesso SE", startDate: "2021-01", endDate: "" },
        { position: "QA Engineer", name: "Beispiel GmbH", startDate: "2017-03", endDate: "" }
      ]
    });
    const report = compareResumeToProfile(resume, baseProfile());
    const dates = report.inconsistencies.filter((entry) => entry.kind === "date-mismatch");
    expect(dates).toHaveLength(1);
    expect(dates[0]?.cvEvidence).toContain("2017-03 - present");
    expect(dates[0]?.profileEvidence).toContain("Mar 2017 - Dec 2020");
  });
});

describe("title mismatches", () => {
  it("flags two titles for one role and quotes both", () => {
    const profile = baseProfile();
    const positions = profile.positions.map((position, index) =>
      index === 1 ? { ...position, title: "Quality Engineer" } : position
    );
    const report = compareResumeToProfile(baseResume(), baseProfile({ positions }));
    const titles = report.inconsistencies.filter((entry) => entry.kind === "title-mismatch");
    expect(titles).toHaveLength(1);
    expect(titles[0]?.cvEvidence).toContain("QA Engineer");
    expect(titles[0]?.profileEvidence).toContain("Quality Engineer");
  });
});

describe("skills in the CV but not in the profile", () => {
  it("flags the missing skill and cites both lists", () => {
    const resume = baseResume({
      skills: [{ keywords: ["Playwright", "REST Assured", "CI/CD", "Kubernetes"] }]
    });
    const report = compareResumeToProfile(resume, baseProfile());
    const skills = report.inconsistencies.filter((entry) => entry.kind === "skill-only-in-cv");
    expect(skills).toHaveLength(1);
    expect(skills[0]?.cvEvidence).toContain("Kubernetes");
    expect(skills[0]?.profileEvidence).toContain("Playwright, Selenium");
  });

  it("uses the engine matcher, so a synonym is a match", () => {
    // "CI/CD" is in the CV; the profile only says "Continuous Integration".
    // The score would count that as a hit, so the report must too.
    const report = compareResumeToProfile(baseResume(), baseProfile());
    expect(report.inconsistencies.some((entry) => entry.cvEvidence.includes("CI/CD"))).toBe(false);
  });

  it("matches Turkish inflections through the engine's stemmer", () => {
    const resume = baseResume({ skills: [{ keywords: ["süreç"] }] });
    const profile = baseProfile({
      positions: [
        {
          title: "Senior QA Automation Engineer",
          company: "Adesso SE",
          employmentType: "Full-time",
          startDate: "2021-01",
          endDate: "",
          durationLabel: "",
          location: "",
          lines: ["Release süreçlerini iyileştirdim."],
          dateLine: "Jan 2021 - Present"
        }
      ]
    });
    const report = compareResumeToProfile(resume, profile);
    expect(
      report.inconsistencies.filter((entry) => entry.kind === "skill-only-in-cv")
    ).toEqual([]);
  });
});

describe("headline against the target role", () => {
  it("flags a headline that shares nothing with the CV headline", () => {
    const report = compareResumeToProfile(
      baseResume(),
      baseProfile({ headline: "Barista at Coffee House" })
    );
    const headline = report.inconsistencies.find((entry) => entry.kind === "headline-mismatch");
    expect(headline).toBeDefined();
    expect(headline?.cvEvidence).toContain("Senior QA Automation Engineer");
    expect(headline?.profileEvidence).toContain("Barista at Coffee House");
  });

  it("accepts a related headline", () => {
    const report = compareResumeToProfile(baseResume(), baseProfile());
    expect(report.inconsistencies.filter((entry) => entry.kind === "headline-mismatch")).toEqual([]);
  });
});

describe("report hygiene", () => {
  it("never emits an inconsistency without both quotes", () => {
    const resume = baseResume({
      work: [
        { position: "Senior QA Automation Engineer", name: "Adesso SE", startDate: "2021-05", endDate: "" },
        { position: "Test Lead", name: "Beispiel GmbH", startDate: "2017-03", endDate: "2020-12" },
        { position: "Intern", name: "Startup Ltd", startDate: "2016-01", endDate: "2016-06" }
      ],
      skills: [{ keywords: ["Kubernetes", "Terraform"] }]
    });
    const report = compareResumeToProfile(
      resume,
      baseProfile({ headline: "Barista at Coffee House" })
    );
    expect(report.inconsistencies.length).toBeGreaterThan(0);
    for (const entry of report.inconsistencies) {
      expect(entry.cvEvidence.trim().length, entry.id).toBeGreaterThan(0);
      expect(entry.profileEvidence.trim().length, entry.id).toBeGreaterThan(0);
      expect(entry.detail.trim().length, entry.id).toBeGreaterThan(0);
    }
    // The intern role has no profile counterpart: it is unmatched, not an
    // inconsistency - absence in one document is the user's business.
    expect(report.matchedRoles).toBe(2);
  });
});

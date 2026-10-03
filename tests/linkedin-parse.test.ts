import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "@/lib/linkedin/parse";

import { LINKEDIN_PDF_EN, LINKEDIN_PDF_TR } from "./fixtures/linkedin";

/**
 * I.1: the user's own "Save as PDF" export, parsed in the browser. The
 * fixture carries the export's real quirks - every line twice, the contact
 * suffix on the location, duration labels behind the dates - and the parser
 * must come out with clean, quotable structure. Dates go through the
 * engine's extractPeriods, so a LinkedIn range means exactly what the same
 * range on a CV means.
 */

const en = parseLinkedinText(LINKEDIN_PDF_EN);
const tr = parseLinkedinText(LINKEDIN_PDF_TR);

describe("the English export", () => {
  it("reads the header", () => {
    expect(en.profile.name).toBe("Jane Doe");
    expect(en.profile.headline).toBe("Senior QA Automation Engineer at Adesso SE");
    expect(en.profile.location).toBe("Berlin, Berlin, Germany");
    expect(en.profile.connections).toBe("500+ connections");
  });

  it("collapses the doubled lines", () => {
    expect(en.profile.about.split("Senior QA engineer").length).toBe(2);
    expect(en.profile.about).toContain("mentor engineers into ownership.");
  });

  it("reads both positions with engine-parsed dates", () => {
    expect(en.profile.positions).toHaveLength(2);
    const [first, second] = en.profile.positions;
    expect(first?.title).toBe("Senior QA Automation Engineer");
    expect(first?.company).toBe("Adesso SE");
    expect(first?.employmentType).toBe("Full-time");
    expect(first?.startDate).toBe("2021-01");
    expect(first?.endDate).toBe("");
    expect(first?.durationLabel).toBe("2 yrs 9 mos");
    expect(first?.location).toBe("Berlin, Germany");
    // normalizeDocument folds the en dash to a hyphen; the citation is the
    // line as the parser saw it.
    expect(first?.dateLine).toBe("Jan 2021 - Present · 2 yrs 9 mos");
    expect(second?.title).toBe("QA Engineer");
    expect(second?.company).toBe("Beispiel GmbH");
    expect(second?.startDate).toBe("2017-03");
    expect(second?.endDate).toBe("2020-12");
    expect(second?.durationLabel).toBe("3 yrs 10 mos");
  });

  it("keeps description lines verbatim, bullets included", () => {
    const lines = en.profile.positions[0]?.lines ?? [];
    expect(lines).toContain("Owns the regression automation for a claims platform.");
    expect(lines).toContain("- Built a Playwright suite covering 420 cases.");
    expect(lines).toContain("- Reduced failed releases by 40%.");
    expect(lines).not.toContain("QA Engineer");
  });

  it("reads education, skills, languages, certifications and interests", () => {
    expect(en.profile.education[0]).toMatchObject({
      school: "Istanbul Technical University",
      degree: "BSc, Computer Engineering",
      startDate: "2011-01",
      endDate: "2015-01"
    });
    expect(en.profile.skills).toEqual([
      "Playwright",
      "Selenium",
      "TypeScript",
      "REST Assured",
      "Kubernetes"
    ]);
    expect(en.profile.languages).toEqual([
      { language: "Turkish", proficiency: "Native or bilingual proficiency" },
      { language: "English", proficiency: "Full professional proficiency" }
    ]);
    expect(en.profile.certifications).toEqual([
      {
        name: "ISTQB Certified Tester Advanced Level",
        issuer: "ISTQB",
        issuedLine: "Issued Jan 2019"
      }
    ]);
    expect(en.profile.interests).toEqual(["Test automation meetups Berlin"]);
  });

  it("lists the sections it saw and warns about nothing", () => {
    expect(en.profile.sectionsSeen).toContain("Experience");
    expect(en.profile.sectionsSeen).toContain("Certifications");
    expect(en.warnings).toEqual([]);
  });
});

describe("the Turkish export", () => {
  it("reads header and position through localized headings and dates", () => {
    expect(tr.profile.name).toBe("Ayşe Yılmaz");
    expect(tr.profile.headline).toBe("Test Otomasyon Mühendisi");
    expect(tr.profile.location).toBe("İstanbul, Türkiye");

    const position = tr.profile.positions[0];
    expect(position?.title).toBe("Test Otomasyon Mühendisi");
    expect(position?.company).toBe("Örnek A.Ş.");
    expect(position?.employmentType).toBe("Tam zamanlı");
    expect(position?.startDate).toBe("2021-01");
    expect(position?.endDate).toBe("");
    expect(position?.durationLabel).toBe("2 yıl 9 ay");
    expect(position?.lines).toContain("- Playwright ile 120 senaryoluk regresyon paketi kurdum.");
  });

  it("reads education and skills without the pagination line", () => {
    expect(tr.profile.education[0]?.school).toBe("İstanbul Teknik Üniversitesi");
    expect(tr.profile.education[0]?.degree).toBe("Bilgisayar Mühendisliği");
    expect(tr.profile.skills).toEqual(["Playwright", "SQL"]);
  });
});

describe("degradation", () => {
  it("warns instead of guessing on an empty document", () => {
    const empty = parseLinkedinText("");
    expect(empty.profile.name).toBe("");
    expect(empty.profile.positions).toEqual([]);
    expect(empty.warnings.join(" ")).toContain("no readable name");
  });

  it("warns when the export has no Experience section", () => {
    const partial = parseLinkedinText("Jane Doe\n\nSkills\nPlaywright\n");
    expect(partial.profile.name).toBe("Jane Doe");
    expect(partial.warnings.join(" ")).toContain("no Experience section");
    expect(partial.profile.skills).toEqual(["Playwright"]);
  });

  it("warns about a dated entry with no title above it", () => {
    const headless = parseLinkedinText(
      "Jane Doe\n\nExperience\n\nJan 2021 – Present · 2 yrs\n"
    );
    expect(headless.profile.positions).toHaveLength(1);
    expect(headless.warnings.join(" ")).toContain("no title line");
  });
});

import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { detectSections, sectionRanges } from "@/lib/scoring/sections";
import { toLines } from "@/lib/scoring/text";

/**
 * A skill that exists only as a word in a comma-separated list has no
 * evidence behind it. Parsers and recruiters both weight a term used in a
 * sentence about real work above a list item.
 */

const AD = `QA Automation Engineer

We are looking for an engineer to own our regression automation.

Requirements
- Hands-on experience with Playwright and Cypress
- Solid TypeScript and SQL skills
- Comfortable in an agile team with short release cycles

Your tasks
- Maintain and extend the automation suite
- Improve release confidence
`;

function cv(extraBullet: string): string {
  return `Jane Doe
jane@example.com
+49 151 0000000

Experience

QA Engineer, Beispiel GmbH
01/2020 - present
- Automated the regression suite with Playwright across three products.
- Reduced release verification time from hours to minutes.
${extraBullet}

Skills
Playwright, Cypress, TypeScript, SQL, Jira
`;
}

describe("keywords.listed-only", () => {
  it("fires for a term that appears only inside the skills section", () => {
    const result = analyzeCv({ cvText: cv("- Kept the test data fixtures up to date."), jobDescription: AD });
    const finding = result.findings.find((entry) => entry.id === "keywords.listed-only");
    expect(finding).toBeDefined();
    expect(finding?.cost).toBeGreaterThanOrEqual(1);
    expect(finding?.evidence?.join(" ")).toContain("cypress");
  });

  it("stays quiet once the term is used in an experience bullet", () => {
    const result = analyzeCv({
      cvText: cv("- Migrated 40 smoke tests to Cypress and wired them into the pipeline."),
      jobDescription: AD
    });
    const finding = result.findings.find((entry) => entry.id === "keywords.listed-only");
    const listed = finding?.evidence ?? [];
    expect(listed).not.toContain("cypress");
  });
});

describe("sectionRanges", () => {
  const lines = toLines(`Jane Doe

Experience

QA Engineer
01/2020 - present
- Did things

Skills
Playwright, Cypress
`);
  const ranges = sectionRanges(detectSections(lines), lines.length);

  it("bounds each section by the next heading", () => {
    const experience = ranges.find((range) => range.id === "experience");
    const skills = ranges.find((range) => range.id === "skills");
    expect(experience?.start).toBe(1);
    expect(experience?.end).toBe(skills?.start);
  });

  it("runs the last section to the end of the document", () => {
    const skills = ranges.find((range) => range.id === "skills");
    expect(skills?.end).toBe(lines.length);
  });
});

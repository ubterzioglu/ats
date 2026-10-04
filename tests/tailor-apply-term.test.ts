import { describe, expect, it } from "vitest";

import { addTermToCvText } from "@/lib/tailor/apply-term";
import { analyzeCv } from "@/lib/scoring";

/**
 * The text-side half of the D.3 gate. The workbench scores raw text, so this
 * is the path a confirmed term actually travels; the rule it enforces is the
 * same one `addSkillToResume` enforces for the builder.
 */

const CV = `Jane Doe
jane@example.com

Skills
Playwright, Jira, Docker

Experience

QA Engineer, Beispiel GmbH
- Automated the regression suite across three products.
`;

function sectionsOf(cvText: string) {
  return analyzeCv({ cvText }).sections;
}

describe("addTermToCvText", () => {
  it("refuses a term the candidate has not confirmed", () => {
    expect(() => addTermToCvText(CV, sectionsOf(CV), "Kubernetes", false)).toThrow(
      /without explicit user confirmation/
    );
  });

  it("joins the list the skills section already uses", () => {
    const next = addTermToCvText(CV, sectionsOf(CV), "Kubernetes", true);
    expect(next).toContain("Playwright, Jira, Docker, Kubernetes");
    expect(next).toContain("QA Engineer, Beispiel GmbH");
  });

  it("keeps the separator the CV chose", () => {
    const dotted = CV.replace("Playwright, Jira, Docker", "Playwright · Jira · Docker");
    const next = addTermToCvText(dotted, sectionsOf(dotted), "Kubernetes", true);
    expect(next).toContain("Playwright · Jira · Docker · Kubernetes");
  });

  it("writes a line of its own when the section holds no list", () => {
    const plain = CV.replace("Playwright, Jira, Docker", "Playwright");
    const next = addTermToCvText(plain, sectionsOf(plain), "Kubernetes", true);
    expect(next).toMatch(/Skills\nKubernetes\nPlaywright/);
  });

  it("leaves a term the CV already names alone", () => {
    expect(addTermToCvText(CV, sectionsOf(CV), "docker", true)).toBe(CV);
  });

  it("refuses rather than inventing a skills section", () => {
    const noSkills = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Automated the regression suite across three products.
`;
    expect(addTermToCvText(noSkills, sectionsOf(noSkills), "Kubernetes", true)).toBeNull();
  });

  it("does not touch the sections below the one it edits", () => {
    const next = addTermToCvText(CV, sectionsOf(CV), "Kubernetes", true) ?? "";
    expect(next.split("\n")).toHaveLength(CV.split("\n").length);
    expect(next.slice(next.indexOf("Experience"))).toBe(CV.slice(CV.indexOf("Experience")));
  });
});

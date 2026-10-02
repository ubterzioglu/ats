import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import { scoreImpact } from "@/lib/scoring/impact";

/**
 * "Spearheaded" is a resume word, not an engineering one. Inflated verbs and
 * filler padding are the fingerprints of text written to impress a filter;
 * they cost precision without adding a single fact.
 */

function idsOf(cv: string): string[] {
  return scoreImpact(buildContext(cv)).findings.map((finding) => finding.id);
}

const INFLATED_CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Spearheaded the migration of the legacy test suite to a new framework.
- Leveraged existing tooling in order to reduce the manual effort.
- Tasked with the release verification across three products.
- Utilized Jira for tracking the defects found during the cycles.
`;

const PLAIN_CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Led the migration of the legacy test suite to Playwright.
- Reused existing tooling to cut the manual effort by 40%.
- Owned release verification across three products.
- Tracked defects in Jira through four release cycles.
`;

describe("impact.inflated-language", () => {
  it("fires on inflated verbs and filler", () => {
    expect(idsOf(INFLATED_CV)).toContain("impact.inflated-language");
  });

  it("stays quiet on plain verbs", () => {
    expect(idsOf(PLAIN_CV)).not.toContain("impact.inflated-language");
  });

  it("quotes the offending phrases as evidence", () => {
    const findings = scoreImpact(buildContext(INFLATED_CV)).findings;
    const inflated = findings.find((finding) => finding.id === "impact.inflated-language");
    expect(inflated?.cost).toBe(1);
    expect(inflated?.evidence?.join(" ")).toContain("spearheaded");
    expect(inflated?.evidence?.join(" ")).toContain("in order to");
  });
});

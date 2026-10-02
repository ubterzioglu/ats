import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import { scoreImpact } from "@/lib/scoring/impact";

/**
 * "Familiar with" is not a claim anyone can verify. When hedging spreads
 * across the bullets, the document stops asserting ownership of its own work.
 */

function idsOf(cv: string): string[] {
  return scoreImpact(buildContext(cv)).findings.map((finding) => finding.id);
}

const HEDGED_CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Familiar with Playwright and Selenium from two client projects.
- Automated 120 regression cases and cut the cycle to 30 minutes.
- Built the API test stack used by three teams.
- Mentored two juniors through their certification.
`;

const DIRECT_CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Migrated 40 legacy tests to Playwright with zero loss of coverage.
- Automated 120 regression cases and cut the cycle to 30 minutes.
- Built the API test stack used by three teams.
- Mentored two juniors through their certification.
`;

const GERMAN_CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Grundkenntnisse in Docker und Kubernetes aus dem Studium.
- Automated 120 regression cases and cut the cycle to 30 minutes.
- Built the API test stack used by three teams.
- Mentored two juniors through their certification.
`;

const TURKISH_CV = `Jane Doe

Experience

QA Engineer, Firma AS
- Temel düzeyde Selenium ve Java bilgisi.
- Automated 120 regression cases and cut the cycle to 30 minutes.
- Built the API test stack used by three teams.
- Mentored two juniors through their certification.
`;

describe("impact.hedging", () => {
  it("fires when hedges reach 15% of the bullets", () => {
    expect(idsOf(HEDGED_CV)).toContain("impact.hedging");
  });

  it("stays quiet on direct bullets", () => {
    expect(idsOf(DIRECT_CV)).not.toContain("impact.hedging");
  });

  it("reads the German hedge", () => {
    expect(idsOf(GERMAN_CV)).toContain("impact.hedging");
  });

  it("reads the Turkish hedge", () => {
    expect(idsOf(TURKISH_CV)).toContain("impact.hedging");
  });
});

import { describe, expect, it } from "vitest";

import { extractJobKeywords } from "@/lib/scoring/keywords";

/**
 * The taxonomy is finite; job ads are not. Terms worth discovering wear a
 * shape: a capitalised phrase, an acronym, a camelCase product name or a
 * hyphenated compound. Sentence-start capitals are the trap - "Our" is prose,
 * "OpenTelemetry" is a product.
 */

function terms(ad: string): string[] {
  return extractJobKeywords(ad).map((term) => term.term);
}

const AD = `Platform Engineer

Our marketplace team owns the tracing stack end to end.
You will instrument services with OpenTelemetry and define an SLO per service.
Every team tracks each SLO against its error budget.
We publish dashboards for the retail and wholesale segments.
Retail is our fastest growing segment this year.
`;

describe("non-taxonomy term discovery", () => {
  it("finds a camelCase product name used once", () => {
    expect(terms(AD)).toContain("opentelemetry");
  });

  it("finds an acronym that repeats", () => {
    expect(terms(AD)).toContain("slo");
  });

  it("leaves sentence-start prose alone even when capitalised", () => {
    // "Retail" opens a sentence and "retail" appears lowercase elsewhere.
    expect(terms(AD)).not.toContain("retail");
  });

  it("does not mine the title line", () => {
    expect(terms(AD)).not.toContain("platform engineer");
  });

  it("finds a capitalised phrase that is a real product", () => {
    const ad = `Data Engineer

Responsibilities
- Maintain the Databricks Workspace for the analytics guild.
- Keep the Databricks Workspace reproducible with notebooks and jobs.
`;
    expect(terms(ad)).toContain("databricks workspace");
  });

  it("requires a hyphenated compound to repeat before trusting it", () => {
    const once = `Engineer

- Join a remote-first team building payments.
- Work with the delivery guild on releases.
`;
    const twice = `Engineer

- Join a remote-first team building payments.
- Our remote-first culture spans four timezones.
`;
    expect(terms(once)).not.toContain("remote-first");
    expect(terms(twice)).toContain("remote-first");
  });

  it("does not resurrect ambiguous words through compounds", () => {
    const ad = `Program Manager

We are preparing the go-live of the payments platform this quarter.
The go-live checklist is owned by the delivery team.
`;
    expect(terms(ad)).not.toContain("go-live");
  });

  it("skips section headings", () => {
    const ad = `Backend Engineer

Aranan Nitelikler
- Strong Java background
- Experience with Spring Boot and PostgreSQL

Tercihen
- Kafka deneyimi
`;
    expect(terms(ad)).not.toContain("aranan nitelikler");
  });
});

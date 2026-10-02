import { describe, expect, it } from "vitest";

import { countOccurrences, extractJobKeywords } from "@/lib/scoring/keywords";
import { canonicalize } from "@/lib/scoring/taxonomy";

/**
 * "go", "r" and "c" are skills and ordinary words at the same time. Without a
 * gate, "go-live" scores as Golang and "R&D" scores as the R language.
 */

const GO_LIVE_AD = `Platform Engineer

We are preparing the go-live of the new payments platform.
The rollout plan is owned by the delivery team.
`;

const GO_CONTEXT_AD = `Backend Engineer

- Build and operate microservices in Go and Java
- Design REST APIs consumed by our mobile apps
`;

const R_AND_D_AD = `Data Scientist

- Work with our R&D group on fraud detection
- Present results to the product team
`;

const R_CONTEXT_AD = `Quantitative Analyst

- Statistical modelling with R and ggplot2
- Package work published on CRAN
`;

function termNames(text: string): string[] {
  return extractJobKeywords(text).map((term) => term.term);
}

describe("ambiguous short terms in job ads", () => {
  it("does not read go-live as the Go language", () => {
    expect(termNames(GO_LIVE_AD)).not.toContain("golang");
  });

  it("counts Go when the same line carries technical context", () => {
    expect(termNames(GO_CONTEXT_AD)).toContain("golang");
  });

  it("does not read R&D as the R language", () => {
    expect(termNames(R_AND_D_AD)).not.toContain("r");
  });

  it("counts R when the same line carries technical context", () => {
    expect(termNames(R_CONTEXT_AD)).toContain("r");
  });
});

describe("countOccurrences with ambiguous aliases", () => {
  it("counts a contextual Go mention for golang", () => {
    expect(countOccurrences("built microservices in go for the api layer", "golang")).toBe(1);
  });

  it("ignores go-live when counting golang", () => {
    expect(countOccurrences("preparing the go-live of the payments rollout", "golang")).toBe(0);
  });

  it("ignores R&D when counting r", () => {
    expect(countOccurrences("worked with the r&d group on the rollout", "r")).toBe(0);
  });

  it("counts R next to statistical context", () => {
    expect(countOccurrences("statistical modelling with r and ggplot2", "r")).toBe(1);
  });
});

describe("synonym reverse map", () => {
  it("resolves ci to ci/cd, the skill that is actually in the taxonomy", () => {
    expect(canonicalize("ci")).toBe("ci/cd");
  });

  it("no longer treats a bare cd as ci/cd", () => {
    expect(canonicalize("cd")).toBe("cd");
    expect(countOccurrences("use cd to move between directories", "ci/cd")).toBe(0);
  });
});

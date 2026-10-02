import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { countOccurrences, countOccurrencesByVariant } from "@/lib/scoring/keywords";

/**
 * A filter without a synonym table matches literally. If the CV only ever
 * says "k8s", the literal string "Kubernetes" never reaches the recruiter's
 * search. The report should ask for both spellings once.
 */

const AD = `Platform Engineer

We run a large marketplace on managed cloud infrastructure.

Requirements
- Production experience with Kubernetes and Docker
- Solid Python for automation and tooling
- Comfortable in a distributed, remote-first team

Your tasks
- Operate and improve the platform
- Automate operational toil
`;

function cvWith(skillsLine: string): string {
  return `Jane Doe
jane@example.com
+49 151 0000000

Experience

Platform Engineer, Beispiel GmbH
01/2020 - present
- Operated payment services across three regions with on-call rotation.
- Automated deploys and on-call runbooks, cutting incident response time in half.

Skills
${skillsLine}
`;
}

describe("countOccurrencesByVariant", () => {
  it("reports which variant matched", () => {
    const counts = countOccurrencesByVariant("the k8s clusters run docker", "kubernetes");
    expect(counts).toContainEqual({ variant: "k8s", hits: 1 });
    expect(counts).toContainEqual({ variant: "kubernetes", hits: 0 });
  });

  it("agrees with countOccurrences on the total", () => {
    const text = "kubernetes and k8s and more k8s";
    const total = countOccurrencesByVariant(text, "kubernetes").reduce(
      (sum, entry) => sum + entry.hits,
      0
    );
    expect(countOccurrences(text, "kubernetes")).toBe(total);
  });
});

describe("keywords.acronym-pair", () => {
  it("fires when a vacancy term matches only through an alias", () => {
    const result = analyzeCv({ cvText: cvWith("K8s, Docker, Python"), jobDescription: AD });
    const finding = result.findings.find((entry) => entry.id === "keywords.acronym-pair");
    expect(finding).toBeDefined();
    expect(finding?.cost).toBe(1);
    expect(finding?.evidence?.join(" ")).toContain("kubernetes");
  });

  it("stays quiet when the canonical spelling is present", () => {
    const result = analyzeCv({ cvText: cvWith("Kubernetes, Docker, Python"), jobDescription: AD });
    expect(result.findings.map((entry) => entry.id)).not.toContain("keywords.acronym-pair");
  });

  it("stays quiet when both spellings are present", () => {
    const result = analyzeCv({ cvText: cvWith("Kubernetes (k8s), Docker, Python"), jobDescription: AD });
    expect(result.findings.map((entry) => entry.id)).not.toContain("keywords.acronym-pair");
  });
});

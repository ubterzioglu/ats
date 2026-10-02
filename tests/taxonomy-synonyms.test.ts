import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { countOccurrences } from "@/lib/scoring/keywords";
import { SKILL_TAXONOMY, SYNONYMS, canonicalize, isKnownSkill, variantsOf } from "@/lib/scoring/taxonomy";

/**
 * The synonym table is pure data, and data rots silently. These invariants
 * keep it honest: every canonical term is a taxonomy member, no alias serves
 * two masters, and an ad that spells a skill out matches a CV that abbreviates.
 */

describe("SYNONYMS data invariants", () => {
  it("only uses canonical terms that are taxonomy members", () => {
    for (const canonical of Object.keys(SYNONYMS)) {
      expect(isKnownSkill(canonical), `${canonical} is not in SKILL_TAXONOMY`).toBe(true);
    }
  });

  it("registers every alias under exactly one canonical term", () => {
    const seen = new Map<string, string>();
    for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
      for (const alias of aliases) {
        expect(seen.get(alias), `alias "${alias}" also serves ${seen.get(alias)}`).toBeUndefined();
        seen.set(alias, canonical);
      }
    }
  });

  it("keeps aliases lowercase and distinct from their canonical term", () => {
    for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
      for (const alias of aliases) {
        expect(alias).toBe(alias.toLowerCase());
        expect(alias).not.toBe(canonical);
      }
    }
  });

  it("has no duplicate entries in the taxonomy itself", () => {
    expect(new Set(SKILL_TAXONOMY).size).toBe(SKILL_TAXONOMY.length);
  });
});

describe("acronym and expansion match in both directions", () => {
  const pairs: ReadonlyArray<readonly [string, string]> = [
    ["sre", "we practice site reliability engineering at scale"],
    ["aws", "deployed to amazon web services"],
    ["etl", "owned the extract transform load pipelines"],
    ["kpi", "reported the key performance indicators monthly"],
    ["okr", "introduced objectives and key results"],
    ["saas", "sold the product as software as a service"],
    ["gdpr", "full dsgvo compliance for the platform"],
    ["iam", "reworked identity and access management"],
    ["nlp", "built natural language processing pipelines"],
    ["kubernetes", "the k8s clusters run in production"],
    [".net", "services written in dotnet"],
    ["postgresql", "migrated the store to postgres"],
    ["ci/cd", "set up continuous delivery with gitlab"],
    ["devops", "joined the dev ops guild"],
    ["business intelligence", "the bi team reports in tableau"]
  ];

  for (const [term, sentence] of pairs) {
    it(`matches "${term}" against its spelled-out form`, () => {
      expect(canonicalize(term)).toBe(term);
      expect(countOccurrences(sentence, term)).toBeGreaterThanOrEqual(1);
      expect(variantsOf(term).length).toBeGreaterThan(1);
    });
  }

  it("canonicalizes single-token aliases to the taxonomy spelling", () => {
    expect(canonicalize("k8s")).toBe("kubernetes");
    expect(canonicalize("dsgvo")).toBe("gdpr");
    expect(canonicalize("ml")).toBe("machine learning");
    expect(canonicalize("qa")).toBe("quality assurance");
    expect(canonicalize("ci")).toBe("ci/cd");
  });

  it("does not relate terms that are merely associated", () => {
    expect(variantsOf("agile")).not.toContain("scrum");
    expect(variantsOf("scrum")).not.toContain("agile");
  });
});

describe("end-to-end matching through the analyzer", () => {
  const abbreviatedAd = `Platform Reliability Engineer

We keep a large SaaS platform available around the clock.

Requirements
- Experience with AWS and Kubernetes in production
- Python scripting for automation
- An ownership mindset and calm incident handling

Your tasks
- Operate and improve the platform
- Lead incident response and postmortems
`;

  const spellingOutCv = `Jane Doe
jane@example.com
+49 151 0000000

Experience

Platform Engineer, Beispiel GmbH
01/2020 - present
- Operated payment services on Amazon Web Services and Kubernetes across three regions.
- Automated deploys and on-call runbooks, cutting incident response time in half.
`;

  it("matches a CV that spells out against an ad that abbreviates", () => {
    const result = analyzeCv({ cvText: spellingOutCv, jobDescription: abbreviatedAd });
    const matched = result.keywords.matched.map((term) => term.term);
    expect(matched).toContain("aws");
    expect(matched).toContain("kubernetes");
  });
});

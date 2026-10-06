import { afterEach, describe, expect, it, vi } from "vitest";

import raw from "@/lib/scoring/data/approved-synonyms.json";
import {
  APPROVED_SYNONYM_FILE,
  differsByVersion,
  isGuardedSurface,
  nestedSpelling,
  parseApprovedSynonym,
  parseApprovedSynonymFile,
  type ApprovedSynonym
} from "@/lib/scoring/approved-synonyms";
import { AMBIGUOUS_TERMS, buildApprovedSynonymIndex, canonicalize, isKnownSkill } from "@/lib/scoring/taxonomy";

/**
 * Approved synonyms reach the engine only through a person: the shipped file
 * is read, but only entries marked `approvedBy: "human"` count. These tests
 * use their own lists for the human case, so no approval is ever written into
 * the shipped file on a reviewer's behalf.
 */

function entry(overrides: Partial<ApprovedSynonym> = {}): ApprovedSynonym {
  return {
    id: "syn-test000001",
    canonical: "market analysis",
    aliases: ["marktanalyse", "pazar analizi"],
    languages: ["de", "en", "tr"],
    approvedBy: "human",
    approvedOn: "2026-10-06",
    origin: "manual",
    similarity: null,
    ...overrides
  };
}

describe("the shipped approved-synonyms file", () => {
  it("parses without a single rejected row", () => {
    expect(APPROVED_SYNONYM_FILE.rejected).toBe(0);
    expect(APPROVED_SYNONYM_FILE.entries.length).toBe((raw.entries as unknown[]).length);
  });

  it("has no ambiguous, stopword or too-short surface", () => {
    for (const item of APPROVED_SYNONYM_FILE.entries) {
      for (const surface of [item.canonical, ...item.aliases]) {
        expect(isGuardedSurface(surface), surface).toBe(false);
        expect(AMBIGUOUS_TERMS.has(surface), surface).toBe(false);
      }
    }
  });

  it("dates every human approval", () => {
    for (const item of APPROVED_SYNONYM_FILE.entries) {
      if (item.approvedBy === "human") expect(item.approvedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("schema validation", () => {
  it("accepts a well-formed entry", () => {
    expect(parseApprovedSynonym(entry())).toEqual(entry());
  });

  it.each([
    ["a bad id", { id: "market" }],
    ["an unfolded surface", { aliases: ["Marktanalyse"] }],
    ["no aliases", { aliases: [] }],
    ["the canonical repeated as an alias", { aliases: ["market analysis"] }],
    ["an unknown language", { languages: ["fr"] }],
    ["an unknown approval state", { approvedBy: "model" }],
    ["a human approval without a date", { approvedOn: null }],
    ["an unknown origin", { origin: "llm" }],
    ["a similarity out of range", { similarity: 2 }]
  ])("rejects %s", (_name, overrides) => {
    expect(parseApprovedSynonym({ ...entry(), ...overrides })).toBeNull();
  });

  it("skips malformed rows and repeated ids instead of trusting them", () => {
    const file = parseApprovedSynonymFile({ schema: 1, entries: [entry(), entry(), "x"] });
    expect(file.entries).toHaveLength(1);
    expect(file.rejected).toBe(2);
    expect(parseApprovedSynonymFile({ schema: 2, entries: [entry()] }).entries).toEqual([]);
  });
});

describe("guards", () => {
  it("flags version and symbol look-alikes", () => {
    expect(differsByVersion("html", "html5")).toBe(true);
    expect(differsByVersion("iso 9001", "iso 27001")).toBe(true);
    expect(differsByVersion("c#", "c++")).toBe(true);
    expect(differsByVersion("ci/cd", "cicd")).toBe(false);
    expect(differsByVersion("market analysis", "marktanalyse")).toBe(false);
  });

  it("flags nested spellings", () => {
    expect(nestedSpelling("java", "javascript")).toBe(true);
    expect(nestedSpelling("sql", "mysql")).toBe(true);
    expect(nestedSpelling("budgeting", "bütçeleme")).toBe(false);
  });
});

describe("buildApprovedSynonymIndex", () => {
  it("applies a human-approved entry", () => {
    const index = buildApprovedSynonymIndex([entry()]);
    expect(index.aliasOf.get("marktanalyse")).toBe("market analysis");
    expect(index.aliasOf.get("pazar analizi")).toBe("market analysis");
    expect(index.variants.get("market analysis")).toEqual(["marktanalyse", "pazar analizi"]);
    expect(index.phrases.get("pazar analizi")).toBeUndefined();
  });

  it("ignores a pending-review entry completely", () => {
    const index = buildApprovedSynonymIndex([entry({ approvedBy: "pending-review", approvedOn: null })]);
    expect(index.aliasOf.size).toBe(0);
    expect(index.variants.size).toBe(0);
    expect(index.phrases.size).toBe(0);
  });

  it("ranks below the curated table and the dictionary", () => {
    const index = buildApprovedSynonymIndex([
      // "postgres" is a curated alias, "python" a curated term and
      // "marketing analysis" a dictionary alias of "market analysis".
      entry({ canonical: "financial management", aliases: ["postgres", "python", "marketing analysis", "finanzmanagement"] })
    ]);
    expect([...index.aliasOf.keys()]).toEqual(["finanzmanagement"]);
  });

  it("drops ambiguous and version look-alike aliases", () => {
    const index = buildApprovedSynonymIndex([
      entry({ canonical: "java", aliases: ["go", "javascript8", "java 17"] })
    ]);
    expect(index.aliasOf.size).toBe(0);
  });

  it("ignores an entry whose canonical term the engine does not know", () => {
    expect(isKnownSkill("not a real skill at all")).toBe(false);
    const index = buildApprovedSynonymIndex([entry({ canonical: "not a real skill at all" })]);
    expect(index.aliasOf.size).toBe(0);
  });

  it("keeps the first claim and never turns a canonical term into an alias", () => {
    const index = buildApprovedSynonymIndex([
      entry(),
      entry({ id: "syn-test000002", canonical: "financial management", aliases: ["marktanalyse", "finanzmanagement"] }),
      entry({ id: "syn-test000003", canonical: "finanzmanagement", aliases: ["market analysis"] })
    ]);
    expect(index.aliasOf.get("marktanalyse")).toBe("market analysis");
    expect(index.aliasOf.get("market analysis")).toBeUndefined();
  });
});

describe("engine integration", () => {
  const JSON_PATH = "@/lib/scoring/data/approved-synonyms.json";
  const GERMAN_CV = `Erfahrung
Analystin, Beispiel GmbH
- Marktanalyse und Wettbewerbsbeobachtung für drei Produktlinien`;

  async function engineWith(entries: readonly unknown[]) {
    vi.resetModules();
    vi.doMock(JSON_PATH, () => ({ default: { schema: 1, entries } }));
    const taxonomy = await import("@/lib/scoring/taxonomy");
    const match = await import("@/lib/scoring/match");
    const scoring = await import("@/lib/scoring");
    return { taxonomy, match, scoring };
  }

  afterEach(() => {
    vi.doUnmock(JSON_PATH);
    vi.resetModules();
  });

  it("leaves the engine untouched with the shipped file", () => {
    expect(canonicalize("marktanalyse")).toBe("marktanalyse");
  });

  it("gives a pending-review entry no effect at all", async () => {
    const before = await engineWith([]);
    const baseline = before.scoring.analyzeCv({ cvText: GERMAN_CV });
    const after = await engineWith([entry({ approvedBy: "pending-review", approvedOn: null })]);
    expect(after.taxonomy.canonicalize("marktanalyse")).toBe("marktanalyse");
    expect(after.taxonomy.variantsOf("market analysis")).toEqual(before.taxonomy.variantsOf("market analysis"));
    const { generatedAt: _before, ...expected } = baseline;
    const { generatedAt: _after, ...actual } = after.scoring.analyzeCv({ cvText: GERMAN_CV });
    expect(actual).toEqual(expected);
    expect(actual.keywords.matched.map((term) => term.term)).toContain("marktanalyse");
  });

  it("applies a human-approved entry to canonical terms, variants and matching", async () => {
    const before = await engineWith([]);
    const unmatched = before.match.matchTerms(
      [{ term: "market analysis", weight: 1, hits: 0 }],
      GERMAN_CV,
      "de",
      "normalized"
    );
    expect(unmatched.matched).toHaveLength(0);

    const { taxonomy, match, scoring } = await engineWith([entry()]);
    expect(taxonomy.canonicalize("marktanalyse")).toBe("market analysis");
    expect(taxonomy.variantsOf("market analysis")).toEqual(expect.arrayContaining(["marktanalyse", "pazar analizi"]));
    expect(taxonomy.findDictionaryPhrases("Pazar analizi ve raporlama")).toContain("market analysis");

    const outcome = match.matchTerms([{ term: "market analysis", weight: 1, hits: 0 }], GERMAN_CV, "de", "normalized");
    expect(outcome.matched[0]?.alias).toBe("marktanalyse");

    const terms = scoring.analyzeCv({ cvText: GERMAN_CV }).keywords.matched.map((term) => term.term);
    expect(terms).toContain("market analysis");
    expect(terms).not.toContain("marktanalyse");
  });

  it("keeps score = max - sum(cost) with an approval applied", async () => {
    const { scoring } = await engineWith([entry()]);
    const result = scoring.analyzeCv({ cvText: GERMAN_CV });
    for (const dimension of result.dimensions) {
      const cost = result.findings
        .filter((finding) => finding.dimension === dimension.id)
        .reduce((sum, finding) => sum + finding.cost, 0);
      expect(dimension.score).toBe(Math.max(0, Math.min(dimension.max, dimension.max - cost)));
    }
  });
});

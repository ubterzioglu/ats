import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isGuardedSurface, parseApprovedSynonymFile } from "@/lib/scoring/approved-synonyms";

import { approveProposal } from "../apps/web/scripts/lib/synonym-approval.mjs";
import { clusterTerms, collectTerms, excludedPair, mineSynonyms, proposalId } from "../apps/web/scripts/lib/synonym-miner.mjs";

/**
 * The miner runs on a developer machine with a real embedding model. Here it
 * runs end to end with a fake embedder whose vectors are chosen by hand, so
 * what is tested is the clustering and the exclusion rules, never the model.
 * Nothing produced here is a real suggestion.
 */

const WEB = join(__dirname, "..", "apps", "web");

type Vector = readonly number[];

/** Concept axes; a term's vector is its concept plus a small, fixed offset. */
const AXES = 8;
function concept(axis: number, wobble = 0): Vector {
  return Array.from({ length: AXES }, (_, index) => (index === axis ? 1 : index === AXES - 1 ? wobble : 0));
}

const FAKE_VECTORS: Readonly<Record<string, Vector>> = {
  "budget planning": concept(0, 0.05),
  haushaltsplanung: concept(0, 0.1),
  "bütçe planlaması": concept(0, 0.12),
  java: concept(1),
  javascript: concept(1, 0.05),
  "iso 9001": concept(2),
  "iso 27001": concept(2, 0.05),
  budgeting: concept(3),
  budgetierung: concept(3, 0.02),
  "agile development": concept(4),
  "agile softwareentwicklung": concept(4, 0.05),
  "agile methods": concept(4, -0.08),
  kvkk: concept(5),
  "kraft-wärme-kopplung": concept(5, 0.02),
  forklift: concept(6)
};

interface FakeEmbedder {
  readonly id: string;
  readonly real: false;
  readonly calls: string[][];
  embed(texts: readonly string[]): Promise<number[][]>;
}

function fakeEmbedder(): FakeEmbedder {
  const calls: string[][] = [];
  return {
    id: "fake-test-embedder",
    real: false,
    calls,
    async embed(texts) {
      calls.push([...texts]);
      return texts.map((text) => {
        const term = text.replace(/^query: /, "");
        const vector = FAKE_VECTORS[term];
        if (!vector) throw new Error(`no fake vector for ${term}`);
        return [...vector];
      });
    }
  };
}

const GROUPS: Readonly<Record<string, string>> = { budgetierung: "budgeting" };
const groupOf = (term: string): string => GROUPS[term] ?? term;

interface ProposalMember {
  readonly term: string;
  readonly languages: readonly string[];
  readonly sources: readonly string[];
  readonly linkedTo: string | null;
}

interface Proposal {
  readonly id: string;
  readonly canonical: string;
  readonly aliases: readonly string[];
  readonly languages: readonly string[];
  readonly crossLanguage: boolean;
  readonly similarity: { readonly min: number; readonly mean: number };
  readonly sources: readonly string[];
  readonly members: readonly ProposalMember[];
}

function records() {
  return collectTerms({
    curated: ["java", "javascript", "budgeting"],
    synonyms: { budgeting: ["budgetierung"] },
    dictionary: [
      { term: "budget planning", language: "en", source: "esco", aliases: [] },
      { term: "haushaltsplanung", language: "de", source: "esco", aliases: [] },
      { term: "bütçe planlaması", language: "tr", source: "manual-tr", aliases: [] },
      { term: "iso 9001", language: "en", source: "esco", aliases: [] },
      { term: "iso 27001", language: "de", source: "esco", aliases: [] },
      { term: "agile development", language: "en", source: "esco", aliases: [] },
      { term: "agile softwareentwicklung", language: "de", source: "esco", aliases: [] },
      { term: "agile methods", language: "en", source: "esco", aliases: [] },
      { term: "kraft-wärme-kopplung", language: "de", source: "esco", aliases: [] },
      { term: "forklift", language: "en", source: "onet", aliases: [] },
      { term: "go", language: "en", source: "onet", aliases: [] }
    ],
    extra: [{ term: "kvkk", language: "tr", source: "fixture" }],
    groupOf
  });
}

async function mine(options: Record<string, unknown> = {}) {
  const embedder = fakeEmbedder();
  const result = await mineSynonyms({
    records: records(),
    embedder,
    options: { threshold: 0.95, ...options },
    generatedAt: "2026-01-01"
  });
  return { result, embedder, proposals: result.proposals as Proposal[] };
}

function allTerms(proposals: readonly Proposal[]): string[] {
  return proposals.flatMap((proposal) => proposal.members.map((member) => member.term));
}

describe("collectTerms", () => {
  it("drops ambiguous tokens before anything is embedded", () => {
    const terms = records().map((record: { term: string }) => record.term);
    expect(terms).not.toContain("go");
    expect(isGuardedSurface("go")).toBe(true);
  });

  it("marks curated terms and existing aliases as fixed", () => {
    const byTerm = new Map(records().map((record: { term: string }) => [record.term, record]));
    expect(byTerm.get("budgeting")).toMatchObject({ curated: true, movable: false });
    expect(byTerm.get("budgetierung")).toMatchObject({ group: "budgeting", movable: false, languages: [] });
    expect(byTerm.get("haushaltsplanung")).toMatchObject({ movable: true, languages: ["de"] });
  });
});

describe("mineSynonyms with a fake embedder", () => {
  it("clusters a cross-language translation set into one proposal", async () => {
    const { proposals } = await mine();
    const budget = proposals.find((proposal) => proposal.canonical === "budget planning");
    expect(budget).toBeDefined();
    expect(budget?.aliases).toEqual(["bütçe planlaması", "haushaltsplanung"]);
    expect(budget?.languages).toEqual(["de", "en", "tr"]);
    expect(budget?.crossLanguage).toBe(true);
    expect(budget?.similarity.min).toBeGreaterThanOrEqual(0.95);
    expect(budget?.id).toBe(proposalId(["budget planning", "bütçe planlaması", "haushaltsplanung"]));
  });

  it("embeds with the e5 query prefix", async () => {
    const { embedder } = await mine();
    expect(embedder.calls.flat().every((text) => text.startsWith("query: "))).toBe(true);
  });

  it("never proposes known pairs, version look-alikes, nested spellings or acronym-sized tokens", async () => {
    const terms = allTerms((await mine()).proposals);
    for (const term of ["budgeting", "budgetierung", "java", "javascript", "iso 9001", "iso 27001", "kvkk"]) {
      expect(terms, term).not.toContain(term);
    }
  });

  it("names the reason for each exclusion", () => {
    const byTerm = new Map(records().map((record: { term: string }) => [record.term, record]));
    const pair = (a: string, b: string): string | null => excludedPair(byTerm.get(a), byTerm.get(b));
    expect(pair("budgeting", "budgetierung")).toBe("known");
    expect(pair("iso 9001", "iso 27001")).toBe("version");
    expect(pair("java", "javascript")).toBe("nested");
    expect(pair("kvkk", "kraft-wärme-kopplung")).toBe("short-token");
    expect(pair("agile development", "agile methods")).toBe("same-language");
    expect(pair("budget planning", "haushaltsplanung")).toBeNull();
  });

  it("pairs same-language terms only when asked to", async () => {
    const strict = allTerms((await mine()).proposals);
    expect(strict).not.toContain("agile methods");
    const loose = (await mine({ crossLanguageOnly: false })).proposals;
    expect(allTerms(loose)).toContain("agile methods");
  });

  it("respects a configurable threshold", async () => {
    expect((await mine({ threshold: 0.9999 })).proposals).toEqual([]);
  });

  it("is deterministic", async () => {
    const first = await mine();
    const second = await mine();
    expect(second.result).toEqual(first.result);
  });

  it("writes the documented, unreviewed output shape", async () => {
    const { result, proposals } = await mine();
    expect(result).toMatchObject({
      schema: 1,
      status: "unreviewed",
      generatedAt: "2026-01-01",
      embedder: "fake-test-embedder"
    });
    expect(result.note).toMatch(/not reviewed/);
    for (const proposal of proposals) {
      expect(proposal.id).toMatch(/^syn-[0-9a-f]{10}$/);
      expect(typeof proposal.canonical).toBe("string");
      expect(proposal.aliases.length).toBeGreaterThan(0);
      expect(proposal.aliases).not.toContain(proposal.canonical);
      expect(Array.isArray(proposal.sources)).toBe(true);
      expect(proposal.members.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("clusterTerms", () => {
  const record = (term: string, language: string) => ({
    term,
    languages: [language],
    sources: ["esco"],
    group: term,
    curated: false,
    dictionaryTerm: true,
    movable: true
  });

  it("does not chain unrelated terms through a hub (complete linkage)", () => {
    // a~hub and hub~b clear the threshold, a~b does not.
    const items = [record("alpha term", "en"), record("hub term", "de"), record("beta term", "tr")];
    const vectors = [
      [1, 0, 0],
      [Math.SQRT1_2, Math.SQRT1_2, 0],
      [0, 1, 0]
    ];
    const { proposals } = clusterTerms(items, vectors, { threshold: 0.7 });
    expect(proposals).toHaveLength(1);
    expect((proposals[0] as Proposal).members).toHaveLength(2);
  });

  it("requires one vector per term", () => {
    expect(() => clusterTerms([record("alpha term", "en")], [], {})).toThrow();
  });
});

describe("approveProposal", () => {
  const proposalsDoc = {
    proposals: [
      {
        id: "syn-aaaaaaaaaa",
        canonical: "market analysis",
        aliases: ["marktanalyse", "pazar analizi"],
        languages: ["de", "en", "tr"],
        similarity: { min: 0.95, mean: 0.96 }
      }
    ]
  };
  const empty = Object.freeze({ schema: 1, entries: Object.freeze([]) });

  it("writes a human approval with the reviewer's date, valid for the engine", () => {
    const { doc, entry, promoted } = approveProposal({
      approvedDoc: empty,
      proposalsDoc,
      id: "syn-aaaaaaaaaa",
      date: "2026-10-06",
      isGuarded: isGuardedSurface
    });
    expect(promoted).toBe(false);
    expect(entry).toMatchObject({
      canonical: "market analysis",
      aliases: ["marktanalyse", "pazar analizi"],
      approvedBy: "human",
      approvedOn: "2026-10-06",
      origin: "miner",
      similarity: 0.95
    });
    const parsed = parseApprovedSynonymFile(doc);
    expect(parsed.rejected).toBe(0);
    expect(parsed.entries).toHaveLength(1);
    expect(empty.entries).toHaveLength(0);
  });

  it("drops the aliases the reviewer rejected", () => {
    const { entry } = approveProposal({
      approvedDoc: empty,
      proposalsDoc,
      id: "syn-aaaaaaaaaa",
      date: "2026-10-06",
      drop: ["pazar analizi"]
    });
    expect(entry.aliases).toEqual(["marktanalyse"]);
  });

  it("refuses a typo in --drop, an empty result, a bad date and an unknown id", () => {
    const base = { approvedDoc: empty, proposalsDoc, id: "syn-aaaaaaaaaa", date: "2026-10-06" };
    expect(() => approveProposal({ ...base, drop: ["marktanalysen"] })).toThrow(/not an alias/);
    expect(() => approveProposal({ ...base, drop: ["marktanalyse", "pazar analizi"] })).toThrow(/nothing left/);
    expect(() => approveProposal({ ...base, date: "06.10.2026" })).toThrow(/YYYY-MM-DD/);
    expect(() => approveProposal({ ...base, id: "syn-bbbbbbbbbb" })).toThrow(/no proposal/);
  });

  it("refuses an ambiguous surface", () => {
    const risky = { proposals: [{ ...proposalsDoc.proposals[0], aliases: ["go"] }] };
    expect(() =>
      approveProposal({
        approvedDoc: empty,
        proposalsDoc: risky,
        id: "syn-aaaaaaaaaa",
        date: "2026-10-06",
        isGuarded: isGuardedSurface
      })
    ).toThrow(/ambiguous/);
  });

  it("refuses an alias another approved entry already owns", () => {
    const approvedDoc = {
      schema: 1,
      entries: [
        {
          id: "syn-cccccccccc",
          canonical: "marketing",
          aliases: ["marktanalyse"],
          languages: ["de"],
          approvedBy: "human",
          approvedOn: "2026-01-01",
          origin: "manual",
          similarity: null
        }
      ]
    };
    expect(() =>
      approveProposal({ approvedDoc, proposalsDoc, id: "syn-aaaaaaaaaa", date: "2026-10-06" })
    ).toThrow(/already used/);
  });

  it("promotes a pending-review entry and leaves a human one alone", () => {
    const pending = {
      id: "syn-dddddddddd",
      canonical: "market analysis",
      aliases: ["marktanalyse"],
      languages: ["de", "en"],
      approvedBy: "pending-review",
      approvedOn: null,
      origin: "manual",
      similarity: null
    };
    const { doc, promoted } = approveProposal({
      approvedDoc: { schema: 1, entries: [pending] },
      proposalsDoc: { proposals: [] },
      id: "syn-dddddddddd",
      date: "2026-10-06"
    });
    expect(promoted).toBe(true);
    expect(doc.entries[0]).toMatchObject({ approvedBy: "human", approvedOn: "2026-10-06" });
    expect(pending.approvedBy).toBe("pending-review");
    expect(() =>
      approveProposal({ approvedDoc: doc, proposalsDoc: { proposals: [] }, id: "syn-dddddddddd", date: "2026-10-07" })
    ).toThrow(/already approved/);
  });
});

describe("the miner stays off the runtime path", () => {
  const read = (relative: string): string => readFileSync(join(WEB, relative), "utf8");

  it("takes its embedder as an argument instead of loading a model", () => {
    for (const file of ["scripts/lib/synonym-miner.mjs", "scripts/lib/synonym-approval.mjs"]) {
      expect(read(file)).not.toMatch(/@huggingface|onnxruntime|@mlc-ai/);
    }
  });

  it("is never run by install, build or test scripts", () => {
    const { scripts } = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    for (const command of Object.values(scripts)) {
      expect(command).not.toMatch(/mine-synonyms|approve-synonyms|dump-costs/);
    }
  });
});

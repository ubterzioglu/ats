import { describe, expect, it } from "vitest";

import { describeChange } from "@/lib/bench/change";
import { analyzeCv } from "@/lib/scoring";
import type { AnalysisResult, Finding } from "@/types/analysis";

/**
 * C.2's acceptance is that every score change is attributable to a finding.
 * That is an arithmetic claim, so it is checked as one: the total must move by
 * exactly what the findings that closed and opened are worth.
 */

function finding(id: string, cost: number, extra: Partial<Finding> = {}): Finding {
  return {
    id,
    dimension: "contact",
    severity: "medium",
    title: id,
    detail: "",
    fix: "",
    cost,
    ...extra
  };
}

function result(total: number, findings: readonly Finding[], score = 10): AnalysisResult {
  return {
    total,
    band: "good",
    bandLabel: "",
    language: "en",
    dimensions: [{ id: "contact", label: "Contact", score, max: 10, summary: "" }],
    findings,
    keywords: { source: "baseline", coverage: 0, matched: [], missing: [], overused: [] },
    sections: [],
    stats: {
      characters: 0,
      words: 0,
      lines: 0,
      bulletLines: 0,
      averageBulletWords: 0,
      estimatedPages: 1,
      years: [],
      experienceMonths: 0
    },
    generatedAt: ""
  };
}

describe("describeChange", () => {
  it("names the finding that closed and what it was worth", () => {
    const before = result(60, [finding("contact.phone", 6)], 4);
    const after = result(66, [], 10);

    const change = describeChange(before, after);
    expect(change?.total).toBe(6);
    expect(change?.closed.map((entry) => entry.id)).toEqual(["contact.phone"]);
    expect(change?.opened).toEqual([]);
    expect(change?.attributed).toBe(true);
  });

  it("names the dimension that moved, and only that one", () => {
    const before = result(60, [finding("contact.phone", 6)], 4);
    const after = result(66, [], 10);

    expect(describeChange(before, after)?.dimensions).toEqual([
      { id: "contact", label: "Contact", delta: 6 }
    ]);
  });

  it("reports a finding the edit introduced", () => {
    const before = result(66, [], 10);
    const after = result(62, [finding("contact.email", 4)], 6);

    const change = describeChange(before, after);
    expect(change?.total).toBe(-4);
    expect(change?.opened.map((entry) => entry.id)).toEqual(["contact.email"]);
    expect(change?.attributed).toBe(true);
  });

  it("nets a swap: one closed, one opened", () => {
    const before = result(60, [finding("contact.phone", 6)], 4);
    const after = result(62, [finding("contact.email", 4)], 6);

    const change = describeChange(before, after);
    expect(change?.total).toBe(2);
    expect(change?.closed.map((entry) => entry.id)).toEqual(["contact.phone"]);
    expect(change?.opened.map((entry) => entry.id)).toEqual(["contact.email"]);
    expect(change?.attributed).toBe(true);
  });

  it("says so when the arithmetic does not add up", () => {
    // A dimension at its floor absorbs part of the cost, so the total moves by
    // less than the findings are worth. The UI must not claim full attribution.
    const before = result(50, [finding("a", 6), finding("b", 9)], 0);
    const after = result(53, [finding("b", 9)], 1);

    const change = describeChange(before, after);
    expect(change?.total).toBe(3);
    expect(change?.closed.map((entry) => entry.id)).toEqual(["a"]);
    expect(change?.attributed).toBe(false);
  });

  it("reports nothing when nothing changed", () => {
    const same = result(60, [finding("contact.phone", 6)], 4);
    expect(describeChange(same, same)).toBeNull();
  });

  it("reports a change whose findings moved but whose total did not", () => {
    const before = result(60, [finding("a", 5)], 5);
    const after = result(60, [finding("b", 5)], 5);

    const change = describeChange(before, after);
    expect(change).not.toBeNull();
    expect(change?.total).toBe(0);
    expect(change?.closed.map((entry) => entry.id)).toEqual(["a"]);
    expect(change?.opened.map((entry) => entry.id)).toEqual(["b"]);
  });
});

describe("against the real engine", () => {
  const WITHOUT_PHONE = [
    "Ayse Yilmaz",
    "ayse@example.com  Istanbul  linkedin.com/in/ayseyilmaz",
    "",
    "EXPERIENCE",
    "Senior QA Engineer    2021 - present",
    "- Led the regression suite, cutting release testing to four hours"
  ].join("\n");

  const WITH_PHONE = WITHOUT_PHONE.replace(
    "ayse@example.com  Istanbul",
    "ayse@example.com  +90 555 000 00 00  Istanbul"
  );

  it("attributes a real fix to the findings it closed", () => {
    const before = analyzeCv({ cvText: WITHOUT_PHONE });
    const after = analyzeCv({ cvText: WITH_PHONE });

    const change = describeChange(before, after);
    expect(change).not.toBeNull();
    if (!change) return;

    expect(change.total).toBeGreaterThan(0);
    expect(change.closed.length).toBeGreaterThan(0);

    // The invariant the product's claim rests on: points recovered equal the
    // cost of the findings that went away, net of any that appeared.
    const worth =
      change.closed.reduce((sum, entry) => sum + entry.cost, 0) -
      change.opened.reduce((sum, entry) => sum + entry.cost, 0);
    expect(worth).toBe(change.total);
    expect(change.attributed).toBe(true);
  });
});

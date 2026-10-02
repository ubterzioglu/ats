import { describe, expect, it } from "vitest";

import { restoreSharedReport } from "@/lib/report/restore";
import { analyzeCv } from "@/lib/scoring";

/**
 * Review focus 2: a row written by an older build, read by this one. Each case
 * here is a row shape that would have crashed the report page under the cast
 * that `loadReport` used to do.
 */

const CV = [
  "Ayse Yilmaz",
  "ayse@example.com  Istanbul",
  "",
  "EXPERIENCE",
  "Senior QA Engineer    2021 - present",
  "- Responsible for the regression suite"
].join("\n");

describe("a row this build wrote", () => {
  it("comes back with its scores and findings intact", () => {
    const original = analyzeCv({ cvText: CV });
    const restored = restoreSharedReport(JSON.parse(JSON.stringify(original)));

    expect(restored).not.toBeNull();
    expect(restored?.total).toBe(original.total);
    expect(restored?.band).toBe(original.band);
    expect(restored?.dimensions).toHaveLength(original.dimensions.length);
    expect(restored?.findings.map((finding) => finding.id)).toEqual(
      original.findings.map((finding) => finding.id)
    );
  });

  it("survives the evidence stripping a share link applies", () => {
    const original = analyzeCv({ cvText: CV });
    const stripped = {
      ...JSON.parse(JSON.stringify(original)),
      findings: original.findings.map(({ evidence: _evidence, ...rest }) => rest)
    };

    const restored = restoreSharedReport(stripped);
    expect(restored?.findings.every((finding) => finding.evidence === undefined)).toBe(true);
  });
});

describe("a row an older build wrote", () => {
  it("renders when arrays this build maps over are absent", () => {
    const restored = restoreSharedReport({
      total: 64,
      band: "good",
      bandLabel: "Good",
      language: "tr",
      generatedAt: "2025-01-01T00:00:00.000Z"
    });

    expect(restored).not.toBeNull();
    expect(restored?.dimensions).toEqual([]);
    expect(restored?.findings).toEqual([]);
    expect(restored?.keywords.matched).toEqual([]);
    expect(restored?.keywords.source).toBe("baseline");
    expect(restored?.stats.words).toBe(0);
  });

  it("keeps the findings it can read and drops the ones it cannot", () => {
    const restored = restoreSharedReport({
      total: 50,
      findings: [
        { title: "No phone number", cost: 6 },
        { nothing: "usable" },
        null,
        "a string where an object belongs",
        { title: "Two columns", cost: 8, severity: "critical", dimension: "parseability" }
      ]
    });

    expect(restored?.findings.map((finding) => finding.title)).toEqual([
      "No phone number",
      "Two columns"
    ]);
  });

  it("fills a finding's missing fields rather than rendering undefined", () => {
    const restored = restoreSharedReport({ total: 50, findings: [{ title: "No phone number" }] });
    const finding = restored?.findings[0];

    expect(finding?.id).toBe("No phone number");
    expect(finding?.detail).toBe("");
    expect(finding?.fix).toBe("");
    expect(finding?.cost).toBe(0);
    expect(finding?.severity).toBe("medium");
  });

  it("clamps a dimension score into its own range", () => {
    const restored = restoreSharedReport({
      total: 50,
      dimensions: [
        { id: "contact", label: "Contact", score: 999, max: 10 },
        { id: "impact", label: "Impact", score: -4, max: 20 },
        { id: "structure", label: "Structure", score: 5 }
      ]
    });

    expect(restored?.dimensions).toEqual([
      { id: "contact", label: "Contact", score: 10, max: 10, summary: "" },
      { id: "impact", label: "Impact", score: 0, max: 20, summary: "" }
    ]);
  });

  it("replaces a value outside the known set with a readable default", () => {
    const restored = restoreSharedReport({
      total: 50,
      band: "legendary",
      language: "fr",
      findings: [{ title: "x", severity: "apocalyptic", dimension: "vibes" }]
    });

    expect(restored?.band).toBe("fair");
    expect(restored?.language).toBe("en");
    expect(restored?.findings[0]?.severity).toBe("medium");
    expect(restored?.findings[0]?.dimension).toBe("parseability");
  });
});

describe("a row that is not a report", () => {
  it("reads as gone rather than as an empty report", () => {
    expect(restoreSharedReport(null)).toBeNull();
    expect(restoreSharedReport("a string")).toBeNull();
    expect(restoreSharedReport([])).toBeNull();
    expect(restoreSharedReport({})).toBeNull();
    expect(restoreSharedReport({ total: 140 })).toBeNull();
    expect(restoreSharedReport({ total: -1 })).toBeNull();
  });
});

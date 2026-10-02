import { describe, expect, it } from "vitest";

import { readExperienceEntries } from "@/lib/bench/entries";
import { extractPeriods } from "@/lib/scoring/experience";

const NOW = new Date("2026-01-15T00:00:00.000Z");

const CV = [
  "Ayse Yilmaz",
  "ayse@example.com",
  "",
  "EXPERIENCE",
  "Senior QA Engineer, Acme GmbH, 2021 - present",
  "- Led the regression suite",
  "QA Engineer, Beta AS, 2018 - 2021",
  "",
  "EDUCATION",
  "BSc Computer Engineering, 2014 - 2018"
].join("\n");

describe("readExperienceEntries", () => {
  it("separates the title, the employer and the range", () => {
    const entries = readExperienceEntries(CV, NOW);
    const senior = entries.find((entry) => entry.title === "Senior QA Engineer");

    expect(senior?.organisation).toBe("Acme GmbH");
    expect(senior?.range).toContain("2021");
    expect(senior?.open).toBe(true);
    expect(senior?.status).toBe("read");
  });

  it("returns entries in document order", () => {
    const entries = readExperienceEntries(CV, NOW);
    expect(entries.map((entry) => entry.line)).toEqual([...entries.map((entry) => entry.line)].sort((a, b) => a - b));
    expect(entries[0]?.title).toBe("Senior QA Engineer");
  });

  it("carries a line index that points at the entry", () => {
    const lines = CV.split("\n");
    for (const entry of readExperienceEntries(CV, NOW)) {
      expect(lines[entry.line]?.trim()).toBe(entry.source);
    }
  });

  it("reads exactly the ranges the engine reads, and no others", () => {
    const lines = CV.split("\n");
    const { periods, reversed } = extractPeriods(lines, NOW);
    const entries = readExperienceEntries(CV, NOW);

    expect(entries).toHaveLength(periods.length + reversed.length);
    for (const entry of entries) {
      expect([...periods.map((period) => period.source), ...reversed]).toContain(entry.source);
    }
  });

  it("marks a backwards range as unusable rather than hiding it", () => {
    const text = ["EXPERIENCE", "QA Engineer, Acme, 2021 - 2018"].join("\n");
    const entries = readExperienceEntries(text, NOW);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.status).toBe("unusable");
    expect(entries[0]?.title).toBe("QA Engineer");
  });

  it("keeps a title with no employer rather than splitting it mid-phrase", () => {
    const text = ["EXPERIENCE", "Senior QA Engineer, 2021 - 2023"].join("\n");
    const entry = readExperienceEntries(text, NOW)[0];

    expect(entry?.title).toBe("Senior QA Engineer");
    expect(entry?.organisation).toBeUndefined();
  });

  it("reports nothing when the document has no date range at all", () => {
    expect(readExperienceEntries("Ayse Yilmaz\nQA Engineer at Acme", NOW)).toEqual([]);
  });

  it("resolves two identical lines to two different lines", () => {
    const text = [
      "QA Engineer, Acme, 2018 - 2020",
      "QA Engineer, Acme, 2018 - 2020"
    ].join("\n");

    const entries = readExperienceEntries(text, NOW);
    expect(entries.map((entry) => entry.line)).toEqual([0, 1]);
  });
});

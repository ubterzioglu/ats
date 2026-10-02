import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import {
  buildExperience,
  classifyDateShape,
  collectDateFormats,
  extractPeriods
} from "@/lib/scoring/experience";
import { scoreStructure } from "@/lib/scoring/structure";

import { DE_CV, TR_CV } from "./fixtures";

/**
 * J.5: the Structure dimension reads the date shapes Turkish and German CVs
 * actually use - month abbreviations with and without dots, numeric DD.MM
 * endpoints, and open-ended roles spelled "heute", "halen" or "devam ediyor".
 */

const NOW = new Date(2024, 0, 15);

function idsOf(cv: string): string[] {
  return scoreStructure(buildContext(cv)).findings.map((finding) => finding.id);
}

describe("classifyDateShape across languages", () => {
  it("reads Turkish month names and abbreviations", () => {
    expect(classifyDateShape("Ocak 2022")).toBe("month-year-word");
    expect(classifyDateShape("Oca 2022")).toBe("month-year-word");
    expect(classifyDateShape("Oca. 2022")).toBe("month-year-word");
    expect(classifyDateShape("Ağu 2021")).toBe("month-year-word");
  });

  it("reads German month names and abbreviations", () => {
    expect(classifyDateShape("März 2022")).toBe("month-year-word");
    expect(classifyDateShape("Mrz 2022")).toBe("month-year-word");
    expect(classifyDateShape("Jan. 2022")).toBe("month-year-word");
  });

  it("reads numeric endpoints with dots", () => {
    expect(classifyDateShape("01.2022")).toBe("iso-year-month");
    expect(classifyDateShape("12.2019")).toBe("iso-year-month");
  });

  it("reads the open-ended spellings", () => {
    for (const form of ["heute", "halen", "devam", "devam ediyor", "Devam Ediyor", "bis heute", "hâlen"]) {
      expect(classifyDateShape(form)).toBe("present");
    }
  });
});

describe("period arithmetic on TR and DE shapes", () => {
  it("reads a Turkish abbreviated range", () => {
    const report = buildExperience(["Şub 2020 - Ağu 2021"], NOW);
    expect(report.months).toBe(18);
    expect(report.reversed).toEqual([]);
  });

  it("reads a German dotted range", () => {
    const report = buildExperience(["01.2020 - 06.2021"], NOW);
    expect(report.months).toBe(17);
  });

  it("reads month-name ranges in both languages", () => {
    expect(buildExperience(["Jan. 2022 - März 2022"], NOW).months).toBe(2);
    expect(buildExperience(["Oca 2022 - Mart 2022"], NOW).months).toBe(2);
  });

  it("treats devam ediyor and heute as open ends", () => {
    const tr = buildExperience(["Ocak 2020 - Devam Ediyor"], NOW);
    expect(tr.months).toBe(48);
    expect(tr.periods[0]?.open).toBe(true);

    const de = buildExperience(["01.2020 - heute"], NOW);
    expect(de.months).toBe(48);
    expect(de.periods[0]?.open).toBe(true);
  });

  it("still catches a range that ends before it starts", () => {
    const { periods, reversed } = extractPeriods(["08/2022 - 03/2019"], NOW);
    expect(periods).toEqual([]);
    expect(reversed).toHaveLength(1);
  });
});

describe("collectDateFormats across languages", () => {
  it("groups Turkish and numeric shapes together", () => {
    const report = collectDateFormats(["Oca 2022 - halen", "01.2020 - 06.2021"]);
    expect(report.formats).toEqual(new Set(["month-year-word", "iso-year-month"]));
    expect(report.presentForms).toEqual(["halen"]);
  });
});

describe("structure findings on localized dates", () => {
  it("reads the Turkish CV dates without complaint", () => {
    const ids = idsOf(TR_CV);
    expect(ids).not.toContain("structure.no-dates");
    expect(ids).not.toContain("structure.date-format");
    expect(ids).not.toContain("structure.nonstandard-present");
  });

  it("reads the German CV dates without complaint", () => {
    const ids = idsOf(DE_CV);
    expect(ids).not.toContain("structure.no-dates");
    expect(ids).not.toContain("structure.date-format");
    expect(ids).not.toContain("structure.nonstandard-present");
  });

  it("accepts devam ediyor as a standard open end", () => {
    const cv = `Jane Doe
jane@example.com

Experience

QA Engineer, Beispiel GmbH
01/2021 - Devam Ediyor
- Automated the regression suite and kept the pipeline green every day.

QA Engineer, Example Ltd
03/2017 - 12/2020
- Built the API test stack
`;
    const ids = idsOf(cv);
    expect(ids).not.toContain("structure.nonstandard-present");
    expect(ids).not.toContain("structure.date-format");
  });

  it("flags reversed Turkish ranges like any other", () => {
    const cv = `Jane Doe
jane@example.com

Experience

QA Engineer, Beispiel GmbH
Ağu 2022 - Mar 2019
- Automated the regression suite

QA Engineer, Example Ltd
03/2015 - 12/2018
- Built the API test stack
`;
    expect(idsOf(cv)).toContain("structure.reversed-dates");
  });

  it("still flags years that never form ranges", () => {
    const cv = `Jane Doe
jane@example.com

Experience

QA Engineer since 2019, before that studying until 2015 and interning 2014.
Some prose about testing without a single parseable range in sight.
More prose to push the word count up so the short-CV check stays out of it.
`.repeat(6);
    expect(idsOf(cv)).toContain("structure.date-format");
  });
});

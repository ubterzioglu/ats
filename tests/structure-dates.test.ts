import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import { classifyDateShape, collectDateFormats } from "@/lib/scoring/experience";
import { scoreStructure } from "@/lib/scoring/structure";

import { STRONG_CV } from "./fixtures";

/**
 * One CV, one date format. A parser tuned to MM/YYYY reads "March 2020" as
 * noise; a tenure filter that drops endpoints drops the role with it.
 */

function idsOf(cv: string): string[] {
  return scoreStructure(buildContext(cv)).findings.map((finding) => finding.id);
}

const MIXED_CV = `Jane Doe
jane@example.com

Experience

QA Engineer, Beispiel GmbH
March 2020 - Present
- Automated the regression suite

QA Engineer, Example Ltd
03/2017 - 12/2020
- Built the API test stack
`;

const CURRENT_CV = `Jane Doe
jane@example.com

Experience

QA Engineer, Beispiel GmbH
01/2021 - Current
- Automated the regression suite

QA Engineer, Example Ltd
03/2017 - 12/2020
- Built the API test stack
`;

describe("classifyDateShape", () => {
  it("separates the four shapes", () => {
    expect(classifyDateShape("03/2020")).toBe("iso-year-month");
    expect(classifyDateShape("2020-03")).toBe("iso-year-month");
    expect(classifyDateShape("March 2020")).toBe("month-year-word");
    expect(classifyDateShape("2020")).toBe("year-only");
    expect(classifyDateShape("present")).toBe("present");
    expect(classifyDateShape("something")).toBe("unknown");
  });
});

describe("collectDateFormats", () => {
  it("groups endpoint shapes across the document", () => {
    const report = collectDateFormats(buildContext(MIXED_CV).lines);
    expect(report.formats).toEqual(new Set(["month-year-word", "iso-year-month"]));
    expect(report.presentForms).toEqual(["Present"]);
  });
});

describe("structure.mixed-date-formats", () => {
  it("fires when two shapes coexist", () => {
    expect(idsOf(MIXED_CV)).toContain("structure.mixed-date-formats");
  });

  it("stays quiet when every endpoint uses the same shape", () => {
    expect(idsOf(STRONG_CV)).not.toContain("structure.mixed-date-formats");
  });
});

describe("structure.nonstandard-present", () => {
  it("fires for Current", () => {
    expect(idsOf(CURRENT_CV)).toContain("structure.nonstandard-present");
  });

  it("stays quiet for present", () => {
    expect(idsOf(STRONG_CV)).not.toContain("structure.nonstandard-present");
    expect(idsOf(MIXED_CV)).not.toContain("structure.nonstandard-present");
  });
});

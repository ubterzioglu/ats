import { describe, expect, it } from "vitest";

import {
  draftForLine,
  evidenceNeedle,
  findEvidenceLine,
  lineAt,
  replaceLine
} from "@/lib/bench/evidence";
import type { FixDraft } from "@/lib/scoring/drafts";

const CV = [
  "Ayse Yilmaz",
  "Senior QA Engineer    Istanbul    2021 - present",
  "- Responsible for the regression suite",
  "",
  "SKILLS  Selenium, Java"
].join("\n");

describe("evidenceNeedle", () => {
  it("drops the ellipsis a truncated evidence line ends on", () => {
    expect(evidenceNeedle("a long line that was cut…")).toBe("a long line that was cut");
    expect(evidenceNeedle("a long line that was cut...")).toBe("a long line that was cut");
  });

  it("leaves a line that genuinely ends in a full stop", () => {
    expect(evidenceNeedle("Shipped it.")).toBe("Shipped it.");
  });
});

describe("findEvidenceLine", () => {
  it("finds a line quoted whole", () => {
    expect(findEvidenceLine(CV, "- Responsible for the regression suite")).toBe(2);
  });

  it("finds a line quoted in part, as a truncated evidence line is", () => {
    expect(findEvidenceLine(CV, "Senior QA Engineer    Istanbul…")).toBe(1);
  });

  it("prefers an exact line over one that merely contains the text", () => {
    const text = ["Java", "Selenium, Java, REST Assured"].join("\n");
    expect(findEvidenceLine(text, "Java")).toBe(0);
  });

  it("reports -1 rather than guessing when the line is gone", () => {
    expect(findEvidenceLine(CV, "a line the CV never had")).toBe(-1);
    expect(findEvidenceLine(CV, "   ")).toBe(-1);
  });
});

describe("replaceLine", () => {
  it("swaps one line and leaves the rest alone", () => {
    const next = replaceLine(CV, 2, "- Led the regression suite, cutting runtime by 60%");
    expect(next?.split("\n")[2]).toBe("- Led the regression suite, cutting runtime by 60%");
    expect(next?.split("\n")[1]).toBe(CV.split("\n")[1]);
    expect(next?.split("\n")).toHaveLength(5);
  });

  it("refuses an index the document does not have, rather than appending", () => {
    expect(replaceLine(CV, 99, "x")).toBeNull();
    expect(replaceLine(CV, -1, "x")).toBeNull();
  });

  it("keeps an empty line replaceable, since a blank line is still a line", () => {
    expect(replaceLine(CV, 3, "EXPERIENCE")?.split("\n")[3]).toBe("EXPERIENCE");
  });
});

describe("lineAt", () => {
  it("returns the line or null", () => {
    expect(lineAt(CV, 0)).toBe("Ayse Yilmaz");
    expect(lineAt(CV, 99)).toBeNull();
  });
});

describe("draftForLine", () => {
  const drafts: readonly FixDraft[] = [
    { lineIndex: 2, original: "a", replacement: "b", rule: "responsible-for" },
    { lineIndex: 7, original: "c", replacement: "d", rule: "worked-on" }
  ];

  it("picks the draft written for that line", () => {
    expect(draftForLine(drafts, 7)?.rule).toBe("worked-on");
  });

  it("returns undefined when no rule matched that line", () => {
    expect(draftForLine(drafts, 3)).toBeUndefined();
  });
});

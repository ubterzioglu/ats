import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";

import { STRONG_CV } from "./fixtures";

function idsOf(cv: string): string[] {
  return scoreParseability(buildContext(cv)).findings.map((finding) => finding.id);
}

describe("parse.icon-font", () => {
  it("does not count hyphens as icons", () => {
    const hyphenated = `${STRONG_CV}\n- one - two - three - four - five - six - seven - eight\n`;
    expect(idsOf(hyphenated)).not.toContain("parse.icon-font");
  });

  it("fires on private-use icon glyphs", () => {
    const icon = "";
    const withIcons = `${STRONG_CV}\n${icon} phone\n${icon} mail\n${icon} web\n${icon} map\n${icon} git\n${icon} chat\n${icon} cal\n`;
    expect(idsOf(withIcons)).toContain("parse.icon-font");
  });
});

describe("parse.page-furniture", () => {
  it("does not read repeated date-range lines as a footer", () => {
    const dated = `${STRONG_CV}\n2015-01 - 2017-06\n2017-07 - 2019-12\n2020-01 - 2023-05\n`;
    expect(idsOf(dated)).not.toContain("parse.page-furniture");
  });

  it("fires on a page footer that only changes its page number", () => {
    const footer = `${STRONG_CV}\nJane Doe CV - Page 1 of 3\nJane Doe CV - Page 2 of 3\nJane Doe CV - Page 3 of 3\n`;
    const outcome = scoreParseability(buildContext(footer));
    const finding = outcome.findings.find((entry) => entry.id === "parse.page-furniture");
    expect(finding).toBeDefined();
    expect(finding?.evidence).toEqual(["Jane Doe CV - Page 1 of 3"]);
  });
});

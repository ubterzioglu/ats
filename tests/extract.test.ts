import { describe, expect, it } from "vitest";

import { itemsToText, type PositionedItem } from "@/lib/extract/pdf";
import { analyzeCv } from "@/lib/scoring";

function item(text: string, x: number, y: number, width = text.length * 5): PositionedItem {
  return { text, x, y, width };
}

describe("itemsToText", () => {
  it("groups fragments that share a baseline into one line", () => {
    const text = itemsToText([item("Senior QA ", 70, 700), item("Engineer", 120, 700.8)]);
    expect(text).toBe("Senior QA Engineer");
  });

  it("orders lines from the top of the page down", () => {
    const text = itemsToText([item("Second", 70, 680), item("First", 70, 700)]);
    expect(text).toBe("First\nSecond");
  });

  it("marks a column gap so the scorer can see the layout", () => {
    const text = itemsToText([item("Experience", 60, 700, 50), item("Skills", 300, 700, 30)]);
    expect(text).toBe("Experience    Skills");
  });

  it("does not insert a space inside a word split across items", () => {
    const text = itemsToText([item("Play", 60, 700, 20), item("wright", 80, 700, 30)]);
    expect(text).toBe("Playwright");
  });

  it("ignores items without usable coordinates", () => {
    const text = itemsToText([item("kept", 60, 700), { text: "", x: 90, y: 700, width: 0 }]);
    expect(text).toBe("kept");
  });

  it("reconstructs a two-column page so the scorer can flag it", () => {
    const left = [
      "Experience",
      "Senior QA Automation Engineer",
      "Adesso SE, 01/2021 - present",
      "- Built a Playwright regression suite of 420 cases",
      "- Migrated 180 Selenium tests with no loss of coverage",
      "- Automated release checks in GitLab CI",
      "QA Engineer",
      "Beispiel GmbH, 03/2017 - 12/2020",
      "- Designed the API test strategy across 12 services",
      "- Introduced Xray reporting in Jira",
      "Education",
      "BSc Computer Engineering, 2011 - 2015"
    ];
    const right = [
      "Contact",
      "umut@example.com",
      "+49 151 2345678",
      "Berlin, Germany",
      "Skills",
      "Playwright",
      "TypeScript",
      "Docker",
      "Kubernetes",
      "SQL",
      "Languages",
      "English, German"
    ];

    const items = left.flatMap((text, index) => {
      const y = 740 - index * 20;
      const opposite = right[index];
      return opposite === undefined
        ? [item(text, 60, y, 120)]
        : [item(text, 60, y, 120), item(opposite, 320, y, 90)];
    });

    const page = itemsToText(items);
    expect(page.split("\n")).toHaveLength(left.length);

    const result = analyzeCv({ cvText: [page, page].join("\n") });
    expect(result.findings.map((finding) => finding.id)).toContain("parse.columns");
  });
});

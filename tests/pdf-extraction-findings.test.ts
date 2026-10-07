import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import type { ExtractionMetadata } from "@/types/analysis";

import { STRONG_CV } from "./fixtures";

function ids(cv: string, extraction?: ExtractionMetadata): string[] {
  return analyzeCv({ cvText: cv, extraction }).findings.map((f) => f.id);
}

describe("B4: parse.image-page", () => {
  it("fires when some pages have no text layer", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 3,
      emptyPages: 1,
      links: []
    };
    expect(ids(STRONG_CV, extraction)).toContain("parse.image-page");
  });

  it("does not fire when all pages have text", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 3,
      emptyPages: 0,
      links: []
    };
    expect(ids(STRONG_CV, extraction)).not.toContain("parse.image-page");
  });

  it("does not fire without extraction data", () => {
    expect(ids(STRONG_CV)).not.toContain("parse.image-page");
  });

  it("does not fire for non-PDF sources", () => {
    const extraction: ExtractionMetadata = {
      source: "docx",
      pages: 3,
      emptyPages: 1,
      links: []
    };
    expect(ids(STRONG_CV, extraction)).not.toContain("parse.image-page");
  });

  it("costs 4 points", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 3,
      emptyPages: 1,
      links: []
    };
    const result = analyzeCv({ cvText: STRONG_CV, extraction });
    const finding = result.findings.find((f) => f.id === "parse.image-page");
    expect(finding?.cost).toBe(4);
  });
});

describe("B4: contact.hidden-link", () => {
  it("fires when a profile link exists only as an annotation", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 1,
      emptyPages: 0,
      links: ["https://linkedin.com/in/johndoe"]
    };
    const cv = `John Doe
john@example.com
+49 151 2345678
Berlin, Germany

Experience
Engineer at Acme, 2020-present
- Built things
`;
    expect(ids(cv, extraction)).toContain("contact.hidden-link");
  });

  it("does not fire when the profile URL is also in the text", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 1,
      emptyPages: 0,
      links: ["https://linkedin.com/in/johndoe"]
    };
    const cv = `John Doe
john@example.com
+49 151 2345678
linkedin.com/in/johndoe
Berlin, Germany

Experience
Engineer at Acme, 2020-present
- Built things
`;
    expect(ids(cv, extraction)).not.toContain("contact.hidden-link");
  });

  it("does not fire without extraction data", () => {
    const cv = `John Doe
john@example.com
+49 151 2345678
Berlin, Germany

Experience
Engineer at Acme, 2020-present
- Built things
`;
    expect(ids(cv)).not.toContain("contact.hidden-link");
  });

  it("does not fire when links contain no profile URLs", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 1,
      emptyPages: 0,
      links: ["https://example.com/resume"]
    };
    const cv = `John Doe
john@example.com
+49 151 2345678
Berlin, Germany

Experience
Engineer at Acme, 2020-present
- Built things
`;
    expect(ids(cv, extraction)).not.toContain("contact.hidden-link");
  });

  it("costs 2 points", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 1,
      emptyPages: 0,
      links: ["https://github.com/johndoe"]
    };
    const cv = `John Doe
john@example.com
+49 151 2345678
Berlin, Germany

Experience
Engineer at Acme, 2020-present
- Built things
`;
    const result = analyzeCv({ cvText: cv, extraction });
    const finding = result.findings.find((f) => f.id === "contact.hidden-link");
    expect(finding?.cost).toBe(2);
  });

  it("does not double-penalise when contact.profile also fires", () => {
    const extraction: ExtractionMetadata = {
      source: "pdf",
      pages: 1,
      emptyPages: 0,
      links: ["https://linkedin.com/in/johndoe"]
    };
    const cv = `John Doe
john@example.com
+49 151 2345678
Berlin, Germany

Experience
Engineer at Acme, 2020-present
- Built things
`;
    const result = analyzeCv({ cvText: cv, extraction });
    const ids = result.findings.map((f) => f.id);
    expect(ids).toContain("contact.hidden-link");
    expect(ids).toContain("contact.profile");
  });
});

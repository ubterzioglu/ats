import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { extractJobKeywords } from "@/lib/scoring/keywords";
import { detectLanguage } from "@/lib/scoring/language";
import { normalizeDocument } from "@/lib/scoring/text";

import { JOB_AD, STRONG_CV, WEAK_CV } from "./fixtures";

describe("normalizeDocument", () => {
  it("keeps line structure while cleaning pdf artefacts", () => {
    const input = "Proﬁle\n\n\n\nrespon-\nsibility here   ";
    expect(normalizeDocument(input)).toBe("Profile\n\nresponsibility here");
  });
});

describe("detectLanguage", () => {
  it("separates the three supported languages", () => {
    expect(detectLanguage("I was responsible for the release and the team")).toBe("en");
    expect(detectLanguage("Ich war fur das Release und das Team verantwortlich und hatte")).toBe("de");
    expect(detectLanguage("Bu surecte ekip icin sorumlu oldum ve daha sonra bir proje")).toBe("tr");
  });
});

describe("extractJobKeywords", () => {
  const terms = extractJobKeywords(JOB_AD);
  const names = terms.map((term) => term.term);

  it("finds the concrete tools the ad asks for", () => {
    for (const expected of ["playwright", "typescript", "docker", "kubernetes", "istqb"]) {
      expect(names).toContain(expected);
    }
  });

  it("drops generic job-ad filler", () => {
    for (const noise of ["experience", "team", "years", "looking"]) {
      expect(names).not.toContain(noise);
    }
  });

  it("weighs known skills above incidental words", () => {
    const playwright = terms.find((term) => term.term === "playwright");
    const average = terms.reduce((sum, term) => sum + term.weight, 0) / terms.length;
    expect(playwright?.weight ?? 0).toBeGreaterThan(average);
  });
});

describe("analyzeCv", () => {
  const strong = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD });
  const weak = analyzeCv({ cvText: WEAK_CV });

  it("scores a well-formed, on-target CV highly", () => {
    expect(strong.total).toBeGreaterThanOrEqual(80);
    expect(strong.band === "excellent" || strong.band === "good").toBe(true);
  });

  it("scores a vague CV poorly", () => {
    expect(weak.total).toBeLessThan(55);
    expect(weak.band).toBe("risky");
  });

  it("keeps the total equal to the sum of its dimensions", () => {
    const sum = strong.dimensions.reduce((total, dimension) => total + dimension.score, 0);
    expect(strong.total).toBe(sum);
  });

  it("attributes every lost point to a finding", () => {
    for (const dimension of strong.dimensions) {
      const cost = strong.findings
        .filter((finding) => finding.dimension === dimension.id)
        .reduce((total, finding) => total + finding.cost, 0);
      expect(dimension.score).toBe(Math.max(0, dimension.max - cost));
    }
  });

  it("ranks findings by the points they cost", () => {
    const costs = weak.findings.map((finding) => finding.cost);
    expect([...costs].sort((a, b) => b - a)).toEqual(costs);
  });

  it("detects the sections of a structured CV", () => {
    const ids = strong.sections.map((section) => section.id);
    expect(ids).toEqual(expect.arrayContaining(["summary", "experience", "education", "skills"]));
  });

  it("flags the missing contact data of an unstructured CV", () => {
    const ids = weak.findings.map((finding) => finding.id);
    expect(ids).toContain("contact.email");
    expect(ids).toContain("contact.phone");
  });

  it("names the generic phrasing in a vague CV", () => {
    const ids = weak.findings.map((finding) => finding.id);
    expect(ids).toContain("impact.generic-phrasing");
  });

  it("matches the CV against the vacancy when one is supplied", () => {
    expect(strong.keywords.source).toBe("job-description");
    expect(strong.keywords.coverage).toBeGreaterThan(0.6);
    expect(strong.keywords.matched.map((term) => term.term)).toContain("playwright");
  });

  it("caps the keyword dimension and says why when no vacancy is supplied", () => {
    const capped = analyzeCv({ cvText: STRONG_CV });
    const keywords = capped.dimensions.find((dimension) => dimension.id === "keywords");
    expect(keywords?.score).toBeLessThanOrEqual(20);
    expect(capped.findings.map((finding) => finding.id)).toContain("keywords.no-job-description");
  });

  it("reads a multi-column layout as a parsing risk", () => {
    const columned = buildContext(
      STRONG_CV.split("\n")
        .map((line) => (line.length > 0 ? `${line}     Skills: Playwright` : line))
        .join("\n")
    );
    const result = analyzeCv({ cvText: columned.raw });
    expect(result.findings.map((finding) => finding.id)).toContain("parse.columns");
  });

  it("treats an empty document as unreadable rather than throwing", () => {
    const empty = analyzeCv({ cvText: "" });
    expect(empty.total).toBeLessThan(15);
    expect(empty.findings.map((finding) => finding.id)).toContain("parse.too-little-text");
  });
});

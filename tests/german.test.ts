import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { splitCompound, germanVariants } from "@/lib/scoring/german";
import { countOccurrences } from "@/lib/scoring/keywords";

import { DE_CV, DE_JOB_AD, JOB_AD, STRONG_CV } from "./fixtures";

/**
 * J.2: a German ad indexes compounds; a German CV writes them apart, hyphenated
 * or joined, and disagrees with the ad about which. The splitter makes both
 * sides meet without touching the score arithmetic.
 */

describe("splitCompound", () => {
  it("segments dictionary compounds, Fugen included", () => {
    expect(splitCompound("softwareentwicklung")).toEqual(["software", "entwicklung"]);
    expect(splitCompound("qualitätssicherung")).toEqual(["qualität", "sicherung"]);
    expect(splitCompound("testautomatisierung")).toEqual(["test", "automatisierung"]);
    expect(splitCompound("projektmanagement")).toEqual(["projekt", "management"]);
    // Longest component first: Datenbank is itself a dictionary word.
    expect(splitCompound("datenbankanalyse")).toEqual(["datenbank", "analyse"]);
  });

  it("leaves atomic and unknown words alone", () => {
    expect(splitCompound("entwicklung")).toBeNull();
    expect(splitCompound("kubernetes")).toBeNull();
    expect(splitCompound("backend")).toBeNull();
    expect(splitCompound("versicherung")).toBeNull();
  });

  it("derives spaced and hyphenated variants for a compound", () => {
    const variants = germanVariants("testautomatisierung");
    expect(variants).toContain("test automatisierung");
    expect(variants).toContain("test-automatisierung");
  });

  it("derives joined variants for a spaced term", () => {
    const variants = germanVariants("software entwicklung");
    expect(variants).toContain("softwareentwicklung");
    expect(variants).toContain("softwaresentwicklung");
  });
});

describe("German compound matching", () => {
  it("matches a hyphenated CV form against the ad's compound", () => {
    expect(countOccurrences("Verantwortete die Test-Automatisierung im Release-Zug", "testautomatisierung")).toBe(1);
  });

  it("matches a joined CV form against a spaced term", () => {
    expect(countOccurrences("Kenntnisse in Softwareentwicklung und Datenanalyse", "software entwicklung")).toBe(1);
  });

  it("still matches the literal compound", () => {
    expect(countOccurrences("Erfahrung in der Testautomatisierung", "testautomatisierung")).toBe(1);
  });
});

describe("German keyword parity", () => {
  const result = analyzeCv({ cvText: DE_CV, jobDescription: DE_JOB_AD });

  it("reads the German pair as German", () => {
    expect(result.language).toBe("de");
    expect(result.keywords.source).toBe("job-description");
  });

  it("mines the compounds and synonyms the ad repeats", () => {
    const terms = result.keywords.matched.map((term) => term.term);
    // Canonicalised through the synonym table; the CV's Testautomatisierung
    // and Test-Automatisierung are what it matches on.
    expect(terms).toContain("test automation");
    expect(terms).toContain("datenanalyse");
    for (const expected of ["playwright", "typescript", "docker", "kubernetes", "istqb"]) {
      expect(terms).toContain(expected);
    }
  });

  it("matches the German CV comparably to the English one", () => {
    const coverageEn = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD }).keywords.coverage;
    expect(result.keywords.coverage).toBeGreaterThanOrEqual(0.5);
    expect(result.keywords.coverage).toBeGreaterThanOrEqual(coverageEn - 0.15);
  });
});

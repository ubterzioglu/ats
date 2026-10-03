import { describe, expect, it } from "vitest";

import { matchTerms, type SemanticHit } from "@/lib/scoring/match";
import type { KeywordTerm } from "@/types/analysis";

const terms: readonly KeywordTerm[] = [
  { term: "kubernetes", weight: 3, hits: 0, tier: "required" },
  { term: "terraform", weight: 2, hits: 0 }
];

/** The CV names k8s by its acronym and never writes "kubernetes" out. */
const CV = "ran the k8s clusters for three teams\nwrote the infrastructure as code by hand";

describe("matchTerms", () => {
  describe("strict", () => {
    it("counts the canonical spelling and nothing else", () => {
      const { matched, missing } = matchTerms(terms, CV, "en", "strict");
      expect(matched).toHaveLength(0);
      expect(missing.map((term) => term.term)).toEqual(["kubernetes", "terraform"]);
    });

    it("counts the canonical spelling when the CV does write it out", () => {
      const { matched } = matchTerms(terms, "we ran kubernetes in production", "en", "strict");
      expect(matched.map((term) => term.term)).toEqual(["kubernetes"]);
      expect(matched[0]?.hits).toBe(1);
    });

    it("never reports an alias", () => {
      const { matched } = matchTerms(terms, "we ran kubernetes in production", "en", "strict");
      expect(matched[0]?.alias).toBeUndefined();
    });
  });

  describe("normalized", () => {
    it("matches through the acronym the strict mode missed", () => {
      const { matched } = matchTerms(terms, CV, "en", "normalized");
      expect(matched.map((term) => term.term)).toEqual(["kubernetes"]);
    });

    it("names the variant that carried the match", () => {
      const { matched } = matchTerms(terms, CV, "en", "normalized");
      expect(matched[0]?.alias).toBe("k8s");
    });

    it("leaves alias unset when the canonical spelling itself appears", () => {
      const { matched } = matchTerms(terms, "kubernetes and k8s both", "en", "normalized");
      expect(matched[0]?.alias).toBeUndefined();
    });
  });

  describe("semantic", () => {
    const hints: readonly SemanticHit[] = [
      { term: "terraform", passage: "wrote the infrastructure as code by hand", similarity: 0.71 }
    ];

    it("accepts a term the literal matcher could not find", () => {
      const { matched, missing } = matchTerms(terms, CV, "en", "semantic", hints);
      expect(matched.map((term) => term.term).sort()).toEqual(["kubernetes", "terraform"]);
      expect(missing).toHaveLength(0);
    });

    it("carries the passage and similarity that justified it", () => {
      const { matched } = matchTerms(terms, CV, "en", "semantic", hints);
      const terraform = matched.find((term) => term.term === "terraform");
      expect(terraform?.semantic).toEqual({
        passage: "wrote the infrastructure as code by hand",
        similarity: 0.71
      });
    });

    it("leaves the literal hit count at zero, so no view can call it a real mention", () => {
      const { matched } = matchTerms(terms, CV, "en", "semantic", hints);
      expect(matched.find((term) => term.term === "terraform")?.hits).toBe(0);
    });

    it("does not attach evidence to a term that already matched literally", () => {
      const { matched } = matchTerms(
        terms,
        CV,
        "en",
        "semantic",
        [...hints, { term: "kubernetes", passage: "ran the k8s clusters", similarity: 0.9 }]
      );
      expect(matched.find((term) => term.term === "kubernetes")?.semantic).toBeUndefined();
    });

    it("ignores a hint for a term the ad never asked for", () => {
      const { matched } = matchTerms(terms, CV, "en", "semantic", [
        { term: "rust", passage: "wrote some rust", similarity: 0.8 }
      ]);
      expect(matched.map((term) => term.term)).toEqual(["kubernetes"]);
    });

    it("equals the normalized mode when no hint is supplied", () => {
      expect(matchTerms(terms, CV, "en", "semantic")).toEqual({
        ...matchTerms(terms, CV, "en", "normalized"),
        mode: "semantic"
      });
    });
  });

  describe("across the three modes", () => {
    const hints: readonly SemanticHit[] = [
      { term: "terraform", passage: "wrote the infrastructure as code by hand", similarity: 0.71 }
    ];

    it("produces coverage that rises with each mode", () => {
      const strict = matchTerms(terms, CV, "en", "strict").coverage;
      const normalized = matchTerms(terms, CV, "en", "normalized").coverage;
      const semantic = matchTerms(terms, CV, "en", "semantic", hints).coverage;
      expect(strict).toBeLessThan(normalized);
      expect(normalized).toBeLessThan(semantic);
      expect(semantic).toBe(1);
    });

    it("weighs coverage, so a required term moves it further than a preferred one", () => {
      const { coverage } = matchTerms(terms, CV, "en", "normalized");
      expect(coverage).toBeCloseTo(3 / 5, 5);
    });

    it("reports the mode it ran in", () => {
      expect(matchTerms(terms, CV, "en", "strict").mode).toBe("strict");
    });

    it("is deterministic: the same input gives the same result", () => {
      expect(matchTerms(terms, CV, "en", "semantic", hints)).toEqual(
        matchTerms(terms, CV, "en", "semantic", hints)
      );
    });

    it("reports zero coverage for an empty term list rather than dividing by zero", () => {
      const { coverage, matched, missing } = matchTerms([], CV, "en", "normalized");
      expect(coverage).toBe(0);
      expect(matched).toHaveLength(0);
      expect(missing).toHaveLength(0);
    });
  });
});

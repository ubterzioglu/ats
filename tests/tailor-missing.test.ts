import { describe, expect, it } from "vitest";

import { buildMissingTermCards } from "../apps/web/lib/tailor/missing-terms";
import type { KeywordTerm } from "../apps/web/types/analysis";

describe("Missing term cards", () => {
  it("extracts evidence from the job description", () => {
    const jobAd = `We are a leading tech company.
Must have experience with Kubernetes and Docker.
You will be working in an Agile environment.`;

    const missingTerms: KeywordTerm[] = [
      { term: "Kubernetes", weight: 2, hits: 0, tier: "required" },
      { term: "Agile", weight: 1, hits: 0, tier: "preferred" }
    ];

    const cards = buildMissingTermCards(jobAd, missingTerms);
    expect(cards).toHaveLength(2);
    
    const k8sCard = cards.find(c => c.term.term === "Kubernetes");
    expect(k8sCard).toBeDefined();
    expect(k8sCard?.evidence).toBe("Must have experience with Kubernetes and Docker.");
    expect(k8sCard?.suggestedSection).toBe("skills");

    const agileCard = cards.find(c => c.term.term === "Agile");
    expect(agileCard).toBeDefined();
    expect(agileCard?.evidence).toBe("You will be working in an Agile environment.");
    expect(agileCard?.suggestedSection).toBe("summary");
  });

  it("sorts required terms above preferred terms", () => {
    const jobAd = "We need React and prefer Vue.";
    const missingTerms: KeywordTerm[] = [
      { term: "Vue", weight: 1, hits: 0, tier: "preferred" },
      { term: "React", weight: 1, hits: 0, tier: "required" }
    ];

    const cards = buildMissingTermCards(jobAd, missingTerms);
    expect(cards[0]?.term.term).toBe("React");
    expect(cards[1]?.term.term).toBe("Vue");
  });

  it("truncates evidence if it is a huge paragraph", () => {
    const longSentence = "This is a very long sentence ".repeat(20) + "You must know Python. " + "Another long sentence. ".repeat(20);
    const missingTerms: KeywordTerm[] = [{ term: "Python", weight: 1, hits: 0, tier: "required" }];
    
    const cards = buildMissingTermCards(longSentence, missingTerms);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.evidence.length).toBeLessThan(longSentence.length);
    expect(cards[0]?.evidence).toContain("Python");
    expect(cards[0]?.evidence).toContain("...");
  });

  it("filters out missing terms that cannot be found in the text anymore", () => {
    const missingTerms: KeywordTerm[] = [{ term: "Java", weight: 1, hits: 0, tier: "required" }];
    // The term might have been matched via an alias or semantic match in an edge case,
    // but if it's literally not in the text, it drops the card.
    const cards = buildMissingTermCards("We need C# and .NET", missingTerms);
    expect(cards).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { recommendStory } from "../apps/web/lib/interview/practice";
import type { StarCard, StoryBank } from "../apps/web/types/interview";

describe("H.4 Practice Mode", () => {
  const mockCard = (id: string, text: string): StarCard => ({
    id,
    sourceLine: 1,
    sourceText: text,
    situation: { text, present: true },
    task: { text: "", present: false },
    action: { text: "", present: false },
    result: { text: "", present: false },
    topics: []
  });

  const bank: StoryBank = {
    cards: [
      mockCard("card-1", "Led the migration of a legacy system to a modern microservices architecture"),
      mockCard("card-2", "Improved database caching performance by 40 percent")
    ],
    skipped: []
  };

  it("returns null for empty answers", () => {
    expect(recommendStory("   ", bank)).toBeNull();
    expect(recommendStory("", bank)).toBeNull();
  });

  it("returns null if no meaningful words overlap", () => {
    // "the" and "and" are too short (<= 3 chars), "something" doesn't overlap
    const result = recommendStory("the and something", bank);
    expect(result).toBeNull();
  });

  it("finds the card with the highest token overlap", () => {
    const result = recommendStory("In my previous role, I worked on a migration of a legacy monolith.", bank);
    expect(result).not.toBeNull();
    expect(result?.card.id).toBe("card-1");
    // "migration" and "legacy" should match
    expect(result?.overlap).toBeGreaterThan(0);
  });

  it("differentiates between cards based on vocabulary", () => {
    const result = recommendStory("I used caching to improve the performance of our system.", bank);
    expect(result).not.toBeNull();
    expect(result?.card.id).toBe("card-2");
    // "caching" and "performance" match
  });
});

import { describe, expect, it } from "vitest";

import { TEMPLATE_QUESTIONS, mapQuestionsToStories } from "@/lib/interview/questions";
import { buildStoryBank } from "@/lib/interview/stories";
import type { QuestionCategory, PreparedQuestion } from "@/types/interview";

import { STRONG_CV, TR_CV } from "./fixtures";

/**
 * H.2: template questions mapped to story cards with no AI involved. The
 * mapping is topic overlap, ranked by how well the card can actually carry an
 * answer - and a question the CV cannot answer keeps an empty list instead of
 * borrowing a story, because a suggestion must stay traceable to the document.
 */

const CATEGORIES: ReadonlySet<QuestionCategory> = new Set([
  "behavioural",
  "situational",
  "technical",
  "motivation"
]);

function byId(list: readonly PreparedQuestion[], id: string): PreparedQuestion {
  const found = list.find((entry) => entry.question.id === id);
  if (found === undefined) throw new Error(`question ${id} missing from the mapping`);
  return found;
}

describe("the question catalog", () => {
  it("is stable, categorised and always matchable", () => {
    expect(TEMPLATE_QUESTIONS.length).toBeGreaterThanOrEqual(15);
    const ids = TEMPLATE_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const question of TEMPLATE_QUESTIONS) {
      expect(question.text.length).toBeGreaterThan(10);
      expect(CATEGORIES.has(question.category)).toBe(true);
      expect(question.topics.length).toBeGreaterThan(0);
    }
  });
});

describe("mapping onto the English fixture", () => {
  const bank = buildStoryBank(STRONG_CV);
  const prepared = mapQuestionsToStories(bank);

  it("answers the automation question with the automation story", () => {
    const automation = byId(prepared, "automation-win");
    expect(automation.cards.length).toBeGreaterThan(0);
    expect(automation.cards[0]?.sourceText).toContain("Playwright");
  });

  it("answers the mentoring question with the mentoring story", () => {
    const mentoring = byId(prepared, "mentoring");
    expect(mentoring.cards.length).toBeGreaterThan(0);
    expect(mentoring.cards[0]?.sourceText).toContain("Mentored");
  });

  it("only ever suggests cards that exist in the bank", () => {
    const bankIds = new Set(bank.cards.map((card) => card.id));
    for (const entry of prepared) {
      for (const card of entry.cards) {
        expect(bankIds.has(card.id)).toBe(true);
      }
    }
  });

  it("orders answered questions before unanswered ones", () => {
    let seenEmpty = false;
    for (const entry of prepared) {
      if (entry.cards.length === 0) seenEmpty = true;
      else expect(seenEmpty, `${entry.question.id} follows an unanswered question`).toBe(false);
    }
  });

  it("is deterministic", () => {
    expect(mapQuestionsToStories(bank)).toEqual(prepared);
  });
});

describe("mapping onto the Turkish fixture", () => {
  it("maps across languages because topics are", () => {
    const prepared = mapQuestionsToStories(buildStoryBank(TR_CV));
    const automation = byId(prepared, "automation-win");
    expect(automation.cards.length).toBeGreaterThan(0);
    expect(automation.cards[0]?.topics).toContain("automation");
  });
});

describe("honest gaps", () => {
  const narrow = buildStoryBank(`Jane Doe

Experience

QA Lead, Example Ltd
01/2020 - present
- Mentored 4 junior testers through their ISTQB certification.
`);

  it("leaves a question empty when no card carries its topics", () => {
    const prepared = mapQuestionsToStories(narrow);
    expect(byId(prepared, "conflict").cards).toEqual([]);
    expect(byId(prepared, "automation-win").cards).toEqual([]);
    expect(byId(prepared, "mentoring").cards.length).toBe(1);
  });

  it("keeps catalog order when the bank is empty", () => {
    const prepared = mapQuestionsToStories({ cards: [], skipped: [] });
    expect(prepared.map((entry) => entry.question.id)).toEqual(
      TEMPLATE_QUESTIONS.map((question) => question.id)
    );
    expect(prepared.every((entry) => entry.cards.length === 0)).toBe(true);
  });
});

import type { AdQuestion, PreparedAdQuestion, PreparedQuestion, StarCard, StoryBank, TemplateQuestion } from "@/types/interview";

/**
 * Common interview questions, mapped onto the story bank by rules only - no
 * AI required, which is the acceptance. A question matches a card through the
 * topics both carry; a question nothing in the CV answers keeps an empty card
 * list rather than borrowing a story that does not fit, because a suggested
 * answer the document cannot back up is exactly what this product refuses to
 * produce.
 *
 * Question text is engine wording: English, owned here, translated by the
 * interface catalog through the stable ids.
 */

export const TEMPLATE_QUESTIONS: readonly TemplateQuestion[] = [
  {
    id: "process-improvement",
    text: "Tell me about a time you improved a process.",
    category: "behavioural",
    topics: ["process", "quality"]
  },
  {
    id: "automation-win",
    text: "Describe a repetitive task you automated and what it changed.",
    category: "behavioural",
    topics: ["automation", "speed"]
  },
  {
    id: "conflict",
    text: "Tell me about a disagreement with a colleague and how you resolved it.",
    category: "behavioural",
    topics: ["collaboration"]
  },
  {
    id: "deadline",
    text: "Describe how you handled a tight deadline.",
    category: "behavioural",
    topics: ["delivery", "speed"]
  },
  {
    id: "mistake",
    text: "Tell me about a mistake you made at work and what you learned from it.",
    category: "behavioural",
    topics: ["quality", "incident"]
  },
  {
    id: "leadership",
    text: "Tell me about a time you led a project or a small team.",
    category: "behavioural",
    topics: ["leadership", "delivery"]
  },
  {
    id: "mentoring",
    text: "How have you helped a junior colleague grow?",
    category: "behavioural",
    topics: ["mentoring", "collaboration"]
  },
  {
    id: "cross-team",
    text: "How do you work with teams that do not share your priorities?",
    category: "behavioural",
    topics: ["collaboration", "process"]
  },
  {
    id: "production-incident",
    text: "What do you do when a production incident is reported?",
    category: "situational",
    topics: ["incident", "quality", "process"]
  },
  {
    id: "legacy-migration",
    text: "How would you approach migrating a legacy system to a modern stack?",
    category: "situational",
    topics: ["migration", "process"]
  },
  {
    id: "missing-documentation",
    text: "You inherit a component with no documentation. Where do you start?",
    category: "situational",
    topics: ["process", "quality"]
  },
  {
    id: "cost-pressure",
    text: "Describe a time you had to deliver more with less.",
    category: "situational",
    topics: ["cost", "process", "speed"]
  },
  {
    id: "test-strategy",
    text: "How do you decide what is worth testing?",
    category: "technical",
    topics: ["testing", "quality"]
  },
  {
    id: "ci-pipeline",
    text: "Walk me through how a change reaches production where you work.",
    category: "technical",
    topics: ["process", "delivery", "automation"]
  },
  {
    id: "coverage",
    text: "How do you measure whether your testing actually works?",
    category: "technical",
    topics: ["testing", "quality"]
  },
  {
    id: "automation-trust",
    text: "What makes an automation suite trustworthy?",
    category: "technical",
    topics: ["automation", "testing", "quality"]
  },
  {
    id: "proudest",
    text: "Which professional achievement are you proudest of, and why?",
    category: "motivation",
    topics: ["delivery", "quality", "speed"]
  },
  {
    id: "impact",
    text: "What measurable impact did your work have on your team or product?",
    category: "motivation",
    topics: ["speed", "cost", "quality"]
  }
];

const MAX_CARDS_PER_QUESTION = 3;

function completeness(card: StarCard): number {
  return [card.situation, card.task, card.action, card.result].filter(
    (field) => field.present
  ).length;
}

/**
 * Topic overlap decides whether a card can answer at all; a card with a real
 * result outranks one without, and completeness breaks the remaining ties.
 * Source line order makes the whole ranking reproducible.
 */
function scoreCard(question: TemplateQuestion, card: StarCard): number {
  let overlap = 0;
  for (const topic of question.topics) {
    if (card.topics.includes(topic)) overlap += 1;
  }
  if (overlap === 0) return -1;
  return overlap * 10 + completeness(card) + (card.result.present ? 2 : 0);
}

function scoreAdCard(question: AdQuestion, card: StarCard): number {
  let overlap = 0;
  for (const topic of question.topics) {
    if (card.topics.includes(topic)) overlap += 1;
  }
  if (overlap === 0) return -1;
  return overlap * 10 + completeness(card) + (card.result.present ? 2 : 0);
}

export function mapQuestionsToStories(bank: StoryBank): PreparedQuestion[] {
  const prepared = TEMPLATE_QUESTIONS.map((question, catalogIndex) => {
    const ranked = bank.cards
      .map((card, cardIndex) => ({ card, cardIndex, score: scoreCard(question, card) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.card.sourceLine - b.card.sourceLine || a.cardIndex - b.cardIndex)
      .slice(0, MAX_CARDS_PER_QUESTION);

    return {
      catalogIndex,
      best: ranked[0]?.score ?? -1,
      prepared: { question, cards: ranked.map((entry) => entry.card) }
    };
  });

  return prepared
    .sort((a, b) => {
      const aHas = a.best >= 0 ? 1 : 0;
      const bHas = b.best >= 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      if (aHas === 1 && a.best !== b.best) return b.best - a.best;
      return a.catalogIndex - b.catalogIndex;
    })
    .map((entry) => entry.prepared);
}

export function mapAdQuestionsToStories(bank: StoryBank, questions: readonly AdQuestion[]): PreparedAdQuestion[] {
  const prepared = questions.map((question, index) => {
    const ranked = bank.cards
      .map((card, cardIndex) => ({ card, cardIndex, score: scoreAdCard(question, card) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.card.sourceLine - b.card.sourceLine || a.cardIndex - b.cardIndex)
      .slice(0, MAX_CARDS_PER_QUESTION);

    return {
      index,
      best: ranked[0]?.score ?? -1,
      prepared: { question, cards: ranked.map((entry) => entry.card) }
    };
  });

  return prepared
    .sort((a, b) => {
      const aHas = a.best >= 0 ? 1 : 0;
      const bHas = b.best >= 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      if (aHas === 1 && a.best !== b.best) return b.best - a.best;
      return a.index - b.index;
    })
    .map((entry) => entry.prepared);
}

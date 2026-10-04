/**
 * Interview-preparation model. Story cards are derived from the CV's own
 * text by rules only (decision 6: a rule before a model), and every field is
 * either a verbatim excerpt of the document or marked as missing. Nothing is
 * ever filled in from imagination - an empty STAR slot stays empty and says
 * so, the same way the builder treats an empty resume field.
 */

export type StoryTopic =
  | "automation"
  | "testing"
  | "migration"
  | "leadership"
  | "mentoring"
  | "process"
  | "quality"
  | "speed"
  | "cost"
  | "collaboration"
  | "delivery"
  | "incident";

export interface StarField {
  /** Verbatim text from the CV, or "" when the document does not carry it. */
  readonly text: string;
  readonly present: boolean;
}

export interface StarCard {
  /** Deterministic: derived from the source line, stable across runs. */
  readonly id: string;
  readonly sourceLine: number;
  readonly sourceText: string;
  readonly situation: StarField;
  readonly task: StarField;
  readonly action: StarField;
  readonly result: StarField;
  readonly topics: readonly StoryTopic[];
}

export interface SkippedBullet {
  readonly lineIndex: number;
  readonly text: string;
  readonly reason: "too-short" | "no-achievement-signal";
}

export interface StoryBank {
  readonly cards: readonly StarCard[];
  readonly skipped: readonly SkippedBullet[];
}

export type QuestionCategory = "behavioural" | "situational" | "technical" | "motivation";

export interface TemplateQuestion {
  /** Stable id; the interface catalog translates by this key. */
  readonly id: string;
  /** Engine wording, English, like every other sentence the engine owns. */
  readonly text: string;
  readonly category: QuestionCategory;
  readonly topics: readonly StoryTopic[];
}

export interface PreparedQuestion {
  readonly question: TemplateQuestion;
  /** Ranked matches, best first. Empty is an honest answer, never padded. */
  readonly cards: readonly StarCard[];
}

export interface AdQuestion {
  readonly id: string;
  readonly text: string;
  readonly citedTerm: string;
  readonly category: QuestionCategory;
  readonly topics: readonly StoryTopic[];
}

export interface PreparedAdQuestion {
  readonly question: AdQuestion;
  readonly cards: readonly StarCard[];
}

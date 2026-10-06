import type { AppLocale } from "@/i18n/routing";

export interface HelpAnswerText {
  readonly kind: "text";
  readonly text: string;
  readonly href?: string;
}

export interface HelpAnswerNone {
  readonly kind: "none";
}

export type HelpAnswer = HelpAnswerText | HelpAnswerNone;

export interface HelpAnswerer {
  answer(question: string, signal?: AbortSignal): Promise<HelpAnswer>;
}

export interface HelpEntry {
  readonly id: string;
  readonly keywords: Readonly<Record<AppLocale, readonly string[]>>;
  readonly answerKey: string;
  readonly href?: string;
}

export type HelpResolver = (key: string) => string;

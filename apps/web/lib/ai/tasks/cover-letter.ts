import { isGrounded } from "@/lib/ai/grounding";

import type { ChatMessage, JsonSchema, LLMProvider } from "../providers/types";
import { SchemaViolationError } from "../schema";

/**
 * Cover letter drafting under D.4's guardrails, which matter more here than
 * anywhere else in the product: a letter is prose, and prose is where a model
 * reaches for the flattering sentence nobody can back up. Every paragraph is
 * grounded against the CV before it is shown, and one that is not is dropped
 * rather than repaired.
 *
 * The employer's name is the single exception, and it is not an exception to
 * the rule but a reading of it: the name is a fact of the vacancy, so the
 * vacancy is allowed to supply it. Numbers and technologies stay bound to the
 * CV, because those are claims about the candidate.
 */

export interface CoverLetterDraft {
  readonly paragraphs: readonly string[];
  /** Paragraphs the grounding check refused. Shown, never hidden. */
  readonly dropped: number;
}

export interface CoverLetterInput {
  readonly cvText: string;
  readonly jobAd: string;
  /** Vacancy terms the CV has evidence for: the letter's whole vocabulary. */
  readonly matchedTerms: readonly string[];
  /** Vacancy terms the CV lacks. Passed only so grounding can catch them. */
  readonly missingTerms: readonly string[];
}

const COVER_LETTER_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    paragraphs: {
      type: "array",
      items: {
        type: "string",
        description: "One paragraph of the letter, built only from facts in the CV."
      }
    }
  },
  required: ["paragraphs"]
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateCoverLetterPayload(payload: unknown): string[] | null {
  if (!isRecord(payload)) return null;
  const paragraphs = payload.paragraphs;
  if (!Array.isArray(paragraphs)) return null;

  const parsed: string[] = [];
  for (const entry of paragraphs) {
    if (typeof entry !== "string") return null;
    const trimmed = entry.trim();
    if (trimmed.length === 0) continue;
    parsed.push(trimmed);
  }
  return parsed;
}

function systemPrompt(): ChatMessage {
  return {
    role: "system",
    content: [
      "You draft a cover letter from a CV and a vacancy.",
      "Use ONLY facts the CV states. No new employers, tools, dates, durations, numbers or achievements.",
      "Never claim a skill the CV does not evidence, however well the vacancy asks for it.",
      "Where a result would belong but the CV does not give one, write [quantify: what is missing] and leave it.",
      "Name the employer only as the vacancy names them. Three or four short paragraphs.",
      "Write in the language of the CV. Return JSON matching the schema."
    ].join(" ")
  };
}

export async function draftCoverLetter(
  model: LLMProvider,
  input: CoverLetterInput,
  signal?: AbortSignal
): Promise<CoverLetterDraft> {
  const { cvText, jobAd, matchedTerms, missingTerms } = input;
  if (cvText.trim().length === 0 || jobAd.trim().length === 0) {
    return { paragraphs: [], dropped: 0 };
  }

  const messages: ChatMessage[] = [
    systemPrompt(),
    {
      role: "user",
      content: [
        "CV:",
        cvText,
        "",
        "VACANCY:",
        jobAd,
        "",
        `TERMS THE CV HAS EVIDENCE FOR: ${matchedTerms.join(", ") || "none"}`,
        `TERMS THE CV LACKS (never claim these): ${missingTerms.join(", ") || "none"}`
      ].join("\n")
    }
  ];

  let paragraphs: string[] | null = null;
  let violation: SchemaViolationError | null = null;
  // One retry, then a rejection the caller can show the user as-is: the same
  // contract every other task in this directory keeps.
  for (let attempt = 0; attempt < 2 && paragraphs === null; attempt += 1) {
    try {
      paragraphs = validateCoverLetterPayload(
        await model.structured<unknown>(COVER_LETTER_SCHEMA, messages, signal ? { signal } : {})
      );
      if (paragraphs === null) {
        violation = new SchemaViolationError([
          { path: "paragraphs", message: "expected an array of strings" }
        ]);
      }
    } catch (error) {
      if (!(error instanceof SchemaViolationError)) throw error;
      violation = error;
    }
  }
  if (paragraphs === null) {
    throw violation ?? new SchemaViolationError([]);
  }

  // Matched and missing terms both go in: a paragraph naming a missing skill
  // fails grounding against the CV, which is the point of listing them.
  const vocabulary = [...matchedTerms, ...missingTerms];
  const kept = paragraphs.filter(
    (paragraph) => isGrounded(cvText, paragraph, vocabulary, { namesAlsoFrom: jobAd }).grounded
  );

  return { paragraphs: kept, dropped: paragraphs.length - kept.length };
}

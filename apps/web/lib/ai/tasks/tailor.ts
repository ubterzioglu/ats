import { isGrounded } from "@/lib/ai/grounding";

import type { ChatMessage, JsonSchema, LLMProvider } from "../providers/types";
import { SchemaViolationError } from "../schema";

/**
 * Tailoring suggestions for one vacancy. The hard rule is the product's
 * honesty contract: a suggestion may only surface evidence the CV already
 * contains. Missing skills are shown to the model purely as context for
 * emphasis - every proposal is grounded against the CV text with the matched
 * terms as the only allowed technology vocabulary, so a suggestion that
 * smuggles in a missing skill is dropped.
 */

export interface TailorSuggestion {
  readonly term: string;
  readonly evidence: string;
  readonly suggestion: string;
}

const TAILOR_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string", description: "A vacancy term the CV already has evidence for." },
          evidence: { type: "string", description: "The CV line that proves it, quoted verbatim." },
          suggestion: {
            type: "string",
            description:
              "One concrete edit that makes this evidence more visible to the vacancy. No new facts."
          }
        },
        required: ["term", "evidence", "suggestion"]
      }
    }
  },
  required: ["suggestions"]
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateTailorPayload(payload: unknown): TailorSuggestion[] | null {
  if (!isRecord(payload)) return null;
  const suggestions = payload.suggestions;
  if (!Array.isArray(suggestions)) return null;

  const parsed: TailorSuggestion[] = [];
  for (const entry of suggestions) {
    if (!isRecord(entry)) return null;
    if (
      typeof entry.term !== "string" ||
      typeof entry.evidence !== "string" ||
      typeof entry.suggestion !== "string"
    ) {
      return null;
    }
    if (entry.term.trim().length === 0 || entry.suggestion.trim().length === 0) continue;
    parsed.push({
      term: entry.term.trim(),
      evidence: entry.evidence.trim(),
      suggestion: entry.suggestion.trim()
    });
  }
  return parsed;
}

export async function suggestTailoring(
  model: LLMProvider,
  cvText: string,
  matchedTerms: readonly string[],
  missingTerms: readonly string[],
  signal?: AbortSignal
): Promise<TailorSuggestion[]> {
  if (matchedTerms.length === 0) return [];

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You suggest how to tailor an existing CV to one vacancy.",
        "Suggest ONLY changes that make evidence already present in the CV more visible.",
        "Never suggest claiming, learning or listing a skill the CV does not evidence - missing terms are context for emphasis, nothing else.",
        "Quote the evidence line verbatim. No new numbers, tools or employers.",
        "Write in the language of the CV. Return JSON matching the schema."
      ].join(" ")
    },
    {
      role: "user",
      content: [
        "CV:",
        cvText,
        "",
        `VACANCY TERMS THE CV HAS EVIDENCE FOR: ${matchedTerms.join(", ")}`,
        `VACANCY TERMS THE CV LACKS (context only, never suggest adding them): ${
          missingTerms.join(", ") || "none"
        }`
      ].join("\n")
    }
  ];

  let payload: TailorSuggestion[] | null = null;
  let violation: SchemaViolationError | null = null;
  for (let attempt = 0; attempt < 2 && payload === null; attempt += 1) {
    try {
      payload = validateTailorPayload(
        await model.structured<unknown>(TAILOR_SCHEMA, messages, signal ? { signal } : {})
      );
      if (payload === null) {
        violation = new SchemaViolationError([
          { path: "suggestions", message: "expected an array of {term, evidence, suggestion}" }
        ]);
      }
    } catch (error) {
      if (!(error instanceof SchemaViolationError)) throw error;
      violation = error;
    }
  }
  if (payload === null) {
    throw violation ?? new SchemaViolationError([]);
  }

  return payload.filter((entry) => {
    // The suggestion may only use vocabulary the CV already contains. The
    // checked list spans matched AND missing terms, so a proposal that names
    // a missing skill fails grounding even though it was never allowed in.
    return isGrounded(cvText, `${entry.evidence} ${entry.suggestion}`, [
      ...matchedTerms,
      ...missingTerms
    ]).grounded;
  });
}

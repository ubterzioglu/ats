import type { KeywordTerm } from "@/types/analysis";
import type { AdQuestion, StoryTopic } from "@/types/interview";
import type { ChatMessage, JsonSchema, LLMProvider } from "../providers/types";
import { SchemaViolationError } from "../schema";

export interface AdQuestionDraft {
  readonly text: string;
  readonly citedTerm: string;
  readonly category: "behavioural" | "situational" | "technical" | "motivation";
  readonly topics: readonly string[];
}

export const AD_QUESTION_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The interview question."
          },
          citedTerm: {
            type: "string",
            description: "The exact term from the job ad that this question targets."
          },
          category: {
            type: "string",
            enum: ["behavioural", "situational", "technical", "motivation"]
          },
          topics: {
            type: "array",
            items: { type: "string" },
            description: "A few topics this question covers (e.g., process, testing, collaboration)."
          }
        },
        required: ["text", "citedTerm", "category", "topics"]
      }
    }
  },
  required: ["questions"]
};

function systemPrompt(): ChatMessage {
  return {
    role: "system",
    content: [
      "You generate interview questions based on job ad requirements.",
      "For the most critical terms in the ad, generate a specific, challenging interview question.",
      "Each question MUST cite the exact term it tests in 'citedTerm'.",
      "Do not generate generic questions. Make them highly specific to the cited term.",
      "Return JSON matching the schema."
    ].join(" ")
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateAdQuestionsPayload(payload: unknown): AdQuestionDraft[] | null {
  if (!isRecord(payload)) return null;
  const questions = payload.questions;
  if (!Array.isArray(questions)) return null;

  const drafts: AdQuestionDraft[] = [];
  for (const entry of questions) {
    if (!isRecord(entry)) return null;
    if (
      typeof entry.text !== "string" ||
      typeof entry.citedTerm !== "string" ||
      typeof entry.category !== "string"
    ) {
      return null;
    }
    if (!Array.isArray(entry.topics) || !entry.topics.every((t) => typeof t === "string")) {
      return null;
    }
    const cat = entry.category as "behavioural" | "situational" | "technical" | "motivation";
    drafts.push({
      text: entry.text,
      citedTerm: entry.citedTerm,
      category: cat,
      topics: entry.topics as string[]
    });
  }
  return drafts;
}

export async function generateAdQuestions(
  model: LLMProvider,
  terms: readonly KeywordTerm[],
  signal?: AbortSignal
): Promise<AdQuestion[]> {
  if (terms.length === 0) return [];

  const topTerms = terms.slice(0, 15).map(t => t.term);

  const messages: ChatMessage[] = [
    systemPrompt(),
    {
      role: "user",
      content: `JOB AD TERMS:\n${topTerms.join(", ")}`
    }
  ];

  let drafts: AdQuestionDraft[] | null = null;
  let violation: SchemaViolationError | null = null;

  for (let attempt = 0; attempt < 2 && drafts === null; attempt += 1) {
    try {
      const payload = await model.structured<unknown>(
        AD_QUESTION_SCHEMA,
        messages,
        signal ? { signal } : {}
      );
      drafts = validateAdQuestionsPayload(payload);
      if (drafts === null) {
        violation = new SchemaViolationError([
          { path: "questions", message: "expected an array of valid question objects" }
        ]);
      }
    } catch (error) {
      if (!(error instanceof SchemaViolationError)) throw error;
      violation = error;
    }
  }

  if (drafts === null) {
    throw violation ?? new SchemaViolationError([]);
  }

  // Acceptance: "üretilen her soru ilandan bir terim ALINTILAYACAK. Alıntısı olmayan soru gösterilmez."
  // Filter out any generated questions whose citedTerm does not actually appear in the input terms
  const validTermsLower = new Set(topTerms.map(t => t.toLowerCase()));
  
  return drafts
    .filter(q => validTermsLower.has(q.citedTerm.trim().toLowerCase()))
    .map((draft, idx) => ({
      id: `ad-q-${idx}-${crypto.randomUUID()}`,
      text: draft.text,
      citedTerm: draft.citedTerm,
      category: draft.category,
      topics: draft.topics as StoryTopic[]
    }));
}

import type { Finding } from "@/types/analysis";

import type { ChatMessage, JsonSchema, LLMProvider } from "../providers/types";

/**
 * Explaining a finding gets the smallest context that can do the job: the
 * finding itself and its evidence lines. No CV, no ad, no history - a model
 * that cannot see the document cannot leak or invent from it.
 */

export interface FindingExplanation {
  readonly why: string;
  readonly nextStep: string;
}

const EXPLAIN_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    why: {
      type: "string",
      description: "Why an ATS or a recruiter penalises this, in two plain sentences."
    },
    nextStep: {
      type: "string",
      description: "The single most valuable concrete edit, in one sentence."
    }
  },
  required: ["why", "nextStep"]
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateExplanation(payload: unknown): FindingExplanation | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.why !== "string" || typeof payload.nextStep !== "string") return null;
  if (payload.why.trim().length === 0 || payload.nextStep.trim().length === 0) return null;
  return { why: payload.why.trim(), nextStep: payload.nextStep.trim() };
}

export async function explainFinding(
  model: LLMProvider,
  finding: Finding,
  signal?: AbortSignal
): Promise<FindingExplanation> {
  const evidence = (finding.evidence ?? []).slice(0, 5);
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You explain CV analysis findings in plain language.",
        "Answer ONLY from the FINDING given to you. Invent no facts about the candidate.",
        "Write in the language of the finding text.",
        "Return JSON matching the schema."
      ].join(" ")
    },
    {
      role: "user",
      content: `FINDING:\nid: ${finding.id}\nseverity: ${finding.severity}\ncost: ${finding.cost}\ntitle: ${finding.title}\ndetail: ${finding.detail}\nfix: ${finding.fix}${
        evidence.length > 0 ? `\nevidence:\n${evidence.map((line) => `- ${line}`).join("\n")}` : ""
      }`
    }
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const payload = await model.structured<unknown>(
      EXPLAIN_SCHEMA,
      messages,
      signal ? { signal } : {}
    );
    const explanation = validateExplanation(payload);
    if (explanation) return explanation;
  }
  throw new Error("The model could not explain this finding.");
}

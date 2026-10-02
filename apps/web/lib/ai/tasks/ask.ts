import type { AnalysisResult } from "@/types/analysis";

import type { ChatMessage, JsonSchema, TextModel } from "../providers/types";

/**
 * Question answering over the report. The model receives the serialized
 * report - scores, findings, term lists - and is instructed to answer from
 * that and nothing else. The CV itself is not in scope: the report already
 * quotes what any answer needs, and a smaller context is a smaller leak
 * surface.
 */

export interface AskTurn {
  readonly role: "user" | "assistant";
  readonly content: string;
}

const ANSWER_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description:
        "The answer, grounded only in the REPORT. If the report does not contain it, say that plainly."
    }
  },
  required: ["answer"]
};

export function serializeReport(result: AnalysisResult): string {
  const dimensions = result.dimensions
    .map((dimension) => `- ${dimension.label}: ${dimension.score}/${dimension.max} (${dimension.summary})`)
    .join("\n");
  const findings = result.findings
    .map(
      (finding) =>
        `- [${finding.id}] (${finding.severity}, -${finding.cost}) ${finding.title} ${finding.detail} Fix: ${finding.fix}`
    )
    .join("\n");
  const matched = result.keywords.matched.map((term) => term.term).join(", ");
  const missing = result.keywords.missing.map((term) => term.term).join(", ");

  return [
    `Total: ${result.total}/100 (${result.bandLabel}). Language: ${result.language}.`,
    `Dimensions:\n${dimensions}`,
    `Findings:\n${findings || "- none"}`,
    `Keyword source: ${result.keywords.source}, coverage: ${Math.round(result.keywords.coverage * 100)}%.`,
    `Matched terms: ${matched || "none"}`,
    missing ? `Missing terms: ${missing}` : null,
    `Stats: ${result.stats.words} words, ${result.stats.lines} lines, ${result.stats.experienceMonths} months of merged employment.`
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function askAboutReport(
  model: TextModel,
  result: AnalysisResult,
  question: string,
  history: readonly AskTurn[] = [],
  signal?: AbortSignal
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You answer questions about a CV analysis report.",
        "Answer ONLY from the REPORT below. If the report does not contain the answer, say so plainly instead of guessing.",
        "Never invent findings, numbers or advice beyond what the report states.",
        "Answer in the language of the question, in at most four sentences."
      ].join(" ")
    },
    { role: "user", content: `REPORT:\n${serializeReport(result)}` },
    ...history.slice(-6).map((turn): ChatMessage => ({ role: turn.role, content: turn.content })),
    { role: "user", content: question }
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const payload = await model.generateJson<unknown>(ANSWER_SCHEMA, messages, signal);
    if (isRecord(payload) && typeof payload.answer === "string" && payload.answer.trim().length > 0) {
      return payload.answer.trim();
    }
  }
  throw new Error("The model could not answer from the report.");
}

import { isGrounded } from "@/lib/ai/grounding";

import type { ChatMessage, JsonSchema, LLMProvider } from "../providers/types";
import { SchemaViolationError } from "../schema";

/**
 * Bullet rewriting. The model restates weak bullets as claims; the grounding
 * check then enforces the only rule that matters: a rewrite may not contain a
 * number or a technology the source bullet does not contain, unless it is
 * parked in a [quantify: ...] placeholder. Ungrounded output is dropped, not
 * repaired - a sentence that invents facts never reaches the screen.
 */

export interface RewritePair {
  readonly original: string;
  readonly rewritten: string;
}

const WEAK_BULLET_RX =
  /(responsible for|worked on|worked in|involved in|assisted with|helped with|duties included|tasks included|familiar with|exposed to|tasked with|in order to|verantwortlich für|verantwortlich fur|mitgewirkt|beteiligt an|unterstützung bei|sorumluydum|sorumlu|görev aldım|gorev aldim|destek verdim)/i;

const BULLET_PREFIX_RX = /^(\s*(?:[-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+)/;

export interface WeakBullet {
  readonly lineIndex: number;
  readonly prefix: string;
  readonly content: string;
}

/** Picks the bullets worth rewriting, keeping line positions for a safe swap. */
export function selectWeakBullets(cvText: string): WeakBullet[] {
  const picked: WeakBullet[] = [];
  cvText.split("\n").forEach((line, lineIndex) => {
    const prefix = line.match(BULLET_PREFIX_RX)?.[0] ?? "";
    const content = line.slice(prefix.length).trim();
    if (content.split(/\s+/).length < 4) return;
    if (!WEAK_BULLET_RX.test(content)) return;
    picked.push({ lineIndex, prefix, content });
  });
  return picked;
}

export const REWRITE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    rewrites: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string", description: "The source bullet, verbatim." },
          rewritten: {
            type: "string",
            description:
              "The bullet restated as a claim. Same facts only; unknown outcomes stay as [quantify: ...]."
          }
        },
        required: ["original", "rewritten"]
      }
    }
  },
  required: ["rewrites"]
};

function systemPrompt(): ChatMessage {
  return {
    role: "system",
    content: [
      "You rewrite CV bullets.",
      "Use ONLY facts present in the SOURCE bullet: no new tools, technologies, employers, dates, durations or numbers.",
      "When an outcome or scale is missing, keep the sentence honest with a [quantify: what is missing] placeholder.",
      "Start with a strong past-tense verb. Keep the language of the source bullet.",
      "Return JSON matching the schema; echo each source bullet verbatim in 'original'."
    ].join(" ")
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Structural validation - the project does not carry zod for one shape. */
export function validateRewritePayload(payload: unknown): RewritePair[] | null {
  if (!isRecord(payload)) return null;
  const rewrites = payload.rewrites;
  if (!Array.isArray(rewrites)) return null;

  const pairs: RewritePair[] = [];
  for (const entry of rewrites) {
    if (!isRecord(entry)) return null;
    if (typeof entry.original !== "string" || typeof entry.rewritten !== "string") return null;
    pairs.push({ original: entry.original, rewritten: entry.rewritten });
  }
  return pairs;
}

export async function rewriteBullets(
  model: LLMProvider,
  bullets: readonly WeakBullet[],
  knownSkills: readonly string[],
  signal?: AbortSignal
): Promise<RewritePair[]> {
  if (bullets.length === 0) return [];

  const sources = bullets.map((bullet) => bullet.content);
  const messages: ChatMessage[] = [
    systemPrompt(),
    {
      role: "user",
      content: `SOURCE:\n${sources.map((line) => `- ${line}`).join("\n")}`
    }
  ];

  let pairs: RewritePair[] | null = null;
  let violation: SchemaViolationError | null = null;
  // One retry at temperature 0: if the shape is wrong twice, the tier cannot
  // do this job and the caller gets a rejection it can show the user as-is.
  for (let attempt = 0; attempt < 2 && pairs === null; attempt += 1) {
    try {
      const payload = await model.structured<unknown>(
        REWRITE_SCHEMA,
        messages,
        signal ? { signal } : {}
      );
      pairs = validateRewritePayload(payload);
      if (pairs === null) {
        violation = new SchemaViolationError([
          { path: "rewrites", message: "expected an array of {original, rewritten} string pairs" }
        ]);
      }
    } catch (error) {
      if (!(error instanceof SchemaViolationError)) throw error;
      violation = error;
    }
  }
  if (pairs === null) {
    throw violation ?? new SchemaViolationError([]);
  }

  const sourceByText = new Map(sources.map((source) => [normalize(source), source]));
  const grounded: RewritePair[] = [];
  for (const pair of pairs) {
    const source = sourceByText.get(normalize(pair.original));
    if (source === undefined) continue;
    if (pair.rewritten.trim().length === 0) continue;
    if (!isGrounded(source, pair.rewritten, knownSkills).grounded) continue;
    grounded.push({ original: source, rewritten: pair.rewritten.trim() });
  }
  return grounded;
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Swaps one bullet's content, keeping its marker and line position. */
export function applyRewrite(cvText: string, bullet: WeakBullet, rewritten: string): string | null {
  const lines = cvText.split("\n");
  const line = lines[bullet.lineIndex];
  if (line === undefined) return null;
  if (line.slice(bullet.prefix.length).trim() !== bullet.content) return null;
  lines[bullet.lineIndex] = `${bullet.prefix}${rewritten}`;
  return lines.join("\n");
}

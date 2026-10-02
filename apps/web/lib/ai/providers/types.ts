/**
 * The contract every text-model provider implements. Providers are browser-
 * side and advisory: nothing they return may reach lib/scoring, and every
 * result is grounded (lib/ai/grounding.ts) before it is shown.
 */

export interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

/**
 * A structural JSON schema subset: objects, arrays, strings, numbers,
 * booleans, enums and required lists. Providers pass it to whatever
 * constrained-decoding mechanism they have, or validate after the fact.
 */
export interface JsonSchema {
  readonly type: "object" | "array" | "string" | "number" | "boolean";
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly items?: JsonSchema;
  readonly required?: readonly string[];
  readonly enum?: readonly string[];
  readonly description?: string;
}

export interface TextModel {
  readonly id: string;
  readonly label: string;
  generateJson<T>(
    schema: JsonSchema,
    messages: readonly ChatMessage[],
    signal?: AbortSignal
  ): Promise<T>;
}

export type ModelTier = "none" | "builtin" | "webllm" | "ollama";

export interface TierStatus {
  readonly tier: ModelTier;
  readonly label: string;
  readonly available: boolean;
  /** Approximate download size in MB when the tier needs one. */
  readonly sizeMb?: number;
  readonly detail: string;
}

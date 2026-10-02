/**
 * The contract every text-model provider implements. Providers are browser-
 * side and advisory: nothing they return may reach lib/scoring, and every
 * result is grounded (lib/ai/grounding.ts) before it is shown.
 */

export interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface ChatOptions {
  readonly signal?: AbortSignal;
}

export interface ProviderHealth {
  readonly ok: boolean;
  /** One plain sentence for the UI: what is ready, or what is missing. */
  readonly detail: string;
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

/**
 * A text-model provider (L.1). Swapping one implementation for another is a
 * tier choice in the UI and must be unobservable everywhere else: tasks
 * depend on this interface alone, and the scoring engine never learns a
 * provider exists.
 *
 * structured() resolves with parsed JSON conforming to the schema or throws;
 * a malformed payload never escapes a provider (L.4). chat() is the plain-text
 * completion the structured path is built on. health() is a cheap probe that
 * answers whether the provider can serve requests right now, with a detail
 * sentence the tier bar can show verbatim.
 */
export interface LLMProvider {
  readonly id: string;
  readonly label: string;
  health(options?: ChatOptions): Promise<ProviderHealth>;
  chat(messages: readonly ChatMessage[], options?: ChatOptions): Promise<string>;
  structured<T>(
    schema: JsonSchema,
    messages: readonly ChatMessage[],
    options?: ChatOptions
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

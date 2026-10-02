import { parseStructuredPayload } from "../schema";
import type { ChatMessage, ChatOptions, JsonSchema, LLMProvider, ProviderHealth } from "./types";

/**
 * Ollama provider. Opt-in by design: the page never touches localhost
 * until the user picks this tier, and the pick itself runs the 500 ms
 * probe in detect.ts. Structured output rides Ollama's native `format`
 * field, which accepts a JSON schema directly.
 *
 * Setup note shown in the UI: Ollama must be started with
 * OLLAMA_ORIGINS including this site's origin, or the browser request is
 * rejected by its CORS guard.
 */

export const OLLAMA_ORIGIN = "http://localhost:11434";
export const OLLAMA_DEFAULT_MODEL = "qwen2.5:3b";

interface OllamaChatResponse {
  readonly message?: { readonly content?: string };
  readonly error?: string;
}

interface OllamaTagsResponse {
  readonly models?: readonly { readonly name?: string }[];
  readonly error?: string;
}

class OllamaProvider implements LLMProvider {
  readonly id = "ollama";
  readonly label: string;

  constructor(private readonly model: string = OLLAMA_DEFAULT_MODEL) {
    this.label = `Ollama (${model}, localhost)`;
  }

  async health(options?: ChatOptions): Promise<ProviderHealth> {
    let payload: OllamaTagsResponse;
    try {
      const response = await fetch(`${OLLAMA_ORIGIN}/api/tags`, fetchInit(options));
      if (!response.ok) {
        return {
          ok: false,
          detail: `Ollama answered ${response.status} on localhost:11434.`
        };
      }
      payload = (await response.json()) as OllamaTagsResponse;
    } catch {
      return {
        ok: false,
        detail:
          "Ollama did not answer. Is it running, started with OLLAMA_ORIGINS covering this site, and is the model pulled?"
      };
    }

    const names = (payload.models ?? [])
      .map((entry) => entry.name)
      .filter((name): name is string => typeof name === "string");
    const pulled = names.some((name) => name === this.model || name.startsWith(`${this.model}:`));
    if (!pulled) {
      return {
        ok: false,
        detail: `Ollama is running but the model is not pulled. Try: ollama pull ${this.model}`
      };
    }
    return { ok: true, detail: `${this.model} is ready on localhost.` };
  }

  async chat(messages: readonly ChatMessage[], options?: ChatOptions): Promise<string> {
    return this.request(messages, undefined, options);
  }

  async structured<T>(
    schema: JsonSchema,
    messages: readonly ChatMessage[],
    options?: ChatOptions
  ): Promise<T> {
    const content = await this.request(messages, schema, options);
    return parseStructuredPayload<T>(content, schema);
  }

  private async request(
    messages: readonly ChatMessage[],
    schema: JsonSchema | undefined,
    options?: ChatOptions
  ): Promise<string> {
    let response: Response;
    try {
      response = await fetch(
        `${OLLAMA_ORIGIN}/api/chat`,
        fetchInit(options, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            stream: false,
            ...(schema ? { format: schema } : {}),
            options: { temperature: 0 },
            messages: messages.map((entry) => ({ role: entry.role, content: entry.content }))
          })
        })
      );
    } catch {
      throw new Error(
        "Ollama did not answer. Is it running, started with OLLAMA_ORIGINS covering this site, and is the model pulled?"
      );
    }

    if (!response.ok) {
      throw new Error(`Ollama answered ${response.status}. Try: ollama pull ${this.model}`);
    }

    const payload = (await response.json()) as OllamaChatResponse;
    if (payload.error) {
      throw new Error(`Ollama: ${payload.error}`);
    }
    return payload.message?.content ?? "";
  }
}

function fetchInit(options?: ChatOptions, init?: RequestInit): RequestInit {
  return { ...init, ...(options?.signal ? { signal: options.signal } : {}) };
}

export function createOllamaProvider(model?: string): LLMProvider {
  return new OllamaProvider(model);
}

/** Lists the models the local server has, for the tier bar's picker. */
export async function listOllamaModels(signal?: AbortSignal): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_ORIGIN}/api/tags`, { ...(signal ? { signal } : {}) });
    if (!response.ok) return [];
    const payload = (await response.json()) as OllamaTagsResponse;
    return (payload.models ?? [])
      .map((entry) => entry.name)
      .filter((name): name is string => typeof name === "string");
  } catch {
    return [];
  }
}

import type { ChatMessage, JsonSchema, TextModel } from "./types";

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

class OllamaModel implements TextModel {
  readonly id = "ollama";
  readonly label: string;

  constructor(private readonly model: string = OLLAMA_DEFAULT_MODEL) {
    this.label = `Ollama (${model}, localhost)`;
  }

  async generateJson<T>(
    schema: JsonSchema,
    messages: readonly ChatMessage[],
    signal?: AbortSignal
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${OLLAMA_ORIGIN}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: schema,
          options: { temperature: 0 },
          messages: messages.map((entry) => ({ role: entry.role, content: entry.content }))
        }),
        ...(signal ? { signal } : {})
      });
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

    const content = payload.message?.content ?? "";
    try {
      return JSON.parse(content) as T;
    } catch {
      throw new Error("Ollama returned something that is not JSON.");
    }
  }
}

export function createOllamaModel(model?: string): TextModel {
  return new OllamaModel(model);
}

/** Lists the models the local server has, for the tier bar's picker. */
export async function listOllamaModels(signal?: AbortSignal): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_ORIGIN}/api/tags`, { ...(signal ? { signal } : {}) });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      models?: readonly { name?: string }[];
    };
    return (payload.models ?? [])
      .map((entry) => entry.name)
      .filter((name): name is string => typeof name === "string");
  } catch {
    return [];
  }
}

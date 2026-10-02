import type { ChatMessage, JsonSchema, TextModel } from "./types";

/**
 * Chrome/Edge built-in provider (Gemini Nano, Prompt API). Runs on the
 * device, no download the user has to manage, but English and German only -
 * which is why the tier bar says so and Turkish requests must fall through
 * to WebLLM or Ollama.
 */

export const BUILTIN_LANGUAGES = ["en", "de"] as const;

interface BuiltinSession {
  prompt(
    messages: readonly { role: string; content: string }[],
    options?: { responseConstraint?: unknown; signal?: AbortSignal }
  ): Promise<string>;
  destroy(): void;
}

interface BuiltinLanguageModel {
  availability(): Promise<string>;
  create(options?: {
    initialPrompts?: readonly { role: string; content: string }[];
    signal?: AbortSignal;
  }): Promise<BuiltinSession>;
}

declare global {
  interface Window {
    LanguageModel?: BuiltinLanguageModel;
  }
}

function languageModel(): BuiltinLanguageModel | null {
  return typeof window === "undefined" ? null : (window.LanguageModel ?? null);
}

export async function builtinAvailability(): Promise<string> {
  const model = languageModel();
  if (!model) return "not-supported";
  return model.availability();
}

class BuiltinModel implements TextModel {
  readonly id = "builtin";
  readonly label = "Browser built-in (Gemini Nano)";

  private session: BuiltinSession | null = null;
  private sessionKey: string | null = null;

  async generateJson<T>(
    schema: JsonSchema,
    messages: readonly ChatMessage[],
    signal?: AbortSignal
  ): Promise<T> {
    const model = languageModel();
    if (!model) throw new Error("This browser has no built-in model.");

    const availability = await model.availability();
    if (availability !== "available") {
      throw new Error(`The built-in model is not ready (status: ${availability}).`);
    }

    // The system prompt is baked into the session; recreating only when it
    // changes keeps repeated calls cheap.
    const system = messages.filter((message) => message.role === "system");
    const key = system.map((message) => message.content).join("\n");
    if (!this.session || this.sessionKey !== key) {
      this.session?.destroy();
      this.session = await model.create({
        ...(system.length > 0 ? { initialPrompts: system } : {}),
        ...(signal ? { signal } : {})
      });
      this.sessionKey = key;
    }

    const rest = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));

    const raw = await this.session.prompt(rest, {
      responseConstraint: schema,
      ...(signal ? { signal } : {})
    });

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error("The built-in model returned something that is not JSON.");
    }
  }
}

export function createBuiltinModel(): TextModel {
  return new BuiltinModel();
}

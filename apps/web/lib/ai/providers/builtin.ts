import { parseStructuredPayload } from "../schema";
import type { ChatMessage, ChatOptions, JsonSchema, LLMProvider, ProviderHealth } from "./types";

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

class BuiltinProvider implements LLMProvider {
  readonly id = "builtin";
  readonly label = "Browser built-in (Gemini Nano)";

  private session: BuiltinSession | null = null;
  private sessionKey: string | null = null;

  async health(): Promise<ProviderHealth> {
    const model = languageModel();
    if (!model) {
      return { ok: false, detail: "This browser has no built-in model." };
    }
    const availability = await model.availability();
    if (availability === "available") {
      return { ok: true, detail: "The built-in model is ready." };
    }
    if (availability.startsWith("downloading")) {
      return { ok: false, detail: "The built-in model is still downloading." };
    }
    if (availability === "downloadable") {
      return { ok: false, detail: "The built-in model has to be downloaded first." };
    }
    return { ok: false, detail: `The built-in model is not ready (status: ${availability}).` };
  }

  async chat(messages: readonly ChatMessage[], options?: ChatOptions): Promise<string> {
    const session = await this.ensureSession(messages, options);
    return session.prompt(toPrompt(messages), promptOptions(options));
  }

  async structured<T>(
    schema: JsonSchema,
    messages: readonly ChatMessage[],
    options?: ChatOptions
  ): Promise<T> {
    const session = await this.ensureSession(messages, options);
    const raw = await session.prompt(toPrompt(messages), {
      responseConstraint: schema,
      ...promptOptions(options)
    });
    return parseStructuredPayload<T>(raw, schema);
  }

  // The system prompt is baked into the session; recreating only when it
  // changes keeps repeated calls cheap.
  private async ensureSession(
    messages: readonly ChatMessage[],
    options?: ChatOptions
  ): Promise<BuiltinSession> {
    const model = languageModel();
    if (!model) throw new Error("This browser has no built-in model.");

    const availability = await model.availability();
    if (availability !== "available") {
      throw new Error(`The built-in model is not ready (status: ${availability}).`);
    }

    const system = messages.filter((message) => message.role === "system");
    const key = system.map((message) => message.content).join("\n");
    if (!this.session || this.sessionKey !== key) {
      this.session?.destroy();
      this.session = await model.create({
        ...(system.length > 0 ? { initialPrompts: system } : {}),
        ...(options?.signal ? { signal: options.signal } : {})
      });
      this.sessionKey = key;
    }
    return this.session;
  }
}

function toPrompt(
  messages: readonly ChatMessage[]
): readonly { role: string; content: string }[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({ role: message.role, content: message.content }));
}

function promptOptions(options?: ChatOptions): { signal?: AbortSignal } {
  return options?.signal ? { signal: options.signal } : {};
}

export function createBuiltinProvider(): LLMProvider {
  return new BuiltinProvider();
}

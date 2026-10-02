import type { ChatMessage, JsonSchema, LLMProvider, ProviderHealth } from "@/lib/ai/providers/types";
import { parseStructuredPayload } from "@/lib/ai/schema";

/**
 * A scripted LLMProvider for task tests. structured() hands back the payloads
 * in order - the last one repeats, so retry loops stay deterministic - and
 * every call records the messages it saw, so tests can assert the context
 * diet each task keeps.
 */

export interface FakeProvider {
  readonly provider: LLMProvider;
  calls(): number;
  readonly seen: readonly (readonly ChatMessage[])[];
}

export function fakeProvider(responses: readonly unknown[], id = "stub"): FakeProvider {
  let calls = 0;
  const seen: (readonly ChatMessage[])[] = [];

  const next = (): unknown => {
    const response = responses[Math.min(calls, Math.max(responses.length - 1, 0))];
    calls += 1;
    return response;
  };

  return {
    provider: {
      id,
      label: id,
      async health(): Promise<ProviderHealth> {
        return { ok: true, detail: "scripted fake" };
      },
      async chat(messages: readonly ChatMessage[]): Promise<string> {
        seen.push(messages);
        const response = next();
        return typeof response === "string" ? response : JSON.stringify(response);
      },
      async structured<T>(_schema: unknown, messages: readonly ChatMessage[]): Promise<T> {
        seen.push(messages);
        const response = next();
        if (response instanceof Error) throw response;
        return response as T;
      }
    },
    calls: () => calls,
    seen
  };
}

/**
 * A provider scripted with raw answer text that runs the same gate the real
 * providers run: parseStructuredPayload. Use it to test the whole L.4 chain
 * without mocking a transport.
 */
export function rawTextProvider(texts: readonly string[], id = "raw"): FakeProvider {
  let calls = 0;
  const seen: (readonly ChatMessage[])[] = [];

  const nextText = (): string => {
    const text = texts[Math.min(calls, Math.max(texts.length - 1, 0))] ?? "";
    calls += 1;
    return text;
  };

  return {
    provider: {
      id,
      label: id,
      async health(): Promise<ProviderHealth> {
        return { ok: true, detail: "scripted raw text" };
      },
      async chat(messages: readonly ChatMessage[]): Promise<string> {
        seen.push(messages);
        return nextText();
      },
      async structured<T>(
        schema: JsonSchema,
        messages: readonly ChatMessage[]
      ): Promise<T> {
        seen.push(messages);
        return parseStructuredPayload<T>(nextText(), schema);
      }
    },
    calls: () => calls,
    seen
  };
}

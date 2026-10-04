import { parseStructuredPayload } from "../schema";
import type { ChatMessage, ChatOptions, JsonSchema, LLMProvider, ProviderHealth } from "./types";

/**
 * Bring Your Own Key provider.
 * Allows connecting to any OpenAI-compatible endpoint.
 * Requires user consent for EVERY request to ensure privacy guarantees are met.
 */

export interface ByokConfig {
  readonly endpoint: string;
  readonly apiKey: string;
  readonly model: string;
}

export function getByokConfig(): ByokConfig {
  if (typeof window === "undefined") {
    return { endpoint: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" };
  }
  return {
    endpoint: window.localStorage.getItem("byok_endpoint") || "https://api.openai.com/v1",
    apiKey: window.localStorage.getItem("byok_api_key") || "",
    model: window.localStorage.getItem("byok_model") || "gpt-4o-mini"
  };
}

export function setByokConfig(config: ByokConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("byok_endpoint", config.endpoint);
  window.localStorage.setItem("byok_api_key", config.apiKey);
  window.localStorage.setItem("byok_model", config.model);
}

async function requestConsent(endpoint: string, signal?: AbortSignal): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return new Promise((resolve) => {
    const handleAbort = () => resolve(false);
    if (signal) {
      signal.addEventListener("abort", handleAbort);
    }
    
    const event = new CustomEvent("byok-consent-request", {
      detail: {
        endpoint,
        resolve: (approved: boolean) => {
          if (signal) signal.removeEventListener("abort", handleAbort);
          resolve(approved);
        }
      }
    });
    window.dispatchEvent(event);
  });
}

class ByokProvider implements LLMProvider {
  readonly id = "byok";
  readonly label = "External Provider (BYOK)";

  async health(options?: ChatOptions): Promise<ProviderHealth> {
    const config = getByokConfig();
    if (!config.apiKey) {
      return { ok: false, detail: "API key is missing." };
    }
    if (!config.endpoint) {
      return { ok: false, detail: "Endpoint URL is missing." };
    }
    
    // We do not actually send a real request to verify the key unless we ask for consent,
    // but the prompt says "Her istekte uyarı" for requests containing CV data.
    // For health check, we could just say it's configured.
    return { ok: true, detail: `Configured for ${new URL(config.endpoint).hostname} (${config.model})` };
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
    const config = getByokConfig();
    if (!config.apiKey) {
      throw new Error("BYOK configuration is missing API key.");
    }

    const host = new URL(config.endpoint).hostname;
    const approved = await requestConsent(host, options?.signal);
    if (!approved) {
      throw new Error(`User rejected sending data to ${host}`);
    }

    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map((entry) => ({ role: entry.role, content: entry.content })),
        temperature: 0,
        ...(schema ? { 
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "output",
              schema,
              strict: true
            }
          }
        } : {})
      }),
      ...(options?.signal ? { signal: options.signal } : {})
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Provider answered ${response.status}: ${text.slice(0, 100)}`);
    }

    const payload = await response.json();
    return payload.choices?.[0]?.message?.content ?? "";
  }
}

export function createByokProvider(): LLMProvider {
  return new ByokProvider();
}

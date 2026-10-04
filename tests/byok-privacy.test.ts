import { afterEach, describe, expect, it, vi } from "vitest";

import { createByokProvider, setByokConfig } from "@/lib/ai/providers/byok";
import type { ChatMessage } from "@/lib/ai/providers/types";

describe("ByokProvider privacy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const MESSAGES: readonly ChatMessage[] = [
    { role: "user", content: "Analyze my CV: I am an engineer." }
  ];

  it("never leaks the API key into the request body", async () => {
    // 1. Mock window and localStorage
    const mockStorage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => mockStorage.get(key) ?? null,
        setItem: (key: string, value: string) => mockStorage.set(key, value)
      },
      dispatchEvent: vi.fn((event: Event) => {
        if (event.type === "byok-consent-request") {
          // Auto-approve the consent prompt
          const customEvent = event as CustomEvent<{ resolve: (v: boolean) => void }>;
          customEvent.detail.resolve(true);
        }
        return true;
      })
    });

    // 2. Configure BYOK with a fake key
    setByokConfig({
      endpoint: "https://api.openai.com/v1",
      apiKey: "sk-super-secret-key-123",
      model: "gpt-4o-mini"
    });

    // 3. Mock fetch to intercept the payload
    let interceptedBody: string | null = null;
    let interceptedHeaders: Record<string, string> = {};
    
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (init?.body) {
        interceptedBody = String(init.body);
      }
      if (init?.headers) {
        interceptedHeaders = init.headers as Record<string, string>;
      }
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: "OK" } }] })
      };
    });

    // 4. Send request
    const provider = createByokProvider();
    await provider.chat(MESSAGES);

    // 5. Verify constraints
    expect(interceptedBody).not.toBeNull();
    // The key MUST NOT be anywhere in the JSON body.
    expect(interceptedBody).not.toContain("sk-super-secret-key-123");
    
    // The key MUST be in the Authorization header.
    expect(interceptedHeaders["Authorization"]).toBe("Bearer sk-super-secret-key-123");
  });

  it("requires consent before making a request", async () => {
    const mockStorage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => mockStorage.get(key) ?? null,
        setItem: (key: string, value: string) => mockStorage.set(key, value)
      },
      dispatchEvent: vi.fn((event: Event) => {
        if (event.type === "byok-consent-request") {
          // Reject consent
          const customEvent = event as CustomEvent<{ resolve: (v: boolean) => void }>;
          customEvent.detail.resolve(false);
        }
        return true;
      })
    });

    setByokConfig({
      endpoint: "https://api.openai.com/v1",
      apiKey: "sk-secret",
      model: "gpt-4o-mini"
    });

    const provider = createByokProvider();
    await expect(provider.chat(MESSAGES)).rejects.toThrow("User rejected sending data");
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createBuiltinProvider } from "@/lib/ai/providers/builtin";
import { createOllamaProvider, OLLAMA_DEFAULT_MODEL } from "@/lib/ai/providers/ollama";
import type { ChatMessage, JsonSchema } from "@/lib/ai/providers/types";
import { startWebLlm } from "@/lib/ai/providers/webllm";
import { explainFinding } from "@/lib/ai/tasks/explain";
import { rewriteBullets, selectWeakBullets } from "@/lib/ai/tasks/rewrite";
import { analyzeCv } from "@/lib/scoring";
import type { AnalysisResult, Finding } from "@/types/analysis";

import { JOB_AD, STRONG_CV } from "./fixtures";
import { fakeProvider } from "./helpers/fake-provider";

/**
 * L.1 acceptance: swapping the provider changes no scoring behaviour. Two
 * claims are pinned here. The behavioural one: the same task through two
 * different providers yields the same result, and an analysis run before and
 * after any AI work is identical. The structural one: lib/scoring never
 * imports lib/ai, and the provider/task layer never imports lib/scoring -
 * the layer-0 firewall is a fact about the source tree, not a promise.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}

function mockFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>
): void {
  vi.stubGlobal("fetch", handler);
}

const SCHEMA: JsonSchema = {
  type: "object",
  properties: { answer: { type: "string" } },
  required: ["answer"]
};

const MESSAGES: readonly ChatMessage[] = [
  { role: "system", content: "You are terse." },
  { role: "user", content: "Say something." }
];

describe("OllamaProvider", () => {
  it("reports health from the model list", async () => {
    mockFetch(() => jsonResponse({ models: [{ name: `${OLLAMA_DEFAULT_MODEL}` }] }));
    const health = await createOllamaProvider().health();
    expect(health.ok).toBe(true);

    mockFetch(() => jsonResponse({ models: [{ name: "llama3:latest" }] }));
    const missing = await createOllamaProvider().health();
    expect(missing.ok).toBe(false);
    expect(missing.detail).toContain("ollama pull");
  });

  it("reports an unreachable server with the OLLAMA_ORIGINS hint", async () => {
    mockFetch(() => {
      throw new Error("connection refused");
    });
    const health = await createOllamaProvider().health();
    expect(health.ok).toBe(false);
    expect(health.detail).toContain("OLLAMA_ORIGINS");
  });

  it("chats without a format field and structures with one", async () => {
    const bodies: unknown[] = [];
    mockFetch((_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return jsonResponse({ message: { content: '{"answer":"hello"}' } });
    });
    const provider = createOllamaProvider();

    expect(await provider.chat(MESSAGES)).toBe('{"answer":"hello"}');
    expect(await provider.structured(SCHEMA, MESSAGES)).toEqual({ answer: "hello" });

    const [chatBody, structuredBody] = bodies as Record<string, unknown>[];
    expect(chatBody).not.toHaveProperty("format");
    expect(structuredBody?.["format"]).toEqual(SCHEMA);
    expect(structuredBody?.["options"]).toEqual({ temperature: 0 });
  });

  it("rejects a non-JSON answer and HTTP errors loudly", async () => {
    mockFetch(() => jsonResponse({ message: { content: "sure! here you go: not json" } }));
    await expect(createOllamaProvider().structured(SCHEMA, MESSAGES)).rejects.toThrow("not JSON");

    mockFetch(() => jsonResponse({ error: "model not found" }, 404));
    await expect(createOllamaProvider().chat(MESSAGES)).rejects.toThrow("404");
  });
});

interface BuiltinStub {
  readonly model: {
    availability(): Promise<string>;
    create(options?: unknown): Promise<unknown>;
  };
  readonly created: unknown[];
  readonly prompts: { messages: unknown; options: unknown }[];
  setAvailability(value: string): void;
}

function builtinStub(availability: string, answer = "plain answer"): BuiltinStub {
  const created: unknown[] = [];
  const prompts: { messages: unknown; options: unknown }[] = [];
  let current = availability;
  return {
    model: {
      availability: async () => current,
      create: async (options?: unknown) => {
        created.push(options);
        return {
          prompt: async (messages: unknown, options2?: { responseConstraint?: unknown }) => {
            prompts.push({ messages, options: options2 });
            return options2?.responseConstraint ? '{"answer":"constrained"}' : answer;
          },
          destroy: () => {}
        };
      }
    },
    created,
    prompts,
    setAvailability(value: string) {
      current = value;
    }
  };
}

describe("BuiltinProvider", () => {
  it("maps availability onto health", async () => {
    const stub = builtinStub("available");
    vi.stubGlobal("window", { LanguageModel: stub.model });
    expect((await createBuiltinProvider().health()).ok).toBe(true);

    stub.setAvailability("downloading");
    const downloading = await createBuiltinProvider().health();
    expect(downloading.ok).toBe(false);
    expect(downloading.detail).toContain("downloading");
  });

  it("reports a browser without the model", async () => {
    vi.stubGlobal("window", {});
    const health = await createBuiltinProvider().health();
    expect(health.ok).toBe(false);
    expect(health.detail).toContain("no built-in model");
  });

  it("chats plain and structures with the response constraint", async () => {
    const stub = builtinStub("available");
    vi.stubGlobal("window", { LanguageModel: stub.model });
    const provider = createBuiltinProvider();

    expect(await provider.chat(MESSAGES)).toBe("plain answer");
    expect(await provider.structured(SCHEMA, MESSAGES)).toEqual({ answer: "constrained" });

    const chatPrompt = stub.prompts[0];
    expect(chatPrompt?.options).not.toHaveProperty("responseConstraint");
    const structuredPrompt = stub.prompts[1];
    expect(structuredPrompt?.options).toMatchObject({ responseConstraint: SCHEMA });
    // The system message is baked into the session, not sent per prompt.
    expect(JSON.stringify(structuredPrompt?.messages)).not.toContain("You are terse.");
  });

  it("reuses the session while the system prompt is unchanged", async () => {
    const stub = builtinStub("available");
    vi.stubGlobal("window", { LanguageModel: stub.model });
    const provider = createBuiltinProvider();

    await provider.structured(SCHEMA, MESSAGES);
    await provider.structured(SCHEMA, MESSAGES);
    expect(stub.created).toHaveLength(1);

    await provider.structured(SCHEMA, [{ role: "system", content: "Different." }]);
    expect(stub.created).toHaveLength(2);
  });
});

describe("WebLlmProvider", () => {
  it("refuses to start outside the browser", async () => {
    await expect(startWebLlm(() => {})).rejects.toThrow("browser only");
  });
});

describe("swapping providers changes no scoring behaviour", () => {
  const CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Responsible for testing of software before each release.
- Built a Playwright suite covering 120 cases.
`;

  const FINDING: Finding = {
    id: "impact.generic-phrasing",
    dimension: "impact",
    severity: "medium",
    title: "Responsibility phrasing instead of results",
    detail: "Bullets describe duties.",
    fix: "Restate them as claims.",
    cost: 4
  };

  function withoutTimestamp(result: AnalysisResult): Record<string, unknown> {
    return { ...result, generatedAt: "" };
  }

  it("produces identical task output through different providers", async () => {
    const weak = selectWeakBullets(CV);
    const payload = {
      rewrites: [
        {
          original: weak[0]?.content ?? "",
          rewritten: "Tested the software before every release."
        }
      ]
    };
    const viaA = await rewriteBullets(fakeProvider([payload], "provider-a").provider, weak, [
      "playwright"
    ]);
    const viaB = await rewriteBullets(fakeProvider([payload], "provider-b").provider, weak, [
      "playwright"
    ]);
    expect(viaA).toEqual(viaB);

    const explanation = { why: "Duties hide results.", nextStep: "Name the outcome." };
    const explainA = await explainFinding(fakeProvider([explanation], "a").provider, FINDING);
    const explainB = await explainFinding(fakeProvider([explanation], "b").provider, FINDING);
    expect(explainA).toEqual(explainB);
  });

  it("leaves the deterministic score untouched by AI work in between", async () => {
    const before = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD });

    const explainFake = fakeProvider([{ why: "because", nextStep: "do this" }]);
    await explainFinding(explainFake.provider, FINDING);

    const weak = selectWeakBullets(CV);
    const rewriteFake = fakeProvider([
      {
        rewrites: [
          {
            original: weak[0]?.content ?? "",
            rewritten: "Tested the software before every release."
          }
        ]
      }
    ]);
    await rewriteBullets(rewriteFake.provider, weak, []);

    const after = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD });
    expect(withoutTimestamp(after)).toEqual(withoutTimestamp(before));
  });

  it("keeps the firewall in the source tree", () => {
    const sources = (dir: string): string[] =>
      (readdirSync(join(process.cwd(), dir), { recursive: true }) as string[])
        .filter((name) => name.endsWith(".ts"))
        .map((name) => join(process.cwd(), dir, name));

    for (const file of sources("lib/scoring")) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} imports lib/ai`).not.toMatch(/lib\/ai\//);
    }

    const aiSide = [
      ...sources("lib/ai/providers"),
      ...sources("lib/ai/tasks"),
      join(process.cwd(), "lib", "ai", "model.ts")
    ];
    for (const file of aiSide) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} imports lib/scoring`).not.toMatch(/lib\/scoring\//);
    }
  });
});

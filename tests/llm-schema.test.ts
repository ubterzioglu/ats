import { afterEach, describe, expect, it, vi } from "vitest";

import { createOllamaProvider } from "@/lib/ai/providers/ollama";
import type { JsonSchema } from "@/lib/ai/providers/types";
import { SchemaViolationError, parseStructuredPayload, validateSchema } from "@/lib/ai/schema";
import { explainFinding } from "@/lib/ai/tasks/explain";
import { rewriteBullets, selectWeakBullets } from "@/lib/ai/tasks/rewrite";
import type { Finding } from "@/types/analysis";

import { fakeProvider, rawTextProvider } from "./helpers/fake-provider";

/**
 * L.4 acceptance: malformed output is rejected and the user told plainly.
 * "Rejected" means a SchemaViolationError - a typed Error whose message is
 * written for a human, not a partial payload, not a silent empty list.
 * "Told plainly" means the message says what happened ("did not match the
 * required shape"), what the app did about it ("nothing was shown") and what
 * the user can do ("try again, or choose a stronger model tier").
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

const REWRITE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    rewrites: {
      type: "array",
      items: {
        type: "object",
        properties: { original: { type: "string" }, rewritten: { type: "string" } },
        required: ["original", "rewritten"]
      }
    }
  },
  required: ["rewrites"]
};

const CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Responsible for testing of software before each release.
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

describe("validateSchema", () => {
  it("passes a conforming payload", () => {
    expect(
      validateSchema({ rewrites: [{ original: "a", rewritten: "b" }] }, REWRITE_SCHEMA)
    ).toEqual([]);
  });

  it("names the path of every violation", () => {
    expect(validateSchema({}, REWRITE_SCHEMA)).toEqual([
      { path: "rewrites", message: "is required" }
    ]);
    expect(validateSchema({ rewrites: "nope" }, REWRITE_SCHEMA)).toEqual([
      { path: "rewrites", message: "expected an array" }
    ]);
    expect(validateSchema({ rewrites: [{ original: "a" }] }, REWRITE_SCHEMA)).toEqual([
      { path: "rewrites.0.rewritten", message: "is required" }
    ]);
    expect(validateSchema({ rewrites: [{ original: 7, rewritten: "b" }] }, REWRITE_SCHEMA)).toEqual([
      { path: "rewrites.0.original", message: "expected a string" }
    ]);
  });

  it("checks scalars and enums", () => {
    expect(validateSchema("5", { type: "number" })[0]?.message).toBe("expected a number");
    expect(validateSchema(Number.NaN, { type: "number" })).toHaveLength(1);
    expect(validateSchema("true", { type: "boolean" })).toHaveLength(1);
    expect(validateSchema(5, { type: "number" })).toEqual([]);
    const issue = validateSchema("c", { type: "string", enum: ["a", "b"] })[0];
    expect(issue?.message).toContain("expected one of: a, b");
  });

  it("tolerates properties the schema does not declare", () => {
    expect(
      validateSchema({ rewrites: [], theme: "dark", extra: { deep: true } }, REWRITE_SCHEMA)
    ).toEqual([]);
  });

  it("caps the issue list", () => {
    const items = Array.from({ length: 30 }, () => ({ original: 1 }));
    expect(validateSchema({ rewrites: items }, REWRITE_SCHEMA)).toHaveLength(10);
  });
});

describe("parseStructuredPayload", () => {
  it("parses and validates in one step", () => {
    expect(parseStructuredPayload('{"rewrites":[]}', REWRITE_SCHEMA)).toEqual({ rewrites: [] });
  });

  it("rejects text that is not JSON", () => {
    try {
      parseStructuredPayload("sure! here you go", REWRITE_SCHEMA);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaViolationError);
      expect((error as SchemaViolationError).message).toContain("not JSON");
    }
  });

  it("rejects JSON that fails the schema, with a plain message", () => {
    try {
      parseStructuredPayload('{"nope":true}', REWRITE_SCHEMA);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaViolationError);
      const violation = error as SchemaViolationError;
      expect(violation.issues[0]?.path).toBe("rewrites");
      expect(violation.message).toContain("did not match the required shape");
      expect(violation.message).toContain("nothing was shown");
      expect(violation.message).toContain("stronger model tier");
    }
  });
});

describe("the provider gate", () => {
  function jsonResponse(payload: unknown): Response {
    return { ok: true, status: 200, json: async () => payload } as Response;
  }

  it("rejects a schema-violating answer before it leaves the provider", async () => {
    vi.stubGlobal("fetch", () => jsonResponse({ message: { content: '{"nope":true}' } }));
    const provider = createOllamaProvider();
    await expect(
      provider.structured(REWRITE_SCHEMA, [{ role: "user", content: "go" }])
    ).rejects.toBeInstanceOf(SchemaViolationError);
  });

  it("leaves plain chat alone - the schema gate belongs to structured()", async () => {
    vi.stubGlobal("fetch", () => jsonResponse({ message: { content: "just prose" } }));
    await expect(
      createOllamaProvider().chat([{ role: "user", content: "go" }])
    ).resolves.toBe("just prose");
  });
});

describe("the task gate", () => {
  it("retries a malformed answer once, then rejects with the plain message", async () => {
    const weak = selectWeakBullets(CV);
    const raw = rawTextProvider(["completely broken output"]);
    const error = await rewriteBullets(raw.provider, weak, []).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(SchemaViolationError);
    expect((error as Error).message).toContain("nothing was shown");
    expect(raw.calls()).toBe(2);
  });

  it("recovers when the retry conforms", async () => {
    const weak = selectWeakBullets(CV);
    const source = weak[0]?.content ?? "";
    const valid = JSON.stringify({
      rewrites: [{ original: source, rewritten: "Tested the software before every release." }]
    });
    const raw = rawTextProvider(["broken", valid]);
    const pairs = await rewriteBullets(raw.provider, weak, []);
    expect(pairs).toHaveLength(1);
    expect(raw.calls()).toBe(2);
  });

  it("rejects a structurally fine but semantically empty explanation", async () => {
    const fake = fakeProvider([{ why: "", nextStep: "" }]);
    const error = await explainFinding(fake.provider, FINDING).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(SchemaViolationError);
    expect((error as Error).message).toContain("nothing was shown");
    expect(fake.calls()).toBe(2);
  });

  it("passes non-schema errors through without retrying", async () => {
    const fake = fakeProvider([new Error("The local model was stopped.")]);
    const error = await explainFinding(fake.provider, FINDING).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SchemaViolationError);
    expect((error as Error).message).toBe("The local model was stopped.");
    expect(fake.calls()).toBe(1);
  });
});

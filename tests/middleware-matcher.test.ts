import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Next requires `config.matcher` to be a literal inside middleware.ts, so it
// cannot be imported from a shared module, and importing middleware.ts itself
// drags next-intl into the test runner. Read the literal from source instead.
const source = readFileSync(resolve(__dirname, "../apps/web/middleware.ts"), "utf8");
const literal = /matcher:\s*\[[\s\S]*?"(\/\(\(\?!.*?\)\.\*\))"/.exec(source)?.[1];

describe("middleware matcher", () => {
  it("is found in middleware.ts", () => {
    expect(literal).toBeDefined();
  });

  const matcher = new RegExp(`^${(literal ?? "").replace(/\\\\/g, "\\")}$`);

  it.each(["/api/ghost-check", "/api/anything/nested", "/auth/confirm", "/_next/static/chunk.js", "/logo.png"])(
    "leaves %s untouched",
    (path) => {
      expect(matcher.test(path)).toBe(false);
    }
  );

  it.each(["/", "/en", "/de/tailor", "/r/abc123", "/login"])("routes %s through locale handling", (path) => {
    expect(matcher.test(path)).toBe(true);
  });
});

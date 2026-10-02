import { describe, expect, it } from "vitest";

import type { TextModel } from "@/lib/ai/providers/types";
import {
  applyRewrite,
  rewriteBullets,
  selectWeakBullets,
  validateRewritePayload
} from "@/lib/ai/tasks/rewrite";

/**
 * The model is a black box, so the task wraps it in hard edges: shape
 * validation with one retry, grounding against the source bullet, and a line
 * swap that refuses when the document moved.
 */

function stubModel(responses: readonly unknown[]): { model: TextModel; calls: () => number } {
  let calls = 0;
  return {
    model: {
      id: "stub",
      label: "stub",
      async generateJson<T>(): Promise<T> {
        const response = responses[Math.min(calls, responses.length - 1)];
        calls += 1;
        return response as T;
      }
    },
    calls: () => calls
  };
}

const CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Responsible for testing of software before each release.
- Built a Playwright suite covering 120 cases.
- ok
`;

describe("selectWeakBullets", () => {
  it("picks responsibility bullets with their line position and marker", () => {
    const weak = selectWeakBullets(CV);
    expect(weak).toHaveLength(1);
    expect(weak[0]?.prefix).toBe("- ");
    expect(weak[0]?.content).toBe("Responsible for testing of software before each release.");
    expect(CV.split("\n")[weak[0]?.lineIndex ?? -1]).toContain("Responsible for");
  });

  it("ignores strong bullets and lines too short to carry a claim", () => {
    const weak = selectWeakBullets(CV);
    expect(weak.some((bullet) => bullet.content.includes("Playwright"))).toBe(false);
    expect(weak.some((bullet) => bullet.content === "ok")).toBe(false);
  });
});

describe("validateRewritePayload", () => {
  it("accepts the schema shape", () => {
    expect(
      validateRewritePayload({ rewrites: [{ original: "a", rewritten: "b" }] })
    ).toEqual([{ original: "a", rewritten: "b" }]);
  });

  it("rejects anything else", () => {
    expect(validateRewritePayload(null)).toBeNull();
    expect(validateRewritePayload({ rewrites: "nope" })).toBeNull();
    expect(validateRewritePayload({ rewrites: [{ original: "a" }] })).toBeNull();
  });
});

describe("rewriteBullets", () => {
  const weak = selectWeakBullets(CV);
  const source = weak[0]!.content;

  it("keeps a grounded rewrite", async () => {
    const stub = stubModel([
      {
        rewrites: [
          {
            original: source,
            rewritten: "Led software testing before each release, catching [quantify: N] defects."
          }
        ]
      }
    ]);
    const pairs = await rewriteBullets(stub.model, weak, ["playwright"]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.original).toBe(source);
  });

  it("drops a rewrite that invents a number or a technology", async () => {
    const stub = stubModel([
      {
        rewrites: [
          { original: source, rewritten: "Led testing with Selenium, reducing escapes by 40%." }
        ]
      }
    ]);
    const pairs = await rewriteBullets(stub.model, weak, ["playwright", "selenium"]);
    expect(pairs).toEqual([]);
  });

  it("retries once when the shape is wrong, then gives up loudly", async () => {
    const recovering = stubModel([
      { nonsense: true },
      { rewrites: [{ original: source, rewritten: "Led software testing before each release." }] }
    ]);
    const pairs = await rewriteBullets(recovering.model, weak, ["playwright"]);
    expect(pairs).toHaveLength(1);
    expect(recovering.calls()).toBe(2);

    const hopeless = stubModel([{ nonsense: true }]);
    await expect(rewriteBullets(hopeless.model, weak, ["playwright"])).rejects.toThrow();
    expect(hopeless.calls()).toBe(2);
  });

  it("ignores proposals for bullets it was never given", async () => {
    const stub = stubModel([
      { rewrites: [{ original: "Some other sentence entirely.", rewritten: "Led things." }] }
    ]);
    expect(await rewriteBullets(stub.model, weak, ["playwright"])).toEqual([]);
  });
});

describe("applyRewrite", () => {
  it("swaps the content and keeps the marker", () => {
    const bullet = selectWeakBullets(CV)[0]!;
    const next = applyRewrite(CV, bullet, "Led software testing before each release.");
    expect(next).toContain("- Led software testing before each release.");
    expect(next).not.toContain("Responsible for");
  });

  it("refuses when the text moved", () => {
    const bullet = selectWeakBullets(CV)[0]!;
    expect(applyRewrite(CV.replace("Jane Doe", "John Doe"), { ...bullet, lineIndex: 99 }, "x")).toBeNull();
  });
});

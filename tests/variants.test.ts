import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { diff, patch } from "@/lib/variants/diff";
import { clearVariant, readVariant, writeVariant } from "@/lib/variants/store";
import type { Resume } from "@/types/resume";

const realIndexedDB = globalThis.indexedDB;

beforeEach(() => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: new IDBFactory(),
    configurable: true,
    writable: true
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: realIndexedDB,
    configurable: true,
    writable: true
  });
});

const BASE: Resume = {
  basics: { name: "Alice", email: "alice@example.com" },
  work: [{ company: "A" }, { company: "B" }]
};

const VARIANT: Resume = {
  basics: { name: "Alice", email: "alice@variants.com", phone: "123" },
  work: [{ company: "A", position: "Dev" }]
};

describe("variants diff and patch", () => {
  it("computes diff and patches back to the variant", () => {
    const d = diff(BASE, VARIANT);
    expect(d).toBeDefined();

    const patched = patch(BASE, d) as Resume;
    expect(patched).toEqual(VARIANT);
  });

  it("handles empty resumes", () => {
    const d = diff({}, VARIANT);
    const patched = patch({}, d) as Resume;
    expect(patched).toEqual(VARIANT);
  });

  it("handles removing fields", () => {
    const v: Resume = { basics: { name: "Alice" } };
    const d = diff(BASE, v);
    const patched = patch(BASE, d) as Resume;
    expect(patched).toEqual(v);
  });

  it("inherits updates from base that are not overridden", () => {
    // variant only overrides the email
    const v: Resume = {
      basics: { name: "Alice", email: "variant@example.com" },
      work: [{ company: "A" }, { company: "B" }]
    };
    
    const d = diff(BASE, v);
    
    // now base updates name
    const newBase: Resume = {
      ...BASE,
      basics: { name: "Alice Updated", email: "alice@example.com" },
    };
    
    const patched = patch(newBase, d) as Resume;
    
    expect(patched.basics?.name).toBe("Alice Updated");
    expect(patched.basics?.email).toBe("variant@example.com");
  });
});

describe("variants store", () => {
  it("writes and reads variants over a base resume", async () => {
    await writeVariant("v1", "job-1", VARIANT, BASE);

    const read = await readVariant("v1", BASE);
    expect(read.ok).toBe(true);
    if (!read.ok) return;

    expect(read.value?.resume).toEqual(VARIANT);
    expect(read.value?.id).toBe("v1");
    expect(read.value?.jobId).toBe("job-1");
  });

  it("returns null for non-existent variants", async () => {
    const read = await readVariant("missing", BASE);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value).toBeNull();
  });

  it("can clear variants", async () => {
    await writeVariant("v1", "job-1", VARIANT, BASE);
    await clearVariant("v1");
    
    const read = await readVariant("v1", BASE);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value).toBeNull();
  });
});

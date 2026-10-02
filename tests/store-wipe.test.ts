import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openStore } from "@/lib/store/db";
import { STORE_NAMES } from "@/lib/store/schema";
import { summariseLocalData, totalRecords, wipeLocalData } from "@/lib/store/wipe";

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

async function seed() {
  const opened = await openStore();
  if (!opened.ok) throw new Error("the store did not open");

  await opened.value.put("meta", { key: "locale", value: "tr", updatedAt: 1 });
  await opened.value.put("history", {
    id: "a",
    recordedAt: 1,
    total: 64,
    band: "good",
    language: "en",
    dimensions: []
  });
  opened.value.close();
}

describe("summariseLocalData", () => {
  it("counts every store, including the empty ones", async () => {
    const summary = await summariseLocalData();
    if (!summary.ok) throw new Error("the summary did not read");

    expect(Object.keys(summary.value).sort()).toEqual([...STORE_NAMES].sort());
    expect(totalRecords(summary.value)).toBe(0);
  });

  it("counts what is actually there", async () => {
    await seed();

    const summary = await summariseLocalData();
    expect(summary.ok && summary.value).toEqual({ meta: 1, history: 1, trail: 0 });
  });
});

describe("wipeLocalData", () => {
  it("clears every store and reports what went", async () => {
    await seed();

    const wiped = await wipeLocalData();
    expect(wiped.ok && wiped.value).toEqual({ meta: 1, history: 1, trail: 0 });

    const after = await summariseLocalData();
    expect(after.ok && totalRecords(after.value)).toBe(0);
  });

  it("leaves the schema in place, so the next write needs no migration", async () => {
    await seed();
    await wipeLocalData();

    const opened = await openStore();
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const written = await opened.value.put("meta", { key: "locale", value: "de", updatedAt: 2 });
    expect(written.ok).toBe(true);
    opened.value.close();
  });

  it("reports a refusal rather than claiming an empty browser", async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true
    });

    const wiped = await wipeLocalData();
    expect(wiped.ok).toBe(false);
    if (wiped.ok) return;
    expect(wiped.failure.reason).toBe("unsupported");
  });
});

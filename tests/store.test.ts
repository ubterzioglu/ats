import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openStore } from "@/lib/store/db";
import { classify } from "@/lib/store/failure";
import { DB_NAME, DB_VERSION } from "@/lib/store/schema";

const realIndexedDB = globalThis.indexedDB;

beforeEach(() => {
  // A fresh factory per test, so one test's records never reach the next.
  Object.defineProperty(globalThis, "indexedDB", {
    value: new IDBFactory(),
    configurable: true,
    writable: true
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "indexedDB", {
    value: realIndexedDB,
    configurable: true,
    writable: true
  });
});

describe("openStore", () => {
  it("creates the schema at the current version", async () => {
    const opened = await openStore();
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const databases = await indexedDB.databases();
    expect(databases).toContainEqual({ name: DB_NAME, version: DB_VERSION });
    opened.value.close();
  });

  it("reports a refusal instead of throwing", async () => {
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new DOMException("site data blocked", "SecurityError");
    });

    const opened = await openStore();
    expect(opened.ok).toBe(false);
    if (opened.ok) return;
    expect(opened.failure.reason).toBe("blocked");
    expect(opened.failure.message.length).toBeGreaterThan(0);
  });

  it("reports an environment without IndexedDB", async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true
    });

    const opened = await openStore();
    expect(opened.ok).toBe(false);
    if (opened.ok) return;
    expect(opened.failure.reason).toBe("unsupported");
  });
});

describe("records", () => {
  it("round-trips a value", async () => {
    const opened = await openStore();
    if (!opened.ok) throw new Error("the store did not open");
    const store = opened.value;

    const written = await store.put("meta", { key: "locale", value: "tr", updatedAt: 1 });
    expect(written.ok).toBe(true);

    const read = await store.get("meta", "locale");
    expect(read.ok && read.value?.value).toBe("tr");

    store.close();
  });

  it("returns null for a key that was never written", async () => {
    const opened = await openStore();
    if (!opened.ok) throw new Error("the store did not open");

    const read = await opened.value.get("meta", "absent");
    expect(read.ok && read.value).toBeNull();

    opened.value.close();
  });

  it("counts and clears", async () => {
    const opened = await openStore();
    if (!opened.ok) throw new Error("the store did not open");
    const store = opened.value;

    await store.put("meta", { key: "a", value: 1, updatedAt: 1 });
    await store.put("meta", { key: "b", value: 2, updatedAt: 1 });
    expect(await store.count("meta")).toEqual({ ok: true, value: 2 });

    await store.clear("meta");
    expect(await store.count("meta")).toEqual({ ok: true, value: 0 });

    store.close();
  });

  it("removes one record without touching the rest", async () => {
    const opened = await openStore();
    if (!opened.ok) throw new Error("the store did not open");
    const store = opened.value;

    await store.put("meta", { key: "a", value: 1, updatedAt: 1 });
    await store.put("meta", { key: "b", value: 2, updatedAt: 1 });
    await store.remove("meta", "a");

    const all = await store.getAll("meta");
    expect(all.ok && all.value.map((row) => row.key)).toEqual(["b"]);

    store.close();
  });
});

describe("a full disk", () => {
  it("surfaces the quota failure rather than reporting a successful write", async () => {
    const opened = await openStore();
    if (!opened.ok) throw new Error("the store did not open");
    const store = opened.value;

    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore) {
      throw new DOMException("quota", "QuotaExceededError");
    });

    const written = await store.put("meta", { key: "big", value: "x", updatedAt: 1 });
    expect(written.ok).toBe(false);
    if (written.ok) return;
    expect(written.failure.reason).toBe("quota-exceeded");
    expect(written.failure.message).toMatch(/full/i);

    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(put);
    store.close();
  });
});

describe("classify", () => {
  it("maps each browser's private-browsing refusal to a refusal", () => {
    expect(classify(new DOMException("", "SecurityError"))).toBe("blocked");
    expect(classify(new DOMException("", "InvalidStateError"))).toBe("blocked");
    expect(classify(new DOMException("", "UnknownError"))).toBe("blocked");
  });

  it("falls back to a generic failure for anything else", () => {
    expect(classify(new Error("boom"))).toBe("failed");
    expect(classify("not an error")).toBe("failed");
  });
});

import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  TRAIL_LIMIT,
  appendTrailPoint,
  currentSessionId,
  readTrail,
  startNewSession
} from "@/lib/store/trail";
import { summariseLocalData } from "@/lib/store/wipe";

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

describe("the session id", () => {
  it("is created once and read back", async () => {
    const first = await currentSessionId();
    const second = await currentSessionId();

    expect(first.ok && second.ok && first.value).toBe(second.ok ? second.value : "");
  });

  it("changes when a session is started deliberately", async () => {
    const before = await currentSessionId();
    const after = await startNewSession();

    expect(before.ok && after.ok && before.value).not.toBe(after.ok ? after.value : "");
  });
});

describe("the trail", () => {
  it("records a point per re-score, oldest first", async () => {
    await appendTrailPoint(60, 1);
    await appendTrailPoint(66, 2);
    await appendTrailPoint(71, 3);

    const trail = await readTrail();
    expect(trail.ok && trail.value.map((point) => point.total)).toEqual([60, 66, 71]);
  });

  it("survives a reload", async () => {
    await appendTrailPoint(60, 1);
    await appendTrailPoint(66, 2);

    // A reload is a fresh read against the same database: no in-memory state
    // carries over, and the session id comes back from `meta`.
    const resumed = await readTrail();
    expect(resumed.ok && resumed.value.map((point) => point.total)).toEqual([60, 66]);

    await appendTrailPoint(71, 3);
    const continued = await readTrail();
    expect(continued.ok && continued.value.map((point) => point.total)).toEqual([60, 66, 71]);
  });

  it("drops the previous session's points when a new one starts", async () => {
    await appendTrailPoint(60, 1);
    await appendTrailPoint(66, 2);
    await startNewSession();

    const trail = await readTrail();
    expect(trail.ok && trail.value).toEqual([]);

    const summary = await summariseLocalData();
    expect(summary.ok && summary.value.trail).toBe(0);
  });

  it("keeps only the most recent readings", async () => {
    for (let index = 1; index <= TRAIL_LIMIT + 10; index += 1) {
      await appendTrailPoint(index % 100, index);
    }

    const trail = await readTrail();
    if (!trail.ok) throw new Error("the trail did not read");

    expect(trail.value).toHaveLength(TRAIL_LIMIT);
    expect(trail.value[0]?.at).toBe(11);
    expect(trail.value.at(-1)?.at).toBe(TRAIL_LIMIT + 10);
  });
});

describe("a browser that refuses local storage", () => {
  it("reports the refusal rather than pretending a point was recorded", async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true
    });

    const written = await appendTrailPoint(60, 1);
    expect(written.ok).toBe(false);
    if (written.ok) return;
    expect(written.failure.reason).toBe("unsupported");
  });
});

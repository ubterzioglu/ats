import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  HISTORY_LIMIT,
  clearHistory,
  readHistory,
  readPreviousRecord,
  recordAnalysis,
  toHistoryRecord
} from "@/lib/store/history";
import type { AnalysisResult } from "@/types/analysis";

const realIndexedDB = globalThis.indexedDB;

function result(total: number): AnalysisResult {
  return {
    total,
    band: "good",
    bandLabel: "Good",
    language: "en",
    dimensions: [
      { id: "parseability", label: "Parseability", score: 18, max: 25, summary: "" },
      { id: "contact", label: "Contact", score: 5, max: 10, summary: "" }
    ],
    findings: [
      {
        id: "contact.phone",
        dimension: "contact",
        severity: "high",
        title: "No phone number",
        detail: "",
        fix: "",
        cost: 5,
        evidence: ["Ada Lovelace, ada@example.com, 10 Downing Street"]
      }
    ],
    keywords: { source: "baseline", coverage: 0, matched: [], missing: [], overused: [] },
    sections: [],
    stats: {
      characters: 10,
      words: 2,
      lines: 1,
      bulletLines: 0,
      averageBulletWords: 0,
      estimatedPages: 1,
      years: [],
      experienceMonths: 0
    },
    generatedAt: "2026-10-02T00:00:00.000Z"
  };
}

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

describe("toHistoryRecord", () => {
  it("keeps the scores and the time", () => {
    const record = toHistoryRecord(result(64), 1_700_000_000_000);

    expect(record.total).toBe(64);
    expect(record.band).toBe("good");
    expect(record.recordedAt).toBe(1_700_000_000_000);
    expect(record.dimensions).toEqual([
      { id: "parseability", score: 18, max: 25 },
      { id: "contact", score: 5, max: 10 }
    ]);
  });

  it("carries no line lifted from the document", () => {
    const serialised = JSON.stringify(toHistoryRecord(result(64), 1));

    expect(serialised).not.toMatch(/Ada Lovelace/);
    expect(serialised).not.toMatch(/Downing Street/);
    expect(serialised).not.toMatch(/No phone number/);
  });
});

describe("history", () => {
  it("survives a reload", async () => {
    await recordAnalysis(result(64), 1);

    // A fresh read opens the database again, exactly as a new page load would.
    const history = await readHistory();
    expect(history.ok && history.value.map((row) => row.total)).toEqual([64]);
  });

  it("returns the newest analysis first", async () => {
    await recordAnalysis(result(50), 1);
    await recordAnalysis(result(70), 2);
    await recordAnalysis(result(60), 3);

    const history = await readHistory();
    expect(history.ok && history.value.map((row) => row.total)).toEqual([60, 70, 50]);
  });

  it("offers the last analysis as the one to compare against", async () => {
    expect(await readPreviousRecord()).toEqual({ ok: true, value: null });

    await recordAnalysis(result(50), 1);
    const previous = await readPreviousRecord();
    expect(previous.ok && previous.value?.total).toBe(50);
  });

  it("keeps only the most recent N", async () => {
    for (let index = 1; index <= HISTORY_LIMIT + 5; index += 1) {
      await recordAnalysis(result(index), index);
    }

    const history = await readHistory();
    if (!history.ok) throw new Error("history did not read");

    expect(history.value).toHaveLength(HISTORY_LIMIT);
    expect(history.value[0]?.total).toBe(HISTORY_LIMIT + 5);
    expect(history.value.at(-1)?.total).toBe(6);
  });

  it("clears", async () => {
    await recordAnalysis(result(64), 1);
    expect((await clearHistory()).ok).toBe(true);

    const history = await readHistory();
    expect(history.ok && history.value).toEqual([]);
  });
});

describe("a browser that refuses local storage", () => {
  it("reports the refusal rather than pretending the analysis was recorded", async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true
    });

    const written = await recordAnalysis(result(64), 1);
    expect(written.ok).toBe(false);
    if (written.ok) return;
    expect(written.failure.reason).toBe("unsupported");
  });
});

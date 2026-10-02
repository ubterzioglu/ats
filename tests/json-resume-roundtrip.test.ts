import { describe, expect, it } from "vitest";

import {
  exportJsonResume,
  exportJsonResumeText,
  importJsonResume,
  importJsonResumeText
} from "@/lib/resume/json-resume";

import {
  FULL_RESUME,
  MINIMAL_RESUME,
  TURKISH_RESUME,
  UNKNOWN_KEYS_RESUME
} from "./fixtures/resumes";

/**
 * E.10 acceptance: the round trip is lossless. What validates on the way in
 * comes back out deep-equal - unknown keys, empty strings and the "" that
 * marks an open role included - and nothing appears that was not there.
 */

const FIXTURES: readonly (readonly [string, object])[] = [
  ["full", FULL_RESUME],
  ["minimal", MINIMAL_RESUME],
  ["turkish", TURKISH_RESUME],
  ["unknown-keys", UNKNOWN_KEYS_RESUME]
];

describe("JSON Resume round trip", () => {
  it.each(FIXTURES)("%s: import -> export is deep-equal to the input", (_name, fixture) => {
    const imported = importJsonResume(fixture);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(exportJsonResume(imported.resume)).toEqual(JSON.parse(JSON.stringify(fixture)));
  });

  it.each(FIXTURES)("%s: text -> import -> text -> import is stable", (_name, fixture) => {
    const first = importJsonResumeText(JSON.stringify(fixture));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const text = exportJsonResumeText(first.resume);
    const second = importJsonResumeText(text);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(exportJsonResume(second.resume)).toEqual(exportJsonResume(first.resume));
  });

  it("never touches the document it is given", () => {
    const input = JSON.parse(JSON.stringify(FULL_RESUME)) as Record<string, unknown>;
    const before = JSON.stringify(input);
    importJsonResume(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("keeps the registry's $schema key and unknown extensions", () => {
    const imported = importJsonResume(FULL_RESUME);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    const exported = exportJsonResume(imported.resume);
    expect(exported["$schema"]).toBe("https://jsonresume.org/schema.json");

    const extended = importJsonResume(UNKNOWN_KEYS_RESUME);
    expect(extended.ok).toBe(true);
    if (!extended.ok) return;
    const exportedExtended = exportJsonResume(extended.resume);
    expect(exportedExtended["social"]).toEqual([
      { network: "Mastodon", url: "https://example.social/@ayse" }
    ]);
  });

  it("carries Turkish and German characters through the text form", () => {
    const imported = importJsonResume(TURKISH_RESUME);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    const text = exportJsonResumeText(imported.resume);
    for (const needle of ["Ağustos", "Şubat", "İstanbul", "geliştiriyorum", "Ana dil"]) {
      expect(text).toContain(needle);
    }
  });

  it("round-trips the empty document as empty", () => {
    const imported = importJsonResume({});
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(exportJsonResume(imported.resume)).toEqual({});
    expect(exportJsonResumeText(imported.resume)).toBe("{}");
  });
});

describe("import failures", () => {
  it("reports invalid JSON without throwing", () => {
    const result = importJsonResumeText("{not json");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("");
      expect(result.issues[0]?.message).toContain("JSON");
    }
  });

  it("reports schema violations with dotted paths", () => {
    const result = importJsonResumeText(JSON.stringify({ work: [{ startDate: "last spring" }] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("work.0.startDate");
    }
  });

  it("salvages nothing from an invalid document", () => {
    const result = importJsonResume({ basics: { name: "Ayşe" }, work: [{ startDate: 5 }] });
    expect(result.ok).toBe(false);
  });
});

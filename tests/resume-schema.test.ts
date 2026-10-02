import { describe, expect, it } from "vitest";

import { parseResume, safeParseResume } from "@/lib/resume/schema";
import type { Resume } from "@/types/resume";

import {
  FULL_RESUME,
  MINIMAL_RESUME,
  TURKISH_RESUME,
  UNKNOWN_KEYS_RESUME
} from "./fixtures/resumes";

/**
 * E.2 acceptance: the schema validates the fixture set. The two promises
 * under test are that nothing is invented - empty stays empty - and that
 * nothing is lost - keys the model does not declare survive the parse.
 */

describe("resumeSchema on the fixture set", () => {
  it("validates every fixture", () => {
    for (const fixture of [FULL_RESUME, MINIMAL_RESUME, TURKISH_RESUME, UNKNOWN_KEYS_RESUME]) {
      const result = safeParseResume(fixture);
      expect(result.ok, JSON.stringify(result)).toBe(true);
    }
  });

  it("hands back a value assignable to the canonical model", () => {
    const resume: Resume = parseResume(FULL_RESUME);
    expect(resume.basics?.name).toBe("Umut Barış Terzioglu");
    expect(resume.work).toHaveLength(2);
    expect(resume.skills?.[0]?.keywords).toContain("Testautomatisierung");
    expect(resume.projects?.[0]?.isActive).toBe(true);
    expect(resume.meta?.version).toBe("v1.0.0");
  });

  it("carries Turkish and German characters through unchanged", () => {
    const resume = parseResume(TURKISH_RESUME);
    expect(resume.basics?.summary).toBe(
      "Şubat 2015'ten beri İstanbul'da ışık hızında regresyon paketleri geliştiriyorum."
    );
    expect(resume.work?.[0]?.highlights?.[0]).toBe("Ağustos 2021'de 180 Selenium testini taşıdım");
  });
});

describe("nothing invented, nothing lost", () => {
  it("parses an empty document to an empty document", () => {
    expect(parseResume({})).toEqual({});
    const minimal = safeParseResume(MINIMAL_RESUME);
    expect(minimal).toEqual({ ok: true, resume: {} });
  });

  it("keeps keys the model does not declare", () => {
    const parsed = parseResume(UNKNOWN_KEYS_RESUME) as unknown as Record<string, unknown>;
    const basics = parsed["basics"] as Record<string, unknown>;
    expect(basics["pronouns"]).toBe("she/her");
    expect(basics["location"]).toEqual({ city: "İzmir", neighborhood: "Alsancak" });
    expect(parsed["social"]).toEqual([
      { network: "Mastodon", url: "https://example.social/@ayse" }
    ]);
    const work = parsed["work"] as Record<string, unknown>[];
    expect(work[0]?.["customField"]).toBe(42);
    expect(work[0]?.["tags"]).toEqual(["remote"]);
    expect((parsed["meta"] as Record<string, unknown>)["theme"]).toBe("elegant");
  });
});

describe("rejections name their path", () => {
  it("rejects a date that is not date-like", () => {
    const result = safeParseResume({ work: [{ startDate: "not-a-date" }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("work.0.startDate");
    }
  });

  it("rejects a numeric email", () => {
    const result = safeParseResume({ basics: { email: 42 } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("basics.email");
    }
  });

  it("rejects a document that is not an object", () => {
    expect(safeParseResume("a resume, trust me").ok).toBe(false);
    expect(safeParseResume(null).ok).toBe(false);
    expect(safeParseResume([]).ok).toBe(false);
  });

  it("rejects a section of the wrong type", () => {
    const result = safeParseResume({ work: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe("work");
    }
  });

  it("accepts the date shapes real CVs use", () => {
    for (const date of ["2020", "2020-03", "2020-03-01", "2020-03-01T10:00:00Z", ""]) {
      expect(safeParseResume({ work: [{ startDate: date }] }).ok, date).toBe(true);
    }
    expect(safeParseResume({ work: [{ startDate: "03/2020" }] }).ok).toBe(false);
    expect(safeParseResume({ work: [{ startDate: "March 2020" }] }).ok).toBe(false);
  });
});

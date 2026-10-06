import { describe, expect, it } from "vitest";

import { safeParseProfileExtras, safeParseProfileResume } from "@/lib/profile/schema";

describe("safeParseProfileResume", () => {
  it("accepts a valid resume", () => {
    const result = safeParseProfileResume({
      basics: { name: "Test User", email: "test@example.com" }
    });
    expect(result.ok).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = safeParseProfileResume({});
    expect(result.ok).toBe(true);
  });

  it("truncates long strings", () => {
    const longString = "x".repeat(2000);
    const result = safeParseProfileResume({
      basics: { name: longString }
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const basics = result.resume.basics as Record<string, unknown>;
      expect((basics.name as string).length).toBe(1000);
    }
  });

  it("rejects a resume that exceeds the size limit", () => {
    const hugeArray = Array.from({ length: 10000 }, (_, i) => ({ name: `Skill ${i}` }));
    const result = safeParseProfileResume({ skills: hugeArray });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("resume-too-large");
    }
  });

  it("accepts non-object input as empty", () => {
    const result = safeParseProfileResume(null);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resume).toEqual({});
    }
  });
});

describe("safeParseProfileExtras", () => {
  it("accepts an empty object", () => {
    const result = safeParseProfileExtras({});
    expect(result.ok).toBe(true);
  });

  it("accepts arbitrary keys", () => {
    const result = safeParseProfileExtras({ custom: "value", count: 42 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extras).toEqual({ custom: "value", count: 42 });
    }
  });

  it("rejects extras that exceed the size limit", () => {
    const huge = { data: "x".repeat(20000) };
    const result = safeParseProfileExtras(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("extras-too-large");
    }
  });

  it("accepts non-object input as empty", () => {
    const result = safeParseProfileExtras(null);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extras).toEqual({});
    }
  });
});

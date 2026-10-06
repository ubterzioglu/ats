import { describe, expect, it } from "vitest";

import { profileToResume } from "@/lib/profile/to-resume";

describe("profileToResume", () => {
  it("removes empty string keys", () => {
    const profile = {
      resume: { basics: { name: "Test", email: "", phone: "" } },
      extras: {},
      version: 1
    };
    const result = profileToResume(profile);
    expect(result.basics?.name).toBe("Test");
    expect(result.basics?.email).toBeUndefined();
    expect(result.basics?.phone).toBeUndefined();
  });

  it("removes empty array keys", () => {
    const profile = {
      resume: { work: [], skills: [{ name: "Skill" }] },
      extras: {},
      version: 1
    };
    const result = profileToResume(profile);
    expect(result.work).toBeUndefined();
    expect(result.skills).toHaveLength(1);
  });

  it("removes empty object keys", () => {
    const profile = {
      resume: { basics: {}, meta: { version: "1" } },
      extras: {},
      version: 1
    };
    const result = profileToResume(profile);
    expect(result.basics).toBeUndefined();
    expect(result.meta?.version).toBe("1");
  });

  it("removes null and undefined keys", () => {
    const profile = {
      resume: { basics: { name: null, email: undefined, phone: "123" } },
      extras: {},
      version: 1
    };
    const result = profileToResume(profile);
    expect(result.basics?.name).toBeUndefined();
    expect(result.basics?.email).toBeUndefined();
    expect(result.basics?.phone).toBe("123");
  });

  it("returns an empty resume when all keys are empty", () => {
    const profile = {
      resume: { basics: { name: "", email: "" }, work: [] },
      extras: {},
      version: 1
    };
    const result = profileToResume(profile);
    expect(result).toEqual({});
  });
});

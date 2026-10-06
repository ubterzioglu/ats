import { describe, expect, it } from "vitest";

import { mergeResume } from "@/lib/profile/merge";

describe("mergeResume", () => {
  it("does not overwrite existing non-empty fields with empty incoming values", () => {
    const existing = { basics: { name: "Existing Name", email: "existing@example.com" } };
    const incoming = { basics: { name: "", email: "" } };
    const result = mergeResume(existing, incoming, { sections: ["basics"] });
    expect(result.basics?.name).toBe("Existing Name");
    expect(result.basics?.email).toBe("existing@example.com");
  });

  it("applies incoming non-empty values over existing", () => {
    const existing = { basics: { name: "Old Name" } };
    const incoming = { basics: { name: "New Name" } };
    const result = mergeResume(existing, incoming, { sections: ["basics"] });
    expect(result.basics?.name).toBe("New Name");
  });

  it("merges only selected sections", () => {
    const existing = { basics: { name: "Old" }, work: [{ position: "Old Job" }] };
    const incoming = { basics: { name: "New" }, work: [{ position: "New Job" }] };
    const result = mergeResume(existing, incoming, { sections: ["basics"] });
    expect(result.basics?.name).toBe("New");
    expect(result.work?.[0]?.position).toBe("Old Job");
  });

  it("replaces arrays rather than merging them", () => {
    const existing = { work: [{ position: "Job 1" }, { position: "Job 2" }] };
    const incoming = { work: [{ position: "Job 3" }] };
    const result = mergeResume(existing, incoming, { sections: ["work"] });
    expect(result.work).toHaveLength(1);
    expect(result.work?.[0]?.position).toBe("Job 3");
  });

  it("keeps existing arrays when incoming is empty", () => {
    const existing = { skills: [{ name: "Skill 1" }] };
    const incoming = { skills: [] };
    const result = mergeResume(existing, incoming, { sections: ["skills"] });
    expect(result.skills).toHaveLength(1);
  });

  it("applies specific fields when selection.fields is provided", () => {
    const existing = { basics: { name: "Old", email: "old@example.com" } };
    const incoming = { basics: { name: "New", email: "new@example.com" } };
    const result = mergeResume(existing, incoming, {
      sections: [],
      fields: ["basics.name"]
    });
    expect(result.basics?.name).toBe("New");
    expect(result.basics?.email).toBe("old@example.com");
  });

  it("does not write empty keys into basics", () => {
    const existing = { basics: { name: "Existing" } };
    const incoming = { basics: { name: "", phone: "" } };
    const result = mergeResume(existing, incoming, { sections: ["basics"] });
    expect(result.basics?.name).toBe("Existing");
    expect(result.basics?.phone).toBeUndefined();
  });

  it("preserves existing data when incoming is empty", () => {
    const existing = { basics: { name: "Test" } };
    const incoming = {};
    const result = mergeResume(existing, incoming, { sections: ["basics"] });
    expect(result.basics?.name).toBe("Test");
  });
});

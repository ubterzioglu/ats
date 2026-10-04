import { describe, expect, it } from "vitest";

import { addSkillToResume } from "../apps/web/lib/tailor/skills";
import type { Resume } from "../apps/web/types/resume";

describe("tailor: skill confirmation gate", () => {
  it("rejects adding a skill without explicit confirmation", () => {
    const resume: Resume = {};
    
    expect(() => addSkillToResume(resume, "React", false)).toThrowError(
      "Integrity violation: A skill cannot be added to the CV without explicit user confirmation."
    );
  });

  it("adds a skill when confirmed", () => {
    const resume: Resume = {};
    
    const updated = addSkillToResume(resume, "React", true);
    expect(updated.skills).toBeDefined();
    expect(updated.skills![0]?.keywords).toContain("React");
  });

  it("appends to existing skills if confirmed", () => {
    const resume: Resume = {
      skills: [
        { name: "Frontend", keywords: ["HTML", "CSS"] }
      ]
    };
    
    const updated = addSkillToResume(resume, "Vue", true);
    expect(updated.skills).toHaveLength(1);
    expect(updated.skills![0]?.keywords).toEqual(["HTML", "CSS", "Vue"]);
  });

  it("does not duplicate an existing skill", () => {
    const resume: Resume = {
      skills: [
        { name: "Frontend", keywords: ["React"] }
      ]
    };
    
    const updated = addSkillToResume(resume, "React", true);
    expect(updated.skills![0]?.keywords).toHaveLength(1);
  });
});

import type { Resume } from "@/types/resume";

/**
 * Adds a skill to the CV's skills array.
 * 
 * Enforces the D.3 integrity rule: no skill can be added to a CV
 * unless the candidate explicitly confirmed they have it.
 */
export function addSkillToResume(resume: Resume, skill: string, isConfirmed: boolean): Resume {
  if (!isConfirmed) {
    throw new Error("Integrity violation: A skill cannot be added to the CV without explicit user confirmation.");
  }

  const existingSkills = resume.skills ?? [];
  
  const normalizedSkill = skill.toLowerCase().trim();
  const alreadyExists = existingSkills.some(s => 
    s.name?.toLowerCase().trim() === normalizedSkill || 
    s.keywords?.some(k => k.toLowerCase().trim() === normalizedSkill)
  );

  if (alreadyExists) {
    return resume;
  }
  
  const updatedSkills = [...existingSkills];
  if (updatedSkills.length > 0) {
    const first = updatedSkills[0]!;
    updatedSkills[0] = {
      ...first,
      keywords: [...(first.keywords ?? []), skill]
    };
  } else {
    updatedSkills.push({
      name: "Skills",
      keywords: [skill]
    });
  }

  return {
    ...resume,
    skills: updatedSkills
  };
}

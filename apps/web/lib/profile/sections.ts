import type { ProfileSection } from "./types";

export interface ProfileSectionDefinition {
  readonly id: ProfileSection;
  readonly labelKey: string;
}

export const PROFILE_SECTIONS: readonly ProfileSectionDefinition[] = [
  { id: "basics", labelKey: "profile.section.basics" },
  { id: "work", labelKey: "profile.section.work" },
  { id: "education", labelKey: "profile.section.education" },
  { id: "skills", labelKey: "profile.section.skills" },
  { id: "languages", labelKey: "profile.section.languages" }
] as const;

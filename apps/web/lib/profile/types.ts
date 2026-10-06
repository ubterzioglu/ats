import type { Resume } from "@/types/resume";

export interface Profile {
  readonly resume: Resume;
  readonly extras: Record<string, unknown>;
  readonly version: number;
}

export interface ProfileRow {
  readonly user_id: string;
  readonly resume: Resume;
  readonly extras: Record<string, unknown>;
  readonly version: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export type ProfileSection =
  | "basics"
  | "work"
  | "education"
  | "skills"
  | "languages";

export interface ProfileSelection {
  readonly sections: readonly ProfileSection[];
  readonly fields?: readonly string[];
}

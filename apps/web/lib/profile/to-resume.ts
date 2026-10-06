import type { Resume } from "@/types/resume";

import type { Profile } from "./types";

function removeEmptyKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.length === 0) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const cleaned = removeEmptyKeys(value as Record<string, unknown>);
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function profileToResume(profile: Profile): Resume {
  const cleaned = removeEmptyKeys(profile.resume as Record<string, unknown>);
  return cleaned as Resume;
}

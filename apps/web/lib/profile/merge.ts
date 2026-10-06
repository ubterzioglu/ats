import type { Resume } from "@/types/resume";

import type { ProfileSelection } from "./types";

function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function mergeField(existing: unknown, incoming: unknown): unknown {
  if (isNonEmpty(incoming)) return incoming;
  return existing;
}

function mergeObject(existing: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    const existingValue = result[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value) &&
        typeof existingValue === "object" && existingValue !== null && !Array.isArray(existingValue)) {
      result[key] = mergeObject(existingValue as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = mergeField(existingValue, value);
    }
  }
  return result;
}

function mergeArray(existing: readonly unknown[] | undefined, incoming: readonly unknown[] | undefined): readonly unknown[] {
  if (!incoming || incoming.length === 0) return existing ?? [];
  if (!existing || existing.length === 0) return incoming;
  return incoming;
}

export function mergeResume(existing: Resume, incoming: Resume, selection: ProfileSelection): Resume {
  const result: Record<string, unknown> = { ...existing };

  for (const section of selection.sections) {
    const incomingSection = (incoming as Record<string, unknown>)[section];
    const existingSection = (existing as Record<string, unknown>)[section];

    if (section === "basics") {
      if (typeof incomingSection === "object" && incomingSection !== null) {
        const merged = typeof existingSection === "object" && existingSection !== null
          ? mergeObject(existingSection as Record<string, unknown>, incomingSection as Record<string, unknown>)
          : incomingSection;
        result[section] = merged;
      }
    } else if (section === "work" || section === "education" || section === "skills" || section === "languages") {
      if (Array.isArray(incomingSection)) {
        result[section] = mergeArray(
          existingSection as readonly unknown[] | undefined,
          incomingSection as readonly unknown[]
        );
      }
    }
  }

  if (selection.fields && selection.fields.length > 0) {
    for (const fieldPath of selection.fields) {
      const parts = fieldPath.split(".");
      if (parts.length === 2 && parts[0] === "basics") {
        const field = parts[1];
        if (!field) continue;
        const incomingBasics = incoming.basics as Record<string, unknown> | undefined;
        const incomingValue = incomingBasics?.[field];
        if (isNonEmpty(incomingValue)) {
          const existingBasics = (result.basics as Record<string, unknown>) ?? {};
          result.basics = { ...existingBasics, [field]: incomingValue };
        }
      }
    }
  }

  return result as Resume;
}

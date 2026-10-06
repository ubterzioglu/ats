import { z } from "zod";

import { resumeSchema } from "@/lib/resume/schema";

const MAX_FIELD_LENGTH = 1000;
const MAX_RESUME_SIZE = 50000;
const MAX_EXTRAS_SIZE = 10000;

function truncateString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function sanitizeResumeStrings(resume: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(resume)) {
    if (typeof value === "string") {
      result[key] = truncateString(value, MAX_FIELD_LENGTH);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeResumeStrings(item as Record<string, unknown>)
          : typeof item === "string"
            ? truncateString(item, MAX_FIELD_LENGTH)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeResumeStrings(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function safeParseProfileResume(data: unknown): { ok: true; resume: Record<string, unknown> } | { ok: false; error: string } {
  const sanitized = typeof data === "object" && data !== null
    ? sanitizeResumeStrings(data as Record<string, unknown>)
    : {};

  const serialized = JSON.stringify(sanitized);
  if (serialized.length > MAX_RESUME_SIZE) {
    return { ok: false, error: "resume-too-large" };
  }

  const parsed = resumeSchema.safeParse(sanitized);
  if (!parsed.success) {
    return { ok: false, error: "resume-invalid" };
  }

  return { ok: true, resume: sanitized };
}

export function safeParseProfileExtras(data: unknown): { ok: true; extras: Record<string, unknown> } | { ok: false; error: string } {
  if (typeof data !== "object" || data === null) {
    return { ok: true, extras: {} };
  }

  const serialized = JSON.stringify(data);
  if (serialized.length > MAX_EXTRAS_SIZE) {
    return { ok: false, error: "extras-too-large" };
  }

  return { ok: true, extras: data as Record<string, unknown> };
}

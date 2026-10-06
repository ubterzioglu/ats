"use server";

import { requireUser } from "@/lib/auth/require-user";
import { safeParseProfileExtras, safeParseProfileResume } from "@/lib/profile/schema";
import { deleteProfile, readProfile, upsertProfile } from "@/lib/supabase/profile";

export type LoadProfileOutcome =
  | { readonly state: "loaded"; readonly profile: { resume: Record<string, unknown>; extras: Record<string, unknown> } }
  | { readonly state: "empty" }
  | { readonly state: "env-missing" }
  | { readonly state: "error" };

export type SaveProfileOutcome =
  | { readonly state: "saved" }
  | { readonly state: "env-missing" }
  | { readonly state: "invalid-input"; readonly error: string }
  | { readonly state: "error" };

export async function loadProfile(): Promise<LoadProfileOutcome> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { state: "error" };
  }

  const outcome = await readProfile(user.id);
  if (!outcome.ok) {
    if (outcome.reason === "env-missing") return { state: "env-missing" };
    return { state: "error" };
  }

  if (!outcome.profile) return { state: "empty" };

  return {
    state: "loaded",
    profile: {
      resume: outcome.profile.resume as Record<string, unknown>,
      extras: outcome.profile.extras
    }
  };
}

export async function saveProfile(input: {
  resume: unknown;
  extras?: unknown;
}): Promise<SaveProfileOutcome> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { state: "error" };
  }

  const resumeResult = safeParseProfileResume(input.resume);
  if (!resumeResult.ok) {
    return { state: "invalid-input", error: resumeResult.error };
  }

  const extrasResult = safeParseProfileExtras(input.extras ?? {});
  if (!extrasResult.ok) {
    return { state: "invalid-input", error: extrasResult.error };
  }

  const outcome = await upsertProfile(user.id, resumeResult.resume as never, extrasResult.extras);
  if (!outcome.ok) {
    if (outcome.reason === "env-missing") return { state: "env-missing" };
    return { state: "error" };
  }

  return { state: "saved" };
}

export async function removeProfile(): Promise<SaveProfileOutcome> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { state: "error" };
  }

  const outcome = await deleteProfile(user.id);
  if (!outcome.ok) {
    if (outcome.reason === "env-missing") return { state: "env-missing" };
    return { state: "error" };
  }

  return { state: "saved" };
}

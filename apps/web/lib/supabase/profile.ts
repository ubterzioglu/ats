import "server-only";

import { createServiceClient } from "./client";
import type { ProfileRow } from "@/lib/profile/types";
import type { Resume } from "@/types/resume";

export type ReadProfileOutcome =
  | { readonly ok: true; readonly profile: ProfileRow | null }
  | { readonly ok: false; readonly reason: "env-missing" | "read-failed" };

export type UpsertProfileOutcome =
  | { readonly ok: true; readonly profile: ProfileRow }
  | { readonly ok: false; readonly reason: "env-missing" | "upsert-failed" };

export type DeleteProfileOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "delete-failed" };

export async function readProfile(userId: string): Promise<ReadProfileOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return { ok: true, profile: null };
      console.error("[profile] read failed", error.message);
      return { ok: false, reason: "read-failed" };
    }

    return { ok: true, profile: data as ProfileRow };
  } catch (cause) {
    console.error("[profile] read failed", cause instanceof Error ? cause.message : String(cause));
    return { ok: false, reason: "read-failed" };
  }
}

export async function upsertProfile(
  userId: string,
  resume: Resume,
  extras: Record<string, unknown>
): Promise<UpsertProfileOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          resume,
          extras,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[profile] upsert failed", error.message);
      return { ok: false, reason: "upsert-failed" };
    }

    return { ok: true, profile: data as ProfileRow };
  } catch (cause) {
    console.error("[profile] upsert failed", cause instanceof Error ? cause.message : String(cause));
    return { ok: false, reason: "upsert-failed" };
  }
}

export async function deleteProfile(userId: string): Promise<DeleteProfileOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[profile] delete failed", error.message);
      return { ok: false, reason: "delete-failed" };
    }

    return { ok: true };
  } catch (cause) {
    console.error("[profile] delete failed", cause instanceof Error ? cause.message : String(cause));
    return { ok: false, reason: "delete-failed" };
  }
}

import "server-only";

import type { FeedbackInput } from "@/lib/feedback-schema";

import { createServiceClient } from "./client";

export type FeedbackOutcome =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly error: string };

export async function submitFeedback(
  input: FeedbackInput,
  clientHash: string | null
): Promise<FeedbackOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "storage-unavailable" };

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      category: input.category,
      message: input.message,
      email: input.email,
      locale: input.locale ?? null,
      client_hash: clientHash
    })
    .select("id")
    .single();

  if (error) {
    console.error("[feedback] submit error", error);
    return { ok: false, error: "submit-failed" };
  }

  return { ok: true, id: data.id };
}

export async function countRecentFeedback(clientHash: string): Promise<number> {
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

  try {
    const { count, error } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("client_hash", clientHash)
      .gte("created_at", oneHourAgo);

    if (error) {
      console.error("[feedback] count failed", error);
      return 0;
    }

    return count ?? 0;
  } catch (cause) {
    console.error("[feedback] count threw", cause);
    return 0;
  }
}

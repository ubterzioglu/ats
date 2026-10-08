import "server-only";

import { FEEDBACK_STATUSES, type FeedbackCategory, type FeedbackStatus } from "@/lib/feedback-schema";

import { createServiceClient } from "./client";

export interface FeedbackEntry {
  readonly id: string;
  readonly created_at: string;
  readonly category: FeedbackCategory;
  readonly message: string;
  readonly email: string | null;
  readonly locale: string | null;
  readonly status: FeedbackStatus;
  readonly handled_at: string | null;
  readonly handled_by: string | null;
}

function isFeedbackStatus(value: string | undefined): value is FeedbackStatus {
  return FEEDBACK_STATUSES.some((status) => status === value);
}

export async function getFeedback(status?: string): Promise<FeedbackEntry[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (isFeedbackStatus(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin] getFeedback error", error);
    return [];
  }

  return (data as FeedbackEntry[] | null) ?? [];
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  handledBy: string
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("feedback")
    .update({
      status,
      handled_by: handledBy,
      handled_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("[admin] updateFeedbackStatus error", error);
    return false;
  }

  return true;
}

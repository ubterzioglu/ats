import "server-only";

import { createServiceClient } from "./client";
import { z } from "zod";

// A7: Stricter limits
export const dataRequestSchema = z.object({
  email: z.string().email().max(254).transform((e) => e.toLowerCase().trim()),
  type: z.enum(["access", "rectification", "erasure", "other"]),
  description: z.string().min(10).max(2000)
});

export type DataRequestInput = z.infer<typeof dataRequestSchema>;

export type DataRequestOutcome =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function submitDataRequest(
  input: DataRequestInput,
  clientHash: string | null
): Promise<DataRequestOutcome> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "Database not configured" };
  }

  const { data, error } = await supabase
    .from("data_requests")
    .insert({
      email: input.email,
      type: input.type,
      description: input.description,
      status: "pending",
      client_hash: clientHash
    })
    .select("id")
    .single();

  if (error) {
    console.error("[data-request] submit error", error);
    return { ok: false, error: "Failed to submit request" };
  }

  return { ok: true, id: data.id };
}

export async function countRecentDataRequests(
  clientHash: string
): Promise<number> {
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

  try {
    const { count, error } = await supabase
      .from("data_requests")
      .select("*", { count: "exact", head: true })
      .eq("client_hash", clientHash)
      .gte("created_at", oneHourAgo);

    if (error) {
      console.error("[data-request] count failed", error);
      return 0;
    }

    return count ?? 0;
  } catch (cause) {
    console.error("[data-request] count threw", cause);
    return 0;
  }
}

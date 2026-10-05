import "server-only";

import { createServiceClient } from "./client";
import { z } from "zod";

export const dataRequestSchema = z.object({
  email: z.string().email(),
  type: z.enum(["access", "rectification", "erasure", "other"]),
  description: z.string().min(10).max(5000)
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

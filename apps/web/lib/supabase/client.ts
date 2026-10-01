import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseEnv {
  readonly url: string;
  readonly serviceRoleKey: string;
}

/**
 * Returns null when the project has no Supabase configured. Every caller must
 * handle that: persistence is an optional extra here, never a requirement.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function isPersistenceConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

/** Service-role client. It bypasses RLS, so validate before every write. */
export function createServiceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

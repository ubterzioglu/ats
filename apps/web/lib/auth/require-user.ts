import "server-only";

import { createClient } from "@/lib/supabase/server";

interface AuthUser {
  readonly id: string;
  readonly email: string | undefined;
  readonly email_confirmed_at: string | null;
}

export async function requireUser(): Promise<AuthUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("auth-required");
  }

  if (!data.user.email_confirmed_at) {
    throw new Error("email-not-confirmed");
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
    email_confirmed_at: data.user.email_confirmed_at
  };
}

export async function getApiUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user || !data.user.email_confirmed_at) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? undefined,
      email_confirmed_at: data.user.email_confirmed_at
    };
  } catch {
    return null;
  }
}

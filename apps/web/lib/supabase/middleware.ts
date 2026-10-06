import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

interface AuthUser {
  readonly email_confirmed_at?: string | null;
}

interface UpdateSessionResult {
  readonly response: NextResponse;
  readonly user: AuthUser | null;
}

/**
 * Refreshes the auth token and writes any rotated cookies onto a response that
 * was already built elsewhere - the locale middleware produces it, and starting
 * a second one here would discard the rewrite it just decided on.
 *
 * Supabase is optional. With no credentials configured the response passes
 * through untouched rather than throwing on every request, and user is null.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<UpdateSessionResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) return { response, user: null };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      }
    }
  });

  const { data } = await supabase.auth.getUser();

  return { response, user: data.user };
}

import "server-only";

import { notFound, redirect } from "next/navigation";

import { createServiceClient } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export function parseAdminEmails(env: string | undefined): readonly string[] {
  if (!env) return [];
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

// ADMIN_EMAILS is a bootstrap fallback; the admin_users table is the source of truth.
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();

  const supabase = createServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("admin_users")
      .select("email")
      .eq("email", normalized)
      .maybeSingle();
    if (error) {
      console.error("[admin] admin_users lookup failed", error);
    } else if (data) {
      return true;
    }
  }

  return parseAdminEmails(process.env.ADMIN_EMAILS).includes(normalized);
}

export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/admin");
  }

  if (!data.user.email_confirmed_at) {
    notFound();
  }

  if (!(await isAdminEmail(data.user.email))) {
    notFound();
  }

  return data.user.email!;
}

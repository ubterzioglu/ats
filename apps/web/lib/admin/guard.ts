import "server-only";

import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export function parseAdminEmails(env: string | undefined): readonly string[] {
  if (!env) return [];
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

// A9: Made synchronous
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = parseAdminEmails(process.env.ADMIN_EMAILS);
  return admins.includes(email.toLowerCase());
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

  const isAdmin = isAdminEmail(data.user.email);
  if (!isAdmin) {
    notFound();
  }

  return data.user.email!;
}

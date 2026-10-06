"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect as redirectExternal } from "next/navigation";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { safeNext } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

import type { LoginMessageKey } from "./messages";

async function backToLogin(message: LoginMessageKey, next?: string | null): Promise<void> {
  const locale = await getLocale();
  const query: Record<string, string> = { message };
  if (next) query.next = next;
  redirect({ href: { pathname: "/login", query }, locale });
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const next = formData.get("next");
  const nextString = typeof next === "string" ? next : null;

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (error) await backToLogin("invalidCredentials", nextString);

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: safeNext(nextString), locale });
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const next = formData.get("next");
  const nextString = typeof next === "string" ? next : null;
  const nextParam = nextString ? `?next=${encodeURIComponent(nextString)}` : "";

  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    options: { emailRedirectTo: `${origin}/auth/confirm${nextParam}` }
  });

  await backToLogin(error ? "signupFailed" : "checkYourEmail", nextString);
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const next = formData.get("next");
  const nextString = typeof next === "string" ? next : null;
  const nextParam = nextString ? `?next=${encodeURIComponent(nextString)}` : "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm${nextParam}` }
  });

  if (error || !data.url) {
    await backToLogin("signupFailed", nextString);
    return;
  }

  // data.url is Google's consent page, an external address, so it bypasses the
  // locale-aware redirect.
  redirectExternal(data.url as Route);
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    String(formData.get("email") ?? ""),
    { redirectTo: `${origin}/auth/confirm?next=/reset-password` }
  );

  const locale = await getLocale();
  redirect({ href: { pathname: "/login", query: { message: error ? "signupFailed" : "checkYourEmail" } }, locale });
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: String(formData.get("password") ?? "")
  });

  if (error) {
    const locale = await getLocale();
    redirect({ href: { pathname: "/reset-password", query: { message: "signupFailed" } }, locale });
  }

  revalidatePath("/", "layout");
  redirect({ href: "/analyze", locale: await getLocale() });
}

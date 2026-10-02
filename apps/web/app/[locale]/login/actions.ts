"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

import type { LoginMessageKey } from "./messages";

async function backToLogin(message: LoginMessageKey): Promise<void> {
  redirect({ href: { pathname: "/login", query: { message } }, locale: await getLocale() });
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (error) await backToLogin("invalidCredentials");

  revalidatePath("/", "layout");
  redirect({ href: "/analyze", locale: await getLocale() });
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    options: { emailRedirectTo: `${origin}/auth/confirm` }
  });

  await backToLogin(error ? "signupFailed" : "checkYourEmail");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect({ href: "/", locale: await getLocale() });
}

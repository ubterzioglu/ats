"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = encodeURIComponent("Kullanıcı adı veya şifre hatalı.");
    return redirect(`/login?message=${msg}` as any);
  }

  revalidatePath("/", "layout");
  redirect("/analyze");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Create site URL for the confirmation link
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    const msg = encodeURIComponent("Kayıt olurken bir hata oluştu: " + error.message);
    return redirect(`/login?message=${msg}` as any);
  }

  const msg = encodeURIComponent("Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.");
  return redirect(`/login?message=${msg}` as any);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email"
];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (OTP_TYPES as readonly string[]).includes(value);
}

/**
 * `next` arrives in a link sent by email, so it is restricted to a path on this
 * site. Passed to `new URL` unchecked, "//example.com" would redirect offsite.
 */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/analyze";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  // `next` already carries its locale prefix when it came from the sign-in
  // page, so it is used as given.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  // The login page looks the key up in its own language; the sentence is not
  // carried in the URL.
  return NextResponse.redirect(new URL("/login?message=linkExpired", request.url));
}

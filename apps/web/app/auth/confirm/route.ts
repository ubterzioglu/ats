import { type EmailOtpType } from "@supabase/supabase-js";
import { after, type NextRequest, NextResponse } from "next/server";

import { requestOrigin } from "@/lib/auth/origin";
import { notifySignup } from "@/lib/notify/notify-signup";
import type { NotifiableUser } from "@/lib/notify/signup-mail";
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

/**
 * Runs after the redirect is sent, so a slow or failing mail server never
 * holds up or breaks a sign-in. notifySignup decides whether the user is new.
 */
function announceSignup(user: NotifiableUser | null, type: string | null): void {
  if (!user || type === "email_change") return;
  try {
    after(() => notifySignup(user));
  } catch (cause) {
    console.error("[notify] could not schedule signup notification", cause);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  const origin = requestOrigin(request);
  const supabase = await createClient();

  // `next` already carries its locale prefix when it came from the sign-in
  // page, so it is used as given.
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      announceSignup(data.user, type);
      return NextResponse.redirect(new URL(next, origin));
    }
  } else if (tokenHash && isOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      announceSignup(data.user, type);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // The login page looks the key up in its own language; the sentence is not
  // carried in the URL.
  return NextResponse.redirect(new URL("/login?message=linkExpired", origin));
}

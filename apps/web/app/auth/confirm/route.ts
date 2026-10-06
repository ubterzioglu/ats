import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
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

function extractLocale(pathname: string): string {
  const match = pathname.match(new RegExp(`^/(${routing.locales.join("|")})(/|$)`));
  if (match?.[1]) return match[1];
  return routing.defaultLocale;
}

function withLocale(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const locale = extractLocale(next);
      return NextResponse.redirect(new URL(withLocale(next, locale), request.url));
    }
  } else if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const locale = extractLocale(next);
      return NextResponse.redirect(new URL(withLocale(next, locale), request.url));
    }
  }

  // The login page looks the key up in its own language; the sentence is not
  // carried in the URL.
  return NextResponse.redirect(new URL("/login?message=linkExpired", request.url));
}

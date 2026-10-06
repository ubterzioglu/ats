import "server-only";

import type { MailEnv } from "@/lib/notify/mail-env";

export interface NotifiableUser {
  readonly email?: string | undefined;
  readonly email_confirmed_at?: string | undefined;
  readonly app_metadata?: { readonly provider?: string | undefined } | undefined;
}

export interface OutgoingMail {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

// A user who confirmed their email this recently is treated as new. Later
// sign-ins, password resets and a second click on the link all fall outside it.
const NEW_WINDOW_MS = 2 * 60 * 1000;

// Supabase stamps the confirmation and this host reads its own clock; a little
// skew must not read as "not new".
const CLOCK_SKEW_MS = 60 * 1000;

const SUBJECT = "Yeni kayıt";

export function isNewlyConfirmed(user: NotifiableUser, now: Date): boolean {
  if (!user.email_confirmed_at) return false;
  const confirmedAt = Date.parse(user.email_confirmed_at);
  if (Number.isNaN(confirmedAt)) return false;
  const age = now.getTime() - confirmedAt;
  return age >= -CLOCK_SKEW_MS && age <= NEW_WINDOW_MS;
}

export function buildSignupMail(user: NotifiableUser, env: MailEnv, now: Date): OutgoingMail {
  const provider = user.app_metadata?.provider ?? "email";
  const text = [
    "Yeni bir kullanıcı kaydını onayladı.",
    "",
    `E-posta: ${user.email ?? "bilinmiyor"}`,
    `Sağlayıcı: ${provider}`,
    `Zaman: ${now.toISOString()}`
  ].join("\n");

  return { from: env.from, to: env.to, subject: SUBJECT, text };
}

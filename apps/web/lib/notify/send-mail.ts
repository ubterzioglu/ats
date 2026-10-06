import "server-only";

import nodemailer from "nodemailer";

import type { MailEnv } from "@/lib/notify/mail-env";
import type { OutgoingMail } from "@/lib/notify/signup-mail";

export type SendMailOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "send-failed" };

const SEND_TIMEOUT_MS = 10_000;

// The raw nodemailer error carries the sender and recipient addresses; log only
// what is needed to tell an auth failure from a network one.
function describeSendError(cause: unknown): string {
  if (typeof cause !== "object" || cause === null) return "unknown error";
  const { code, responseCode, command } = cause as Record<string, unknown>;
  return [code, responseCode, command].filter((part) => part !== undefined).join(" ") || "unknown error";
}

export async function sendMail(env: MailEnv, mail: OutgoingMail): Promise<SendMailOutcome> {
  try {
    const secure = env.port === 465;
    const transport = nodemailer.createTransport({
      host: env.host,
      port: env.port,
      secure,
      // On a STARTTLS port, refuse to send the password if the upgrade is not offered.
      requireTLS: !secure,
      auth: { user: env.user, pass: env.pass },
      connectionTimeout: SEND_TIMEOUT_MS,
      greetingTimeout: SEND_TIMEOUT_MS,
      socketTimeout: SEND_TIMEOUT_MS
    });
    await transport.sendMail(mail);
    return { ok: true };
  } catch (cause) {
    console.error("[notify] send failed", describeSendError(cause));
    return { ok: false, reason: "send-failed" };
  }
}

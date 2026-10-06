import "server-only";

import { getMailEnv, type MailEnv } from "@/lib/notify/mail-env";
import { sendMail, type SendMailOutcome } from "@/lib/notify/send-mail";
import {
  buildSignupMail,
  isNewlyConfirmed,
  type NotifiableUser,
  type OutgoingMail
} from "@/lib/notify/signup-mail";

export type NotifySignupOutcome =
  | { readonly sent: true }
  | { readonly sent: false; readonly reason: "not-new" | "env-missing" | "send-failed" };

export interface NotifySignupPorts {
  readonly sendMail: (env: MailEnv, mail: OutgoingMail) => Promise<SendMailOutcome>;
  readonly getMailEnv: () => MailEnv | null;
  readonly now: () => Date;
}

const defaultPorts: NotifySignupPorts = {
  sendMail,
  getMailEnv,
  now: () => new Date()
};

export async function notifySignup(
  user: NotifiableUser,
  ports: NotifySignupPorts = defaultPorts
): Promise<NotifySignupOutcome> {
  const now = ports.now();
  if (!isNewlyConfirmed(user, now)) return { sent: false, reason: "not-new" };

  const env = ports.getMailEnv();
  if (!env) return { sent: false, reason: "env-missing" };

  try {
    const outcome = await ports.sendMail(env, buildSignupMail(user, env, now));
    return outcome.ok ? { sent: true } : { sent: false, reason: "send-failed" };
  } catch (cause) {
    console.error("[notify] signup notification threw", cause);
    return { sent: false, reason: "send-failed" };
  }
}

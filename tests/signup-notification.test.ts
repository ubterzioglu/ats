import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMailEnv, type MailEnv } from "@/lib/notify/mail-env";
import { notifySignup } from "@/lib/notify/notify-signup";
import {
  buildSignupMail,
  isNewlyConfirmed,
  type NotifiableUser
} from "@/lib/notify/signup-mail";

const NOW = new Date("2026-10-06T12:00:00.000Z");

const ENV: MailEnv = {
  host: "smtp.zoho.com",
  port: 465,
  user: "bot@example.com",
  pass: "secret",
  from: "bot@example.com",
  to: "owner@example.com"
};

function userConfirmedSecondsAgo(seconds: number): NotifiableUser {
  return {
    email: "new@example.com",
    email_confirmed_at: new Date(NOW.getTime() - seconds * 1000).toISOString(),
    app_metadata: { provider: "google" }
  };
}

describe("isNewlyConfirmed", () => {
  it("is true for an email confirmed 30 seconds ago", () => {
    expect(isNewlyConfirmed(userConfirmedSecondsAgo(30), NOW)).toBe(true);
  });

  it("is false for an email confirmed a day ago", () => {
    expect(isNewlyConfirmed(userConfirmedSecondsAgo(86_400), NOW)).toBe(false);
  });

  it("is false when the email was never confirmed", () => {
    expect(isNewlyConfirmed({ email: "x@example.com" }, NOW)).toBe(false);
  });

  it("is false for an unparseable timestamp", () => {
    expect(isNewlyConfirmed({ email: "x@example.com", email_confirmed_at: "nope" }, NOW)).toBe(
      false
    );
  });

  it("is false for a timestamp far in the future", () => {
    expect(isNewlyConfirmed(userConfirmedSecondsAgo(-600), NOW)).toBe(false);
  });

  it("tolerates a few seconds of clock skew", () => {
    expect(isNewlyConfirmed(userConfirmedSecondsAgo(-20), NOW)).toBe(true);
  });

  it("holds the window edge at two minutes", () => {
    expect(isNewlyConfirmed(userConfirmedSecondsAgo(120), NOW)).toBe(true);
    expect(isNewlyConfirmed(userConfirmedSecondsAgo(121), NOW)).toBe(false);
  });
});

describe("buildSignupMail", () => {
  it("addresses the owner from the configured sender with a fixed subject", () => {
    const mail = buildSignupMail(userConfirmedSecondsAgo(5), ENV, NOW);
    expect(mail.to).toBe("owner@example.com");
    expect(mail.from).toBe("bot@example.com");
    expect(mail.subject).toBe("Yeni kayıt");
  });

  it("names the email, provider and time in a plain-text body", () => {
    const mail = buildSignupMail(userConfirmedSecondsAgo(5), ENV, NOW);
    expect(mail.text).toContain("new@example.com");
    expect(mail.text).toContain("google");
    expect(mail.text).toContain(NOW.toISOString());
    expect(mail).not.toHaveProperty("html");
  });

  it("keeps a hostile address out of the subject", () => {
    const user: NotifiableUser = { email: "a@b.c\r\nBcc: evil@example.com" };
    const mail = buildSignupMail(user, ENV, NOW);
    expect(mail.subject).toBe("Yeni kayıt");
  });

  it("falls back to email as the provider", () => {
    const mail = buildSignupMail({ email: "x@example.com" }, ENV, NOW);
    expect(mail.text).toContain("email");
  });
});

describe("getMailEnv", () => {
  const KEYS = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "SIGNUP_NOTIFY_TO"
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of KEYS) saved[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  function fill() {
    process.env.SMTP_HOST = "smtp.zoho.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "bot@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "bot@example.com";
    process.env.SIGNUP_NOTIFY_TO = "owner@example.com";
  }

  it("returns the settings when every variable is set", () => {
    fill();
    expect(getMailEnv()).toEqual(ENV);
  });

  it("returns null when one variable is missing", () => {
    fill();
    delete process.env.SMTP_PASS;
    expect(getMailEnv()).toBeNull();
  });

  it("returns null when the port is not a number", () => {
    fill();
    process.env.SMTP_PORT = "abc";
    expect(getMailEnv()).toBeNull();
  });
});

describe("notifySignup", () => {
  function ports(overrides: Partial<Parameters<typeof notifySignup>[1]> = {}) {
    return {
      sendMail: vi.fn().mockResolvedValue({ ok: true }),
      getMailEnv: vi.fn().mockReturnValue(ENV),
      now: () => NOW,
      ...overrides
    };
  }

  it("sends once for a freshly confirmed user", async () => {
    const p = ports();
    const outcome = await notifySignup(userConfirmedSecondsAgo(10), p);
    expect(outcome).toEqual({ sent: true });
    expect(p.sendMail).toHaveBeenCalledTimes(1);
  });

  it("does not send for a user confirmed long ago", async () => {
    const p = ports();
    const outcome = await notifySignup(userConfirmedSecondsAgo(86_400), p);
    expect(outcome).toEqual({ sent: false, reason: "not-new" });
    expect(p.sendMail).not.toHaveBeenCalled();
  });

  it("skips quietly when mail settings are missing", async () => {
    const p = ports({ getMailEnv: vi.fn().mockReturnValue(null) });
    const outcome = await notifySignup(userConfirmedSecondsAgo(10), p);
    expect(outcome).toEqual({ sent: false, reason: "env-missing" });
    expect(p.sendMail).not.toHaveBeenCalled();
  });

  it("reports a failed send without throwing", async () => {
    const p = ports({
      sendMail: vi.fn().mockResolvedValue({ ok: false, reason: "send-failed" })
    });
    const outcome = await notifySignup(userConfirmedSecondsAgo(10), p);
    expect(outcome).toEqual({ sent: false, reason: "send-failed" });
  });

  it("does not throw when the sender itself throws", async () => {
    const p = ports({ sendMail: vi.fn().mockRejectedValue(new Error("boom")) });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const outcome = await notifySignup(userConfirmedSecondsAgo(10), p);
    expect(outcome).toEqual({ sent: false, reason: "send-failed" });
    spy.mockRestore();
  });
});

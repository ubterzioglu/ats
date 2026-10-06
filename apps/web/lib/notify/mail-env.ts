import "server-only";

export interface MailEnv {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly pass: string;
  readonly from: string;
  readonly to: string;
}

export function getMailEnv(): MailEnv | null {
  const host = process.env.SMTP_HOST;
  const portText = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const to = process.env.SIGNUP_NOTIFY_TO;
  if (!host || !portText || !user || !pass || !from || !to) return null;

  const port = Number(portText);
  if (!Number.isInteger(port) || port <= 0) return null;

  return { host, port, user, pass, from, to };
}

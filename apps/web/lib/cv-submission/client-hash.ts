import { createHash } from "node:crypto";

export function clientHash(ip: string | null): string | null {
  const salt = process.env.CLIENT_HASH_SALT;
  if (!salt || !ip) return null;
  return createHash("sha256").update(ip + salt).digest("hex");
}

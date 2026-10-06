export const USERS_PER_PAGE = 50;

export interface DirectoryUser {
  readonly id: string;
  readonly email: string | null;
  readonly providers: readonly string[];
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
  readonly emailConfirmed: boolean;
}

export interface DirectoryCounts {
  readonly total: number;
  readonly confirmed: number;
  readonly google: number;
  readonly email: number;
}

/** The subset of a Supabase Auth user this directory reads. Everything else is dropped. */
export interface AuthUserLike {
  readonly id: string;
  readonly email?: string | null;
  readonly created_at: string;
  readonly last_sign_in_at?: string | null;
  readonly email_confirmed_at?: string | null;
  readonly app_metadata?: unknown;
  readonly identities?: readonly unknown[] | null;
}

function stringsFrom(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function field(value: unknown, key: string): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
}

/**
 * app_metadata.providers lists every linked provider; identities is the fallback
 * for accounts created before Supabase started filling that array.
 */
export function detectProviders(appMetadata: unknown, identities: readonly unknown[] | null | undefined): readonly string[] {
  const found = [
    ...stringsFrom(field(appMetadata, "providers")),
    ...stringsFrom(field(appMetadata, "provider")),
    ...(identities ?? []).flatMap((identity) => stringsFrom(field(identity, "provider")))
  ];
  const normalized = found.map((provider) => provider.trim().toLowerCase()).filter((provider) => provider.length > 0);
  return [...new Set(normalized)].sort();
}

export function toDirectoryUser(user: AuthUserLike): DirectoryUser {
  return {
    id: user.id,
    email: user.email ?? null,
    providers: detectProviders(user.app_metadata, user.identities),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at)
  };
}

export function countUsers(users: readonly DirectoryUser[]): DirectoryCounts {
  return {
    total: users.length,
    confirmed: users.filter((user) => user.emailConfirmed).length,
    google: users.filter((user) => user.providers.includes("google")).length,
    email: users.filter((user) => user.providers.includes("email")).length
  };
}

export function sortNewestFirst(users: readonly DirectoryUser[]): readonly DirectoryUser[] {
  return [...users].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function pageCount(total: number, perPage: number = USERS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/** Reads ?page= and clamps it to [1, pageCount]; anything unparseable is page 1. */
export function clampPage(raw: string | readonly string[] | undefined, total: number, perPage: number = USERS_PER_PAGE): number {
  const value = typeof raw === "string" ? raw : raw?.[0];
  const parsed = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : 1;
  return Math.min(Math.max(1, parsed), pageCount(total, perPage));
}

export function pageSlice(
  users: readonly DirectoryUser[],
  page: number,
  perPage: number = USERS_PER_PAGE
): readonly DirectoryUser[] {
  const start = (page - 1) * perPage;
  return users.slice(start, start + perPage);
}

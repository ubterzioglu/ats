import "server-only";

import { type AuthUserLike, type DirectoryUser, sortNewestFirst, toDirectoryUser } from "@/lib/admin/user-directory";

import { createServiceClient } from "./client";

const FETCH_PAGE_SIZE = 1000;
// Counts need every account, so the directory reads all pages; this caps the
// work at 20,000 accounts and flags the result as truncated beyond that.
const MAX_FETCH_PAGES = 20;

interface ListUsersResult {
  readonly data: { readonly users: readonly AuthUserLike[] } | null;
  readonly error: unknown;
}

/** The one Auth admin call this module makes; the service client satisfies it. */
export interface AuthUserLister {
  readonly auth: {
    readonly admin: {
      listUsers(params: { page: number; perPage: number }): Promise<ListUsersResult>;
    };
  };
}

export interface UserDirectory {
  readonly users: readonly DirectoryUser[];
  readonly truncated: boolean;
}

const EMPTY: UserDirectory = { users: [], truncated: false };

/**
 * Every registered account, newest first, reduced to the fields the admin
 * directory shows. Returns an empty directory when Supabase is not configured
 * or the Auth admin API fails; it never throws.
 */
export async function getUserDirectory(
  client: AuthUserLister | null = createServiceClient()
): Promise<UserDirectory> {
  if (!client) return EMPTY;

  const collected: DirectoryUser[] = [];
  try {
    for (let page = 1; page <= MAX_FETCH_PAGES; page += 1) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: FETCH_PAGE_SIZE });
      if (error) {
        console.error("[admin] listUsers failed", error);
        return EMPTY;
      }
      const users = data?.users ?? [];
      collected.push(...users.map(toDirectoryUser));
      if (users.length < FETCH_PAGE_SIZE) {
        return { users: sortNewestFirst(collected), truncated: false };
      }
    }
  } catch (cause) {
    console.error("[admin] listUsers threw", cause);
    return EMPTY;
  }

  return { users: sortNewestFirst(collected), truncated: true };
}

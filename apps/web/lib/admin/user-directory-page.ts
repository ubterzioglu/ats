import "server-only";

import { logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import {
  clampPage,
  countUsers,
  type DirectoryCounts,
  type DirectoryUser,
  pageCount,
  pageSlice
} from "@/lib/admin/user-directory";
import { getUserDirectory } from "@/lib/supabase/admin-users";

export interface UserDirectoryPage {
  readonly counts: DirectoryCounts;
  readonly page: number;
  readonly pages: number;
  readonly rows: readonly DirectoryUser[];
  readonly truncated: boolean;
}

/**
 * Guards, reads and audits one view of the admin user directory. The guard
 * runs first, so a non-admin never triggers the Auth admin read or a log entry.
 */
export async function loadUserDirectoryPage(rawPage: string | readonly string[] | undefined): Promise<UserDirectoryPage> {
  const adminEmail = await requireAdmin();
  const directory = await getUserDirectory();
  const counts = countUsers(directory.users);
  const page = clampPage(rawPage, counts.total);

  await logAdminAction(adminEmail, "user_list", undefined, `page=${page}`);

  return {
    counts,
    page,
    pages: pageCount(counts.total),
    rows: pageSlice(directory.users, page),
    truncated: directory.truncated
  };
}

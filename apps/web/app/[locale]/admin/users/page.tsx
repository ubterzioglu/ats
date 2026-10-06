import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import { loadUserDirectoryPage } from "@/lib/admin/user-directory-page";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

interface UsersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  const { page: rawPage } = await searchParams;
  const { counts, page, pages, rows, truncated } = await loadUserDirectoryPage(rawPage);
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.users" });

  const formatDate = (value: string | null): string =>
    value ? new Date(value).toLocaleString(locale) : t("never");

  const stats = [
    { label: t("countTotal"), value: counts.total },
    { label: t("countConfirmed"), value: counts.confirmed },
    { label: t("countEmail"), value: counts.email },
    { label: t("countGoogle"), value: counts.google }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
        <p className="text-muted mt-2">{t("description")}</p>
        <p className="text-sm text-muted mt-2">{t("auditNote")}</p>
      </div>

      <AdminNav locale={locale} />

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bed border border-line rounded-lg px-4 py-3">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="text-2xl font-semibold text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {truncated ?<p className="mt-4 text-sm text-caution">{t("truncated")}</p> : null}

      <div className="mt-8 bg-bed border border-line rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bed border-b border-line">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("email")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("providers")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("created")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("lastSignIn")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("confirmed")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={user.id} className="border-b border-line">
                  <td className="px-4 py-3 text-sm text-ink">{user.email ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {user.providers.length > 0 ? user.providers.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-ink">{formatDate(user.lastSignInAt)}</td>
                  <td className="px-4 py-3 text-sm text-ink">{user.emailConfirmed ? t("yes") : t("no")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label={t("pagination")}>
          {page > 1 ? (
            <Link href={`/admin/users?page=${page - 1}`} className="text-ink hover:text-iris">
              {t("previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">{t("pageOf", { page, pages })}</span>
          {page < pages ? (
            <Link href={`/admin/users?page=${page + 1}`} className="text-ink hover:text-iris">
              {t("next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}

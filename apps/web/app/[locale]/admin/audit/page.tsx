import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/guard";
import { getAuditLog } from "@/lib/supabase/admin-audit";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

interface AuditPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AuditPage({ params }: AuditPageProps) {
  await requireAdmin();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.audit" });

  const entries = await getAuditLog();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
        <p className="text-muted mt-2">{t("description")}</p>
      </div>

      <AdminNav locale={locale} />

      <div className="mt-8 bg-bed border border-line rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-bed border-b border-line">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("time")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("admin")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("action")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("submission")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("detail")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {t("noEntries")}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-line hover:bg-bed/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">
                    {new Date(entry.at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{entry.admin_email}</td>
                  <td className="px-4 py-3 text-sm text-ink">{entry.action}</td>
                  <td className="px-4 py-3 text-sm text-ink font-mono">
                    {entry.submission_id ? entry.submission_id.slice(0, 8) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{entry.detail ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

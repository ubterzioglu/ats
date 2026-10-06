import { getTranslations } from "next-intl/server";
import { listSubmissions } from "@/lib/supabase/admin-submissions";
import { Link } from "@/i18n/navigation";

interface SubmissionsTableProps {
  filters: { [key: string]: string | string[] | undefined };
}

export async function SubmissionsTable({ filters }: SubmissionsTableProps) {
  const t = await getTranslations({ locale: "en", namespace: "admin.table" });
  
  const page = typeof filters.page === "string" ? parseInt(filters.page, 10) : 1;
  const { submissions, total } = await listSubmissions({
    q: typeof filters.q === "string" ? filters.q : undefined,
    band: typeof filters.band === "string" ? filters.band : undefined,
    language: typeof filters.language === "string" ? filters.language : undefined,
    driveStatus: typeof filters.driveStatus === "string" ? filters.driveStatus : undefined,
    page,
    pageSize: 25
  });

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-4">
      <div className="bg-bed border border-line rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-bed border-b border-line">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("created")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("file")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("language")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("score")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("band")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("drive")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("expires")}</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {t("noSubmissions")}
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-line hover:bg-bed/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    <Link href={`/admin/submissions/${sub.id}`} className="hover:text-iris transition-colors">
                      {sub.file_name ?? "Text"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{sub.language ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink">{sub.total ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink">{sub.band ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <DriveStatusBadge status={sub.drive_status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {new Date(sub.expires_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin?page=${p}`}
              className={`px-3 py-1 rounded text-sm ${
                p === page
                  ? "bg-iris text-white"
                  : "bg-bed border border-line text-ink hover:bg-iris/10"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function DriveStatusBadge({ status }: { status: string }) {
  const colors = {
    uploaded: "bg-good/20 text-good",
    failed: "bg-caution/20 text-caution",
    skipped: "bg-muted/20 text-muted",
    pending: "bg-muted/20 text-muted"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] ?? colors.pending}`}>
      {status}
    </span>
  );
}

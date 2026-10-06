"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataRequest } from "@/lib/supabase/admin-requests";
import { updateRequestStatusAction } from "./actions";

interface RequestsClientProps {
  requests: DataRequest[];
  locale: string;
}

export function RequestsClient({ requests, locale }: RequestsClientProps) {
  const t = useTranslations("admin.requests");
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleUpdate(id: string, status: "done" | "rejected") {
    setUpdating(id);
    const result = await updateRequestStatusAction(id, status);
    if (result.ok) {
      router.refresh();
    } else {
      alert(t("updateFailed"));
    }
    setUpdating(null);
  }

  function handleFilter(status: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`/${locale}/admin/requests${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => handleFilter("")} className="btn-quiet text-sm">
          {t("all")}
        </button>
        <button onClick={() => handleFilter("open")} className="btn-quiet text-sm">
          {t("open")}
        </button>
        <button onClick={() => handleFilter("done")} className="btn-quiet text-sm">
          {t("done")}
        </button>
        <button onClick={() => handleFilter("rejected")} className="btn-quiet text-sm">
          {t("rejected")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-bed border border-line rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-bed border-b border-line">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("created")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("email")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("type")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("message")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("status")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {t("noRequests")}
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b border-line hover:bg-bed/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{req.email}</td>
                  <td className="px-4 py-3 text-sm text-ink">{req.type}</td>
                  <td className="px-4 py-3 text-sm text-ink max-w-xs truncate">{req.description}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {req.status === "open" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(req.id, "done")}
                          disabled={updating === req.id}
                          className="btn-quiet text-xs disabled:opacity-50"
                        >
                          {t("markDone")}
                        </button>
                        <button
                          onClick={() => handleUpdate(req.id, "rejected")}
                          disabled={updating === req.id}
                          className="btn-quiet text-xs text-caution disabled:opacity-50"
                        >
                          {t("markRejected")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    open: "bg-signal/20 text-signal",
    done: "bg-good/20 text-good",
    rejected: "bg-caution/20 text-caution"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] ?? "bg-muted/20 text-muted"}`}>
      {status}
    </span>
  );
}

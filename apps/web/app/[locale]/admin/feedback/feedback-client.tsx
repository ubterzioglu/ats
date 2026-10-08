"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback-schema";
import type { FeedbackEntry } from "@/lib/supabase/admin-feedback";

import { updateFeedbackStatusAction } from "./actions";

interface FeedbackClientProps {
  readonly entries: readonly FeedbackEntry[];
  readonly locale: string;
  readonly activeStatus: string;
}

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: "bg-signal/20 text-signal",
  read: "bg-good/20 text-good",
  archived: "bg-muted/20 text-muted"
};

export function FeedbackClient({ entries, locale, activeStatus }: FeedbackClientProps) {
  const t = useTranslations("admin.feedback");
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function handleUpdate(id: string, status: FeedbackStatus) {
    setUpdating(id);
    setFailed(false);
    const result = await updateFeedbackStatusAction(id, status);
    if (result.ok) {
      router.refresh();
    } else {
      setFailed(true);
    }
    setUpdating(null);
  }

  function handleFilter(status: string) {
    router.push(`/${locale}/admin/feedback${status ? `?status=${status}` : ""}`);
  }

  const filters: readonly string[] = ["", ...FEEDBACK_STATUSES];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => handleFilter(value)}
            aria-pressed={activeStatus === value}
            className={`btn-quiet text-sm ${activeStatus === value ? "text-iris" : ""}`}
          >
            {value ? t(`status.${value as FeedbackStatus}`) : t("all")}
          </button>
        ))}
      </div>

      {failed ? (
        <p role="alert" className="text-sm text-caution">
          {t("updateFailed")}
        </p>
      ) : null}

      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="rounded-lg border border-line bg-bed px-4 py-8 text-center text-muted">{t("empty")}</p>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="rounded-lg border border-line bg-bed p-4">
              <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>
                  {t(`status.${entry.status}`)}
                </span>
                <span className="font-medium text-ink">{t(`category.${entry.category}`)}</span>
                <span className="text-muted">{new Date(entry.created_at).toLocaleString(locale)}</span>
                <span className="text-muted">{entry.email ?? t("anonymous")}</span>
                {entry.locale ? <span className="uppercase text-muted">{entry.locale}</span> : null}
              </header>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-ink">{entry.message}</p>
              <div className="mt-3 flex gap-2">
                {FEEDBACK_STATUSES.filter((status) => status !== entry.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void handleUpdate(entry.id, status)}
                    disabled={updating === entry.id}
                    className="btn-quiet text-xs disabled:opacity-50"
                  >
                    {t(`markAs.${status}`)}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

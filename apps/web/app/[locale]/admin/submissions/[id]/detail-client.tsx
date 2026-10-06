"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SubmissionDetail } from "@/lib/supabase/admin-detail";
import { deleteSubmissionAction, downloadSubmissionAction } from "./actions";

interface SubmissionDetailClientProps {
  submission: SubmissionDetail;
  locale: string;
}

export function SubmissionDetailClient({ submission, locale }: SubmissionDetailClientProps) {
  const t = useTranslations("admin.detail");
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDelete() {
    if (!confirm(t("confirmDelete"))) return;
    setDeleting(true);
    const result = await deleteSubmissionAction(submission.id);
    if (result.ok) {
      window.location.href = `/${locale}/admin`;
    } else {
      alert(t("deleteFailed"));
      setDeleting(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    const result = await downloadSubmissionAction(submission.id);
    if (result.ok) {
      window.open(result.url, "_blank");
    } else {
      alert(t("downloadFailed"));
    }
    setDownloading(false);
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="bg-bed border border-line rounded-lg p-6">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("metadata")}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted">{t("created")}</dt>
            <dd className="text-ink">{new Date(submission.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t("expires")}</dt>
            <dd className="text-ink">{new Date(submission.expires_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t("file")}</dt>
            <dd className="text-ink">{submission.file_name ?? "Text only"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t("size")}</dt>
            <dd className="text-ink">{submission.file_size ? `${(submission.file_size / 1024).toFixed(1)} KB` : "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t("language")}</dt>
            <dd className="text-ink">{submission.language ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t("driveStatus")}</dt>
            <dd className="text-ink">{submission.drive_status}</dd>
          </div>
        </dl>
      </div>

      {/* Score and findings */}
      {submission.result && (
        <div className="bg-bed border border-line rounded-lg p-6">
          <h2 className="text-xl font-semibold text-ink mb-4">{t("score")}</h2>
          <div className="mb-4">
            <span className="text-4xl font-bold text-iris">{submission.total}</span>
            <span className="text-muted text-lg"> / 100</span>
            {submission.band && <span className="ml-4 text-ink">({submission.band})</span>}
          </div>
          {submission.result.findings && submission.result.findings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted mb-2">{t("findings")}</h3>
              <ul className="space-y-2">
                {submission.result.findings.slice(0, 10).map((finding, i) => (
                  <li key={i} className="text-sm text-ink">
                    {finding.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CV text */}
      <div className="bg-bed border border-line rounded-lg p-6">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("cvText")}</h2>
        <pre className="bg-void border border-line rounded p-4 text-sm text-ink overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
          {submission.cv_text}
        </pre>
      </div>

      {/* Job description */}
      {submission.job_description && (
        <div className="bg-bed border border-line rounded-lg p-6">
          <h2 className="text-xl font-semibold text-ink mb-4">{t("jobDescription")}</h2>
          <pre className="bg-void border border-line rounded p-4 text-sm text-ink overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
            {submission.job_description}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn disabled:opacity-50"
        >
          {downloading ? t("downloading") : t("download")}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger disabled:opacity-50"
        >
          {deleting ? t("deleting") : t("delete")}
        </button>
      </div>
    </div>
  );
}

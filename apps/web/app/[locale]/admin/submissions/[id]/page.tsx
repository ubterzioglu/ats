import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/guard";
import { getSubmissionDetail } from "@/lib/supabase/admin-detail";
import { logAdminAction } from "@/lib/admin/audit";
import { AdminNav } from "../../admin-nav";
import { SubmissionDetailClient } from "./detail-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

interface SubmissionDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const adminEmail = await requireAdmin();
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "admin.detail" });

  const submission = await getSubmissionDetail(id);
  if (!submission) {
    notFound();
  }

  // Log view action
  await logAdminAction(adminEmail, "view", id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
        <p className="text-muted mt-2">{t("subtitle", { id })}</p>
      </div>

      <AdminNav locale={locale} />

      <div className="mt-8">
        <SubmissionDetailClient submission={submission} locale={locale} />
      </div>
    </div>
  );
}

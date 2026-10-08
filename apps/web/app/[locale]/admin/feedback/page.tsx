import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/lib/admin/guard";
import { getFeedback } from "@/lib/supabase/admin-feedback";

import { AdminNav } from "../admin-nav";

import { FeedbackClient } from "./feedback-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

interface AdminFeedbackPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminFeedbackPage({ params, searchParams }: AdminFeedbackPageProps) {
  await requireAdmin();
  const { locale } = await params;
  const { status } = await searchParams;
  const t = await getTranslations({ locale, namespace: "admin.feedback" });

  const entries = await getFeedback(status);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("description")}</p>
      </div>

      <AdminNav locale={locale} />

      <div className="mt-8">
        <FeedbackClient entries={entries} locale={locale} activeStatus={status ?? ""} />
      </div>
    </div>
  );
}

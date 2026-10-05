import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/guard";
import { getDataRequests } from "@/lib/supabase/admin-requests";
import { AdminNav } from "../admin-nav";
import { RequestsClient } from "./requests-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

interface RequestsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function RequestsPage({ params, searchParams }: RequestsPageProps) {
  await requireAdmin();
  const { locale } = await params;
  const { status } = await searchParams;
  const t = await getTranslations({ locale, namespace: "admin.requests" });

  const requests = await getDataRequests(status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
        <p className="text-muted mt-2">{t("description")}</p>
      </div>

      <AdminNav locale={locale} />

      <div className="mt-8">
        <RequestsClient requests={requests} locale={locale} />
      </div>
    </div>
  );
}

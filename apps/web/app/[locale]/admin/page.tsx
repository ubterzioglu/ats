import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminNav } from "./admin-nav";
import { StatsCards } from "./stats-cards";
import { SubmissionsTable } from "./submissions-table";
import { FiltersBar } from "./filters-bar";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  await requireAdmin();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const filters = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
        <p className="text-muted mt-2">{t("description")}</p>
      </div>

      <AdminNav locale={locale} />

      <div className="mt-8 space-y-8">
        <StatsCards />
        <FiltersBar />
        <SubmissionsTable filters={filters} />
      </div>
    </div>
  );
}

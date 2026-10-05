import { getTranslations } from "next-intl/server";
import { getAdminStats } from "@/lib/supabase/admin-stats";

export async function StatsCards() {
  const stats = await getAdminStats();
  const t = await getTranslations({ locale: "en", namespace: "admin.stats" });

  const cards = [
    { label: t("today"), value: stats.todaySubmissions },
    { label: t("week"), value: stats.weekSubmissions },
    { label: t("month"), value: stats.monthSubmissions },
    { label: t("total"), value: stats.totalSubmissions },
    { label: t("avgScore"), value: stats.averageScore !== null ? Math.round(stats.averageScore) : "—" },
    { label: t("driveFailures"), value: stats.driveFailures },
    { label: t("openRequests"), value: stats.openRequests }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-bed border border-line rounded-lg p-4">
          <div className="text-sm text-muted mb-1">{card.label}</div>
          <div className="text-2xl font-bold text-ink">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

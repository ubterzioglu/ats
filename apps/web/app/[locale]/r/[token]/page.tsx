import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkList } from "@/components/bench/work-list";
import { KeywordPanel } from "@/components/keyword-panel";
import { MeasureRail } from "@/components/bench/measure-rail";
import { Link } from "@/i18n/navigation";
import { loadReport } from "@/lib/supabase/reports";

interface SharedReportPageProps {
  readonly params: Promise<{ readonly locale: string; readonly token: string }>;
}

export async function generateMetadata({
  params
}: SharedReportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("sharedReportTitle"),
    robots: { index: false, follow: false }
  };
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { token } = await params;
  const outcome = await loadReport(token);

  if (outcome.state !== "found") notFound();

  const { report } = outcome;
  const t = await getTranslations("sharedReport");
  const brand = await getTranslations("brand");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 border-b border-line pb-6">
        <p className="readout">{t("eyebrow", { date: report.generatedAt.slice(0, 10) })}</p>
        <h1 className="mt-2 font-mono text-lg font-medium tracking-tight">{brand("name")}</h1>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("lede")}</p>
      </header>

      <div className="space-y-5">
        <MeasureRail result={report} />
        <WorkList findings={report.findings} />
        <KeywordPanel report={report.keywords} />
      </div>

      <p className="mt-10 border-t border-line pt-6 text-sm text-muted">
        <Link className="underline underline-offset-2 transition-colors hover:text-ink" href="/">
          {t("cta")}
        </Link>
      </p>
    </main>
  );
}

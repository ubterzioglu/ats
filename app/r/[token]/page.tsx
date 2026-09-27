import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FixList } from "@/components/fix-list";
import { KeywordPanel } from "@/components/keyword-panel";
import { ScoreRail } from "@/components/score-rail";
import { loadReport } from "@/lib/supabase/reports";

export const metadata: Metadata = {
  title: "Shared report",
  robots: { index: false, follow: false }
};

interface SharedReportPageProps {
  readonly params: Promise<{ readonly token: string }>;
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { token } = await params;
  const outcome = await loadReport(token);

  if (outcome.state !== "found") notFound();

  const { report } = outcome;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 border-b border-line pb-6">
        <p className="font-mono text-xs text-muted">shared report · {report.generatedAt.slice(0, 10)}</p>
        <h1 className="mt-2 font-mono text-lg font-medium tracking-tight">ats readability</h1>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
          Scores and advice only. The CV itself was never stored.
        </p>
      </header>

      <div className="space-y-6">
        <ScoreRail result={report} />
        <FixList findings={report.findings} />
        <KeywordPanel report={report.keywords} />
      </div>

      <p className="mt-10 border-t border-line pt-6 text-sm text-muted">
        <Link className="underline underline-offset-2 hover:text-ink" href="/">
          Run your own CV through it
        </Link>
      </p>
    </main>
  );
}

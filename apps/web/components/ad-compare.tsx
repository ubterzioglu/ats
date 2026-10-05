"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { compareAds, type AdComparisonResult } from "@/lib/scoring/compare";
import { buildContext } from "@/lib/scoring/context";
import { listJobs } from "@/lib/store/jobs";
import type { JobRecord } from "@/lib/store/schema";
import { cx } from "@/lib/ui";

interface AdCompareViewProps {
  readonly cvText: string;
}

export function AdCompareView({ cvText }: AdCompareViewProps) {
  const t = useTranslations("adCompare");
  const [jobs, setJobs] = useState<readonly JobRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listJobs().then((outcome) => {
      if (!cancelled) {
        if (outcome.ok) setJobs(outcome.value);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (jobs.length === 0 || cvText.trim().length < 120) return [];
    try {
      const context = buildContext(cvText);
      return compareAds(
        context,
        jobs.map((j) => j.rawText)
      );
    } catch {
      return [];
    }
  }, [cvText, jobs]);

  const handleDelete = useCallback(
    async (id: string) => {
      const { deleteJob } = await import("@/lib/store/jobs");
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    },
    []
  );

  if (!loaded) {
    return <div className="animate-pulse h-32 rounded-md bg-bench-sunk" />;
  }

  if (jobs.length === 0) {
    return (
      <section className="bench px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("heading")}</h2>
        <p className="mt-2 text-sm text-muted">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("heading")}</h2>
        <p className="mt-2 max-w-measure text-sm text-muted">{t("lede")}</p>
      </div>

      <div className="divide-y divide-line">
        {results.map((r, i) => (
          <AdCompareRow
            key={jobs[i]?.id ?? i}
            result={r}
            job={jobs[i]}
            rank={i + 1}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
}

interface AdCompareRowProps {
  readonly result: AdComparisonResult;
  readonly job: JobRecord | undefined;
  readonly rank: number;
  readonly onDelete: (id: string) => void;
}

function AdCompareRow({ result, job, rank, onDelete }: AdCompareRowProps) {
  const t = useTranslations("adCompare");

  if (!job) return null;

  return (
    <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-edge text-ink font-mono text-sm tabular-nums">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-normal text-ink">{job.title}</p>
        <p className="text-sm text-muted">{job.companyName}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs">
          <span className="font-mono tabular-nums">
            {t("matchScore", { score: result.matchScore })}
          </span>
          <span className="font-mono tabular-nums text-muted">
            {t("coverage", { percent: Math.round(result.keywordCoverage * 100) })}
          </span>
          <span className="font-mono tabular-nums text-muted">
            {t("passed", {
              count: result.suitability.filter((s) => s.status === "passed").length,
              total: result.suitability.length
            })}
          </span>
        </div>
        {result.ad.redFlags.length > 0 ? (
          <p className="mt-1 text-xs text-caution">
            {t("redFlagsCount", { count: result.ad.redFlags.length })}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDelete(job.id)}
        className="shrink-0 text-muted transition-colors hover:text-mark"
        aria-label={t("delete")}
      >
        ×
      </button>
    </div>
  );
}

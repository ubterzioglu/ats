"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { listJobs } from "@/lib/store/jobs";
import type { JobRecord } from "@/lib/store/schema";

interface LearningListProps {
  readonly cvText: string;
}

interface MissingEntry {
  readonly term: string;
  readonly count: number;
  readonly ads: readonly string[];
}

export function LearningList({ cvText }: LearningListProps) {
  const t = useTranslations("learningList");
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

  const entries = useMemo(() => {
    if (jobs.length === 0 || cvText.trim().length < 120) return [];

    const freq = new Map<string, { count: number; ads: string[] }>();

    for (const job of jobs) {
      try {
        const result = analyzeCv({ cvText, jobDescription: job.rawText });
        for (const term of result.keywords.missing) {
          const existing = freq.get(term.term);
          if (existing) {
            freq.set(term.term, {
              count: existing.count + 1,
              ads: [...existing.ads, job.title]
            });
          } else {
            freq.set(term.term, { count: 1, ads: [job.title] });
          }
        }
      } catch {
        continue;
      }
    }

    const result: MissingEntry[] = [];
    for (const [term, data] of freq) {
      result.push({ term, count: data.count, ads: data.ads });
    }

    return result
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.term.localeCompare(b.term);
      })
      .slice(0, 20);
  }, [cvText, jobs]);

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

  if (entries.length === 0) {
    return (
      <section className="bench px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("heading")}</h2>
        <p className="mt-2 text-sm text-muted">{t("allCovered")}</p>
      </section>
    );
  }

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("heading")}</h2>
        <p className="mt-2 max-w-measure text-sm text-muted">{t("lede")}</p>
      </div>

      <ol className="divide-y divide-line">
        {entries.map((entry) => (
          <li key={entry.term} className="flex items-baseline gap-4 px-5 py-3 sm:px-6">
            <span className="font-mono text-sm tabular-nums text-muted">
              {entry.count}×
            </span>
            <div className="min-w-0">
              <p className="font-normal text-ink">{entry.term}</p>
              <p className="truncate text-xs text-muted">
                {entry.ads.join(", ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

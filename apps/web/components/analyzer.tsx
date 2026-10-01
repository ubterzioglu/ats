"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { createShareLink } from "@/app/actions";
import { extractDocument, type ExtractionResult } from "@/lib/extract";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { analyzeCv } from "@/lib/scoring";
import { cx } from "@/lib/ui";
import type { AnalysisResult } from "@/types/analysis";

import { DocumentIntake } from "./document-intake";
import { FixList } from "./fix-list";
import { KeywordPanel } from "./keyword-panel";
import { ParserView } from "./parser-view";
import { ScoreRail } from "./score-rail";

type View = "input" | "report";

interface AnalyzerProps {
  readonly sharingEnabled: boolean;
}

const MIN_CV_CHARS = 120;

export function Analyzer({ sharingEnabled }: AnalyzerProps) {
  const [cvText, setCvText] = useState("");
  const [jobAd, setJobAd] = useState("");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [view, setView] = useState<View>("input");
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, startSharing] = useTransition();

  const handleFile = useCallback(async (file: File) => {
    setReading(true);
    setError(null);
    setNotice(null);

    try {
      const output = await extractDocument(file);
      setExtraction(output);
      setCvText(output.text);
      setNotice(output.warning ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That file could not be read.");
      setExtraction(null);
    } finally {
      setReading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (cvText.trim().length < MIN_CV_CHARS) {
      setError("Add the CV text first — at least a few lines are needed to judge anything.");
      return;
    }

    setReading(true);
    setError(null);
    setShareUrl(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobDescription: jobAd }),
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      setResult(data);
      setView("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run analysis.");
    } finally {
      setReading(false);
    }
  }, [cvText, jobAd]);

  const highlights = useMemo(
    () => (result ? result.keywords.matched.map((term) => term.term) : []),
    [result]
  );

  function downloadReport() {
    if (!result) return;
    const blob = new Blob([buildMarkdownReport(result)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ats-report-${result.total}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function share() {
    if (!result) return;
    startSharing(async () => {
      const outcome = await createShareLink(result);
      if (outcome.state === "saved") {
        setShareUrl(outcome.url);
        setError(null);
        return;
      }
      setError(
        outcome.state === "env-missing"
          ? "Sharing needs Supabase credentials. Everything else works without them."
          : "The link could not be created. The report is still yours to download."
      );
    });
  }

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b border-line" aria-label="Sections">
        {(["input", "report"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            disabled={tab === "report" && !result}
            onClick={() => setView(tab)}
            className={cx(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              view === tab ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {tab === "input" ? "Document and job ad" : "Report"}
            {tab === "report" && result ? (
              <span className="ml-2 font-mono text-xs tabular-nums text-muted">{result.total}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {error ? (
        <p role="alert" className="rounded-sheet border border-mark/50 bg-mark/10 px-4 py-3 text-sm text-mark">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-sheet border border-caution/50 bg-caution/10 px-4 py-3 text-sm text-caution">
          {notice}
        </p>
      ) : null}

      {view === "input" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="sheet space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">The CV</h2>
              <p className="mt-1 max-w-measure text-sm leading-relaxed text-muted">
                Upload the exact file you send to employers. Whatever comes out below is what a parser gets.
              </p>
            </div>

            <DocumentIntake extraction={extraction} busy={reading} onFile={handleFile} />

            <label className="block">
              <span className="text-sm font-medium">Extracted text — edit it if something is off</span>
              <textarea
                className="field mt-2 min-h-[16rem] font-mono text-xs"
                value={cvText}
                onChange={(event) => setCvText(event.target.value)}
                placeholder="Paste the CV text here if you would rather not upload a file."
                spellCheck={false}
              />
            </label>
          </section>

          <section className="sheet flex flex-col gap-4 p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">The job ad</h2>
              <p className="mt-1 max-w-measure text-sm leading-relaxed text-muted">
                Optional, and the single biggest change to the result. With an ad the keyword score is measured
                against that vacancy instead of a generic skill list.
              </p>
            </div>

            <textarea
              className="field min-h-[20rem] flex-1 text-sm"
              value={jobAd}
              onChange={(event) => setJobAd(event.target.value)}
              placeholder="Paste the full posting, including the requirements list."
            />

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn" onClick={runAnalysis} disabled={reading}>
                Analyze
              </button>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  setCvText("");
                  setJobAd("");
                  setExtraction(null);
                  setResult(null);
                  setShareUrl(null);
                  setNotice(null);
                  setError(null);
                  setView("input");
                }}
              >
                Clear
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {view === "report" && result ? (
        <div className="space-y-6">
          <ScoreRail result={result} />

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={downloadReport}>
              Download report
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => navigator.clipboard.writeText(buildMarkdownReport(result))}
            >
              Copy as text
            </button>
            {sharingEnabled ? (
              <button type="button" className="btn-quiet" onClick={share} disabled={sharing}>
                {sharing ? "Creating link…" : "Create share link"}
              </button>
            ) : null}
            <button type="button" className="btn-quiet" onClick={() => setView("input")}>
              Edit and re-run
            </button>
          </div>

          {shareUrl ? (
            <p className="rounded-sheet border border-line bg-bed/50 px-4 py-3 text-sm">
              Shareable for 30 days, scores only — no CV text is stored:{" "}
              <a className="font-mono underline underline-offset-2" href={shareUrl}>
                {shareUrl}
              </a>
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <FixList findings={result.findings} />

            <div className="space-y-6">
              <KeywordPanel report={result.keywords} />
              <ParserView
                text={cvText}
                highlights={highlights}
                caption={`${result.stats.words} words · ${result.stats.lines} lines · ${result.language.toUpperCase()}`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

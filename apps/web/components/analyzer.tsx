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
  const [copied, setCopied] = useState(false);
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

  // Scoring runs here, in the browser. Sending the text to a server would break
  // the promise printed on the front page and in the privacy contract.
  const runAnalysis = useCallback(() => {
    if (cvText.trim().length < MIN_CV_CHARS) {
      setError("Add the CV text first — at least a few lines are needed to judge anything.");
      return;
    }

    setError(null);
    setShareUrl(null);

    try {
      setResult(analyzeCv({ cvText, jobDescription: jobAd }));
      setView("report");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The analysis could not be completed.");
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

  async function copyReport() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildMarkdownReport(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The clipboard is not available here. Download the report instead.");
    }
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

  function clearAll() {
    setCvText("");
    setJobAd("");
    setExtraction(null);
    setResult(null);
    setShareUrl(null);
    setNotice(null);
    setError(null);
    setView("input");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav
          className="inline-flex rounded-control border border-line bg-sheet p-1"
          aria-label="Sections"
        >
          {(["input", "report"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              disabled={tab === "report" && !result}
              onClick={() => setView(tab)}
              aria-current={view === tab ? "page" : undefined}
              className={cx(
                "rounded-[4px] px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                view === tab ? "bg-ink text-sheet" : "text-muted hover:text-ink"
              )}
            >
              {tab === "input" ? "Document and job ad" : "Report"}
              {tab === "report" && result ? (
                <span
                  className={cx(
                    "ml-2 font-mono text-xs tabular-nums",
                    view === tab ? "text-sheet/70" : "text-muted"
                  )}
                >
                  {result.total}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {result ? (
          <button type="button" className="text-sm text-muted transition-colors hover:text-ink" onClick={clearAll}>
            Start over
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-control border border-mark/35 bg-mark/[0.06] px-4 py-3 text-sm text-mark">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-control border border-caution/35 bg-caution/[0.07] px-4 py-3 text-sm text-caution">
          {notice}
        </p>
      ) : null}

      {view === "input" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="sheet space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">The CV</h2>
              <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
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
              <h2 className="text-base font-semibold">The job ad</h2>
              <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
                Optional, and the single biggest change to the result. With an ad the keyword score is
                measured against that vacancy instead of a generic skill list.
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
                {reading ? "Reading the file…" : "Analyze"}
              </button>
              <button type="button" className="btn-quiet" onClick={clearAll}>
                Clear
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {view === "report" && result ? (
        <div className="space-y-5">
          <ScoreRail result={result} />

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={downloadReport}>
              Download report
            </button>
            <button type="button" className="btn-quiet" onClick={copyReport}>
              {copied ? "Copied" : "Copy as text"}
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
            <p className="rounded-control border border-line bg-sheet px-4 py-3 text-sm">
              Shareable for 30 days, scores only — no CV text is stored:{" "}
              <a className="font-mono text-accent underline underline-offset-2" href={shareUrl}>
                {shareUrl}
              </a>
            </p>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <FixList findings={result.findings} />

            <div className="space-y-5">
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

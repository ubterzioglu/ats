"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { createShareLink } from "@/app/actions";
import { buildCoverageMap, type CoverageMapReport } from "@/lib/ai/coverage-map";
import type { Embedder } from "@/lib/ai/embeddings";
import { findPartialMatches, toPassages, type PartialMatchHint } from "@/lib/ai/semantic-match";
import { extractDocument, type ExtractionResult } from "@/lib/extract";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { analyzeCv } from "@/lib/scoring";
import { assessDocumentKind, type DocumentKindAssessment } from "@/lib/scoring/gate";
import { cx } from "@/lib/ui";
import type { AnalysisResult } from "@/types/analysis";

import { AiConsent } from "./ai-consent";
import { CoverageMap } from "./coverage-map";
import { DocumentIntake } from "./document-intake";
import { FixDrafts } from "./fix-drafts";
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
  const [previous, setPrevious] = useState<AnalysisResult | null>(null);
  const [view, setView] = useState<View>("input");
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gate, setGate] = useState<DocumentKindAssessment | null>(null);
  const [markedLine, setMarkedLine] = useState<string | null>(null);
  const [embedder, setEmbedder] = useState<Embedder | null>(null);
  const [hints, setHints] = useState<readonly PartialMatchHint[]>([]);
  const [coverage, setCoverage] = useState<CoverageMapReport | null>(null);
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
  const runAnalysis = useCallback(
    (force = false) => {
      if (cvText.trim().length < MIN_CV_CHARS) {
        setError("Add the CV text first — at least a few lines are needed to judge anything.");
        return;
      }

      const assessment = assessDocumentKind(cvText);
      if (!assessment.confident && !force) {
        setGate(assessment);
        return;
      }

      setGate(null);
      setError(null);
      setShareUrl(null);
      setMarkedLine(null);

      try {
        const next = analyzeCv({ cvText, jobDescription: jobAd });
        setPrevious(result);
        setResult(next);
        setHints([]);
        setCoverage(null);
        setView("report");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The analysis could not be completed.");
      }
    },
    [cvText, jobAd, result]
  );

  const highlights = useMemo(
    () => (result ? result.keywords.matched.map((term) => term.term) : []),
    [result]
  );

  // Semantic hints are advisory and asynchronous; the deterministic report is
  // already on screen when they arrive. A cancel flag keeps a stale run from
  // overwriting fresher hints.
  useEffect(() => {
    if (!embedder || !result || result.keywords.source !== "job-description") return;
    const missing = result.keywords.missing.map((term) => term.term);
    if (missing.length === 0) setHints([]);
    let cancelled = false;

    const hintWork =
      missing.length === 0
        ? Promise.resolve()
        : findPartialMatches(embedder, missing, toPassages(cvText))
            .then((found) => {
              if (!cancelled) setHints(found);
            })
            .catch(() => {
              if (!cancelled) setHints([]);
            });

    const coverageWork =
      jobAd.trim().length < MIN_CV_CHARS
        ? Promise.resolve()
        : buildCoverageMap(embedder, cvText, jobAd)
            .then((report) => {
              if (!cancelled) setCoverage(report);
            })
            .catch(() => {
              if (!cancelled) setCoverage(null);
            });

    void Promise.allSettled([hintWork, coverageWork]);
    return () => {
      cancelled = true;
    };
  }, [embedder, result, cvText, jobAd]);

  // Applying a rewrite draft edits the text and immediately re-measures it,
  // so the score rail can show what that one sentence was worth.
  const applyAndRescore = useCallback(
    (newText: string) => {
      setCvText(newText);
      setMarkedLine(null);
      try {
        const next = analyzeCv({ cvText: newText, jobDescription: jobAd });
        setPrevious(result);
        setResult(next);
      } catch {
        // The previous result stays on screen; the text edit is still applied.
      }
    },
    [jobAd, result]
  );

  // The engine is synchronous and cheap, so the score can follow the text
  // while it is being edited - debounced so a fast typist does not watch it
  // flicker on every keystroke.
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  useEffect(() => {
    if (cvText.trim().length < MIN_CV_CHARS) {
      setPreviewTotal(null);
      return;
    }
    const handle = window.setTimeout(() => {
      try {
        setPreviewTotal(analyzeCv({ cvText, jobDescription: jobAd }).total);
      } catch {
        setPreviewTotal(null);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [cvText, jobAd]);

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
    setPrevious(null);
    setShareUrl(null);
    setNotice(null);
    setGate(null);
    setMarkedLine(null);
    setHints([]);
    setCoverage(null);
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

      {gate ? (
        <div
          role="alert"
          className="rounded-control border border-caution/35 bg-caution/[0.07] px-4 py-3 text-sm"
        >
          <p className="text-caution">{gate.reason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={() => runAnalysis(true)}>
              Score anyway
            </button>
            <button type="button" className="btn-quiet" onClick={() => setGate(null)}>
              Back to the text
            </button>
          </div>
        </div>
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
              <button type="button" className="btn" onClick={() => runAnalysis()} disabled={reading}>
                {reading ? "Reading the file…" : "Analyze"}
              </button>
              {previewTotal !== null ? (
                <span className="readout" aria-live="polite">
                  preview <span className="text-ink tabular-nums">{previewTotal}</span>/100
                </span>
              ) : null}
              <button type="button" className="btn-quiet" onClick={clearAll}>
                Clear
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {view === "report" && result ? (
        <div className="space-y-5">
          <ScoreRail result={result} previous={previous} />

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
            <div className="space-y-5">
              <FixList findings={result.findings} onSelectEvidence={setMarkedLine} />
              <FixDrafts text={cvText} onApply={applyAndRescore} />
            </div>

            <div className="space-y-5">
              <KeywordPanel report={result.keywords} hints={hints} />
              <AiConsent onReady={setEmbedder} />
              {coverage && coverage.adChunks > 0 ? <CoverageMap report={coverage} /> : null}
              <ParserView
                text={cvText}
                highlights={highlights}
                markedLine={markedLine}
                caption={`${result.stats.words} words · ${result.stats.lines} lines · ${result.language.toUpperCase()}`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

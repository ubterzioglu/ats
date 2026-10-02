"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { createShareLink } from "@/app/actions";
import { buildCoverageMap, type CoverageMapReport } from "@/lib/ai/coverage-map";
import type { Embedder } from "@/lib/ai/embeddings";
import { acquireModel } from "@/lib/ai/model";
import type { ModelTier } from "@/lib/ai/providers/types";
import { findPartialMatches, toPassages, type PartialMatchHint } from "@/lib/ai/semantic-match";
import { explainFinding } from "@/lib/ai/tasks/explain";
import { extractDocument, type ExtractionResult } from "@/lib/extract";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { analyzeCv } from "@/lib/scoring";
import { assessDocumentKind, type DocumentKindAssessment } from "@/lib/scoring/gate";
import { readPreviousRecord, recordAnalysis } from "@/lib/store/history";
import type { HistoryRecord } from "@/lib/store/schema";
import { cx } from "@/lib/ui";
import type { AnalysisResult, Finding } from "@/types/analysis";

import { AiConsent } from "./ai-consent";
import { AiStatus } from "./ai-status";
import { DataControls } from "./data-controls";
import { DocumentIntake } from "./document-intake";
import { FixDrafts } from "./fix-drafts";
import { FixList } from "./fix-list";
import { KeywordPanel } from "./keyword-panel";
import { ParserView } from "./parser-view";
import { ReportChat } from "./report-chat";
import { RewriteDiff } from "./rewrite-diff";
import { MeasureRail } from "./bench/measure-rail";

type View = "input" | "report";

interface AnalyzerProps {
  readonly sharingEnabled: boolean;
}

const MIN_CV_CHARS = 120;

export function Analyzer({ sharingEnabled }: AnalyzerProps) {
  const t = useTranslations("analyzer");
  const [cvText, setCvText] = useState("");
  const [jobAd, setJobAd] = useState("");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previous, setPrevious] = useState<AnalysisResult | null>(null);
  const [lastVisit, setLastVisit] = useState<HistoryRecord | null>(null);
  const [view, setView] = useState<View>("input");
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gate, setGate] = useState<DocumentKindAssessment | null>(null);
  const [markedLine, setMarkedLine] = useState<string | null>(null);
  const [embedder, setEmbedder] = useState<Embedder | null>(null);
  const [modelTier, setModelTier] = useState<ModelTier>("none");
  const [hints, setHints] = useState<readonly PartialMatchHint[]>([]);
  const [coverage, setCoverage] = useState<CoverageMapReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, startSharing] = useTransition();

  // Read once, before this visit writes anything, so the comparison is against
  // the last visit rather than against the analysis just run.
  useEffect(() => {
    let cancelled = false;
    void readPreviousRecord().then((outcome) => {
      if (!cancelled && outcome.ok) setLastVisit(outcome.value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      setError(cause instanceof Error ? cause.message : t("errors.fileUnreadable"));
      setExtraction(null);
    } finally {
      setReading(false);
    }
  }, [t]);

  // Scoring runs here, in the browser. Sending the text to a server would break
  // the promise printed on the front page and in the privacy contract.
  const runAnalysis = useCallback(
    (force = false) => {
      if (cvText.trim().length < MIN_CV_CHARS) {
        setError(t("errors.tooShort"));
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
        // History is a convenience the report does not depend on, so a browser
        // that refuses local storage simply gets no comparison. DataControls is
        // where that refusal is stated.
        void recordAnalysis(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("errors.analysisFailed"));
      }
    },
    [cvText, jobAd, result, t]
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

  const explainLocally = useCallback(
    async (finding: Finding) => {
      const session = await acquireModel(modelTier);
      return explainFinding(session.model, finding);
    },
    [modelTier]
  );

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
      setError(t("errors.clipboard"));
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
      if (outcome.state === "auth-required") {
        setError(t("errors.shareAuthRequired"));
        return;
      }
      setError(t(outcome.state === "env-missing" ? "errors.shareEnvMissing" : "errors.shareFailed"));
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
          className="inline-flex rounded-control border border-line bg-bench p-1"
          aria-label={t("sections")}
        >
          {(["input", "report"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              disabled={tab === "report" && !result}
              onClick={() => setView(tab)}
              aria-current={view === tab ? "page" : undefined}
              className={cx(
                "rounded-chip px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                view === tab ? "bg-ink text-bench" : "text-muted hover:text-ink"
              )}
            >
              {t(tab === "input" ? "tabInput" : "tabReport")}
              {tab === "report" && result ? (
                <span
                  className={cx(
                    "ml-2 font-mono text-micro tabular-nums",
                    view === tab ? "text-bench/70" : "text-muted"
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
            {t("startOver")}
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
              {t("scoreAnyway")}
            </button>
            <button type="button" className="btn-quiet" onClick={() => setGate(null)}>
              {t("backToText")}
            </button>
          </div>
        </div>
      ) : null}

      {view === "input" ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="bench space-y-4 p-5 sm:p-6">
              <div>
                <h2 className="text-h3 font-semibold">{t("cvHeading")}</h2>
                <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
                  {t("cvLede")}
                </p>
              </div>

              <DocumentIntake extraction={extraction} busy={reading} onFile={handleFile} />

              <label className="block">
                <span className="condensed text-micro font-medium text-muted">
                  {t("extractedLabel")}
                </span>
                <textarea
                  className="field mt-2 min-h-[16rem] font-mono text-xs"
                  value={cvText}
                  onChange={(event) => setCvText(event.target.value)}
                  placeholder={t("extractedPlaceholder")}
                  spellCheck={false}
                />
              </label>
            </section>

            <section className="bench flex flex-col gap-4 p-5 sm:p-6">
              <div>
                <h2 className="text-h3 font-semibold">{t("adHeading")}</h2>
                <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
                  {t("adLede")}
                </p>
              </div>

              <textarea
                className="field min-h-[20rem] flex-1 text-sm"
                value={jobAd}
                onChange={(event) => setJobAd(event.target.value)}
                placeholder={t("adPlaceholder")}
              />
            </section>
          </div>

          {/* The action belongs to both surfaces above it, so it sits under
              both rather than inside the second column. */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn" onClick={() => runAnalysis()} disabled={reading}>
              {t(reading ? "readingFile" : "analyze")}
            </button>
            <button type="button" className="btn-quiet" onClick={clearAll}>
              {t("clear")}
            </button>
            {previewTotal !== null ? (
              <span className="text-micro text-muted" aria-live="polite">
                {t("previewLabel")}{" "}
                <span className="font-mono tabular-nums text-ink">{previewTotal}</span>
                <span className="font-mono tabular-nums">{t("previewOutOf")}</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {view === "report" && result ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={downloadReport}>
              {t("downloadReport")}
            </button>
            <button type="button" className="btn-quiet" onClick={copyReport}>
              {t(copied ? "copied" : "copyAsText")}
            </button>
            {sharingEnabled ? (
              <button type="button" className="btn-quiet" onClick={share} disabled={sharing}>
                {t(sharing ? "creatingLink" : "createShareLink")}
              </button>
            ) : null}
            <button type="button" className="btn-quiet" onClick={() => setView("input")}>
              {t("editAndRerun")}
            </button>
          </div>

          {shareUrl ? (
            <p className="rounded-control border border-line bg-bench px-4 py-3 text-sm">
              {t("shareNote")}{" "}
              <a className="font-mono text-action underline underline-offset-2" href={shareUrl}>
                {shareUrl}
              </a>
            </p>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <FixList
                findings={result.findings}
                onSelectEvidence={setMarkedLine}
                explain={modelTier === "none" ? undefined : explainLocally}
              />
              <RewriteDiff
                tier={modelTier}
                cvText={cvText}
                knownSkills={[...result.keywords.matched, ...result.keywords.missing].map(
                  (term) => term.term
                )}
                onApply={applyAndRescore}
              />
              <FixDrafts text={cvText} onApply={applyAndRescore} />
              <ReportChat tier={modelTier} result={result} />
            </div>

            <div className="space-y-5">
              <MeasureRail
                result={result}
                previous={previous ?? lastVisit}
                comparedTo={previous ? "previousRun" : "lastVisit"}
                sticky
              />
              <KeywordPanel report={result.keywords} hints={hints} coverage={coverage} />
              <AiConsent onReady={setEmbedder} />
              <AiStatus onTierChange={setModelTier} />
              <ParserView
                text={cvText}
                highlights={highlights}
                markedLine={markedLine}
                caption={t("parserCaption", {
                  words: result.stats.words,
                  lines: result.stats.lines,
                  language: result.language.toUpperCase()
                })}
              />
              <DataControls />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

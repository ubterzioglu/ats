"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { createShareLink } from "@/app/actions";
import { buildCoverageMap, type CoverageMapReport } from "@/lib/ai/coverage-map";
import type { Embedder } from "@/lib/ai/embeddings";
import { acquireModel } from "@/lib/ai/model";
import type { ModelTier } from "@/lib/ai/providers/types";
import { findPartialMatches, toPassages, type PartialMatchHint } from "@/lib/ai/semantic-match";
import { draftCoverLetter, type CoverLetterDraft } from "@/lib/ai/tasks/cover-letter";
import { explainFinding } from "@/lib/ai/tasks/explain";
import { rewriteBullets } from "@/lib/ai/tasks/rewrite";
import { extractDocument, type ExtractionResult } from "@/lib/extract";
import { buildMarkdownReport } from "@/lib/report/markdown";
import { describeChange, type ScoreChange } from "@/lib/bench/change";
import { draftForLine, findEvidenceLine } from "@/lib/bench/evidence";
import { analyzeCv } from "@/lib/scoring";
import { draftFixes } from "@/lib/scoring/drafts";
import { assessDocumentKind, type DocumentKindAssessment } from "@/lib/scoring/gate";
import { readPreviousRecord, recordAnalysis } from "@/lib/store/history";
import type { HistoryRecord, TrailPoint } from "@/lib/store/schema";
import { appendTrailPoint, readTrail, startNewSession } from "@/lib/store/trail";
import { cx } from "@/lib/ui";
import type { AnalysisResult, Finding, TargetMarket } from "@/types/analysis";

import { AdAnalysisPanel } from "./bench/ad-analysis-panel";
import { AiConsent } from "./ai-consent";
import { AiStatus } from "./ai-status";
import { CvConsent } from "./cv-consent";
import { MeasureRail } from "./bench/measure-rail";
import { AskDock } from "./bench/ask-dock";
import { ChangeNote } from "./bench/change-note";
import { EntriesTable } from "./bench/entries-table";
import { IdentityTable } from "./bench/identity-table";
import { ScoreTrail } from "./bench/score-trail";
import { StrengthsPanel } from "./bench/strengths-panel";
import { WorkList } from "./bench/work-list";
import { AdCompareView } from "./ad-compare";
import { DataControls } from "./data-controls";
import { DocumentIntake } from "./document-intake";
import { KeywordPanel } from "./keyword-panel";
import { LearningList } from "./learning-list";
import { OcrConsent } from "./ocr-consent";
import { ParserView } from "./parser-view";
import { InterviewMode } from "./interview/interview-mode";
import { TailorMode } from "./tailor/tailor-mode";
import { VariantComparison } from "./tailor/variant-comparison";
import { submitCv } from "@/lib/submit-cv";
import { setResult as setHelpResult } from "@/lib/help/result-holder";


type View = "input" | "report" | "tailor" | "compare" | "interview";

interface AnalyzerProps {
  readonly sharingEnabled: boolean;
}

const MIN_CV_CHARS = 120;

export function Analyzer({ sharingEnabled }: AnalyzerProps) {
  const t = useTranslations("analyzer");
  const tConsent = useTranslations("analyze");
  const locale = useLocale();
  const [cvText, setCvText] = useState("");
  const [jobAd, setJobAd] = useState("");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previous, setPrevious] = useState<AnalysisResult | null>(null);
  const [lastVisit, setLastVisit] = useState<HistoryRecord | null>(null);
  const [change, setChange] = useState<ScoreChange | null>(null);
  const [trail, setTrail] = useState<readonly TrailPoint[]>([]);
  const [view, setView] = useState<View>("input");
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gate, setGate] = useState<DocumentKindAssessment | null>(null);
  const [markedIndex, setMarkedIndex] = useState<number | null>(null);
  const [embedder, setEmbedder] = useState<Embedder | null>(null);
  const [modelTier, setModelTier] = useState<ModelTier>("none");
  const [hints, setHints] = useState<readonly PartialMatchHint[]>([]);
  const [coverage, setCoverage] = useState<CoverageMapReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, startSharing] = useTransition();
  const [consentChecked, setConsentChecked] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [market, setMarket] = useState<TargetMarket | undefined>(undefined);

  // Read once, before this visit writes anything, so the comparison is against
  // the last visit rather than against the analysis just run.
  useEffect(() => {
    let cancelled = false;
    void readPreviousRecord().then((outcome) => {
      if (!cancelled && outcome.ok) setLastVisit(outcome.value);
    });
    // The trail is keyed by a stored session id, so a reload picks the series
    // back up rather than starting a new one.
    void readTrail().then((outcome) => {
      if (!cancelled && outcome.ok) setTrail(outcome.value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the help bubble's result holder in sync with the latest analysis.
  useEffect(() => {
    setHelpResult(result);
  }, [result]);

  const handleFile = useCallback(async (file: File) => {
    setReading(true);
    setError(null);
    setNotice(null);
    setSourceFile(file);

    try {
      const output = await extractDocument(file);
      setExtraction(output);
      setCvText(output.text);
      setNotice(output.warning ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("errors.fileUnreadable"));
      setExtraction(null);
      setSourceFile(null);
    } finally {
      setReading(false);
    }
  }, [t]);

  // Scoring runs here, in the browser, so the score never depends on the server.
  // Storing the submission afterwards is a separate step (see AGENTS.md, privacy contract).
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
      setMarkedIndex(null);

      try {
        const extractionMeta = extraction
          ? {
              source: extraction.source,
              pages: extraction.pages,
              emptyPages: extraction.emptyPages ?? 0,
              links: extraction.links ?? []
            }
          : undefined;
        const next = analyzeCv({ cvText, jobDescription: jobAd, market, extraction: extractionMeta });
        setPrevious(result);
        setResult(next);
        setHints([]);
        setCoverage(null);
        setChange(null);
        setView("report");
        // History is a convenience the report does not depend on, so a browser
        // that refuses local storage simply gets no comparison. DataControls is
        // where that refusal is stated.
        void recordAnalysis(next);
        void appendTrailPoint(next.total).then((written) => {
          if (written.ok) setTrail((current) => [...current, written.value]);
        });

        // Submit CV to server (fire-and-forget)
        if (consentChecked) {
          void submitCv({
            file: sourceFile ?? undefined,
            cvText,
            jobDescription: jobAd.trim() ? jobAd : undefined,
            result: next
          });
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("errors.analysisFailed"));
      }
    },
    [cvText, jobAd, result, t, consentChecked, sourceFile, market, extraction]
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

  /**
   * A rule first, a model only when no rule matches. The deterministic drafts
   * are instant, need no download and cannot invent, so reaching for the model
   * when one applies would be slower and weaker at once.
   */
  const draftFix = useCallback(
    async (lineIndex: number, line: string): Promise<string | null> => {
      const rule = draftForLine(draftFixes(cvText), lineIndex);
      if (rule) return rule.replacement;
      if (modelTier === "none") return null;

      const prefix = line.match(/^\s*(?:[-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])?\s*/)?.[0] ?? "";
      const content = line.slice(prefix.length).trim();
      if (content.length === 0) return null;

      try {
        const session = await acquireModel(modelTier);
        const knownSkills = result
          ? [...result.keywords.matched, ...result.keywords.missing].map((term) => term.term)
          : [];
        const pairs = await rewriteBullets(
          session.model,
          [{ lineIndex, prefix, content }],
          knownSkills
        );
        const rewritten = pairs[0]?.rewritten;
        return rewritten ? `${prefix}${rewritten}` : null;
      } catch {
        return null;
      }
    },
    [cvText, modelTier, result]
  );

  // The letter's vocabulary is the report's own term lists, so what the model
  // may say is bounded by what the engine already measured.
  const draftLetter = useCallback(async (): Promise<CoverLetterDraft> => {
    const session = await acquireModel(modelTier);
    return draftCoverLetter(session.model, {
      cvText,
      jobAd,
      matchedTerms: (result?.keywords.matched ?? []).map((term) => term.term),
      missingTerms: (result?.keywords.missing ?? []).map((term) => term.term)
    });
  }, [cvText, jobAd, modelTier, result]);

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
      setMarkedIndex(null);
      try {
        const next = analyzeCv({ cvText: newText, jobDescription: jobAd });
        setPrevious(result);
        setResult(next);
        setChange(result ? describeChange(result, next) : null);
        void appendTrailPoint(next.total).then((written) => {
          if (written.ok) setTrail((current) => [...current, written.value]);
        });
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
    setChange(null);
    setTrail([]);
    void startNewSession();
    setShareUrl(null);
    setNotice(null);
    setGate(null);
    setMarkedIndex(null);
    setHints([]);
    setCoverage(null);
    setError(null);
    setView("input");
    setSourceFile(null);
    setMarket(undefined);
  }

  return (
    <div className="space-y-6">
      {/* Persistent live region for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {reading ? t("readingFile") : result ? t("tabReport") : ""}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav
          className="inline-flex gap-2"
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
                "inline-flex min-h-11 items-center border-b px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                view === tab ? "border-iris text-ink" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {t(tab === "input" ? "tabInput" : "tabReport")}
              {tab === "report" && result ? (
                <span
                  className={cx(
                    "ml-2 font-mono text-micro tabular-nums",
                    view === tab ? "text-saffron" : "text-muted"
                  )}
                >
                  {result.total}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {result ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink"
            onClick={clearAll}
          >
            {t("startOver")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="border-l-2 border-mark px-4 py-3 text-sm text-mark">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p aria-live="polite" className="border-l-2 border-caution px-4 py-3 text-sm text-caution">
          {notice}
        </p>
      ) : null}

      {gate ? (
        <div
          role="alert"
          className="border-l-2 border-caution px-4 py-3 text-sm"
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
                <h2 className="text-h3 font-normal">{t("cvHeading")}</h2>
                <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
                  {t("cvLede")}
                </p>
              </div>

              <DocumentIntake extraction={extraction} busy={reading} onFile={handleFile} />

              {extraction &&
              extraction.source === "pdf" &&
              extraction.pageTexts &&
              (extraction.emptyPages ?? 0) > 0 ? (
                <OcrConsent
                  file={sourceFile!}
                  pageTexts={extraction.pageTexts}
                  siteLocale={locale}
                  onResult={(text) => {
                    setCvText(text);
                    setExtraction({ ...extraction, text });
                  }}
                />
              ) : null}

              <label className="block">
                <span className="condensed text-micro font-normal text-muted">
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
                <h2 className="text-h3 font-normal">{t("adHeading")}</h2>
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

          {/* Consent gate */}
          <div className="space-y-3">
            <CvConsent checked={consentChecked} onChange={setConsentChecked} />
            {!consentChecked && (
              <p className="text-sm text-caution">{tConsent("consent.required")}</p>
            )}
          </div>

          {/* Market selector */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">{t("marketLabel")}</span>
              <select
                className="field py-1.5 text-sm"
                value={market ?? ""}
                onChange={(e) => setMarket(e.target.value ? (e.target.value as TargetMarket) : undefined)}
              >
                <option value="">{t("marketAuto")}</option>
                <option value="en">{t("marketEn")}</option>
                <option value="de">{t("marketDe")}</option>
                <option value="tr">{t("marketTr")}</option>
              </select>
            </label>
          </div>

          {/* The action belongs to both surfaces above it, so it sits under
              both rather than inside the second column. */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn" onClick={() => runAnalysis()} disabled={reading || !consentChecked}>
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
            {jobAd.trim().length > 0 ? (
              <button type="button" className="btn-quiet" onClick={() => setView("tailor")}>
                {t("tailorToAd")}
              </button>
            ) : null}
            <button type="button" className="btn-quiet" onClick={() => setView("compare")}>
              {t("compareAds")}
            </button>
            <button type="button" className="btn-quiet" onClick={() => setView("interview")}>
              {t("prepareInterview")}
            </button>
          </div>

          {shareUrl ? (
            <p className="border-l border-line pl-4 text-sm">
              {t("shareNote")}{" "}
              <a className="font-mono text-saffron underline underline-offset-2" href={shareUrl}>
                {shareUrl}
              </a>
            </p>
          ) : null}

          {/* Spine and rail. The work list is the dominant column because it
              is what the user came to do; everything that measures or explains
              sits beside it, narrower, and stays out of the way. */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              {change ? <ChangeNote change={change} onDismiss={() => setChange(null)} /> : null}
              <StrengthsPanel strengths={result.strengths ?? []} findings={result.findings} />
              <WorkList
                findings={result.findings}
                cvText={cvText}
                onApply={applyAndRescore}
                onSelectEvidence={(line) => setMarkedIndex(findEvidenceLine(cvText, line))}
                explain={modelTier === "none" ? undefined : explainLocally}
                draftFix={draftFix}
                draftIsLive={modelTier !== "none"}
              />
            </div>

            <div className="space-y-5 pb-28 lg:pb-32">
              <MeasureRail
                result={result}
                previous={previous ?? lastVisit}
                comparedTo={previous ? "previousRun" : "lastVisit"}
                sticky
              />
              <ScoreTrail points={trail} />
              <IdentityTable
                cvText={cvText}
                findings={result.findings}
                onSelectLine={setMarkedIndex}
              />
              <EntriesTable
                cvText={cvText}
                sections={result.sections}
                onSelectLine={setMarkedIndex}
              />
              <KeywordPanel 
                report={result.keywords} 
                hints={hints} 
                coverage={coverage} 
                cvText={cvText}
                language={result.language}
                embedderReady={embedder !== null}
              />
              {result.jobAd ? (
                <AdAnalysisPanel
                  jobAd={result.jobAd}
                  redFlags={result.jobAd.redFlags}
                  suitability={result.suitability ?? []}
                />
              ) : null}
              <AiConsent onReady={setEmbedder} />
              <AiStatus onTierChange={setModelTier} />
              <ParserView
                text={cvText}
                highlights={highlights}
                markedIndex={markedIndex}
                caption={t("parserCaption", {
                  words: result.stats.words,
                  lines: result.stats.lines,
                  language: result.language.toUpperCase()
                })}
              />
              <DataControls />
            </div>
          </div>

          {/* The dock is fixed to the viewport, so the report reserves room
              for it rather than letting it cover the last work item. */}
          <div aria-hidden className="h-20" />
          <AskDock tier={modelTier} result={result} />
        </div>
      ) : null}

      {view === "tailor" && result ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={() => setView("report")}>
              {t("backToReport")}
            </button>
          </div>

          {/* The rail travels with the mode: a term only earns its place if
              the score moves, and the user should see that in the same glance
              as the card they just accepted. */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              {change ? <ChangeNote change={change} onDismiss={() => setChange(null)} /> : null}
              <TailorMode
                result={result}
                jobAd={jobAd}
                cvText={cvText}
                onApply={applyAndRescore}
                draftLetter={modelTier === "none" ? undefined : draftLetter}
              />
            </div>

            <div className="space-y-5 pb-28 lg:pb-32">
              <MeasureRail
                result={result}
                previous={previous ?? lastVisit}
                comparedTo={previous ? "previousRun" : "lastVisit"}
                sticky
              />
              {previous ? (
                <VariantComparison master={previous} current={result} />
              ) : null}
              <ParserView
                text={cvText}
                highlights={highlights}
                markedIndex={markedIndex}
                caption={t("parserCaption", {
                  words: result.stats.words,
                  lines: result.stats.lines,
                  language: result.language.toUpperCase()
                })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {view === "compare" && result ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={() => setView("report")}>
              {t("backToReport")}
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <AdCompareView cvText={cvText} />
              <LearningList cvText={cvText} />
            </div>

            <div className="space-y-5 pb-28 lg:pb-32">
              <MeasureRail
                result={result}
                previous={previous ?? lastVisit}
                comparedTo={previous ? "previousRun" : "lastVisit"}
                sticky
              />
              <ParserView
                text={cvText}
                highlights={highlights}
                markedIndex={markedIndex}
                caption={t("parserCaption", {
                  words: result.stats.words,
                  lines: result.stats.lines,
                  language: result.language.toUpperCase()
                })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {view === "interview" && result ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={() => setView("report")}>
              {t("backToReport")}
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <InterviewMode
                cvText={cvText}
                terms={[...result.keywords.matched, ...result.keywords.missing]}
                modelTier={modelTier}
              />
            </div>

            <div className="space-y-5 pb-28 lg:pb-32">
              <MeasureRail
                result={result}
                previous={previous ?? lastVisit}
                comparedTo={previous ? "previousRun" : "lastVisit"}
                sticky
              />
              <ParserView
                text={cvText}
                highlights={highlights}
                markedIndex={markedIndex}
                caption={t("parserCaption", {
                  words: result.stats.words,
                  lines: result.stats.lines,
                  language: result.language.toUpperCase()
                })}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

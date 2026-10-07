"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import {
  browserOcrDeps,
  detectWasmFeatures,
  ocrSupported
} from "@/lib/extract/ocr/browser";
import {
  formatMegabytes,
  planDownload,
  selectCoreVariant,
  type OcrLanguage
} from "@/lib/extract/ocr/assets";
import {
  assembleText,
  defaultOcrLanguage,
  pagesNeedingOcr
} from "@/lib/extract/ocr/plan";
import { runOcr } from "@/lib/extract/ocr/session";
import { INITIAL_OCR_STATE, ocrPercent, ocrReducer } from "@/lib/extract/ocr/state";
import { cx } from "@/lib/ui";

interface OcrConsentProps {
  readonly file: File;
  readonly pageTexts: readonly string[];
  readonly siteLocale: string;
  readonly onResult: (text: string) => void;
}

export function OcrConsent({ file, pageTexts, siteLocale, onResult }: OcrConsentProps) {
  const t = useTranslations("ocrConsent");
  const [state, dispatch] = useReducer(ocrReducer, INITIAL_OCR_STATE);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const resultSentRef = useRef(false);

  const emptyPages = pageTexts.filter((text) => text.trim().length === 0).length;
  const pages = pagesNeedingOcr(pageTexts);
  const language: OcrLanguage = defaultOcrLanguage(pageTexts.join("\n\n"), siteLocale);

  const sizeMb = formatMegabytes(
    planDownload(language, selectCoreVariant({ simd: true, relaxedSimd: true })).totalBytes
  );

  const start = useCallback(async () => {
    if (!ocrSupported()) {
      dispatch({ type: "fail", reason: "unsupported" });
      setError(t("unsupported"));
      return;
    }

    setError(null);
    resultSentRef.current = false;
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const features = await detectWasmFeatures();
      const plan = planDownload(language, selectCoreVariant(features));

      const recognised = await runOcr(
        browserOcrDeps,
        { file, pages, language, plan },
        controller.signal,
        dispatch
      );

      if (recognised && !controller.signal.aborted) {
        const text = assembleText(pageTexts, recognised);
        resultSentRef.current = true;
        onResult(text);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : t("recognitionFailed"));
      }
    }
  }, [file, language, pages, pageTexts, onResult, t]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch({ type: "cancel" });
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  if (state.phase === "done") {
    return (
      <section className="bench px-5 py-4 sm:px-6">
        <p className="text-sm text-muted">
          <span className="font-normal text-good">{t("done")}</span>{" "}
          {t("doneDetail", { found: state.found })}
        </p>
      </section>
    );
  }

  if (state.phase === "cancelled") {
    return null;
  }

  if (state.phase === "failed") {
    return (
      <section className="bench space-y-3 px-5 py-4 sm:px-6">
        <p className="text-sm text-mark">
          {state.reason === "unsupported"
            ? t("unsupported")
            : state.reason === "download"
              ? t("downloadFailed")
              : t("recognitionFailed")}
        </p>
        <button type="button" className="btn" onClick={start}>
          {t("tryAgain")}
        </button>
      </section>
    );
  }

  const isRunning = state.phase === "downloading" || state.phase === "recognising";

  return (
    <section className="bench space-y-3 px-5 py-4 sm:px-6" aria-labelledby="ocr-consent-heading">
      <div>
        <h2 id="ocr-consent-heading" className="text-base font-normal">
          {t("heading")}
        </h2>
        <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
          {t("lede", { emptyPages, sizeMb })}
        </p>
      </div>

      {isRunning ? (
        <div className="space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full border border-line bg-bench-sunk">
            <div
              className="h-full bg-saffron transition-[width] duration-300"
              style={{ width: `${ocrPercent(state)}%` }}
              role="progressbar"
              aria-valuenow={ocrPercent(state)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("progressLabel")}
            />
          </div>
          <div className="flex items-center gap-3">
            {state.phase === "recognising" ? (
              <span className="text-xs text-muted">
                {t("recognising", { page: state.page, pages: state.pages })}
              </span>
            ) : (
              <span className="font-mono text-xs tabular-nums text-muted">
                {ocrPercent(state)}%
              </span>
            )}
            <button type="button" className="btn-quiet" onClick={cancel}>
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={cx("btn")} onClick={start}>
            {t("start")}
          </button>
        </div>
      )}

      {error ? <p className="text-sm text-mark">{error}</p> : null}
    </section>
  );
}

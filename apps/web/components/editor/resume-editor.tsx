"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { RESUME_SPEC } from "@/lib/editor/spec";
import { readDraft, writeDraft } from "@/lib/editor/storage";
import { exportJsonResumeText, importJsonResumeText } from "@/lib/resume/json-resume";
import type { Resume } from "@/types/resume";

import { ExportPanel } from "./export-panel";
import { SpecNodes } from "./spec-nodes";

type SaveState = "idle" | "saving" | "saved" | "refused";

const SAVE_DEBOUNCE_MS = 600;

/**
 * The form over the canonical model. Every section comes from RESUME_SPEC, so
 * the editor cannot fall behind the schema: a field added to the model and not
 * to the spec fails the coverage test rather than quietly having no input.
 *
 * The draft is kept on this device and nowhere else. It is the candidate's CV,
 * which is the one thing this product never sends anywhere.
 */
export function ResumeEditor() {
  const t = useTranslations("editor");
  const [resume, setResume] = useState<Resume | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readDraft().then((outcome) => {
      if (cancelled) return;
      setResume(outcome.ok ? outcome.value : {});
      if (!outcome.ok) setSave("refused");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced, because a keystroke per write would open a transaction per
  // keystroke. The draft is a convenience; the export is the durable copy.
  const change = useCallback((next: Resume) => {
    setResume(next);
    setSave("saving");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void writeDraft(next).then((outcome) => setSave(outcome.ok ? "saved" : "refused"));
    }, SAVE_DEBOUNCE_MS);
  }, []);

  async function openFile(file: File) {
    setError(null);
    const outcome = importJsonResumeText(await file.text());
    if (!outcome.ok) {
      setError(t("importFailed"));
      return;
    }
    change(outcome.resume);
  }

  function download() {
    if (!resume) return;
    const blob = new Blob([exportJsonResumeText(resume)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "resume.json";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  if (resume === null) {
    return <p className="text-sm text-muted">{t("saving")}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-quiet" onClick={() => fileRef.current?.click()}>
          {t("importJson")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.item(0);
            if (file) void openFile(file);
            event.target.value = "";
          }}
        />

        <button type="button" className="btn-quiet" onClick={download}>
          {t("exportJson")}
        </button>

        <button type="button" className="btn-quiet" onClick={() => setConfirming(true)}>
          {t("clear")}
        </button>

        <span className="text-micro text-muted" aria-live="polite">
          {save === "saving" ? t("saving") : save === "saved" ? t("saved") : null}
        </span>
      </div>

      {save === "refused" ? (
        <p className="rounded-control border border-caution/35 bg-caution/[0.07] px-4 py-3 text-sm text-caution">
          {t("saveFailed")}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-control border border-mark/35 bg-mark/[0.06] px-4 py-3 text-sm text-mark"
        >
          {error}
        </p>
      ) : null}

      {confirming ? (
        <div className="rounded-control border border-caution/35 bg-caution/[0.07] px-4 py-3 text-sm">
          <p className="text-caution">{t("confirmClear")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                change({});
                setConfirming(false);
              }}
            >
              {t("clear")}
            </button>
            <button type="button" className="btn-quiet" onClick={() => setConfirming(false)}>
              {t("keep")}
            </button>
          </div>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        {RESUME_SPEC.map((node) => (
          <section key={node.key} className="bench p-5 sm:p-6">
            <SpecNodes
              resume={resume}
              nodes={[node]}
              path={[]}
              labelScope="fields"
              onChange={change}
            />
          </section>
        ))}
      </form>

      <ExportPanel resume={resume} />
    </div>
  );
}

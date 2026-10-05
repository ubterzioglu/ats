"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { extractDocument } from "@/lib/extract";
import { RESUME_TEMPLATES, renderResumePdfBlob, type TemplateId } from "@/lib/pdf/templates";
import { renderResumeDocxBlob } from "@/lib/resume/docx";
import { analyzeCv } from "@/lib/scoring";
import type { Finding } from "@/types/analysis";
import type { Resume } from "@/types/resume";

/**
 * The closed loop, in the open. Every export renders the file, reads it back
 * through the same parser a hiring system would use, and shows the verdict
 * before anything lands on disk: full marks downloads and says so; anything
 * less stops, names every finding that cost a point, and only downloads when
 * the candidate asks for it anyway. Nothing here leaves the browser - the
 * render, the extraction and the scoring all run on the device.
 */

type ExportTarget =
  | { readonly kind: "pdf"; readonly template: TemplateId }
  | { readonly kind: "docx" };

type Phase =
  | { readonly state: "idle" }
  | { readonly state: "working" }
  | { readonly state: "passed"; readonly score: number; readonly max: number }
  | {
      readonly state: "degraded";
      readonly score: number;
      readonly max: number;
      readonly findings: readonly Finding[];
      readonly blob: Blob;
      readonly name: string;
    }
  | { readonly state: "failed" };

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function startDownload(blob: Blob, name: string): void {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
}

interface ExportPanelProps {
  readonly resume: Resume;
}

export function ExportPanel({ resume }: ExportPanelProps) {
  const t = useTranslations("editor.export");
  const [target, setTarget] = useState<ExportTarget>({ kind: "pdf", template: "dense" });
  const [phase, setPhase] = useState<Phase>({ state: "idle" });

  async function verifyAndDownload(): Promise<void> {
    setPhase({ state: "working" });
    try {
      const blob =
        target.kind === "pdf"
          ? await renderResumePdfBlob(resume, target.template)
          : await renderResumeDocxBlob(resume);
      const name = target.kind === "pdf" ? `cv-${target.template}.pdf` : "cv.docx";
      const file = new File([blob], name, {
        type: target.kind === "pdf" ? "application/pdf" : DOCX_TYPE
      });

      const extraction = await extractDocument(file);
      const result = analyzeCv({ cvText: extraction.text });
      const dimension = result.dimensions.find((entry) => entry.id === "parseability");
      const score = dimension?.score ?? 0;
      const max = dimension?.max ?? 0;

      if (dimension !== undefined && score >= max) {
        startDownload(blob, name);
        setPhase({ state: "passed", score, max });
        return;
      }

      setPhase({
        state: "degraded",
        score,
        max,
        findings: result.findings.filter((finding) => finding.dimension === "parseability"),
        blob,
        name
      });
    } catch {
      setPhase({ state: "failed" });
    }
  }

  return (
    <section className="bench space-y-4 p-5 sm:p-6">
      <h2 className="text-sm font-normal">{t("title")}</h2>

      <fieldset className="space-y-2">
        <legend className="condensed px-2 text-micro font-normal text-muted">
          {t("formatLabel")}
        </legend>
        {RESUME_TEMPLATES.map((template) => (
          <label key={template.id} className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="radio"
              name="export-target"
              checked={target.kind === "pdf" && target.template === template.id}
              onChange={() => setTarget({ kind: "pdf", template: template.id })}
            />
            {t(`template.${template.id}`)}
          </label>
        ))}
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="radio"
            name="export-target"
            checked={target.kind === "docx"}
            onChange={() => setTarget({ kind: "docx" })}
          />
          {t("formatDocx")}
        </label>
      </fieldset>

      <button
        type="button"
        className="btn-quiet"
        disabled={phase.state === "working"}
        onClick={() => void verifyAndDownload()}
      >
        {phase.state === "working" ? t("working") : t("verify")}
      </button>

      {phase.state === "passed" ? (
        <p role="status" className="border-l-2 border-good px-4 py-3 text-sm text-good">
          {t("passed", { score: phase.score, max: phase.max })}
        </p>
      ) : null}

      {phase.state === "degraded" ? (
        <div
          role="alert"
          className="space-y-3 border-l-2 border-caution px-4 py-3 text-sm"
        >
          <p className="text-caution">{t("degradedTitle")}</p>
          <p>{t("degradedDetail", { score: phase.score, max: phase.max })}</p>
          <ul className="space-y-2">
            {phase.findings.map((finding) => (
              <li key={finding.id}>
                <span className="font-normal">{finding.title}</span>{" "}
                <span className="text-muted">{finding.fix}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => startDownload(phase.blob, phase.name)}
          >
            {t("downloadAnyway")}
          </button>
        </div>
      ) : null}

      {phase.state === "failed" ? (
        <p role="alert" className="border-l-2 border-mark px-4 py-3 text-sm text-mark">
          {t("failed")}
        </p>
      ) : null}
    </section>
  );
}

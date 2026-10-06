"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { importResumeFromText } from "@/lib/resume/import-document";
import { saveProfile } from "@/app/[locale]/account/profile-actions";

interface ImportPanelProps {
  readonly cvText: string;
  readonly sourceName?: string;
}

export function ImportPanel({ cvText, sourceName }: ImportPanelProps) {
  const t = useTranslations("profile");
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [importResult, setImportResult] = useState<ReturnType<typeof importResumeFromText> | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(["basics"]));

  function handleExtract() {
    const result = importResumeFromText(cvText, sourceName ?? "");
    setImportResult(result);
  }

  function toggleSection(section: string) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  function handleSave() {
    if (!importResult) return;

    const resume: Record<string, unknown> = {};
    for (const section of selectedSections) {
      const value = (importResult.resume as Record<string, unknown>)[section];
      if (value !== undefined) {
        resume[section] = value;
      }
    }

    startTransition(async () => {
      const outcome = await saveProfile({ resume });
      if (outcome.state === "saved") {
        setState("saved");
      } else {
        setState("error");
      }
    });
  }

  if (!importResult) {
    return (
      <div className="rounded-surface border-2 border-bone/10 bg-bench p-4">
        <h3 className="text-sm font-semibold text-ink">{t("importHeading")}</h3>
        <p className="mt-2 text-sm text-muted">{t("importDescription")}</p>
        <button type="button" className="btn-quiet mt-3" onClick={handleExtract}>
          {t("extractButton")}
        </button>
      </div>
    );
  }

  const reviewPaths = new Set(importResult.reviewPaths);

  return (
    <div className="rounded-surface border-2 border-bone/10 bg-bench p-4">
      <h3 className="text-sm font-semibold text-ink">{t("importHeading")}</h3>
      <p className="mt-2 text-sm text-muted">{t("importReviewDescription")}</p>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedSections.has("basics")}
            onChange={() => toggleSection("basics")}
            className="h-4 w-4"
          />
          <span className="text-sm text-ink">
            {t("sectionBasics")}
            {reviewPaths.has("basics") && (
              <span className="ml-2 text-xs text-caution">{t("needsReview")}</span>
            )}
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedSections.has("work")}
            onChange={() => toggleSection("work")}
            className="h-4 w-4"
          />
          <span className="text-sm text-ink">
            {t("sectionWork")}
            {reviewPaths.has("work") && (
              <span className="ml-2 text-xs text-caution">{t("needsReview")}</span>
            )}
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedSections.has("education")}
            onChange={() => toggleSection("education")}
            className="h-4 w-4"
          />
          <span className="text-sm text-ink">
            {t("sectionEducation")}
            {reviewPaths.has("education") && (
              <span className="ml-2 text-xs text-caution">{t("needsReview")}</span>
            )}
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedSections.has("skills")}
            onChange={() => toggleSection("skills")}
            className="h-4 w-4"
          />
          <span className="text-sm text-ink">
            {t("sectionSkills")}
            {reviewPaths.has("skills") && (
              <span className="ml-2 text-xs text-caution">{t("needsReview")}</span>
            )}
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedSections.has("languages")}
            onChange={() => toggleSection("languages")}
            className="h-4 w-4"
          />
          <span className="text-sm text-ink">
            {t("sectionLanguages")}
            {reviewPaths.has("languages") && (
              <span className="ml-2 text-xs text-caution">{t("needsReview")}</span>
            )}
          </span>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" className="btn" onClick={handleSave} disabled={isPending}>
          {t("saveToProfile")}
        </button>
        <button type="button" className="btn-quiet" onClick={() => setImportResult(null)}>
          {t("cancel")}
        </button>
      </div>

      {state === "saved" && <p className="mt-3 text-sm text-lime">{t("savedMessage")}</p>}
      {state === "error" && <p className="mt-3 text-sm text-caution">{t("errorMessage")}</p>}
    </div>
  );
}

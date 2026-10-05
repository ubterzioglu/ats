"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type DragEvent } from "react";

import type { ExtractionResult } from "@/lib/extract";
import { cx } from "@/lib/ui";

interface DocumentIntakeProps {
  readonly extraction: ExtractionResult | null;
  readonly busy: boolean;
  readonly onFile: (file: File) => void;
}

const ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,text/plain";

export function DocumentIntake({ extraction, busy, onFile }: DocumentIntakeProps) {
  const t = useTranslations("documentIntake");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cx(
        "flex flex-col items-center justify-center gap-3 rounded-control border border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-action" : "border-edge/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) onFile(file);
          event.target.value = "";
        }}
      />

      {extraction ? (
        <>
          <p className="font-mono text-sm text-ink">{extraction.fileName}</p>
          <p className="readout">
            {t("pagesRead", {
              source: extraction.source.toUpperCase(),
              pages: extraction.pages
            })}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-normal">{t("drop")}</p>
          <p className="max-w-[34ch] text-micro leading-relaxed text-muted">
            {t("formats")}
          </p>
        </>
      )}

      <button type="button" className="btn-quiet mt-1" disabled={busy} onClick={() => inputRef.current?.click()}>
        {t(busy ? "reading" : extraction ? "chooseAnother" : "choose")}
      </button>
    </div>
  );
}

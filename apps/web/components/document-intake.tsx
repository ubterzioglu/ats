"use client";

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
        "flex flex-col items-center justify-center gap-3 rounded-sheet border border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-ink bg-signal/15" : "border-line bg-bed/30"
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
          <p className="font-mono text-sm">{extraction.fileName}</p>
          <p className="text-xs text-muted">
            {extraction.source.toUpperCase()} · {extraction.pages} page
            {extraction.pages === 1 ? "" : "s"} read
          </p>
        </>
      ) : (
        <>
          <p className="text-sm">Drop a CV here</p>
          <p className="max-w-[34ch] text-xs leading-relaxed text-muted">
            PDF, DOCX or plain text, up to 10 MB. It is read in this browser and never sent anywhere.
          </p>
        </>
      )}

      <button type="button" className="btn-quiet mt-1" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Reading…" : extraction ? "Choose another file" : "Choose a file"}
      </button>
    </div>
  );
}

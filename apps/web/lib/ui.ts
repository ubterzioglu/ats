import type { Severity } from "@/types/analysis";

// The words for each severity live in the message catalog under `severity`.
// Only the tones belong here.
export const SEVERITY_EDGE: Readonly<Record<Severity, string>> = {
  critical: "bg-mark",
  high: "bg-mark/55",
  medium: "bg-caution/70",
  low: "bg-line"
};

export const SEVERITY_TEXT: Readonly<Record<Severity, string>> = {
  critical: "text-mark",
  high: "text-mark",
  medium: "text-caution",
  low: "text-muted"
};

export function barTone(score: number, max: number): string {
  const share = max > 0 ? score / max : 0;
  if (share >= 0.85) return "bg-good";
  if (share >= 0.6) return "bg-ink/70";
  return "bg-mark";
}

export function cx(...values: ReadonlyArray<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

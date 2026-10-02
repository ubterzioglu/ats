import type { Severity } from "@/types/analysis";

export const SEVERITY_LABEL: Readonly<Record<Severity, string>> = {
  critical: "Blocks parsing",
  high: "Costly",
  medium: "Worth fixing",
  low: "Polish"
};

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
  if (share >= 0.6) return "bg-accent";
  return "bg-mark";
}

export function cx(...values: ReadonlyArray<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

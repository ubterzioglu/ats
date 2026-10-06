import type { ReactNode } from "react";

import { cx } from "@/lib/ui";

type TagTone = "quiet" | "accent" | "good";

interface TagProps {
  readonly children: ReactNode;
  readonly tone?: TagTone;
  /** A 2px outline in the tag's own colour. Without it the tag is coloured text only. */
  readonly outlined?: boolean;
  readonly className?: string;
}

const TONE: Readonly<Record<TagTone, string>> = {
  quiet: "text-ash",
  accent: "text-flame",
  good: "text-lime"
};

/** A status marker. Colour comes from the logo palette. */
export function Tag({ children, tone = "quiet", outlined = true, className }: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-display text-sm font-semibold",
        outlined ? "border-2 border-current px-3.5 py-1" : "py-1",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

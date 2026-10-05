import type { ReactNode } from "react";

import { cx } from "@/lib/ui";

type TagTone = "quiet" | "accent" | "good";

interface TagProps {
  readonly children: ReactNode;
  readonly tone?: TagTone;
  /** A 1px outline in the tag's own colour. Without it the tag is coloured text only. */
  readonly outlined?: boolean;
  readonly className?: string;
}

const TONE: Readonly<Record<TagTone, string>> = {
  quiet: "text-ash",
  accent: "text-saffron",
  good: "text-verdant"
};

/** A status marker. Colour comes from the palette and never from the violet. */
export function Tag({ children, tone = "quiet", outlined = true, className }: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full text-caption font-semibold uppercase tracking-[0.025em]",
        outlined ? "border border-current px-3 py-1" : "py-1",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

import type { ReactNode } from "react";

import { cx } from "@/lib/ui";

interface LabelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** A small orange sticker pill that sits above a headline. */
export function Label({ children, className }: LabelProps) {
  return (
    <p
      className={cx(
        "inline-flex items-center rounded-full border-2 border-flame px-3 py-1 font-display text-sm font-semibold text-flame",
        className
      )}
    >
      {children}
    </p>
  );
}

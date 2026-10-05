import type { ReactNode } from "react";

import { cx } from "@/lib/ui";

interface LabelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** The small amber uppercase line that sits above a headline. */
export function Label({ children, className }: LabelProps) {
  return (
    <p className={cx("text-nav-label font-semibold uppercase text-saffron", className)}>
      {children}
    </p>
  );
}

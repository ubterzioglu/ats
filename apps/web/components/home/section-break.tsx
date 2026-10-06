import { cx } from "@/lib/ui";

import { Sparkle } from "./sparkle";

interface SectionBreakProps {
  readonly flip?: boolean;
}

/**
 * The seam between two sections: a lime line draws across as it scrolls in and
 * the logo star stamps on the end of it. Without scroll-linked animation it is
 * simply a finished rule.
 */
export function SectionBreak({ flip = false }: SectionBreakProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("mx-auto flex w-full max-w-page items-center gap-3 px-4 sm:px-6", flip && "flex-row-reverse")}
    >
      <div className="h-[3px] flex-1 rounded-full bg-bone/10">
        <div
          className={cx("break-line h-full rounded-full bg-lime", flip ? "origin-right" : "origin-left")}
        />
      </div>
      <Sparkle className="break-mark h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
    </div>
  );
}

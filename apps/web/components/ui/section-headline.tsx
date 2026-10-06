import type { ReactNode } from "react";

import { cx } from "@/lib/ui";

import { Label } from "./label";

type HeadlineScale = "display" | "lg" | "sm";

interface SectionHeadlineProps {
  readonly label?: string;
  readonly title: string;
  readonly children?: ReactNode;
  readonly scale?: HeadlineScale;
  /** The page's one h1 passes "h1"; every other block stays an h2. */
  readonly as?: "h1" | "h2";
  readonly id?: string;
  readonly className?: string;
}

const SCALE: Readonly<Record<HeadlineScale, string>> = {
  display: "text-display",
  lg: "text-heading-lg",
  sm: "text-heading-sm sm:text-heading"
};

/**
 * Label, headline and a short paragraph, with no box around them. Headlines
 * are weight 400 at every size; the scale does the work.
 */
export function SectionHeadline({
  label,
  title,
  children,
  scale = "sm",
  as: Heading = "h2",
  id,
  className
}: SectionHeadlineProps) {
  return (
    <div className={className}>
      {label ? <Label>{label}</Label> : null}
      <Heading id={id} className={cx(label && "mt-5", SCALE[scale], "font-bold text-bone")}>
        {title}
      </Heading>
      {children ? (
        <div className="mt-6 text-body text-mist">{children}</div>
      ) : null}
    </div>
  );
}

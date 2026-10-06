import type { CSSProperties } from "react";

import { cx } from "@/lib/ui";

import { Sparkle } from "./sparkle";

interface SectionBreakProps {
  readonly flip?: boolean;
}

const SPARK_RADIUS = 38;

const SPARKS = [0, 60, 120, 180, 240, 300].map((angle, index) => {
  const radians = (angle * Math.PI) / 180;
  return {
    angle,
    tone: index % 2 === 0 ? "bg-lime" : "bg-flame",
    style: {
      "--dx": `${Math.round(Math.cos(radians) * SPARK_RADIUS)}px`,
      "--dy": `${Math.round(Math.sin(radians) * SPARK_RADIUS)}px`
    } as CSSProperties
  };
});

/**
 * The seam between two sections, read like a scan: the logo star travels along
 * the rule as the beam head, spinning and leaving a glowing lime trail, then
 * lands at the end with a pop and a ring of sparks. Without scroll-linked
 * animation it is simply a finished rule with the star at the end.
 */
export function SectionBreak({ flip = false }: SectionBreakProps) {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-page px-4 sm:px-6">
      <div
        className={cx(
          "relative mr-[18px] flex h-11 items-center sm:mr-[22px]",
          flip && "-scale-x-100"
        )}
      >
        <div className="h-[3px] w-full rounded-full bg-bone/10">
          <div className="break-line h-full origin-left rounded-full bg-lime shadow-[0_0_14px_2px_rgb(var(--lime)/0.5)]" />
        </div>
        <div className="break-head absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Sparkle className="break-mark h-9 w-9 sm:h-11 sm:w-11" />
        </div>
        <div className="absolute left-full top-1/2 h-0 w-0">
          {SPARKS.map((spark) => (
            <span
              key={spark.angle}
              style={spark.style}
              className={cx(
                "break-spark absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full opacity-0",
                spark.tone
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

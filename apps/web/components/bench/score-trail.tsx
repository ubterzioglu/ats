"use client";

import { useTranslations } from "next-intl";

import type { TrailPoint } from "@/lib/store/schema";

interface ScoreTrailProps {
  readonly points: readonly TrailPoint[];
}

const WIDTH = 240;
const HEIGHT = 48;
const PAD = 3;

/**
 * The score across this working session. Measurement, so it is still: no
 * animation, no hover, no tooltip chasing the cursor. The shape is the message
 * - whether the sitting is going anywhere - and the two numbers beside it say
 * where it started and where it is.
 *
 * Drawn against the full 0-100 range rather than against its own minimum and
 * maximum. An auto-scaled sparkline turns a two-point wobble into a cliff, and
 * this is a measurement, not a stock chart.
 */
export function ScoreTrail({ points }: ScoreTrailProps) {
  const t = useTranslations("scoreTrail");

  if (points.length < 2) return null;

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;

  const step = (WIDTH - PAD * 2) / (points.length - 1);
  const y = (total: number) => PAD + (HEIGHT - PAD * 2) * (1 - Math.min(100, Math.max(0, total)) / 100);

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${PAD + index * step} ${y(point.total)}`)
    .join(" ");

  const change = last.total - first.total;

  return (
    <figure className="bench px-5 py-4 sm:px-6" aria-labelledby="trail-caption">
      <figcaption
        id="trail-caption"
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
      >
        <span className="condensed text-micro font-medium text-ink">{t("heading")}</span>
        <span className="font-mono text-micro tabular-nums text-muted">
          {t("span", { count: points.length })}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 h-12 w-full"
        role="img"
        aria-label={t("description", {
          first: first.total,
          last: last.total,
          count: points.length
        })}
        preserveAspectRatio="none"
      >
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--ink))"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={PAD + (points.length - 1) * step} cy={y(last.total)} r="3" fill="rgb(var(--ink))" />
      </svg>

      <p className="mt-2 flex items-baseline justify-between gap-4 font-mono text-micro tabular-nums">
        <span className="text-muted">{first.total}</span>
        <span className={change > 0 ? "text-good" : change < 0 ? "text-mark" : "text-muted"}>
          {change > 0 ? `+${change}` : change}
        </span>
        <span className="text-ink">{last.total}</span>
      </p>
    </figure>
  );
}

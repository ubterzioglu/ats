import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import { Sparkle, Tick } from "./sparkle";

interface DimensionRow {
  readonly key: "parse" | "keywords" | "structure" | "impact" | "contact";
  readonly score: number;
  readonly max: number;
}

/** An illustrative report. The maxima are the product's real ones. */
const DIMENSIONS: readonly DimensionRow[] = [
  { key: "parse", score: 24, max: 25 },
  { key: "keywords", score: 20, max: 25 },
  { key: "structure", score: 18, max: 20 },
  { key: "impact", score: 14, max: 20 },
  { key: "contact", score: 10, max: 10 }
];

const TOTAL = DIMENSIONS.reduce((sum, row) => sum + row.score, 0);

function motion(tilt: string, delay: number): CSSProperties {
  return { "--tilt": tilt, "--delay": `${delay}ms` } as CSSProperties;
}

/**
 * The page's one loud moment: a sticker collage built from the logo's own
 * parts. Everything here is a labelled example, so it is hidden from assistive
 * technology and the page text carries the same message.
 */
export async function HeroStickers() {
  const t = await getTranslations("home.demo");

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[27rem] w-full max-w-[34rem] sm:h-[33rem] lg:h-[37rem]"
    >
      <div
        className="sticker sticker-lime sticker-pop absolute left-[4%] top-[9%] w-[80%] p-5 sm:p-7"
        style={motion("-4deg", 0)}
      >
        <p className="font-display text-sm font-bold">{t("label")}</p>
        <p className="mt-1 flex items-baseline gap-1 font-display font-extrabold leading-none">
          <span className="text-[5.5rem] tracking-tighter sm:text-[7rem]">{TOTAL}</span>
          <span className="text-2xl">/100</span>
        </p>
        <ul className="mt-5 space-y-2.5">
          {DIMENSIONS.map((row) => (
            <li
              key={row.key}
              className="grid grid-cols-[minmax(6rem,auto)_1fr_3rem] items-center gap-3 text-sm font-semibold"
            >
              <span>{t(row.key)}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-void/20">
                <span
                  className="block h-full rounded-full bg-night"
                  style={{ width: `${(row.score / row.max) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums">
                {row.score}/{row.max}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <span
        className="chip sticker-pop absolute right-0 top-0 !border-flame !text-flame"
        style={motion("5deg", 220)}
      >
        {t("chipMissing")}
      </span>
      <span
        className="chip sticker-pop absolute bottom-[2%] left-0 sm:bottom-[24%]"
        style={motion("-6deg", 340)}
      >
        {t("chipColumns")}
      </span>
      <span
        className="chip sticker-pop absolute bottom-[4%] right-[2%] !border-lime !text-lime"
        style={motion("3deg", 460)}
      >
        {t("chipFix")}
      </span>

      <Sparkle className="sticker-pop absolute right-[10%] top-[22%] h-12 w-12 sm:h-16 sm:w-16" />
      <Tick
        className="sticker-pop absolute bottom-[10%] left-[34%] h-14 w-14 sm:h-20 sm:w-20"
      />
    </div>
  );
}

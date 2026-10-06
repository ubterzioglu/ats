import { getTranslations } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";

import { cx } from "@/lib/ui";

import { Sparkle, Tick } from "./sparkle";

export type FeatureVisualKey = "analyze" | "tracker" | "interview" | "report";

function tilt(value: string): CSSProperties {
  return { "--tilt": value } as CSSProperties;
}

interface StageProps {
  readonly children: ReactNode;
}

/** The shared canvas: a square on wide screens, a landscape box on narrow ones. */
function Stage({ children }: StageProps) {
  return (
    <div aria-hidden="true" className="stage relative aspect-square w-full sm:aspect-[4/3] lg:aspect-square">
      {children}
    </div>
  );
}

/** Every visual is an example, and says so. */
async function ExampleTag({ className }: { readonly className?: string }) {
  const t = await getTranslations("home.visuals");
  return (
    <span
      className={cx(
        "absolute rounded-full border-2 border-bone/30 bg-night px-3 py-1 font-display text-xs font-semibold text-ash",
        className
      )}
    >
      {t("example")}
    </span>
  );
}

const COSTS = [
  { key: "f1", cost: 5 },
  { key: "f2", cost: 3 },
  { key: "f3", cost: 2 }
] as const;

async function FindingsVisual() {
  const t = await getTranslations("home.visuals");

  return (
    <Stage>
      <div
        className="sticker absolute left-[5%] top-[14%] w-[90%] p-5 sm:p-7"
        style={tilt("-3deg")}
      >
        <p className="font-display text-sm font-semibold text-ash sm:text-base">{t("findingsTitle")}</p>
        <ul className="mt-4 space-y-3">
          {COSTS.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-3 rounded-2xl bg-bone/[0.07] px-3 py-3 sm:gap-4 sm:px-4"
            >
              <span className="shrink-0 rounded-full bg-flame px-3 py-1 font-display text-base font-extrabold text-void sm:text-lg">
                −{row.cost}
              </span>
              <span className="text-sm font-semibold text-bone sm:text-base">{t(row.key)}</span>
            </li>
          ))}
        </ul>
      </div>
      <Sparkle className="absolute right-[3%] top-[3%] h-12 w-12 sm:h-16 sm:w-16" />
      <Tick className="absolute bottom-[4%] left-[10%] hidden h-14 w-14 sm:block sm:h-20 sm:w-20" />
      <ExampleTag className="bottom-[1%] right-[6%] sm:bottom-[8%]" />
    </Stage>
  );
}

const STAGES = [
  { key: "saved", tone: "border-bone text-bone", step: "ml-0", rotate: "-2deg" },
  { key: "applied", tone: "border-bone text-bone", step: "ml-[10%]", rotate: "2deg" },
  { key: "interview", tone: "border-lime text-lime", step: "ml-[20%]", rotate: "-2deg" },
  { key: "offer", tone: "border-bone bg-lime text-void", step: "ml-[30%]", rotate: "2deg" },
  { key: "rejected", tone: "border-flame text-flame", step: "ml-[40%]", rotate: "-2deg" }
] as const;

async function PipelineVisual() {
  const t = await getTranslations("home.visuals");

  return (
    <Stage>
      <ul className="absolute inset-x-[4%] top-[6%] space-y-3 sm:space-y-4">
        {STAGES.map((stage) => (
          <li key={stage.key} className={stage.step}>
            <span
              className={cx("chip !px-5 !py-2.5 text-base sm:text-lg", stage.tone)}
              style={tilt(stage.rotate)}
            >
              {t(`stage.${stage.key}`)}
            </span>
          </li>
        ))}
      </ul>
      <div
        className="sticker absolute bottom-[5%] right-[3%] w-[62%] !bg-flame p-4 text-void sm:p-5"
        style={tilt("4deg")}
      >
        <p className="font-display text-sm font-bold sm:text-base">{t("quiet")}</p>
      </div>
      <Sparkle className="absolute left-[4%] bottom-[10%] h-12 w-12 sm:h-16 sm:w-16" />
      <ExampleTag className="left-[4%] top-[-2%] hidden sm:block" />
    </Stage>
  );
}

async function CardsVisual() {
  const t = await getTranslations("home.visuals");

  return (
    <Stage>
      <div
        className="sticker sticker-lime absolute left-[3%] top-[8%] w-[72%] p-5 sm:p-7"
        style={tilt("-5deg")}
      >
        <p className="font-display text-xs font-bold sm:text-sm">{t("questionLabel")}</p>
        <p className="mt-2 font-display text-xl font-extrabold leading-tight sm:text-3xl">
          {t("questionText")}
        </p>
      </div>
      <div
        className="sticker absolute bottom-[8%] right-[3%] w-[70%] p-5 sm:p-7"
        style={tilt("4deg")}
      >
        <p className="font-display text-xs font-bold text-flame sm:text-sm">{t("storyLabel")}</p>
        <p className="mt-2 font-display text-xl font-extrabold text-bone sm:text-2xl">{t("storyTitle")}</p>
        <div className="mt-4 space-y-2.5">
          <span className="block h-2.5 w-full rounded-full bg-bone/20" />
          <span className="block h-2.5 w-[82%] rounded-full bg-bone/20" />
          <span className="block h-2.5 w-[64%] rounded-full bg-bone/20" />
        </div>
      </div>
      <Sparkle className="absolute right-[10%] top-[6%] h-12 w-12 sm:h-16 sm:w-16" />
      <Tick className="absolute left-[40%] top-[44%] hidden h-12 w-12 sm:block sm:h-16 sm:w-16" />
      <ExampleTag className="bottom-[2%] left-[4%]" />
    </Stage>
  );
}

async function SharedReportVisual() {
  const t = await getTranslations("home.visuals");

  return (
    <Stage>
      <div
        className="sticker sticker-shadow-lime absolute left-[5%] top-[10%] w-[90%] p-5 sm:p-7"
        style={tilt("3deg")}
      >
        <p className="font-display text-sm font-semibold text-ash sm:text-base">{t("reportTitle")}</p>
        <div className="mt-3 flex items-end gap-4">
          <span className="font-display text-[4.5rem] font-extrabold leading-none tracking-tighter text-lime sm:text-[6.5rem]">
            86
          </span>
          <div className="mb-2 w-full space-y-2.5">
            <span className="block h-2.5 w-full rounded-full bg-bone/20" />
            <span className="block h-2.5 w-[70%] rounded-full bg-bone/20" />
          </div>
        </div>
        <p className="mt-5 truncate rounded-xl bg-bone/[0.07] px-4 py-3 font-mono text-xs text-mist sm:text-sm">
          atsfreeforall.com/r/a1b2c3d4e5f60718
        </p>
      </div>
      <span
        className="chip absolute bottom-[10%] left-[3%] !border-flame !text-flame"
        style={tilt("-5deg")}
      >
        {t("expires")}
      </span>
      <span
        className="chip absolute bottom-[1%] right-[6%] !border-lime !text-lime"
        style={tilt("4deg")}
      >
        {t("noLines")}
      </span>
      <Sparkle className="absolute right-[2%] top-[0%] h-12 w-12 sm:h-16 sm:w-16" />
      <ExampleTag className="left-[4%] top-[0%]" />
    </Stage>
  );
}

const VISUALS: Readonly<Record<FeatureVisualKey, () => Promise<ReactNode>>> = {
  analyze: FindingsVisual,
  tracker: PipelineVisual,
  interview: CardsVisual,
  report: SharedReportVisual
};

interface FeatureVisualProps {
  readonly name: FeatureVisualKey;
}

export async function FeatureVisual({ name }: FeatureVisualProps) {
  const Visual = VISUALS[name];
  return <Visual />;
}

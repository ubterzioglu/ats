import { useTranslations } from "next-intl";

/**
 * The hero. The retired sweep animated the problem; this shows the output. A
 * stranger has one question - what do I fix - and the answer is a value-ordered
 * repair list, so the landing page is that list rather than a picture of one.
 *
 * Nothing here moves. The numbers are the argument.
 */

interface PreviewItem {
  readonly key: "phone" | "columns" | "kubernetes";
  readonly worth: number;
}

const ITEMS: readonly PreviewItem[] = [
  { key: "columns", worth: 8 },
  { key: "phone", worth: 6 },
  { key: "kubernetes", worth: 5 }
];

const SCORE = 64;
const POTENTIAL = SCORE + ITEMS.reduce((sum, item) => sum + item.worth, 0);

export function BenchPreview() {
  const t = useTranslations("benchPreview");

  return (
    <figure className="bench overflow-hidden" aria-labelledby="preview-caption">
      <div className="flex items-end justify-between gap-6 border-b border-line px-5 py-5 sm:px-6">
        <p className="flex items-baseline gap-2">
          <span className="font-mono text-[2.75rem] font-medium leading-none tabular-nums tracking-tight">
            {SCORE}
          </span>
          <span className="font-mono text-sm text-muted">{t("outOf")}</span>
        </p>
        <p className="condensed text-micro text-muted">
          {t("potential", { score: POTENTIAL })}
        </p>
      </div>

      <ol className="divide-y divide-line">
        {ITEMS.map((item, index) => (
          <li key={item.key} className="flex gap-4 px-5 py-4 sm:px-6">
            <span className="font-mono text-micro tabular-nums text-muted">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t(`items.${item.key}.title`)}</p>
              <p className="mt-1 truncate font-mono text-[0.6875rem] text-muted">
                {t(`items.${item.key}.evidence`)}
              </p>
            </div>
            <span className="font-mono text-micro tabular-nums text-good">
              {t("worth", { points: item.worth })}
            </span>
          </li>
        ))}
      </ol>

      <figcaption
        id="preview-caption"
        className="border-t border-line px-5 py-3 text-micro text-muted sm:px-6"
      >
        {t("caption")}
      </figcaption>
    </figure>
  );
}

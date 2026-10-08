"use client";

import type { BlogLocale } from "@/lib/blog/schema";
import { cx } from "@/lib/ui";

interface Props {
  readonly activeLocale: BlogLocale;
  readonly onLocaleChange: (locale: BlogLocale) => void;
}

const LOCALES: readonly BlogLocale[] = ["en", "tr", "de"];

const LOCALE_LABELS: Readonly<Record<BlogLocale, string>> = {
  en: "EN",
  tr: "TR",
  de: "DE",
};

export function LanguageFilter({ activeLocale, onLocaleChange }: Props) {
  return (
    <div className="flex gap-2" role="group" aria-label="Filter by language">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onLocaleChange(locale)}
          className={cx(
            "px-4 py-2 rounded-xl border-2 font-display text-xs sm:text-sm font-bold transition-all",
            activeLocale === locale
              ? "border-lime bg-lime text-void shadow-sm"
              : "border-bone/20 bg-bench/80 text-mist hover:border-lime/50 hover:text-bone hover:bg-bench-raised"
          )}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}

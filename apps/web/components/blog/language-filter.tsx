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
            "px-4 py-2 rounded border-2 text-caption font-normal transition-colors",
            activeLocale === locale
              ? "border-action bg-action text-void"
              : "border-bone/20 text-mist hover:border-bone/40"
          )}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}

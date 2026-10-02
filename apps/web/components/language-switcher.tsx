"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_NAMES, routing, type AppLocale } from "@/i18n/routing";
import { cx } from "@/lib/ui";

/**
 * Each language is its own link rather than a select, so the choice is visible
 * without opening anything and reads in the language it switches to.
 */
export function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(locale: AppLocale) {
    if (locale === active) return;
    startTransition(() => {
      // usePathname here is the locale-aware one: it returns the path without
      // the locale prefix, dynamic segments already filled in.
      router.replace(pathname, { locale });
    });
  }

  return (
    <nav aria-label={t("label")} className="flex items-center gap-1">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          disabled={pending}
          aria-current={locale === active ? "true" : undefined}
          onClick={() => switchTo(locale)}
          className={cx(
            "inline-flex min-h-11 items-center rounded-control px-3 text-sm transition-colors disabled:opacity-50",
            locale === active ? "text-ink" : "text-muted hover:text-ink"
          )}
        >
          {LOCALE_NAMES[locale]}
        </button>
      ))}
    </nav>
  );
}

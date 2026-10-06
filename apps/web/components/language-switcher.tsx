"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useTransition } from "react";

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
    <nav aria-label={t("label")} className="flex items-center">
      {routing.locales.map((locale, index) => (
        <Fragment key={locale}>
          {index > 0 ? <span aria-hidden="true" className="h-4 w-px shrink-0 bg-bone/20" /> : null}
          <button
            type="button"
            lang={locale}
            disabled={pending}
            aria-current={locale === active ? "true" : undefined}
            onClick={() => switchTo(locale)}
            aria-label={LOCALE_NAMES[locale]}
            className={cx(
              "inline-flex min-h-11 items-center px-2 text-nav-label font-normal uppercase transition-colors disabled:opacity-50",
              locale === active ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {locale}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}

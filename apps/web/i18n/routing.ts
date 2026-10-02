import { defineRouting } from "next-intl/routing";

/**
 * English carries no prefix, so every URL that exists today keeps working and
 * keeps its shape. Turkish and German are served from /tr and /de.
 */
export const routing = defineRouting({
  locales: ["en", "tr", "de"],
  defaultLocale: "en",
  localePrefix: "as-needed"
});

export type AppLocale = (typeof routing.locales)[number];

export const LOCALE_NAMES: Readonly<Record<AppLocale, string>> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch"
};

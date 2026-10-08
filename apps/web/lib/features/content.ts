import type { AppLocale } from "@/i18n/routing";

import { FEATURES_DE } from "./content-de";
import { FEATURES_EN } from "./content-en";
import { FEATURES_TR } from "./content-tr";
import type { FeatureContent } from "./content-types";

export type { FeatureContent, FeatureEntry, FeaturePoint } from "./content-types";

const BY_LOCALE: Readonly<Record<AppLocale, FeatureContent>> = {
  en: FEATURES_EN,
  tr: FEATURES_TR,
  de: FEATURES_DE
};

export function getFeatureContent(locale: AppLocale): FeatureContent {
  return BY_LOCALE[locale];
}

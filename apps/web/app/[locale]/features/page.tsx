import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FeatureGrid } from "@/components/features/feature-grid";
import { SiteCredit } from "@/components/site-credit";
import { type AppLocale } from "@/i18n/routing";
import { getFeatureContent } from "@/lib/features/content";
import { pageAlternates } from "@/lib/seo";

interface FeaturesPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: FeaturesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features" });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: pageAlternates(locale as AppLocale, "/features")
  };
}

export default async function FeaturesPage({ params }: FeaturesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("features");
  const content = getFeatureContent(locale as AppLocale);

  return (
    <div className="mx-auto w-full max-w-page px-4 sm:px-6">
      <main className="py-8 sm:py-10">
        <div className="mb-10 max-w-measure">
          <h1 id="features-heading" className="text-heading-sm font-normal">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("lead")}</p>
        </div>
        <FeatureGrid content={content} labelledBy="features-heading" />
        <footer className="mt-12 border-t border-line pt-8">
          <SiteCredit />
        </footer>
      </main>
    </div>
  );
}

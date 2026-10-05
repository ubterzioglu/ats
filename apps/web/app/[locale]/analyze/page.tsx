import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Analyzer } from "@/components/analyzer";
import { type AppLocale } from "@/i18n/routing";
import { pageAlternates } from "@/lib/seo";
import { isPersistenceConfigured } from "@/lib/supabase/client";

// isPersistenceConfigured() reads the environment, which prerendering would
// freeze at image build time; rendering per request lets the deployment
// platform supply credentials at runtime.
export const dynamic = "force-dynamic";

interface AnalyzePageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: AnalyzePageProps): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale as AppLocale, "/analyze") };
}

export default async function AnalyzePage({ params }: AnalyzePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("analyze");
  const common = await getTranslations("common");
  const brand = await getTranslations("brand");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <main className="py-8 sm:py-10">
        <div className="mb-8 max-w-measure">
          <h1 className="text-heading-sm font-normal">{t("heading")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("lede")}</p>
        </div>

        <Analyzer sharingEnabled={isPersistenceConfigured()} />
      </main>

      <footer className="border-t border-line py-8">
        <p className="max-w-measure text-sm leading-relaxed text-muted">{common("disclaimer")}</p>
      </footer>
    </div>
  );
}

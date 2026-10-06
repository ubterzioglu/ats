import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { type AppLocale } from "@/i18n/routing";
import { ResumeEditor } from "@/components/editor/resume-editor";
import { JsonLd } from "@/components/json-ld";
import { buildBreadcrumbJsonLd, pageAlternates } from "@/lib/seo";

interface BuildPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "editor" });
  return {
    title: t("title"),
    description: t("lede"),
    alternates: pageAlternates(locale as AppLocale, "/builder")
  };
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("editor");
  const common = await getTranslations("common");
  const brand = await getTranslations("brand");
  const nav = await getTranslations("nav");

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    locale as AppLocale,
    "/builder",
    t("title"),
    nav("home")
  );

  return (
    <div className="mx-auto w-full max-w-page px-4 sm:px-6">
      <JsonLd data={breadcrumbJsonLd} />
      <main className="py-8 sm:py-10">
        <div className="mb-8 max-w-measure">
          <h1 className="text-heading-sm font-normal">{t("title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("lede")}</p>
        </div>

        <ResumeEditor />
      </main>

      <footer className="border-t border-line py-8">
        <p className="max-w-measure text-sm leading-relaxed text-muted">{common("disclaimer")}</p>
      </footer>
    </div>
  );
}

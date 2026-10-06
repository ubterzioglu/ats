import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { ResumeEditor } from "@/components/editor/resume-editor";
import { SiteCredit } from "@/components/site-credit";

interface BuildPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "editor" });
  return {
    title: t("title"),
    robots: { index: false, follow: false }
  };
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("editor");

  return (
    <div className="mx-auto w-full max-w-page px-4 sm:px-6">
      <main className="py-8 sm:py-10">
        <div className="mb-8 max-w-measure">
          <h1 className="text-heading-sm font-normal">{t("title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("lede")}</p>
        </div>

        <ResumeEditor />
      </main>

      <footer className="border-t border-line py-8">
        <SiteCredit />
      </footer>
    </div>
  );
}

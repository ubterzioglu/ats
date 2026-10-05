import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResumeEditor } from "@/components/editor/resume-editor";

interface BuildPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("editor");
  const common = await getTranslations("common");
  const brand = await getTranslations("brand");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
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

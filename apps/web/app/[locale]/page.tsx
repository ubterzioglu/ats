import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ParseSweep } from "@/components/parse-sweep";

const DIMENSIONS: ReadonlyArray<{ readonly key: string; readonly weight: number }> = [
  { key: "parseability", weight: 25 },
  { key: "keywords", weight: 25 },
  { key: "impact", weight: 20 },
  { key: "structure", weight: 20 },
  { key: "contact", weight: 10 }
];

interface HomePageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const brand = await getTranslations("brand");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <span className="font-mono text-sm font-medium tracking-tight">{brand("name")}</span>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm text-muted transition-colors hover:text-ink">
            {common("signIn")}
          </Link>
        </div>
      </header>

      <main>
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1fr_minmax(0,27rem)] lg:gap-14 lg:py-16">
          <div>
            <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              {t("headline")}
            </h1>

            <p className="mt-6 max-w-measure text-base leading-relaxed text-muted sm:text-lg">
              {t("lede")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/analyze" className="btn">
                {t("analyzeCta")}
              </Link>
              <Link href="/login" className="btn-quiet">
                {common("signInToSave")}
              </Link>
            </div>

            <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted">
              {t("privacyNote")}
            </p>
          </div>

          <ParseSweep />
        </section>

        <section className="border-t border-line py-12 lg:py-16" aria-labelledby="method-heading">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
            <div className="lg:sticky lg:top-10 lg:self-start">
              <h2 id="method-heading" className="text-2xl font-semibold">
                {t("methodHeading")}
              </h2>
              <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted">
                {t("methodIntro")}
              </p>
              <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted">
                {t("methodNoBlackBox")}
              </p>
            </div>

            <dl className="space-y-7">
              {DIMENSIONS.map((dimension) => (
                <div key={dimension.key}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-medium">{t(`dimensions.${dimension.key}.name`)}</dt>
                    <span className="readout text-ink">{dimension.weight}</span>
                  </div>
                  <div
                    aria-hidden
                    className="ruler mt-2 h-1.5 overflow-hidden rounded-full border border-line bg-sheet"
                  >
                    <div className="h-full bg-accent/70" style={{ width: `${dimension.weight}%` }} />
                  </div>
                  <dd className="mt-2.5 max-w-measure text-sm leading-relaxed text-muted">
                    {t(`dimensions.${dimension.key}.what`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <p className="max-w-measure text-sm leading-relaxed text-muted">{common("disclaimer")}</p>
      </footer>
    </div>
  );
}

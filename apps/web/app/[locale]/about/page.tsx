import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/routing";
import { buildAboutPageJsonLd, buildBreadcrumbJsonLd, pageAlternates } from "@/lib/seo";
import { SITE_ENTITY } from "@/lib/site-entity";

import { JsonLd } from "@/components/json-ld";
import { SectionHeadline } from "@/components/ui/section-headline";

interface AboutPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    alternates: pageAlternates(locale as AppLocale, "/about")
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const home = await getTranslations("home");
  const common = await getTranslations("common");
  const metadata = await getTranslations("metadata");
  const nav = await getTranslations("nav");

  const aboutJsonLd = buildAboutPageJsonLd(
    locale as AppLocale,
    metadata("openGraphTitle"),
    metadata("description")
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    locale as AppLocale,
    "/about",
    t("title"),
    nav("home")
  );

  return (
    <div className="mx-auto w-full max-w-page px-4 sm:px-6">
      <JsonLd data={[aboutJsonLd, breadcrumbJsonLd]} />
      <main className="py-8 sm:py-10">
        <div className="mb-10 max-w-measure">
          <h1 className="text-heading-sm font-normal">{t("title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{metadata("description")}</p>
        </div>

        <div className="space-y-12">
          <SectionHeadline title={t("whatHeading")}>
            <p>{home("lede")}</p>
          </SectionHeadline>

          <SectionHeadline title={t("privacyHeading")}>
            <p>{home("report.body")}</p>
            <p className="mt-4">{t("privacy")}</p>
          </SectionHeadline>

          <SectionHeadline title={t("limitsHeading")}>
            <p>{common("disclaimer")}</p>
          </SectionHeadline>

          <SectionHeadline title={t("formatsHeading")}>
            <p>
              {t.rich("formats", {
                link: (chunks) => (
                  <Link
                    href="https://jsonresume.org/"
                    className="text-iris underline underline-offset-4 hover:text-iris/85"
                    target="_blank"
                    rel="noopener"
                  >
                    {chunks}
                  </Link>
                )
              })}
            </p>
          </SectionHeadline>

          <SectionHeadline title={t("contactHeading")}>
            <p>
              {t.rich("contact", {
                email: SITE_ENTITY.contactEmail,
                mail: (chunks) => (
                  <a
                    href={`mailto:${SITE_ENTITY.contactEmail}`}
                    className="text-iris underline underline-offset-4 hover:text-iris/85"
                  >
                    {chunks}
                  </a>
                )
              })}
            </p>
          </SectionHeadline>
        </div>
      </main>

      <footer className="border-t border-line py-8">
        <p className="max-w-measure text-sm leading-relaxed text-muted">{common("disclaimer")}</p>
      </footer>
    </div>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Fragment, type CSSProperties } from "react";

import { FaqSection } from "@/components/faq-section";
import { FeatureVisual, type FeatureVisualKey } from "@/components/home/feature-visuals";
import { HeroStickers } from "@/components/home/hero-stickers";
import { SectionBreak } from "@/components/home/section-break";
import { Sparkle, Tick } from "@/components/home/sparkle";
import { Ticker } from "@/components/home/ticker";
import { GhostLink } from "@/components/ui/ghost-link";
import { JsonLd } from "@/components/json-ld";
import { SiteCredit } from "@/components/site-credit";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionHeadline } from "@/components/ui/section-headline";
import { Tag } from "@/components/ui/tag";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildFaqJsonLd, buildHomeJsonLd, buildHowToJsonLd, FAQ_IDS, pageAlternates } from "@/lib/seo";
import { cx } from "@/lib/ui";

interface Feature {
  readonly key: FeatureVisualKey;
  readonly href?: "/analyze" | "/applications";
}

const FEATURES: readonly Feature[] = [
  { key: "analyze", href: "/analyze" },
  { key: "tracker", href: "/applications" },
  { key: "interview" },
  { key: "report" }
];

interface HomePageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale as AppLocale, "/") };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const metadata = await getTranslations("metadata");
  const nav = await getTranslations("nav");
  const faqT = await getTranslations("faq");

  const faqItems = FAQ_IDS.map((id) => ({
    id,
    question: faqT(`items.${id}.q`),
    answer: faqT(`items.${id}.a`)
  }));

  const howToSteps = [
    { name: "Upload", text: "Upload your CV as a PDF, DOCX or plain text file." },
    { name: "Extract", text: "The reader extracts the text the way a parser would." },
    { name: "Score", text: "Five dimensions are scored out of 100." },
    { name: "Fix", text: "Every lost point is attached to a named finding with a fix." }
  ];

  const jsonLd = [
    ...buildHomeJsonLd(locale as AppLocale, metadata("openGraphTitle"), metadata("description")),
    buildFaqJsonLd(faqItems),
    buildHowToJsonLd(howToSteps)
  ];

  return (
    <main>
      <JsonLd data={jsonLd} />
      <section className="mx-auto grid w-full max-w-page items-center gap-12 overflow-x-clip px-4 py-section-sm sm:px-6 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:py-0">
        <div>
          <SectionHeadline as="h1" scale="lg" label={t("eyebrow")} title={t("headline")}>
            <p>{t("lede")}</p>
          </SectionHeadline>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <PrimaryButton href="/analyze">{t("cta")}</PrimaryButton>
            <Tag tone="quiet">{t("privacyTag")}</Tag>
          </div>
        </div>

        <HeroStickers />
      </section>

      <Ticker />

      {FEATURES.map((feature, index) => {
        const headingId = `feature-${feature.key}`;
        const flip = index % 2 === 0;
        return (
          <Fragment key={feature.key}>
            {index > 0 ? <SectionBreak flip={!flip} /> : null}
            <section
              aria-labelledby={headingId}
              className="mx-auto grid w-full max-w-page items-center gap-10 px-4 py-section-sm sm:px-6 lg:grid-cols-2 lg:gap-24 lg:py-section"
            >
              {/* Zigzag: the picture alternates sides. The picture is decorative,
                  so reading order stays text-first on every screen. */}
              <div className={cx("reveal-up", flip ? "lg:order-2" : "lg:order-1")}>
                <SectionHeadline
                  id={headingId}
                  label={t(`${feature.key}.label`)}
                  title={t(`${feature.key}.title`)}
                >
                  <p>{t(`${feature.key}.body`)}</p>
                </SectionHeadline>
                {feature.href ? (
                  <GhostLink href={feature.href} className="mt-8 -ml-3">
                    {t(`${feature.key}.link`)}
                  </GhostLink>
                ) : null}
              </div>

              <div
                className={cx("reveal-side mx-auto w-full max-w-[34rem]", flip ? "lg:order-1" : "lg:order-2")}
                style={{ "--from": flip ? "-1" : "1" } as CSSProperties}
              >
                <div className="parallax">
                  <FeatureVisual name={feature.key} />
                </div>
              </div>
            </section>
          </Fragment>
        );
      })}

      <SectionBreak />

      <section className="mx-auto w-full max-w-page px-4 py-section-sm sm:px-6 lg:py-section">
        <div className="bench reveal-up p-6 sm:p-10 lg:p-14">
          <SectionHeadline title={t("how.title")}>
            <p>{t("how.body")}</p>
          </SectionHeadline>
        </div>
      </section>

      <SectionBreak flip />

      <section className="mx-auto w-full max-w-page overflow-x-clip px-4 py-section-sm sm:px-6 lg:py-section">
        <div
          className="sticker sticker-lime reveal-pop relative p-8 sm:p-12 lg:p-16"
          style={{ "--tilt": "-1.5deg" } as CSSProperties}
        >
          <h2 className="max-w-[14ch] text-display font-extrabold leading-[0.95] text-void">
            {t("closing.title")}
          </h2>
          <div className="mt-10">
            <Link href="/analyze" className="btn-dark">
              {t("closing.cta")}
            </Link>
          </div>
          <Sparkle className="absolute -right-4 -top-8 h-20 w-20 sm:-right-6 sm:-top-10 sm:h-28 sm:w-28" />
          <Tick className="absolute bottom-6 right-6 hidden h-24 w-24 sm:block lg:h-36 lg:w-36" />
        </div>
      </section>

      <FaqSection items={faqItems} />

      <footer className="mx-auto w-full max-w-page px-4 pb-12 pt-section-sm sm:px-6">
        <SiteCredit className="text-nav-label font-normal text-ash" />
        <GhostLink href="/about" className="mt-4 -ml-3">
          {nav("about")}
        </GhostLink>
      </footer>
    </main>
  );
}

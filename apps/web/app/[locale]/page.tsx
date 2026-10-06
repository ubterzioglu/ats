import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { FaqSection } from "@/components/faq-section";
import { HeroStickers } from "@/components/home/hero-stickers";
import { Sparkle, Tick } from "@/components/home/sparkle";
import { Ticker } from "@/components/home/ticker";
import { GhostLink } from "@/components/ui/ghost-link";
import { JsonLd } from "@/components/json-ld";
import { ParticleField } from "@/components/ui/particle-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionHeadline } from "@/components/ui/section-headline";
import { Tag } from "@/components/ui/tag";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildFaqJsonLd, buildHomeJsonLd, FAQ_IDS, pageAlternates } from "@/lib/seo";
import type { ShapeName } from "@/lib/particles/shapes";
import { cx } from "@/lib/ui";

interface Feature {
  readonly key: "analyze" | "tracker" | "interview" | "report";
  readonly shape: ShapeName;
  readonly seed: number;
  readonly href?: "/analyze" | "/applications";
}

const FEATURES: readonly Feature[] = [
  { key: "analyze", shape: "match", seed: 11, href: "/analyze" },
  { key: "tracker", shape: "pipeline", seed: 23, href: "/applications" },
  { key: "interview", shape: "orbit", seed: 37 },
  { key: "report", shape: "report", seed: 41 }
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
  const common = await getTranslations("common");
  const metadata = await getTranslations("metadata");
  const nav = await getTranslations("nav");
  const faqT = await getTranslations("faq");

  const faqItems = FAQ_IDS.map((id) => ({
    id,
    question: faqT(`items.${id}.q`),
    answer: faqT(`items.${id}.a`)
  }));

  const jsonLd = [
    ...buildHomeJsonLd(locale as AppLocale, metadata("openGraphTitle"), metadata("description")),
    buildFaqJsonLd(faqItems)
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
          <section
            key={feature.key}
            aria-labelledby={headingId}
            className="mx-auto grid w-full max-w-page items-center gap-10 px-4 py-section-sm sm:px-6 lg:grid-cols-2 lg:gap-24 lg:py-section"
          >
            {/* Zigzag: the picture alternates sides. The picture is decorative,
                so reading order stays text-first on every screen. */}
            <div className={cx(flip ? "lg:order-2" : "lg:order-1")}>
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
              aria-hidden="true"
              className={cx(
                "sticker overflow-hidden",
                flip ? "lg:order-1" : "lg:order-2 sticker-shadow-lime"
              )}
              style={{ "--tilt": flip ? "-2deg" : "2deg" } as CSSProperties}
            >
              <ParticleField
                shape={feature.shape}
                seed={feature.seed}
                className="relative aspect-[4/3] w-full lg:aspect-square"
              />
            </div>
          </section>
        );
      })}

      <section className="mx-auto w-full max-w-page px-4 py-section-sm sm:px-6 lg:py-section">
        <div className="bench p-6 sm:p-10 lg:p-14">
          <SectionHeadline title={t("how.title")}>
            <p>{t("how.body")}</p>
          </SectionHeadline>
        </div>
      </section>

      <section className="mx-auto w-full max-w-page overflow-x-clip px-4 py-section-sm sm:px-6 lg:py-section">
        <div
          className="sticker sticker-lime relative p-8 sm:p-12 lg:p-16"
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
        <p className="max-w-measure text-nav-label font-normal text-ash">
          {common("disclaimer")}
        </p>
        <GhostLink href="/about" className="mt-4 -ml-3">
          {nav("about")}
        </GhostLink>
      </footer>
    </main>
  );
}

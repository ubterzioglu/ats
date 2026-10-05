import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { GhostLink } from "@/components/ui/ghost-link";
import { ParticleField } from "@/components/ui/particle-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionHeadline } from "@/components/ui/section-headline";
import { Tag } from "@/components/ui/tag";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildHomeJsonLd, pageAlternates } from "@/lib/seo";
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

  const jsonLd = buildHomeJsonLd(locale as AppLocale, metadata("openGraphTitle"), metadata("description"));

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="mx-auto grid w-full max-w-page items-center gap-12 px-4 py-section-sm sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-0">
        <div>
          <SectionHeadline as="h1" scale="lg" label={t("eyebrow")} title={t("headline")}>
            <p>{t("lede")}</p>
          </SectionHeadline>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <PrimaryButton href="/analyze">{t("cta")}</PrimaryButton>
            <Tag tone="quiet">{t("privacyTag")}</Tag>
          </div>
        </div>

        <ParticleField
          shape="brain"
          seed={7}
          className="relative aspect-[5/4] w-full lg:aspect-auto lg:h-[min(72vh,680px)]"
        />
      </section>

      {FEATURES.map((feature, index) => {
        const number = String(index + 1).padStart(2, "0");
        const headingId = `feature-${feature.key}`;
        return (
          <section
            key={feature.key}
            aria-labelledby={headingId}
            className="mx-auto grid w-full max-w-page items-center gap-10 px-4 py-section-sm sm:px-6 lg:grid-cols-2 lg:gap-24 lg:py-section"
          >
            {/* Zigzag: the picture alternates sides. The picture is decorative,
                so reading order stays text-first on every screen. */}
            <div className={cx(index % 2 === 0 ? "lg:order-2" : "lg:order-1")}>
              <SectionHeadline
                id={headingId}
                label={`${number} - ${t(`${feature.key}.label`)}`}
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

            <ParticleField
              shape={feature.shape}
              seed={feature.seed}
              className={cx(
                "relative aspect-[4/3] w-full lg:aspect-square",
                index % 2 === 0 ? "lg:order-1" : "lg:order-2"
              )}
            />
          </section>
        );
      })}

      <section className="relative overflow-hidden py-section-sm lg:py-section">
        <ParticleField shape="ambient" seed={3} className="absolute inset-0" />
        <div className="relative mx-auto w-full max-w-page px-4 sm:px-6">
          <h2 className="max-w-[16ch] text-display font-normal text-bone">{t("closing.title")}</h2>
          <div className="mt-12">
            <PrimaryButton href="/analyze">{t("closing.cta")}</PrimaryButton>
          </div>
        </div>
      </section>

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

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LinkedinCheck } from "@/components/linkedin/linkedin-check";
import { SiteCredit } from "@/components/site-credit";
import { GhostLink } from "@/components/ui/ghost-link";
import { PrimaryButton } from "@/components/ui/primary-button";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  FEATURE_SLUGS,
  FEATURE_TOOLS,
  featurePath,
  isFeatureSlug,
  neighbours
} from "@/lib/features";
import { getFeatureContent } from "@/lib/features/content";
import { pageAlternates } from "@/lib/seo";

interface FeaturePageProps {
  readonly params: Promise<{ readonly locale: string; readonly slug: string }>;
}

export function generateStaticParams(): { locale: string; slug: string }[] {
  return routing.locales.flatMap((locale) => FEATURE_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isFeatureSlug(slug)) return {};
  const entry = getFeatureContent(locale as AppLocale)[slug];
  return {
    title: entry.title,
    description: entry.summary,
    alternates: pageAlternates(locale as AppLocale, featurePath(slug))
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { locale, slug } = await params;
  if (!isFeatureSlug(slug)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("features");
  const content = getFeatureContent(locale as AppLocale);
  const entry = content[slug];
  const tool = FEATURE_TOOLS[slug];
  const { previous, next } = neighbours(slug);

  return (
    <div className="mx-auto w-full max-w-page px-4 sm:px-6">
      <main className="py-8 sm:py-10">
        <GhostLink href="/features" className="-ml-3">
          {t("all")}
        </GhostLink>

        <article className="mt-6 max-w-measure">
          <h1 className="text-heading-sm font-bold text-bone sm:text-heading">{entry.title}</h1>
          <p className="mt-3 text-body text-mist">{entry.summary}</p>

          {entry.intro ? <p className="mt-8 text-mist">{entry.intro}</p> : null}
          <ul className="mt-4 list-disc space-y-3 pl-5 text-mist marker:text-lime">
            {entry.points.map((point) => (
              <li key={`${point.label ?? ""}${point.text}`}>
                {point.label ? <strong className="font-semibold text-bone">{point.label}: </strong> : null}
                {point.text}
              </li>
            ))}
          </ul>
          {entry.outro ? <p className="mt-6 text-mist">{entry.outro}</p> : null}

          {tool ? (
            <div className="mt-10">
              <PrimaryButton href={tool}>{t("open")}</PrimaryButton>
            </div>
          ) : null}
        </article>

        {slug === "linkedin" ? <LinkedinCheck /> : null}

        <nav className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          {previous ? (
            <GhostLink href={featurePath(previous)} className="-ml-3">
              {t("previous")}: {content[previous].title}
            </GhostLink>
          ) : (
            <span />
          )}
          {next ? (
            <GhostLink href={featurePath(next)}>
              {t("next")}: {content[next].title}
            </GhostLink>
          ) : null}
        </nav>

        <footer className="mt-12 border-t border-line pt-8">
          <SiteCredit />
        </footer>
      </main>
    </div>
  );
}

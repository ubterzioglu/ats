import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";
import { getPublishedPost, getPublishedPostBySlug } from "@/lib/blog/queries";
import { markdownToHtml } from "@/lib/blog/markdown";
import { SITE_URL, OPEN_GRAPH_LOCALE, buildBlogPostingJsonLd, buildBlogBreadcrumbJsonLd } from "@/lib/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;
  const post = await getPublishedPost(slug, appLocale);

  if (!post) return {};

  const allVersions = await getPublishedPostBySlug(slug);
  const alternates: Record<string, string> = {};
  for (const version of allVersions) {
    if (version.locale === "en") {
      alternates["en"] = `${SITE_URL}/blog/${slug}`;
    } else {
      alternates[version.locale] = `${SITE_URL}/${version.locale}/blog/${slug}`;
    }
  }
  alternates["x-default"] = `${SITE_URL}/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: locale === "en" ? `${SITE_URL}/blog/${slug}` : `${SITE_URL}/${locale}/blog/${slug}`,
      languages: alternates,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      locale: OPEN_GRAPH_LOCALE[appLocale],
      type: "article",
      publishedTime: post.published_at ?? post.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;
  const t = await getTranslations("blog");
  const post = await getPublishedPost(slug, appLocale);

  if (!post) {
    notFound();
  }

  const html = markdownToHtml(post.body_md);
  const allVersions = await getPublishedPostBySlug(slug);
  const orderedLocales: readonly string[] = ["en", "tr", "de"];
  const sortedVersions = [...allVersions].sort(
    (a, b) => orderedLocales.indexOf(a.locale) - orderedLocales.indexOf(b.locale)
  );

  const blogPostingJsonLd = buildBlogPostingJsonLd(
    appLocale,
    slug,
    post.title,
    post.description,
    post.published_at ?? post.created_at,
    post.author_email
  );

  const breadcrumbJsonLd = buildBlogBreadcrumbJsonLd(appLocale, slug, post.title);

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={8} className="absolute inset-0" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([blogPostingJsonLd, breadcrumbJsonLd]) }}
      />

      <article className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bone/10 pb-5 mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-ash transition-colors hover:text-bone"
          >
            <span aria-hidden="true">&larr;</span> {t("backToList")}
          </Link>

          {sortedVersions.length > 1 && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-medium text-ash">
                {t("availableIn")}
              </span>
              <div className="flex items-center gap-1.5" role="group" aria-label={t("availableIn")}>
                {sortedVersions.map((v) => {
                  const isCurrent = v.locale === appLocale;
                  return isCurrent ? (
                    <span
                      key={v.locale}
                      className="inline-flex items-center justify-center rounded-lg border-2 border-lime bg-lime/15 px-3 py-1 font-display text-xs sm:text-sm font-bold text-lime shadow-sm"
                      aria-current="true"
                    >
                      {v.locale.toUpperCase()}
                    </span>
                  ) : (
                    <Link
                      key={v.locale}
                      href={`/blog/${v.slug}`}
                      locale={v.locale}
                      className="inline-flex items-center justify-center rounded-lg border border-bone/20 bg-bench/80 px-3 py-1 font-display text-xs sm:text-sm font-semibold text-mist transition-all hover:border-lime/60 hover:text-bone hover:bg-bench-raised"
                    >
                      {v.locale.toUpperCase()}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <header className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.625rem] font-bold text-bone leading-[1.2] tracking-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-xs sm:text-sm font-medium text-ash">
            {new Date(post.published_at ?? post.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}

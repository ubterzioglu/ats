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
  const otherVersions = allVersions.filter((v) => v.locale !== appLocale);

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

      <article className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/blog"
          className="text-caption text-ash transition-colors hover:text-action"
        >
          &larr; {t("backToList")}
        </Link>

        {otherVersions.length > 0 && (
          <p className="mt-4 text-caption text-ash">
            {t("availableIn")}{" "}
            {otherVersions.map((v, i) => (
              <span key={v.locale}>
                {i > 0 && ", "}
                <Link
                  href={`/blog/${v.slug}`}
                  className="text-action hover:underline"
                  locale={v.locale}
                >
                  {v.locale.toUpperCase()}
                </Link>
              </span>
            ))}
          </p>
        )}

        <header className="mt-8">
          <h1 className="text-display font-normal text-bone">{post.title}</h1>
          {post.description && (
            <p className="mt-4 text-body-lg font-light text-mist">{post.description}</p>
          )}
          <p className="mt-6 text-caption text-ash">
            {new Date(post.published_at ?? post.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <div
          className="prose prose-invert mt-12 max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}

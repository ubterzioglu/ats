import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParticleField } from "@/components/ui/particle-field";
import { listAllPublishedPosts } from "@/lib/blog/queries";
import { BlogList } from "@/components/blog/blog-list";
import { SITE_URL, OPEN_GRAPH_LOCALE, WEBSITE_ID } from "@/lib/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const appLocale = locale as AppLocale;

  return {
    title: t("title"),
    description: t("lede"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        en: `${SITE_URL}/blog`,
        tr: `${SITE_URL}/tr/blog`,
        de: `${SITE_URL}/de/blog`,
        "x-default": `${SITE_URL}/blog`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("lede"),
      locale: OPEN_GRAPH_LOCALE[appLocale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("lede"),
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("blog");
  const posts = await listAllPublishedPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("lede"),
    url: `${SITE_URL}/${locale}/blog`,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
  };

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={7} className="absolute inset-0" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-bone tracking-tight">{t("title")}</h1>
        <p className="mt-4 max-w-measure text-body text-mist">{t("lede")}</p>

        <BlogList posts={posts} />
      </div>
    </div>
  );
}

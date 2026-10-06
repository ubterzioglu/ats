import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";
import { getPublishedPost } from "@/lib/blog/queries";
import { markdownToHtml } from "@/lib/blog/markdown";

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("blog");
  const post = await getPublishedPost(slug, locale as "en" | "tr" | "de");

  if (!post) {
    notFound();
  }

  const html = markdownToHtml(post.body_md);

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={8} className="absolute inset-0" />

      <article className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/blog"
          className="text-caption text-ash transition-colors hover:text-action"
        >
          ← {t("backToList")}
        </Link>

        <header className="mt-8">
          <h1 className="text-display font-normal text-bone">{post.title}</h1>
          {post.description && (
            <p className="mt-4 text-body-lg font-light text-mist">{post.description}</p>
          )}
          <p className="mt-6 text-caption text-ash">
            {new Date(post.published_at ?? post.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric"
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

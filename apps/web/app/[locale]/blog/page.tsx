import { getTranslations } from "next-intl/server";
import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";
import { listPublishedPosts } from "@/lib/blog/queries";

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("blog");
  const posts = await listPublishedPosts(locale as "en" | "tr" | "de");

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={7} className="absolute inset-0" />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-heading-lg font-normal text-bone">{t("title")}</h1>
        <p className="mt-4 max-w-measure text-body font-extralight text-mist">{t("lede")}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-body text-mist">{t("empty")}</p>
        ) : (
          <ul className="mt-12 space-y-8">
            {posts.map((post) => (
              <li key={post.id} className="group">
                <Link
                  href={`/blog/${post.slug}`}
                  className="block rounded-2xl border-2 border-bone/10 bg-void/40 p-6 transition-colors hover:border-bone/30"
                >
                  <h2 className="text-h3 font-normal text-bone group-hover:text-action">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="mt-2 text-body text-mist">{post.description}</p>
                  )}
                  <p className="mt-4 text-caption text-ash">
                    {new Date(post.published_at ?? post.created_at).toLocaleDateString(locale)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

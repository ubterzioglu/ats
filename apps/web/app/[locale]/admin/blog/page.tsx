import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAllPosts } from "@/lib/blog/admin-queries";

export default async function AdminBlogPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireAdmin();
  if (!user) redirect("/");

  const t = await getTranslations("admin.blog");
  const posts = await listAllPosts(locale as "en" | "tr" | "de");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg font-normal text-bone">{t("title")}</h1>
        <Link
          href="/admin/blog/new"
          className="btn-primary"
        >
          {t("newPost")}
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 text-center text-body text-mist">{t("empty")}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex items-center justify-between rounded-2xl border-2 border-bone/10 bg-void/40 p-4"
            >
              <div>
                <h2 className="text-h3 font-normal text-bone">{post.title}</h2>
                <p className="mt-1 text-caption text-ash">
                  {post.status === "published" ? "Published" : "Draft"} ·{" "}
                  {new Date(post.updated_at).toLocaleDateString(locale)}
                </p>
              </div>
              <Link
                href={`/admin/blog/${post.id}`}
                className="btn-quiet"
              >
                {t("edit")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

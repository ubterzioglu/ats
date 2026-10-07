import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { createPost } from "@/lib/blog/admin-queries";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/schema";
import { BlogEditor } from "./editor";

export default async function NewBlogPostPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdmin();
  const { locale } = await params;
  const t = await getTranslations("admin.blog.editor");

  async function handleSubmit(formData: FormData) {
    "use server";
    await requireAdmin();

    const input = {
      locale: formData.get("locale") as BlogLocale,
      slug: formData.get("slug") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      body_md: formData.get("body_md") as string,
      status: formData.get("status") as "draft" | "published",
      published_at: formData.get("published_at") as string | null,
      author_email: formData.get("author_email") as string
    };

    const result = await createPost(input);
    if (!result.ok) {
      throw new Error(result.error);
    }

    redirect(`/${locale}/admin/blog`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <Link href={`/${locale}/admin/blog`} className="text-caption text-ash hover:text-bone">
          ← {t("backToList")}
        </Link>
        <h1 className="mt-4 text-heading-lg font-normal text-bone">{t("newPost")}</h1>
      </div>

      <BlogEditor locales={BLOG_LOCALES} defaultLocale={locale as BlogLocale} action={handleSubmit} />
    </div>
  );
}

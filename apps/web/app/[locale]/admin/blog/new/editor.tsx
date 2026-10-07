"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { slugify, type BlogLocale, type BlogPost } from "@/lib/blog/schema";

interface BlogEditorProps {
  readonly locales: readonly BlogLocale[];
  readonly defaultLocale: BlogLocale;
  readonly initialData?: BlogPost;
  readonly action: (formData: FormData) => Promise<void>;
  readonly deleteAction?: () => Promise<void>;
}

export function BlogEditor({ locales, defaultLocale, initialData, action, deleteAction }: BlogEditorProps) {
  const t = useTranslations("admin.blog.editor");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [autoSlug, setAutoSlug] = useState(!initialData);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (autoSlug) {
      setSlug(slugify(newTitle));
    }
  }

  async function handleDelete() {
    if (confirm(t("confirmDelete"))) {
      await deleteAction?.();
    }
  }

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="locale" className="block text-caption text-ash">
            {t("locale")}
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue={defaultLocale}
            className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 text-body text-bone"
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {loc.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-caption text-ash">
            {t("title")}
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 text-body text-bone"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-caption text-ash">
            {t("slug")}
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            required
            pattern="[a-z0-9-]+"
            className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 font-mono text-body text-bone"
          />
          <p className="mt-1 text-caption text-ash">{t("slugHint")}</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-caption text-ash">
            {t("description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={initialData?.description ?? ""}
            className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 text-body text-bone"
          />
        </div>

        <div>
          <label htmlFor="body_md" className="block text-caption text-ash">
            {t("body")}
          </label>
          <textarea
            id="body_md"
            name="body_md"
            rows={20}
            defaultValue={initialData?.body_md ?? ""}
            className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 font-mono text-body text-bone"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-caption text-ash">
              {t("status")}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.status ?? "draft"}
              className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 text-body text-bone"
            >
              <option value="draft">{t("draft")}</option>
              <option value="published">{t("published")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="published_at" className="block text-caption text-ash">
              {t("publishedAt")}
            </label>
            <input
              id="published_at"
              name="published_at"
              type="datetime-local"
              defaultValue={initialData?.published_at?.slice(0, 16) ?? ""}
              className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 text-body text-bone"
            />
          </div>
        </div>

        <div>
          <label htmlFor="author_email" className="block text-caption text-ash">
            {t("authorEmail")}
          </label>
          <input
            id="author_email"
            name="author_email"
            type="email"
            defaultValue={initialData?.author_email ?? ""}
            className="mt-1 w-full rounded-lg border-2 border-bone/10 bg-void/40 px-4 py-2 text-body text-bone"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t-2 border-bone/10 pt-6">
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            {initialData ? t("save") : t("create")}
          </button>
        </div>

        {deleteAction && (
          <button type="button" onClick={handleDelete} className="btn-quiet text-red-400 hover:text-red-300">
            {t("delete")}
          </button>
        )}
      </div>
    </form>
  );
}

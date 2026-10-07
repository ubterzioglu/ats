"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageFilter } from "@/components/blog/language-filter";
import type { BlogLocale, BlogPost } from "@/lib/blog/schema";
import type { AppLocale } from "@/i18n/routing";

interface Props {
  readonly posts: readonly BlogPost[];
}

export function BlogList({ posts }: Props) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("blog");
  const [activeLocale, setActiveLocale] = useState<BlogLocale>(locale as BlogLocale);

  const filtered = posts.filter((p) => p.locale === activeLocale);

  return (
    <>
      <div className="mt-8">
        <LanguageFilter activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-body text-mist">{t("empty")}</p>
      ) : (
        <ul className="mt-12 space-y-8">
          {filtered.map((post) => (
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
    </>
  );
}

import { z } from "zod";

export const BLOG_LOCALES = ["en", "tr", "de"] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const blogPostSchema = z.object({
  locale: z.enum(BLOG_LOCALES),
  slug: z.string().regex(SLUG_PATTERN, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).default(""),
  body_md: z.string().default(""),
  status: z.enum(BLOG_STATUSES).default("draft"),
  published_at: z.string().datetime().optional().nullable(),
  author_email: z.string().email().or(z.literal("")).default("")
});

export type BlogPostInput = z.input<typeof blogPostSchema>;
export type BlogPostParsed = z.output<typeof blogPostSchema>;

export interface BlogPost {
  readonly id: string;
  readonly locale: BlogLocale;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body_md: string;
  readonly status: BlogStatus;
  readonly published_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly author_email: string;
}

export function validateBlogPost(input: unknown): { ok: true; data: BlogPostParsed } | { ok: false; error: string } {
  const result = blogPostSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid input" };
  }
  return { ok: true, data: result.data };
}

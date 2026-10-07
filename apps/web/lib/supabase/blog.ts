import "server-only";

import { createServiceClient } from "./client";
import type { BlogPost, BlogLocale, BlogStatus } from "@/lib/blog/schema";

export async function listPublishedPosts(locale: BlogLocale): Promise<BlogPost[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[blog] listPublishedPosts failed", error.message);
    return [];
  }

  return (data as BlogPost[]) ?? [];
}

export async function getPublishedPost(locale: BlogLocale, slug: string): Promise<BlogPost | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("[blog] getPublishedPost failed", error.message);
    return null;
  }

  return data as BlogPost;
}

export async function listAllPostsForAdmin(): Promise<BlogPost[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[blog] listAllPostsForAdmin failed", error.message);
    return [];
  }

  return (data as BlogPost[]) ?? [];
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("[blog] getPostById failed", error.message);
    return null;
  }

  return data as BlogPost;
}

export type SavePostOutcome =
  | { readonly ok: true; readonly post: BlogPost }
  | { readonly ok: false; readonly reason: "env-missing" | "save-failed" | "slug-taken" };

export async function savePost(
  id: string | null,
  input: {
    locale: BlogLocale;
    slug: string;
    title: string;
    description: string;
    body_md: string;
    status: BlogStatus;
    published_at?: string | null;
    author_email: string;
  }
): Promise<SavePostOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const payload = {
      locale: input.locale,
      slug: input.slug,
      title: input.title,
      description: input.description,
      body_md: input.body_md,
      status: input.status,
      published_at: input.status === "published" ? input.published_at ?? new Date().toISOString() : null,
      author_email: input.author_email,
      updated_at: new Date().toISOString()
    };

    let query;
    if (id) {
      query = supabase.from("blog_posts").update(payload).eq("id", id).select().single();
    } else {
      query = supabase.from("blog_posts").insert(payload).select().single();
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "23505") {
        return { ok: false, reason: "slug-taken" };
      }
      console.error("[blog] savePost failed", error.message);
      return { ok: false, reason: "save-failed" };
    }

    return { ok: true, post: data as BlogPost };
  } catch (cause) {
    console.error("[blog] savePost failed", cause instanceof Error ? cause.message : String(cause));
    return { ok: false, reason: "save-failed" };
  }
}

export type DeletePostOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "delete-failed" };

export async function deletePost(id: string): Promise<DeletePostOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      console.error("[blog] deletePost failed", error.message);
      return { ok: false, reason: "delete-failed" };
    }

    return { ok: true };
  } catch (cause) {
    console.error("[blog] deletePost failed", cause instanceof Error ? cause.message : String(cause));
    return { ok: false, reason: "delete-failed" };
  }
}

import "server-only";

import { createServiceClient } from "@/lib/supabase/client";
import type { BlogPost, BlogPostInput } from "./schema";
import { validateBlogPost } from "./schema";

export async function listAllPosts(locale: "en" | "tr" | "de"): Promise<readonly BlogPost[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as BlogPost[];
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

export async function createPost(
  input: BlogPostInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const validation = validateBlogPost(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "Database unavailable" };
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      locale: validation.data.locale,
      slug: validation.data.slug,
      title: validation.data.title,
      description: validation.data.description,
      body_md: validation.data.body_md,
      status: validation.data.status,
      published_at: validation.data.published_at,
      author_email: validation.data.author_email
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create post" };
  }

  return { ok: true, id: data.id };
}

export async function updatePost(
  id: string,
  input: BlogPostInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validation = validateBlogPost(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "Database unavailable" };
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({
      locale: validation.data.locale,
      slug: validation.data.slug,
      title: validation.data.title,
      description: validation.data.description,
      body_md: validation.data.body_md,
      status: validation.data.status,
      published_at: validation.data.published_at,
      author_email: validation.data.author_email,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deletePost(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "Database unavailable" };
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

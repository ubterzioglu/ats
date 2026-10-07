import "server-only";

import { createServiceClient } from "@/lib/supabase/client";
import type { BlogPost } from "./schema";

export async function listPublishedPosts(locale: "en" | "tr" | "de"): Promise<readonly BlogPost[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return data as BlogPost[];
}

export async function getPublishedPost(
  slug: string,
  locale: "en" | "tr" | "de"
): Promise<BlogPost | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

export async function listAllPublishedPosts(): Promise<readonly BlogPost[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return data as BlogPost[];
}

export async function getPublishedPostBySlug(
  slug: string
): Promise<readonly BlogPost[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published");

  if (error || !data) return [];
  return data as BlogPost[];
}

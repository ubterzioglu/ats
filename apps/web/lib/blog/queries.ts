import "server-only";

import { getSupabaseEnv, getServiceClient } from "@/lib/supabase/server";
import type { BlogPost } from "./schema";

export async function listPublishedPosts(locale: "en" | "tr" | "de"): Promise<readonly BlogPost[]> {
  const env = getSupabaseEnv();
  if (!env) return [];

  const supabase = getServiceClient();
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
  const env = getSupabaseEnv();
  if (!env) return null;

  const supabase = getServiceClient();
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

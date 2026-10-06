import "server-only";

import { getSupabaseEnv, getServiceClient } from "@/lib/supabase/server";
import type { BlogPost } from "./schema";

export async function listAllPosts(locale: "en" | "tr" | "de"): Promise<readonly BlogPost[]> {
  const env = getSupabaseEnv();
  if (!env) return [];

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as BlogPost[];
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const env = getSupabaseEnv();
  if (!env) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

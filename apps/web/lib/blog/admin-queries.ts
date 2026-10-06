import "server-only";

import { createServiceClient } from "@/lib/supabase/client";
import type { BlogPost } from "./schema";

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

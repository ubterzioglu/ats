import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { parseArticleSource, type ArticleLocale } from "../lib/blog/source-parse";

function loadEnv(): void {
  const envPath = resolve(__dirname, "../.env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist
  }
}

loadEnv();

const SOURCE_FILE = resolve(__dirname, "../../../ATS Uyumlu Özgeçmiş Makale Araştırması.md");
const SLUG_PREFIX = "ats-resume-section";
const LOCALES: readonly ArticleLocale[] = ["tr", "de", "en"];

// Without --update, rows that already exist are left alone. With it, title,
// description and body of the existing rows are rewritten (status, dates and
// anything else an admin changed stay as they are).
const UPDATE_EXISTING = process.argv.includes("--update");
const DRY_RUN = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  const markdown = readFileSync(SOURCE_FILE, "utf-8");
  const sections = parseArticleSource(markdown);

  if (sections.length === 0) {
    console.error("No sections parsed. Check the source file format.");
    process.exit(1);
  }

  console.log(`Parsed ${sections.length} sections.`);

  if (DRY_RUN) {
    for (const section of sections) {
      for (const locale of LOCALES) {
        const draft = section[locale];
        console.log(
          `  ${locale}/${SLUG_PREFIX}-${section.number}  "${draft.title}"  ` +
            `body ${draft.body.length} chars, ${draft.body.split("\n\n").length} blocks`,
        );
      }
    }
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const section of sections) {
    const slug = `${SLUG_PREFIX}-${section.number}`;

    for (const locale of LOCALES) {
      const draft = section[locale];
      const label = `${locale}/${slug}`;

      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();

      if (existing) {
        if (!UPDATE_EXISTING) {
          console.log(`  Skip (exists): ${label}`);
          skipped++;
          continue;
        }
        const { error } = await supabase
          .from("blog_posts")
          .update({ title: draft.title, description: draft.description, body_md: draft.body })
          .eq("id", existing.id);
        if (error) {
          console.error(`  Error updating ${label}:`, error.message);
        } else {
          console.log(`  Updated: ${label}`);
          updated++;
        }
        continue;
      }

      const { error } = await supabase.from("blog_posts").insert({
        locale,
        slug,
        title: draft.title,
        description: draft.description,
        body_md: draft.body,
        status: "published",
        published_at: now,
      });
      if (error) {
        console.error(`  Error inserting ${label}:`, error.message);
      } else {
        console.log(`  Inserted: ${label}`);
        inserted++;
      }
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

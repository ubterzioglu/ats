import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

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

interface Section {
  readonly number: number;
  readonly fullTitle: string;
  readonly trTitle: string;
  readonly enTitle: string;
  readonly trBody: string;
  readonly deBody: string;
  readonly enBody: string;
  readonly tableMd: string;
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function extractTitles(fullTitle: string): { trTitle: string; enTitle: string } {
  const cleaned = stripBold(fullTitle);
  const parenMatch = cleaned.match(/\(([^)]+)\)\s*$/);
  const enTitle = parenMatch ? parenMatch[1]!.trim() : cleaned;
  const trTitle = parenMatch ? cleaned.replace(/\s*\([^)]+\)\s*$/, "").trim() : cleaned;
  return { trTitle, enTitle };
}

function parseSections(markdown: string): readonly Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  const h2Indices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+\*?\*?\d+\\?\./.test(lines[i]!)) {
      h2Indices.push(i);
    }
  }

  const worksCitedIdx = lines.findIndex((l) => /^####\s+\*\*Works cited/i.test(l));

  for (let h = 0; h < h2Indices.length; h++) {
    const startIdx = h2Indices[h]!;
    const endIdx = h < h2Indices.length - 1 ? h2Indices[h + 1]! : (worksCitedIdx > -1 ? worksCitedIdx : lines.length);
    const h2Line = lines[startIdx]!;
    const numberMatch = h2Line.match(/^##\s+\**(\d+)\\?\./);
    if (!numberMatch) continue;
    const sectionNumber = parseInt(numberMatch[1]!, 10);

    const sectionLines = lines.slice(startIdx + 1, endIdx);
    const sectionText = sectionLines.join("\n");

    const trStart = sectionLines.findIndex((l) => /^###\s+\*?\*?Türkçe/i.test(l.trim()));
    const deStart = sectionLines.findIndex((l) => /^###\s+\*?\*?Deutsch/i.test(l.trim()));
    const enStart = sectionLines.findIndex((l) => /^###\s+\*?\*?English/i.test(l.trim()));

    if (trStart === -1 || deStart === -1 || enStart === -1) continue;

    const contentStart = (idx: number): number => {
      for (let j = idx + 1; j < sectionLines.length; j++) {
        if (sectionLines[j]!.trim().length > 0) return j;
      }
      return idx + 1;
    };

    const contentEnd = (nextHeading: number): number => {
      for (let j = nextHeading - 1; j >= 0; j--) {
        if (sectionLines[j]!.trim().length > 0) return j + 1;
      }
      return nextHeading;
    };

    const trBodyEnd = contentEnd(deStart);
    const deBodyEnd = contentEnd(enStart);

    const tableLines: string[] = [];
    for (let j = deBodyEnd; j < sectionLines.length; j++) {
      const trimmed = sectionLines[j]!.trim();
      if (trimmed.startsWith("|") || trimmed === "") {
        if (trimmed.startsWith("|")) tableLines.push(sectionLines[j]!);
      } else if (/^#{1,6}\s/.test(trimmed)) {
        break;
      }
    }
    const tableMd = tableLines.join("\n").trim();

    const trBody = sectionLines.slice(contentStart(trStart), trBodyEnd).join("\n").trim();
    const deBody = sectionLines.slice(contentStart(deStart), deBodyEnd).join("\n").trim();
    const enBody = sectionLines.slice(contentStart(enStart), deBodyEnd).join("\n").trim();

    const { trTitle, enTitle } = extractTitles(h2Line.replace(/^##\s+\*?\*?\d+\\?\.\s*/, ""));

    sections.push({
      number: sectionNumber,
      fullTitle: stripBold(h2Line.replace(/^##\s+/, "")),
      trTitle,
      enTitle,
      trBody: tableMd ? `${trBody}\n\n${tableMd}` : trBody,
      deBody: tableMd ? `${deBody}\n\n${tableMd}` : deBody,
      enBody: tableMd ? `${enBody}\n\n${tableMd}` : enBody,
    });
  }

  return sections;
}

function makeDescription(body: string): string {
  const plain = body
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\|/g, " ")
    .replace(/\n+/g, " ")
    .trim();
  return plain.slice(0, 500);
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
    process.exit(1);
  }

  const markdown = readFileSync(SOURCE_FILE, "utf-8");
  const sections = parseSections(markdown);

  if (sections.length === 0) {
    console.error("No sections parsed. Check the source file format.");
    process.exit(1);
  }

  console.log(`Parsed ${sections.length} sections.`);

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;

  for (const section of sections) {
    const slug = `${SLUG_PREFIX}-${section.number}`;

    const posts: Array<{
      locale: string;
      slug: string;
      title: string;
      description: string;
      body_md: string;
      status: string;
      published_at: string;
    }> = [
      {
        locale: "tr",
        slug,
        title: section.trTitle,
        description: makeDescription(section.trBody),
        body_md: section.trBody,
        status: "published",
        published_at: now,
      },
      {
        locale: "de",
        slug,
        title: section.enTitle,
        description: makeDescription(section.deBody),
        body_md: section.deBody,
        status: "published",
        published_at: now,
      },
      {
        locale: "en",
        slug,
        title: section.enTitle,
        description: makeDescription(section.enBody),
        body_md: section.enBody,
        status: "published",
        published_at: now,
      },
    ];

    for (const post of posts) {
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", post.slug)
        .eq("locale", post.locale)
        .maybeSingle();

      if (existing) {
        console.log(`  Skip (exists): ${post.locale}/${post.slug}`);
        skipped++;
        continue;
      }

      const { error } = await supabase.from("blog_posts").insert(post);
      if (error) {
        console.error(`  Error inserting ${post.locale}/${post.slug}:`, error.message);
      } else {
        console.log(`  Inserted: ${post.locale}/${post.slug}`);
        inserted++;
      }
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

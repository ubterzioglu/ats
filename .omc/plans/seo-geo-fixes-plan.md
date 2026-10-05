# Plan: SEO / GEO fixes for atsfreeforall.com

Executor: a coding agent with no prior context. Read this whole file before touching anything.
Repo: `C:\temp_private\ats` (github.com/ubterzioglu/ats). App lives in `apps/web`. Branch: `seo-geo-fixes` (already created, check out
and stay on it). Do not push. Do not merge.

## Background

`geo audit --url https://atsfreeforall.com` scored the live site 19/100. Missing: robots.txt, llms.txt, JSON-LD, canonical.
Already fine: title, description, og:title, og:description, SSR content, CDN bot access.

The tool `geo fix` produced a draft, but most of it is unusable (invented search route, Italian FAQ, placeholder logo and
social URLs, nonexistent og-image). **Do not run `geo fix --apply` and do not copy its output.** Everything you need is in this plan.

Stack: Next.js 15 App Router, React 19, TypeScript strict (`noUncheckedIndexedAccess`), next-intl (locales `en`, `tr`, `de`;
`en` has no URL prefix, `/tr` and `/de` are prefixed), Tailwind. Read `AGENTS.md` at the repo root first and follow it.

## Hard rules

- Do not touch `lib/scoring/`, `lib/extract/`, `lib/ai/`, `lib/supabase/`.
- Privacy contract: the CV never leaves the browser. No change here may send CV text anywhere. Public copy may repeat
  "nothing is uploaded" but must not promise more than that.
- No invented facts: no company name, no social URLs, no logo URL, no price, no dates, no phone, no email. If a value is not
  already in the code or `messages/*.json`, leave the field out.
- No `any`. `interface` for shapes, `type` for unions. `readonly` on props and result types. Named exports (default export only for
  `app/` pages and route files that Next requires). kebab-case filenames. `@/` alias. Import groups: external, `@/`, relative,
  separated by blank lines. No comments that restate the code. No emojis.
- Do not edit existing files beyond what each step lists. Do not reformat unrelated lines.
- Do not use `git add -A` or `git add .`. `.omc/project-memory.json` is modified and unrelated; never commit it.

## Decisions already made (do not re-ask)

1. No `Organization` schema. No `sameAs`. No `logo`.
2. Sitemap contains only `/`, `/analyze`, `/builder`, each in en, tr, de. Not `/applications`, `/login`, `/r/*`, `/api/*`, `/auth/*`.
3. No `og:image`, no `ai/*.json`, no FAQPage, no SearchAction, no RSS.
4. Allow all AI bots in robots.txt (search and training alike). Disallow only the private paths below.
5. Canonical and hreflang are set per page, not in the layout (a layout-level canonical would point every page at the home page).

## Step 0 - Orient

```bash
git checkout seo-geo-fixes
git status --short --branch
```

Find where `package.json` is (expected `apps/web`); run all npm commands there. Read these files fully before editing:

- `apps/web/app/[locale]/layout.tsx`
- `apps/web/app/[locale]/page.tsx`
- `apps/web/app/[locale]/analyze/page.tsx`
- `apps/web/app/[locale]/builder/page.tsx`
- `apps/web/middleware.ts`
- `apps/web/i18n/routing.ts`
- `apps/web/messages/en.json` (keys `metadata`, `common`, and the navigation labels)
- an existing file in `apps/web/tests/` to copy the import and alias style

Run the baseline once and record the result: `npm run lint && npm run typecheck && npm test`. All must pass before you start.

## Step 1 - `apps/web/lib/seo.ts` (new)

Pure helpers. No React, no I/O.

```ts
import { routing, type AppLocale } from "@/i18n/routing";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const PUBLIC_PATHS = ["/", "/analyze", "/builder"] as const;
export type PublicPath = (typeof PUBLIC_PATHS)[number];

export const OPEN_GRAPH_LOCALE: Readonly<Record<AppLocale, string>> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE"
};

export function localizedPath(locale: AppLocale, path: PublicPath): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function absoluteUrl(locale: AppLocale, path: PublicPath): string {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

export function pageAlternates(locale: AppLocale, path: PublicPath) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = absoluteUrl(l, path);
  languages["x-default"] = absoluteUrl(routing.defaultLocale, path);
  return { canonical: absoluteUrl(locale, path), languages };
}
```

Add an explicit return type to `pageAlternates` (`{ readonly canonical: string; readonly languages: Readonly<Record<string, string>> }`).
Expected: `localizedPath("en","/")` is `/`, `localizedPath("tr","/")` is `/tr`, `localizedPath("de","/analyze")` is `/de/analyze`.

## Step 2 - Tests first: `apps/web/tests/seo.test.ts` (new)

Write before steps 3-6 and watch them fail where they depend on code not written yet. Cover:

- `localizedPath`: the three cases above plus `tr` + `/builder` and `en` + `/builder`.
- `absoluteUrl` has no double slash and no trailing slash except for the bare `en` home (`SITE_URL + "/"`).
- `pageAlternates("tr", "/analyze")`: canonical is `.../tr/analyze`; languages has `en`, `tr`, `de`, `x-default`; `x-default` equals the `en` URL.
- After step 3: `robots()` output and `sitemap()` output (see below).

## Step 3 - `apps/web/app/robots.ts` (new)

```ts
import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const PRIVATE_PATHS = ["/r/", "/api/", "/auth/", "/login", "/applications"];

const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE_PATHS }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
```

The disallow list is repeated in the AI group on purpose: a crawler that matches a specific group ignores the `*` group.
Locale-prefixed private paths (`/tr/login`, `/de/applications`, `/tr/r/`, `/de/r/`) must be covered too: add them via
`routing.locales`-derived entries, e.g. build `PRIVATE_PATHS` from the base list plus `/${locale}${path}` for `tr` and `de`.
Test: the output contains `/r/` and `/tr/r/` in `disallow` for both groups, and `sitemap` ends in `/sitemap.xml`.

## Step 4 - `apps/web/app/sitemap.ts` (new)

```ts
import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { PUBLIC_PATHS, absoluteUrl, pageAlternates } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      alternates: { languages: pageAlternates(locale, path).languages }
    }))
  );
}
```

No `lastModified`, `changeFrequency` or `priority`: there is no real data for them. Test: 9 entries; every entry has 4 language keys;
no URL contains `/applications`, `/login`, `/r/`.

## Step 5 - `apps/web/app/llms.txt/route.ts` (new)

Plain-text route handler. `GET` returns `new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } })`.
Build the body from messages, not from invented prose:

```
# ATS readability

> <metadata.description from en.json>

<home.privacyTag or the "nothing is uploaded" sentence already in the messages>

## Pages
- [<label>](<SITE_URL>/analyze)
- [<label>](<SITE_URL>/builder)

## Languages
- English: <SITE_URL>/
- Turkce: <SITE_URL>/tr
- Deutsch: <SITE_URL>/de

## Limits
<common.disclaimer>
```

Use `getTranslations({ locale: "en", namespace: ... })` from `next-intl/server`. For the page labels use the existing navigation
labels in `messages/en.json`; add no description text that is not already in the messages. Make the handler static:
`export const dynamic = "force-static";`. Keep ASCII in the file; write "Turkce", not the accented form.

## Step 6 - `apps/web/middleware.ts` (edit the matcher only)

Add `robots\\.txt|sitemap\\.xml|llms\\.txt` to the negative lookahead, next to `favicon.ico|auth/|vendor/`:

```
"/((?!api/|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|auth/|vendor/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
```

Without this the middleware rewrites these requests to `/en/robots.txt` and they 404. Change nothing else in the file.

## Step 7 - Per-page canonical and hreflang

For `[locale]/page.tsx`, `[locale]/analyze/page.tsx`, `[locale]/builder/page.tsx` add (or extend, if one exists) a `generateMetadata`:

```ts
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: pageAlternates(locale as AppLocale, "/analyze") };
}
```

Use the page's own path. Narrow `locale` with `hasLocale(routing.locales, locale)` instead of a bare cast if the file already
validates it; do not add a new `notFound()` path. Return only `alternates`: do not set `title`, `description` or `openGraph` here.
A page-level `openGraph` replaces the layout's `openGraph` entirely, it does not merge.

## Step 8 - `[locale]/layout.tsx`

In `generateMetadata`, extend the existing `openGraph` object (do not remove existing keys):

```ts
openGraph: {
  type: "website",
  siteName: "ATS readability",
  locale: OPEN_GRAPH_LOCALE[locale as AppLocale],
  title: t("openGraphTitle"),
  description: t("openGraphDescription")
}
```

Do not add `alternates` here. Leave `robots`, `metadataBase`, the Clarity script and everything else untouched.
`siteName` must equal the product name used in `metadata.openGraphTitle` ("ATS readability"); if you prefer, reuse that message key.

## Step 9 - JSON-LD on the home page

In `[locale]/page.tsx`, render one `<script type="application/ld+json">` as the first child inside `<main>`. Build the object in
`lib/seo.ts` as `buildHomeJsonLd(locale, name, description)` returning an array of two nodes:

```ts
[
  { "@context": "https://schema.org", "@type": "WebSite", name, url: absoluteUrl(locale, "/"), description, inLanguage: locale },
  { "@context": "https://schema.org", "@type": "WebApplication", name, url: absoluteUrl(locale, "/"), description,
    applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: locale }
]
```

`name` is `metadata.openGraphTitle`, `description` is `metadata.description` (fetch with `getTranslations("metadata")`).
No `offers`, `potentialAction`, `sameAs`, `logo`, `author`, `publisher`, `datePublished`.

Serialize safely:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
/>
```

Test (in `seo.test.ts`): the result has two nodes, types `WebSite` and `WebApplication`, and `JSON.stringify` of it contains none of
`SearchAction`, `sameAs`, `logo`, `YOUR_`.

## Step 10 - Verify

From `apps/web`, all must pass with zero warnings:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Then check the built output (set `NEXT_PUBLIC_SITE_URL=https://atsfreeforall.com` for the build so URLs are real; confirm how the
Dockerfile or compose passes it and tell me if it is not passed at build time, because `NEXT_PUBLIC_*` values are inlined at build):

```bash
npm run start   # or: node .next/standalone/apps/web/server.js, whichever the project uses
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml
curl -s localhost:3000/llms.txt
curl -s localhost:3000/ | grep -E 'canonical|hreflang|application/ld\+json|og:locale'
curl -s localhost:3000/tr/analyze | grep -E 'canonical|hreflang'
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/en/robots.txt
```

Expected: robots, sitemap and llms.txt return 200 with the right content type; no `/en/robots.txt` rewrite problem; canonical on `/`
points at `<SITE_URL>/`, on `/tr/analyze` at `<SITE_URL>/tr/analyze`; a `/r/<token>` page still has `noindex`.
Also open `/`, `/analyze`, `/builder` in each locale once and confirm they render and the analyzer still runs a sample text.

Optional (needs the pip tool `geo`): `geo audit --url http://localhost:3000` and note the score. The real before/after audit against
the live site happens after deploy and is not your job.

## Step 11 - Commit

One commit on `seo-geo-fixes`, staged by explicit paths only:

```bash
git add apps/web/lib/seo.ts apps/web/tests/seo.test.ts apps/web/app/robots.ts apps/web/app/sitemap.ts \
        apps/web/app/llms.txt/route.ts apps/web/middleware.ts \
        "apps/web/app/[locale]/layout.tsx" "apps/web/app/[locale]/page.tsx" \
        "apps/web/app/[locale]/analyze/page.tsx" "apps/web/app/[locale]/builder/page.tsx"
git commit -m "feat(seo): add robots, sitemap, llms.txt, canonical/hreflang and JSON-LD"
```

Do not push. Do not touch `.omc/`.

## Report back

List: files created and edited, results of the four npm commands, the curl outputs (trimmed), whether `NEXT_PUBLIC_SITE_URL` reaches the
production build, and anything you had to deviate from this plan on, with the reason. If any step is ambiguous or a file does not match
what this plan assumes, stop and ask instead of guessing.

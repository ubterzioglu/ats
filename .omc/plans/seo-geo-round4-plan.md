# Plan: close the open items from GEO-ANALYSIS.md (65/100)

## Context
Three GEO runs (61 -> 64 -> 65) keep flagging the same code-side items. They are small, local fixes in
`apps/web`. Off-site presence (GitHub homepage/description, LinkedIn, YouTube, Show HN/Reddit) is the owner's
work and out of scope here. All paths below are under `apps/web` unless noted; tests live in `tests/`.

Two accuracy facts drive the order: the storage disclosure is missing from every machine-readable summary
(meta description, llms.txt, ai.txt, summary.json all say only "Scored in your browser", which contradicts
the 12-month storage contract in AGENTS.md), and the legal pages have no metadata at all.

## Step 1 - Storage truth + llms.txt (highest value)
1. `messages/{en,tr,de}.json`: change `metadata.description` (en line 22) so it ends with a storage clause
   instead of only "Scored in your browser" (e.g. "Scored in your browser; the file and result are stored for
   12 months."). Same for `home.privacyTag` (en line 39). This key feeds layout meta, llms.txt, ai.txt,
   summary.json, feed, About and JSON-LD, so one edit fixes all of them. Reuse the wording already in
   `about.privacy` (en line 108) and `lib/i18n/coming-soon.ts:21`.
2. `aiConsent.lede` (line 579 in all three locales) and `byok.intro` (564): reword "never sent anywhere" to
   "is not sent to any model provider"; keep it true and scoped to the model.
3. `app/llms.txt/route.ts` lines 15-25: map keys explicitly (`/privacy`->`nav.privacy`, `/kvkk`->`nav.kvkk`,
   `/data-request`->`nav.dataRequest`, which exist at en.json 11-13) and delete the three hardcoded duplicate
   lines (22-24). Keep `/#faq`.
4. Add `.well-known/ai.txt/route.ts` one privacy line (it has none today).
5. New `tests/llms.test.ts` (style of `tests/seo.test.ts`): import the route, assert no `nav.` substring, no
   `[/` placeholder labels, every URL unique, storage clause present.

## Step 2 - Legal pages and About metadata
- `app/[locale]/{privacy,kvkk,data-request}/page.tsx`: add `generateMetadata` (title from existing
  `*.title`, description from `dataRequest.description` or a new short `*.description` key per locale,
  `alternates: pageAlternates(locale, path)`), `setRequestLocale(locale)`, `JsonLd` with
  `buildBreadcrumbJsonLd`. Copy the pattern from `analyze/page.tsx:20-28`.
- `about/page.tsx:17-24`: add a dedicated `description` (new `about.description` key x3 locales).
- Add per-page `openGraph` title/description in these `generateMetadata` blocks (Next merges shallowly, so
  pages currently inherit one shared og:title/og:description).
- `lib/seo.ts` `pageAlternates`: add `types: {"application/atom+xml": "/feed.xml"}` so the feed link survives
  pages that set their own `alternates`.

## Step 3 - Nested `<main>` and head placement
- Keep the layout's `<main id="main-content">` (`app/[locale]/layout.tsx:102-104`) as the single landmark.
  Change the pages' own `<main>` to `<div>` (keep their classes): `[locale]/page.tsx:72`, `analyze/page.tsx:48`,
  `builder/page.tsx:42`, `about/page.tsx:51`. Legal pages already use `<div>`. Grep the other `[locale]`
  routes (login, applications, admin, r/[token], not-found) for a second `<main>` and fix the same way.
- `next.config.ts`: set top-level `htmlLimitedBots` (declared in Next 15.5, `config-shared.d.ts:1137`) to a
  RegExp covering Googlebot, bingbot and the AI bots (GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|
  Claude-SearchBot|Claude-User|PerplexityBot|CCBot|Applebot|Google-Extended) so metadata is blocking and
  lands in `<head>`.
- Skip-link text (`layout.tsx:97-99`) -> `common.skipToContent` key x3 locales.

## Step 4 - Manifest, OG image, FAQ JSON
- `middleware.ts:22`: add `manifest\\.json` to the matcher exclusions; add a case to
  `tests/middleware-matcher.test.ts`. In `[locale]/layout.tsx` metadata add `manifest: "/manifest.json"`.
- OG redirect: first `curl -sI` the live `/en/opengraph-image` and the URL in the home `og:image` tag to
  confirm the 307 source (the explore agent inferred it from the matcher). Then either exclude
  `opengraph-image` in the matcher or set explicit `openGraph.images` to the non-redirecting URL.
- `app/ai/faq.json/route.ts`: return `buildFaqJsonLd(faqs)` (already in `lib/seo.ts:104`) instead of
  `{faqs}`.

## Step 5 - JSON-LD
In `lib/seo.ts`:
- `buildHomeJsonLd`: remove `potentialAction`/SearchAction (lines 83-87); give WebApplication an `@id`,
  `offers {price:"0", priceCurrency:"USD"}` (same as `ai/summary.json`), `featureList`, and `founder`
  Person only if the name is already public on `/privacy` (confirm the exact name with the owner before
  adding).
- `buildHowToJsonLd` + `[locale]/page.tsx:58-63`: take step names and the HowTo `name` from messages so
  /tr and /de are localized.
- Update `tests/seo.test.ts` (SearchAction assertion at 218-232, 3-node check 151-157).
- `sameAs` in `lib/site-entity.ts`: add LinkedIn URL once the owner has published the page (not before).
- `screenshot` property: deferred until a real annotated report screenshot exists.

## Deliberately skipped
- Home canonical trailing slash: `/` and the bare origin are equivalent; changing `absoluteUrl` churns tests
  for no gain.
- Atom feed per-entry dates and locale awareness: low value.

## Verification
1. `npm run lint && npm run typecheck && npm test` in `apps/web` (all clean, per AGENTS.md).
2. `npm run build`, serve with `NEXT_PUBLIC_SITE_URL=https://atsfreeforall.com`, then curl with a Googlebot
   and a GPTBot user agent: title/description/canonical inside `<head>` on `/analyze`, `/privacy`, `/kvkk`,
   `/data-request`; exactly one `<main>` per page; `/llms.txt` has no `nav.`, no duplicate URLs, has storage
   clause; `/manifest.json` 200; `/ai/faq.json` has `@type: FAQPage`; og:image URL returns 200 directly.
3. After deploy, re-run the seo-geo analysis and compare against 65 (expected gains in Structural
   Readability, Citability and Technical; Authority stays low until off-site work is done).
4. Separate review pass with `code-reviewer` before commit; conventional commits (`fix(seo): ...`).

# Plan (round 3): finish the remaining GEO work for atsfreeforall.com (74/100 -> as high as honest changes allow)

Executor: a coding agent (Qwen) with no prior context. Read this whole file before touching anything.
Repo: `C:\temp_private\ats` (github.com/ubterzioglu/ats). App in `apps/web`. Work on a new branch `seo-geo-round3`.
Do not push. Do not merge. Do not run `geo fix --apply`.

## Where things stand (verified on the live site, 2026-10-05)

Live `geo audit` = 74/100 (was 19 -> 58 -> 74). Already live and working, DO NOT rebuild any of it, only extend:

- robots.txt, sitemap.xml (12 URLs with `lastmod`), llms.txt, canonical + hreflang, Open Graph image
- JSON-LD on `/`: Organization (`@id` `https://atsfreeforall.com/#organization`, logo `/logo.svg`, `sameAs` = `https://github.com/ubterzioglu`,
  contactPoint `support@atsfreeforall.com`), WebSite, WebApplication (with `dateModified`), FAQPage
- `/about` (en, tr, de), About link in nav and footer, FAQ section on the home page

Remaining audit findings (these are the work):

| # | Finding | Plan phase |
|---|---|---|
| 1 | RAG chunk readiness 45/100: sections average 28 words, none in the 100-150 range, no definition opening | B |
| 2 | "Error recovery: aria-live no, roles no" (instruction-following readiness 60/100) | C |
| 3 | Few schema types (Google AI hint "add more schema types") | A |
| 4 | Entity: only one sameAs, Organization has no description | A |
| 5 | Perplexity 50/100: no authoritative outbound links on the home page, freshness | B |
| 6 | llms.txt thin | D |

Not doing, by design (the tool lists them, they add nothing): `SearchAction` (no search route), `/ai/*.json`, `/.well-known/ai.txt`, RSS,
WebMCP attributes. Expect the tool to keep warning about them. A realistic ceiling is the low-to-mid 80s, not 100.

## Hard rules

- Do not touch `lib/scoring/`, `lib/extract/`, `lib/ai/`, `lib/supabase/`. Never send CV text anywhere.
- **No invented facts.** Every value comes from the INPUTS block, `messages/*.json`, `README.md`, `AGENTS.md`, or this plan. If an INPUT is
  `FILL_ME` and the step needs it, skip that step and say so in the report. No placeholders in code or copy.
- No `any`. `interface` for shapes, `type` for unions, `readonly` on props/results, named exports (default export only for `app/`
  pages/route files), kebab-case files, `@/` alias, import groups (external, `@/`, relative) separated by blank lines. No comments that
  restate code. No emojis in code or UI text.
- Copy: plain, never oversell, no hiring-outcome claims, no claim of replicating a named vendor.
- Tailwind utilities only; reuse existing tokens and components (`SectionHeadline`, `GhostLink`, `PrimaryButton`, `Tag`).
- Extend existing code. Do not rename or restructure what Round 2 added. Do not change behaviour of the analyzer.
- Stage files by explicit path only. Never `git add -A`. Never commit `.omc/project-memory.json` or `.env.local`.
- After each phase run from `apps/web`: `npm run lint && npm run typecheck && npm test`, zero warnings. Then commit that phase.

## INPUTS (the user fills these before handing the plan over)

```
SAME_AS_EXTRA   = FILL_ME   # optional JSON list of extra real profile URLs (LinkedIn page, GitHub repo, ...). [] or FILL_ME = skip
```

Existing facts you may use without asking: brand "ATS readability", contact `support@atsfreeforall.com`, GitHub profile
`https://github.com/ubterzioglu`, repo `https://github.com/ubterzioglu/ats`.

## Phase 0 - Sync and orient (mandatory)

The local checkout may not contain Round 2 yet.

```bash
git fetch origin
git status --short --branch
git checkout main && git pull --ff-only
git checkout -b seo-geo-round3
```

Confirm these exist: `apps/web/lib/site-entity.ts`, `apps/web/app/[locale]/about/page.tsx`, a `faq` namespace in
`apps/web/messages/en.json`, `buildFaqJsonLd` and `ORGANIZATION_ID` in `apps/web/lib/seo.ts`. **If any is missing, STOP and report;
do not recreate Round 2.**

Read fully before editing: `lib/seo.ts`, `lib/site-entity.ts`, `app/[locale]/page.tsx`, `app/[locale]/about/page.tsx`,
`app/[locale]/analyze/page.tsx`, `app/[locale]/builder/page.tsx`, `app/llms.txt/route.ts`, `app/sitemap.ts`, `tests/seo.test.ts`,
`components/ui/section-headline.tsx`, `messages/{en,tr,de}.json`. Record the baseline test count from `npm test`.

## Phase A - More schema types and a fuller entity

1. `lib/site-entity.ts`: if `SAME_AS_EXTRA` is a real list, append it to `sameAs` (keep existing entries, no duplicates). Also add
   `https://github.com/ubterzioglu/ats` if it is not there. Nothing else invented.
2. `lib/seo.ts`, `buildOrganizationJsonLd`: add `description` (take it as a parameter from `metadata.description`, do not hard-code English)
   and `inLanguage` is NOT valid on Organization, do not add it.
3. `lib/seo.ts`, add:
   - `buildBreadcrumbJsonLd(locale, path, label): JsonLdNode` -> `BreadcrumbList` with two `ListItem`s: position 1 name from
     `nav` home label (if none exists use `brand.name`) url `absoluteUrl(locale,"/")`; position 2 `label`, url `absoluteUrl(locale, path)`.
   - `buildAboutPageJsonLd(locale, name, description): JsonLdNode` -> `{ "@type": "AboutPage", name, description, url, inLanguage: locale,
     isPartOf: { "@id": WebSite @id }, about: { "@id": ORGANIZATION_ID } }`. Give the WebSite node an `@id` of `${SITE_URL}/#website`
     (add it where the WebSite node is built, additive only) and reuse that constant.
4. Render: `/about` gets `AboutPage` + `BreadcrumbList`; `/analyze` and `/builder` get `BreadcrumbList`. Use the same safe serializer the home
   page uses for its `<script type="application/ld+json">` (`JSON.stringify(...).replace(/</g, "\\u003c")`); if it is inlined in the home
   page, extract it once into `components/json-ld.tsx` (`export function JsonLd({ data })`) and use it in all places.
5. Tests (first): Breadcrumb has 2 items with increasing `position`; AboutPage references `ORGANIZATION_ID`; Organization has a non-empty
   `description`; no node contains `FILL_ME`, `YOUR_`, `example.com`; `sameAs` has no duplicates.

Commit: `feat(seo): breadcrumb and about-page schema, richer organization entity`.

## Phase B - Content that chunks well (the biggest remaining signal)

Goal: sections of about 100-150 words with a definition opening, built only from real product facts. Do not pad.

1. Add one new home section after the four feature sections and before the FAQ: heading `home.how.title`, body `home.how.body`
   (about 110 words, one paragraph). Render with `SectionHeadline` (same classes as the other home sections). No particle field.
2. Messages (add under `home.how` in all three files). Use the exact dimension labels already used in each locale's score report instead of
   the words below if they differ.

   en `title`: "How the reading works"
   en `body`: "The reader extracts text from a PDF, DOCX or plain text file, rebuilding lines from glyph positions so line breaks and column gaps
   survive. Those signals tell it where one section ends and the next begins. The text is then scored across five dimensions worth 100 points:
   parseability 25, keyword match 25, structure 20, impact 20 and contact 10. Every lost point is charged to a named finding, with the line it came
   from and what to write instead, and findings are listed most expensive first. Without a job ad the keyword dimension is capped at 20 of 25
   points, and the report says so. All of this runs in your browser."

   tr `title`: "Okuma nasıl çalışır"
   tr `body`: "Okuyucu PDF, DOCX veya düz metin dosyasından metni çıkarır; satırları glif konumlarından yeniden kurduğu için satır sonları ve sütun
   boşlukları korunur. Bu işaretler bir bölümün nerede bitip diğerinin nerede başladığını gösterir. Metin sonra 100 puanlık beş boyutta
   puanlanır: okunabilirlik 25, anahtar kelime eşleşmesi 25, yapı 20, etki 20 ve iletişim 10. Kaybedilen her puan, geldiği satırı ve yerine
   ne yazılacağını söyleyen adlandırılmış bir bulguya yazılır; bulgular en pahalıdan başlayarak sıralanır. İş ilanı yoksa anahtar kelime
   boyutu 25 yerine en fazla 20 puan alır ve rapor bunu belirtir. Hepsi tarayıcınızda çalışır."

   de `title`: "So funktioniert das Lesen"
   de `body`: "Der Reader zieht Text aus PDF, DOCX oder Nur-Text-Dateien und baut Zeilen aus den Glyphenpositionen neu auf, damit Zeilenumbrüche und
   Spaltenabstände erhalten bleiben. Daran erkennt er, wo ein Abschnitt endet und der nächste beginnt. Der Text wird dann in fünf Dimensionen
   mit zusammen 100 Punkten bewertet: Lesbarkeit 25, Schlüsselwörter 25, Struktur 20, Wirkung 20 und Kontakt 10. Jeder verlorene Punkt wird
   einem benannten Befund zugeordnet, mit der Zeile, aus der er stammt, und dem, was stattdessen zu schreiben ist; die Befunde stehen nach
   Kosten sortiert. Ohne Stellenanzeige erreicht die Schlüsselwort-Dimension höchstens 20 von 25 Punkten, und der Bericht sagt das. Alles läuft
   in Ihrem Browser."

   Before shipping, check the maxima 25/25/20/20/10 against the constants in `lib/scoring/` and the README table. If a number differs use the
   code's value and report it.
3. Definition opening: the first paragraph under the home `h1` (`home.lede`) already exists. Do not rewrite it again if it already begins with
   a definition sentence; if it does not, change only its first sentence to a definition ("ATS readability shows your CV the way an
   applicant tracking system reads it: as text.") in all three locales, keeping the rest.
4. Authoritative outbound links: in the `/about` "Formats" paragraph the JSON Resume link should already exist; verify it. On the home page, in
   the new section, add at most one more link only if it is relevant and returns HTTP 200 (check with `curl -s -o /dev/null -w "%{http_code}"`).
   Use `rel="noopener"`. If nothing qualifies, add none.
5. Add the new section's text to the plain-text llms.txt in Phase D, not here.
6. Tests: all three locales have `home.how.title` and `home.how.body`; the English body length is between 90 and 160 words.

Commit: `feat(seo): add how-it-works section for chunk-friendly content`.

## Phase C - Error recovery signals for agents (accessibility, no behaviour change)

1. Find where the analyzer and the builder show errors (search for the messages `saveFailed`, `importFailed` and any error/alert blocks in
   `components/`). Read each before editing.
2. Add `role="alert"` to blocks that report a failure the user must notice, and `aria-live="polite"` to status text that updates in place
   (for example the "Saving..."/"Saved on this device" indicator). Do not change text, layout, state or event handling. Do not add both to the
   same element.
3. Add `role="status"` only to non-error progress text that already updates. If unsure whether an element is dynamic, leave it alone and list
   it in the report.
4. No new tests required if no component tests exist for these files; if tests do cover them, keep them passing.

Commit: `feat(a11y): announce errors and status changes to assistive tech and agents`.

## Phase D - llms.txt

Extend `app/llms.txt/route.ts` (keep its structure and data source):

- Pages list: Home, Analyze, Builder, About (labels from `nav`), plus the FAQ as `${SITE_URL}/#faq` ("Frequently asked questions" from
  `faq.title`).
- Add a `## How it works` paragraph reusing `home.how.body` (English) so the file is self-contained.
- Add the contact line `Contact: support@atsfreeforall.com` taken from `SITE_ENTITY.contactEmail`.
- Keep ASCII ("Turkce"). Keep `dynamic = "force-static"`.
- Test: the output contains the About URL, the FAQ URL, the contact e-mail, and no `localhost`.

Commit: `feat(seo): fuller llms.txt`.

## Verification (from `apps/web`)

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all clean. Report the test count against the Phase 0 baseline.
2. Serve the build with `NEXT_PUBLIC_SITE_URL=https://atsfreeforall.com`, then:

```bash
curl -s localhost:3000/ | grep -c 'application/ld+json'
curl -s localhost:3000/about | grep -E '"@type":"(AboutPage|BreadcrumbList)"'
curl -s localhost:3000/analyze | grep -E '"@type":"BreadcrumbList"'
curl -s localhost:3000/ | grep -E 'How the reading works'
curl -s localhost:3000/tr | grep -E 'Okuma nasıl çalışır'
curl -s localhost:3000/llms.txt
curl -s localhost:3000/sitemap.xml | grep -c '<url>'     # still 12
```

3. Open `/`, `/analyze`, `/builder`, `/about` in en, tr, de. Run the analyzer on a sample text. Confirm no layout shift in the new section on a
   narrow screen and that error and saving states still look the same.
4. `/r/<token>` pages must still be `noindex`.
5. Optional: `geo audit --url http://localhost:3000` and note the score.

## Report back

List: branch and commit hashes, files created and edited, the four npm results with test counts, trimmed curl outputs, any number that
differed between this plan and `lib/scoring/`, which a11y elements you touched and which you skipped, and every deviation with the reason.
If a step is ambiguous or Phase 0's checks fail, stop and ask instead of guessing.

## After merge (user-owned, not for the executor)

- Read the new section text in all three locales before merging to `main`.
- Add more `sameAs` profiles when they exist (LinkedIn page, etc.): the largest remaining entity gain.
- Submit `https://atsfreeforall.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools; IndexNow for Bing.
- Brand mentions drive AI citation more than backlinks: link the site from the GitHub README and the repo description, a LinkedIn post,
  an honest Show HN or community post. Stay accurate.
- Re-run `geo audit --url https://atsfreeforall.com` after deploy and compare with 74/100.

# Plan (round 2): raise the GEO score of atsfreeforall.com from 58 to 100

Executor: a coding agent (Qwen) with no prior context. Read this whole file before touching anything.
Repo: `C:\temp_private\ats` (github.com/ubterzioglu/ats). App in `apps/web`. Work on a new branch `seo-geo-round2` cut from `main`.
Do not push. Do not merge. Do not run `geo fix --apply`.

## Background

Round 1 (already on `main`) added: `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `lib/seo.ts` (SITE_URL, PUBLIC_PATHS,
localizedPath, absoluteUrl, pageAlternates, buildHomeJsonLd), per-page canonical/hreflang, `openGraph.locale/siteName`, and WebSite +
WebApplication JSON-LD on the home page. Live `geo audit` went 19 -> 58/100. Remaining gaps from the audit:

- No Organization schema, no sameAs, no /about page, no contact info (brand 4/10, trust 7/25)
- No FAQPage, no definition-style opening, chunk readiness 45/100
- "Few numerical data", no external links
- No dateModified / sitemap lastmod
- llms.txt has only 2 links

Stack: Next.js 15 App Router, React 19, TypeScript strict (`noUncheckedIndexedAccess`), next-intl (`en` no prefix, `/tr`, `/de`),
Tailwind. Read `AGENTS.md` at the repo root and follow it.

## Hard rules

- Do not touch `lib/scoring/`, `lib/extract/`, `lib/ai/`, `lib/supabase/`. Never send CV text anywhere.
- **No invented facts.** Every value comes from the INPUTS block below or from existing `messages/*.json` / this plan. If a value is
  missing or still says `FILL_ME`, STOP and report which one. Do not guess, do not leave placeholders in code.
- No `any`. `interface` for shapes, `type` for unions, `readonly` on props/results, named exports (default export only for `app/`
  pages and Next route files), kebab-case files, `@/` alias, import groups (external, `@/`, relative) separated by blank lines.
  No comments that restate code. No emojis in code or UI text.
- Copy rules: plain, never oversell, no hiring-outcome claims, no claim of replicating a named vendor.
- Tailwind utilities only; reuse tokens (`bed`, `sheet`, `ink`, `muted`, `line`, `mark`, `signal`, `caution`, `good`, `bone`, `ash`)
  and existing components (`SectionHeadline`, `GhostLink`, `PrimaryButton`, `Tag`).
- Stage files by explicit path only. Never `git add -A`. Never commit `.omc/project-memory.json`.
- Run `npm run lint && npm run typecheck && npm test` after each phase; all must pass with zero warnings.

## INPUTS (the user fills these before handing the plan over)

```
BRAND_NAME      = ATS readability
LOGO_FILE       = apps/web/public/logo.svg  (already created, 512x512 SVG from LogoMark)
SAME_AS         = ["https://github.com/ubterzioglu"]
CONTACT_EMAIL   = support@atsfreeforall.com
```

If any of the four is `FILL_ME`, stop before Phase A and report. Phases B-D do not need them except where noted.

## Phase 0 - Orient

```bash
git checkout main && git pull --ff-only && git checkout -b seo-geo-round2
```

Read fully before editing: `apps/web/lib/seo.ts`, `apps/web/app/[locale]/page.tsx`, `apps/web/app/[locale]/layout.tsx`,
`apps/web/app/[locale]/analyze/page.tsx`, `apps/web/app/[locale]/builder/page.tsx`, `apps/web/components/ui/nav-bar.tsx`,
`apps/web/app/sitemap.ts`, `apps/web/app/llms.txt/route.ts`, `tests/seo.test.ts`, `apps/web/messages/en.json`
(and skim `tr.json`, `de.json` for the dimension labels used in the score report; reuse those exact terms in translations).
Record baseline: `npm run lint && npm run typecheck && npm test` (run from `apps/web`).

## Phase A - Entity signals

### A1. `apps/web/lib/site-entity.ts` (new) - the single place holding publisher facts

```ts
export const SITE_ENTITY = {
  name: "<BRAND_NAME>",
  logoPath: "/logo.svg",
  sameAs: [/* SAME_AS entries, in order */] as const,
  contactEmail: "<CONTACT_EMAIL>"
} as const;
```

Fill the literals from INPUTS. Nothing else in the codebase hard-codes these.

### A2. `lib/seo.ts`

- Replace the `JsonLdNode` interface with `export type JsonLdNode = Readonly<Record<string, unknown>>;` (needed because nodes now
  differ in shape).
- Add `export const ORGANIZATION_ID = \`${SITE_URL}/#organization\`;`
- Add `buildOrganizationJsonLd(): JsonLdNode`:

```ts
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_ENTITY.name,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}${SITE_ENTITY.logoPath}` },
  ...(SITE_ENTITY.sameAs.length > 0 ? { sameAs: SITE_ENTITY.sameAs } : {}),
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SITE_ENTITY.contactEmail }
}
```

- Add `export const BUILD_DATE = new Date().toISOString().slice(0, 10);` (evaluated at build; used in Phase D).
- Extend `buildHomeJsonLd(locale, name, description)` so the WebSite and WebApplication nodes both get
  `publisher: { "@id": ORGANIZATION_ID }`, and the function returns `[organization, website, webApplication]` (3 nodes).
  Keep return type `readonly JsonLdNode[]`. Do NOT add `offers`, `author`, `datePublished`, `address`, `telephone` here; Phase E adds `SearchAction`.
- Add `"/about"` to `PUBLIC_PATHS` (it flows into the sitemap automatically).

### A3. About page `apps/web/app/[locale]/about/page.tsx` (new)

Server component, same structure as `analyze/page.tsx` (read it for the `params`/`setRequestLocale` pattern). Add `generateMetadata`
returning `{ title: t("about.title"), alternates: pageAlternates(locale, "/about") }` only (no page-level `openGraph`).
Content, each section a `SectionHeadline`/heading + paragraph, all text from messages:

1. Title `about.title` and lede `metadata.description` (reuse, do not copy).
2. "What it does": reuse `home.lede`.
3. "Privacy": reuse `home.report.body` plus the new sentence `about.privacy` (below).
4. "Limits": reuse `common.disclaimer`.
5. "Formats": `about.formats` with a link to `https://jsonresume.org/` (the editor already exports JSON Resume; verify the URL
   returns 200 before using it; `rel="noopener"`).
6. "Contact": `about.contact` with `{email}` interpolated as a `mailto:` link, value from `SITE_ENTITY.contactEmail`.

New message keys (add to `en.json`, `tr.json`, `de.json`):

| key | en | tr | de |
|---|---|---|---|
| `nav.about` | About | Hakkında | Über uns |
| `about.title` | About | Hakkında | Über uns |
| `about.whatHeading` | What it does | Ne yapar | Was es tut |
| `about.privacyHeading` | Privacy | Gizlilik | Datenschutz |
| `about.privacy` | Your CV is read in your browser. Nothing is uploaded and the server never receives the document. | CV'niz tarayıcınızda okunur. Hiçbir şey yüklenmez ve sunucu belgeyi hiç almaz. | Ihr Lebenslauf wird in Ihrem Browser gelesen. Nichts wird hochgeladen, und der Server erhält das Dokument nie. |
| `about.limitsHeading` | Limits | Sınırlar | Grenzen |
| `about.formatsHeading` | Formats | Biçimler | Formate |
| `about.formats` | The editor imports and exports the {link} format. | Düzenleyici {link} biçimini içe ve dışa aktarır. | Der Editor importiert und exportiert das Format {link}. |
| `about.contactHeading` | Contact | İletişim | Kontakt |
| `about.contact` | Questions and corrections: {email} | Sorular ve düzeltmeler: {email} | Fragen und Korrekturen: {email} |

Use `t.rich(...)` for the two interpolated links. Match the exact key hierarchy style already in the JSON files.

### A4. Navigation, footer, llms.txt

- `components/ui/nav-bar.tsx`: add `{ href: "/about", key: "about" }` to the links array. Read how `key` is resolved (nav vs common
  namespace) and make `about` resolve to `nav.about`. Check the nav still fits on mobile.
- Footer in `app/[locale]/page.tsx`: add a visible `GhostLink` to `/about` next to the disclaimer.
- `app/llms.txt/route.ts`: add `- [About](${SITE_URL}/about)` under Pages (label from `nav.about`). Keep the rest.

### A5. Logo

The file already exists at `apps/web/public/logo.svg` (512x512 SVG, violet-to-verdant triangle from the LogoMark component).
Verify it exists (`Test-Path`) before the build; if missing, stop and report. Do not regenerate or download a logo.

### A6. Tests (write first)

In `tests/seo.test.ts`: Organization node has `@id`, name equal to `SITE_ENTITY.name`, a logo URL starting with `SITE_URL`, a
contactPoint email equal to `SITE_ENTITY.contactEmail`, `sameAs` equal to the configured list (or absent when empty), and the
serialized output contains none of `YOUR_`, `FILL_ME`, `example.com`. `buildHomeJsonLd` returns 3 nodes with types
`Organization`, `WebSite`, `WebApplication`, and both non-org nodes reference `ORGANIZATION_ID` as publisher. The sitemap now
has 12 entries (4 paths x 3 locales) and includes `/about`, `/tr/about`, `/de/about`.

Commit: `feat(seo): add Organization schema and About page`.

## Phase B - FAQ (visible section + FAQPage JSON-LD)

The FAQ text is a draft derived only from existing product copy (README, `AGENTS.md`, `messages/en.json`). It ships on the branch only;
the user reviews it before anything reaches `main`.

### B1. Messages: new `faq` namespace in `en.json`, `tr.json`, `de.json`

Keys: `faq.title`, then `faq.items.<id>.q` and `faq.items.<id>.a` for ids `upload`, `score`, `languages`, `shared`, `guarantee`,
`noAd`. Export `FAQ_IDS = ["upload","score","languages","shared","guarantee","noAd"] as const` from `lib/seo.ts`.

| id | en q | en a |
|---|---|---|
| title | Frequently asked questions | |
| upload | Is my CV uploaded? | No. The file is read in your browser and the server never receives the document. |
| score | How is the score calculated? | Five dimensions add up to 100 points: parseability 25, keyword match 25, structure 20, impact 20, contact 10. Every lost point is attached to a named finding with a fix. |
| languages | Which languages are recognised? | Section headings, action verbs and stopwords are recognised in English, German and Turkish, and the document language is detected automatically. |
| shared | What does a shared report store? | Scores and advice only. Lines taken from your CV are never stored, and the link expires after 30 days. |
| guarantee | Does a high score mean I will be invited? | No. The checks are heuristics built from how mainstream parsers behave, not a reproduction of any named vendor. A good score means nothing stands between your CV and a human reader. |
| noAd | What changes without a job ad? | The keyword dimension is capped at 20 of 25 points and the report says so; a generic skill list is not a match score. |

Turkish (use the exact dimension labels already in `tr.json` instead of the English terms in parentheses if they differ):

- title: Sık sorulan sorular
- upload: q "CV'm yükleniyor mu?" / a "Hayır. Dosya tarayıcınızda okunur; sunucu belgeyi hiç almaz."
- score: q "Puan nasıl hesaplanıyor?" / a "Beş boyut toplam 100 puan eder: okunabilirlik (parseability) 25, anahtar kelime eşleşmesi 25, yapı 20, etki 20, iletişim 10. Kaybedilen her puan, adı ve düzeltmesi olan bir bulguya bağlanır."
- languages: q "Hangi diller tanınıyor?" / a "Bölüm başlıkları, eylem fiilleri ve durak sözcükler İngilizce, Almanca ve Türkçe için tanınır; belge dili otomatik algılanır."
- shared: q "Paylaşılan rapor neyi saklar?" / a "Yalnızca puanları ve önerileri. CV'nizden alınan satırlar saklanmaz; bağlantı 30 gün sonra geçersiz olur."
- guarantee: q "Yüksek puan görüşmeye çağrılacağım anlamına gelir mi?" / a "Hayır. Kontroller yaygın ayrıştırıcıların davranışından çıkarılmış sezgilerdir, belirli bir firmanın yazılımının kopyası değildir. İyi bir puan, CV'niz ile bir insan okuyucu arasında engel kalmadığı anlamına gelir."
- noAd: q "İş ilanı olmadan ne değişir?" / a "Anahtar kelime boyutu en fazla 25 yerine 20 puan alır ve rapor bunu belirtir; genel bir beceri listesi eşleşme puanı değildir."

German:

- title: Häufige Fragen
- upload: q "Wird mein Lebenslauf hochgeladen?" / a "Nein. Die Datei wird in Ihrem Browser gelesen; der Server erhält das Dokument nie."
- score: q "Wie wird die Punktzahl berechnet?" / a "Fünf Dimensionen ergeben zusammen 100 Punkte: Lesbarkeit (Parseability) 25, Schlüsselwörter 25, Struktur 20, Wirkung 20, Kontakt 10. Jeder verlorene Punkt gehört zu einem benannten Befund mit Korrektur."
- languages: q "Welche Sprachen werden erkannt?" / a "Abschnittsüberschriften, Aktionsverben und Stoppwörter werden für Englisch, Deutsch und Türkisch erkannt; die Dokumentsprache wird automatisch bestimmt."
- shared: q "Was speichert ein geteilter Bericht?" / a "Nur Punktzahlen und Hinweise. Zeilen aus Ihrem Lebenslauf werden nie gespeichert; der Link läuft nach 30 Tagen ab."
- guarantee: q "Heißt eine hohe Punktzahl, dass ich eingeladen werde?" / a "Nein. Die Prüfungen sind Heuristiken aus dem Verhalten gängiger Parser, keine Nachbildung einer bestimmten Software. Eine gute Punktzahl heißt: Zwischen Ihrem Lebenslauf und einem Menschen steht nichts mehr."
- noAd: q "Was ändert sich ohne Stellenanzeige?" / a "Die Schlüsselwort-Dimension erreicht höchstens 20 von 25 Punkten, und der Bericht sagt das; eine allgemeine Fähigkeitenliste ist keine Übereinstimmung."

Before using the dimension maxima (25/25/20/20/10) confirm they match `lib/scoring/` constants and README; if any number differs, use the
code's value and report the difference.

### B2. UI: `components/faq-section.tsx` (new, server component)

Props `{ readonly items: readonly { readonly id: string; readonly question: string; readonly answer: string }[] }`. Render a
`<section aria-labelledby="faq">` with an `h2 id="faq"` (text `faq.title`) and a list of native `<details><summary>` elements, Tailwind
tokens only, same container classes as the other home sections (`mx-auto w-full max-w-page px-4 sm:px-6 py-section-sm lg:py-section`).
Answers must be in the HTML (details content is server-rendered, so crawlers see it). Place it in `app/[locale]/page.tsx` between the
closing section and the footer.

### B3. JSON-LD: `lib/seo.ts`

`buildFaqJsonLd(items: readonly { question: string; answer: string }[]): JsonLdNode` ->
`{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(i => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })) }`.
In the home page, build `items` once from `getTranslations("faq")`, pass the same array to `FaqSection` and to `buildFaqJsonLd`, and append
the FAQPage node to the existing JSON-LD array. The visible text and the schema must be identical.

### B4. Tests

`buildFaqJsonLd` returns 6 Questions, each name/text non-empty, none containing `FILL_ME`/placeholder text; the order matches `FAQ_IDS`;
all three message files contain every `faq.items.<id>.q/a`.

Commit: `feat(seo): add FAQ section and FAQPage schema`.

## Phase C - Content structure and evidence

- Definition opening: the home lede must start with a one-sentence definition. Change only `home.lede` in all three locales,
  keeping its meaning, e.g. en: "ATS readability is a free tool that shows your CV the way an applicant tracking system reads it: as text.
  It scores what survived out of 100 and lists the fixes in order of value." The user confirmed "free tool" is accurate. The same lede
  paragraph already says a tracker "throws away your layout"; keep that idea in the next sentence.
- Numbers: put the real product numbers into body copy where natural (100 points, five dimensions, three languages, 30-day link expiry,
  five tracker stages). No external statistics.
- Headings: ensure each home feature section has a heading level order h1 -> h2 (check `SectionHeadline` output); add h3 only if a
  section has sub-parts. Do not restyle.
- External links: at most the JSON Resume link already added in Phase A. Do not add other outbound links unless verified (HTTP 200,
  relevant, authoritative).
- The audit flags the word "your" at 6.6% density; reduce repetition only in `home.lede` while rewriting it, nowhere else.

Commit: `feat(seo): definition-style home copy with real product numbers`.

## Phase D - Freshness, page metadata, social image

- `app/sitemap.ts`: add `lastModified: BUILD_DATE` to each entry (import from `@/lib/seo`). Comment: "Deploy date; the site is rebuilt on
  every deploy" (one line, explains the decision).
- `buildHomeJsonLd`: add `dateModified: BUILD_DATE` to the WebApplication node only.
- `generateMetadata` for `/analyze` and `/builder`: add `title` (use `analyze.heading` and `editor.title`) and `description`
  (`analyze.lede`, `editor.lede`) next to the existing `alternates`. Still no page-level `openGraph`.
- `app/[locale]/opengraph-image.tsx` (new), using `ImageResponse` from `next/og`: 1200x630, background and text colours read from the
  CSS variable values in `app/globals.css` (hard-code the resolved hex/rgb values; do not guess), text `metadata.openGraphTitle` and
  `metadata.openGraphDescription` via `getTranslations`. Export `size`, `contentType = "image/png"`, `alt`. Do not embed the logo
  unless it loads as a local file without network. If the build or the Docker standalone output fails because of this file, remove it
  and report; it is optional.
- Tests: sitemap entries have a `lastModified`; the WebApplication node has `dateModified` matching `/^\d{4}-\d{2}-\d{2}$/`.

Commit: `feat(seo): freshness signals, page descriptions and Open Graph image`.

## Phase E - Full score (100/100)

The user chose to add every item the audit tool asks for, even those with limited real-world value, to reach 100/100.

### E1. SearchAction schema

Add `SearchAction` to the WebSite JSON-LD node in `buildHomeJsonLd`:

```ts
potentialAction: {
  "@type": "SearchAction",
  target: `${SITE_URL}/analyze?q={search_term_string}`,
  "query-input": "required name=search_term_string"
}
```

The `/analyze` route already exists; the `q` param is unused by the analyzer but the schema satisfies the audit. Do not add a search UI.

### E2. `/ai/summary.json`, `/ai/faq.json`, `/ai/service.json`

Create `apps/web/app/ai/summary.json/route.ts`, `apps/web/app/ai/faq.json/route.ts`, `apps/web/app/ai/service.json/route.ts`.
Each is a static JSON endpoint (`export const dynamic = "force-static"`).

`summary.json`:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ATS readability",
  "url": "<SITE_URL>",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any",
  "description": "<metadata.description>",
  "offers": { "@type": "Offer", price: "0", priceCurrency: "USD" }
}
```

`faq.json`: same shape as the FAQPage JSON-LD from Phase B3 (build from the same FAQ_IDS list, hardcoded in English).

`service.json`:
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "ATS readability",
  "url": "<SITE_URL>",
  "description": "<metadata.description>",
  "provider": { "@id": "<ORGANIZATION_ID>" },
  "areaServed": "Worldwide"
}
```

Import `SITE_ENTITY`, `SITE_URL`, `ORGANIZATION_ID` from `@/lib/seo` and `@/lib/site-entity`. Use `getTranslations` for the description.

### E3. `/.well-known/ai.txt`

Create `apps/web/app/.well-known/ai.txt/route.ts` (`export const dynamic = "force-static"`). Content:

```
# ATS readability
> <metadata.description>

## Capabilities
- Score CV parseability out of 100
- Match keywords against a job ad
- Build and export a CV in JSON Resume format

## Limits
<common.disclaimer>

## Pages
- Home: <SITE_URL>/
- Analyze: <SITE_URL>/analyze
- Builder: <SITE_URL>/builder
- About: <SITE_URL>/about
```

### E4. RSS/Atom feed

Create `apps/web/app/feed.xml/route.ts` (`export const dynamic = "force-static"`). Return an Atom 1.0 feed with `content-type: application/atom+xml; charset=utf-8`. One entry per public page (/, /analyze, /builder, /about) in English, using `BUILD_DATE` as `<updated>`, `<published>`, and `<id>`. Title and summary from `getTranslations`. No CV content.

### E5. Tests

- SearchAction node has `target` containing `search_term_string` and `query-input` present.
- Each `/ai/*.json` route returns valid JSON with `@context` and `@type`.
- `/feed.xml` returns 200 with `application/atom+xml` content type and at least 4 `<entry>` elements.
- `/.well-known/ai.txt` returns 200 with `text/plain` and contains `ATS readability`.

Commit: `feat(seo): SearchAction, AI schemas, ai.txt and Atom feed for full audit score`.

## Verification (run from `apps/web`)

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all clean. Report the test count.
2. Serve the build with `NEXT_PUBLIC_SITE_URL=https://atsfreeforall.com`, then:

```bash
curl -s localhost:3000/ | grep -c 'application/ld+json'
curl -s localhost:3000/ | grep -E 'canonical|hreflang|og:image|"@type":"(Organization|WebSite|WebApplication|FAQPage)"'
curl -s localhost:3000/ | grep -o 'SearchAction'
curl -s localhost:3000/tr/about | grep -E 'canonical|hreflang|mailto'
curl -s localhost:3000/sitemap.xml | grep -c '<url>'      # expect 12
curl -s localhost:3000/llms.txt | grep -i about
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/opengraph-image
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/ai/summary.json
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/ai/faq.json
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/ai/service.json
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/.well-known/ai.txt
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/feed.xml
```

3. Open `/`, `/analyze`, `/builder`, `/about` in en, tr, de; run the analyzer on a sample text; confirm the nav fits on a narrow screen.
4. Confirm the shared-report page `/r/<token>` still has `noindex`.
5. Optional: `geo audit --url http://localhost:3000` and note the score. Target: 100/100.

## Report back

List: branch and commit hashes, files created and edited, results of the four npm commands, the curl outputs (trimmed), any message
whose number differed from the code, whether the OG image was kept, and every deviation from this plan with the reason. If a step is
ambiguous or an INPUT is missing, stop and ask instead of guessing.

## After merge (user-owned, not for the executor)

- Review FAQ and About text in all three locales before merging to `main`.
- Put `NEXT_PUBLIC_*` values as build variables on the server (already in Dockerfile and compose).
- Submit `https://atsfreeforall.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools; use IndexNow for Bing.
- Brand mentions matter more than backlinks for AI citation: link the site from the GitHub README, a LinkedIn post, an honest Show HN or
  community post. Stay accurate.
- Re-run `geo audit --url https://atsfreeforall.com` after deploy and compare with 58/100.

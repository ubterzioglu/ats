# GEO / AI-Search Analysis: atsfreeforall.com

- Date: 2026-10-06, third run (live fetches 09:39-09:41 UTC)
- Scope: `/`, `/tr`, `/de`, `/analyze` (en/tr/de), `/builder`, `/about`, `/privacy`, `/kvkk`, `/data-request` (all three
  locales), `robots.txt`, `sitemap.xml`, `llms.txt`, `/.well-known/ai.txt`, `/ai/summary.json`, `/ai/faq.json`, `/feed.xml`,
  `/manifest.json`, OG image, JSON-LD on every page above, plus 9 crawler user agents
- Method: raw HTTP fetch (the site is SSR). I separated visible text from the serialized RSC/next-intl payload so that copy
  that ships in the payload but never renders is not counted as visible.
- Repo and deploy state: `main` is level with `origin/main` at `7e3d122`, pushed 09:38 UTC. The fetch at 09:39 still served the
  `5370eb7` build (scroll-reveal classes present, footer credit missing). By 09:41 the `9c93122` footer credit
  ("designed by UBT" linking to ubterzioglu.de) was live, so **HEAD is deployed**. `7e3d122` (admin users) has no public
  surface. The SEO commit since the last run is `f29176b` ("Twitter cards, HowTo schema, security headers, skip nav,
  manifest, 10 FAQs"); everything in it is live except the manifest (see N6). Nothing on the open list below is fixed
  in source and waiting for a deploy.

---

## Delta vs. previous run (64/100)

**New score: 65/100 (+1).** The run before that scored 61.

| Dimension | Previous | Now | Delta |
|---|---|---|---|
| Citability (25%) | 74 | 77 | +3 |
| Structural Readability (20%) | 79 | 78 | -1 |
| Multi-Modal Content (15%) | 35 | 36 | +1 |
| Authority & Brand Signals (20%) | 37 | 39 | +2 |
| Technical Accessibility (20%) | 84 | 84 | 0 |

### Fixed or improved (verified live)
- **Home FAQ grew from 6 to 10**, visible and in FAQPage JSON-LD in all three locales (tr and de are translated). The new
  answers are direct and quotable: formats ("PDF, DOCX and plain text files up to 10 MB..."), retention ("Twelve months from
  the upload date... deleted from the database, storage and Google Drive backup"), deletion (data request form, 30 days)
  and accuracy. `/ai/faq.json` also has 10 entries.
- **N1, partly.** Home now states storage and retention in visible text twice ("Is my CV stored? Yes..." and "How long is my
  data kept?"), and in FAQPage JSON-LD. The machine summaries still do not (see below).
- **R4, `<main>` part.** `/privacy`, `/kvkk` and `/data-request` now sit inside a `<main id="main-content">` from the layout.
- Skip link ("Skip to main content"), Twitter `summary_large_image` cards, and security headers (`X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are live on every page.
- `robots.txt` now also disallows `/admin` (and `/tr/admin`, `/de/admin`) in both groups.
- A footer credit links to `https://ubterzioglu.de`. That is a small creator signal, but it is a link and not
  `founder`/`author` markup.

### Still open (all re-checked live)
| ID | Item | Live state |
|---|---|---|
| R3 | llms.txt labels and duplicates | Still lists `[nav./privacy]`, `[nav./kvkk]` and `[nav./data-request]`, then lists the same three URLs again as "Privacy Notice", "KVKK Notice" and "Data Request". |
| N1 | Storage disclosure in machine summaries | The meta description (all locales), `llms.txt` (blockquote, tagline, last line of "How it works"), `/.well-known/ai.txt` and `/ai/summary.json` `description` still say only "Scored in your browser." None of them mentions storage. |
| R4 | Legal page metadata | `/privacy`, `/kvkk` and `/data-request` in en/tr/de have no canonical and no hreflang. They reuse the home `<title>` and description (9 duplicates) and have no JSON-LD. Only `<main>` was fixed. |
| N2 | Metadata after `</head>` | Unchanged. On `/analyze`, `/kvkk` and `/data-request`, `</head>` is at about byte 1,760-1,920 and `<title>` at about 8,200-8,800 for Googlebot, GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot and CCBot. Only bingbot and Applebot get metadata in `<head>`. Home, `/about` and `/builder` are fine. |
| R5 | og:image redirect | `/en/opengraph-image?3fab10b9d315600f` still returns 307 to `/opengraph-image?3fab10b9d315600f=`. |
| R6 | OG text | `og:title` is still "ATS readability" and `og:description` is still the same on every page. Twitter cards copy the same text. |
| N4 | `/about` description | Still reuses the home description. |
| - | `/ai/faq.json` shape | Still `{"faqs":[...]}`, not a schema.org FAQPage. |
| R7 | SearchAction | Still present: `/analyze?q={search_term_string}`, and `/analyze` does not search. |
| - | sameAs / founder / offers / screenshot | `sameAs` still lists only the two GitHub URLs. No `founder`. WebApplication has no `offers` and no `screenshot`. Only `summary.json` has `offers`. |
| N3 | Feed link | The Atom `<link rel="alternate">` still appears only on the legal pages. It is not on home, analyze, builder or about. Every feed entry is dated 2026-10-06T00:00:00Z (the build date). |
| R1 | "never sent anywhere" | Still ships in the payload of every page (`messages/en.json:579`, the `aiHint.lede`; it moved from line 563 because new keys were added above it). It is not in the SSR-visible text. |
| R8 | Home canonical | Still `https://atsfreeforall.com` without the trailing slash. The sitemap, llms.txt, hreflang and WebSite `url` use `/`. |
| - | GitHub repo | `homepage: null`, 0 stars, and the description still says "Runs in the browser." |
| - | Off-site entity | Wikipedia 0 hits. Reddit returned 403 again. Nothing on YouTube or LinkedIn. |

### New findings
| # | Severity | Finding | Evidence |
|---|---|---|---|
| N5 | Medium (regression) | **Nested `<main>` on every page that already had one.** `f29176b` wrapped the layout `children` in `<main id="main-content">`. Home, `/analyze`, `/builder` and `/about` render their own `<main>` too, so the HTML is `<main id="main-content"><main>...`. Two `main` landmarks break the HTML rule that only one visible `<main>` is allowed, and they blur the main-content boundary that boilerplate extractors and screen readers use. | home byte 6773: `<main id="main-content"><main><script type="application/ld+json">` |
| N6 | Low | **`/manifest.json` returns 404**, and no page links it. The middleware matcher excludes `svg|png|jpg|jpeg|gif|webp` and named files, but not `.json`, so next-intl rewrites `/manifest.json` to `/en/manifest.json`. The 404 response carries locale hreflang `Link` headers for it. | `curl -I /manifest.json` returns 404 with `Link: <.../tr/manifest.json>; hreflang="tr"` |
| N7 | Low | **The HowTo JSON-LD is hard-coded English** on `/tr` and `/de` ("How to analyze your CV with ATS readability", "Upload your CV as a PDF..."), on pages whose other JSON-LD is localised. Google also stopped showing HowTo rich results in 2023, so this markup gives little search benefit. | `app/[locale]/page.tsx` `howToSteps` literal |
| N8 | Low | The skip link text "Skip to main content" is also English on the tr and de pages. | `app/[locale]/layout.tsx` |

### Regressions
- N5 (nested `<main>`) is the only regression. Nothing that was fixed before has come back.

---

## GEO Readiness Score: 65 / 100

| Dimension | Weight | Score | Weighted | Main driver |
|---|---|---|---|---|
| Citability | 25% | 77 | 19.3 | 10 direct FAQ answers (about 25-45 words each), the definition opening and the 129-word "How the reading works" block. Home now has 876 visible words. Feature h2s are still slogans, and there are no externally sourced facts. |
| Structural Readability | 20% | 78 | 15.6 | Clean h1 -> h2 outline and a skip link. Legal pages now have `<main>`. Loses points for the nested `<main>` on the content pages (N5) and for the English HowTo on tr/de. |
| Multi-Modal Content | 15% | 36 | 5.4 | Animated illustrations and Twitter large-image cards. Still no screenshot, sample report image, `ImageObject` (other than the logo) or video. |
| Authority & Brand Signals | 20% | 39 | 7.8 | Retention and deletion are now stated plainly on home, the named controller is on the legal pages, and there is a creator credit link. The machine summaries still omit storage. There is still no off-site entity, no `founder`, and the GitHub homepage is unset. |
| Technical Accessibility | 20% | 84 | 16.8 | SSR, all 9 UAs get 200, robots allows all AI bots, 21-URL sitemap, security headers. llms.txt is still malformed, the legal pages still have no canonical, metadata still streams into `<body>`, the OG image still redirects, and the manifest returns 404. |
| **Total** | | | **64.9 -> 65** | |

## Platform breakdown

| Platform | Prev | Now | Why |
|---|---|---|---|
| Google AI Overviews | 67 | 68 | More FAQ answers to quote. The 9 legal-page duplicates and the HowTo (no rich result) limit the gain. |
| ChatGPT Search | 49 | 50 | OAI-SearchBot allowed. Its non-JS fetch still gets body-placed metadata on 3 page types. No entity corroboration. |
| Perplexity | 57 | 59 | The new FAQ answers are short, factual and self-contained. Perplexity favours exactly that format. |
| Bing Copilot | 60 | 61 | bingbot gets metadata in `<head>`, and the FAQ is richer. IndexNow and Bing Webmaster Tools are still unverified. |

---

## AI crawler access (robots.txt, live)

All of these returned HTTP 200 with full SSR HTML: Googlebot, GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot,
bingbot, CCBot and Applebot.

| Bot | Capability it governs | Status |
|---|---|---|
| OAI-SearchBot | ChatGPT Search index and citations | Allowed (explicit) |
| ChatGPT-User | User-initiated ChatGPT fetches | Allowed (explicit) |
| GPTBot | OpenAI training only | Allowed (explicit) |
| Claude-SearchBot | Claude search citations | Allowed (explicit) |
| Claude-User | User-initiated Claude fetches | Allowed (explicit) |
| ClaudeBot | Anthropic training only | Allowed (explicit) |
| PerplexityBot | Perplexity index | Allowed (explicit) |
| Googlebot | Google Search and AI Overviews/AI Mode | Allowed (`*`) |
| Google-Extended | Gemini/Vertex training and grounding; not AIO inclusion | Allowed (explicit) |
| Bingbot | Bing index / Copilot | Allowed (`*`) |
| Applebot | Siri/Spotlight/Safari | Allowed (`*`) |
| Applebot-Extended | Apple Intelligence training only | Allowed (explicit) |
| CCBot | Common Crawl | Allowed (explicit) |
| cohere-ai | Cohere training | Not named; allowed via `*` |

Private paths (`/r/`, `/api/`, `/auth/`, `/login`, `/applications`, and now `/admin`, plus their tr/de variants) are disallowed
in both groups. The sitemap is declared.

## llms.txt and machine files

| File | Status | Notes |
|---|---|---|
| `/llms.txt` | **Present, malformed** | R3 is unchanged: 3 `nav./...` labels and 3 duplicate URLs. N1: no mention of storage. The FAQ link points to `/#faq`. |
| `/llms-full.txt` | 404 | Optional. |
| `/.well-known/ai.txt` | Present | Lists 4 pages. The legal pages and the contact are missing. N1 applies. |
| `/ai/summary.json` | Valid SoftwareApplication with `offers` 0 USD | N1 applies to `description`. |
| `/ai/faq.json` | Present, not schema.org shaped | 10 entries, current, and discloses storage. |
| `/feed.xml` | Present | All entries are dated with the build date. It is linked only from the legal pages. |
| `/manifest.json` | **404** (N6) | Committed in `public/`, but the middleware routes it through locale handling. |
| RSL 1.0 `/license.xml` | 404 | Optional. |

## JSON-LD (live)

| Page | Types | Notes |
|---|---|---|
| `/`, `/tr`, `/de` | Organization, WebSite, WebApplication, FAQPage (10), HowTo (new) | `sameAs` lists 2 GitHub URLs. No `founder`. WebApplication has no `offers` or `screenshot`. WebSite still has the SearchAction. The HowTo is English in every locale. |
| `/analyze`, `/builder` | BreadcrumbList | |
| `/about` | AboutPage, BreadcrumbList | |
| `/privacy`, `/kvkk`, `/data-request` | none | |

All blocks parse as valid JSON.

## Passage-level citability (visible text)

| Passage | Words | Verdict |
|---|---|---|
| Home h1 and definition opening | ~35 | Excellent and quotable. |
| "How the reading works" | 129 | Still the best block. |
| FAQ (10 Q&A) | 25-45 each | Strong. Retention, deletion and accuracy are now answerable straight from home. |
| Feature sections 01-04 | 40-60 plus example labels | The headings are still slogans ("Every lost point has a name."). Question-style h2s would extract better. |
| `/analyze` | ~150-200 | Mostly form chrome plus the storage line. |
| `/builder` | ~86 | Thin. |
| `/privacy`, `/kvkk` | 270-330 | Well structured, but they have no metadata of their own, so they are rarely chosen as the cited source. |

## Brand mention analysis

| Source | Finding |
|---|---|
| Wikipedia | 0 hits for "atsfreeforall". |
| Reddit | API returned 403, so this could not be verified. No threads found. |
| YouTube | Nothing found. This is the signal most strongly correlated with AI citations (about 0.737). |
| LinkedIn | Not in `sameAs`. The assets exist in `logo/linkedin/`. |
| GitHub | `ubterzioglu/ats`: 0 stars, `homepage: null`, description "Runs in the browser." |
| Creator | A footer link to ubterzioglu.de is now live. No `Person` entity is attached in the JSON-LD. |

---

## Top 5 highest-impact changes

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | **Fix llms.txt and restore storage in the machine summaries (R3 + N1).** In `app/llms.txt/route.ts`, drop the `nav()`-mapped legal entries (keep the titled ones). Change the meta description, `home.privacyTag`, `ai.txt` and `summary.json` to something like "Scored in your browser; the file is stored on our server for 12 months when you analyze it." Add a test that llms.txt contains no `nav.` and no duplicate URL. Scope the AI-hint lede to the model ("The model never receives your CV text"). | High. AI engines summarise from exactly these files. | 30 min |
| 2 | **Remove the nested `<main>` (N5) and give the legal pages metadata (R4).** Either change the layout wrapper to a `<div id="main-content">`, or change the page-level `<main>` elements on home, analyze, builder and about to `<div>`. Add `generateMetadata` with their own title and description plus `pageAlternates()` to `/privacy`, `/kvkk` and `/data-request`, and add WebPage + BreadcrumbList. Give `/about` its own description. | Medium. Fixes the regression and removes 9 duplicate titles. | 45 min |
| 3 | **Off-site entity.** Set the GitHub homepage to `https://atsfreeforall.com` and update the description to mention storage. Publish the LinkedIn page and add it, plus ubterzioglu.de, to `sameAs`/`founder`. Record one 2-3 minute YouTube walkthrough. Post an honest Show HN or r/resumes thread. | Highest for ChatGPT and Perplexity | 0.5-2 days, user-owned |
| 4 | **Head-placed metadata for AI bots (N2), OG redirect (R5) and manifest (N6).** In `next.config.ts`, set `htmlLimitedBots` to include Googlebot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot and CCBot. Point the en `og:image` at the non-redirecting URL. Add `json|webmanifest` to the middleware exclusion (or use `app/manifest.ts`) and link the manifest. | Medium for non-JS crawlers | 20-30 min |
| 5 | **Schema and media.** Add `offers` (price 0), `founder` (Person, linked to ubterzioglu.de) and a `screenshot` (one annotated real report image, also shown with descriptive `alt` on home and about) to the WebApplication. Drop the SearchAction. Localise or remove the HowTo (N7). | Medium. Multi-modal is still the weakest dimension. | 2-3 h |

Lower priority: make `/ai/faq.json` a schema.org FAQPage; use question-style h2s for the feature sections; link the feed from
home or drop it; fix per-entry feed dates; make the home canonical use the trailing slash; translate the skip link (N8);
give each page its own `og:title`/`og:description`.

---

## Structured findings (AI Search Readiness, for audit-data.json)

```json
{
  "category": "AI Search Readiness",
  "date": "2026-10-06",
  "score": 65,
  "previous_score": { "value": 64, "tool": "seo-geo skill", "comparable": true },
  "dimensions": { "citability": 77, "structural_readability": 78, "multimodal": 36, "authority_brand": 39, "technical_accessibility": 84 },
  "dimension_deltas": { "citability": 3, "structural_readability": -1, "multimodal": 1, "authority_brand": 2, "technical_accessibility": 0 },
  "platforms": { "google_aio": 68, "chatgpt": 50, "perplexity": 59, "bing_copilot": 61 },
  "crawlers": { "OAI-SearchBot": "allowed", "ChatGPT-User": "allowed", "GPTBot": "allowed", "Claude-SearchBot": "allowed", "Claude-User": "allowed", "ClaudeBot": "allowed", "PerplexityBot": "allowed", "Googlebot": "allowed", "Google-Extended": "allowed", "Bingbot": "allowed", "Applebot": "allowed", "Applebot-Extended": "allowed", "CCBot": "allowed", "cohere-ai": "allowed (wildcard)" },
  "llms_txt": "present_malformed",
  "rsl": "missing",
  "ssr": true,
  "deployed_commit_reflected": "7e3d122 (HEAD) as of 09:41 UTC",
  "fixed": ["geo.faq-expanded-10", "geo.legal-pages-main-landmark", "geo.storage-visible-on-home"],
  "findings": [
    { "id": "geo.storage-omitted-in-summaries", "severity": "medium", "url": "/llms.txt,/.well-known/ai.txt,/ai/summary.json,meta description", "detail": "Only 'Scored in your browser'; storage visible on home FAQ but not in machine summaries", "status": "open (partially mitigated)" },
    { "id": "geo.llms-txt-broken-labels", "severity": "medium", "url": "/llms.txt", "detail": "nav./privacy, nav./kvkk, nav./data-request plus duplicate entries", "status": "open" },
    { "id": "geo.legal-pages-metadata", "severity": "medium", "url": "/privacy,/kvkk,/data-request", "detail": "No canonical/hreflang, home title/description reused, no JSON-LD (main now present)", "status": "open (partially fixed)" },
    { "id": "geo.nested-main", "severity": "medium", "url": "/,/analyze,/builder,/about (all locales)", "detail": "Layout <main id=main-content> wraps page-level <main>", "status": "new (regression)" },
    { "id": "geo.metadata-in-body", "severity": "low-medium", "url": "/analyze,/kvkk,/data-request,/privacy", "detail": "Streaming metadata after </head> for Googlebot and AI bots; only bingbot/Applebot get head metadata", "status": "open" },
    { "id": "geo.manifest-404", "severity": "low", "url": "/manifest.json", "detail": "Middleware matcher does not exclude .json; locale-rewritten to 404; not linked", "status": "new" },
    { "id": "geo.howto-not-localized", "severity": "low", "url": "/tr,/de", "detail": "HowTo JSON-LD hard-coded English; no Google rich result since 2023", "status": "new" },
    { "id": "geo.ai-hint-never-sent", "severity": "low", "url": "all (payload)", "detail": "aiHint.lede 'never sent anywhere' not scoped to the model (messages/en.json:579)", "status": "open" },
    { "id": "geo.no-offsite-brand", "severity": "high", "detail": "No Wikipedia/Reddit/YouTube/LinkedIn; GitHub homepage null", "status": "open" },
    { "id": "geo.no-multimodal", "severity": "medium", "detail": "No screenshot, ImageObject or video", "status": "open" },
    { "id": "geo.og-image-redirect", "severity": "low", "detail": "/en/opengraph-image 307", "status": "open" },
    { "id": "geo.searchaction-nonfunctional", "severity": "low", "detail": "SearchAction to /analyze?q=", "status": "open" },
    { "id": "geo.schema-gaps", "severity": "low", "detail": "sameAs GitHub only; no founder; WebApplication lacks offers/screenshot", "status": "open" },
    { "id": "geo.faq-json-shape", "severity": "low", "url": "/ai/faq.json", "detail": "{faqs:[...]} not schema.org", "status": "open" },
    { "id": "geo.feed-link-scope", "severity": "low", "detail": "Feed alternate link only on legal pages", "status": "open" },
    { "id": "geo.about-description", "severity": "low", "url": "/about", "detail": "Reuses home description", "status": "open" }
  ]
}
```

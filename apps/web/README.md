# ats readability

Reads a CV the way an applicant tracking system reads it — as text, not as a design — and reports what survives
parsing, what is missing, and which terms from a job ad never appear in the document.

The CV is parsed and scored in the browser. When a CV is analysed, the file, extracted text and result are sent to the server, stored in Supabase (database and private bucket) and backed up to a Google Drive folder, kept 12 months, then purged. See `docs/adr-0001-cv-storage.md` for the decision record.

## What it does

1. **Extracts** text from PDF, DOCX or plain text. The PDF reader rebuilds lines from glyph coordinates instead
   of concatenating fragments, so line breaks and column gaps survive — they are the signals everything else
   reads structure from.
2. **Scores** the result across five dimensions worth 100 points in total.
3. **Attributes every lost point** to a named finding with a cause, a fix and a cost, ranked most expensive first.

| Dimension | Points | What it checks |
|---|---|---|
| Parseability | 25 | Text layer quality: columns, tables, icon fonts, broken encodings, letter-spacing, repeated page furniture |
| Keyword match | 25 | Coverage of terms mined from the job ad, weighted by how central each is to the posting |
| Structure | 20 | Mappable headings, dated entries, reverse-chronological order, bullets over paragraphs, length |
| Impact | 20 | Quantified results, ownership verbs, responsibility filler, buzzwords |
| Contact | 10 | Name, email, phone, location, profile link |

Section headings, action verbs and stopwords are recognised in **English, German and Turkish**; the document
language is detected from stopword frequency.

Without a job ad the keyword dimension is capped at 20 of 25 and says so in the report — a generic skill
inventory is not a match score, and the tool does not pretend otherwise.

## Running it

```bash
npm install     # also copies the pdf.js worker into public/vendor
npm run dev     # http://localhost:3000
```

```bash
npm run lint       # eslint, zero warnings allowed
npm run typecheck  # tsc --noEmit
npm test           # vitest, scoring engine
npm run build      # production build (standalone output)
```

## Supabase

Supabase provides authentication and storage. Without it configured, the gate is disabled (local development).

1. Create a project, then run migrations in `supabase/migrations/` in order.
2. Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=https://your-domain
```

3. In Supabase Dashboard -> Auth -> Providers, enable Google and set the callback URL to `https://<project>.supabase.co/auth/v1/callback`.
4. In Auth -> URL Configuration, set Site URL to `NEXT_PUBLIC_SITE_URL` and add `.../auth/confirm` to Redirect URLs.

With `NEXT_PUBLIC_SUPABASE_URL` absent, `getSupabaseEnv()` returns `null`, the gate is disabled, and the site works without authentication. Reports expire after 30 days; `purge_expired_ats_reports()` deletes the expired rows when called.

The tables have RLS enabled and no policies, so only the service-role key reaches them.

## Layout

```
app/             routes, the share-link server action, global styles
components/      analyzer (client) and the presentational report pieces
lib/extract/     PDF, DOCX and text readers — browser only
lib/scoring/     the engine: one file per dimension, pure functions, no DOM
lib/supabase/    service-role client and report storage — server only
supabase/        SQL migrations
tests/           vitest coverage of the engine and its invariants
types/           shared result types
```

The engine is pure TypeScript with no browser or network dependency, which is why it is testable on its own and
why `tests/scoring.test.ts` can assert the invariant that matters: **a dimension's score always equals its
maximum minus the findings charged against it.**

## Limits

The checks are heuristics built from how mainstream parsers behave, not a reproduction of any specific vendor's
software, and no scoring model can predict an invitation. A high score means nothing stands between the CV and a
human reader.

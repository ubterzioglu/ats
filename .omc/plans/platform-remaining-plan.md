# Plan (round 5): fix the review findings, finish the platform work, ship it

Executor: a coding agent (Qwen). Read this whole file first. It continues `.omc/plans/platform-admin-cv-store-plan.md`
(the "round 4" plan, also in `C:\Users\baris-terzioglu\.claude\plans\daha-fazla-nas-l-artt-rabiliriz-cozy-origami.md`). All hard rules,
decisions and appendices of that plan still apply. This file only lists what is wrong or missing after review.

Worktree: `C:\temp_private\ats-platform`, branch `platform-cv-admin` (HEAD was `e52cfc6` at review time; the legal pages were still being
written, `lib/legal-entity.ts` had uncommitted edits). **Finish and commit the in-progress legal work first, then start here.** One commit per
part. Do not push. Do not merge.

## State at review (2026-10-05, evening)

- `main` (`97b73b8`) has SEO rounds 2 and 3. `platform-cv-admin` has round 4 phases 1-5 committed (FAQ width, logos, 404, data layer, upload API,
  admin overview, data request form, cleanup cron). **None of the platform work is deployed**: live `/privacy`, `/kvkk`, `/data-request`,
  `/api/cv`, `/brand/*`, `/logo.png`, `/apple-icon.png` all return 404, the live home page still says "never uploaded", the nav still shows the
  old logo, Clarity still loads for everyone.
- On the branch: `npm run lint` clean, `npm run typecheck` clean, `npm test` 871 pass / 2 fail. The 2 failures are
  `tests/messages.test.ts` (the `de` and `tr` catalogs lack the new `kvkk.*` keys that `en` has): expected while legal pages are unfinished, must be green at the end.

## Part A - Bugs found in review (fix first, with tests)

Each item: problem -> required fix. Write a failing test first where a test is possible.

**A1. Storage path is never saved (critical: breaks the 12-month deletion promise).**
`lib/cv-submission/handle.ts` computes `storagePath` and uploads the file, but nothing writes `storage_path` to the row. The cleanup job
(`lib/supabase/cleanup.ts`) only removes a Storage object `if (sub.storage_path)`, so every uploaded file stays in the bucket forever.
Fix: generate the id in the handler (`crypto.randomUUID()`), compute the path **before** the insert, pass `id` and `storagePath` to
`insertSubmission` (extend its input), then upload. Test: after a successful submission the stored row has `storage_path` equal to the
uploaded path; the cleanup test removes that object.

**A2. No rollback when the Storage upload fails.**
`handle.ts` returns 502 but leaves a row containing the full CV text and no file (the comment admits it). Fix: add `deleteSubmissionRow(id)` to
`lib/supabase/submissions.ts` and call it on upload failure (and on any later unexpected throw before the function returns). Test with injected
ports: failed upload leaves no row.

**A3. No request size guard before parsing.**
`app/api/cv/route.ts` calls `request.formData()` first, so a huge body is buffered before any limit applies. Fix: if `content-length` is present and
exceeds `MAX_CV_BYTES + 1 MiB` return 413 before parsing; after parsing, reject `file.size > MAX_CV_BYTES` before `arrayBuffer()`. Apply the same
guard to `app/api/data-request/route.ts` (limit 32 KiB). Also reject a request with no `content-length` and no way to bound it? No: just keep the
post-parse check.

**A4. Rate limit silently disabled without the salt.**
`clientHash()` returns `null` when `CLIENT_HASH_SALT` is unset and `countRecentByClient(null, ...)` then does not limit. Fix: in production
(`process.env.NODE_ENV === "production"`) a missing salt makes `/api/cv` and `/api/data-request` return 503 `storage-unavailable` and log
once; in development keep the current behaviour. Test both branches.

**A5. Deletion order can orphan external copies.**
`cleanupExpiredSubmissions` treats `removeCvFile` as success even if it returns a failure value, then deletes the row. Read
`lib/supabase/storage.ts`: if `removeCvFile`/`deleteFromDrive` return a result object, treat `ok: false` (other than "not found") as failure and
**keep the row** (count it as `failed`). Order stays Drive -> Storage -> row. Add tests with injected ports for: Drive fails (row kept), Storage
fails (row kept), both succeed (row deleted), Drive 404 (counts as success).

**A6. Cron endpoint hardening and scope.**
`app/api/cron/cleanup/route.ts`: compare the bearer token with `crypto.timingSafeEqual` (check lengths first); return 503 when `CRON_SECRET` is
unset (not 401); never return `error.message` in the response (log it, return `{ error: "cleanup-failed" }`); accept `GET` as well as `POST`.
Extend the job (keep the route path `/api/cron/cleanup`, update every doc that mentions `/api/cron/maintenance`): after the purge,
(1) retry Drive for up to 20 rows with `drive_status in ('pending','failed')` older than 5 minutes (download from Storage, upload, update status),
(2) call `purge_expired_ats_reports()` through the service client (ignore failure), (3) respond `{ purged, failed, driveRetried, driveStillFailing }`.
No CV content in logs or responses. Tests: auth (missing/wrong/right secret, unset secret), selection of retry rows, response shape.

**A7. Data request endpoint is unprotected.**
`app/api/data-request/route.ts` has no rate limit and no honeypot, and returns the zod error tree to the caller. Fix: add a hidden honeypot field
(`website`, must be empty; if filled return 200 without inserting), rate limit 5 per hour per client hash (count rows in `data_requests`), return only
`{ error: "invalid-input" }` on validation errors, cap `email` at 254 and `message` at 2000 characters, trim and lower-case the e-mail.
Update `components/data-request-form.tsx` to send the honeypot and to show the three outcomes (sent, invalid, too many requests) with messages in all
three locales. Tests for validation, honeypot, rate limit.

**A8. Admin login redirect loses its target and ignores the locale.**
`lib/admin/guard.ts` redirects to `/login?next=/admin`, but the login action does not read `next`, so the admin lands on the default page after signing in,
and `redirect` from `next/navigation` is not locale-aware. Fix: use the locale-aware `redirect` from `@/i18n/navigation`; in `app/[locale]/login/actions.ts`
honour a `next` form field/query (reuse the `safeNext` logic from `app/auth/confirm/route.ts`: must start with a single `/`, never `//`, never a scheme) after a
successful password login. Test `safeNext` with `//evil.com`, `https://evil.com`, `/admin`, `/tr/admin`, empty.

**A9. `isAdminEmail` is `async` for no reason.** Make it synchronous and update callers.

**A10. Minor consistency.** Import order in `app/api/cv/route.ts` and `handle.ts` must follow the project's groups (external, `@/`, relative, blank lines
between). Replace the loose types (`HandleSubmissionInput` as `type`) with `interface` where the object is not a union. No behaviour change.

Commit: `fix(cv): persist storage path, roll back failed uploads, harden cron and request endpoints`.

## Part B - Finish the admin panel (only the overview exists)

Implement everything from round 4 Phase 4 that is missing. Present today: `/admin` overview with stats, filters and table. Missing:

1. `app/[locale]/admin/submissions/[id]/page.tsx`: metadata, score and findings, CV text (scrollable, monospace), job-ad text, Drive link, buttons **Download original**
   (server action returning a 60-second signed URL via `createDownloadUrl`) and **Delete** (confirm step).
2. `lib/admin/delete-submission.ts` shared by the admin action and the cleanup job (the cleanup job from A5 should call it): Drive -> Storage -> row, aborting
   without deleting the row if an external delete fails. Audit entry on success.
3. `lib/admin/audit.ts` `logAdminAction(email, action, submissionId?, detail?)` writing `admin_audit_log` (the table exists; nothing writes to it today). Call it for list view
   (once per page load), detail view, download, delete, export, request update. `detail` never contains CV content or file names.
4. `/admin/requests`: table of data requests with status filter and "mark done"/"mark rejected" actions (sets `handled_by`, `handled_at`, writes an audit row).
5. `/admin/audit`: last 200 audit rows.
6. CSV export of the filtered list (columns: id, created_at, expires_at, language, total, band, drive_status, file_size; no text, no file name), cells starting with
   `=`, `+`, `-` or `@` prefixed with `'`.
7. Nav: show an "Admin" link only for admins, computed on the server (do not send the allow-list or any admin flag derived from it to client components that render for everyone).
8. Every admin server action calls `requireAdmin()` itself. `app/[locale]/admin/**` has `metadata.robots = { index: false, follow: false }`; `/admin`, `/tr/admin`, `/de/admin`
   are in the robots `disallow` list and absent from the sitemap and `llms.txt`.
9. Messages: `admin.*` in en and tr (de = en copy) for every new label.
10. Tests: guard cases (anonymous, non-admin, unconfirmed e-mail, admin), CSV escaping, filter-to-query building, deletion order with injected ports, audit helper never
    receives CV text (type-level: the `detail` parameter is a short string, and add a test that the delete action passes only the id).

Commit: `feat(admin): submission detail, delete, download, requests, audit log and CSV export`.

## Part C - Items from round 4 phases 6 and 7 that are still open

Check each against the branch; do only what is missing, and list in the report what you found already done.

1. Legal pages `/privacy` (en: Appendix C, de: Appendix D, tr: Appendix E), `/kvkk` (Appendix A and B, Turkish in every locale), `/data-request` in the sitemap, hreflang,
   footer and `llms.txt`. No `FILL_ME` anywhere: `grep -rn "FILL_ME" apps/web supabase` must return nothing. If `lib/legal-entity.ts` still lacks real values, STOP and report.
2. `tests/messages.test.ts` green (all three locales have the same keys).
3. Cookie consent: `lib/consent.ts`, `components/consent-banner.tsx`, `components/clarity-loader.tsx`; remove the unconditional Clarity `<Script>` from
   `app/[locale]/layout.tsx`; footer "Cookie settings"; `data-clarity-mask="true"` on CV text areas and evidence containers.
4. Copy sweep and docs: `apps/web/docs/adr-0001-cv-storage.md`, new privacy contract in `AGENTS.md`, `apps/web/README.md`, `MASTERPLAN.md` (claims only), the message keys listed
   in round 4 Phase 7, `app/llms.txt/route.ts`, `/ai/*.json`, `.well-known/ai.txt`, `feed.xml`, FAQ JSON-LD. Updated tests `tests/byok-privacy.test.ts` and
   `tests/d4-d5-surface.test.ts` keep their intent. Final search for leftovers (`never uploaded`, `nothing is uploaded`, `never leaves`, `asla yüklenmez`, `nie hochgeladen`,
   `hiçbir şey yüklenmez`) with every remaining hit explained in the report.
5. `.env.example` and `docker-compose.yml` runtime env list `ADMIN_EMAILS`, `CRON_SECRET`, `CLIENT_HASH_SALT`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
   `GOOGLE_DRIVE_FOLDER_ID` (runtime only, never build args, never `NEXT_PUBLIC_`).

Commits: `feat(legal): ...`, `feat(consent): ...`, `docs: ...` as appropriate.

## Part D - Small SEO leftovers seen in the live audit (74/100)

1. `/ai/faq.json`: the audit tool reports "0 FAQs" because it expects `{ "faqs": [ { "question": "...", "answer": "..." } ] }`, but the file is a schema.org FAQPage. Change the **file**
   to the `faqs` shape (keep its content identical to the visible FAQ; the FAQPage JSON-LD on the home page stays as is). Update the test.
2. Atom feed: `/feed.xml` returns 200 but the tool does not see it. Add `alternates: { types: { "application/atom+xml": "/feed.xml" } }` to the root metadata so the `<link rel="alternate">`
   is in `<head>` of every page. Verify with `curl -s localhost:3000/ | grep -i 'rel="alternate" type="application/atom'`.
3. Error recovery signals: the tool still reports "aria-live no, roles no" although errors got `role="alert"`; they are only rendered when an error occurs, so static HTML has none.
   Add one always-present, visually hidden live region in the analyzer shell (`<div role="status" aria-live="polite" className="sr-only">` fed by a small state string for "reading",
   "scored", "failed"), without changing visible behaviour. Do not duplicate announcements that already exist.
4. `sameAs`: add further real profiles only if the user supplies them (`SAME_AS_EXTRA`). Do not invent any.

Commit: `fix(seo): faq.json shape, feed link and persistent live region`.

## Verification (from the worktree's `apps/web`)

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all clean; report the test count (was 871 pass + 2 failing).
2. With a local Supabase project and credentials in the shell environment only (never in files, never printed):
   - Upload a PDF, a DOCX and pasted text: three rows, each with a non-null `storage_path`, three objects in `cv-files`, Drive files named `{id}.{ext}`.
   - Force a Storage failure (bad bucket name): the response is 502 and **no row remains**.
   - Send a 12 MB file with a `content-length` header: 413 before parsing. Send a renamed `.exe`: 415. Missing consent: 400. 21 uploads in an hour: 429.
   - Unset `CLIENT_HASH_SALT` with `NODE_ENV=production`: `/api/cv` and `/api/data-request` return 503.
   - Set one row's `expires_at` to the past and call `/api/cron/cleanup` with the secret: Drive file, Storage object and row are gone; with a wrong secret: 401; with no secret configured: 503.
   - Break the Drive refresh token: the analysis still shows, the row is `failed`; run the cron route and watch the retry.
3. Admin: anonymous -> login -> returns to `/admin` (locale kept); a second signed-in user gets 404; `ubterzioglu@gmail.com` (confirmed) gets in; detail, download, delete, export,
   requests and audit pages work and each action writes an `admin_audit_log` row.
4. Consent: Analyze disabled until the checkbox is ticked; the choice persists; Clarity's request appears only after "Accept analytics".
5. `/privacy`, `/kvkk`, `/data-request` render in en, tr, de without placeholders; they are in `sitemap.xml`; `/admin` is not.
6. `/foo`, `/tr/foo`, `/de/a/b/c`, `/r/0000000000000000` return 404 with the styled page. FAQ is full width at 375, 768 and 1280 px. Nav shows the lockup on desktop and the icon on mobile.
7. `/r/<token>` pages are still `noindex`; the share-link feature still stores scores only.

## Report back

Branch and commit hashes per part; for every A-item: root cause confirmed or not, fix, test name; files created and edited; the four npm results with counts; manual results
(say which could not be run and why); leftover privacy-claim hits; every deviation with the reason. If a step is ambiguous or an INPUT is missing, stop and ask.

## Merge and deploy checklist (user-owned, in this order)

1. Review the branch (a second reviewer pass is recommended for `lib/cv-submission/*`, `lib/drive/client.ts`, `lib/admin/*`, the two cron/API routes).
2. Lawyer review of the legal texts (KVKK article 9 transfers and the notification duty, GDPR chapter V, special-category data in CVs, VERBIS/DPIA applicability, processor
   agreements with Supabase and Google). The texts are drafts.
3. **Run `supabase/migrations/0003_cv_submissions.sql` in Supabase first**, confirm the `cv-files` bucket is private, run `supabase/verify-rls.sql`. Deploying code before the
   migration makes uploads fail (the app fails open, but nothing is stored).
4. Google Drive: folder id, OAuth client (Desktop), Drive API enabled, consent screen **In production**, run `node scripts/google-drive-auth.mjs`, keep the refresh token.
5. Coolify runtime env: `ADMIN_EMAILS=ubterzioglu@gmail.com`, `CRON_SECRET`, `CLIENT_HASH_SALT`, the four Google values. `NEXT_PUBLIC_*` stay build variables.
   Scheduled task hourly: `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://atsfreeforall.com/api/cron/cleanup`.
6. Create the admin account at `/login` with `ubterzioglu@gmail.com`, confirm the e-mail, enable MFA if Supabase offers it.
7. Microsoft Clarity: set masking to Strict.
8. Merge `platform-cv-admin` into `main`, deploy. Then on production: analyse one test CV, find it in `/admin`, download it, delete it, confirm the Drive file and the Storage object are gone.
9. Re-run `geo audit --url https://atsfreeforall.com` and compare with 74/100; confirm the live pages no longer say "never uploaded".

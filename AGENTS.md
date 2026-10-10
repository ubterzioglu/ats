# AGENTS.md

## Project

`ats readability` — a CV analyzer that scores how well an applicant tracking system can read a document and
lists the fixes in order of value. Next.js 15 (App Router), React 19, TypeScript strict, Tailwind 3, optional
Supabase. Standalone output for Docker deployment.

## Commands

```bash
npm run dev
npm run build
npm run lint        # eslint, --max-warnings=0
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

**Run `npm run lint`, `npm run typecheck` and `npm test` after any change.** All three must pass clean.

## Git workflow

After every change, once lint, typecheck and tests pass, commit and push straight to `main` without asking.
Stage only the files that belong to the change; leave unrelated working-tree changes alone. Use conventional
commit messages.

## Architecture rules

- **`lib/scoring/` is pure.** No DOM, no network, no React, no I/O. One file per dimension. Everything there is
  unit-testable and must stay that way.
- **`lib/extract/` is browser-only.** Reads files in the client. The CV is parsed and scored in the browser;
  when a CV is analysed, the file, extracted text and result are then sent to the server for storage.
- **`lib/ai/` is browser-only and advisory.** Models run locally (Web Worker, WebGPU/WASM); nothing in this
  directory may feed inputs into `lib/scoring/` — scores stay deterministic. Model weights download only after
  explicit user consent, with size, progress and cancel shown. CV text is not sent to a model provider unless
  the user turns that on; downloading weights is allowed because no CV text is sent.
- **`lib/supabase/` is server-only.** Every file starts with `import "server-only"`. Service-role client
  bypasses RLS, so validate before writing — see `app/actions.ts` for the boundary check.
- **`lib/cv-submission/` is server-only.** Handles CV storage and validation. See
  `docs/adr-0001-cv-storage.md` for the decision record.
- **`lib/help/` is pure and serverless.** The site helper answers from a keyword bank, never sends data to a
  server, never stores anything. A future model answerer will implement the same `HelpAnswerer` interface.
- Persistence is optional everywhere. If `getSupabaseEnv()` returns `null`, callers degrade quietly and never
  throw.

## Scoring invariant

A dimension's score is `max - sum(cost of its findings)`, clamped to `[0, max]`. Adding a deduction means adding
a `FindingDraft` with a `cost`; never adjust a score directly. `tests/scoring.test.ts` asserts this, and the UI
depends on it — the report claims every lost point is explained.

When adding a check:

1. Add the `FindingDraft` to the right dimension file with `id` namespaced by dimension (`parse.columns`).
2. Keep `title` a statement of the defect, `detail` the evidence, `fix` a concrete instruction.
3. Add a test with a fixture that triggers it and one that does not.
4. If the new cost pushes a dimension's realistic floor to zero, rebalance the existing costs rather than
   letting one check dominate.

## Code style

- TypeScript strict with `noUncheckedIndexedAccess`. No `any`.
- `interface` for object shapes, `type` for unions. `readonly` on result and props types.
- Named function exports for components; `export default` only for `app/` pages.
- Server components by default; `"use client"` only where state or events require it.
- Tailwind utilities only. Design tokens are CSS variables in `app/globals.css`, mapped in `tailwind.config.ts`
  with the `rgb(var(--x) / <alpha-value>)` pattern. Semantic names: `bed`, `sheet`, `ink`, `muted`, `line`,
  `mark`, `signal`, `caution`, `good`.
- kebab-case file names, PascalCase components, `@/` path alias for all internal imports.
- Import groups: external, `@/` internal, relative — separated by blank lines.
- No comments that restate the code. Comments explain a decision or a non-obvious constraint.
- No emojis in code or UI text.

## Copy

The interface speaks plainly and never oversells. It says what a check found and what to do about it. It does
not claim to predict hiring outcomes, and it does not claim to replicate a named vendor's parser.

## Privacy contract

The CV is read and scored in the browser. When a CV is analysed, the file, extracted text and result are sent to the server, stored in Supabase (database and private bucket), kept 12 months, then purged. Submissions and reports are bound to the user's account via `user_id`. Share links persist scores and findings with `evidence` stripped, because evidence can contain lines lifted from the document. Any further use of CV data needs an explicit product decision. See `docs/adr-0001-cv-storage.md` for the decision record.

A logged-in user may save a profile from CV analysis extractions. The profile is stored server-side, bound to the account, and retained until the account is deleted. Profile data is never written without explicit user confirmation, and never feeds into `lib/scoring/`. See `docs/adr-0002-user-profile.md` for the decision record.

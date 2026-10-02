# ATS Free For All — Program Plan (Modules A–J)

> **For agentic workers:** This is a **program plan**, not a task plan. It decomposes every roadmap
> module into small, independently shippable batches and fixes their order, dependencies and
> acceptance. It does **not** contain step-by-step TDD tasks.
>
> Before implementing a batch, write its own task plan with `superpowers:writing-plans` into
> `docs/superpowers/plans/YYYY-MM-DD-<batch-id>-<name>.md`, then execute that plan with
> `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
>
> Reason for the split: ten modules are ten independent subsystems. The writing-plans scope check
> requires one plan per subsystem, each producing working software on its own. A single document
> with real TDD steps for all of them would run to hundreds of pages and most of it would be
> rewritten before it was reached.

**Goal:** Turn a browser-local CV readability checker into a candidate cockpit that covers the whole
job-search loop, without the CV ever leaving the browser.

**Architecture:** Browser-first throughout. A deterministic scoring engine (`lib/scoring/`, pure)
stays the only producer of scores. Optional AI layers sit on top and are advisory. Local persistence
is IndexedDB behind one versioned store layer. The server holds accounts and share links only.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind 3, `next-intl`,
`@react-pdf/renderer`, `@huggingface/transformers` (in-browser embeddings), optional Supabase.

**Source documents:**
- [`ROADMAP.md`](../../../ROADMAP.md) — product roadmap this plan implements
- [`docs/superpowers/specs/2026-10-02-workbench-visual-language-design.md`](../specs/2026-10-02-workbench-visual-language-design.md) — visual language spec (merged in as the `V` batches)
- [`AGENTS.md`](../../../AGENTS.md) — architecture rules and the privacy contract

---

## Global Constraints

Every batch inherits these. A batch that violates one is redesigned or dropped.

- **`lib/scoring/` is pure.** No DOM, no network, no React, no I/O. One file per dimension.
- **The score comes only from the deterministic engine.** AI output may never be an input to
  `lib/scoring/`. (ROADMAP principle 1.)
- **A dimension's score is `max - sum(cost of its findings)`, clamped to `[0, max]`.** Adding a
  deduction means adding a `FindingDraft` with a `cost`. Never adjust a score directly.
  `tests/scoring.test.ts` asserts this.
- **The CV never leaves the browser by default.** Any feature that sends data out is opt-in and
  states where it goes, on every request.
- **No invention.** No skill, experience or number the candidate does not have may be written into a
  CV. Placeholders (`[X%]`, `[N people]`) instead of invented figures.
- **Every lost point is explainable.** Each finding carries its source line and a concrete fix.
- **No vendor-named scores.** Checks are heuristics from common parser behaviour, never "Workday score".
- **The core product works fully without AI.** AI layers are conveniences on top.
- **Persistence is optional everywhere.** If `getSupabaseEnv()` returns `null`, callers degrade
  quietly and never throw.
- **Interface language:** English is primary. Turkish and German are added translations.
- **TypeScript strict** with `noUncheckedIndexedAccess`. No `any`. `interface` for object shapes,
  `type` for unions, `readonly` on result and props types.
- **Named function exports** for components; `export default` only for `app/` pages. kebab-case file
  names, `@/` alias, import groups: external, `@/`, relative.
- **Tailwind utilities only.** Design tokens are CSS variables mapped with the
  `rgb(var(--x) / <alpha-value>)` pattern.
- **No emojis in code or UI text.** No comments that restate the code.
- **`npm run lint` (`--max-warnings=0`), `npm run typecheck`, `npm test` clean after every batch.**

---

## Review Focus

Failure modes the roadmap implies but which no single module owns. Each gets its test in the batch
named here.

1. **Turkish and German characters end to end.** `ş ğ ı İ ö ü ç ä ß` must survive extraction →
   scoring → keyword matching → PDF export → re-import. A CV that scores well in English and badly
   in Turkish purely because of glyph handling is the most likely real failure. → tests in **J.4**
   (corruption detection) and **E.7** (closed-loop export).
2. **Reports saved by the old UI, rendered by the new one.** `/r/[token]` loads persisted reports.
   Fields added later will be absent on old rows. → tests in **V.9**.
3. **Documents far outside the expected size.** A 20-page CV, a 15,000-word job ad, a CV pasted as
   one line. Module C promises re-scoring under 300 ms. → tests in **C.1**.
4. **Every AI path unavailable.** Consent declined, WebGPU missing, Ollama offline or blocking the
   origin, BYOK key rejected, model download cancelled mid-way. Every AI surface must degrade to the
   deterministic product rather than block it. → tests in **L.2** and **L.4**.
5. **Storage refused or full.** Private browsing, IndexedDB blocked, quota exceeded. Modules C, D, E
   and G all persist locally; none may lose the user's work silently. → tests in **ST.1**.

---

## Batch sizing

| Size | Meaning |
|---|---|
| **S** | One sitting. One or two files, one test file. |
| **M** | A day. Several files, a new component or module boundary. |
| **L** | Multi-day. New subsystem, new dependency, or a cross-cutting change. |

---

## Phase 0 — Groundwork

Opens the funnel and lays the ground the rest needs. No new product surface.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **P0.1** | **Remove the login gate.** Drop the `/analyze` protection block in [`middleware.ts`](../../../apps/web/middleware.ts) (keep `updateSession`). Sign-in becomes required only for saving and sharing. Align the landing copy. | S | — | `/analyze` reachable signed out, full analysis runs; share still asks for sign-in |
| **P0.2** | **Delete the dead analyze proxy.** Remove `app/api/analyze/route.ts`. Nothing references it; it is a live endpoint that forwards a request body to a server backend and contradicts the privacy contract. | S | — | Route gone; no reference to `API_URL` remains in `apps/web` |
| **P0.3** | **Retire the rejected server tree.** Delete `apps/api/`, `services/`, `packages/`, the empty `infra/` and `data/`. Reduce `docker-compose.yml` to the `web` service. **Blocked until the deployment question is answered** (see Open Decisions). | S | P0.2 | `docker compose up` builds and serves the web app alone |
| **P0.4** | **Archive the superseded technical plan.** Move `ATS_Free_For_All_TECHNICAL_PLAN.md` to `docs/archive/` with a header pointing at ROADMAP §9. Update the links in `ROADMAP.md`. | S | — | No link in `ROADMAP.md` is broken |
| **P0.5** | **i18n infrastructure.** Add `next-intl`. English as default locale. Locale routing and a language switcher. No translation yet — this batch only moves existing strings into message catalogs. | M | — | Every user-facing string in `app/` and `components/` resolves through the catalog; English output byte-identical to today |
| **P0.6** | **Turkish translation.** | M | P0.5 | Full UI in Turkish; no untranslated keys |
| **P0.7** | **German translation.** | M | P0.5 | Full UI in German; no untranslated keys |

**P0.5 must land before the `V` batches.** The redesign writes a large amount of new UI copy; writing
it outside the catalog means extracting it all a second time.

The roadmap's Phase 0 also lists "before/after score difference" and "PDF report export". The first
already exists in part ([`score-rail.tsx`](../../../apps/web/components/score-rail.tsx) renders a
`previous` result) and is completed by **C.2**. The second needs the PDF infrastructure and is
scheduled as **E.1a**.

---

## Phase 1 — Store, visual language, fix mode, parse view, localization engine

### Store (`lib/store/`) — built once, four modules depend on it

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **ST.1** | **IndexedDB wrapper.** Versioned schema, migration scaffold, typed records. Handles refusal and quota exhaustion by surfacing the failure, never by silently dropping data. | M | — | Works in private browsing or reports clearly that it cannot; quota-exceeded path tested |
| **ST.2** | **Analysis history.** Last N analyses per browser: total, dimension scores, timestamp. No CV text. | S | ST.1 | Second visit shows the previous score |
| **ST.3** | **Data controls.** One-click wipe of everything stored locally, with a count of what will go. | S | ST.1 | Wipe clears all stores; UI confirms |

### Visual language (`V`) — implements the workbench spec

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **V.1** | **Tokens, fonts, themes.** New CSS variables for both themes, `tailwind.config.ts`, Instrument Sans + DM Mono via `next/font/google` with `axes: ["wdth"]`, `data-theme` mechanism, pre-paint theme script, theme-aware `viewport.themeColor`, `ThemeToggle`. | M | P0.5 | Both themes render; no flash on load; `wdth` axis demonstrably applied |
| **V.2** | **Surface primitives.** `.bench` and `.live`; remove `.sheet`, `.ruler`, `.scan-*`. Update `barTone` in `lib/ui.ts`. | S | V.1 | No component references a removed class |
| **V.3** | **Landing reset.** Delete `parse-sweep.tsx`; new `bench-preview.tsx` hero showing real ordered findings with point values. Weights section reset. | M | V.2 | Hero communicates the product without animation; reduced-motion clean |
| **V.4** | **Analyze input view reset.** CV and job-ad surfaces in the new system. | S | V.2 | Visual parity of function, new system |
| **V.5** | **`bench/measure-rail.tsx`.** `score-rail.tsx` becomes the sticky instrument. Condensed width via the `wdth` axis. Meters animate once on first render only. | M | V.2 | Deltas still shown; no motion on re-render |
| **V.6** | **`bench/work-list.tsx` + `bench/work-item.tsx`.** The spine. Numbered, value-ordered findings with evidence and point value. **This is the merge point with Module C** — see Merge Decision. | L | V.2, V.5 | Eight panels reduced to spine + rail; every finding reachable |
| **V.7** | **`bench/ask-dock.tsx`.** `report-chat.tsx` becomes a persistent strip. | M | V.6 | Reachable from anywhere in the report |
| **V.8** | **Keyword panel + coverage fold-in.** `coverage-map.tsx` absorbed into `keyword-panel.tsx`. | M | V.2 | One panel, both reports |
| **V.9** | **Remaining surfaces.** `/r/[token]` (read-only spine, no AI, no dock), `/login`, `not-found`, `coming-soon`. Includes the old-report compatibility test from Review Focus 2. | M | V.6 | A report saved by the old UI renders |
| **V.10** | **Quality pass.** Contrast verified at 4.5:1 in both themes, keyboard focus visible, touch targets ≥44px, `prefers-reduced-motion`, mobile single-column collapse, no horizontal scroll. Confirms `live` cyan appears nowhere outside AI surfaces. | M | V.3–V.9 | Every item verified with evidence |

### Module C — Fix mode

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **C.1** | **Inline edit and instant re-score.** Edit from inside a work item; the engine re-runs and the rail moves. Includes the document-size tests from Review Focus 3. | M | V.6 | Re-score under 300 ms on a mid-range laptop for a realistic CV |
| **C.2** | **Per-change delta.** "+4 · Keyword match", naming which finding closed. | S | C.1, ST.2 | Every score change attributable to a finding |
| **C.3** | **Session score history.** A plot of the score across the session. | M | C.2, ST.2 | Survives reload |

### Module A — Parse view 2.0

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **A.1** | **Identity field table.** Name, email, phone, location, links, from the existing `lib/scoring/contact.ts` context. | M | V.8 | Each field shows found / suspect / missing |
| **A.2** | **Experience entries table.** Title, company, date range per entry; education, skills, languages. | M | A.1 | Entries listed as the parser sees them |
| **A.3** | **Reasons for suspect and missing.** Readable cause, e.g. "the date range looks split across two columns". | M | A.2 | Every non-found field carries a reason |
| **A.4** | **Field to source-line highlighting.** Clicking a field marks its line in the raw text. | M | A.3 | Works on desktop and mobile |

### Module J — Localization engine

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **J.1** | **Turkish stemming.** Snowball Turkish stemmer in keyword matching, plus locale-correct `ı/i` and `İ/I` casing. Domain rules on top. | M | — | Turkish keyword match rate comparable to English on the test set |
| **J.2** | **German compound splitting.** Dictionary-based splitter ("Softwareentwicklung" → "Software" + "Entwicklung"). | M | — | German keyword match rate comparable to English |
| **J.3** | **Per-language stopwords.** Extends `lib/scoring/stopwords.ts`. | S | J.1, J.2 | Stopwords no longer inflate coverage in TR/DE |
| **J.4** | **Encoding corruption check.** Garbled `ı İ ş ğ ç ö ü ä ö ü ß` reported as a Parseability finding. Owns Review Focus 1. | M | — | Corrupted test PDFs detected; clean ones not flagged |
| **J.5** | **Date formats.** "Oca 2022", "Ocak 2022", "01.2022", "Jan. 2022", "März 2022", "heute", "halen", "devam ediyor". | M | — | Structure dimension reads TR/DE dates |
| **J.6** | **Market-based advice.** Photo, date of birth, marital status, military service, by target market. | S | J.5 | Advice differs by selected market |
| **J.7** | **Europass detection.** | S | J.5 | Europass layouts recognised and warned about |

---

## Phase 2 — Semantic layer

Layer 1 partly exists: `@huggingface/transformers` is a dependency and
[`lib/ai/embeddings.ts`](../../../apps/web/lib/ai/embeddings.ts) and `semantic-match.ts` are in place.

### Module B — ATS profiles (matching modes)

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **B.1** | **Three matching modes.** Strict (literal), normalized (synonyms, abbreviations, taxonomy), semantic (Layer 1 embeddings). One engine, three modes. | L | J.3 | Same CV and ad produce consistently different, explainable results |
| **B.2** | **Mode comparison summary.** "61 strict, 78 semantic. The difference comes from these 4 terms." | M | B.1 | Difference attributable to named terms |
| **B.3** | **Semantic labelling.** Semantic hits presented as "possible match", never as a confirmed skill. No vendor names on profile cards. | S | B.2 | No semantic hit presented as certain |

### Module F — Job ad analyser

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **F.1** | **Ad parsing.** Required skills, preferred skills, seniority, language requirement, location/remote, salary if present. `KeywordTerm.tier` already carries required/preferred. | L | B.1 | Required/preferred split reasonable on the test ad set |
| **F.2** | **Red flags.** Over-long skill lists, a years requirement contradicting the seniority, vague role definition. | M | F.1 | Each flag names its evidence |
| **F.3** | **Deterministic eligibility checklist.** | M | F.1 | No AI involved |
| **F.4** | **Multi-ad comparison.** 5–10 ads, best fit. | L | F.3, ST.1 | Ten ads compared in-browser |
| **F.5** | **Learning priority list.** Most frequently missing skills across the target role. | M | F.4 | Ordered by frequency across stored ads |

---

## Phase 3 — Builder (Module E)

The largest module and the strongest differentiator. Can run in parallel with Phase 4.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **E.1** | **PDF infrastructure.** `@react-pdf/renderer` with embedded fonts covering Turkish and German glyphs. Chosen because it gives a controlled text layer — the closed-loop guarantee depends on us, not the browser, deciding how text is written. | L | — | A probe document round-trips through `lib/extract/` with glyphs intact |
| **E.1a** | **Analysis report as PDF.** Completes the roadmap's Phase 0 item on top of E.1. | S | E.1 | Report downloads as PDF, client-side |
| **E.2** | **Canonical resume model.** JSON Resume schema, zod-validated, mapped to the technical plan's `ResumeDocument`. | M | — | Schema validates the fixture set |
| **E.3** | **Editor form.** | L | E.2 | Every schema field editable |
| **E.4** | **Template: dense.** Single column, standard headings. | M | E.1, E.3 | Renders the fixture resume |
| **E.5** | **Template: plain.** | M | E.4 | Renders the fixture resume |
| **E.6** | **Template: modern.** | M | E.4 | Renders the fixture resume |
| **E.7** | **Closed-loop validation.** Every export runs through our own parser; the result is shown to the user. CI regression test asserts all templates score Parseability 25/25, including Turkish and German fixtures. Owns Review Focus 1 for export. | L | E.4–E.6 | CI fails if any template drops below full marks |
| **E.8** | **DOCX export.** | L | E.2 | Opens correctly in Word and LibreOffice |
| **E.9** | **Import an existing CV.** Parse PDF/DOCX into the editor; mark fields that could not be extracted for manual completion. | L | E.3, A.2 | Unextractable fields flagged, never invented |
| **E.10** | **JSON Resume import and export.** | S | E.2 | Round-trips without loss |

---

## Phase 4 — AI layers

### Layers

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **L.1** | **`LLMProvider` in TypeScript.** `id`, `health()`, `chat()`, `structured<T>()`. Partly exists under `lib/ai/providers/`. | M | — | Provider swap changes no scoring behaviour |
| **L.2** | **Layer 2 — the user's own Ollama.** Connection guide for `OLLAMA_ORIGINS`, a "test connection" button, clear failure messages. Owns Review Focus 4. | M | L.1 | Every failure mode produces a usable message, never a blocked UI |
| **L.3** | **Layer 3 — BYOK.** Key held in the browser only, never sent to our server. A visible "your CV will be sent to: …" notice on every request. | M | L.1 | Key never leaves the browser; notice present on every call |
| **L.4** | **Schema validation of all LLM output.** Output failing its schema is never shown. Owns the rest of Review Focus 4. | M | L.1 | Malformed output rejected, user told plainly |

### Module D — Tailoring workshop

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **D.1** | **CV variants.** Each variant bound to one ad, derived from the master CV, stored in IndexedDB. | L | ST.1, E.2 | Variants persist across reloads |
| **D.2** | **Missing-term cards.** Where the term appears in the ad, how central it is, where it would go in the CV. | M | F.1 | Each card cites the ad |
| **D.3** | **"I have this skill" gate.** No term enters a CV without confirmation. Enforced by an automated test. | M | D.2 | Test proves an unconfirmed skill cannot be added |
| **D.4** | **Bullet rewriting.** Rephrases existing bullets only. No invented numbers; placeholders where a measurable result is missing. Builds on `lib/ai/tasks/rewrite.ts` and `grounding.ts`. | L | L.4, D.3 | Output containing a number or organisation absent from the input is rejected |
| **D.5** | **Per-bullet diff accept/reject.** | M | D.4 | Each change independently acceptable |
| **D.6** | **Variant comparison.** Master score against tailored variant score. | M | D.1 | Both scores shown side by side |
| **D.7** | **Cover letter helper.** Same guardrails as D.4. | M | D.4 | No invented claims |

---

## Phase 5 — Close the loop

### Module G — Application tracker (local only in this pass)

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **G.1** | **Kanban.** Saved → Applied → Interview → Offer/Rejected. | L | ST.1 | Fully usable without an account |
| **G.2** | **Card links.** Ad, CV variant used, score at the time of applying, notes, contacts. | M | G.1, D.1 | Each card resolves its linked records |
| **G.3** | **Follow-up reminders.** e.g. "no reply for 7 days". | M | G.1 | Reminders computed locally |
| **G.4** | **CSV and JSON export.** | S | G.1 | Round-trips |
| **G.5** | **One-click deletion.** | S | G.1, ST.3 | Removes everything, locally |

Encrypted server sync is deliberately **not** in this pass. It is a large security surface with a key
recovery problem (a forgotten password means lost data) and data-protection obligations. It gets its
own spec later.

### Module H — Interview preparation

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **H.1** | **STAR story bank.** Situation/Task/Action/Result cards built from CV achievement bullets. Works without AI. | L | ST.1 | Usable with every AI layer off |
| **H.2** | **Template questions.** Common questions mapped to story cards. | M | H.1 | No AI required |
| **H.3** | **Ad-specific questions.** Layer 2/3. | M | H.2, L.4 | Generated questions cite terms from the ad |
| **H.4** | **Practice mode.** Question shown, answer written, relevant story card suggested. | M | H.3 | Suggestion traceable to a card |

### Module I — LinkedIn consistency check

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **I.1** | **Parse the LinkedIn "Save as PDF" export.** No scraping. | M | A.2 | Export parsed correctly |
| **I.2** | **Inconsistency report.** Date mismatches, differing titles, skills in the CV but not the profile, headline against target role. | M | I.1 | Each inconsistency cites both sources |

### Module F deferred item

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| **F.6** | **Ghost posting check.** Greenhouse / Lever / Ashby public job-board APIs via a server proxy. Contains no CV data, so the privacy contract holds. | L | F.1 | Proxy carries no candidate data |

---

## Dependency graph

```
P0.1 ─┐
P0.2 ─┼─► P0.3
P0.4 ─┘
P0.5 ──► P0.6, P0.7
  │
  └──► V.1 ─► V.2 ─┬─► V.3
                   ├─► V.4
                   ├─► V.5 ─► V.6 ─┬─► V.7
                   │               ├─► V.9
                   │               └─► C.1 ─► C.2 ─► C.3
                   └─► V.8 ─► A.1 ─► A.2 ─► A.3 ─► A.4
ST.1 ─┬─► ST.2 ─► C.2
      ├─► ST.3 ─► G.5
      ├─► F.4, D.1, G.1, H.1
J.1, J.2 ─► J.3 ─► B.1 ─► B.2 ─► B.3
J.4, J.5 ─► J.6, J.7           B.1 ─► F.1 ─► F.2, F.3, D.2
                                            F.3 ─► F.4 ─► F.5
E.1 ─► E.1a                    F.1 ─► F.6
E.1, E.2 ─► E.3 ─► E.4 ─┬─► E.5
                        ├─► E.6
                        └─► E.7
E.2 ─► E.8, E.10;  E.3 + A.2 ─► E.9
L.1 ─► L.2, L.3, L.4 ─► D.4 ─► D.5, D.7
D.1 ─► D.6;  D.2 ─► D.3 ─► D.4
G.1 ─► G.2, G.3, G.4;  H.1 ─► H.2 ─► H.3 ─► H.4
A.2 ─► I.1 ─► I.2
```

Phase 3 (builder) can run in parallel with Phase 4 (AI layers) once Phase 2 is done.

---

## Merge Decision

**The visual language spec and Module C describe the same structure.** They were derived
independently — the spec from the interface's density problem, the roadmap from the product's job —
and converged.

The roadmap's Module C asks for "the value-ordered suggestions turned into an interactive workspace",
with instant re-scoring and a per-change before/after difference. The spec's spine is a numbered,
value-ordered work list where each item carries its evidence, its point value and its fix. These are
one component.

**Recommendation: merge, at `V.6`.**

- `V.6` builds `work-item.tsx` with evidence and point value.
- `C.1` adds editing and re-scoring to that same component.
- `C.2` adds the delta.

Building them separately means building the spine twice: either Module C lands on the old
eight-panel layout and is then rebuilt during the redesign, or the redesign ships read-only work
items that C must reopen one by one.

**What merging costs:** both documents place visual work last — the technical plan put "UI 2.0" at
phase 9, and the roadmap has no phase for it at all. Merging pulls that work forward. It is
defensible because the merged batch delivers Module C (a Phase 1 deliverable) rather than decoration
— but it is a sequencing change and should be recorded in `ROADMAP.md`, which describes itself as a
living document.

---

## Open Decisions

| # | Question | Blocks | Why it cannot be answered from the repo |
|---|---|---|---|
| 1 | Does atsfreeforall.com deploy through `docker-compose.yml`, building the `api` service? | **P0.3** | Git history shows Coolify work ("remove api host port binding for coolify deployment"). If the live deployment builds `api`, removing it changes the deployment. |
| 2 | Should the merge at `V.6` proceed? | V.6, C.1 | Product sequencing call. Recommendation above. |

`P0.1`, `P0.2`, `P0.4` and `P0.5` are blocked by neither and can start immediately.

---

## Current state this plan builds on

Verified in the repository, so no batch re-does it:

- `lib/scoring/` — five dimensions, pure, 25 test files in `tests/`.
- `types/analysis.ts` — `Finding` already carries `id`, `severity`, `title`, `detail`, `fix`, `cost`,
  `evidence`; `KeywordTerm` already carries `tier` (required/preferred); `DocumentLanguage` is
  already `"en" | "de" | "tr"`. The spine and Module F start from a real model.
- `lib/extract/` — browser-side PDF and DOCX extraction.
- `lib/ai/` — worker-based embeddings, WebLLM and Ollama providers, rewrite/explain/ask/tailor tasks,
  grounding checks.
- `lib/supabase/` — server-only, share links with `evidence` stripped.
- `components/score-rail.tsx` already renders a `previous` result, so before/after is partly done.

Not present, contrary to what the technical plan implies: `infra/` and `data/` are empty, and the
Python tree under `apps/api/`, `services/` and `packages/` totals 707 lines of scaffolding whose
extractors are 11 and 13 lines. The real engine is the TypeScript one.

# ATS Free For All — Masterplan

**Version:** 1.0 · 2026-10-02
**Scope:** the single plan of record for atsfreeforall.com. Product intent, design decisions and the
full batch catalogue.

This document replaces `ROADMAP.md`, `ATS_Free_For_All_TECHNICAL_PLAN.md`, and the separate workbench
spec and program plan. Those are removed from the working tree; see [Superseded documents](#superseded-documents).

---

## How to use this document

This is a **catalogue**, not a task list. It fixes *what* each batch delivers, *in what order*, and
*what counts as done*. It deliberately contains no step-by-step TDD tasks.

To implement a batch:

1. Write that batch's own task plan with `superpowers:writing-plans` into
   `docs/superpowers/plans/YYYY-MM-DD-<batch-id>-<name>.md`.
2. Execute it with `superpowers:subagent-driven-development` (for `L`-sized, multi-component
   batches) or `superpowers:executing-plans` (for `S` and `M`).
3. Tick the batch off in this document.

Writing real TDD steps for all 76 batches up front would run to hundreds of pages, and most of
phases 2–5 would be rewritten before it was reached.

**Batch sizes:** **S** = one sitting, one or two files. **M** = a day, several files or a new module
boundary. **L** = multi-day, a new subsystem or dependency, or a cross-cutting change.

---

## Contents

1. [Current state](#1-current-state)
2. [Vision](#2-vision)
3. [Immutable principles](#3-immutable-principles)
4. [Architecture](#4-architecture)
5. [Concept and visual language](#5-concept-and-visual-language)
6. [Global constraints](#6-global-constraints)
7. [Review focus](#7-review-focus)
8. [Batch catalogue](#8-batch-catalogue)
9. [Sequencing](#9-sequencing)
10. [Rejected architecture](#10-rejected-architecture)
11. [Risks](#11-risks)
12. [Success metrics](#12-success-metrics)
13. [Positioning and inspiration](#13-positioning-and-inspiration)
14. [Superseded documents](#superseded-documents)

---

## 1. Current state

### Status — 2 October 2026

**59 of 75 batches done.** Phases 0, 1 and 3 are complete in full.

| Phase | Batches | State |
|---|---|---|
| 0 — Groundwork | P0.1-P0.7, ST.1-ST.3 | Done in full. The repository holds one architecture |
| 1 — Deepen the engine | V.1-V.10, C.2-C.3, A.1-A.4, J.1-J.7 | Done |
| 2 — Semantic layer | B.1-B.3, F.1-F.5 | Started. `B.1`, `B.3` and `F.1` landed; `F.1` unblocks most of module D |
| 3 — Builder | E.1-E.10 | Done in full (`E.1a` alongside `E.1`) |
| 4 — AI layers | L.1-L.4, D.1-D.7 | `L.1`, `L.2`, `L.3`, `L.4` and `D.1` done; `D.2`-`D.7` open |
| 5 — Close the loop | G.1-G.5, H.1-H.4, I.1-I.2, F.6 | Started: `G.1`, `H.1`, `H.2`, `H.3`, `I.1` and `I.2` done; G.2-G.5, `H.4` and `F.6` open |

The gate is clean: lint, typecheck, 674 tests across 64 files, and a production build.

See `apps/web/docs/handover-2026-10-03.md` for what is open, what is blocked on what, and the
decisions already taken that constrain the batches still to come.

### What the product does today

The CV is read and scored in the browser; the file is never uploaded. The text an applicant tracking
system would extract is shown back to the user. A deterministic score out of 100 across five
dimensions:

| Dimension | Points | What it measures |
|---|---:|---|
| Parseability | 25 | Whether the text layer survives extraction: columns, tables, icon fonts, broken encodings |
| Keyword match | 25 | Coverage of terms mined from the job ad, weighted by how central each is to the posting |
| Impact | 20 | Quantified results and ownership verbs, against responsibility filler |
| Structure | 20 | Headings a parser can map to fields, dated entries in reverse order, bullets over paragraphs |
| Contact | 10 | Name, email, phone, location, profile link |

Each dimension starts at its full weight and loses points only to a named finding. Fixes are ordered
by the points they would recover. An account stores share links only.

### What exists in the code

Verified in the repository, so no batch re-does it:

- **`lib/scoring/`** — five dimensions, pure, with 25 test files under `tests/`.
- **`types/analysis.ts`** — `Finding` already carries `id`, `dimension`, `severity`, `title`,
  `detail`, `fix`, `cost`, `evidence`. `KeywordTerm` already carries `tier` (`required` /
  `preferred`). `DocumentLanguage` is already `"en" | "de" | "tr"`. The workbench spine and Module F
  start from a real model, not a greenfield.
- **`lib/extract/`** — browser-side PDF and DOCX extraction.
- **`lib/ai/`** — worker-based embeddings, WebLLM and Ollama providers, rewrite / explain / ask /
  tailor tasks, grounding checks.
- **`lib/supabase/`** — server-only, share links with `evidence` stripped.
- **`components/score-rail.tsx`** — already renders a `previous` result, so before/after is partly done.

### Problems this plan fixes

| # | Problem | Impact | Owned by |
|---|---|---|---|
| ~~S1~~ fixed | `/analyze` sat behind a login gate ([`middleware.ts`](apps/web/middleware.ts)) | A product called "free for all" demands an account to run an analysis. Loss at the very top of the funnel. | **P0.1** |
| ~~S2~~ fixed | A partially-built server architecture (FastAPI, Postgres, Redis, Ollama) contradicts the live browser-based product | Direction confusion; server-side CV processing breaks the privacy promise | **P0.2**, **P0.3** |
| ~~S3~~ fixed | The interface was English-only | A barrier for the Turkish and German-speaking target audience | **P0.5**–**P0.7**, **J.1**–**J.7** |
| ~~S4~~ fixed | The report view stacked eight equal-weight panels | The user has one question and the interface answers in ten equal voices | **V.5**–**V.8** |

---

## 2. Vision

Run the candidate's whole job-search loop in one place, without their data leaving the browser.

```
 Build a CV ──► Test it against a parser ──► Tailor it to an ad ──► Apply and track ──► Prepare to interview
     ▲                                                                                        │
     └──────────────────────────────────── feedback ◄────────────────────────────────────────┘
```

Today the product covers one step of that loop. The goal is to close the rest with the deterministic
engine at the centre, with no installation and no loss of privacy.

---

## 3. Immutable principles

Every batch is judged against these. A batch that violates one is redesigned or dropped.

1. **Only the deterministic engine produces the score.** AI explains it; it never changes it.
2. **The CV does not leave the browser by default.** Any feature that sends data out is opt-in and
   states where it goes, on every request.
3. **No invention.** No skill, experience or number the candidate does not have may be written into
   a CV. "You may need to learn AWS" is allowed; "I added your AWS experience" is not.
4. **Every lost point is explainable.** Each finding carries its source line and a concrete fix.
5. **No vendor-named scores.** Checks are heuristics drawn from common parser behaviour. No
   "Workday score".
6. **The core product works fully without AI.** The AI layers are conveniences on top.
7. **Every analysis is reproducible.** Engine, scoring config and taxonomy are versioned.

---

## 4. Architecture

### Four layers

```
┌───────────────────────────────────────────────────────────┐
│ Layer 3 — BYOK (the user's own API key)                   │  CV goes to the chosen provider
├───────────────────────────────────────────────────────────┤
│ Layer 2 — the user's local Ollama (localhost)             │  CV stays on the user's machine
├───────────────────────────────────────────────────────────┤
│ Layer 1 — in-browser model (embeddings)                   │  CV stays in the browser
├───────────────────────────────────────────────────────────┤
│ Layer 0 — deterministic engine (exists today)             │  CV stays in the browser
└───────────────────────────────────────────────────────────┘
```

| Layer | Work it does | Privacy | Cost |
|---|---|---|---|
| 0 | Parsing, scoring, keywords, format checks | In the browser | None |
| 1 | Multilingual semantic matching (`@huggingface/transformers`, small multilingual model) | In the browser | None; the model downloads once and is cached |
| 2 | Bullet rewriting, explanation, cover letters, interview questions | On the user's machine | None (their hardware) |
| 3 | The same work with stronger models | Goes to the provider the user picked | The user pays |

### Boundaries

- **`lib/scoring/` is pure.** No DOM, no network, no React, no I/O. One file per dimension.
- **`lib/extract/` is browser-only.** The server never receives a CV.
- **`lib/ai/` is browser-only and advisory.** Nothing here may feed `lib/scoring/`. Model weights
  download only after explicit consent, with size, progress and cancel shown.
- **`lib/supabase/` is server-only.** Every file starts with `import "server-only"`.
- **`lib/store/` is browser-only.** IndexedDB behind one versioned layer (**ST.1**).
- **The server holds accounts and share links only.** No CV is stored server-side.

### Layer 2 and 3 notes

- The `LLMProvider` abstraction lives in TypeScript, in the browser:

```ts
interface LLMProvider {
  readonly id: "ollama" | "byok-anthropic" | "byok-openai-compatible";
  health(): Promise<boolean>;
  chat(messages: readonly Message[], options?: ChatOptions): Promise<string>;
  structured<T>(schema: JSONSchema, input: string): Promise<T>;
}
```

- **Layer 2 setup:** the browser can only reach `http://localhost:11434` if the user adds the site to
  `OLLAMA_ORIGINS`. A one-page illustrated guide and a "test connection" button are required (**L.2**).
- **Layer 3:** the API key is held in the browser and never sent to our server. A "your CV will be
  sent to: …" notice is visible on every request (**L.3**).
- Every LLM output is validated against a JSON schema. Output that fails its schema is never shown
  to the user (**L.4**).

---

## 5. Concept and visual language

### Why a new concept

The interface was built on one metaphor — a machine reading a page — which produced a light-only,
paper-coloured, serif-led document aesthetic. That metaphor is retired. The replacement is driven by
two facts:

- **Audience.** Real job seekers fixing a real CV. Success is a stranger reaching the report without
  abandoning, understanding what to change, and changing it. Not spectacle.
- **Perception.** Business-credible and trustworthy, with the AI as the striking element.

### The concept: a workbench

The product is not a scorer. It is **a repair list ordered by value**, with a local model that drafts
the repairs. Everything serves the one question the user actually has: *what do I fix?*

### The role split

This is the spine of the system, and a visual rule rather than a theme.

Principle 1 forbids the AI from touching the score. An interface implying "the AI judged your CV"
would break both the architecture and the product's strongest claim. Generic AI shimmer would
*reduce* trust here. So the two halves are given opposite visual characters:

| | Measurement | AI |
|---|---|---|
| What it does | Says what is broken, with evidence | Fixes it for you |
| Character | Auditable, fixed, numeric | Live, generative, flowing |
| Visual language | Sharp, matte, still, mono | Light, flow, token-by-token, live surface |
| Colour | graphite + `action` blue | `live` cyan, used nowhere else |
| Motion | None (meters animate once, on first render) | Streaming, live edge, working pulse |

The memorable moment is real rather than decorative: **the model runs on the user's own machine and
the CV never leaves the browser.** That is already true of the architecture, so the one bold element
is not a lie.

### Colour

Light is the default — business credibility and long-report legibility both want it. Dark is a full
theme, not an inversion. Tokens are CSS variables as space-separated RGB channels, mapped in
`tailwind.config.ts` with the `rgb(var(--x) / <alpha-value>)` pattern.

**Light**

| Token | RGB | Hex | Role |
|---|---|---|---|
| `bed` | `243 245 248` | `#F3F5F8` | app canvas |
| `bench` | `255 255 255` | `#FFFFFF` | work surface |
| `bench-sunk` | `247 249 251` | `#F7F9FB` | recessed (extracted text, inputs) |
| `bench-raised` | `255 255 255` | `#FFFFFF` | raised; separated by border, not shadow |
| `ink` | `15 20 30` | `#0F141E` | primary text |
| `muted` | `92 102 120` | `#5C6678` | secondary text |
| `line` | `221 226 234` | `#DDE2EA` | borders, rules |
| `action` | `26 88 224` | `#1A58E0` | deterministic actions, links |
| `live` | `0 190 214` | `#00BED6` | AI — **edges, flow and glow only, never text** |
| `live-ink` | `0 110 128` | `#006E80` | AI text on light |
| `good` | `17 122 92` | `#117A5C` | measurement |
| `caution` | `166 98 10` | `#A6620A` | measurement |
| `mark` | `196 38 54` | `#C42636` | measurement |

**Dark** — a four-step graphite ladder. A near-black canvas with a single bright accent is a known
generic cluster; depth here comes from the ladder, and cyan stays confined to AI.

| Token | RGB | Hex | Role |
|---|---|---|---|
| `bed` | `18 22 29` | `#12161D` | app canvas (graphite-blue, not near-black) |
| `bench-sunk` | `22 27 35` | `#161B23` | recessed |
| `bench` | `27 32 41` | `#1B2029` | work surface |
| `bench-raised` | `35 41 52` | `#232934` | raised |
| `ink` | `232 236 243` | `#E8ECF3` | primary text |
| `muted` | `150 160 176` | `#96A0B0` | secondary text |
| `line` | `48 56 69` | `#303845` | borders, rules |
| `action` | `110 160 255` | `#6EA0FF` | deterministic actions, links |
| `live` | `34 211 238` | `#22D3EE` | AI edges and flow |
| `live-ink` | `103 224 243` | `#67E0F3` | AI text on dark (legible here, unlike light) |
| `good` | `52 199 150` | `#34C796` | measurement |
| `caution` | `226 159 56` | `#E29F38` | measurement |
| `mark` | `255 118 128` | `#FF7680` | measurement |

**Rules**

- `live` is used for nothing except AI-produced output and AI-working state. It is how the user
  learns, without being told, which parts of the screen the model wrote. **This is the system's most
  important constraint.** If it leaks into a focus ring or a highlight, the role split stops teaching
  anything and the one bold element is spent.
- Bright `live` is never applied to text on light; use `live-ink`. On dark, `live-ink` is the text variant.
- Every foreground/background pair in both themes must be verified at 4.5:1 (3:1 for text ≥24px and
  for UI boundaries). The values above are chosen to clear this, but they are claims to check, not
  measurements.
- Measurement colour never carries meaning alone — findings always state severity in words too.

### Theme mechanism

- `data-theme="light" | "dark"` on `<html>`; dark values redefined under `[data-theme="dark"]`.
- First visit follows `prefers-color-scheme`. An explicit choice persists in `localStorage`.
- A small inline script in `app/layout.tsx` sets the attribute before first paint, so the theme never
  flashes.
- `color-scheme` and `viewport.themeColor` both become theme-aware. The current hardcoded
  `themeColor: "#F6F7FA"` is wrong once dark exists.

### Typography

Two families. The serif goes entirely — it carried the retired document metaphor.

- **Instrument Sans** — interface and headings. Chosen over Inter deliberately: Inter is the default
  reach for a brief like this one. Instrument Sans carries both `wght` and `wdth` variable axes,
  which makes **width a usable tool** — condensed for dense data labels in the rail, normal for
  prose. That is an information-carrying distinction, not decoration.
- **DM Mono** — machine output only. `latin-ext` subset, three weights.

**Loading note:** the `wdth` axis exists only in the variable font. With `next/font/google`,
Instrument Sans must be requested without a fixed `weight` list and with `axes: ["wdth"]`, or the
axis is unavailable and the condensed rail treatment silently falls back to normal width. Verify this
renders before building the rail on it.

B612 Mono was considered and rejected: its cockpit-display provenance fits the product's core problem
(reading a number correctly under stress), but it ships `latin` only. Extracted CV text renders in
mono, so a Turkish CV would break on `ş ğ ı İ`.

**Mono is reserved for values the machine produced** — score numbers, extracted text, matched terms,
point values. Not for interface labels. Mono for small UI labels is a recognised generated-page tell,
and the current `.readout` class is applied that way in places (`app/r/[token]/page.tsx` sets "shared
report" in it); that use goes away.

**Scale.** Base 16px, roughly a major third.

| Role | Size | Family | Weight | Width | Tracking |
|---|---|---|---|---|---|
| display | `clamp(2.25rem, 5vw, 3rem)` | sans | 600 | 95 | -0.03em |
| h1 | 2rem | sans | 600 | 100 | -0.025em |
| h2 | 1.5rem | sans | 600 | 100 | -0.02em |
| h3 | 1.1875rem | sans | 600 | 100 | -0.015em |
| body | 1rem / 1.55 | sans | 400 | 100 | 0 |
| small | 0.875rem / 1.55 | sans | 400 | 100 | 0 |
| micro | 0.8125rem | sans | 500 | 92 | 0 |
| readout | 0.8125rem | mono | 400 | — | 0 |
| score | `clamp(3.5rem, 8vw, 5rem)` | mono | 500 | — | -0.02em |

Body measure stays under 80 characters; the existing `max-w-measure` (68ch) is kept. No text below
13px. Numeric readouts use `tabular-nums`.

### Surfaces

The concept is a bench, not paper, so the single-shadow `.sheet` rule is replaced.

- **`.bench`** — flat surface, 1px `line` border, a 1px top inner highlight. Depth comes from the
  surface ladder and border weight, not shadow blur. Identical rounded cards sharing one radius and
  one soft grey shadow is the generic SaaS-card pattern; this avoids it.
- Radius keeps encoding scale rather than being one value: `surface` 10px, `control` 6px, `chip` 3px.
- **`.live`** — the one exception and the one bold element: an animated `live`-toned gradient edge,
  used only while a model is generating. The system's only glow, only light, only ambient motion.
- Spacing scale is 4-based: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96.

### Motion

One orchestrated moment, not scattered effects.

- Measurement does not move. Numbers settle; meters animate width once on first render, never again.
- AI flows: token-by-token output, a working pulse, the live edge.
- Per-section fade-and-slide-up entrances and hover transitions on every card are **out**. They read
  as generated.
- `prefers-reduced-motion: reduce` removes the live edge animation and the streaming effect (text
  still appears, in complete chunks) and disables meter animation.

### The report architecture

Eight panels become **one spine, one rail, one dock**.

```
┌─────────────────────────────────────────────┬──────────────────────┐
│ SPINE — the workbench                       │ RAIL (sticky)        │
│                                             │                      │
│ 1  No phone number                     +6   │   64 / 100           │
│    evidence line from the document          │   ▸ 83 once fixed    │
│    [ Draft a fix ]                          │                      │
│                                             │   parseability 18/25 │
│ 2  Two columns break the text layer    +8   │   keywords    12/25  │
│    evidence line from the document          │   impact      14/20  │
│    [ Draft a fix ]                          │   structure   15/20  │
│                                             │   contact      5/10  │
│ 3  "Kubernetes" never appears          +5   │                      │
│    ╔══ live edge, cyan ══════════════╗      │   ─────────────      │
│    ║ local model writing…            ║      │   key terms          │
│    ║ "Led 7 engineers; cut rele█"    ║      │   extracted text     │
│    ╚═════════════════════════════════╝      │   AI status          │
│    [ Apply ]  [ Discard ]                   │                      │
└─────────────────────────────────────────────┴──────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│ DOCK — ask about this report                                       │
└────────────────────────────────────────────────────────────────────┘
```

- **Spine** (dominant column). The value-ordered work list. Each item: what is broken, the evidence
  line, a point value, the AI's draft fix in place, and inline editing. `RewriteDiff` and `FixDrafts`
  stop being panels and become actions inside a work item. The user does not read; they apply.
  Numbering is kept here because the content genuinely is a sequence — a value-ordered priority. It
  is not justified anywhere else in the product.
- **Rail** (sticky, secondary). The measurement instrument: total, dimensions, deltas. Below it, key
  terms (with `CoverageMap` folded into `KeywordPanel`), the extracted text, AI status and consent.
  Set in condensed width — this is where the `wdth` axis earns its place.
- **Dock** (persistent). `ReportChat` stops being a panel in the stack and becomes an
  always-reachable strip.

**AI behaviour in a work item.** Drafts are generated **on request, in place**. An item renders with
its evidence; the user asks for a fix and the model streams a draft into the item. This keeps first
render fast, avoids forcing a model download, respects the consent contract, and does not burn
battery generating drafts for findings the user never opens.

### Written content

- Plain verbs, sentence case, active voice. No ALL-CAPS tracked eyebrow labels anywhere.
- Meta strings joined with middle dots are a recognised tell. The current
  `` `${words} words · ${lines} lines · ${language}` `` caption in `components/analyzer.tsx` is
  restructured into discrete labelled values.
- An action keeps its name through the flow: a button reading "Apply fix" produces a state saying
  "Fix applied".
- Errors state what happened and how to fix it. They do not apologise and are never vague.
- Empty states invite an action rather than setting a mood.
- The interface never claims to predict hiring outcomes and never claims to replicate a named
  vendor's parser. No emojis.

---

## 6. Global constraints

Every batch inherits these.

- `lib/scoring/` is pure: no DOM, no network, no React, no I/O. One file per dimension.
- **The score comes only from the deterministic engine.** AI output may never be an input to it.
- **A dimension's score is `max - sum(cost of its findings)`, clamped to `[0, max]`.** Adding a
  deduction means adding a `FindingDraft` with a `cost`. Never adjust a score directly.
  `tests/scoring.test.ts` asserts this, and the report's claim that every lost point is explained
  depends on it.
- When adding a check: namespace the `id` by dimension (`parse.columns`); keep `title` a statement of
  the defect, `detail` the evidence, `fix` a concrete instruction; add a fixture that triggers it and
  one that does not; if a new cost pushes a dimension's realistic floor to zero, rebalance existing
  costs rather than letting one check dominate.
- Persistence is optional everywhere. If `getSupabaseEnv()` returns `null`, callers degrade quietly
  and never throw.
- Share links persist scores and findings with `evidence` stripped, because evidence can contain
  lines lifted from the document.
- **Interface language:** English is primary. Turkish and German are added translations.
- TypeScript strict with `noUncheckedIndexedAccess`. No `any`. `interface` for object shapes, `type`
  for unions, `readonly` on result and props types.
- Named function exports for components; `export default` only for `app/` pages. Server components by
  default; `"use client"` only where state or events require it.
- Tailwind utilities only. kebab-case file names, PascalCase components, `@/` alias for all internal
  imports. Import groups: external, `@/`, relative, separated by blank lines.
- No comments that restate the code. Comments explain a decision or a non-obvious constraint.
- **`npm run lint` (`--max-warnings=0`), `npm run typecheck` and `npm test` clean after every batch.**

---

## 7. Review focus

Failure modes this plan implies but which no single module owns. Each gets its test in the batch
named here.

1. **Turkish and German characters end to end.** `ş ğ ı İ ö ü ç ä ß` must survive extraction →
   scoring → keyword matching → PDF export → re-import. A CV that scores well in English and badly in
   Turkish purely because of glyph handling is the most likely real failure. → tests in **J.4** and
   **E.7**.
2. **Reports saved by the old UI, rendered by the new one.** `/r/[token]` loads persisted reports;
   fields added later will be absent on old rows. → tests in **V.9**.
3. **Documents far outside the expected size.** A 20-page CV, a 15,000-word job ad, a CV pasted as
   one line. The spine promises re-scoring under 300 ms. → tests in **V.6**.
4. **Every AI path unavailable.** Consent declined, WebGPU missing, Ollama offline or blocking the
   origin, BYOK key rejected, model download cancelled mid-way. Every AI surface must degrade to the
   deterministic product rather than block it. → tests in **L.2** and **L.4**.
5. **Storage refused or full.** Private browsing, IndexedDB blocked, quota exceeded. Modules C, D, E
   and G all persist locally; none may lose the user's work silently. → tests in **ST.1**.

---

## 8. Batch catalogue

76 batches. Order within a phase follows the dependency column.

### Phase 0 — Groundwork

Opens the funnel and lays the ground the rest needs. No new product surface. Nothing blocks these.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**P0.1**~~ ✅ | **Remove the login gate.** Drop the `/analyze` protection block in [`middleware.ts`](apps/web/middleware.ts), keeping `updateSession`. Sign-in becomes required only for saving and sharing. Align the landing copy. | S | — | `/analyze` reachable signed out and a full analysis runs; sharing still asks for sign-in |
| ~~**P0.2**~~ ✅ | **Delete the dead analyze proxy.** Remove `app/api/analyze/route.ts`. Nothing references it, but it is a live endpoint that forwards a request body to a server backend, contradicting principle 2. | S | — | Route gone; no reference to `API_URL` remains in `apps/web` |
| ~~**P0.3**~~ ✅ | **Retire the rejected server tree.** Delete `apps/api/`, `services/`, `packages/`, and the empty `infra/` and `data/`. Reduce `docker-compose.yml` to the `web` service, dropping `api`, `db`, `redis`, their volumes, and the `depends_on`/`API_URL` wiring on `web`. The deployment does currently build `api`, but the site has no users yet, so no staged rollout is needed. | M | P0.2 | `docker compose up` builds and serves the web app alone; the repository holds one architecture |
| ~~**P0.4**~~ ✅ | **Before/after score across visits.** Complete the partly-built comparison: `score-rail.tsx` already renders a `previous` result; wire it to stored history. | S | ST.2 | A second visit shows the previous score |
| ~~**P0.5**~~ ✅ | **i18n infrastructure.** Add `next-intl`. English as default locale, locale routing, a language switcher. No translation in this batch — it only moves existing strings into message catalogs. | M | — | Every user-facing string in `app/` and `components/` resolves through the catalog; English output byte-identical to today |
| ~~**P0.6**~~ ✅ | **Turkish translation.** | M | P0.5 | Full UI in Turkish; no untranslated keys |
| ~~**P0.7**~~ ✅ | **German translation.** | M | P0.5 | Full UI in German; no untranslated keys |

> **Phase 1 note.** `V.1`-`V.10` and `J.1`-`J.7` are done. `V.1` and `V.2` landed
> as one commit: `V.1` removes the classes `V.2` deletes, so splitting them meant one
> commit where every surface referenced a class that no longer existed. `C.2`, `C.3`
> and `A.1`-`A.4` remain.

<!-- -->

> **P0.5 must land before the `V` batches.** The redesign writes a large amount of new UI copy;
> writing it outside the catalog means extracting it all a second time.

<!-- -->

> **Decision taken during P0.5 — the engine's own wording stays English.** Findings, dimension
> labels and band names are composed in `lib/scoring/`. Translating them means giving that layer a
> locale, which it is forbidden to have, or moving every sentence out of it and leaving the
> dimension files as bare costs. Neither belongs inside an interface-translation batch. The
> interface is translated; the engine's wording is a separate batch, and `J.1`–`J.7` are the right
> place to decide it, since they already change how the engine reads other languages.
> `tests/messages.test.ts` enforces catalog parity: every locale carries the English key set, no
> value still equals the English, and ICU placeholders survive translation.

### Store — `lib/store/`

Part of Phase 0. Built once; modules C, D, E, F and G all depend on it, and so does `P0.4`.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**ST.1**~~ ✅ | **IndexedDB wrapper.** Versioned schema, migration scaffold, typed records. Handles refusal and quota exhaustion by surfacing the failure, never by silently dropping data. Owns review focus 5. | M | — | Works in private browsing or reports clearly that it cannot; the quota-exceeded path is tested |
| ~~**ST.2**~~ ✅ | **Analysis history.** The last N analyses per browser: total, dimension scores, timestamp. No CV text. | S | ST.1 | History survives reload |
| ~~**ST.3**~~ ✅ | **Data controls.** One-click wipe of everything stored locally, with a count of what will go. | S | ST.1 | Wipe clears all stores; the UI confirms what went |

### Visual language — the workbench

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**V.1**~~ ✅ | **Tokens, fonts, themes.** CSS variables for both themes, `tailwind.config.ts`, Instrument Sans + DM Mono via `next/font/google` with `axes: ["wdth"]`, the `data-theme` mechanism, the pre-paint theme script, theme-aware `viewport.themeColor`, and `components/theme-toggle.tsx`. | M | P0.5 | Both themes render; no flash on load; the `wdth` axis is demonstrably applied |
| ~~**V.2**~~ ✅ | **Surface primitives.** `.bench` and `.live`; remove `.sheet`, `.ruler` and `.scan-*`. Update `barTone` in `lib/ui.ts`. | S | V.1 | No component references a removed class |
| ~~**V.3**~~ ✅ | **Landing reset.** Delete `parse-sweep.tsx`; new `bench-preview.tsx` hero showing real ordered findings with point values. Weights section reset. | M | V.2 | The hero communicates the product without animation; reduced-motion clean |
| ~~**V.4**~~ ✅ | **Analyze input view reset.** The CV and job-ad surfaces in the new system. | S | V.2 | Function unchanged, new system |
| ~~**V.5**~~ ✅ | **`bench/measure-rail.tsx`.** `score-rail.tsx` becomes the sticky instrument, in condensed width. Meters animate once on first render only. | M | V.2 | Deltas still shown; no motion on re-render |
| ~~**V.6**~~ ✅ | **`bench/work-list.tsx` + `bench/work-item.tsx`.** The spine: numbered, value-ordered findings with evidence and point value, **and** in-place editing with instant re-scoring. Module C's core is built here rather than bolted on later. Owns review focus 3. | L | V.2, V.5 | Eight panels reduced to spine + rail; every finding reachable and editable; re-score under 300 ms on a mid-range laptop for a realistic CV |
| ~~**V.7**~~ ✅ | **`bench/ask-dock.tsx`.** `report-chat.tsx` becomes a persistent strip. | M | V.6 | Reachable from anywhere in the report |
| ~~**V.8**~~ ✅ | **Keyword panel and coverage fold-in.** `coverage-map.tsx` absorbed into `keyword-panel.tsx`. | M | V.2 | One panel, both reports |
| ~~**V.9**~~ ✅ | **Remaining surfaces.** `/r/[token]` (read-only spine, no AI, no dock), `/login`, `not-found`, `coming-soon`. Owns review focus 2. | M | V.6 | A report saved by the old UI renders |
| ~~**V.10**~~ ✅ | **Quality pass.** Contrast verified at 4.5:1 in both themes, keyboard focus visible, touch targets ≥44px, `prefers-reduced-motion`, mobile single-column collapse, no horizontal scroll. Confirms `live` cyan appears nowhere outside AI surfaces. | M | V.3–V.9 | Every item verified with evidence |

### Module C — Fix mode

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~C.1~~ | **Merged into `V.6`.** Inline editing and instant re-scoring are built with the work item, not added to it. | — | — | See `V.6` |
| ~~**C.2**~~ OK | **Per-change delta.** "+4 · Keyword match", naming which finding closed. | S | V.6, ST.2 | Every score change attributable to a finding |
| ~~**C.3**~~ OK | **Session score history.** A plot of the score across the session. | M | C.2, ST.2 | Survives reload |

### Module A — Parse view 2.0

Answers the question candidates ask most: did the parser read my title and dates correctly?

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**A.1**~~ OK | **Identity field table.** Name, email, phone, location, links, from the existing `lib/scoring/contact.ts` context. | M | V.8 | Each field shows found / suspect / missing |
| ~~**A.2**~~ OK | **Experience entries table.** Title, company and date range per entry; education, skills, languages. | M | A.1 | Entries listed as the parser sees them |
| ~~**A.3**~~ OK | **Reasons for suspect and missing.** A readable cause, e.g. "the date range looks split across two columns". | M | A.2 | Every non-found field carries a reason |
| ~~**A.4**~~ OK | **Field to source-line highlighting.** Clicking a field marks its line in the raw text. | M | A.3 | Works on desktop and mobile |

### Module J — Localization engine

Fills a real gap in the open-source field. `DocumentLanguage` is already `"en" | "de" | "tr"`, so
this extends rather than introduces.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**J.1**~~ ✅ | **Turkish stemming.** Snowball Turkish stemmer in keyword matching, plus locale-correct `ı/i` and `İ/I` casing, with domain rules on top. | M | — | Turkish keyword match rate comparable to English on the test set |
| ~~**J.2**~~ ✅ | **German compound splitting.** Dictionary-based splitter: "Softwareentwicklung" → "Software" + "Entwicklung". | M | — | German keyword match rate comparable to English |
| ~~**J.3**~~ ✅ | **Per-language stopwords.** Extends `lib/scoring/stopwords.ts`. | S | J.1, J.2 | Stopwords no longer inflate coverage in TR/DE |
| ~~**J.4**~~ ✅ | **Encoding corruption check.** Garbled `ı İ ş ğ ç ö ü ä ß` reported as a Parseability finding. Owns review focus 1 for input. | M | — | Corrupted test PDFs detected; clean ones not flagged |
| ~~**J.5**~~ ✅ | **Date formats.** "Oca 2022", "Ocak 2022", "01.2022", "Jan. 2022", "März 2022", "heute", "halen", "devam ediyor". | M | — | The Structure dimension reads TR/DE dates |
| ~~**J.6**~~ ✅ | **Market-based advice.** Photo, date of birth, marital status, military service, by target market. | S | J.5 | Advice differs by selected market |
| ~~**J.7**~~ ✅ | **Europass detection.** | S | J.5 | Europass layouts recognised and warned about |

### Module B — ATS profiles (matching modes)

Shows the candidate concretely that real systems behave differently. Layer 1 partly exists:
`@huggingface/transformers` is a dependency, and `lib/ai/embeddings.ts` and `semantic-match.ts` are
in place.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**B.1**~~ ✅ | **Three matching modes.** Strict (literal), normalized (synonyms, abbreviations, taxonomy), semantic (Layer 1 embeddings). One engine, three modes. | L | J.3 | The same CV and ad produce consistently different, explainable results; semantic runs entirely in the browser |
| **B.2** | **Mode comparison summary.** "61 strict, 78 semantic. The difference comes from these 4 terms." | M | B.1 | The difference is attributable to named terms |
| **B.3** | **Semantic labelling.** Semantic hits presented as "possible match", never as a confirmed skill. No vendor names on profile cards. | S | B.2 | No semantic hit is presented as certain |

### Module F — Job ad analyser

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**F.1**~~ ✅ | **Ad parsing.** Required skills, preferred skills, seniority, language requirement, location/remote, salary if present. `KeywordTerm.tier` already carries required/preferred. | L | B.1 | The required/preferred split is reasonable on the test ad set |
| **F.2** | **Red flags.** Over-long skill lists, a years requirement contradicting the seniority, vague role definition. | M | F.1 | Each flag names its evidence |
| **F.3** | **Deterministic eligibility checklist.** | M | F.1 | No AI involved |
| **F.4** | **Multi-ad comparison.** 5–10 ads, best fit. | L | F.3, ST.1 | Ten ads compared in-browser |
| **F.5** | **Learning priority list.** The skills most often missing across the target role. | M | F.4 | Ordered by frequency across stored ads |
| **F.6** | **Ghost posting check.** Greenhouse / Lever / Ashby public job-board APIs via a server proxy. Carries no CV data, so principle 2 holds. | L | F.1 | The proxy carries no candidate data |

### Module E — ATS-safe CV builder

The largest module and the strongest differentiator: the only open tool that guarantees every CV it
produces can be read by a parser.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**E.1**~~ OK | **PDF infrastructure.** `@react-pdf/renderer` with embedded fonts covering Turkish and German glyphs. Chosen because it gives a controlled text layer — the closed-loop guarantee depends on us, not the browser, deciding how text is written. | L | — | A probe document round-trips through `lib/extract/` with glyphs intact |
| ~~**E.1a**~~ OK | **Analysis report as PDF.** Client-side, on top of E.1. | S | E.1 | The report downloads as a PDF |
| ~~**E.2**~~ OK | **Canonical resume model.** JSON Resume schema, zod-validated. Chosen for its import/export ecosystem. | M | — | The schema validates the fixture set |
| ~~**E.3**~~ OK | **Editor form.** | L | E.2 | Every schema field editable |
| ~~**E.4**~~ ✅ | **Template: dense.** Single column, standard headings. | M | E.1, E.3 | Renders the fixture resume |
| ~~**E.5**~~ ✅ | **Template: plain.** | M | E.4 | Renders the fixture resume |
| ~~**E.6**~~ ✅ | **Template: modern.** | M | E.4 | Renders the fixture resume |
| ~~**E.7**~~ ✅ | **Closed-loop validation.** Every export runs through our own parser and the result is shown to the user. A CI regression test asserts all templates score Parseability 25/25, including Turkish and German fixtures. Owns review focus 1 for export. | L | E.4–E.6 | CI fails if any template drops below full marks |
| ~~**E.8**~~ OK | **DOCX export.** | L | E.2 | Opens correctly in Word and LibreOffice |
| ~~**E.9**~~ ✅ | **Import an existing CV.** Parse PDF/DOCX into the editor; mark fields that could not be extracted for manual completion. | L | E.3, A.2 | Unextractable fields are flagged, never invented |
| ~~**E.10**~~ OK | **JSON Resume import and export.** | S | E.2 | Round-trips without loss |

### AI layers

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**L.1**~~ OK | **`LLMProvider` in TypeScript.** `id`, `health()`, `chat()`, `structured<T>()`. Partly exists under `lib/ai/providers/`. | M | — | Swapping provider changes no scoring behaviour |
| **L.2** | **Layer 2 — the user's own Ollama.** An `OLLAMA_ORIGINS` setup guide, a "test connection" button, clear failure messages. Owns review focus 4. | M | L.1 | Every failure mode produces a usable message, never a blocked UI |
| **L.3** | **Layer 3 — BYOK.** The key is held in the browser only and never sent to our server. A visible "your CV will be sent to: …" notice on every request. | M | L.1 | The key never leaves the browser; the notice appears on every call |
| ~~**L.4**~~ OK | **Schema validation of all LLM output.** Output failing its schema is never shown. Owns the rest of review focus 4. | M | L.1 | Malformed output is rejected and the user told plainly |

### Module D — Tailoring workshop

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**D.1**~~ OK | **CV variants.** Each variant bound to one ad and derived from the master CV, stored in IndexedDB. | L | ST.1, E.2 | Variants persist across reloads |
| **D.2** | **Missing-term cards.** Where the term appears in the ad, how central it is, and where it would go in the CV. | M | F.1 | Each card cites the ad |
| **D.3** | **"I have this skill" gate.** No term enters a CV without confirmation, enforced by an automated test. | M | D.2 | A test proves an unconfirmed skill cannot be added |
| **D.4** | **Bullet rewriting.** Rephrases existing bullets only. No invented numbers; placeholders (`[X%]`, `[N people]`) where a measurable result is missing. Builds on `lib/ai/tasks/rewrite.ts` and `grounding.ts`. | L | L.4, D.3 | Output containing a number or organisation absent from the input is rejected |
| **D.5** | **Per-bullet diff accept/reject.** | M | D.4 | Each change independently acceptable |
| **D.6** | **Variant comparison.** Master score against tailored variant score. | M | D.1 | Both scores shown together |
| **D.7** | **Cover letter helper.** Same guardrails as D.4. | M | D.4 | No invented claims |

### Module G — Application tracker

The reason candidates come back; the module that closes the loop. Local-only in this pass.

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**G.1**~~ OK | **Kanban.** Saved → Applied → Interview → Offer/Rejected. | L | ST.1 | Fully usable without an account |
| **G.2** | **Card links.** The ad, the CV variant used, the score at the time of applying, notes, contacts. | M | G.1, D.1 | Each card resolves its linked records |
| **G.3** | **Follow-up reminders.** e.g. "no reply for 7 days". | M | G.1 | Reminders computed locally |
| **G.4** | **CSV and JSON export.** | S | G.1 | Round-trips |
| **G.5** | **One-click deletion.** | S | G.1, ST.3 | Removes everything, locally |

> Encrypted server sync is deliberately **not** in this pass: a large security surface, a key
> recovery problem (a forgotten password means lost data), and data-protection obligations. It gets
> its own spec later.

### Module H — Interview preparation

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**H.1**~~ ✅ | **STAR story bank.** Situation / Task / Action / Result cards built from CV achievement bullets. | L | ST.1 | Usable with every AI layer off |
| ~~**H.2**~~ ✅ | **Template questions.** Common questions mapped to story cards. | M | H.1 | No AI required |
| ~~**H.3**~~ OK | **Ad-specific questions.** Layer 2/3. | M | H.2, L.4 | Generated questions cite terms from the ad |
| **H.4** | **Practice mode.** The question is shown, the candidate writes an answer, a relevant story card is suggested. | M | H.3 | The suggestion is traceable to a card |

### Module I — LinkedIn consistency check

| ID | Batch | Size | Depends on | Acceptance |
|---|---|---|---|---|
| ~~**I.1**~~ ✅ | **Parse the LinkedIn "Save as PDF" export.** No scraping, so no terms-of-service risk. | M | A.2 | The export is parsed correctly |
| ~~**I.2**~~ ✅ | **Inconsistency report.** Date mismatches, differing titles, skills in the CV but not the profile, headline against target role. | M | I.1 | Each inconsistency cites both sources |

---

## 9. Sequencing

| Phase | Estimate | Batches | Why here |
|---|---|---|---|
| **0 — Groundwork** | 2–3 weeks | P0.1–P0.7, ST.1–ST.3 | Opens the funnel and lays the ground the rest needs. The store belongs here: five modules depend on it, and `P0.4` already does |
| **1 — Deepen the engine** | 5–7 weeks | V.1–V.10, C.2–C.3, A.1–A.4, J.1–J.7 | Multiplies the existing strength and needs no AI. Contains the visual language merged with Module C |
| **2 — Semantic layer** | 2–3 weeks | B.1–B.3, F.1–F.5 | Stays in the browser; separates the product from alternatives |
| **3 — Builder** | 4–6 weeks | E.1–E.10 | The largest user value and the reason to return |
| **4 — AI layers** | 3–4 weeks | L.1–L.4, D.1–D.7 | Added safely once the deterministic base is in place |
| **5 — Close the loop** | 4–5 weeks | G.1–G.5, H.1–H.4, I.1–I.2, F.6 | Builds a lasting habit |

Phase 3 can run in parallel with Phase 4 once Phase 2 is done.

> **Note on sequencing.** The superseded documents placed visual work last — the technical plan put
> "UI 2.0" at phase 9, and the roadmap had no phase for it at all. This plan pulls it into Phase 1.
> That is defensible because the merged `V.6` delivers Module C, a Phase 1 deliverable, rather than
> decoration: the visual language spine and Module C's interactive workspace are the same component,
> and building them separately would build it twice.

### Dependency graph

```
P0.1 ─┐
P0.2 ─┴─► P0.3
P0.5 ──► P0.6, P0.7
  │
  └──► V.1 ─► V.2 ─┬─► V.3
                   ├─► V.4
                   ├─► V.5 ─► V.6 ─┬─► V.7
                   │               ├─► V.9
                   │               └─► C.2 ─► C.3
                   └─► V.8 ─► A.1 ─► A.2 ─► A.3 ─► A.4
ST.1 ─┬─► ST.2 ─► P0.4, C.2
      ├─► ST.3 ─► G.5
      └─► F.4, D.1, G.1, H.1
J.1, J.2 ─► J.3 ─► B.1 ─┬─► B.2 ─► B.3
J.4                     └─► F.1 ─┬─► F.2, F.3, F.6, D.2
J.5 ─► J.6, J.7                  └─► F.3 ─► F.4 ─► F.5
E.1 ─► E.1a
E.1, E.2 ─► E.3 ─► E.4 ─┬─► E.5
                        ├─► E.6
                        └─► E.7
E.2 ─► E.8, E.10;   E.3 + A.2 ─► E.9
L.1 ─┬─► L.2, L.3
     └─► L.4 ─► D.4 ─► D.5, D.7
D.1 ─► D.6;   D.2 ─► D.3 ─► D.4
G.1 ─► G.2, G.3, G.4;   H.1 ─► H.2 ─► H.3 ─► H.4
A.2 ─► I.1 ─► I.2
```

---

## 10. Rejected architecture

A server architecture was designed and partially built: FastAPI, PostgreSQL with pgvector, Redis
workers, server-side Ollama with `gpt-oss-20b`, and a nine-component score. It is rejected.

**Why.** Processing a CV on a server breaks principle 2 and the promise printed on the front page.
The browser-first architecture is the product's main differentiator, not an implementation detail.

**What exists of it.** `apps/api/`, `services/` and `packages/` total 707 lines across 21 source
files; the PDF and DOCX extractors are 13 and 11 lines. `infra/` and `data/` are empty. The real
engine is the TypeScript one in `lib/scoring/`, with 25 test files. The one live caller was
`app/api/analyze/route.ts`, which nothing in the app referenced. **P0.2** and **P0.3** remove all of it.

**What was kept.** Its sound ideas survive here: the deterministic-score-versus-AI split
(principle 1), explainability (principle 4), the agent guardrails (principle 3), versioning
(principle 7), and the provider abstraction (`LLMProvider`, **L.1**).

**Where the server remains legitimate.** Accounts, share links, encrypted sync (deferred), and work
that contains no CV — the job-board proxy in **F.6**.

An enterprise or self-hosted variant can revisit the server design later; it would need its own spec.

---

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| AI influencing the score | Loss of trust. LLM scorers are known to give the same CV widely different marks | The score comes only from the deterministic engine; AI output cannot be an input (architecture rule plus test) |
| Invented content | Pushing a candidate to apply with skills they do not have; reputational damage | The "I have this skill" gate, placeholders, input-versus-output validation (**D.3**, **D.4**) |
| Erosion of the privacy promise | Loss of the product's main differentiator | A "where does this data go?" check on every new feature; no feature sends a CV to a server |
| In-browser model performance | Slow on low-end hardware | Layer 1 is optional, the model is cached, work runs in a Web Worker |
| `live` cyan leaking out of AI surfaces | The role split stops teaching anything and the one bold element is spent | Verified in **V.10**; worth a standing review check |
| Dark theme drifting to near-black plus one accent | Lands in a recognised generic cluster | The four-step graphite ladder must survive implementation; verified in **V.10** |
| `work-item.tsx` growing too large | Four absorbed panels in one component | Internal boundaries — evidence, draft, actions as separate units |
| Licence violation | Legal risk | No code copied from the inspiration projects; if any is, its licence is checked first, especially AGPL |
| Scraping | Terms-of-service violation | LinkedIn and job boards are never scraped; only official public APIs and user uploads |
| Scope creep | Nothing finishes | Phases in order; each phase ships value on its own; batches are independently shippable |

---

## 12. Success metrics

Privacy comes first, so **content is never tracked**. Only anonymous event counts (for example
"analysis completed", "fix accepted"). No CV text, ad text or personal data enters an analytics event.

| Metric | Definition | Target |
|---|---|---|
| Analysis start rate | Landing visits that become an analysis | Marked rise after Phase 0 |
| Average score gain | First-to-last score difference in fix mode | Measured from Phase 1 |
| Return rate | A second analysis from the same browser within 7 days | Rise after Phases 3 and 5 |
| Closed-loop pass rate | Exported CVs scoring full Parseability | 100%, protected by a CI regression test |
| AI layer usage | Sessions enabling Layer 2 or 3 | Informational; the product must not depend on it |

---

## 13. Positioning and inspiration

| Tool | Strength | Gap |
|---|---|---|
| Reactive Resume | Comprehensive CV builder | No parse testing |
| OpenResume | In-browser parser | No ad-based tailoring |
| Resume-Matcher | Matching and tailoring | Needs Docker and technical setup |
| career-ops | End-to-end agent flow | Needs a terminal and a coding CLI |
| **ATS Free For All** | **Deterministic, explainable, in-browser, no installation** | Currently one step of the loop |

**Ideas** are taken from these projects; **code is not copied.** If any is, its licence must be
checked first.

| Project | Licence | Informs |
|---|---|---|
| [OpenResume](https://github.com/xitanggg/open-resume) | AGPL-3.0 | A, E |
| [ats-screener](https://github.com/sunnypatell/ats-screener) | MIT | B |
| [Resume-Matcher](https://github.com/srbhr/Resume-Matcher) | Apache-2.0 | D |
| [career-ops](https://github.com/career-ops-hq/career-ops) | MIT | D, F, H |
| [Reactive Resume](https://github.com/reactive-resume/reactive-resume) | MIT | E |
| [RenderCV](https://github.com/rendercv/rendercv) | MIT | E |
| [Jake's Resume](https://github.com/jakegut/resume) | MIT | E (template design) |
| [JSON Resume](https://github.com/jsonresume/jsonresume.org) | MIT | E (data model) |
| [JobSync](https://github.com/Gsync/jobsync) | MIT | G |
| [tech-interview-handbook](https://github.com/yangshun/tech-interview-handbook) | — | H |

AGPL-3.0 on OpenResume deserves particular care: reading it for ideas is fine, lifting code from it
is not.

---

## Superseded documents

Absorbed into this plan and removed from the working tree. Retrievable from git history.

| Document | Absorbed into | Retrieve with |
|---|---|---|
| `ROADMAP.md` | Sections 1–3, 8, 9, 11–13 | `git show dc444ce:ROADMAP.md` |
| `ATS_Free_For_All_TECHNICAL_PLAN.md` | Sections 3, 4, 10 | `git show dc444ce:ATS_Free_For_All_TECHNICAL_PLAN.md` |
| `docs/superpowers/specs/2026-10-02-workbench-visual-language-design.md` | Section 5 | `git show dc444ce:docs/superpowers/specs/2026-10-02-workbench-visual-language-design.md` |
| `docs/superpowers/plans/2026-10-02-roadmap-program-plan.md` | Sections 6–9 | `git show dc444ce:docs/superpowers/plans/2026-10-02-roadmap-program-plan.md` |

`ROADMAP.md` was untracked until `dc444ce`, which exists only to put it in history before this plan
replaced it.

This is a living document. Update it at the end of each phase with what the metrics and user feedback
show.

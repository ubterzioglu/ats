# Workbench: a new visual language for ats readability

Date: 2026-10-02
Status: approved design, pending implementation plan

## Why this exists

The product scores how readable a CV is to an applicant tracking system and lists the fixes in
order of value. The current interface is built on one metaphor — a machine reading a page — which
produced a light-only, paper-coloured, serif-led document aesthetic.

That metaphor is being retired. This document defines the concept and the system that replace it.

Two things drive every decision here:

- **Audience.** Real job seekers using the tool to fix a real CV. Success is a stranger reaching the
  report without abandoning, understanding what to change, and changing it. Not spectacle.
- **Perception.** The product must read as business-credible and trustworthy, while the AI is the
  striking element.

## The concept: a workbench

The product is not a scorer. It is **a repair list ordered by value**, with a local model that drafts
the repairs for you.

Everything in the interface serves one question the user actually has: *what do I fix?*

### The role split

This is the spine of the whole system. It is a visual rule, not a theme.

`AGENTS.md` requires that `lib/ai/` stay advisory and never feed `lib/scoring/`. The score is
deterministic and fully accountable — every lost point names the finding that took it. An interface
implying "the AI judged your CV" would break both the architecture contract and the product's
strongest claim. Generic AI shimmer would *reduce* trust here.

So the two halves of the product are given opposite visual characters:

| | Measurement | AI |
|---|---|---|
| What it does | Says what is broken, with evidence | Fixes it for you |
| Character | Auditable, fixed, numeric | Live, generative, flowing |
| Visual language | Sharp, matte, still, mono | Light, flow, token-by-token, live surface |
| Colour | graphite + `action` blue | `live` cyan, used nowhere else |
| Motion | None (bars animate once on first render) | Streaming, live edge, working pulse |

The memorable moment is real rather than decorative: **the model runs on the user's own machine and
the CV never leaves the browser.** That claim is already true of the architecture, so the one bold
element in the design is not a lie.

## Design system

### Colour

Light is the default — business credibility and long-report legibility both want it. Dark is a full
theme, not an inversion.

Tokens are CSS variables in `app/globals.css` as space-separated RGB channels, mapped in
`tailwind.config.ts` with the existing `rgb(var(--x) / <alpha-value>)` pattern.

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
  learns, without being told, which parts of the screen the model wrote. This rule is the system's
  single most important constraint.
- Bright `live` is never applied to text on light; use `live-ink`. On dark, `live-ink` is the text
  variant.
- Every foreground/background pair in both themes must be verified at 4.5:1 (3:1 for text ≥24px and
  for UI boundaries) during implementation. Values above are chosen to clear this, but they are
  claims to be checked, not measurements.
- Measurement colour never carries meaning alone — findings always state severity in words too.

### Theme mechanism

- `data-theme="light" | "dark"` on `<html>`; dark values redefined under `[data-theme="dark"]`.
- First visit follows `prefers-color-scheme`. An explicit choice persists in `localStorage`.
- A small inline script in `app/layout.tsx` sets the attribute before first paint so the theme never
  flashes.
- `color-scheme` and the `viewport.themeColor` in `app/layout.tsx` both become theme-aware. The
  current hardcoded `themeColor: "#F6F7FA"` is wrong once dark exists.
- A `ThemeToggle` component lives in the page header.

### Typography

Two families. The serif is removed entirely — it carried the retired document metaphor.

- **Instrument Sans** — interface and headings. Chosen over Inter deliberately: Inter is the default
  reach for any brief like this one. Instrument Sans carries both `wght` and `wdth` variable axes,
  which makes **width a usable tool**: condensed for dense data labels in the rail, normal for
  prose. That is an information-carrying distinction, not decoration.
- **DM Mono** — machine output only. `latin-ext` subset, three weights.

Loading note: the `wdth` axis is only available from the variable font. With `next/font/google`,
Instrument Sans must be requested without a fixed `weight` list and with `axes: ["wdth"]`, otherwise
the width axis is unavailable and the condensed rail treatment silently falls back to normal width.
Verify this renders before building the rail on it.

B612 Mono was considered and rejected: its cockpit-display provenance fits the product's core
problem (reading a number correctly under stress), but it ships `latin` only. Extracted CV text
renders in mono, so a Turkish CV would break on `ş ğ ı İ`.

**Mono is reserved for values the machine produced** — score numbers, extracted text, matched terms,
point values. It is not used for interface labels. Mono for small UI labels is a recognised
generated-page tell, and the current `.readout` class is applied that way in places
(`app/r/[token]/page.tsx` sets "shared report" in it); that use goes away.

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

Body measure stays under 80 characters; the existing `max-w-measure` (68ch) is kept.
No text below 13px. Numeric readouts use `tabular-nums`.

### Surfaces

The concept is a bench, not paper, so the single-shadow `.sheet` rule is replaced.

- `.bench` — flat surface, 1px `line` border, a 1px top inner highlight. Depth comes from the
  surface ladder and border weight, not from shadow blur. Identical rounded cards with one radius
  and one soft grey shadow is the generic SaaS-card pattern; this avoids it.
- Radius keeps encoding scale rather than being one value: `surface` 10px, `control` 6px, `chip` 3px.
- `.live` — the one exception and the one bold element: an animated `live`-toned gradient edge, used
  only while a model is generating. The system's only glow, only light, only ambient motion.
- Spacing scale is 4-based: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96.

### Motion

One orchestrated moment, not scattered effects.

- Measurement does not move. Numbers settle; meters animate width once on first render, never again.
- AI flows: token-by-token output, a working pulse, the live edge.
- Per-section fade-and-slide-up entrances and hover transitions on every card are explicitly out.
  They read as generated.
- `prefers-reduced-motion: reduce` removes the live edge animation and the streaming effect (text
  still appears, in complete chunks) and disables meter animation.

### Written content

- Plain verbs, sentence case, active voice. No ALL-CAPS tracked eyebrow labels anywhere.
- Meta strings joined with middle dots are a recognised tell. The current
  `` `${words} words · ${lines} lines · ${language}` `` caption in `components/analyzer.tsx` is
  restructured into discrete labelled values.
- An action keeps its name through the flow: a button reading "Apply fix" produces a state saying
  "Fix applied".
- Errors state what happened and how to fix it. They do not apologise and are never vague.
- Empty states invite an action rather than setting a mood.
- The existing copy contract holds: the interface never claims to predict hiring outcomes and never
  claims to replicate a named vendor's parser. No emojis.

## Architecture: the density problem

This is the substantive work. `/analyze`'s report view currently stacks eight panels of equal visual
weight in two columns — `ScoreRail`, `FixList`, `RewriteDiff`, `FixDrafts`, `ReportChat`,
`KeywordPanel`, `AiConsent`/`AiStatus`, `CoverageMap`, `ParserView`. The user has one question and
the interface answers in ten equal voices. A new palette does not fix this; structure does.

**Eight panels become one spine, one rail, one dock.**

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
  line, a point value, and the AI's draft fix *in place*. `RewriteDiff` and `FixDrafts` stop being
  panels and become actions inside a work item. The user does not read; they apply.
  Numbering is kept here because the content genuinely is a sequence — a value-ordered priority. It
  would not be justified anywhere else in the product.
- **Rail** (sticky, secondary). The measurement instrument: total, dimensions, deltas. Below it, key
  terms (with `CoverageMap` folded into `KeywordPanel`), the extracted text, and AI status/consent.
  Set in condensed width — this is where the `wdth` axis earns its place.
- **Dock** (persistent). `ReportChat` stops being a panel in the stack and becomes a always-reachable
  strip: "ask about this report".

### AI behaviour in a work item

Drafts are generated **on request, in place**. A work item renders with its evidence; the user asks
for a fix and the model streams a draft into the item. This keeps first render fast, avoids forcing
a model download, respects the existing consent contract, and does not burn battery generating
drafts for findings the user will never open.

### Per surface

- **`/` (landing).** `ParseSweep` is deleted — it was the paper metaphor's set piece. The hero's
  centre becomes the workbench itself: a few real findings, ordered, with point values. For a
  stranger who must understand the product in thirty seconds, showing the output beats an abstract
  animation. The weights section stays but is reset in the new system.
- **`/analyze`.** Restructured as above. The existing input view (CV + job ad) is reset in the new
  system; its two-surface layout is sound and stays.
- **`/r/[token]`.** Inherits the spine, read-only, no AI, no dock. This is often the first screen a
  stranger sees, so it carries the full system.
- **`/login`, `not-found`, `coming-soon`.** Inherit the system.

### Component changes

New, under `components/bench/`:

- `work-list.tsx` — the spine
- `work-item.tsx` — one finding, with inline evidence and AI actions
- `measure-rail.tsx` — the measurement instrument
- `ask-dock.tsx` — the persistent question strip
- `live-surface.tsx` — the live-edge wrapper; the single owner of the AI visual treatment

Absorbed or replaced:

| Current | Becomes |
|---|---|
| `score-rail.tsx` | `bench/measure-rail.tsx` |
| `fix-list.tsx` | `bench/work-list.tsx` + `bench/work-item.tsx` |
| `rewrite-diff.tsx`, `fix-drafts.tsx`, `finding-explain.tsx` | inline actions inside `work-item.tsx` |
| `report-chat.tsx` | `bench/ask-dock.tsx` |
| `coverage-map.tsx` | folded into `keyword-panel.tsx` |
| `ai-consent.tsx`, `ai-status.tsx` | one `ai-panel.tsx` in the rail |
| `parse-sweep.tsx` | deleted; replaced by `bench-preview.tsx` for the hero |

Restyled in place: `document-intake.tsx`, `parser-view.tsx`, `keyword-panel.tsx`, `coming-soon.tsx`.

Rewritten: `app/globals.css` (tokens, `.bench`, `.live`; `.sheet`, `.ruler` and `.scan-*` removed),
`tailwind.config.ts` (tokens, families, radius), `app/layout.tsx` (fonts, theme script,
theme-aware `themeColor`). `lib/ui.ts`'s `barTone` is updated for the new tokens.

New: `components/theme-toggle.tsx`.

## Boundaries

Untouched:

- **`lib/scoring/`.** This is a visual change. The engine, its purity, and the
  `max - sum(cost of findings)` invariant asserted by `tests/scoring.test.ts` do not change.
- **`lib/extract/`, `lib/supabase/`, `lib/ai/` logic.** Only the presentation of `lib/ai/` output
  changes; task and provider code is not touched.
- The privacy contract. No feature here sends CV text anywhere. Share links keep stripping
  `evidence`.
- The Clarity analytics script in `app/layout.tsx`.

## Risks

- **Historical shared reports.** `/r/[token]` renders stored reports. The persisted data shape is
  unchanged, but the new components must render reports saved by the old UI.
- **Two themes double the verification surface.** Every pair needs contrast checking in both. This is
  the largest source of hidden work in the plan.
- **`live` discipline is easy to erode.** Once cyan exists, it will be tempting to use it for a
  focus ring or a highlight. If it leaks, the role split stops teaching anything and the one bold
  element is spent. Worth a review check.
- **Absorbing four panels into `work-item.tsx`** risks making that component large. It needs its
  own internal boundaries — evidence, draft, actions as separate units — rather than growing into a
  single file that does everything.
- **Dark theme drift.** The named failure mode is near-black plus one acid accent. The four-step
  ladder must survive implementation.

## Verification

- `npm run lint` (`--max-warnings=0`), `npm run typecheck`, `npm test` all clean.
- Contrast verified for both themes.
- Keyboard focus visible on every interactive element in both themes.
- Touch targets ≥44×44px.
- `prefers-reduced-motion` honoured for both motion classes.
- Responsive to mobile with no horizontal scroll; the three-zone layout collapses to one column.
- TypeScript strict with `noUncheckedIndexedAccess`, no `any`; `readonly` on result and props types;
  `interface` for object shapes and `type` for unions; named function exports for components;
  kebab-case files; `@/` imports in the existing group order.

# Brief: improve the site helper (help bubble)

Audience: a coding agent (Qwen) implementing this unattended. Read `AGENTS.md` at the repo root first; it overrides anything here.

## Goal

Make the site helper answer more questions correctly, in the visitor's language, at zero running cost. No API calls, no server, no new paid service, no model download. Everything stays in the browser.

## Hard constraints

- `lib/help/` is pure and serverless. It never sends data to a server and never stores anything. Do not break this.
- Do not add dependencies. Reuse code already in the repo.
- Do not touch `lib/scoring/` behaviour. Importing helpers from it is allowed (`lib/help/keyword-answerer.ts` already imports `detectLanguage`). Do not change what they return.
- Keep the `HelpAnswerer` interface in `lib/help/types.ts` compatible. A model-backed answerer may implement it later.
- Code style: TypeScript strict, `noUncheckedIndexedAccess`, no `any`, `readonly` on props and result types, `@/` imports, kebab-case files, no comments that restate code, no emojis in code or UI text.
- Copy rules: plain, never oversell, never claim to predict hiring outcomes or to replicate a named vendor's parser.
- Every new user-facing string goes into all three of `messages/en.json`, `messages/de.json`, `messages/tr.json`. `tests/messages.test.ts` enforces identical keys and placeholders.
- After every phase run `npm run lint`, `npm run typecheck`, `npm test`. All three must pass clean. Then commit that phase alone with a conventional message, per `AGENTS.md`.
- If a phase needs a decision this brief does not cover, stop and write the question at the end of this file under "Open questions". Do not guess.

## Files you will work in

- `lib/help/keyword-answerer.ts`: scoring and answering
- `lib/help/bank.ts`: the FAQ entries (`HELP_ENTRIES`)
- `lib/help/normalize.ts`: folding, tokenising, stopwords
- `lib/help/starters.ts`, `lib/help/types.ts`
- `components/help/help-bubble.tsx`, `components/help/help-stack.tsx`
- `messages/{en,de,tr}.json`, namespaces `help` and `faq.items`
- Tests: `tests/help-answerer.test.ts`, `tests/help-normalize.test.ts`, `tests/help-surface.test.ts`

## Phase 1: fix two suspected bugs (verify each before changing anything)

### 1a. Starter buttons

`components/help/help-bubble.tsx` resolves starters with the key `help.start.<id>` (see `handleStarter` and the render loop). In `messages/en.json` the keys sit under `help.starters`, and a search found no `help.start`. The buttons may render the raw key, and clicking one may submit that raw key as the question.

1. Confirm by reading the code and, if possible, running `npm run dev` and opening the bubble. If you cannot run the app, confirm from the code and the message files and say so in the commit message.
2. If confirmed, fix the key (use `help.starters.<id>`), in one place.
3. Add a test in `tests/help-surface.test.ts` that fails on the old behaviour: for every id in `STARTER_IDS`, the resolved starter text exists in all three message files and is not equal to its own key.

### 1b. Language comes from the question text instead of the site locale

`createKeywordAnswerer` calls `detectLanguage(question)`. The site already knows its locale (`AppLocale`: `en | de | tr`). Short questions are detected unreliably.

1. Add an optional `locale` argument to the answerer (for example `createKeywordAnswerer({ entries, resolve, locale })`, or a second parameter to `answer`). Choose the smaller change that keeps `HelpAnswerer` compatible.
2. Use the locale as the primary language for normalising and for choosing the keyword set. Keep `detectLanguage` only as a fallback when no locale is given.
3. Also match against keywords of the other two languages at a lower weight, so an English question typed on the Turkish site still works.
4. Pass the locale from `HelpBubble` (use `useLocale` from `next-intl`).
5. Tests: "puan" on locale `tr` finds the score entry; an English question on locale `tr` still finds an entry.

Commit after 1a and again after 1b.

## Phase 2: better matching

All changes live in `lib/help/`. Keep the module pure.

1. **Multi-word keywords.** Keywords such as `"ne kadar"` and `"wie lange"` can never match today, because the question is split into single tokens and stopwords are removed first. Match multi-word keywords against the normalised question as a phrase (substring on whole-word boundaries) in addition to token matching.
2. **Stopword collisions.** Some bank keywords are also stopwords and can never match (for example Turkish `ise`, English `how` is not a keyword but check similar cases). Write a test that walks `HELP_ENTRIES` and fails if any single-word keyword, after normalising, appears in the stopword set for its language. Fix the bank or the stopword list based on what the test finds.
3. **Inflection.** Turkish and German questions use endings and compounds ("yüklediğim", "saklıyor musunuz", "Datenspeicherung"). `lib/scoring/turkish.ts` and `lib/scoring/german.ts` already contain a Turkish stemmer and German compound splitting. Read them, reuse their exported functions on question tokens and on keywords, and compare stems. Do not copy their code. If they export nothing usable, export the minimum from them and add a test proving their behaviour is unchanged.
4. **Tie-breaking and weighting.** Today generic words (`score`, `data`, `file`, `cv`) add the same points in many entries and the first entry in the list wins ties. Weight each matched token by how rare it is across all entries' keywords (inverse document frequency: `log(1 + N / df)`), and break remaining ties by the number of distinct matched tokens, then by list order. Keep the existing exact-match versus substring distinction.
5. **Search the answer text too.** In addition to the keyword list, give a small score for tokens found in the entry's own resolved answer text. Entries are resolved through the `resolve` function that is passed in. Resolve lazily and cache per locale. Keep this weight low so curated keywords still win.
6. **Suggestions when nothing matches.** Add a third answer kind `{ kind: "suggest"; ids: readonly string[] }` to `HelpAnswer` containing the two or three best entries that scored above zero but below the threshold. `HelpBubble` shows them as clickable questions (use the entry's starter or question text; add a `question` message key per entry if none exists). Keep `{ kind: "none" }` for the case where nothing scored.

Tests (`tests/help-answerer.test.ts`):
- A golden table: at least 4 realistic questions per bank entry per language (en, de, tr), each asserting the expected entry id. Include questions with endings, typos of one character, and wording not copied from the keyword lists.
- Questions that must return `none` (gibberish, empty after stopwords).
- Tie case: a question containing only a generic word returns `suggest`, not a confident wrong answer.

Commit after each numbered step that changes behaviour.

## Phase 3: more entries

Add entries to `HELP_ENTRIES` with keywords in all three languages and answers in `messages/*.json`. Answers must be short (1-3 sentences) and honest.

Topics:
1. What each finding family means and how to fix it: parse (columns, tables, icon fonts, encoding, scanned or image-only text), contact, structure, impact, keywords.
2. "Why did my score drop" and "what should I fix first", answered generically here (the personalised version is Phase 4).
3. Product features that exist in the app: tailor to a job ad, compare variants, interview questions, cover letter, editor and export, share links. Check each against the code or routes before writing about it; do not describe a feature that does not exist.
4. ATS facts. Use only these verified statements:
   - Text must be selectable. Image-only or scanned PDFs cannot be read.
   - Parsers read text in a linear order, so columns can mix up reading order. Say "can", not "will".
   - ATS parsers fill profile fields such as name, contact, job titles, employers, dates and schools; the exact behaviour differs by vendor and is not publicly documented in detail.
   - The score here is a rule-based estimate of readability. It does not predict hiring outcomes.
   Do not write the "75% of resumes are rejected by ATS" claim, and do not state vendor-specific behaviour as fact.
5. Photo, date of birth and marital status on a CV: say it depends on country and employer, and point to the market advice in the report. Do not give legal advice.

Keep the existing privacy and retention answers exactly as they are unless they contradict `AGENTS.md` ("Privacy contract" section). If they do, stop and note it under "Open questions".

Update `STARTER_IDS` only if a new entry is clearly more useful than an existing starter. Keep at most 6.

Tests: extend the golden table from Phase 2 for every new entry.

## Phase 4: answers about the visitor's own result (needs a small design, read first)

Goal: questions like "why is my score 62?", "what should I fix first?", "which keywords am I missing?" are answered from the analysis already in the browser. No network, nothing stored.

Before writing code, find out how the current `AnalysisResult` is held on the client (look at `components/analyzer.tsx` and `lib/store/`). `HelpBubble` is mounted globally through `HelpStack`, outside the analyzer.

- If a client store already exposes the latest result, read from it.
- If not, add the smallest possible client-side holder (a React context or a tiny module-level store in `lib/store/`) that the analyzer writes to when it produces a result, and the bubble reads from. Do not persist it, do not send it anywhere.
- If this requires a larger change than that, stop and write the proposal under "Open questions". Do not refactor the analyzer.

Implementation:
- New pure module `lib/help/result-answers.ts`. Input: an `AnalysisResult` (from `types/analysis.ts`) and a question intent; output: a localised text.
- Intents, detected by the same normalised keyword approach: why-score-low, fix-first, missing-keywords, what-is-good (only if the result has a `strengths` field; otherwise skip this intent).
- Answers are templates filled with real numbers from the result: the top three findings by `cost` with their `title` and the points they cost, the dimension with the lowest ratio of score to max, up to five missing required keywords. Findings' `title` and `fix` are English strings produced by the scorer; do not translate them, put them inside a localised sentence frame.
- Never include `evidence` fields (they can contain lines of the CV). Never include raw CV text.
- When no result exists yet, answer with a short localised sentence telling the visitor to run an analysis first.
- Templates go in `messages/*.json` under `help.result.*` with placeholders; all three languages.

Tests: a fixture result with known findings, assert the sentence contains the right titles and numbers, assert `evidence` text never appears in the output, assert the no-result message.

## Phase 5: local feedback (no server)

1. After each assistant answer, show two small buttons, helpful and not helpful. No network call.
2. Keep counts and the last 20 unanswered or not-helpful questions in `sessionStorage` only, wrapped in try/catch, with the bubble working normally when storage is unavailable.
3. When a question gets `none` or `suggest`, offer a link that opens a prefilled email to the support address already used in the app (find it through the existing `help.answers.contact` message and its `{email}` placeholder). The visitor must click it; nothing is sent automatically. The prefill contains the question text only after the visitor presses the link.
4. Keep the conversation turns in `sessionStorage` so closing and reopening the panel keeps the history for the session. Clear on tab close.

Tests: storage unavailable does not throw; counts update; no `fetch` call in this path (assert with a spy).

## Out of scope

- Model-backed answers (WebLLM, transformers.js). Do not add or load any model.
- Changes to scoring, the analyzer layout, authentication or Supabase.
- New dependencies.

## Definition of done

- `npm run lint`, `npm run typecheck`, `npm test` all pass with no warnings.
- `tests/messages.test.ts` passes (all three languages complete).
- `tests/scoring-purity.test.ts` still passes (nothing in `lib/scoring` imports from `lib/help`).
- Golden table covers every entry in all three languages.
- A short summary at the end of this file under "Result": what changed per phase, anything skipped and why, and anything you could not verify (for example "did not run the app in a browser").

## Open questions

(none yet)

## Result

(to be filled by the implementer)

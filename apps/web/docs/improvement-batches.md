# Improvement batches

What is left to do, grouped into batches. Research, prompts and analysis already delivered are left out. The reasoning behind each item lives in the older notes: `engine-strengthening-plan.md`, `research-priority-list.md`, `help-assistant-suggestions.md`. The step-by-step brief for the help bubble is `help-assistant-improvement-brief.md`.

Status: A1, A2, A3, A4, A7, B6, C1, C5 done. D6: `pdfjs-dist` done. Nothing below has been implemented or approved.

## Rules for every batch

- `AGENTS.md` wins over this file.
- `lib/scoring/` stays pure. A score is `max - sum(cost of findings)`. A new deduction is a `FindingDraft` with a `cost`, id namespaced by dimension, a test that triggers it and a test that does not. If a new cost pushes a dimension's realistic floor to zero, rebalance existing costs.
- AI never feeds `lib/scoring/`. Models download only after explicit consent with size, progress and cancel.
- New UI strings go into `messages/en.json`, `de.json` and `tr.json` (`tests/messages.test.ts` enforces it).
- After each batch: `npm run lint`, `npm run typecheck`, `npm test` all clean, then one commit per batch.
- Size: S = one sitting, M = about a day, L = multi-day.

## Open decision (blocks copy, not code)

`AGENTS.md` says the CV, extracted text and result are sent to the server, stored in Supabase and backed up to Google Drive for 12 months. `MASTERPLAN.md` says the file is never uploaded. Decide which is current before any interface text says "privacy first".

---

## Track A: scoring engine

### A1. Safety net and versioning (S) - do first
- Add `ENGINE_VERSION`, an optional `engineVersion` on `AnalysisResult`, and one `lib/scoring/config.ts` holding the scattered thresholds (stuffing, coverage target, column ratio, letter-spacing ratio, word limits, words per page).
- Restore of old shared reports must tolerate a missing version (`lib/report/restore.ts`).
- Add the missing tests: `contact.location/name/profile`, `structure.missing-experience|education|skills`, `no-bullets`, `too-long`, `chronology`, `parse.page-furniture/split-email/icon-font/table-markers/letter-spacing/no-line-structure`, `impact.first-person/buzzwords/long-bullets/no-numbers`. Run the "score = max - sum(cost)" test over every fixture in `tests/fixtures/resumes.ts`, not only `STRONG_CV`.
- Gives: later weight changes are traceable, and the next batches have a net under them.

### A2. Unicode correctness (S)
- `raw.normalize("NFC")` at the start of `normalizeDocument`; extend the ligature table.
- Replace `\b` with `(?<![\p{L}\p{N}])...(?![\p{L}\p{N}])` and the `u` flag in `gate.ts`, `contact.ts`, `sections.ts`, `job-ad.ts`. Run the place check on case-folded text. Add word boundaries to the salary pattern.
- Gives: decomposed Unicode (macOS, Word) no longer breaks Turkish and German headings, keywords and verbs. The document gate sees "Özgeçmiş/Üniversite". "İstanbul" and "Österreich" count as locations. "industry" no longer produces a salary.

### A3. False positives (S)
- Phone: scan all candidates, drop date ranges (`2019-2022`, `03/2021`).
- Name: tolerate particles (van, von) and suffixes (M.Sc.).
- `parse.columns`: ignore right-aligned date ranges.
- `parse.page-furniture`: normalise digits ("Page # of #"), ignore repeated employer names inside the experience section.
- Gives: fewer wrong findings, which is what users notice first.

### A4. Section headings (S/M)
- Add TR, DE, EN headings (list in the older plan, section 1.4). Two passes: whole-line headings first, prefix matches second, so "Experience with Python..." in a summary cannot shadow the real heading.
- Optional: `structure.experience-unlabelled` (cost 2) when no heading exists but two or more date ranges do.
- Gives: up to 12 Structure points no longer lost to wording alone; correct experience range for the chronology check.

### A5. Language handling (M)
- Match with `caseFold` so Turkish `I -> i-dotless` stops corrupting "AI", "CI/CD". Keep the stemmed path as a second route.
- Job-ad fixes: seniority only from title lines, Unicode location patterns including "Standort", language-name mapping ("İngilizce", "Englisch"), experience status `unknown` when dates are unreadable, "required" only for `tier === "required"`, ignore ads under 120 characters.
- Gives: Turkish CVs stop losing keyword points they earned; the ad data is trustworthy enough to show (B3).

### A6. Impact on real-world documents (M)
- When fewer than 4 bullets exist, measure the experience-section lines. Years and date ranges are not numbers. Add verbs (managed, architected, spearheaded) and German noun openings (Entwicklung, Einführung, Konzeption, Aufbau, Leitung). Keep `mitgewirkt` and `unterstützung bei` in one regex only.
- Gives: paragraph-style and DOCX CVs are measured instead of getting 20/20 by accident; German style stops being flagged as weak.

### A7. Cost balance (M) - after A1
- Split `keywords.coverage` into `keywords.required-coverage` (max 15) and `keywords.other-coverage` (max 10). Cap `thin-skill-inventory` near 10. Widen the taxonomy with finance, health, sales and logistics terms, with TR/DE synonyms. New `impact.nothing-to-measure` (cost about 10); stop `parse.thin-text` and `structure.too-short` from penalising the same fact twice. Tighten the empty-document test to `< 15`.
- Gives: one finding can no longer wipe out a dimension; non-software CVs are not penalised by structure of the taxonomy; empty documents score near zero.
- Risk: scores of existing fixtures and shared reports move. A1 must be merged first.

---

## Track B: extraction and what the user sees

### B1. Strengths and weaknesses of the CV (M) - main user-facing feature
- New pure `lib/scoring/strengths.ts`: `deriveStrengths(context, outcomes, keywordReport)`, added to the result as an optional `strengths` list. It does not change the score.
- Each strength is an id plus numeric params (not prose), so it localises: contact fields found, clean text layer, core sections present, consistent reverse-chronological dates, share of quantified bullets, action-verb share, matched required keywords, passed suitability checks, total seniority. A strength exists only when the related finding did not fire and there is positive evidence (an empty document yields none). Expose the private counters in `impact.ts` through a shared helper.
- UI: `components/bench/strengths-panel.tsx` above `WorkList` in the report view and on the shared report page. Two columns per dimension: what works (with evidence, "7 of 11 bullets quantified") and what to improve (top one or two findings with the points they would recover). Add the same section to `lib/report/markdown.ts` and the export panel.
- Messages: new `strengths.*` namespace in three languages.
- Persistence: add `restoreStrengths` in `lib/report/restore.ts` (it rebuilds fields from a whitelist, so a new field is otherwise dropped); default `[]` for old rows. Strengths hold ids and numbers only, so no CV text reaches storage.
- Tests: `tests/strengths.test.ts` (strong CV, weak CV, empty document, score unchanged), restore round trip and old row, messages, purity.
- Gives: the report says what to keep as well as what to fix.

### B2. DOCX structure (M)
- `lib/extract/index.ts`: switch `mammoth.extractRawText` to `convertToHtml`; `<li>` becomes `"- "`, table cells become tabs. Say in the warnings that headers and footers are not read.
- Gives: bullet and table signals return for DOCX; `no-bullets` and Impact behave correctly.

### B3. Show data the engine already computes (S/M)
- Pass the `market` selection from `components/analyzer.tsx` into `analyzeCv` (today it is never passed, so market advice depends on document language only).
- Rail: total seniority, overlapping periods, estimated pages, bullet count and average length. Ad panel: seniority, years, languages, location, salary (only after A5). Carry `periods` in the result and drop the second parser in `lib/bench/entries.ts`. Show `keywords.overused`, Europass marker count, language-detection confidence, `projects` section.
- Gives: more information with no new analysis.

### B4. PDF extraction (M/L)
- `lib/extract/pdf.ts`: line tolerance from font height (`transform[3]`, `hasEOL`), read `getAnnotations()` links, mark page breaks, count pages with no text layer. New optional plain-data input `extraction?: { pages, emptyPages, links }`.
- New findings: `parse.image-page` (cost 4) for mixed text/image PDFs, `contact.hidden-link` (cost 2, balanced against `contact.profile`). Header/footer contact detection becomes possible.
- Note in the interface that these findings need a file upload, not pasted text.
- Gives: the clearest official ATS signal (text must be selectable) is checked per page; a link that exists but is invisible is reported with evidence.

### B5. "What the ATS saw" field table (M)
- Build on `IdentityTable` and `ParserView`: name, e-mail, phone, latest title, employer, date range, school, each marked extracted or not, with the source line.
- Gives: an honest "what a profile would contain" view instead of only a number.

### B6. Honest copy and market notes (S)
- Under the score: "A rule-based estimate of how readable the document is. It does not predict hiring outcomes or replicate a specific vendor's parser."
- softgarden and Textkernel do not read e-mail from a CV on purpose, so `parse.split-email` and `contact.email` must not say "the ATS could not read your e-mail".
- Personal-data hints (national ID, marital status, religion) at `cost: 0`, per market, phrased as suggestions. Never use "75% are rejected by ATS" or "columns always break parsing".

---

## Track C: site helper (help bubble)

The full step-by-step brief is `help-assistant-improvement-brief.md`. Batches map to its phases.

### C1. Two suspected bugs (S)
- Starter buttons resolve `help.start.<id>`, but messages only have `help.starters`. Verify, then fix and test.
- Use the site locale instead of guessing language from the question; keep detection as fallback and match other languages at lower weight.

### C2. Matching quality (M)
- Multi-word keywords, stopword collisions (test over the bank), Turkish stemming and German compound splitting reused from `lib/scoring`, rarity weighting (BM25 or TF-IDF) with tie-breaks, low-weight search of answer text, and a `suggest` answer kind ("did you mean").
- Gives: fewer wrong or empty answers, no more "first entry wins".

### C3. More entries (M)
- Finding families and fixes, "why did my score drop / what first", existing product features only, verified ATS facts only, photo and personal data by market without legal advice. A golden table of questions per entry per language.

### C4. Answers from the user's own result (M) - after B1 if "what is good" is wanted
- Pure `lib/help/result-answers.ts` over the in-browser `AnalysisResult`: why the score is low, what to fix first, missing keywords, what is good (only if `strengths` exists). Templates with real numbers; never include `evidence` or CV text. A small client-side holder if no store exposes the latest result; otherwise stop and write the proposal down.

### C5. Local feedback (S)
- Helpful / not helpful buttons, counts and last 20 unanswered questions in `sessionStorage` only (try/catch), a prefilled e-mail link opened only by a click, conversation kept for the session. No network call.

---

## Track D: free-to-run AI and open data (after Tracks A and B)

All of it keeps the score deterministic.

### D1. Synthetic multilingual fixtures and golden set (M)
- Generate Turkish, German, English CV and ad pairs with a large model on a developer machine; freeze them in the repo with generator, prompt and date. Evaluation data: `resume-parsing-vision` (CC-BY-4.0, attribution) and SkillSpan (CC-BY-4.0). No open licensed Turkish dataset was found.
- Gives: a regression net for every later weight change.

### D2. Static skill dictionary (M)
- Compile ESCO (DE/EN, attribution required, no Turkish) and O*NET (CC BY 4.0) into a static JSON at build time; add a hand-made Turkish list; show the attribution text in the interface.

### D3. Offline synonym mining and calibration (M)
- On a developer machine, cluster ad and CV terms with an embedding model to propose synonyms; a person approves them into the static dictionary. Use an LLM as a judge only to review cost weights, and record the outcome. No model at runtime.

### D4. Optional OCR (M)
- tesseract.js (Apache-2.0), language data downloaded only after consent with size and progress. Report "no text layer, read with OCR" as its own finding.

### D5. Informational semantic hints (M)
- multilingual-e5-small int8 (about 118 MB, opt-in). Show "the ad asks for X, your CV mentions a similar Y" without changing the score. Measure the similarity distribution with the real model before changing the 0.55 threshold in `lib/ai/semantic-match.ts`.

### D6. Dependency upgrades (S/M, separate PRs)
- `@huggingface/transformers` 3.8 to 4.x and `pdfjs-dist` 5.4 to 6.x, each with the existing tests.
- `pdfjs-dist` 6.4 done. 6.0 removed `PDFDocumentProxy.destroy`; `lib/extract/pdf.ts` now tears down through the loading task. 6.0 also raised the minimum browsers to Chrome 125 / Safari 18. Checked with the node extraction tests and once in headless Chromium against the copied worker.

Do not use: open-resume, pyresparser, mupdf, scribe.js-ocr (copyleft), Lightcast Open Skills (non-commercial), scraped real-CV datasets.

---

## Order

```
A1 -> A2, A3, A4 -> A5 -> A6 -> A7
A1 -> B1, B2, B6 -> B3 (after A5) -> B4 -> B5
C1 -> C2 -> C3 -> C5;  C4 after B1
D1 can start any time; D2-D6 after A and B
```

Smallest useful first release: A1, A2, A3, A4, C1.

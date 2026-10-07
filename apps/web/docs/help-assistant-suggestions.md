# Site helper (help bubble): improvement suggestions

All suggestions cost nothing to run: no API, no server, no model download. The implementation brief for a coding agent is `help-assistant-improvement-brief.md`.

Current state: `lib/help/` holds a keyword bank of 12 entries, a token-based scorer (`keyword-answerer.ts`) and a bubble UI (`components/help/help-bubble.tsx`). It sends nothing to a server and stores nothing. Findings below come from reading the code; the app was not run.

## Fix first (verify each)

1. Starter buttons: the bubble resolves `help.start.<id>`, but `messages/en.json` only has `help.starters` (line 971). Buttons may show the raw key, and clicking one may submit that key as the question.
2. Language is guessed from the question text with `detectLanguage`, although the site locale (`en | de | tr`) is known. Short questions are detected unreliably and the wrong keyword set is used.

## Better matching

- Multi-word keywords ("ne kadar", "wie lange") never match because the question is split into tokens and stopwords are removed first.
- Some keywords are also stopwords (Turkish `ise`) and can never match. Add a test that finds these.
- No inflection handling ("yüklediğim", "saklıyor musunuz", compounds). Reuse the Turkish stemmer in `lib/scoring/turkish.ts` and German compound splitting in `lib/scoring/german.ts`.
- Generic words (`score`, `data`, `file`, `cv`) score in many entries and the first entry wins ties. Weight by rarity (a small TF-IDF/BM25, about 40 lines, no dependency).
- Also search the entry's answer text, with a low weight.

## Wider coverage

The bank covers only privacy, formats and price. Add: what each finding family means and how to fix it, why the score dropped and what to fix first, the app's features (tailor, compare, interview, cover letter, editor, share links), honest ATS facts (selectable text, reading order can mix with columns, the score does not predict hiring), photo and personal data by market without legal advice.

## Context-aware answers (highest value)

The analysis result is already in the browser. Answer "why is my score 62?", "what should I fix first?", "which keywords am I missing?" from it with templates. No model, no network, no storage. Never include `evidence` fields. The "what am I doing well" question depends on the strengths feature in `engine-strengthening-plan.md`.

## Experience

- When nothing matches, show the two or three closest questions ("did you mean") instead of a bare "I do not know".
- A "was this helpful?" control that keeps counts and recent unanswered questions in `sessionStorage` only. A prefilled e-mail link opens only when the visitor clicks it.
- Keep the conversation for the session.
- Tests: site locale instead of detection, multi-word keyword, inflected word, tie-breaking, and a golden table (question to expected entry) per language.

## Later, optional, still free to run

`HelpAnswerer` is ready for a model-backed answerer. A model runs on the visitor's device (no cost to you) but needs a 100-700 MB download with explicit consent. Safer first step: embeddings to retrieve the nearest FAQ entry, not free-form generation. Free-form answers risk hallucination, which conflicts with the product's "never oversell" rule. Consider it only if the steps above are not enough.

## Suggested order

1. Verify and fix the starter key; use the site locale.
2. Matching: multi-word keys, stemming, rarity weighting, suggestions.
3. Finding and feature entries in three languages.
4. Context-aware answers.
5. Local feedback.
6. Optional embeddings retrieval.

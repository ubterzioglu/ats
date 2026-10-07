# Research summary and priority list (2026-10-06)

Sources: a code audit of `lib/scoring`, `lib/extract`, `lib/ai`, `tests/`; a web research pass on ATS parser behaviour; a research pass on reusable open source and AI. This file is the digest. The actionable plan is `engine-strengthening-plan.md`.

Reading note: code findings come from the audit agent, which reported verifying behaviour with throwaway vitest probes. They were not re-run independently. Web claims keep the confidence label given by the research agent.

## 1. Strengths of the engine

- The score is `max - sum(cost)` computed in one place (`lib/scoring/dimension.ts:20-34`), so every lost point has a named finding.
- Purity is enforced by test (`tests/scoring-purity.test.ts`). The semantic layer reaches the score only as data.
- Date parsing is solid: TR/DE/EN month names, "devam ediyor / bis heute", merged overlapping periods, reversed ranges reported.
- Language depth: Turkish stemming and case folding, German compound splitting, mojibake detection.
- Score transparency is a real difference from competitors.

## 2. Weaknesses, ordered by impact

1. No NFC normalisation. Decomposed Unicode (macOS, Word) breaks headings, keywords and verbs in Turkish and German.
2. ASCII `\b` fails on Turkish and German letters (document gate, location, headings).
3. Heading dictionary is narrow. Almost no German heading is recognised; up to 12 of 20 Structure points can be lost on wording alone.
4. In DOCX, mammoth raw text drops bullets, so Impact is effectively not measured.
5. One finding can erase a whole dimension: `keywords.coverage` costs up to 25; `thin-skill-inventory` up to 19; taxonomy is software/QA heavy (~230 terms).
6. Turkish `I -> i-dotless` corrupts Latin acronyms ("AI", "CI/CD") so they miss the job ad.
7. False positives: phone detection, names with particles, right-aligned dates triggering `parse.columns`, years counted as numbers, missing action verbs, German noun-style bullets.
8. Extraction gaps: page boundaries lost, mixed text/image PDFs, hyperlink annotations never read, hidden text, DOCX headers and footers ignored.
9. Empty document scores 26/100.
10. Job ad parsing errors: salary regex fires on "industry", seniority on "lead", ASCII-only location patterns, experience check reports "0 years" when dates are unreadable.
11. Many finding ids have no test.
12. No engine version; thresholds scattered.

## 3. Computed but not shown to the user

Total seniority (`experienceMonths`), overlapping periods, estimated pages, bullet counts, ad-derived seniority/experience/language/location/salary, `keywords.overused`, Europass marker count, language detection confidence, `projects` section. The `market` selection is never passed from the UI, so market advice runs on document language only. A second parser (`lib/bench/entries.ts`) re-parses the CV for `EntriesTable`.

## 4. What the web research established

- No major ATS publishes an official list of layouts that break parsing. Column, table and header claims come mostly from vendor blogs. Say "can affect reading order", not "breaks".
- Consistent official signals: text must be selectable; accuracy varies by format and language (softgarden); Workday does not fill Skills/Languages from parsing (secondary source).
- softgarden/Textkernel deliberately does not read e-mail addresses from the CV. Messages that say "the ATS could not read your e-mail" are wrong for it.
- "75% of resumes are auto-rejected" is folklore. Percentage "ATS scores" are a vendor concept.
- Primary documents were not readable for Workday, Taleo, SuccessFactors, iCIMS; those rows rest on secondary sources.
- Germany: photo is not legally required, expected in practice. Turkey: sources conflict; KVKK treats CV data as personal data. Present these as hints, not rules.

## 5. What the open-source research established

No maintained, permissively licensed TypeScript CV-parser library was found; `lib/extract` and `lib/scoring` are ahead of most repos reviewed.

Incompatible: open-resume (AGPL-3.0), pyresparser (GPL-3.0), mupdf (AGPL-3.0), scribe.js-ocr (AGPL-3.0), Lightcast Open Skills (non-commercial), `datasetmaster/resumes` and other scraped real-CV datasets (privacy).

Usable: ESCO (DE/EN, attribution; no Turkish), O*NET (CC BY 4.0, English), tesseract.js (Apache-2.0, optional OCR), `resume-parsing-vision` and SkillSpan (CC-BY-4.0, evaluation data), OfflineCV (Apache-2.0, ideas only), pdfium WASM (MIT, benchmark experiment).

Browser models, all opt-in with size and consent: multilingual-e5-small int8 (~118 MB), GLiNER multilingual ONNX (~197 MB), Qwen3-0.6B (~500-570 MB), Llama-3.2-1B (~700 MB). Check each model licence before shipping. Sizes beyond e5-small are from secondary sources and need verification.

Dependency note: `@huggingface/transformers` 3.8 and `pdfjs-dist` 5.4 are installed; 4.3.0 and 6.4.299 exist. Treat as separate PRs.

## 6. Priority list

| # | Item | Effort |
|---|---|---|
| 1 | NFC/NFKC normalisation and Unicode-safe boundaries | S |
| 2 | Heading dictionary TR/DE/EN with two-pass priority | S/M |
| 3 | Phone, name, column and page-repeat false positives | S |
| 4 | Engine version and single config file (before 6) | S |
| 5 | Synthetic multilingual fixtures, golden set, missing tests | M |
| 6 | Split `keywords.coverage`, widen taxonomy, rebalance costs | M |
| 7 | Impact on documents without bullets, years are not numbers, verb list | M |
| 8 | DOCX via mammoth HTML (bullets, tables) | M |
| 9 | Wire market selection into the UI; show computed data | S/M |
| 10 | Image-page detection, hidden links, page boundary marker | M/L |
| 11 | "What the ATS saw" field table | M |
| 12 | Optional OCR with tesseract.js | M |
| 13 | ESCO + O*NET static skill dictionary, Turkish by hand | M |
| 14 | AI without touching the score: offline synonym mining, LLM-as-judge calibration, informational embedding hints | M |

Feature added after review: the report should show the CV's own strengths and weaknesses, not only deductions. See Phase 2 of `engine-strengthening-plan.md`.

## 7. Open decision

`AGENTS.md` says the CV, extracted text and result are sent to the server, stored in Supabase and backed up to Google Drive for 12 months. `MASTERPLAN.md` says the file is never uploaded. The interface should not claim "privacy first" until this is settled.

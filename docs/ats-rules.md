# ATS rules

Reference for the scoring engine: what an applicant tracking system can and cannot read, which of those
rules `lib/scoring/` already enforces, and which it does not. Written to be argued with — every rule here
should be defensible, and the ones that are not are marked.

## What the machine actually does

An ATS does not look at a CV. It runs a pipeline, and every stage can lose information:

1. **Extract** the text layer. A scan, an image export or a missing embedded font yields nothing or garbage.
2. **Segment** the text into blocks, usually by line position. Columns and tables break this.
3. **Classify** blocks against known section names. An unrecognised heading files its content as unclassified.
4. **Field-map** the classified blocks: name, email, phone, employer, title, start date, end date, school.
5. **Index and rank** the result against the requisition, usually by term frequency over the extracted text.

A rule earns its place here only if it protects one of those five stages. "Recruiters prefer it" is not a
reason; a parser losing data is.

## The five dimensions

Points total 100. The split reflects how early in the pipeline a failure occurs: a document that will not
extract cannot be rescued by good keywords.

| Dimension | Points | Stage it protects |
|---|---|---|
| Parseability | 25 | Extraction |
| Keyword match | 25 | Indexing and ranking |
| Structure | 20 | Segmentation and classification |
| Impact | 20 | The human who reads it after the filter |
| Contact | 10 | Field mapping |

Impact is the one dimension that is not about the machine. It is scored because a CV that clears the filter
and then reads as a task list has not achieved anything.

---

## Parseability (25)

The text layer either survives extraction or it does not.

**Implemented** — see `lib/scoring/parseability.ts`:

| Rule | Why it matters | Cost |
|---|---|---|
| `parse.too-little-text` | Under 150 words means a scan or an image export. The parser sees an empty document. | 13 |
| `parse.thin-text` | Under 260 words suggests part of the content sits in images or text boxes. | 6 |
| `parse.letter-spacing` | Manual tracking or outlined fonts extract one character per token, destroying every word. | 5 |
| `parse.columns` | Wide intra-line gaps mean side-by-side columns. Parsers read left to right and interleave them. | 5 |
| `parse.table-markers` | Tabs and pipes indicate a table grid; cell order rarely survives. | 3 |
| `parse.encoding` | Replacement characters and `(cid:N)` mean the font was never embedded. Characters are simply gone. | 7 |
| `parse.decorative-bullets` | Symbol glyphs are dropped by some extractors, gluing lines together. | 2 |
| `parse.page-furniture` | Repeated headers and footers get pulled into the middle of the parsed text. | 2 |
| `parse.no-line-structure` | If the whole document extracts as a few long runs, headings cannot be told from body text. | 4 |
| `parse.split-email` | An address broken by spacing or a line end is not recognised as contact data. | 3 |
| `parse.icon-font` | Private-use glyphs and emoji carry no meaning. A phone icon is not the word "phone". | 3 |

**Not implemented.** These are real rules the engine does not yet check:

- **Encrypted or password-protected PDF.** The hardest failure of all: many parsers reject the file outright.
  `lib/extract/pdf.ts` does not catch pdf.js's `PasswordException`, so it surfaces as a raw error rather than
  a scored finding. Note the class is not exported from the pdfjs root; branch on `cause.name`.
- **Embedded images and photographs.** Common in German and Turkish CVs, and a frequent cause of size and
  parsing problems. pdf.js exposes image operators; none are counted today.
- **Text inside shapes and text boxes.** The fix copy mentions it; nothing detects it.
- **Hyperlinks hidden behind icons or labels.** pdf.js exposes link annotations. A profile URL that exists
  only as an annotation is invisible to a text-layer parser, and the engine cannot currently tell.
- **Contact details inside repeated page furniture.** Furniture is detected; whether it contains the only
  copy of the email or phone is not.
- **Filename hygiene.** Spaces, diacritics and version suffixes break some upload pipelines.

---

## Structure (20)

Can the segmenter find blocks, and can the classifier name them?

**Implemented** — see `lib/scoring/structure.ts` and `sections.ts`:

- A core heading is missing (`experience`, `education`, `skills`) — 4 points each. Section names are matched
  in English, German and Turkish; see `SECTION_DEFINITIONS`.
- No summary at the top — 1 point. Cheap, because a summary helps ranking but nothing breaks without it.
- Fewer than two years anywhere — 4 points. Without dates no employment period can be built, so tenure
  filters skip the record entirely.
- Years present but not as ranges — 3 points. A parser pairs a start with an end; a bare year pairs with
  nothing.
- Experience not in reverse-chronological order — 3 points. Most systems assume the first role is current.
- Responsibilities as paragraphs rather than bullets — 3 points.
- Under 280 words, or over 1500 — 3 and 2 points.

**Known weakness.** `looksLikeHeading` caps a heading at six words, so a spaced-out heading such as
`E X P E R I E N C E` is not recognised. The penalty that follows is correct — a parser will not classify it
either — but the finding blames a *missing* heading rather than a malformed one, so the fix text sends the
reader to the wrong place.

**Not implemented:**

- Date formats that are ambiguous across locales (`03/04/2022`).
- Employment gaps. Detectable from the parsed ranges; deliberately unscored, because a gap is a life fact and
  not a defect.
- Heading synonyms outside the three supported languages.

---

## Keyword match (25)

**Implemented** — see `lib/scoring/keywords.ts`:

- Terms are mined from the job ad, weighted by frequency, whether the term is a known skill, whether it
  appears in a requirement bullet, and whether it is a phrase.
- Coverage is measured against a 0.7 target: matching 70% of the weighted terms scores full marks.
- With no job ad the dimension is capped at 20 of 25 and the report says so. A generic skill inventory is not
  a match score.
- Keyword stuffing is penalised above a repetition threshold.

**The structural limit.** Matching is exact, over a hand-written vocabulary in `taxonomy.ts` plus its synonym
variants. If the ad says `Kubernetes` and the CV says `K8s`, the match happens only because someone wrote that
pair into the taxonomy. Every unlisted synonym is a silent, unfair loss of points, and the vocabulary cannot
be grown by hand fast enough to close the gap.

This is the gap the planned in-browser embedding layer is meant to close: semantic similarity without a
hand-maintained list, and without the CV leaving the browser.

**Not implemented:**

- Semantic or embedding-based matching.
- Weighting a term by where it appears in the CV. A skill in a recent role should outrank one in a 2013 role.
- Seniority and title matching, which is often a hard filter rather than a ranking signal.

---

## Impact (20)

Not a parser concern. This is what decides whether the human who opens the file keeps reading.

**Implemented** — see `lib/scoring/impact.ts`:

- Under 15% of bullets carry a figure — 6 points; under 35% — 3 points.
- Under 35% of bullets open with an ownership verb — 4 points. Verb lists exist for all three languages.
- Bullets longer than 38 words — 2 points. The result ends up buried at the end.
- Responsibility phrasing (`responsible for`, `verantwortlich für`, `sorumluydum`) — 3 or 1 points.
- Unsupported character claims (`team player`, `belastbar`, `takım oyuncusu`) — 2 points.
- Heavy first-person narration — 2 points.

---

## Contact (10)

The one thing the system must lift out in order to build a candidate record at all.

**Implemented** — see `lib/scoring/contact.ts`: email (4), phone (3), profile link (2), location (1), a
recognisable name in the first six lines (2).

**Known defect.** The phone pattern uses `[\s./-]` as a separator, and `\s` matches newlines, so the match
runs across lines. A German address block with a postcode above a date line — `Berlin 10115` over
`2019 - 2024 Acme GmbH` — matches as `10115\n2019`, nine digits, and the missing-phone finding is suppressed.
Verified by running the pattern directly. The fix is to match per line.

---

## The scoring invariant

A dimension's score is `max - sum(cost of its findings)`, clamped to `[0, max]`. This is not a style
preference: the report claims every lost point is explained, and the UI is built on that promise.
`tests/scoring.test.ts` asserts it.

Therefore a deduction is never applied directly. It is a `FindingDraft` with a `cost`, and the score falls
out of it.

### Adding a check

1. Put the `FindingDraft` in the dimension file it belongs to, with an `id` namespaced by dimension
   (`parse.columns`).
2. `title` states the defect. `detail` gives the evidence. `fix` gives one concrete instruction.
3. Add a fixture that triggers it and one that does not.
4. If the new cost pushes a dimension's realistic floor to zero, rebalance the existing costs rather than
   letting one check dominate. A dimension every real CV fails carries no information.

## What this engine does not claim

- It does not reproduce any named vendor's parser. The rules describe how mainstream extractors behave, not
  how Workday or SuccessFactors behaves.
- It does not predict an invitation. A high score means nothing stands between the document and a human
  reader; it says nothing about whether that reader will be interested.
- Costs are calibrated by judgement, not measured against hiring outcomes. They are defensible, not empirical.

# Peaceful Origami — Complete Findings Catalogue

**Version:** 1.0 · 2026-10-06  
**Scope:** Every finding the deterministic engine can produce, with cost, severity, evidence and fix.

This document is the single reference for what the scoring engine checks, why it matters, and how to fix it. Each finding is a named defect with a fixed cost. The total score is `100 - sum(cost of all findings)`, clamped to `[0, 100]`.

---

## How to read this document

Each finding carries:

- **ID** — namespaced by dimension (`parse.columns`, `contact.email`, etc.)
- **Severity** — `critical`, `high`, `medium`, `low`
- **Cost** — points deducted from the dimension's maximum
- **Title** — a statement of the defect
- **Detail** — the evidence, with numbers from the actual document
- **Fix** — a concrete instruction
- **Evidence** — optional, lines or terms from the document that triggered the finding

The engine never adjusts a score directly. Adding a deduction means adding a `FindingDraft` with a `cost`. The report's claim that every lost point is explained depends on this invariant.

---

## Dimension 1: Parseability (25 points)

**What it measures:** Whether the text layer survives extraction. Columns, tables, icon fonts, broken encodings — everything that can scramble the document before a parser sees it.

### parse.too-little-text

- **Severity:** critical
- **Cost:** 13
- **Title:** Almost no machine-readable text
- **Detail:** Only {words} words could be read. A scanned or image-based PDF looks empty to a parser.
- **Fix:** Export the CV from the original document as a text PDF, or paste the text manually.
- **Trigger:** `stats.words < 150`

### parse.thin-text

- **Severity:** high
- **Cost:** 6
- **Title:** Very little text extracted
- **Detail:** {words} words is below what a full CV normally yields. Part of the document may sit in images or text boxes.
- **Fix:** Check that every section is real text, not a picture or a graphic element.
- **Trigger:** `stats.words < 260` (and `>= 150`)

### parse.letter-spacing

- **Severity:** high
- **Cost:** 5
- **Title:** Letters extracted one by one
- **Detail:** The text layer breaks words into single characters, usually caused by heavy letter-spacing or an outlined font.
- **Fix:** Turn off manual letter-spacing and embed a standard font before exporting.
- **Trigger:** `tokens.length > 100 && ratio(singleChars, tokens.length) > 0.16`

### parse.columns

- **Severity:** high
- **Cost:** 5
- **Title:** Multi-column or table layout detected
- **Detail:** Many lines contain wide gaps, the signature of side-by-side columns or a table. Parsers read those left to right and mix the content up.
- **Fix:** Rebuild the CV in a single column with no tables for text content.
- **Evidence:** Lines matching `/\S {3,}\S/` (first 3)
- **Trigger:** `lines.length > 20 && ratio(columnLines, lines.length) > 0.18`

### parse.table-markers

- **Severity:** medium
- **Cost:** 3
- **Title:** Table structure in the text layer
- **Detail:** Tab stops or pipe characters suggest the content is laid out in a table grid.
- **Fix:** Move skills and dates out of tables; a plain list parses reliably.
- **Trigger:** `countMatches(raw, /\t/g) > 12 || countMatches(raw, /\|/g) > 12`

### parse.decorative-bullets

- **Severity:** low
- **Cost:** 2
- **Title:** Decorative bullet glyphs
- **Detail:** {glyphs} symbol bullets found. Some parsers drop them and glue lines together.
- **Fix:** Use a plain hyphen or the standard bullet from the word processor.
- **Trigger:** `glyphs > 30`

### parse.encoding

- **Severity:** critical
- **Cost:** 7
- **Title:** Broken character encoding
- **Detail:** The text layer contains replacement or CID placeholders, so characters are lost on extraction.
- **Fix:** Embed the fonts when exporting, or export through a different PDF writer.
- **Trigger:** `//.test(raw) || /\(cid:\d+\)/.test(raw)`

### parse.mojibake

- **Severity:** high
- **Cost:** 5
- **Title:** Turkish or German letters were decoded with the wrong code page
- **Detail:** {mojibake} mojibake sequences appear in the text layer — the two-character artefacts a UTF-8 document leaves when something reads it as CP1252. Every special letter of a Turkish or German CV is destroyed with it, so names, headings and skills stop matching.
- **Fix:** Re-export the PDF with embedded fonts from the source document, or save the text through an editor that detects UTF-8 before uploading.
- **Evidence:** Lines containing mojibake pairs (first 3)
- **Trigger:** `mojibake >= 2`

### parse.garbled-text

- **Severity:** high
- **Cost:** 6
- **Title:** Most of the text sits outside the Latin character blocks
- **Detail:** {percentage}% of the {letters} letters read are outside Basic Latin, Latin-1 Supplement and Latin Extended-A. For a CV written in a European language that points at a broken text layer, such as a font subset mapped onto the wrong code points.
- **Fix:** Re-export the CV with embedded fonts, or rebuild the file from the source document.
- **Trigger:** `letters >= 50 && ratio(outside, letters) > 0.3`

### parse.page-furniture

- **Severity:** low
- **Cost:** 2
- **Title:** Header or footer repeats on every page
- **Detail:** Repeated lines get pulled into the middle of the parsed text and break up sentences.
- **Fix:** Keep headers and footers minimal, and never put contact details there.
- **Evidence:** Repeated lines (first 3)
- **Trigger:** `furniture.length > 0` (lines repeated 3+ times, 8–90 chars)

### parse.no-line-structure

- **Severity:** medium
- **Cost:** 4
- **Title:** No line breaks survived extraction
- **Detail:** The whole CV came out as a few long runs of text, so headings and bullets cannot be told apart.
- **Fix:** Export from the source document instead of printing to PDF through a viewer.
- **Trigger:** `lines.length < 12 && stats.words > 300`

### parse.split-email

- **Severity:** medium
- **Cost:** 3
- **Title:** Email address broken by spacing
- **Detail:** The address is split across characters or lines, so it will not be picked up as contact data.
- **Fix:** Write the address on one line as plain text, with no link styling.
- **Trigger:** `/\s@\s|\s@[a-z]|[a-z]@\s/i.test(raw)`

### parse.icon-font

- **Severity:** medium
- **Cost:** 3
- **Title:** Icon font or emoji used for information
- **Detail:** {icons} icon characters found. Phone and mail icons carry no meaning for a parser.
- **Fix:** Label contact details with words instead of icons.
- **Trigger:** `icons > 6` (private-use + emoji)

---

## Dimension 2: Contact (10 points)

**What it measures:** Name, email, phone, location, profile link. The one thing an ATS must lift out of the document.

### contact.email

- **Severity:** critical
- **Cost:** 4
- **Title:** No email address found
- **Detail:** Without a parseable address the application can end up in the system with no way to reply to it.
- **Fix:** Put the address on its own line as plain text near the top.
- **Trigger:** `!EMAIL.test(raw)`

### contact.phone

- **Severity:** high
- **Cost:** 3
- **Title:** No phone number found
- **Detail:** Recruiters filter on reachability; a missing number drops the record in some systems.
- **Fix:** Add the number in international format, for example +49 151 1234567.
- **Trigger:** `!phoneCandidate || phoneCandidate[0].replace(/\D/g, "").length < 8`

### contact.profile

- **Severity:** medium
- **Cost:** 2
- **Title:** No professional profile link
- **Detail:** A LinkedIn, Xing or GitHub URL is a field most systems store and recruiters search on.
- **Fix:** Add the full URL as text, not as a hidden hyperlink behind an icon.
- **Trigger:** `!PROFILE.test(raw)`

### contact.location

- **Severity:** low
- **Cost:** 1
- **Title:** No location given
- **Detail:** Location drives shortlisting filters for on-site and hybrid roles.
- **Fix:** Add city and country, or state that you work remotely.
- **Trigger:** `!PLACE.test(raw)`

### contact.name

- **Severity:** medium
- **Cost:** 2
- **Title:** Name not recognisable at the top
- **Detail:** The first lines hold no plain first-name/last-name pair, so name detection falls back to guessing.
- **Fix:** Start the document with your name on its own line, without styling tricks.
- **Trigger:** `!lines.slice(0, 6).some(looksLikeName)`

### Market-specific findings

Additional findings from `lib/scoring/market.ts` based on the target market (DE, TR, or default). These judge the personal-data block: photo, date of birth, marital status, military service.

---

## Dimension 3: Structure (20 points)

**What it measures:** Headings a parser can map to fields, dated entries in reverse order, bullets over paragraphs.

### structure.missing-{section}

- **Severity:** high
- **Cost:** 4 (each)
- **Title:** No "{section}" heading
- **Detail:** Section mapping looks for this heading by name. Without it the content below is filed as unclassified text.
- **Fix:** Add a plain heading on its own line, literally called "{section}".
- **Trigger:** Core section missing (experience, skills, education)

### structure.missing-summary

- **Severity:** low
- **Cost:** 1
- **Title:** No summary at the top
- **Detail:** A short profile gives both the keyword parser and the human reader the role you are targeting.
- **Fix:** Open with three lines naming your role, years of experience and core stack.
- **Trigger:** `!present.has("summary")`

### structure.no-dates

- **Severity:** high
- **Cost:** 4
- **Title:** No dates on the entries
- **Detail:** Employment periods cannot be built without years, so tenure filters skip the record.
- **Fix:** Date every role as MM/YYYY - MM/YYYY.
- **Trigger:** `stats.years.length < 2`

### structure.date-format

- **Severity:** medium
- **Cost:** 3
- **Title:** Dates are not written as ranges
- **Detail:** Years appear in the text but not as start-to-end ranges a parser can pair up.
- **Fix:** Write both ends of every period, using "present" for the current role.
- **Trigger:** `context.experience.periods.length === 0 && context.experience.reversed.length === 0`

### structure.mixed-date-formats

- **Severity:** medium
- **Cost:** 2
- **Title:** Dates are written in more than one format
- **Detail:** The document mixes these endpoint shapes: {formats}. A parser tuned to one format reads the others as noise or drops them.
- **Fix:** Pick one format, MM/YYYY - MM/YYYY, and use it on every entry.
- **Trigger:** `dateFormats.formats.size > 1`

### structure.nonstandard-present

- **Severity:** low
- **Cost:** 1
- **Title:** The current role does not end in a word parsers know
- **Detail:** Open-ended roles are marked with {forms}. Stricter parsers only expect "present" (or its language equivalent) and may drop the endpoint.
- **Fix:** Write "present", "heute" or "halen" for the current role.
- **Evidence:** Nonstandard present markers (first 3)
- **Trigger:** `nonstandardPresent.length > 0`

### structure.reversed-dates

- **Severity:** high
- **Cost:** 4
- **Title:** A date range ends before it starts
- **Detail:** The end of the period is earlier than its beginning, so no employment record can be built from it and the role is skipped.
- **Fix:** Write the earlier date first: 03/2019 - 08/2022.
- **Evidence:** Reversed date ranges (first 3)
- **Trigger:** `context.experience.reversed.length > 0`

### structure.chronology

- **Severity:** medium
- **Cost:** 3
- **Title:** Experience is not in reverse-chronological order
- **Detail:** Most systems assume the first role listed is the current one and rank seniority from it.
- **Fix:** Put the newest role first and work backwards.
- **Trigger:** `!isDescending(experienceYears(context))`

### structure.europass

- **Severity:** medium
- **Cost:** 2
- **Title:** This is a Europass CV / This looks like a Europass CV
- **Detail:** The Europass template fixes every entry into a two-column table with a label cell on the left. Parsers that read across the columns weld the labels into the answers, and the frame cannot be tightened when the document runs long.
- **Fix:** Rebuild the CV in a single column with plain headings. Keep the content; drop the template.
- **Evidence:** Europass markers
- **Trigger:** `europass.detected`

### structure.no-bullets

- **Severity:** medium
- **Cost:** 3
- **Title:** Responsibilities written as paragraphs
- **Detail:** Dense blocks hide the achievements that keyword and relevance scoring look for.
- **Fix:** Break each role into four to six bullets.
- **Trigger:** `stats.bulletLines === 0 && stats.words > 250`

### structure.too-short

- **Severity:** medium
- **Cost:** 3
- **Title:** The CV is very short
- **Detail:** {words} words gives keyword matching almost nothing to work with.
- **Fix:** Describe each role with concrete tasks, tools and outcomes.
- **Trigger:** `stats.words < 280`

### structure.too-long

- **Severity:** low
- **Cost:** 2
- **Title:** The CV runs long
- **Detail:** {words} words is roughly {pages} pages. Relevance gets diluted and older roles crowd out recent ones.
- **Fix:** Keep the last ten years detailed and compress the rest to one line each.
- **Trigger:** `stats.words > 1500`

---

## Dimension 4: Keyword Match (25 points)

**What it measures:** Coverage of terms mined from the job ad, weighted by how central each is to the posting.

### keywords.no-job-description

- **Severity:** medium
- **Cost:** 5
- **Title:** Scored without a job ad
- **Detail:** Keyword relevance is always relative to one vacancy. Without it only a generic skill inventory can be checked, so this dimension is capped at 20 of 25.
- **Fix:** Paste the job ad and run the analysis again for a real match score.
- **Trigger:** `jobDescription.trim().length < 120`

### keywords.thin-skill-inventory

- **Severity:** high (if < 6 skills) or medium
- **Cost:** variable (up to 20)
- **Title:** Few recognisable skill terms
- **Detail:** {distinct} known tools or methods appear in the text. Recruiter searches run on exactly these terms.
- **Fix:** Name concrete tools, frameworks and methods in the skills section and inside the role bullets.
- **Trigger:** `baselineScore < 20` (when no job ad)

### keywords.coverage

- **Severity:** critical (< 30%), high (< 50%), or medium
- **Cost:** variable (up to 25)
- **Title:** {coverage}% of the vacancy's key terms appear in the CV
- **Detail:** The highest-weighted terms that are absent: {terms}.
- **Fix:** Work the missing terms into real sentences about what you actually did. Never paste a keyword list.
- **Evidence:** Missing terms (first 8)
- **Trigger:** `rawScore < 25`

### keywords.acronym-pair

- **Severity:** low
- **Cost:** 1
- **Title:** Some terms match only through a variant spelling
- **Detail:** {count} vacancy term(s) match your CV only via an alias: {aliases}. A filter without a synonym table matches literally and misses these.
- **Fix:** Write both forms once where they appear naturally, e.g. "Kubernetes (k8s)".
- **Evidence:** Alias pairs (first 5)
- **Trigger:** `aliasOnly.length > 0`

### keywords.listed-only

- **Severity:** low
- **Cost:** 1 (if < 4 terms) or 2
- **Title:** Some matched terms exist only as list items
- **Detail:** These terms appear in the skills list but in no sentence about actual work: {terms}. A list item carries no evidence, and both parsers and recruiters weight a term used in context higher.
- **Fix:** Work the strongest of these into an experience bullet that shows where and how you used it.
- **Evidence:** Listed-only terms (first 6)
- **Trigger:** `listedOnly.length > 0`

### keywords.experience-gap

- **Severity:** high (>= 2 years gap) or medium
- **Cost:** 3 or 2
- **Title:** The ad asks for {years}+ years; the parsed dates add up to less
- **Detail:** The date ranges in the CV total {duration}. A tenure filter compares exactly these two numbers before a human reads anything.
- **Fix:** If the total understates your real experience, make the timeline complete: concurrent roles, trimmed older roles and unexplained gaps all read as less time.
- **Evidence:** Requirement source line
- **Trigger:** `gapMonths >= 6`

### keywords.stuffing

- **Severity:** medium
- **Cost:** 2
- **Title:** Keyword stuffing detected
- **Detail:** {terms with counts}, far more than natural writing would.
- **Fix:** Keep two or three mentions in context and delete the rest. Recruiters and modern parsers both penalise padding.
- **Evidence:** Overused terms
- **Trigger:** `overused.length > 0` (terms with > 12 hits)

---

## Dimension 5: Impact (20 points)

**What it measures:** Quantified results and ownership verbs, against responsibility filler.

### impact.no-numbers

- **Severity:** high
- **Cost:** 6
- **Title:** Almost no measurable results
- **Detail:** {quantified} of {bullets} bullets contain a number. Claims without a figure read as job descriptions rather than achievements.
- **Fix:** Add scale or outcome to at least a third of the bullets: runtime cut from 40 to 12 minutes, 15 testers onboarded, coverage raised to 80%.
- **Trigger:** `bullets.length >= 4 && quantifiedRatio < 0.15`

### impact.few-numbers

- **Severity:** medium
- **Cost:** 3
- **Title:** Thin on measurable results
- **Detail:** Only {percentage}% of bullets carry a figure.
- **Fix:** Quantify the outcomes you remember best; an estimate with a unit beats no number at all.
- **Trigger:** `bullets.length >= 4 && quantifiedRatio < 0.35`

### impact.weak-verbs

- **Severity:** medium
- **Cost:** 4
- **Title:** Bullets do not open with an action
- **Detail:** {percentage}% of bullets start with an ownership verb. The rest open with nouns or filler.
- **Fix:** Start each bullet with what you did: built, migrated, automated, reduced.
- **Trigger:** `verbRatio < 0.35`

### impact.hedging

- **Severity:** low
- **Cost:** 2
- **Title:** Bullets hedge instead of claiming the work
- **Detail:** {hedged} of {bullets} bullets qualify your contribution with phrases like "familiar with" or "Grundkenntnisse". A hedged claim reads as no claim at all.
- **Fix:** Rewrite each one as something you did: the action, the tool and the part you owned.
- **Evidence:** Hedged bullets (first 3, truncated to 120 chars)
- **Trigger:** `ratio(hedged.length, bullets.length) >= 0.15`

### impact.long-bullets

- **Severity:** low
- **Cost:** 2
- **Title:** Bullets run into paragraphs
- **Detail:** {count} bullets are longer than 38 words, which buries the result at the end.
- **Fix:** Keep a bullet to one action and one outcome, under two lines.
- **Evidence:** Long bullets (first 2, truncated)
- **Trigger:** `longBullets.length > Math.max(2, bullets.length * 0.25)`

### impact.no-numbers-at-all

- **Severity:** high
- **Cost:** 6
- **Title:** No figures anywhere in the document
- **Detail:** Nothing in the text quantifies scope, scale or outcome.
- **Fix:** Add team sizes, volumes, durations and before/after numbers to the recent roles.
- **Trigger:** `bullets.length < 4 && !/\d/.test(raw)`

### impact.generic-phrasing

- **Severity:** medium
- **Cost:** 3
- **Title:** Responsibility phrasing instead of results
- **Detail:** "Responsible for" and its variants appear {count} times. They describe a job title, not your contribution.
- **Fix:** Rewrite each one as an action plus an outcome.
- **Trigger:** `generic >= 3`

### impact.some-generic-phrasing

- **Severity:** low
- **Cost:** 1
- **Title:** Some responsibility phrasing left
- **Detail:** {count} bullet(s) still open with a responsibility phrase.
- **Fix:** Swap them for an action verb.
- **Trigger:** `generic > 0 && generic < 3`

### impact.inflated-language

- **Severity:** low
- **Cost:** 1
- **Title:** Inflated verbs and filler padding
- **Detail:** {terms} add words without adding facts. Plain verbs read as more credible, and shorter bullets survive the six-second scan.
- **Fix:** Swap each one for the plain verb: "led", "used", "to". Delete the filler outright.
- **Evidence:** Inflated terms (first 5)
- **Trigger:** `inflated.length > 0`

### impact.buzzwords

- **Severity:** low
- **Cost:** 2
- **Title:** Unsupported character claims
- **Detail:** {count} generic self-descriptions such as "team player" appear. They carry no keyword value and no evidence.
- **Fix:** Replace them with a situation that demonstrates the trait.
- **Trigger:** `buzzwords >= 3`

### impact.first-person

- **Severity:** low
- **Cost:** 2
- **Title:** Heavy first-person narration
- **Detail:** CV bullets conventionally drop the pronoun; it costs space and reads as a cover letter.
- **Fix:** Cut "I" and start from the verb.
- **Trigger:** `stats.words > 200 && ratio(pronouns, stats.words) > 0.035`

---

## Summary

**Total possible score:** 100  
**Dimensions:** 5  
**Total findings:** 50+ (including market-specific and variable-cost findings)

The engine never adjusts a score directly. Each finding is a `FindingDraft` with a fixed `cost`. The total is `100 - sum(cost of all findings)`, clamped to `[0, 100]`. Every lost point is attributable to a named finding with evidence and a fix.

---

## How to use this document

1. **Run an analysis.** The engine returns a list of findings, each with an `id`, `cost`, `severity`, `title`, `detail`, `fix` and optional `evidence`.
2. **Read the findings in order.** They are ranked by cost (highest first), then severity.
3. **Fix the top finding.** Follow the `fix` instruction.
4. **Re-run the analysis.** The score updates immediately. The finding disappears if the defect is gone.
5. **Repeat.** Each fix recovers the points listed in the `cost` field.

The report claims every lost point is explained. This document is the source of truth for what the engine checks and why.

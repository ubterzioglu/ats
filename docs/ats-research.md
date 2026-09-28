# ATS research notes

Outside sources, gathered September 2026, to check `ats-rules.md` against something other than our own
judgement. Read this as evidence of varying quality, not as fact: most of the ATS advice industry is written
by companies selling resume tools, and several of its most repeated claims turn out to have no source at all.

Where a claim is well supported it is marked **supported**. Where it is contested or unsourced it is marked
**disputed**, and those are the ones worth caring about, because our product copy must not repeat them.

---

## What the pipeline is

Consistent across sources, and it matches the model in `ats-rules.md`:

The system reads the file, extracts a text layer, converts it into structured candidate fields — name, email,
phone, current title, employer — and stores those so recruiters can search and filter rather than opening
documents one by one. Parsing extracts a fixed set of fields the vendor chose, not everything on the page.

Two consequences worth keeping:

- A readable text layer is a precondition. Scans, photographs and image-heavy PDFs have nothing to extract.
- Anything outside the vendor's chosen fields is not captured as data, however well it is written.

**Supported.** Workable, Kula and iReformat describe the same sequence.

---

## Layout

**Multi-column and tables break reading order.** ATS reads top to bottom, left to right. Content from
different sections merges, sidebars may be read as separate documents entirely, and tables and grids merge
unrelated data into gibberish.

This is the single most repeated rule in the literature and the one our `parse.columns` check exists for. It
is also the rule with the most consistent agreement across sources.

**Supported.** Jobscan, Workable, Upskillist.

**Text boxes and shapes** are grouped with tables as content that frequently does not extract. We do not
detect these yet — noted as a gap in `ats-rules.md`.

---

## Headers and footers

**Contact details in the document header or footer are frequently lost.** A large share of parsers skip the
header and footer region, so a name or email placed there is never captured. Contact information belongs in
the first lines of the body.

This sharpens our `parse.page-furniture` check, which currently detects repeated furniture but does not check
whether it holds the only copy of the contact data. That gap is worth closing: the failure it describes is
total, not partial — the candidate record is built without a way to reply to it.

**Supported.** Jobscan, Santa Clara University career centre.

---

## File format

More nuanced than the folklore, and the sources disagree:

- `.docx` is described as the most widely accepted and safest format.
- Several 2026 sources say text-selectable PDF now parses as cleanly as DOCX in Workday, Greenhouse and Lever.
- The consistent advice: follow the posting if it names a format; otherwise DOCX or a **text-based** PDF.
- PDF is preferred when emailing a human directly, where layout fidelity matters more than parsing.

**Partly disputed.** The disagreement is about which of DOCX and PDF is safer, not about the thing that
actually matters — that the file must have a real text layer. Our DOCX warning ("most employers receive a
PDF, so export to PDF and check that score too") is defensible but states more certainty than the sources do.
Worth softening.

**Sources:** Hireflow, CVCraft, Resumemate, Jobscan.

---

## Fonts and type

Web-safe faces (Arial, Calibri, Garamond, Georgia, Times New Roman), 10–12pt body, 14–16pt headings.

The font rule matters for a mechanical reason rather than an aesthetic one: an unembedded or exotic font is
what produces the `(cid:N)` and replacement characters our `parse.encoding` check looks for. The point size
advice has no parsing consequence at all and we should not score it.

**Supported for embedding; not a parsing issue for size.** ATS Resume AI, Elite Resumes.

---

## Section headings

**Standard names parse; creative ones do not.** "Work Experience", "Education", "Skills", "Certifications"
are universally recognised, and variations such as "Professional Experience" or "Technical Skills" also work.
A section named "My Journey" may be classified as a biography block, and every keyword inside it ignored.

That last detail is the important one and we model it correctly: an unrecognised heading does not merely lose
the heading, it removes the content beneath it from classification. Our 4-point cost per missing core section
is defensible on those grounds.

**Supported.** JobShinobi, JobMentis, Upskillist.

---

## Dates

Inconsistent date formats cause experience to be miscalculated or ignored. Recommended: `MM/YYYY` or
`Month YYYY`. Seasons and year-only ranges are called out as problems, as is mixing `March 2023` with
`03/2023` in one document.

We check for the presence of ranges (`structure.date-format`) but not for **consistency between** formats,
and not for locale-ambiguous dates such as `03/04/2022`. Both are listed as gaps.

**Supported.** JobMentis, Upskillist, ResumeAdapter.

---

## Claims we should not repeat

This section exists because our copy rules forbid overselling, and the ATS advice industry oversells
constantly. These are the claims to keep out of the product.

### "75% of resumes are rejected by ATS before a human sees them"

**Disputed, and probably false.** Researchers tracing the figure land on a 2012 marketing claim by Preptel, a
resume-software vendor that shut down in 2013 without ever publishing a study, a sample size or a
methodology. The number drifts between 70%, 75% and 88% depending on who repeats it — which is itself the
tell, since a real statistic has one value and one source.

### "The ATS auto-rejects resumes"

**Disputed.** An ATS parses, stores, filters and ranks; humans decide rejections. In one survey of 25 US
recruiters only 8% had configured any content-based auto-rejection, with 92% reporting their system does not
auto-reject on formatting, content or design.

This matters for us directly. Our front page says a low score means the document may be "dropped or
misread". "Misread" is supportable. "Dropped" implies automatic rejection and overstates what these systems
do. Worth revisiting the band labels in `lib/scoring/index.ts`.

### "Keyword stuffing works"

**False, and counterproductive.** Modern parsers weigh context and placement rather than raw frequency, and
recruiters see keyword walls immediately since many systems show the original document beside the parsed
profile. Our `STUFFING_THRESHOLD` penalty is aligned with the evidence.

### "White text hides keywords from humans but feeds the ATS"

**False on the mechanics.** A parser extracts the text layer and does not render colour, so white-on-white
text is read exactly as visible text — there is no hidden advantage to gain. Several systems now flag hidden
text and out-of-context term lists explicitly.

**Sources:** The Interview Guys, HR.com, ATSVerification, AIResume.guru, Resumefast.

---

## What this changes for us

Ordered by how much it would improve the product:

1. **Detect contact data inside repeated headers and footers.** Well supported, total failure mode, and we
   already detect the furniture — only the second half of the check is missing.
2. **Check date format consistency**, not just the presence of ranges.
3. **Revisit the "risky" band label.** "Likely to be dropped" leans on the auto-rejection myth our own
   research says is unsupported.
4. **Soften the DOCX warning** to match what the sources actually support.
5. **Do not add**: font size scoring, a "75%" statistic anywhere in the copy, or any claim about rejection
   rates.

---

## Sources

- [What is resume parsing? How an ATS reads a resume — Workable](https://resources.workable.com/stories-and-insights/how-ATS-reads-resumes)
- [ATS Resume Parsing: How Applicant Tracking Systems Screen Resumes — Kula](https://www.kula.ai/blog/ats-resume-parsing)
- [What is Resume Parsing? How ATS Systems Read Resumes — iReformat](https://ireformat.com/glossary/resume-parsing)
- [5 Critical ATS Resume Formatting Mistakes to Avoid in 2026 — Jobscan](https://www.jobscan.co/blog/ats-formatting-mistakes/)
- [Anatomy of an ATS Friendly Resume Format — Jobscan](https://www.jobscan.co/blog/20-ats-friendly-resume-templates/)
- [Common ATS Resume Formatting Mistakes — Santa Clara University](https://www.scu.edu/careercenter/toolkit/job-scan-common-ats-resume-formatting-mistakes/)
- [ATS Parsing: Common Resume Mistakes to Avoid — Upskillist](https://www.upskillist.com/blog/ats-parsing-common-resume-mistakes-to-avoid/)
- [ATS Optimized Resume Section Headings That Parse — JobShinobi](https://www.jobshinobi.com/blog/ats-optimized-resume-section-headings-that-parse)
- [ATS-Friendly Resume Structure (2026) — JobMentis](https://www.jobmentis.com/en/guide/resume-structure)
- [PDF vs DOCX for ATS — Hireflow](https://hireflow.net/blog/pdf-vs-docx-for-ats-which-one-should-you-submit-in-2026)
- [PDF vs DOCX for ATS in 2026 — CVCraft](https://cvcraft.roynex.com/blog/pdf-vs-docx-resume-ats-2026)
- [PDF vs Word for Resume 2026 — Resumemate](https://www.resumemate.io/blog/pdf-vs-word-for-resume-2026-which-format-ats-actually-prefers/)
- [ATS Resume Font Size, Margins & Paper Size — ATS Resume AI](https://www.atsresumeai.com/blog/ats-resume-formatting-guide)
- [ATS Resume Formatting: Do's and Don'ts for 2026 — Elite Resumes](https://eliteresumes.co/career-resources/ats-optimization/ats-formatting.html)
- [The ATS Resume Rejection Myth — The Interview Guys](https://blog.theinterviewguys.com/ats-resume-rejection-myth/)
- [ATS Rejection Myth Debunked: 92% of Recruiters Confirm — HR.com](https://www.hr.com/en/app/blog/2026/04/ats-rejection-myth-debunked-92-of-recruiters-confi_mntajhyq.html)
- [10 ATS Resume Myths, Debunked — ATSVerification](https://atsverification.com/blog/ats-resume-myths-debunked/)
- [White Text & Hidden Keywords on Resumes — AIResume.guru](https://airesume.guru/blog/hidden-keywords-white-text-on-resumes-the-myth-that-gets-you-blacklisted)
- [Keyword Stuffing on Resumes: Why It Backfires — Resumefast](https://www.resumefast.io/blog/resume-keyword-stuffing)

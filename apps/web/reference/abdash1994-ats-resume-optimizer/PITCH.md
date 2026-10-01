# ATS Resume Optimizer — Pitch

> Stop getting rejected before a human ever reads your resume.

## The Problem

75% of resumes are eliminated by Applicant Tracking Systems (ATS) before reaching a recruiter. These systems are dumb, but they're gatekeepers. They reject qualified candidates because:

- The resume uses two columns (most ATS can't parse them)
- It says "Work History" instead of "Work Experience"
- It lists "ML" but the JD requires "Machine Learning"
- The PDF was exported from Canva (Taleo fails on 41% of design PDFs)

Every existing tool that claims to fix this either costs money, uploads your private resume to their servers, or gives generic advice that doesn't reflect how real ATS systems actually work.

## The Solution

**ATS Resume Optimizer** is a free, offline-capable web app that:

1. **Reads any resume** — PDF, Word, HTML, Markdown, or a photo (OCR)
2. **Analyzes any job description** — extracts required keywords using TF-IDF
3. **Scores against 15+ real ATS systems** — Taleo, Workday, Greenhouse, iCIMS, Lever, SAP, ADP, and more
4. **Shows exactly what to fix** — ranked by impact, with one-click auto-fixes
5. **Exports an ATS-safe file** — clean DOCX or PDF that machines can actually read

The score updates live as you edit. No server. No account. No cost.

## How Scoring Works

```
Total Score =
  Keyword Match        30%  ← JD keywords found in your resume
  ATS Format           25%  ← No tables, columns, images, bad fonts
  Section Completeness 20%  ← Right sections with correct names
  Achievement Quality  15%  ← Quantified bullets + strong action verbs
  Contact & Meta        5%  ← Email, phone, LinkedIn, location
  Length & Density      5%  ← Word count right for experience level
```

Each dimension drills into specific fixable items with explanations. Target: **90%+**.

## ATS Systems Covered

| System | Market | Key rules |
|--------|--------|-----------|
| Taleo (Oracle) | Fortune 500 | Exact keyword match, DOCX preferred, paste-field critical |
| Workday | Enterprise | Section name matching, strict date format |
| Greenhouse | Tech startups | Human scorecard — clarity over keyword density |
| iCIMS | Global | Keyword density, single column required |
| Lever | Tech/startups | Semantic match, GitHub/portfolio links valued |
| SAP SuccessFactors | Enterprise | Chronological order, exact section names |
| Jobvite | Mid-market | MM/YYYY dates, PDF preferred |
| ADP | SMB/Enterprise | Legacy parser, no special characters |
| BambooHR | SMB | Straightforward keyword match |
| SmartRecruiters | Global | AI-assisted, modern format handling |
| Bullhorn | Staffing | Skills taxonomy match |
| JazzHR | SMB | Keyword frequency weighted |
| Rippling | Tech | Skills focused, LinkedIn integration |
| Ashby | Dev startups | GitHub links, projects section valued |
| Workable | Global SMB | Multilingual, standard sections |

## Key Differentiators

| Feature | This tool | Resume.io | Jobscan | Google Docs |
|---------|-----------|-----------|---------|-------------|
| Free | ✓ | ✗ ($) | ✗ ($) | ✓ |
| Private (no server) | ✓ | ✗ | ✗ | ✗ |
| Works offline | ✓ | ✗ | ✗ | ✗ |
| Parses images (OCR) | ✓ | ✗ | ✗ | ✗ |
| 15+ ATS rules | ✓ | ✗ | Partial | ✗ |
| Real-time score | ✓ | ✗ | ✓ | ✗ |
| No account needed | ✓ | ✗ | ✗ | ✗ |
| Open source | ✓ | ✗ | ✗ | ✗ |

## Privacy Guarantee

Your resume never leaves your device. Everything — parsing, scoring, editing — runs in your browser. There is no backend. No database. No analytics. No cookies. The code is fully open source and auditable.

## Tech Stack

- **Next.js 16 + TypeScript** — framework
- **pdfjs-dist, mammoth, Tesseract.js** — browser-native parsers
- **Custom TF-IDF engine + researched ATS rules** — scoring
- **IndexedDB** — local offline persistence
- **Vercel free tier** — deployment, auto-deploys on push

## Get Started

```bash
git clone https://github.com/abdash1994/ats-resume-optimizer
cd ats-resume-optimizer
npm install && npm run dev
```

Or deploy in one click: [vercel.com/new](https://vercel.com/new/clone?repository-url=https://github.com/abdash1994/ats-resume-optimizer)

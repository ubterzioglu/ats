# ATS Resume Optimizer

> Stop getting auto-rejected. Upload any resume, paste any job description, get a real-time ATS score, fix every issue, download a resume that passes. Free forever.

**Live demo:** [ats-resume-optimizer-9zrzogvgu-abdash1994s-projects.vercel.app](https://ats-resume-optimizer-9zrzogvgu-abdash1994s-projects.vercel.app) · **Pitch deck:** [PITCH.md](PITCH.md) · **Setup guide:** [SETUP.md](SETUP.md)

---

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abdash1994/ats-resume-optimizer)

---

## What It Does

| Step | What happens |
|------|-------------|
| **Upload** | Drag in your resume — PDF, Word, HTML, Markdown, or even a photo. It reads them all. |
| **Analyze** | Paste the job description. The engine extracts required keywords using TF-IDF, detects your role category, and maps the JD to known ATS scoring patterns. |
| **Score** | Your resume is scored across 6 dimensions against 15+ ATS systems simultaneously. You see exactly why you're failing — and by how much. |
| **Fix** | Edit your resume inside the app. Missing keywords are highlighted. One-click applies fixes to your skills section. The score updates live as you type. |
| **Export** | Download an ATS-safe DOCX or PDF — single column, plain fonts, no tables, no graphics. The format ATS systems can actually read. |

---

## Why This Exists

Modern hiring is broken. A resume that would impress any human gets auto-rejected because:
- It uses two columns (most ATS can't parse multi-column layouts)
- It says "Work History" instead of "Work Experience"  
- It lists "ML" but the ATS searches for "Machine Learning"
- The PDF was made in Canva (Taleo has a 41% parse error rate on design PDFs)

This tool fixes all of that — for free, without your data ever leaving your device.

---

## Features

### Resume Parsing (Any Format)
- **PDF** — Mozilla's pdf.js, runs in browser, no server
- **Word (.docx)** — mammoth.js, full text extraction
- **HTML** — native DOMParser
- **Markdown** — strip syntax, extract structure
- **Images / Photos** — Tesseract.js OCR, works completely offline

### ATS Scoring Engine — 15+ Systems

Researched rules for every major ATS currently used by employers:

| ATS | Market | Key rules enforced |
|-----|--------|-------------------|
| Taleo (Oracle) | Fortune 500 | Exact keyword match, DOCX only, paste-field critical |
| Workday | Enterprise | Section name matching, date format strict |
| Greenhouse | Tech startups | Human scorecard — readability over keywords |
| iCIMS | Global | Keyword density, single column required |
| Lever | Tech/startups | Semantic match, GitHub/portfolio links valued |
| SAP SuccessFactors | Enterprise | Chronological order, exact section names |
| Jobvite | Mid-market | Date format MM/YYYY, PDF preferred |
| ADP | SMB/Enterprise | Legacy parser, no special characters |
| BambooHR | SMB | Straightforward keyword match |
| SmartRecruiters | Global | AI-assisted, handles modern formats |
| Bullhorn | Staffing | Skills taxonomy match |
| JazzHR | SMB | Keyword frequency weighted |
| Rippling | Tech | LinkedIn integration, skills focused |
| Ashby | Dev startups | GitHub links, projects section valued |
| Workable | Global SMB | Multilingual, standard sections |

### 6-Dimension Scoring

```
Total Score =
  Keyword Match        (30%) ← JD keywords found in your resume
  ATS Format           (25%) ← No tables, columns, images, bad fonts
  Section Completeness (20%) ← Right sections with correct names
  Achievement Quality  (15%) ← Quantified bullets, strong action verbs
  Contact & Meta        (5%) ← Email, phone, LinkedIn, location
  Length & Density      (5%) ← Word count right for your experience level
```

Each dimension drills down into specific fixable items. Every item has an explanation and, where possible, a one-click auto-fix.

### Resume Editor
- Section-by-section editing: Contact, Summary, Experience, Education, Skills
- Missing JD keywords shown as clickable chips — add to skills in one click
- Live score ring updates 800ms after any edit
- Bullet-level editing with quantification prompts

### Export Formats
- **DOCX (recommended)** — universally parseable, preferred by Taleo/Workday/ADP
- **PDF (ATS-safe)** — single column, Arial font, no images
- **HTML** — for personal websites and portfolios
- **Markdown** — for GitHub profiles and dev portfolios

### Privacy First
- Everything runs in your browser — no backend, no server, no database
- Your resume is never transmitted anywhere
- API keys (if used for Pro features) stored only in your browser's localStorage
- Works fully offline after first load

### PWA — Installable on Any Device
- Install on Android home screen, iOS Safari, Windows, macOS
- Fully functional without internet once installed
- All parsing and scoring works offline

### Pro Features (Optional — Free API Keys Available)
Paste your own API key to unlock AI-powered rewrites:
- **Groq** (free tier: 30 req/min) — fastest
- **OpenAI GPT-4o**
- **Anthropic Claude**

Unlocks: AI bullet rewrites, professional summary generation, cover letter drafting. Core scoring is identical without any key.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 + TypeScript | SSG, App Router, PWA-ready |
| Styling | Tailwind CSS v4 | Zero-runtime, responsive |
| Resume Parsers | pdfjs-dist, mammoth, Tesseract.js | All run in browser |
| ATS Engine | Custom TF-IDF + rules DB | No external API needed |
| Editor | Section-aware React components | Live score integration |
| Storage | IndexedDB (idb) | Offline persistence |
| Exports | html2pdf.js, docx, turndown | Client-side generation |
| Deployment | Vercel (free tier) | Auto-deploy on push |
| CI | GitHub Actions | Type-check + lint + build |

---

## Getting Started

### Deploy to Vercel (Recommended — Free, 1 Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abdash1994/ats-resume-optimizer)

### Run Locally

```bash
git clone https://github.com/abdash1994/ats-resume-optimizer
cd ats-resume-optimizer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## How to Get a 90%+ Score

1. **Use the full job description** — paste everything: responsibilities, requirements, nice-to-haves, about the company. More text = better keyword extraction.

2. **Fill every section** — Contact (with LinkedIn), Summary, Experience (with bullets), Education, Skills. Missing sections cost 15-25 points each.

3. **Quantify your bullets** — "Led team" → "Led 6-person team that shipped 3 features, reducing churn by 18%". Numbers are detected and scored.

4. **Add missing keywords to skills** — the yellow chips under the Skills editor are required JD keywords not found in your resume. Add them.

5. **Export as DOCX** — research confirms DOCX is universally the safest format. Taleo has a 41% parse error rate on complex PDFs.

6. **For Taleo applications** — always fill in the paste-text field in the application form. Taleo often runs keyword matching against that field, not the uploaded file.

---

## Project Structure

```
ats-resume-optimizer/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # PWA shell, metadata, offline banner
│   ├── page.tsx            # Landing page + upload wizard
│   └── resume/page.tsx     # Main 3-panel workspace
├── components/
│   ├── ATSScorePanel/      # Score ring, dimension breakdown, per-ATS view
│   ├── ExportPanel/        # Format selector + download
│   ├── JDAnalyzer/         # JD input, role/level detection
│   ├── OptimizationSuggestions/ # Ranked fixes with auto-apply
│   ├── ProKeyInput/        # Optional AI API key management
│   ├── PWAInit.tsx         # Service worker + install prompt
│   ├── ResumeEditor/       # Section-aware resume editor
│   ├── ResumeUploader/     # Drag-and-drop, format detection
│   └── ui/                 # Button, Card, Badge, Progress, Tabs...
├── data/
│   ├── ats-rules.json      # Rules for 15+ ATS systems
│   ├── role-keywords.json  # Keywords by role × experience level
│   ├── action-verbs.json   # Strong verbs by category and level
│   └── section-names.json  # ATS-canonical section name mappings
├── lib/
│   ├── ats-engine/         # Scorer, keyword matcher, TF-IDF
│   ├── exporters/          # PDF, DOCX, HTML, Markdown generators
│   ├── jd-analyzer/        # JD keyword extraction + role detection
│   ├── parsers/            # PDF, DOCX, HTML, MD, Image parsers
│   ├── resume-optimizer/   # Suggestion engine
│   └── storage/            # IndexedDB persistence
└── types/
    └── resume.ts           # Full TypeScript type definitions
```

---

## License

MIT — use it, fork it, build on it.

---

## Contributing

PRs welcome. Key areas to contribute:
- Additional ATS system rules (research-backed)
- More role keyword databases
- Improved OCR post-processing for image resumes
- Cover letter generator
- LinkedIn profile optimizer
